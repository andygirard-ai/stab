# Questions for Andy

## 1.5 — default tank assignment when a room's tank isn't set

A room's tank assignment lives in room config (`cfg_tank`, set on the Room
setup sheet), same as the plan says. When it's blank, `feedEcFor` falls back
to the room's building wing letter (A1 → tank A, B3 → tank B, C3 → tank C) —
the physical plumbing, not a guess about the number. Once you enter a
reading for tank A on the day screen, **every unassigned A-wing room**
picks it up immediately, including ones that used to carry their own
confirmed FEEDEC constant (A1, A2, A5, A6).

That's a real behavior change worth your eyes on: is "unassigned = its
building wing's tank" the right default, or should a room read as unknown
until someone explicitly assigns it a tank on the setup sheet, even when
the wing match is obvious? I went with the wing default because it's
physical fact, not a guess, and it's exactly what let A3/A4/B3/C3 read
correctly with zero manual setup this week. If you'd rather require the
explicit assignment everywhere, that's a one-line change (drop the
`rm.charAt(0)` fallback in `feedEcFor`, pure.js).
