# Stab — substrate probe logging app

A single-page web app that reads a substrate probe over Bluetooth and logs moisture and EC readings at a nineteen-room cannabis production facility. It replaced voice dictation and cut a full room sweep from about forty minutes to thirteen.

Hosted on GitHub Pages, opened in **Bluefy** on iOS. Safari does not support Web Bluetooth; Bluefy does.

**Andy Girard** is the fertigation lead and the primary user. **Evan** is the co-lead and the second user, with a second probe.

---

## Before proposing any change

**Run `test/test.sh` and say which checks passed.** It runs, in order:

1. `node --check` — syntax
2. ESLint `no-undef` / `no-unreachable` / `no-redeclare` — catches the case where braces still balance but a function went missing
3. `run_rooms.js` — the workbook and CHECK builder against real room CSVs from 9/1/2026
4. `smoke.js` and `recover.js` — the whole page in jsdom, demo sweep and crash recovery

The whole thing takes under two minutes and needs no phone.

**This is not optional.** Two prior failures came from skipping it: a patch that cut through a nested closing brace and killed the app silently, and a changelog written from intent that advertised two features which were never built.

**Write the changelog from the diff, after the tests pass. Never before.**

---

## The hardware

The probe is an **Aroya Solus** — a rebadged **METER ZSC** Bluetooth interface attached to a **TEROS 12** substrate sensor.

```
Service   DECA0001-10C7-43A8-8C9F-42B70E03808D   the only service on the device
Write     DECA0002-…   write + writeWithoutResponse
Notify    DECA0003-…   notify only
             — confirmed by GATT dump 9/11/2026: nothing on this device is readable

Frame     7C 61 | length (2 bytes, big-endian, whole frame) | ASCII payload | CRC-16/XMODEM
Trigger   "sdicmd 0XR3!!" wrapped in that frame
Reply     0 2297.3 24.9 308 g<checksum><crc>
          address · calibrated VWC counts · °C · bulk EC µS/cm · sensor type g
```

**Sensor error codes** — printed *in place of* the measured value, in the
same frame shape as a reading:

```
-9999   measurement compromised, values meaningless
-9992   calibration lost or corrupt
-9991   supply voltage too low to measure
```

**`-9991` is not a battery gauge.** It says the sensor's supply was
inadequate at the moment of measurement — a bad stereo connection, contact
resistance or a regulation fault can cause it as readily as exhausted cells —
and it is an end-stage fault: by the time it fires the measurement is already
lost. It is no substitute for a graded 73 / 42 / 18 reading.

The TEROS 12 is a passive 4.0–15 VDC sensor drawing 3–16 mA for 25 ms per
measurement — no battery, no power telemetry in its SDI-12 command set. The
**ZSC bridge runs on two AA alkaline cells** (2–3 months normal use, up to 6
with daily use); its manual documents no level readout, but that manual is
user-facing and has no GATT section at all, so it says nothing either way
about the firmware's services.

**The CSV had a Batt column from v18 to v42 and it was never once filled.**
It is gone. It was read exactly the way the Bluetooth SIG specifies —
service `0x180F`, characteristic `0x2A19`, `getUint8(0)`, 0–100, with
`battery_service` in `optionalServices` — and that implementation returned
nothing across weeks of sweeps.

**Settled by GATT dump, 9/11/2026, probe ZSC08328** (`test/probe_scan_2026-09-11.txt`):

```
services granted and present: DECA0001-10C7-43A8-8C9F-42B70E03808D
  service DECA0001-10C7-43A8-8C9F-42B70E03808D
    DECA0002-…  [write,writeWithoutResponse]
    DECA0003-…  [notify]
```

`battery_service` **was** in `optionalServices` on that build, so the
enumeration was authoritative: had the device carried `0x180F`, it would be
in that list. It is not. **One service, two characteristics, and neither is
readable** — so there is no vendor battery reading hiding in the DECA service
either. Both `0x180F` attempts rejected.

This is a fact about the device now, not a judgement on evidence. Do not add
the column back, and do not re-open the question from documentation: the SIG
numbers, the manuals and the fuel-gauge argument are all beside the point
next to the dump. **Settings → Probe scan** re-runs it in ten seconds if a
different bridge ever needs checking.

**Conversions**, verified against METER's TEROS 11/12 Integrator Guide:

```
VWC %   = (6.771e-10·c³ − 5.105e-6·c² + 1.302e-2·c − 10.848) × 100    c = counts
ε       = (2.887e-9·c³ − 2.080e-5·c² + 5.276e-2·c − 43.39)²
pore EC = (80.3 − 0.37(T−20)) × bulk_EC / (ε − 2.90)                  Hilhorst
```

The **2.90** Hilhorst offset is fitted to this substrate — a peat and biochar mix — against the manufacturer's own app, and confirmed on two independent paired readings. The textbook value for mineral soil is 4.1.

---

## Domain language

A **stab** is one insertion of the probe into a bag.

**Reference depth** is about one inch from the bottom. **Mid-bag** is the vertical midpoint. Two-gallon rooms sample both at each position; 1.25-gallon rooms sample reference only.

**Positions** are front, center and header along a table. Odd tables run front to header, even tables header to front, so the operator snakes through the room without backtracking.

**Floors** are 22% VWC for 2-gallon bags and 30% for 1.25-gallon, at reference depth.

**Pore water EC** is what every irrigation decision is built on — target roughly 3 to 6. **Bulk EC**, which the sensor actually reports, runs 0.2 to 1.5. **They are not interchangeable and confusing them would be a serious error.**

**Immediately after watering, reference reads above mid** — that is perched water sitting at the bottom of the bag. After a day or more of free drainage the bottom sheds and the relationship inverts. This is why the inverted-profile warning is gated on hours since the last shot.

---

## What the app produces

**A CSV** — one row per reading, with position, depth, strain, flags, hours since shot, feed EC, operator and the raw sensor string. The raw string is kept deliberately: every value is recomputable if a calibration ever changes.

**A workbook paste block** — row notes in the operator's existing format, a notes-column paragraph, and a **CHECK** section of rule-generated warnings. This is pasted straight into the site's master workbook.

**CHECK rules:**

| Rule | Fires when |
|---|---|
| inverted profile | mid reads above reference by 2+ **and** hours since shot < 4 |
| dilution | table EC below 60% of measured feed EC **and** moisture near floor |
| no feed | two or more readings with bulk EC < 0.12 and VWC < 20 |
| table fault | half or more of a table's readings below floor |
| outlier | table median 10+ from room median, either direction |
| strain deviation | one table of a strain 8+ from its sibling tables |

Rules that fire on more than half the tables collapse into one room-level line. **Requires at least four tables sampled** — below that the collapse is misleading, since a triage deliberately targets bad tables.

---

## Architecture

```
index.html    markup and styles. Loads the three scripts in this order:
              rooms.js -> pure.js -> app.js. Order matters.
pure.js       calibration, parsing, route generation, workbook and CHECK builders
              no DOM, no Bluetooth — this is the testable half
app.js        BLE, capture state machine, UI, storage
rooms.js      room map, schedules, DOF, feed EC, manual-task durations.
              THE MONDAY FILE — changes weekly, carries ROOMDATA_ASOF at the
              top. A plain script, not JSON, so it works offline with no fetch.
              The setup screen shows the date and warns in amber past 7 days.
test/         harness.js · run_rooms.js · edge.js · smoke.js · recover.js · test.sh
```

**localStorage keys** are `stab_`-prefixed. `stab_prev` holds one entry per room-table-position-depth and is never trimmed — it powers the delta against the previous sweep. `stab_hist` holds 60 sessions. `stab_events` holds 400 shots, faults, bulbs and runoff samples.

---

## Editing rules

**Anchors must be unique and whole.** Replace whole statements or whole functions. Never a fragment ending at a brace — a nested `})();` once matched before the intended one and truncated the file.

**Rewrite the function rather than patch it** when the change touches the capture state machine, the overlay flags, or more than three sites — or when the previous edit in that area was itself unverified.

**Per release, bump five version strings:** `<title>`, the `.brand` div, the
`.v` div on the done screen, `VER` in pure.js, and the three `?v=` query
strings on the script tags in index.html.

**Delete retired code rather than disabling its entry point.** A dead branch that anchor searches have to see past is worse than no feature.

**Room data lives in `rooms.js`, not in the app code.** It changes every Monday. If a change requires editing schedules or DOF inside a source file, that is a signal the data has leaked back into the code.

---

## Things that are true and easy to get wrong

**Lights are 11 to 11.** AM rooms come on at 11 PM, PM rooms at 11 AM. A7 runs 7 to 7. The 1:15 first-irrigation time is not a lights event.

**Runoff EC does not describe the root zone in peat.** Cation exchange releases salt into draining water, so saucers read far higher than the bags they came from. Substrate EC decides; runoff volume is only a yes/no exchange check.

**Shot size, not daily volume, determines whether water reaches the bottom of a bag.** A room can receive adequate millilitres and still have a dry bottom third if each shot is too small.

**Field capacity depends on how long the room has been in flower** — about 44% at day 2, 48% at day 10, 55% at day 17, easing to 52% by day 25 in a 2-gallon bag. A new room's numbers should not be judged against the established band.
