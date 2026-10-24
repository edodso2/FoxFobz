## Flash

> NOTE: the dev boards requires slow speed of 500. Higher speeds throw odd errors.

```bash
JLinkExe -device nRF52805_xxAA -if SWD -speed 500 -autoconnect 1
```

At the `J-Link>` prompt:
```
erase
loadfile /Users/ericdodson/Development/FoxFobz/fob_firmware/build/zephyr/zephyr.hex
r
g
exit
```