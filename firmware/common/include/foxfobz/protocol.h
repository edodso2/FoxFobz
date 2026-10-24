/* Fox Fobz BLE protocol — shared by firmware/receiver and firmware/fob.
 *
 * Single source of truth for on-air values. Spec: docs/protocol/ble-protocol.md.
 * The app mirrors these in app/lib/constants/ble_constants.dart; any change
 * here must be made there too, and bumps the protocol/vN tag if breaking.
 */
#ifndef FOXFOBZ_PROTOCOL_H_
#define FOXFOBZ_PROTOCOL_H_

#include <zephyr/bluetooth/uuid.h>

/* Command bytes — same values over GATT (app) and fob broadcast */
#define CMD_UNLOCK 0x01
#define CMD_LOCK   0x02

/* App -> receiver GATT command service */
#define CMD_SERVICE_UUID_VAL \
    BT_UUID_128_ENCODE(0x46F00001, 0x4200, 0x4C45, 0x9876, 0xABCDEF000000)
#define CMD_CHAR_UUID_VAL \
    BT_UUID_128_ENCODE(0x46F00002, 0x4200, 0x4C45, 0x9876, 0xABCDEF000000)

/* Fob broadcast packet (manufacturer-specific advertising data)
 *
 *   [0..1] company ID 0xFFFF (LE)   [2..3] magic "FX"   [4] version
 *   [5]    command byte             [6..7] press counter (LE)
 */
#define FOB_COMPANY_ID    0xFFFF  /* Bluetooth SIG ID reserved for testing */
#define FOB_MAGIC_0       'F'
#define FOB_MAGIC_1       'X'
#define FOB_PROTO_VERSION 0x01

#define FOB_MFG_CMD_IDX     5
#define FOB_MFG_COUNTER_IDX 6
#define FOB_MFG_LEN         8

#endif /* FOXFOBZ_PROTOCOL_H_ */
