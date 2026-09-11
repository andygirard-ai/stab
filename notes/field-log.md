# Field log

Running notes from live sweeps, written as they come in from the floor and
kept next to the code rather than in a chat transcript. Each entry: what the
operator saw, what it turned out to be, what shipped. When a day's worth
accumulates it becomes the next addendum, so the drafting is already done.

Format is deliberately plain: symptom first, in the operator's words, because
the diagnosis is often wrong the first time and the symptom is what survives.

---

## Ship manifest

Fixes are batched rather than pushed one at a time, so a sweep is never
interrupted by a reload. This is the list to execute against.

**Live on main: v31** — v30 and v31 shipped 9/10.

**Queued on the branch, tested, not live:**

| | change | source |
|---|---|---|
| v32 | parser corrections against the two real pastes | backlog §2 |
| v32 | feel bands derived from the room's floor | backlog §1.1 |
| v33 | hand-only 1.25-gal sweeps flagged, on the tile and in the export | backlog §3 |
| v33 | operator chips read as names | backlog §3 |
| v33 | landing cleanup — settings behind a long-press on the version | backlog §4 |
| v33 | records need a qualifying sweep, and carry stabs/min | backlog §4 |

**Not yet actioned, in the consolidated backlog's build order:**

6. §6.1 row-aligned export · §6.7 conditional mid-bag stab
7. §5.1 commit/settle/undo · §5.2 crew skip — confirm status first
8. §5.4 room config incl. dripper count and tank
9. §6.2 table flags · §6.3 day coverage
10. §5.3 display · §5.5 sweep windows · §6.4 post-change reminder
11. §6.5 rename tool
12. §5.6 Growlink device log

Items through 6 are the second-operator gate.

---

## 9/10/2026 — first morning on v27

### 1. The colour scheme reads as ambiguous mid-walk → v28

**Observed.** "The colour scheme is confusing me. I think we need to go back to
a more basic colour scheme of red means bad, green means good. While it's
doing its reading it should be red; while I can move the probe it should be
green. That should have me having fewer misstabs due to moving from the
reference to the midpoint stab too quickly."

**What it was.** v27 shipped Addendum A §1.3 literally: amber-pulsing for
ready, grey for logged. Two states, both muted, and the distinction that
actually matters while walking — *may I put the probe in a bag right now* —
was not the one the colours encoded.

**Shipped.** The button is a traffic light answering that one question.
GREEN pulsing: clear and armed, stab now. RED: do not stab, it is either
reading or logged and still in the bag. Amber is left to the pre-flight
states (connecting, checking the probe), which are neither. Labels carry the
detail: READING… HOLD STILL, LOGGED · PULL PROBE, STAB NOW.

Note that red now appears on the button as a routine state while it is also
the zero-EC alarm colour. The alarm is a separate held banner at the top of
the screen with its own tone and an acknowledge button, so position and
persistence still separate them — but if it reads ambiguously in the room,
say so and the alarm moves to another treatment.

### 2. A room would not finish — same bug as 1

**Observed.** "I finished the room and it's just continuing. It should have
thrown up the finished screen, and instead we started moving backwards on
table twelve. But we're still on table twelve, it's asking me for front
reference."

**What it was.** Not a route bug and not the cursor moving backwards — the
app was *behind*, still asking for stabs already taken. `hold` cleared only
on a frame under AIR (3.5% VWC). A probe pulled from a wet bag is itself wet
and reads well above that for a second or two, and at an 800 ms poll a quick
reference-to-mid-bag move can produce no qualifying frame at all. The
mid-bag stab then arrives while the machine is still in `hold`, where it is
dropped on the floor: no row, no cursor advance. Do that a few times in a
room and the last table is still asking for stops the operator finished.

Same root cause as 1 — the operator was moving faster than the machine could
see, and the colours were not telling him when to wait.

**Shipped.** `hold` also clears on a decisive drop from the value just
logged (HOLD_DROP 15 points). A paired mid-bag reading runs about five points
under its reference, so a 15-point drop cannot be mistaken for one and
cannot re-arm the machine while the probe is still in the bag — covered from
both sides in test/adda.js.

**Worth confirming in the field**: whether any rows went missing before the
fix. A room that would not finish will have fewer CSV rows than stabs taken.

### 3. Opposite direction is not a mirror — it has a walk-back → v29

**Observed.** "When you're doing the sweep opposite and starting at the last
table, you're gonna be starting at the front of the table like you had. And
then once you complete that, you're gonna have to walk back, and you'll be
back at the front of the row. Now I'm on table ten, and I'd be at the header
and it says I'm at the front."

**What it was.** v27 fixed the phase for the *first* table of an opposite
walk and left the rest as a mirror of the standard walk. Reality has an extra
step in it: the operator enters at the front either way, walks the first
table front→header, and then has to walk *back* to the front to reach the
second table. So opposite runs front, front, header, front, header… — the
ordinary snake with one step inserted after the first table. Mirroring it
put every table from the second onward a position out, which is why A-1 asked
for T10 front while he was standing at T10's header.

The confirmed sequence, 12-table room, opposite:

    T12 front · T11 front · T10 header · T9 front · T8 header · …

**Shipped.** `walkPhase(walkIndex, dir)` inserts the extra step for `down`
and leaves `up` bit-for-bit unchanged. Assumed to hold in every room, because
it is a fact about where the door is rather than how many tables there are —
if a room turns out to differ, the target picker is the escape hatch.

**Not fixed, by decision.** T11's readings went in with front and header
swapped. The operator's call: front and header on the same table are within
noise for his purposes, so a retroactive swap is not worth building.

---

## 9/10/2026 — afternoon, Addendum B

### 4. Serpentine, third attempt: it is aisle grouping → v30

**Observed.** Addendum B §1, with a four-row truth table and three sweeps
behind it: A1 standard-from-T1 correct, B4 opposite-from-T1 wrong from T2
onward, A5 opposite-from-T12 wrong from T11 onward. "Standard side has been
fine all week. Every opposite-side sweep is off by one table."

**What it was.** The rule is aisles, not phase. Two tables share an aisle,
you enter at the front, so the first table of an aisle runs front→header and
the second header→front — that never changes. What changes is *which tables
share an aisle*, and that is a property of the SIDE: on the opposite side the
first table sits alone against the wall and every pair after it shifts by one.

This had been "fixed" three times on three different axes — table parity
(v26), walk index (v27), direction (v29) — and each was right in exactly the
cases that got walked that week. v29 was correct for standard-from-T1 and
opposite-from-last, wrong for the other two, which is why B4 and A5 both
failed today while A1 passed.

**Shipped.** `aislePos(walkIndex, side)` computes the group, `walkPhase`
assigns the position within it, and `buildRoute` now takes `side`. The four
rows of the spec's table are encoded verbatim in test/adda.js, along with
an assertion on the axis itself: direction reorders tables without changing
the phase pattern, side changes it. A fourth wrong axis now fails the suite
instead of a room.

### 5. Third probe colour → v30

**Observed.** B §2: red covered both reading and logged, so there was no cue
for when to lift the probe out.

**Shipped.** Green = stab now, red = reading, **white = logged, pull probe**.

### 6. Triage note cells → v30

**Observed.** B §7, asked as a confirmation rather than a report.

**Shipped.** Triage, spot and flush now return nothing from
`buildRoomNotes()` unconditionally. A triage targets the tables already known
to be bad, so anything it could say about them is a foregone conclusion, and
the cells are shared. Findings stay in the CSV and on the done screen.

### 7. Hours-since-shot was reading the previous grow's schedule → v31

**Observed.** B §3: "B3 logged 1.7h when it was 5.6h."

**What it was.** Not arithmetic. `SCHED.B3` in the weekly file still carried
the previous grow's five shots — 01:15 every two hours through 09:15 — and
the room actually stops after 05:15. At 10:52 the app walked a schedule that
said the room had been watered at 09:15 and answered 1.6h. Every number in
that chain was correct except the schedule itself.

There was no safe local fix. Editing `SCHED.B3` by hand would have made B3
right and left the same trap set in eighteen other rooms, one Monday at a
time, with nothing to say when it sprang.

**Shipped, as §4.** The operator copies the room's whole Growlink schedule
screen and pastes it in. Growlink prints the value *before* its label —

    4 / Mins / 44 / Secs / Duration

— so the parser accumulates lines and interprets them when a label arrives,
rather than counting positions. That survives a field moving or going
missing, which a positional parser would not.

What it reads per table: control type, total runtime, P1 start, shot
duration, interval and frequency; P2 as a separate series where a Copilot
room has one; flush duration. Per table, because tiers inside one room
routinely differ — C3 T1 and T7 are 5.6h and 0.9h apart at the same moment.
The A-wing `T11+12` shared-valve header fans out to two records that each
carry the pair, so a dryback call on one is legible against the other.

**Nothing here trusts its own output.** Frequency × duration, plus P2 and the
flush, has to equal the total runtime the screen prints; when it does not,
the table is flagged on the verification screen and the operator sees it
before anything is committed. A paste from the wrong room offers no save at
all. That check is the feature: a schedule silently misread is exactly the
failure this exists to end, and it would look identical to the one it fixes.

Once a room has an imported schedule it wins over the weekly file, and B3 at
10:52 reads 5.6h.

**Also shipped.** A shot that fires mid-sweep splits a room into two
populations that are not comparable. The app now notices the drop, tells the
operator at the moment rather than at the export, and marks every row after
it with a new CSV column.

**Still assumed, and worth a real paste.** The multi-table, Copilot and
`T11+12` block shapes are derived from the one documented `B5 Table 1`
sample, not from a screen. Three pastes would settle it: a full Simple Timer
room, a Copilot room with P1/P2/Flush, and an A-wing room showing `T11+12`.

### 8. Triage row notes did not say what the triage was about → v31

**Observed.** "Triage mode not showing row notes below floor."

**What it was.** Not the missing lines it sounds like — a triage does write a
row-note line per table, verified end to end on the done screen. What was
missing was the finding. The line reads

    T5  dry ok/ok 24/4.20 · 26/4.00 · 22/4.90 Chemdawg x Rainbowbeltz

in a 1.25-gallon room, where the floor is 30. All three readings are under
it and the line says "ok" twice.

The feel words describe how a bag feels and were never meant to track the
floor. They happen to line up in a 2-gallon room — the bands break at 18 and
22, and the floor is 22, so anything under it reads "dry" or "dry ok". The
1.25-gallon bands are the same table shifted four points while the floor
moves eight, so "ok" spans 26 to 30 and sits entirely below the floor. The
numbers were in the line all along, but they only mean something to a reader
holding that room's floor in his head.

v30 sharpened it. Triage, spot and flush now write nothing to the room-note
cells (B §7), so in a triage the row-note line is the only thing that reaches
the workbook — and every table on that walk was picked for being below floor.

**Shipped.** The line names the positions that are under:

    T5  dry ok/ok 24/4.20 · 26/4.00 · 22/4.90 Chemdawg x Rainbowbeltz, all below floor 30
    T9  splotchy dry ok/ok good 26/11.95 · 25/2.35 · 33/2.52 Cabernet, front + center below floor 30

Positions rather than a count, for two reasons. A count next to rounded
numbers reads as a contradiction — A5 T7 prints 30 · 35 · 39 and is one
reading under, because the first is really 29.6. And which end of the table
is dry is the thing he walked over to find out.

Every mode, not just triage: a mode-specific row-note rule is the kind of
thing that gets fixed once and then breaks somewhere else.

**Not changed, and worth a decision.** The 1.25-gallon feel bands are still
four points off the floor, so "ok" on a below-floor bag stays possible. That
is a change to the shared vocabulary in BB_fert_data and to how every
1.25-gallon room reads back through history, so it is his call, not a
cleanup: either the bands move up four points, or the words keep describing
feel and the new clause carries the floor.

---

## 9/10/2026 — evening, the consolidated backlog

### 9. v30 and v31 to main

Shipped together. Standard side had been fine all week and every
opposite-side sweep on main was still off by one table, which is no way to
spend a morning.

For the dry check in Bluefy, A-1 opposite from T1 should ask for:

    T1 front · T2 front · T3 header · T4 front · T5 header · T6 front …

first table alone against the wall, pairs from T2 on. The suite asserts this
against Addendum B §1's four-row table, but the room is the real test.

### 10. The parser met two real screens → v32

Both attached pastes now parse clean: A-1 to twelve records with six
duration tiers, C-4 to eleven with two. No warnings on either. Four things
the single documented sample had not shown:

**The printed total is P1 only.** A-1 prints 16m 14s, which is 8:07 × 2 and
nothing else — the 28-minute flush is excluded, as is the parked P2. The v31
guard summed every phase against that total, so it would have flagged all
twelve A-wing tables as misread. Reconciliation is P1 duration × P1
frequency against the printed total, which on a Simple Timer room is the
same rule because there is only P1.

**One header is lower case.** Ten A-1 records read `A1 Table N` and the
eleventh reads `A1 table 11+12`. Matching case dropped exactly the
shared-valve record — the one that carries two tables and is the worst one
to lose. Matched case-insensitively now.

**A parked P2 is not an absent one.** Growlink holds it at 0 Mins 1 Secs,
one-minute interval, frequency 1. Read literally that is a second daily
series delivering about a millilitre, which would move hours-since-shot and
show on the verification screen as a real shot. A phase under two seconds is
off.

**The sensor column is free text and decides nothing.** C-4 alone carries
`C4 Table 1 moisture`, `Substrate Moisture #20004907`, `C4 Table table 7
moisture` and a bare `C4 Table 11`. Table identity comes from the first
tab-separated field only. A parser reading the second field would mis-number
three of eleven tables.

Also: `Create new timer` ends every Simple Timer record and is ignored.

### 11. Feel bands now come from the floor → v32

The words described how a bag feels; the floor was a separate number. In a
1.25-gallon room "ok" ran 26 to 30 with the floor at 30, so a table picked
for a triage *because* it was under could be described as ok. A derived word
contradicting a derived threshold is a defect, and the hand goes blind below
about 25% in those bags anyway — the word carries nothing the number does
not.

One table of offsets from `room.floor` replaces the two hard-coded ones:
−4 dry · 0 dry ok · +4 ok · +8 ok good · +12 good · +16 good solid ·
+22 solid · +28 solid heavy.

Floor 22 resolves to 18/22/26/30/34/38/44/50 — bit for bit the old 2-gallon
table. The 9/1 fixtures confirm it: every changed row note in the diff is a
1.25-gallon room, and no 2-gallon line moved. Below floor is now always
"dry" or "dry ok" in every room, asserted by sweeping every half-point under
three different floors rather than by spot checks. A new bag size resolves
from its own floor with no second table to keep in step.

The v31 below-floor clause stays, positions and all.

### 12. A hand-only sweep of a 1.25-gal room is blind → v33

Backlog §3. The hand cannot feel below about 25% VWC in a 1.25-gallon bag and
the floor in those rooms is 30, so a bag-feel walk does not read less
precisely — it structurally cannot find the thing the walk is for. Nine of
the nineteen rooms are 1.25 gallon.

Detection is the absence of probe frames rather than a declaration. There is
no hand-feel entry mode to opt into, and a sweep that lost its probe halfway
is exactly as blind as one that never had it, so the app counts frames off
the wire. Demo frames do not count.

Three places it surfaces, in the order he meets them: the room tile carries a
`hand` badge, a `hand-only` sub-label and a red coverage bar, so the room
does not sit there looking checked; the done screen says it in a sentence;
the export carries `NO_PROBE_1.25GAL` in a new Sweep flags column. A hand-only
sweep logs no rows at all, so it also emits one record row — otherwise the
whole walk exports as a bare header line and reads as nothing happened.

The operator chips now read Andy and Evan. The stored value stays initials so
every CSV already exported still matches.

### 13. Personal records were being set by walking in and out → v33

Backlog §4. A record needed `clean` — no timeouts, no skips, no unstable
frames — which is trivially true of entering a room and tapping out, and
those three-second sweeps were holding the records.

A qualifying sweep is now: full-sweep mode, at least one probe frame,
coverage of at least 80% of the tables not skipped, and at least two stabs
per table swept. Skipped tables come out of the denominator, so a
crew-blocked room is not a slow sweep. Triage never qualifies — it targets
the bad tables on purpose.

**Stabs per minute is recorded beside elapsed time.** Elapsed gets better by
skipping tables; stabs per minute does not. Both are kept, per room, plus one
facility pace record.

Everything already stored was stamped once against the rule. The sweeps are
kept — for some of them the stored CSV is the only copy — they are just
stamped out of the running, and the app says how many.

### 14. The landing page, for somebody who has never seen it → v33

Backlog §4. Eight buttons that were useful while this was being built and are
noise to a second operator: a mic capability probe whose question is
answered, two destructive clears one tap from the room grid, a transfer pair
that only matters when a second phone exists, and a BENCH tile.

Mic test is deleted. The rest live behind a long-press on the version string.
The destructive three need `DELETE` typed before they unlock.

**The practice room was the important one.** BENCH sat in the grid under a
"NOT A ROOM" heading, which is a label doing a lock's job — on a phone handed
to somebody on his first morning, one mis-tap puts a shift of stabs into a
fixture. It opens from settings now and the grid is nineteen real rooms.

**Deviation worth naming:** the backlog said export/import position history
should move to a settings screen and the destructive controls to a hidden dev
menu. There is one screen, not two, and it is behind the long-press. Two
hidden menus is one more than this app needs, and export/import is Andy's
tool for the day a second phone exists, not something Evan needs to find.

**Also:** three separate versions have now appended a column to the CSV and
broken a test that anchored on the end of the row. Those assertions read by
column name now.
