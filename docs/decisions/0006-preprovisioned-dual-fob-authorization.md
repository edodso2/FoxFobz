# 0006 — Ship pre-paired; adding/removing devices needs 2 fobs

**Decision.**
- Receiver and fobs are bonded at the factory: bond data is SWD-injected with a pogo-pin jig, then APPROTECT is enabled.
- Adding or revoking any device (phone or fob) needs **any 2 currently paired fobs** to long-press within 30 s. No device is a privileged owner.
- If fewer than 2 fobs remain, the unit goes back to the manufacturer for re-provisioning (RMA).
- Every command uses LESC bonding plus a per-command AES-128 challenge-response.

**Consequences.**
- A provisioning jig and production tooling are needed (open question).
- Check the nRF52840 silicon revision (Rev 2 has a published APPROTECT glitch bypass).
- Full detail: [plan v2 open questions](../product/plan-v2.md#open-questions--decisions), [phase 4](../product/phases/phase-4-firmware-finalization.md), [phase 3](../product/phases/phase-3-app-finalization.md).
