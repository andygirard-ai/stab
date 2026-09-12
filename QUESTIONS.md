# Questions for Andy

**Open, marked legacy (asked 9/12) — what decides when P2 starts?**
2.2's real reconciliation found a live bug: P2 has never contributed to
hours-since-shot. Fixed the half that was a clear bug — `schedPhaseOn`
required a P2 start time that Growlink's own Copilot screens never print
(confirmed against the real 9/11 fixtures), so a live P2 was silently read
as parked everywhere: the diff, the change log, the verification screen.
That's fixed now. But P2's *own* first-shot clock time — the thing
`shotTimes` needs to fold it into hours-since-shot, the inverted-profile
check, and everything else gated on that number — isn't printed anywhere
either, and Copilot's triggering rule for it was never confirmed.
**Andy, 9/12: leave it open — every Copilot room converts to Simple Timer
on 9/16, after which P2 stops existing, so the triggering rule isn't
worth chasing down for a control type this app will stop seeing in days.**
Left exactly as it was: hours-since-shot still reflects P1 only, a
flagged gap in `schedSeries` (pure.js), not resolved and not going to be.

**Open (asked 9/12) — Batch/Stock Tank level sensors missing from the live
discovery pass.** The Growlink Integration Plan's own §1.3 text describes
CFS's solution sensors as including `Batch Tank #1/#2/#3/#5 (veg)`
levels and `Stock Tank #1–7`, and `growlink_room_export.csv` (real
export, confirmed earlier) carries exactly those columns. But the real
9/9 discovery run in `fixtures/growlink/api_list.txt` (`== Fertigation
and solution sensors ==`, lines 1492–1506) returns only twelve rows for
CFS — two Temperature, four pH, three EC/TDS, three Flow Rate — no Batch
or Stock Tank entries at all, from the same `GET room/{id}/sensors` call
this window's discovery button now uses for that section. Both facts are
real: the CSV export and the room-scoped sensors call may simply be two
different views of the account (the CSV possibly enumerating sensors
tied to devices rather than the room, or a query the discovery script
didn't run), and this is not something the repo can settle on its own.
**Assumed for now:** Window 3's existing `growlinkTankSensor`/
`fetchTankFill` (hardcoded to `GROWLINK_CFS_ROOM_ID` and
`BATCH_TANK_NUM`, confirmed working and Andy-approved) stays completely
untouched; §1's new discovery simply stores and displays whatever CFS's
live `/sensors` call actually returns, with no attempt to reconcile the
two or treat the smaller list as evidence the tank sensors don't exist.
**If this is wrong:** the two features silently diverge — Window 3's
tank fill keeps working off the hardcoded name match while §1's
discovery display never shows a Batch/Stock Tank line — and nothing in
the app currently flags that split for the operator to notice.

## Resolved

**Growlink Integration Plan §0 — matching a device to a table, second
correction (asked 9/12, answered same day).** The 3.2 fix below (schedHeader
against a device's own name) still wasn't the real device: §0 traced the
actual cause once `fixtures/growlink/api_list.txt` gave real device names
to check against — a table's own Growlink device is a numbered `Zone
Valve #N` (`Flower A1 - Zone Valve #5`, or `A7 - Zone Valve #5` for A-7),
never a schedule-style "Room Table N" header, and its device `type` field
is unreliable for telling a zone valve from anything else (the identical
name pattern comes back typed `Batch Tank` for most of B-1's own valves
and `Valve` for #2 through #5 in that same room's own list). `valveHeader`
(pure.js) now parses this directly, by name only, and `valveTablesFor`
encodes the A-wing shared-last-valve convention (one valve short of the
table count, the last one covers two tables) and the B/C-wing extras
convention (two valves long, the extra numbers are real spares) — both
confirmed against every room in the real fixture, not just the one that
happened to get checked. `schedHeader`-based matching is gone from this
path entirely, not kept as a fallback.

**3.2 — matching a device to a table, first correction (asked 9/12,
answered same day; superseded 9/12 by the entry above once the real
device names were checked).**
The first pass guessed a device's own `name` was the zone label from the
3.5 paste ("B-1"), matched by exact string. Andy: match room + table
number the way the schedule parser does, never exact strings.
`matchDeviceForTable` now reads a device's name through `schedHeader`
(pure.js) — the same function that already turns "A1 Table 11+12" into
`{room, tables}` for a schedule paste, tolerant of the same case and
spacing variance — and compares the parsed room and table directly, not
a string. `matchDeviceForZone` is gone, not kept as a fallback.

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
