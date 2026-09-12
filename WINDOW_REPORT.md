# Window 1 report — Saturday AM, the wrong-room class of error

All six items shipped. Suite: **857 → 917 passing, all green.** Branch
`claude/new-session-ri155r`, pushed through `f82e797`.

## Shipped

**1.1 Room confirmation on Start — v52 (`d232a57`).** A distinct step
between Start and the first stab: room name at 58px, the room's distinct
strain list underneath, sourced from `strainListFor` (room config first,
the Monday file under it). Only `#confirmgo` begins the sweep; `#confirmback`
is the only other live control. Not skippable by tapping through.

**1.2 Re-room a sweep — v53 (`a6a41e3`).** `reRoomRows` recomputes every
room-derived field — strain, flags, bag, media, hours since shot (against
the new room's own imported schedule, at the time the reading was actually
taken), and the below-floor flag. Table, position, depth and the
measurement itself are untouched. Reachable from the done screen; since
`finish()` writes to history immediately, the same action updates that
entry too, matched by timestamp rather than room name.
*Scope note:* only the sweep that just finished can be re-roomed this way —
there is no browser for arbitrary older stored sweeps. Building one is
bigger than this item; flag it if a real need for it shows up.

**1.3 Table-boundary cue — v54 (`638deef`).** The `tableDone` beep already
existed. Added: `navigator.vibrate` (feature-detected — most of iOS Bluefy
has none) and a CSS pulse on the table number, which is now its own
element (`<b class=tnum>`) at 1.4× size instead of folded into "Table 7".

**1.4 Probe identity — v55 (`f82e797`).** The bridge's `.name` (e.g.
ZSC08328) is captured on every successful connect, written to a new CSV
`Probe` column, and shown on the battery pill before any battery reply
arrives (so the pill isn't blank for the first five minutes). Verified
against a real fake-GATT `connect()` chain in the new `test/probeid.js`,
since jsdom has no `navigator.bluetooth`.

**1.5 Feed EC from the tank — v55 (`f82e797`), corrected v56 (`3e35012`).**
The four `/*ASSUMED*/` constants (A3, A4, B3, C3) are deleted, not
corrected. `feedEcFor(room)` reads the room's tank assignment and today's
own reading for that tank, entered once on the day screen (**Today → tank
readings**: A/B/C/Veg, EC/pH/ORP). A room on water always reads 0.
**Corrected same day:** the first pass defaulted an unassigned room to
its own building wing's tank; Andy's answer in `QUESTIONS.md` was that
tank assignment is a weekly valve choice, not a wing property — this
week tank A feeds A1, A2, A5, A6 and C1, C2, C3; tank B feeds B1, B2,
B3, B5, B6 and C4, C5, C6; tank C feeds B4; A7 is on water. The wing
default is gone outright; `rooms.js` now carries the actual seeded `TANK`
map (A3, A4 deliberately absent — unassigned this week, reads "no tank
assigned," and the dilution rule does not run for them). `FEEDEC` is
gone entirely, including the persisted per-sweep override that used to
freeze a typed number into room config forever — that was the same
mistake in a different shape, per Andy's "no room-level EC to preserve."

**1.6 Stored-sweep backup — v55 (`f82e797`).** One shareable file — every
stored sweep (CSV and workbook text included) plus room config — reusing
the CSV export's own share/copy path. Settings gets **Back up now** /
**Restore from backup** (restore merges by timestamp, never clobbers a
room config this phone already has); the day screen nudges when today's
backup hasn't happened yet.
*Scope note:* true silent daily auto-export isn't possible from a web
page — Web Share requires a user gesture on iOS/Bluefy. The nudge-plus-
one-tap on the daily screen is the honest equivalent; flagged in the
commit message so it doesn't read as more automatic than it is.

## What's on branch (Window 1)

Six commits beyond last night's `v51`: `d232a57` (v52), `a6a41e3` (v53),
`638deef` (v54), `f82e797` (v55), `3e35012` (v56, the 1.5 correction) —
plus `390d672`, a pre-existing cleanup (a stray root-level `test`
artifact) carried over from before this window started. `WEEKEND_PLAN.md`
and `QUESTIONS.md` are also new on branch. Merged to `main` same day, at
`3e35012`.

## Blocked

Nothing. All six items shipped and tested, including the 1.5 correction.

---

# Window 2 report — Saturday PM, the paste is the record

All three items shipped. Suite: **924 → 960 passing, all green.** Branch
`claude/new-session-ri155r`, merged to `main` at `4e0cea5`.

## Shipped

**2.1 Diff-as-verification — v57 (`4e0cea5`).** `schedTableDiffParts`
reports every field that differs between a fresh paste and the stored
schedule in one pass — start, P1 shot×frequency (with the mL that shot
delivers), interval, P2 appearing/parking/changing, the flush timer,
on/off — where the old `schedDiff` stopped at the first mismatch and
silently dropped the rest (a paste that moved both the start time and
the shot count used to report only the start time). The verification
screen now leads with the diff: a changed table gets its own line
(`T5 5:15×2 → 7:00×3 · 998 → 1995 mL`), unchanged tables collapse to a
count, and a genuine first import says so rather than reporting every
table as changed. The weekly-blob screen gets a per-room version of the
same treatment. One diff engine (`schedDiff`/`schedTableDiffParts`) now
feeds three consumers — the verification screen, `saveSched`'s
post-shot-read flag, and the new change log — instead of three separate
copies of the comparison logic.

**2.2 Change log per room — v57 (`4e0cea5`).** Every table-level change
is kept forever in `stab_schedlog` (not just the "still needs a
post-change read" flag), storing the full before/after table snapshots
rather than a pre-formatted string. `buildSchedLogCsv` exports the
workbook's own 17-column Room Schedule History layout — P1/P2 from this
app's own fields, P3 from the flush timer (Growlink's three phase types;
this app has always called the third one flush, the workbook calls it
P3), P3 On reading OFF when a table carries no flush timer at all.
Reachable from the schedule sheet, per room.
*Scope note:* built and tested end-to-end with realistic synthetic
fixtures (a table with a moved P1 shot and a parked P2 together, in the
shape of A3's real 9/11 pattern). The literal reconstruction of that
week's 17 real changes plus Friday's A2/A3/C2/C3 pastes needs those
actual paste texts, which aren't sitting in the repo as a second-paste-
same-day fixture the way the single-paste-per-room ones are — that
reconciliation is a good next step once real multi-paste data is on
hand, not something to fabricate.

**2.3 Rename tool — v57 (`4e0cea5`), §6.5.** Old name to new, effective a
date, across every room at once. Built as a lookup-time transform
(`applyRename`, read through `strainFor`) rather than a rewrite of every
room's strain map — one entry changes what every room carrying that name
shows, without touching room config or `rooms.js`. A row already
captured is unaffected either way, since `doCommit` bakes the name in at
read time; `reRoomRows` (1.2) now passes the row's own captured date
through so re-rooming an old row doesn't retroactively apply a rename
that wasn't effective yet when the row was taken. Reachable from
Settings. **The three pending renames are not entered** — `stab_renames`
starts and stays empty until Andy uses the tool himself, per the plan.

## What's on branch (Window 2)

One commit beyond Window 1: `4e0cea5` (v57). Merged to `main` same day.

## Blocked

Nothing.

## Not started

Window 3 (Growlink read-only), Window 4 (Evan's runoff mode, demand,
stale-median greying).

---

# Window 3 report — Sunday AM, Growlink read-only

Three of five items shipped in full; one built as far as it can go
without unverified API facts; one not started. Suite: **960 → 996
passing, all green.** Branch `claude/new-session-ri155r`, merged to
`main` at `8a6c64c` (v58).

Nothing in this window fires a valve. `growlinkGet()` is the only thing
that calls `fetch`, and it is a GET with no body.

## Shipped

**3.1 Connection status on Settings — v58 (`8a6c64c`).** `growlinkGet()`
wraps `fetch` with the key from `stab_growlink` and a `Bearer` auth
header — flagged as unverified in the settings screen's own copy, since
I've never seen the discovery page the plan refers to, not asserted as
fact anywhere in code. Missing key renders one line and calls nothing.
Settings gets a key field, a base-URL field, and **Test connection**,
which hits `/devices/data/log` and records the org field or the HTTP
error with a timestamp. Verified in jsdom via a new `bootWithFetch()`
harness helper (jsdom has no `fetch` at all, same gap as
`navigator.bluetooth`) covering missing-key, key-without-base-URL,
success, and a rejected key.

**3.4 `activeRun` field names — v58 (`8a6c64c`).** `dofNow(rm)` prefers
a stored `activeRun.currentDayNo` over the `FLOWER_START` count once one
exists, falling back cleanly when neither is on file. `currentGrowthStage`'s
photoperiod claim is stripped on the way into storage for every room, not
only A3–A7 — the plan's "never trust API photoperiod for A-3 through A-7"
read as a floor, not a whitelist, since there's no reason the API's
photoperiod guess is trustworthy for the other twelve rooms either.

**3.5 Zone-list paste — v58 (`8a6c64c`).** `parseZoneList`/`zoneFor` read
Growlink's own zone list per room (`#20003605  B1 Table 4  B-1`),
alongside the existing schedule Sensor column, not instead of it. Room
Setup gets a paste box and a coverage line ("N of T tables have a
zone"). A paste naming a different room than the one open is named and
rejected, the same shape check schedule pastes already do.

## What's on branch (Window 3, first pass)

One commit beyond Window 2: `8a6c64c` (v58). Merged to `main` same day.

## Blocked (as of v58)

3.2 in full, and 3.3's live wiring, on the Growlink API specifics listed
in `QUESTIONS.md` (base URL, auth header format, two response shapes,
the `activeRun` endpoint path, and the tank-number-to-letter map).
Nothing else.

---

# Window 3 correction — Growlink API, against the real guide

Andy sent `docs/Growlink_Skill.md` (Growlink's own developer API
reference) and `growlink_room_export.csv` the same day. Every item v58
had built against a guess or left unwired is now built against a
confirmed fact instead; 2.2's reconciliation, run against real fixtures
for the first time, caught two real bugs no synthetic fixture ever had
a chance to. Suite: **996 → 1049 passing, all green.** Branch
`claude/new-session-ri155r`, v59 (`ee2be9b`).

## Corrected

**3.1 — base URL, auth header, response shapes.** `https://api.developer.growlink.com`,
`Gl-Api-Key` (not `Bearer`), five `Uom-*` headers on every call,
`/api/v2/organizations` as the key-validation call. `normalizeKeys()`
now runs on every response — the guide's own §2.2 says keys can arrive
PascalCase or camelCase and differ in casing between a discovery
response and a live one for the same field.

**3.3 — wired end to end.** Batch Tank sensors are read from the CFS
room directly (`1101903f-b6d5-43e7-b0e7-2617a6bd9d61`, confirmed by
Andy), not discovered by the RoomType-search guesswork v58 shipped with.
The #1/#2/#3/#5(veg) → A/B/C/Veg map, already confirmed empirically
against `growlink_room_export.csv` in v58, is now also confirmed
directly by Andy — the reconstruction stands as the record of *how* it
was confirmed, not just that it was. The day screen's **Read Growlink
fill** button reads all four tanks' three-day fill and shows it next to
the 1.5 tank-entry fields, read-only.

**3.4 — activeRun relocated, not re-guessed.** `currentDayNo`,
`totalNoOfDays`, `currentGrowthStage` turned out to be a field on the
room object from the rooms listing itself, not a separate endpoint —
`fetchActiveRun` reads it off `growlinkRooms()` now. A room present in
the listing with no `activeRun` on it, or absent from the listing
outright, fails by name rather than a silent zero.

**Room naming.** Growlink names a room `"A-1"` where Stab says `"A1"` —
`growlinkApiRoomName` transforms before every room lookup (3.2's device
discovery, 3.4's activeRun), matched by exact equality specifically
because the org also carries legacy rooms (`"A2 substrate"`, `"A7, Veg
B, C, Dry A, B, and Cure C"`) that must never match by accident.

## Shipped

**3.2 Did last night fire.** `fetchNightFire(rm)` ties each zoned table
(3.5) to its Growlink device by name, pulls the last 24h of that
device's log, and hands the comparison to `nightFireLine` (pure.js)
against this app's own schedule for the same table — only scheduled
periods count toward fired/missed, a manual run is reported alongside,
never folded into either. Reachable from Room Setup, next to the zone
paste. Verified against a **SYNTHETIC** fixture
(`fixtures/9-11/A7_devices_data_log_SYNTHETIC.json` — the real API key
lives on the phone, not the repo) reproducing the actual 9/11 A7 T3
finding per Andy's note: a run still open at window end is never
reported, so the device's *absence* from the response is the finding,
not a parsing gap. Andy will drop the real Monday log in over the same
filename to replace it.
*Scope note, still open:* whether a device's own `name` is the zone
label from the 3.5 paste (`"B-1"`) rather than the numeric id printed in
front of it — the one thing neither the guide nor Andy's message
confirms, and there's no way to test it without live account access.
`matchDeviceForZone` fails by name, not silently, if it's wrong. Asked
in `QUESTIONS.md`.

## Found by 2.2's reconciliation

The plan's own 2.2 fixture request — real before/after schedule pastes
for A2, A3, C2, C3, with a README carrying the expected diff table so
this could assert on numbers rather than eyeball — arrived alongside the
Growlink guide. Run against it, `schedDiff`/`schedTableDiffParts`
reconciled every group the README names, mL figures within the expected
under-1% of the README's own rounded dripper-rate approximation (63,
95 mL/min vs. this app's calibrated 31.54 mL/min/dripper — the more
precise of the two, not a second disagreement). Getting there surfaced
two real bugs:

**Interval diff readability.** `2:00 → 1:15` rendered as `2.0h → 1.3h`
— a rounded decimal that reads as a small numeric tweak and hides what
actually changed. Fixed with a new `hmm()` formatter (H:MM, the same
convention `mmss` already sets for durations), applied to the diff line
and the verification screen's two interval columns.

**A live P2 has read as parked on every real schedule this app has ever
parsed.** `schedPhaseOn` required a P2 start time; Growlink's own
Copilot screens never print one for P2 — confirmed against the real A3
9/11 fixture, where P2's own timers section has Duration, Interval and
Frequency but no Start Time field at all, unlike P1, which always has
one. That silently nulled every active P2: invisible to the diff, the
change log, and the verification screen, the whole time. Caught only
because a real fixture replaced the synthetic one that had invented a
start time for P2 (`'02:26'`, misreading the duration `2:26` as a clock
time) to make the old, wrong check pass.
Fixed by dropping the start requirement from `schedPhaseOn`.
`schedSeries` still excludes a startless phase from the shot-time series
it feeds `hoursSinceShot`, deliberately: P2's real trigger rule — a
fixed offset from P1, a clock time Growlink just doesn't print here,
something else — isn't confirmed by anything received so far, and
guessing one would put an invented time into the one number the
inverted-profile warning is gated on. Hours-since-shot still reflects
P1 only, same as it always effectively did before this fix — now a
flagged gap in `QUESTIONS.md` instead of a silent one.

## What's on branch (Window 3 correction)

One commit beyond the first Window 3 pass: `ee2be9b` (v59). `docs/Growlink_Skill.md`
and `fixtures/9-11/` (nine real schedule screens, a README, and the
SYNTHETIC A7 device-log fixture) are new on branch. Merges to `main`
alongside Window 4, per Andy's instruction this round.

## Blocked

Nothing. The one open item (device-name-to-zone-label matching) is
flagged, not blocking — 3.2 fails honestly by name if it's wrong, and
doesn't stop anything else from shipping.

---

# Window 4 report — Evan, and demand

All three items shipped. Suite: **1049 → 1071 passing, all green.**
Branch `claude/new-session-ri155r`, v60.

## Shipped

**4.1 Runoff entry mode.** No probe: room, table, mL, EC, pH, a note,
through the Log screen's existing `runoff` tab (extended, not replaced —
its `pass` field already carried what a flush day needs, since pass 1 is
the pre-flush sample, pass 2 is taken after the 1st flush, pass 3 after
the 2nd). Two new optional fields, flush start and flush minutes, attach
to whichever pass follows a flush. `runoffNotesLine` (pure.js) writes
the workbook's own Notes format exactly: `T2 6.0+/6.1 280ml|T8 dry`
(the plan's own example, reproduced verbatim by a real replay of the Log
screen) — EC with an optional trailing `+` for a maxed meter, never
parsed as a number anywhere this touches EC; `dry` for a table with
nothing to report; tables joined by `|`, in numeric order. Surfaces
automatically in `buildRoomNotes()` — the same shared note cell the
file's own comment already described as "used for flush times and
saucer pickups" before this window ever touched it — so Evan's entries
reach the workbook even on a day nobody ran the probe in that room.
*Scope note:* no real Friday C5 session survives anywhere in the repo to
replay literally, despite the accept line naming one — confirmed absent
by search, not assumed. The test replays the plan's own literal example
(`T2`/`T8`) plus a constructed flush-day table (`T5`) through the real
UI instead, which is honest about what it is: built to exercise the
mechanism the accept line describes, not a reproduction of a session
that isn't in the repo.

**4.2 Demand.** `demandFor(room, table)` = `mlPlantToday` (already
computed, per-plant) minus today's runoff for that table (4.1). Both
terms deliberately at the same scale — a single bag — because `FC mL`
is a per-bag water content (2800 for one 2-gal Bio365 bag, not a whole
table of them); `mlTableToday` would have multiplied by plant count and
put demand and the dryback calibration on two different scales without
either number looking wrong on its own. Two new room-config fields, `FC
mL` and `FC ref VWC`, follow the exact pattern floor/tank/plants already
use — unset reads unknown, never a guessed default, since field capacity
is bag- and media-specific and moves with days in flower. `drybackMl`
turns a VWC delta into an mL estimate; the plan's own example (54 → 38 ≈
860 mL) reproduces at 862 mL exactly, the precise figure that
approximation rounds from. Room Setup gets a live readout under the two
new fields. Tested against the real `sched_A1_2026-09-10.txt` fixture
(the same one Window 2's own tests already use) rather than a synthetic
schedule — a real non-flush day, per the accept line, even though the
literal 9/9–9/10 probe-reading CSVs it names aren't in the repo either.

**4.3 Stale median greying.** The done screen's median delta (`Δ +2.1
vs 9/8`) greys out — a new `.stalemed` class, deliberately not reusing
`.stale` (already means "needs attention," a warning color, on the room
setup button and the data-age pill; this is the opposite, a
deliberately muted one) — when the prior sweep it's comparing against
is more than four days old, and says "— stale" in words, not only in
color. A real bug caught building this: the containing function
(`finish()`) already declares a local `var histTs` (a timestamp for the
*new* entry being saved), which shadows the outer `histTs()` helper
function for the whole scope via `var` hoisting — calling it threw
`histTs is not a function` in testing before it ever reached a real
device. Fixed by inlining the same fallback logic under a distinct name
rather than fighting the shadow.

## What's on branch (Window 4)

One commit beyond the Window 3 correction: v60. Merges to `main` in the
same push as the Window 3 correction, per Andy's instruction.

## Blocked

Nothing.
