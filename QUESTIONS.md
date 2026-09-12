# Questions for Andy

Nothing open right now.

## Resolved

**1.5 — wing default for an unassigned room's tank (asked 9/12, answered same day).**
Andy: tank assignment is a weekly valve choice, not a property of the
wing — this week tank A feeds A1, A2, A5, A6 and C1, C2, C3; tank B feeds
B1, B2, B3, B5, B6 and C4, C5, C6; tank C feeds B4; A7 is on water. A
wing default would have put six C rooms on the wrong tank. Fixed: the
wing-letter fallback is gone from `feedEcFor`/`tankFor` (pure.js); the
actual assignment is seeded in rooms.js as `TANK`, and a room absent from
it (A3, A4 this week) reads "no tank assigned" and the dilution CHECK
does not run for it. Also removed on the same pass, per his note that
there is no room-level EC left to preserve: `applyRoomCfg` no longer
writes a typed override back into room config — it applied to every
sweep of that room forever, which was the same mistake in a different
shape.
