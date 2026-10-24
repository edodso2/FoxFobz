# Fox Fobz Firmware

Zephyr / nRF Connect SDK firmware for both boards.

| App | Module | SoC | Dev board target | Role |
|---|---|---|---|---|
| [receiver/](receiver/) | Raytac MDBT50Q-1MV2 | nRF52840 | `raytac_mdbt50q_db_40/nrf52840` (MDBT50Q-DB-40) | GATT peripheral for the app + passive scanner for fob broadcasts; drives DRV8873 door motors |
| [fob/](fob/) | Raytac MDBT42TV-PAT | nRF52805 | `nrf52dk/nrf52805` + overlay (MDBT42T-DB) | Non-connectable advertiser, one burst per button press |

Shared code lives in [common/](common/): `include/foxfobz/protocol.h` (command bytes, UUIDs, fob packet layout) and `foxfobz.cmake` (include path + build id). The protocol spec is [docs/protocol/ble-protocol.md](../docs/protocol/ble-protocol.md).

## Everyday use

```bash
firmware/scripts/build.sh receiver     # -> firmware/receiver/build/zephyr/zephyr.hex
firmware/scripts/flash.sh receiver     # J-Link SWD @ 500 kHz, erase + load + run

firmware/scripts/build.sh fob
firmware/scripts/flash.sh fob
```

`build.sh <app> <board>` overrides the board target (for the custom PCBs later).

> The dev boards need SWD at **500 kHz**. Higher speeds throw odd errors.

Programmer: nRF52840-DK used as an external J-Link (SEGGER J-Link V9.24a), connected by IDC cable. Both dev boards use the same programmer.

### Manual flashing (what flash.sh does)

```bash
JLinkExe -device nRF52840_xxAA -if SWD -speed 500 -autoconnect 1   # fob: nRF52805_xxAA
```
```
erase
loadfile <repo>/firmware/receiver/build/zephyr/zephyr.hex
r
g
exit
```

### Verify

1. Open **nRF Connect** on iPhone → **Scanner** → pull to refresh.
2. **"FoxFobz Receiver"** appears in the list.
3. RTT/console shows the boot banner: `FoxFobz receiver fw 0.1.0 (build v0.1.0-2-g…)`.

## Versioning

- Each app has a Zephyr [`VERSION`](receiver/VERSION) file (semver; `APP_VERSION_STRING`, later the MCUboot image version).
- Releases are tagged `receiver-fw/vX.Y.Z` / `fob-fw/vX.Y.Z` — tag when a build goes onto a car for testing or ships.
- The boot banner prints VERSION plus `git describe` against that app's tags only, so any board can tell you exactly what it's running (`-dirty` = uncommitted changes).
- Changing anything in `protocol.h` that breaks on-air compatibility: bump `FOB_PROTO_VERSION`, update the spec + app constants, tag `protocol/vN`, and record it in [docs/compatibility.md](../docs/compatibility.md).

## One-time Mac setup (NCS v2.7.0)

Tested on macOS Sequoia, Apple Silicon.

```bash
brew install cmake ninja gperf python3 ccache dfu-util dtc wget
pip3 install west
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# nRF Connect SDK workspace (~5–10 GB, 20–40 min)
mkdir ~/ncs && cd ~/ncs
west init -m https://github.com/nrfconnect/sdk-nrf --mr v2.7.0
west update
python3 -m venv venv && source ~/ncs/venv/bin/activate
pip install -r zephyr/scripts/requirements.txt -r nrf/scripts/requirements.txt
west zephyr-export
```

Zephyr toolchain: download `zephyr-sdk-0.16.8_macos-aarch64.tar.xz` from
https://github.com/zephyrproject-rtos/sdk-ng/releases/tag/v0.16.8, then:

```bash
tar xf zephyr-sdk-0.16.8_macos-aarch64.tar.xz && mv zephyr-sdk-0.16.8 ~/zephyr-sdk
cd ~/zephyr-sdk && ./setup.sh
sudo xattr -dr com.apple.quarantine ~/ncs ~/zephyr-sdk   # stop Gatekeeper blocking tools
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `west` not found | Add `~/.local/bin` to PATH, re-run `source ~/.zshrc` |
| `ZEPHYR_BASE not set` | Use `scripts/build.sh`, or `export ZEPHYR_BASE=~/ncs/zephyr` |
| Gatekeeper blocking tools | `xattr -dr com.apple.quarantine ~/ncs ~/zephyr-sdk` |
| CMake "unable to build dummy C file" / cache error | `rm -rf ~/Library/Caches/zephyr` and delete the app's `build/` |
| `build.ninja` not found | Delete the app's `build/` and rebuild |
| J-Link "can not connect" | Check VTref is powered; confirm SWDIO/SWDCLK aren't swapped; speed 500 |
| Name not visible in scanner | Pull to refresh in nRF Connect |

## Later

- `boards/foxfobz/`: out-of-tree Zephyr boards for the custom PCBs (`foxfobz_receiver` with board revisions `A`, `B`…, `foxfobz_fob`), so one tree can target dev boards and every PCB revision.
- Production items (deep sleep, MCUboot signing, challenge-response, provisioning, APPROTECT): see [docs/product/phases/phase-4-firmware-finalization.md](../docs/product/phases/phase-4-firmware-finalization.md).
