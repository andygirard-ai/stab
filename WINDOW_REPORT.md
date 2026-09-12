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

## Built, not wired

**3.3 Batch tank turnover — pure half only.** `tankFillByDay(points)`
sums positive deltas over 0.3 per day from an `{at, level}` series;
verified against a synthetic fixture reproducing the 9/9–9/11
fill/flush-day/fill pattern from the accept criterion. Not connected to
a real fetch or to the 1.5 tank-entry UI, because the plan's Batch Tank
#1/#2/#3/#5 never says which number is A, which is B, which is C, and
which is Veg — guessing that mapping risks silently crediting the wrong
room's water to the wrong tank, which is worse than not showing it.
Asked in `QUESTIONS.md`.

## Not started

**3.2 Did last night fire.** Needs `/devices/data/log`'s actual response
shape — specifically how a manually-triggered flush is distinguished
from a scheduled P1/P2 shot — to build the A7 T3 9/11 fixture (pre-flush
runoff present, two 28-minute flushes producing nothing) honestly rather
than against an invented envelope. Asked in `QUESTIONS.md` alongside the
rest of the open API specifics; scoped for a future window to
scheduled-shot comparison only, with manual-task matching flagged as a
separate gap once the shape is known.

## What's on branch (Window 3)

One commit beyond Window 2: `8a6c64c` (v58). Merged to `main` same day.

## Blocked

3.2 in full, and 3.3's live wiring, on the Growlink API specifics listed
in `QUESTIONS.md` (base URL, auth header format, two response shapes,
the `activeRun` endpoint path, and the tank-number-to-letter map).
Nothing else.

## Not started

Window 4 (Evan's runoff entry mode, demand computation, stale-median
greying).
