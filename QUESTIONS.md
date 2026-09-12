# Questions for Andy

**2.2's real reconciliation found a live bug: P2 has never contributed to
hours-since-shot.** Fixed the half that was a clear bug — `schedPhaseOn`
required a P2 start time that Growlink's own Copilot screens never print
(confirmed against the real 9/11 fixtures), so a live P2 was silently read
as parked everywhere: the diff, the change log, the verification screen.
That's fixed now. But P2's *own* first-shot clock time — the thing
`shotTimes` needs to fold it into hours-since-shot, the inverted-profile
check, and everything else gated on that number — isn't printed anywhere
either, and I don't know Copilot's triggering rule for it (a fixed offset
from P1's last shot? a clock time the screen just doesn't show? something
threshold-triggered?). Guessing it would put an invented time into the
one number the inverted-profile warning depends on, which is exactly
backwards from what this weekend has been correcting. So: hours-since-shot
still reflects P1 only, same as it always effectively did — now a flagged
gap instead of a silent one (`schedSeries` in pure.js). What actually
decides when P2 starts?

**One remaining assumption, testable only with live account access, not
guessable further from here:**

- **A device's own `name` is the zone label from the 3.5 paste ("B-1"),
  not the numeric id printed in front of it in that paste
  ("#20003605").** That number is what Growlink's device list export
  shows next to the name, not the GUID `device.id` the API actually
  needs — there's no way to skip the name match and go straight to an
  id. Used by 3.2 to turn a zoned table into the device whose log to
  read. `matchDeviceForZone` fails by name, not silently, if it's wrong;
  the synthetic A7 fixture (`fixtures/9-11/*_SYNTHETIC.json`, see
  `WINDOW_REPORT.md`) is built against the documented log shape either
  way and doesn't depend on this guess.

## Resolved

**Window 3 — the whole Growlink API surface (asked 9/12, answered same day
with `docs/Growlink_Skill.md`).** Base URL
`https://api.developer.growlink.com`, `Gl-Api-Key` header (not Bearer —
the original guess), five `Uom-*` unit headers, `/api/v2/organizations`
for the connection test, org id `50917046-71ba-4cb3-82e5-5c171db8e6c2`
(Vireo Health NY, discovered dynamically rather than hardcoded).
`activeRun` (`currentDayNo`, `totalNoOfDays`, `currentGrowthStage` — 1
Veg, 2 Early, 3 Mid, 4 Late) turned out to be a field on the room object
from the rooms listing itself, not a separate endpoint as the plan
assumed — `fetchActiveRun` reads it off `growlinkRooms()` now. Growlink
names a room "A-1" where Stab says "A1" — `growlinkApiRoomName`
transforms before every room lookup, and matches by exact equality
specifically because the org also carries legacy rooms ("A2 substrate",
"A7, Veg B, C, Dry A, B, and Cure C") that must never match by accident.
Batch Tank sensors live in a specific CFS room
(`1101903f-b6d5-43e7-b0e7-2617a6bd9d61`), not discovered by a RoomType
guess as first built — that guesswork is gone, not layered under the
real id. Response keys can arrive PascalCase or camelCase per the guide's
own §2.2 — `normalizeKeys` runs on every response now, recursively,
rather than trusting camelCase everywhere.

**Window 3, 3.3 — Batch Tank # → letter map (asked 9/12, answered same day
by growlink_room_export.csv).** Not answered by Andy directly — confirmed
by running `tankFillByDay` on each of the five real Batch Tank columns in
the export for 9/9–9/11 and matching against the plan's own accept
criterion (A ≈ 31/day, C ≈ 25 with a 0 on the flush day, B ≈ 24, Veg ≈
18): #1 alone reproduces 32.0/31.2/31.0, #3 alone reproduces
25.9/0.0/24.8 (the flush-day dip lands on exactly the right day), #2 is
what's left for B (54.6/23.5/25.5 — the high 9/9 reading is a real second
fill, not a mismatch), and #5 needs no inference at all — its own sensor
name is "Batch Tank #5 (veg)". #4 has no fill-valve sensor and sits flat
at 0 across the same window, unused by any of Stab's four tanks. Seeded
as `BATCH_TANK_NUM` in pure.js, wired into 3.3's live fetch.

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
