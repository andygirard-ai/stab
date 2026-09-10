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

**Live on main: v29.**

**Queued on the branch, tested, not live** — held at the operator's request
while a couple of other things are worked out, so this batch ships together:

| | change | source |
|---|---|---|
| v30 | aisle grouping — the phase belongs to SIDE, not direction | B §1 |
| v30 | third probe colour: white = logged, pull probe | B §2 |
| v30 | triage/spot/flush write nothing to the note cells | B §7 |
| v31 | schedule paste-in, per table, with a verification screen | B §4 |
| v31 | hours-since-shot from the imported schedule, per table | B §3 |
| v31 | a shot that fires mid-sweep is flagged and marks its rows | B §4 |
| v31 | row notes say which positions are below floor | floor, 9/10 |

**Not yet actioned, in build order:**

- **B §5 / §6 room config.** Dripper count, strain map, flower start,
  underlight flags — editable, part of move-in. Dripper count is what
  volume-per-plant is still missing; §4 has the runtime it needs.
- **B §8 operator field.** Mark a bag-feel-only sweep so a room without probe
  data is distinguishable from one with it.

**Waiting on the floor:** three real Growlink pastes — one full Simple Timer
room, one Copilot room with P1/P2/Flush, one A-wing room showing `T11+12`.
The §4 parser is built against the single documented `B5 Table 1` sample and
the rest of the block shapes are derived, not observed.

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
