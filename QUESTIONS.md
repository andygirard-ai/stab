# Questions for Andy

**Window 3, Growlink specifics — I have zero real knowledge of this API
beyond the plan text and the field names on the discovery page.** Rather
than guess at any of this (the exact failure mode the wing-default and the
`/*ASSUMED*/` constants both were), I built everything that doesn't depend
on it and left the rest open:

- **Base URL and auth header.** The plan says "the discovery page" but I've
  never seen it. `growlinkGet()` assumes `Authorization: Bearer <key>` —
  that's a guess, flagged in the settings screen's own copy ("unverified"),
  not asserted as fact anywhere in code or a comment. What's the real base
  URL, and does the API actually want a Bearer token, an API-key header, or
  something else?
- **`/devices/data/log` response shape.** 3.2 ("Did last night fire") needs
  to know how a fired shot appears in the log — timestamp field name,
  duration field, how a *manual* flush (as opposed to a scheduled P1/P2)
  is distinguished from a scheduled one. Without that I can't build the
  A7 T3 9/11 fixture (pre-flush runoff, two 28-minute flushes, nothing)
  faithfully — I've scoped 3.2 down to scheduled-shot comparison only for
  now (`shotTimes()` vs. the log) and left manual-flush matching as a named
  gap rather than fabricate a response shape to match against.
- **`/sensors/data/chart` response shape and the Batch Tank # → letter
  map.** 3.3's accept criterion names Batch Tank #1/#2/#3/#5 but the plan
  never says which number is A, which is B, which is C, and which is Veg.
  `tankFillByDay()` (the pure aggregation — sum of positive deltas > 0.3,
  reproduces the 9/9–9/11 numbers on a synthetic fixture) is built and
  tested; it just isn't wired to a real fetch or the tank-entry UI from 1.5
  because I don't know which number to ask for on which room's behalf.
- **`activeRun` endpoint path.** The field names (`currentDayNo`,
  `totalNoOfDays`, `currentGrowthStage`) are in the plan; the path to fetch
  them for a given room isn't. `fetchActiveRun(rm)` guesses
  `/room/{id}/activeRun` — again flagged as unverified, not committed to
  as fact.

Everything above is built as far as it can go without guessing the rest:
3.1 (connection status), 3.4's DOF-override and photoperiod-stripping
logic, and 3.5 (zone-list paste) don't depend on any of this and are done
and tested. 3.2 and 3.3's live wiring are the only things Window 3 is
actually blocked on.

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
