# 0005 — No RSSI proximity auto-unlock

**Context.** Auto-unlock as the fob approaches was in the original feature list.

**Decision.** Removed. A car that's always listening and unlocks on proximity is open to relay attacks (the class of attack that broke phone-as-a-key systems). Every unlock needs a button press.

**Consequences.** We don't need distance-bounding RF. Source: [plan v2](../product/plan-v2.md), [plan v3](../product/plan-v3-draft.md).
