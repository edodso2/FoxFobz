#!/usr/bin/env bash
# Build a Fox Fobz firmware app.
#
#   firmware/scripts/build.sh receiver          # MDBT50Q-DB-40 dev board
#   firmware/scripts/build.sh fob               # MDBT42T-DB dev board (nrf52dk/nrf52805 + overlay)
#   firmware/scripts/build.sh receiver <board>  # override board target (e.g. a custom revA board later)
#
# Output: firmware/<app>/build/zephyr/zephyr.hex
# The boot banner shows VERSION plus `git describe` against this app's own tags
# (<app>-fw/vX.Y.Z), so you can tell exactly which release/commit is on a board
# (see common/foxfobz.cmake).
set -euo pipefail

APP="${1:?usage: build.sh receiver|fob [board]}"
case "$APP" in
  receiver) DEFAULT_BOARD="raytac_mdbt50q_db_40/nrf52840" ;;
  fob)      DEFAULT_BOARD="nrf52dk/nrf52805" ;;
  *) echo "unknown app: $APP (expected receiver|fob)" >&2; exit 1 ;;
esac
BOARD="${2:-$DEFAULT_BOARD}"

FW_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$FW_DIR/$APP"

# NCS v2.7.0 toolchain (see firmware/README.md for one-time setup)
source "$HOME/ncs/venv/bin/activate"
export ZEPHYR_BASE="${ZEPHYR_BASE:-$HOME/ncs/zephyr}"
export ZEPHYR_SDK_INSTALL_DIR="${ZEPHYR_SDK_INSTALL_DIR:-$HOME/zephyr-sdk}"

echo "Building $APP for $BOARD"
# --cmake re-runs configure so the git-describe build id is never stale
west build -p auto --cmake -b "$BOARD" -d "$APP_DIR/build" "$APP_DIR"
