#!/usr/bin/env bash
# Flash a built Fox Fobz firmware app over SWD with J-Link.
#
#   firmware/scripts/flash.sh receiver
#   firmware/scripts/flash.sh fob
#
# The dev boards need SWD at 500 kHz — higher speeds throw odd errors.
set -euo pipefail

APP="${1:?usage: flash.sh receiver|fob}"
case "$APP" in
  receiver) DEVICE="nRF52840_xxAA" ;;
  fob)      DEVICE="nRF52805_xxAA" ;;
  *) echo "unknown app: $APP (expected receiver|fob)" >&2; exit 1 ;;
esac

FW_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HEX="$FW_DIR/$APP/build/zephyr/zephyr.hex"
[ -f "$HEX" ] || { echo "no build found at $HEX — run scripts/build.sh $APP first" >&2; exit 1; }

SCRIPT="$(mktemp -t foxfobz-jlink)"
trap 'rm -f "$SCRIPT"' EXIT
printf 'erase\nloadfile %s\nr\ng\nexit\n' "$HEX" > "$SCRIPT"

JLinkExe -device "$DEVICE" -if SWD -speed 500 -autoconnect 1 -CommanderScript "$SCRIPT"
