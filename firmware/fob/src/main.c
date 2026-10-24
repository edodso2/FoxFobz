#include <errno.h>
#include <stdbool.h>
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/sys/byteorder.h>
#include <zephyr/bluetooth/bluetooth.h>

/* Packet layout and command bytes: firmware/common/include/foxfobz/protocol.h */
#include <foxfobz/protocol.h>

/* Each press is broadcast for ADV_BURST_MS at a 20-30ms interval, so the
 * receiver sees it many times; it de-dupes on the press counter. */
#define ADV_BURST_MS     500
#define ADV_INTERVAL_MIN 0x0020  /* 20ms (units of 0.625ms) */
#define ADV_INTERVAL_MAX 0x0030  /* 30ms */

#define DEBOUNCE_MS 20

/* Non-connectable, using the chip's fixed identity address so the receiver
 * can tell fobs apart. */
#define FOB_ADV_PARAM \
    BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, ADV_INTERVAL_MIN, ADV_INTERVAL_MAX, NULL)

static uint8_t mfg_data[FOB_MFG_LEN] = {
    FOB_COMPANY_ID & 0xFF, FOB_COMPANY_ID >> 8,
    FOB_MAGIC_0, FOB_MAGIC_1,
    FOB_PROTO_VERSION,
    0x00,       /* command, filled in per press */
    0x00, 0x00, /* press counter, filled in per press */
};

static const struct bt_data ad[] = {
    BT_DATA_BYTES(BT_DATA_FLAGS, BT_LE_AD_NO_BREDR),
    BT_DATA(BT_DATA_MANUFACTURER_DATA, mfg_data, sizeof(mfg_data)),
};

static uint16_t press_counter;
static bool advertising;
static struct k_work_delayable adv_stop_work;

struct fob_button {
    struct gpio_dt_spec spec;
    uint8_t cmd;
    struct gpio_callback cb;
    struct k_work_delayable debounce_work;
};

/* Pins come from boards/nrf52dk_nrf52805.overlay. To add buttons 3/4, add
 * entries for button2/button3 here with their command bytes. */
static struct fob_button buttons[] = {
    { .spec = GPIO_DT_SPEC_GET(DT_NODELABEL(button0), gpios), .cmd = CMD_UNLOCK },
    { .spec = GPIO_DT_SPEC_GET(DT_NODELABEL(button1), gpios), .cmd = CMD_LOCK },
};

static void adv_stop_fn(struct k_work *w)
{
    int err = bt_le_adv_stop();
    if (err) {
        printk("Advertising failed to stop (err %d)\n", err);
    }
    advertising = false;
}

/* Runs on the system workqueue (from debounce work), same as adv_stop_fn,
 * so no locking is needed around advertising state. */
static void send_command(uint8_t cmd)
{
    int err;

    press_counter++;
    mfg_data[FOB_MFG_CMD_IDX] = cmd;
    sys_put_le16(press_counter, &mfg_data[FOB_MFG_COUNTER_IDX]);

    /* A press during an ongoing burst just swaps in the new payload and
     * extends the burst. */
    if (advertising) {
        err = bt_le_adv_update_data(ad, ARRAY_SIZE(ad), NULL, 0);
    } else {
        err = bt_le_adv_start(FOB_ADV_PARAM, ad, ARRAY_SIZE(ad), NULL, 0);
    }
    if (err) {
        printk("Failed to broadcast command 0x%02x (err %d)\n", cmd, err);
        return;
    }

    advertising = true;
    k_work_reschedule(&adv_stop_work, K_MSEC(ADV_BURST_MS));
    printk("Sent command 0x%02x (press #%u)\n", cmd, press_counter);
}

static void debounce_fn(struct k_work *w)
{
    struct k_work_delayable *dwork = k_work_delayable_from_work(w);
    struct fob_button *b = CONTAINER_OF(dwork, struct fob_button, debounce_work);

    /* Only fire if still held once the contacts have settled; this also
     * filters out bounce on release. */
    if (gpio_pin_get_dt(&b->spec) == 1) {
        send_command(b->cmd);
    }
}

static void button_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
    struct fob_button *b = CONTAINER_OF(cb, struct fob_button, cb);

    k_work_reschedule(&b->debounce_work, K_MSEC(DEBOUNCE_MS));
}

static int button_init(struct fob_button *b)
{
    int err;

    if (!gpio_is_ready_dt(&b->spec)) {
        return -ENODEV;
    }

    err = gpio_pin_configure_dt(&b->spec, GPIO_INPUT);
    if (err) {
        return err;
    }

    err = gpio_pin_interrupt_configure_dt(&b->spec, GPIO_INT_EDGE_TO_ACTIVE);
    if (err) {
        return err;
    }

    k_work_init_delayable(&b->debounce_work, debounce_fn);
    gpio_init_callback(&b->cb, button_pressed, BIT(b->spec.pin));
    return gpio_add_callback_dt(&b->spec, &b->cb);
}

int main(void)
{
    int err;

    k_work_init_delayable(&adv_stop_work, adv_stop_fn);

    err = bt_enable(NULL);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return err;
    }

    for (int i = 0; i < ARRAY_SIZE(buttons); i++) {
        err = button_init(&buttons[i]);
        if (err) {
            printk("Button %d init failed (err %d)\n", i, err);
            return err;
        }
    }

    printk("FoxFobz fob ready (%d buttons)\n", ARRAY_SIZE(buttons));
    return 0;
}
