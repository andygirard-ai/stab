# fixtures/9-11 — real Growlink schedule screens, 9/11/2026

Reconstructed byte-for-byte from the operator's pastes that day (tab after the two header fields, blank-line spacing, lowercase `table` where Growlink printed it, `Create new timer` trailer on Simple Timer blocks, the missing `Mins` unit on A3 T11+12's flush in the 10:14 screen). Times are approximate Eastern.

Expected diffs (the change log for the day):

| Room | Before | After | Change |
|---|---|---|---|
| A2 | 1014 | 1415 | T1/T2 17:09×2 → 8:35×4; T5–T9 34:17×2 → 17:09×4; T3/T4/T10/T11+12 36:00×2 → 18:00×4; interval 2:00 → 1:15 on all. Daily mL unchanged (2401 / 2401 / 2520 at 70 / 35 / 35 mL·min). |
| A3 | 1014 off | 1620 active WRONG | Room switched on; P1 still 8:56×2 (625 mL at 2 drippers — half the intended 1251); P2 2:26×7 @0:45 (T11+12 2:17×9) still live; flush 45. |
| A3 | 1620 | 1630 final | P1 8:56 → 17:52 (1251 mL); P2 → parked 0:01/0:01/1; flush 45:00 → 0:01. |
| C2 | 1014 | 1640 | T1–T5, T8–T11 6:33×2 → 6:33×3 (1245 → 1867); T6/T7 6:33×2 → 7:22×3 (1245 → 2100); flush 20/15 → 0:01 on all Copilot tables. |
| C3 | 1014 | 1330 | T2 5:15×2 → 7:53×2 (665 → 998 @ 2 drip); T3 5:15×2 → 10:30×3 (665 → 1995 @ 2 drip); T4/T6/T9 5:15×2 → 7:00×2 (998 → 1330); T5/T7/T8 → 7:00×3 (T5 998 → 1995, T7/T8 1330 → 1995); T1/T10/T11 unchanged. |

Dripper counts for mL: A2 T1/T2 = 4, T3–T12 = 2 (17.5 mL/dripper/min). A3 all 2. C2 all 3 (95 mL/min at 3). C3 T1–T3 = 2 (63 mL/min), T4–T11 = 3.

The 9/11 10:14 all-rooms blob (19 rooms, the multi-room fixture) is the operator's OneDrive `all schedules as of 9/11/26 10:14am` file; the four `*_1014_before` files here are its A2, A3, C2 and C3 blocks.
