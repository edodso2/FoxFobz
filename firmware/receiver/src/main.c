#include <errno.h>
#include <stdbool.h>
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/drivers/pwm.h>
#include <zephyr/sys/byteorder.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/uuid.h>
#include <zephyr/bluetooth/gatt.h>

#define DEVICE_NAME     CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)

/* GPIO pins — one set per side (driver/passenger). Both sides are driven
 * off the same PWM1 peripheral, one channel/pin each, so they ramp
 * independently even though (for now) both are triggered by the same
 * command. These match the prod board's pin assignment even though we're
 * bringing this up on the test board for now. See the door[] table in
 * main() for how these map to gpio0 + PWM channel. */
#define DOOR_DRIVER_POWER_PIN 4   /* P0.04 — nSLEEP, shared with passenger side; HIGH at boot, briefly pulsed low after each run to clear faults */
#define DOOR_DRIVER_RUN_PIN   19  /* P0.19 — EN/IN1, PWM1 ch0; ramps 0->100% duty over MOTOR_RAMP_TIME_MS on any command */
#define DOOR_DRIVER_DIR_PIN   20  /* P0.20 — PH/IN2; HIGH for unlock (0x01), LOW for lock (0x02) */

#define DOOR_PASSENGER_POWER_PIN 4   /* P0.04 — nSLEEP, shared with driver side */
#define DOOR_PASSENGER_RUN_PIN   21  /* P0.21 — EN/IN1, PWM1 ch1 */
#define DOOR_PASSENGER_DIR_PIN   22  /* P0.22 — PH/IN2 */

#define DOOR_COUNT 2

/* Hardwired unlock input: pulling P1.06 to GND unlocks both doors, same as
 * an unlock command from the app or a fob. Internal pull-up holds it HIGH
 * when idle. */
#define UNLOCK_INPUT_PIN   6   /* P1.06 */
#define UNLOCK_DEBOUNCE_MS 50

/* Soft-start ramp: avoids inrush current slamming the DC motor to full speed */
#define MOTOR_PWM_PERIOD_NS 50000  /* 20 kHz */
#define MOTOR_RAMP_STEP_MS  5

/* 100ms ramp + 1500ms hold at full duty = 1600ms total run time */
#define MOTOR_RAMP_TIME_MS  100
#define MOTOR_RUN_HOLD_MS   1500
#define MOTOR_RUN_TOTAL_MS  (MOTOR_RAMP_TIME_MS + MOTOR_RUN_HOLD_MS)

#define MOTOR_RAMP_STEPS    (MOTOR_RAMP_TIME_MS / MOTOR_RAMP_STEP_MS)

static const struct device *gpio0;
static const struct device *pwm_motor;

struct door {
    const struct device *gpio;
    int power_pin;
    int dir_pin;
    uint32_t pwm_channel;
    int ramp_step;
    struct k_work_delayable ramp_work;
    struct k_work_delayable run_off_work;
};

static struct door doors[DOOR_COUNT];

static void motor_ramp_fn(struct k_work *w)
{
    struct k_work_delayable *dwork = k_work_delayable_from_work(w);
    struct door *d = CONTAINER_OF(dwork, struct door, ramp_work);

    d->ramp_step++;
    uint32_t pulse_ns = (uint64_t)MOTOR_PWM_PERIOD_NS * d->ramp_step / MOTOR_RAMP_STEPS;
    pwm_set(pwm_motor, d->pwm_channel, MOTOR_PWM_PERIOD_NS, pulse_ns, PWM_POLARITY_NORMAL);

    if (d->ramp_step < MOTOR_RAMP_STEPS) {
        k_work_reschedule(dwork, K_MSEC(MOTOR_RAMP_STEP_MS));
    }
}

static void motor_run_off_fn(struct k_work *w)
{
    struct k_work_delayable *dwork = k_work_delayable_from_work(w);
    struct door *d = CONTAINER_OF(dwork, struct door, run_off_work);

    k_work_cancel_delayable(&d->ramp_work);
    pwm_set(pwm_motor, d->pwm_channel, MOTOR_PWM_PERIOD_NS, 0, PWM_POLARITY_NORMAL);

    /* Clear any latched fault (e.g. OCP from hitting a hard stop)
     * by cycling nSLEEP low then high. >50us puts it through a
     * full sleep/wake, which clears all faults by default. */
    gpio_pin_set(d->gpio, d->power_pin, 0);
    k_busy_wait(100); /* 100us low pulse */
    gpio_pin_set(d->gpio, d->power_pin, 1);
}

/* Drives one door's motor: sets direction, then kicks off the ramp and
 * the delayed run-off. Called for every door on each command today; once
 * commands carry a door id, call this for just the targeted door. */
static void door_drive(struct door *d, bool unlock)
{
    gpio_pin_set(d->gpio, d->dir_pin, unlock ? 1 : 0);
    d->ramp_step = 0;
    k_work_reschedule(&d->ramp_work, K_NO_WAIT);
    k_work_reschedule(&d->run_off_work, K_MSEC(MOTOR_RUN_TOTAL_MS));
}

/* Command bytes — must match Flutter BleConstants and the fob firmware */
#define CMD_UNLOCK 0x01
#define CMD_LOCK   0x02

/* Single entry point for lock/unlock, whether it came from the app (GATT
 * write) or a fob (broadcast). Returns -EINVAL for unknown commands. */
static int handle_command(uint8_t cmd)
{
    switch (cmd) {
    case CMD_UNLOCK:
        printk("Unlock command received\n");
        for (int i = 0; i < DOOR_COUNT; i++) {
            door_drive(&doors[i], true);
        }
        return 0;
    case CMD_LOCK:
        printk("Lock command received\n");
        for (int i = 0; i < DOOR_COUNT; i++) {
            door_drive(&doors[i], false);
        }
        return 0;
    default:
        return -EINVAL;
    }
}

static const struct device *gpio1;
static struct gpio_callback unlock_input_cb;
static struct k_work_delayable unlock_input_work;

/* Runs UNLOCK_DEBOUNCE_MS after a falling edge; only unlocks if the pin is
 * still held LOW, so contact bounce and noise spikes are ignored. */
static void unlock_input_fn(struct k_work *w)
{
    if (gpio_pin_get(gpio1, UNLOCK_INPUT_PIN) == 0) {
        printk("Unlock input (P1.06) pulled to GND\n");
        handle_command(CMD_UNLOCK);
    }
}

static void unlock_input_isr(const struct device *dev, struct gpio_callback *cb,
                             gpio_port_pins_t pins)
{
    k_work_reschedule(&unlock_input_work, K_MSEC(UNLOCK_DEBOUNCE_MS));
}

/* UUIDs — must match Flutter BleConstants */
#define CMD_SERVICE_UUID_VAL \
    BT_UUID_128_ENCODE(0x46F00001, 0x4200, 0x4C45, 0x9876, 0xABCDEF000000)
#define CMD_CHAR_UUID_VAL \
    BT_UUID_128_ENCODE(0x46F00002, 0x4200, 0x4C45, 0x9876, 0xABCDEF000000)

#define CMD_SERVICE_UUID BT_UUID_DECLARE_128(CMD_SERVICE_UUID_VAL)
#define CMD_CHAR_UUID    BT_UUID_DECLARE_128(CMD_CHAR_UUID_VAL)

/* GATT write handler */
static ssize_t write_command(struct bt_conn *conn, const struct bt_gatt_attr *attr,
                              const void *buf, uint16_t len, uint16_t offset, uint8_t flags)
{
    if (len < 1) {
        return BT_GATT_ERR(BT_ATT_ERR_INVALID_ATTRIBUTE_LEN);
    }

    const uint8_t cmd = ((const uint8_t *)buf)[0];

    if (handle_command(cmd)) {
        return BT_GATT_ERR(BT_ATT_ERR_VALUE_NOT_ALLOWED);
    }

    return len;
}

/* GATT service */
BT_GATT_SERVICE_DEFINE(cmd_svc,
    BT_GATT_PRIMARY_SERVICE(CMD_SERVICE_UUID),
    BT_GATT_CHARACTERISTIC(CMD_CHAR_UUID,
        BT_GATT_CHRC_WRITE,
        BT_GATT_PERM_WRITE,
        NULL, write_command, NULL),
);

/* Advertising data */
static const struct bt_data ad[] = {
    BT_DATA_BYTES(BT_DATA_FLAGS, BT_LE_AD_GENERAL | BT_LE_AD_NO_BREDR),
    BT_DATA(BT_DATA_NAME_COMPLETE, DEVICE_NAME, DEVICE_NAME_LEN),
};

/* Scan response: 128-bit service UUID so the app can filter on scan */
static const struct bt_data sd[] = {
    BT_DATA_BYTES(BT_DATA_UUID128_ALL, CMD_SERVICE_UUID_VAL),
};

static void start_advertising(void)
{
    int err = bt_le_adv_start(BT_LE_ADV_CONN, ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
    if (err) {
        printk("Advertising failed to start (err %d)\n", err);
    } else {
        printk("Advertising as: %s\n", DEVICE_NAME);
    }
}

/* Connection callbacks */
static void connected(struct bt_conn *conn, uint8_t err)
{
    if (err) {
        printk("Connection failed (err %d)\n", err);
        return;
    }
    printk("Connected\n");
}

static void disconnected(struct bt_conn *conn, uint8_t reason)
{
    printk("Disconnected (reason %d)\n", reason);
    start_advertising();
}

BT_CONN_CB_DEFINE(conn_callbacks) = {
    .connected    = connected,
    .disconnected = disconnected,
};

/* Fob broadcast packet (manufacturer-specific advertising data) — must match
 * fob_firmware/src/main.c and fob_hub/docs/ble-protocol.md.
 *
 *   [0..1] company ID 0xFFFF (LE)   [2..3] magic "FX"   [4] version
 *   [5]    command byte             [6..7] press counter (LE)
 */
#define FOB_COMPANY_ID    0xFFFF
#define FOB_MAGIC_0       'F'
#define FOB_MAGIC_1       'X'
#define FOB_PROTO_VERSION 0x01
#define FOB_MFG_LEN       8

/* A fob repeats each press for ~500ms; packets with the same counter from
 * the same fob within this window are the same press. */
#define FOB_DEDUPE_MS 2000
#define FOB_TRACK_MAX 4

struct fob_packet {
    bool valid;
    uint8_t cmd;
    uint16_t counter;
};

struct fob_seen {
    bool used;
    bt_addr_le_t addr;
    uint16_t counter;
    int64_t accepted_ms;
};

static struct fob_seen fobs_seen[FOB_TRACK_MAX];

static bool parse_fob_ad(struct bt_data *data, void *user_data)
{
    struct fob_packet *pkt = user_data;

    if (data->type != BT_DATA_MANUFACTURER_DATA || data->data_len < FOB_MFG_LEN) {
        return true; /* keep looking */
    }

    const uint8_t *d = data->data;

    if (sys_get_le16(&d[0]) != FOB_COMPANY_ID || d[2] != FOB_MAGIC_0 ||
        d[3] != FOB_MAGIC_1 || d[4] != FOB_PROTO_VERSION) {
        return true;
    }

    pkt->cmd = d[5];
    pkt->counter = sys_get_le16(&d[6]);
    pkt->valid = true;
    return false;
}

/* Returns true if this press was already handled; otherwise records it.
 * Tracks the last FOB_TRACK_MAX fobs, evicting the least recently used. */
static bool fob_is_duplicate(const bt_addr_le_t *addr, uint16_t counter)
{
    int64_t now = k_uptime_get();
    struct fob_seen *slot = NULL;

    for (int i = 0; i < FOB_TRACK_MAX; i++) {
        struct fob_seen *f = &fobs_seen[i];

        if (f->used && bt_addr_le_eq(&f->addr, addr)) {
            if (f->counter == counter && now - f->accepted_ms < FOB_DEDUPE_MS) {
                return true;
            }
            slot = f;
            break;
        }
        if (!slot || !f->used || (slot->used && f->accepted_ms < slot->accepted_ms)) {
            slot = f;
        }
    }

    slot->used = true;
    bt_addr_le_copy(&slot->addr, addr);
    slot->counter = counter;
    slot->accepted_ms = now;
    return false;
}

static void scan_cb(const bt_addr_le_t *addr, int8_t rssi, uint8_t adv_type,
                    struct net_buf_simple *buf)
{
    struct fob_packet pkt = { 0 };

    /* Fobs only send non-connectable advertisements */
    if (adv_type != BT_GAP_ADV_TYPE_ADV_NONCONN_IND) {
        return;
    }

    bt_data_parse(buf, parse_fob_ad, &pkt);
    if (!pkt.valid || fob_is_duplicate(addr, pkt.counter)) {
        return;
    }

    char addr_str[BT_ADDR_LE_STR_LEN];
    bt_addr_le_to_str(addr, addr_str, sizeof(addr_str));
    printk("Fob %s: cmd 0x%02x (press #%u, RSSI %d)\n", addr_str, pkt.cmd, pkt.counter, rssi);

    if (handle_command(pkt.cmd)) {
        printk("Unknown fob command 0x%02x\n", pkt.cmd);
    }
}

/* Passive scan, 100% duty (window == interval). Duplicate filtering is off
 * because each fob reuses its address for every press; we de-dupe on the
 * press counter instead. */
static const struct bt_le_scan_param scan_param = {
    .type     = BT_LE_SCAN_TYPE_PASSIVE,
    .options  = BT_LE_SCAN_OPT_NONE,
    .interval = BT_GAP_SCAN_FAST_INTERVAL_MIN,
    .window   = BT_GAP_SCAN_FAST_WINDOW,
};

int main(void)
{
    int err;

    /* GPIO setup */
    gpio0 = DEVICE_DT_GET(DT_NODELABEL(gpio0));

    doors[0] = (struct door){
        .gpio = gpio0, .power_pin = DOOR_DRIVER_POWER_PIN, .dir_pin = DOOR_DRIVER_DIR_PIN, .pwm_channel = 0,
    };
    doors[1] = (struct door){
        .gpio = gpio0, .power_pin = DOOR_PASSENGER_POWER_PIN, .dir_pin = DOOR_PASSENGER_DIR_PIN, .pwm_channel = 1,
    };

    /* DOOR_x_RUN_PIN is driven by the PWM1 peripheral, not plain GPIO */
    pwm_motor = DEVICE_DT_GET(DT_NODELABEL(pwm1));
    if (!device_is_ready(pwm_motor)) {
        printk("PWM device not ready\n");
        return -ENODEV;
    }

    for (int i = 0; i < DOOR_COUNT; i++) {
        struct door *d = &doors[i];

        gpio_pin_configure(d->gpio, d->power_pin, GPIO_OUTPUT_INACTIVE);
        gpio_pin_configure(d->gpio, d->dir_pin,   GPIO_OUTPUT_INACTIVE);

        /* Wake the motor driver breakout as soon as we boot */
        gpio_pin_set(d->gpio, d->power_pin, 1);

        k_work_init_delayable(&d->run_off_work, motor_run_off_fn);
        k_work_init_delayable(&d->ramp_work, motor_ramp_fn);
    }

    /* Unlock input on P1.06: active when pulled to GND */
    gpio1 = DEVICE_DT_GET(DT_NODELABEL(gpio1));
    if (!device_is_ready(gpio1)) {
        printk("GPIO1 device not ready\n");
        return -ENODEV;
    }

    k_work_init_delayable(&unlock_input_work, unlock_input_fn);
    gpio_pin_configure(gpio1, UNLOCK_INPUT_PIN, GPIO_INPUT | GPIO_PULL_UP);
    gpio_init_callback(&unlock_input_cb, unlock_input_isr, BIT(UNLOCK_INPUT_PIN));
    gpio_add_callback(gpio1, &unlock_input_cb);
    gpio_pin_interrupt_configure(gpio1, UNLOCK_INPUT_PIN, GPIO_INT_EDGE_FALLING);

    /* Bluetooth setup */
    err = bt_enable(NULL);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return err;
    }

    printk("Bluetooth initialized\n");
    start_advertising();

    /* Listen for fob broadcasts alongside advertising/connections for the app */
    err = bt_le_scan_start(&scan_param, scan_cb);
    if (err) {
        printk("Scanning failed to start (err %d)\n", err);
        return err;
    }
    printk("Listening for fobs\n");

    return 0;
}
