# 0004 — Fob sends non-connectable broadcasts

**Context.** The v2 plan had the fob as a connectable peripheral sending a GATT Notify. The working fob firmware instead advertises a burst on each press, and the receiver passively scans.

**Decision.** On each press the fob sends `ADV_NONCONN_IND` with an 8-byte manufacturer-data packet (~500 ms burst, 20–30 ms interval). The receiver de-dupes on fob address + press counter. Spec: [ble-protocol.md](../protocol/ble-protocol.md).

**Consequences.**
- No connection setup latency. The fob gets no delivery confirmation.
- **Currently unauthenticated and replayable.** The intended hardening is a rolling counter + AES-CCM MAC (hardware on the nRF52805). This must be done before M5 sign-off, and it changes the protocol version.
- *Why broadcast won over Notify (power? latency? simplicity?) wasn't written down. Add it.*
