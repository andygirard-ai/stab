# Stab — Weekend Plan v2, 9/12–9/13/2026

Supersedes v1 (written Friday evening before the v39–v51 log was read). Main is at **v51, 857 green**. Already shipped and removed from this plan: depth control fix (v39), undo cursor + banner Undo + FC ceiling with post-flush tag (v39), +plant placement (v38), parser widening and 0s = off (v40), multi-room paste with per-room filing (v41), sensor error codes as faults (v42), plants per table and A3 drippers (v48), battery via UART (v50–51), room state and walk order (v37).

Same guardrails as v1: full suite green before any commit; every item has an acceptance check, written as a test where none exists; fixtures from real data in the repo; decisions Andy has to make go to `QUESTIONS.md`; each window ends with `WINDOW_REPORT.md`.

Two corrections to the "still open" list in the build log before starting:
- **§5.6 device log is not gated on sensor renames.** Valves are already named by table in the API. Only the overnight *sensor* pull is gated. Device log is Window 3, unblocked.
- **The four `/*ASSUMED*/` feed-EC constants (A3, A4, B3, C3) should be deleted, not filled.** Feed EC belongs to the tank. See 1.5.

---

## Window 1 — Saturday AM — the wrong-room class of error

**1.1 Room confirmation on Start.** A distinct step: big room name plus the strain list from room config — `C3 · Kabuki Sour / GMO Punch / Super Boof / Triangle Kush`. Friday a full C3 sweep was filed as A1 and nothing on screen said so for eleven tables.
Accept: strain list sourced from room config, not rooms.js; the step cannot be skipped by tapping through.

**1.2 Re-room a sweep.** In-progress or stored. Strain, floor, bag, drippers, plants, hours-since-shot, below-floor flags recompute; readings and positions untouched; CSV re-exports.
Accept: the Friday A1→C3 sweep re-roomed produces floor-30 flags, C3 strains, ~20h since shot.

**1.3 Table-change cue.** Distinct beep or haptic at a table boundary; table number large on the stab screen. T6-front → T7-front is currently indistinguishable.

**1.4 Probe identity.** Accept the offer. Bridge name (`ZSC08328`) stored per connection, written to every row (`Probe` column), shown on the pill. Prerequisite for per-probe calibration when Evan's probe arrives.

**1.5 Feed EC from the tank, not the room.** Delete the four `/*ASSUMED*/` constants. Add a daily tank entry (A / B / C / Veg: EC, pH, ORP, time) on the day screen; rooms inherit via their tank assignment in room config. The CHECK dilution rule reads the inherited value. Rooms on water read 0.
Accept: C3 on 9/11 flush day shows 0.4/6.6 only because the operator entered the room as on-water, not because a constant said so.

**1.6 Stored-sweep backup.** Daily auto-export of all stored sweeps and room config to one shareable file. Storage is per-device and a second phone is coming. A lost phone is not lost data.

---

## Window 2 — Saturday PM — the paste is the record

**2.1 Diff-as-verification.** A paste (single room or the weekly blob) diffs against stored schedules and shows the diff as the verification screen — `C3 T5 5:15×2 → 7:00×3 · 998 → 1995 mL`. Unchanged tables collapse. Save updates schedules, sets post-change-read-due on changed rooms only, appends to the change log.
Fixture: C3 10:14 AM vs ~1:30 PM on 9/11; A2 10:14 AM vs ~2:15 PM; A3 first vs final on 9/11 (P2 2:26×7 → parked, flush 45 → 0:01, P1 8:56 → 17:52).

**2.2 Change log per room.** Date, table, before, after, mL before/after, operator, note. Export in the workbook's 17-column Room Schedule History layout: Date | P1 On | Duration | Interval | Frequency | P2 On | Duration | Interval | Frequency | P3 On | P3 Duration | P3 Interval | P3 Frequency | Total Runtime | Runtime (min) | Volume | Notes. P3 On = "OFF" when unused. Durations M:SS text.
Accept: 9/8–9/11 reconstructed from the pastes in the repo matches the 17 changes Andy entered that week, plus Friday's A2, A3, C2, C3.

**2.3 Rename tool (§6.5).** Old → new, effective date, all rooms at once; exports use the name current at the row's timestamp. Build it; do not execute the three pending renames until Andy says Monday.

---

## Window 3 — Sunday AM — Growlink, read-only

Nothing in the app has called the API yet; only the discovery page has. Everything here is GET. `PUT /room/{id}/device/{id}/state` can fire valves and stays out of the codebase.

**3.1 Connection status on Settings.** Key present · org resolved · last successful call + time · last error. Missing key → one line, nothing else in this window renders.

**3.2 Did last night fire.** Per room: `/devices/data/log` for the room's valves, last 24h. Tile and day screen: `11/11 fired · 1:15 AM · durations as configured`, or the valve that didn't and by how much, compared against the imported schedule.
Accept: A7 T3 on 9/11 — pre-flush runoff present, two 28-minute flushes produced nothing. Build the fixture from what the log actually returns for A-7 that day.

**3.3 Batch tank turnover.** `/sensors/data/chart` on Batch Tank #1/#2/#3/#5 levels, 3 days, 10-min. Fill per day = sum of positive deltas > 0.3. Show A/B/C/Veg next to the tank entry from 1.5.
Accept: reproduce 9/9–9/11: A ≈ 31/day, C ≈ 25 (0 on 9/10), B ≈ 24, Veg ≈ 18.

**3.4 `activeRun` field names** in the discovery page — `currentDayNo`, `totalNoOfDays`, `currentGrowthStage`. DOF from the API where set. Never trust API photoperiod for A-3 through A-7.

**3.5 Zone-list paste.** Room config accepts a pasted Growlink zone list (`#20003605  B1 Table 4  B-1`) alongside the schedule Sensor column. B1's eleven are in the repo. The v41 finding — 76 of 216 tables unassigned — is the gap this fills over the coming weeks.

---

## Window 4 — Sunday PM — Evan, and demand

**4.1 Runoff entry mode.** No probe. Room → table → mL / EC / pH / note. Writes the workbook Notes format: `T2 6.0+/6.1 280ml|T8 dry`. Flush-day flow: pre-flush sample, `1st flush HH:MM NN min`, post sample, `2nd flush …`. Exports with the day's sweeps. Evan's on-ramp; his data was lost three times this week to the workbook.
Accept: Friday's C5 block reproduced from a replayed session.

**4.2 Demand.** Per table per day: delivered mL (already computed) − runoff mL (4.1). Two calibration fields in room config: `FC mL` (2800 for 2-gal Bio365) and `FC ref VWC` (~52), so a dryback prints in mL: `54 → 38 ≈ 860 mL`.
Accept: one non-flush day from the 9/9–9/10 CSVs.

**4.3 Stale median greying** (§5.7). Grey the median-vs-last line when the prior sweep is > 4 days old.

---

## Not this weekend
Overnight sensor pull (portal renames first) · desktop→phone transfer via QR (OneDrive txt + v41 covers it) · anything that writes to Growlink.

## Kickoff — one per window
> Read `WEEKEND_PLAN.md` (v2). Work Window N top to bottom. For each item: build, write or extend the acceptance test named, run the full suite, commit only if green, bump the version. If an item needs a decision I have to make, write the question to `QUESTIONS.md` and move on. Stop when the window's items are done or you're blocked on all of them. Before stopping, write `WINDOW_REPORT.md`: what shipped and at what version, what's on branch, what's blocked, suite count. Don't touch anything outside this window's items.
