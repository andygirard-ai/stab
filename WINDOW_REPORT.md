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

**1.5 Feed EC from the tank — v55 (`f82e797`).** The four `/*ASSUMED*/`
constants (A3, A4, B3, C3) are deleted, not corrected. `feedEcFor(room)`
reads the room's tank assignment (the existing `cfg_tank` field in room
config) and today's own reading for that tank, entered once on the day
screen (**Today → tank readings**: A/B/C/Veg, EC/pH/ORP). Falls back to a
still-confirmed FEEDEC constant, then to unknown — never a guess. A room
on water always reads 0. The CHECK dilution rule reads through this.
*One open question for Andy, in `QUESTIONS.md`:* an unassigned room
defaults to its own building wing's tank, so a live tank-A reading now
supersedes even a still-confirmed room-level constant on A1/A2/A5/A6.
That's the intended direction of the item, but it's a real behavior change
worth his sign-off.

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

## What's on branch

Five commits beyond last night's `v51`: `d232a57` (v52), `a6a41e3` (v53),
`638deef` (v54), `f82e797` (v55) — plus `390d672`, a pre-existing cleanup
(a stray root-level `test` artifact) carried over from before this window
started. `WEEKEND_PLAN.md` and `QUESTIONS.md` are also new on branch.

## Blocked

Nothing. All six items are shipped and tested; the one open question above
is a design confirmation, not a blocker — 1.5 works correctly either way,
and reverses in one line if Andy wants the stricter default.

## Not started

Window 2 (Saturday PM — diff-as-verification, change log, rename tool),
Window 3 (Growlink read-only), Window 4 (Evan's runoff mode, demand,
stale-median greying).
