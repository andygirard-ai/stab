---
name: growlink-developer-api
description: Complete all-in-one reference for building apps against the Growlink Developer API — authentication, request conventions, discovery, unit-of-measure preferences, live sensor polling, device state & control per interface type, historical sensor and device charting with every known rendering detail, device runtime logs, and the users and tasks endpoints.
---

# Growlink Developer API — complete implementation guide

Everything needed to build an app against the Growlink Developer API, in one
file: the endpoints, the enums, and proven implementation patterns. The
guidance is framework-agnostic — the patterns work identically in React,
Angular, Vue, or plain JavaScript.

---

## 1. Base URL & authentication

```js
const BASE_URL = 'https://api.developer.growlink.com';    // production
```

Every request carries two kinds of headers:

```
Gl-Api-Key: <key>          ← the user's API key
Uom-Temp: 1                ← five numeric unit-preference headers (see §3)
Uom-Vpd: 8
Uom-Tds: 6
Uom-Light: 16
Uom-Volume: 42
```

- Users get their key from the Growlink portal under **Builder →
  Authentication**. Treat it like a password: it grants read access to the
  whole organization and (via device endpoints) **control of real hardware**.
- **Never hard-code a key into source files.** Ask for it at runtime and keep
  it in `sessionStorage` only (forgotten when the tab closes). Tell users to
  rotate it immediately if it leaks.
- Validate a key with `GET /api/v2/organizations` — 401 means invalid; an empty
  list means valid but no organizations linked.

## 2. Conventions that apply to every endpoint

1. **Enums are numeric** — the API accepts and returns numbers, never string
   names. Cache the number → label tables locally (Growlink recommends this);
   never call the API to resolve a label. (All tables in §9.)

2. **Keys may be PascalCase** (`Id`/`Name`) or camelCase. Normalize
   recursively:

   ```js
   function normalizeKeys(value) {
     if (Array.isArray(value)) return value.map(normalizeKeys);
     if (value && typeof value === 'object') {
       const out = {};
       for (const [k, v] of Object.entries(value)) {
         out[k.charAt(0).toLowerCase() + k.slice(1)] = normalizeKeys(v);
       }
       return out;
     }
     return value;
   }
   ```

3. **Lists are wrapped — usually.** `{ organizations: [...] }`,
   `{ rooms: [...] }`, `{ sensors: [...] }`, `{ devices: [...] }`,
   `{ sensorData: [...] }`, `{ deviceData: [...] }`, but a bare array may
   also arrive. Accept both:

   ```js
   function unwrapList(data, key) {
     if (Array.isArray(data)) return data;
     return data?.[key] ?? [];
   }
   ```

4. **Errors:** network failure → "Could not reach the Growlink API"; 401 →
   "Invalid API key"; other non-2xx → include the HTTP status. Write
   endpoints may return **no body** — never call `response.json()`
   unconditionally.

5. **IDs are GUID strings** — compare case-insensitively (lowercase before
   using as map keys); live-data responses can differ in casing from
   discovery responses.

6. **Recommended app flow:** login (validate key) → organization picker
   (default to first) → room list as clickable cards → room detail screen.

## 3. Unit-of-measure preferences

**The golden rule: never do unit math in the client.** The API converts
everything server-side based on the `Uom-*` headers: live values AND their
ready-made `suffix` strings, history values AND their `unit` labels AND the
suggested `yAxis` bounds. "Supporting units" = send headers, persist the
choice, **re-fetch when a preference changes**.

| Header | Choice | Values |
| --- | --- | --- |
| `Uom-Temp` | Temperature | `0` = °C, `1` = °F *(default 1)* |
| `Uom-Vpd` | VPD | `8` = kPa, `9` = mbar *(default 8)* |
| `Uom-Tds` | TDS | `3` = PPM, `6` = EC *(default 6)* |
| `Uom-Light` | Light | `7` = Lux, `16` = PPFD *(default 16)* |
| `Uom-Volume` | Volume | `42` = Gallons, `43` = Liters *(default 42)* |

Pattern: persist preferences in `localStorage` (a preference, not a secret —
unlike the API key), build the headers **at call time** so changes apply to
the next request, render five `<select>` pickers, and on change immediately
re-fetch whatever is on screen.

## 4. Discovery endpoints

Fetch once per screen and cache — metadata never changes between data polls.

| Endpoint | Returns |
| --- | --- |
| `GET /api/v2/organizations` | `{ organizations: [{ id, name }] }` — also the key check |
| `GET /api/v2/organization/{orgId}/rooms` | `{ rooms: [{ id, name, roomType }] }` |
| `GET /api/v2/room/{roomId}/sensors` | `{ sensors: [{ id, name, sensorType, unitOfMeasure, metric, moduleId, moduleName }] }` |
| `GET /api/v2/room/{roomId}/devices` | `{ devices: [{ id, name, deviceType, interfaceType, ...interface objects }] }` (§6) |
| `GET /api/v2/organization/{orgId}/users` | `{ users: [{ id, emailAddress, firstName, lastName }] }` — cache the id → name map (§8) |

Other useful endpoints:

- `GET /api/v2/room/{roomId}/climate/setpoints` — climate setpoints +
  day/night schedule for Production / Non-Production rooms.
- `GET /api/v2/organization/{orgId}/sensors/alerts/active` —
  `{ sensorAlerts: [{ id, sensorId, sensorName, comparisonType, threshold, roomId, roomName }] }`
  (`comparisonType`: 0 = Above, 1 = Below).

## 5. Live sensor data

```
POST /api/v2/organization/{orgId}/sensors/data/live
Body: { "sensorIds": [...] }
→ { "sensorData": [{ sensorId, metric, unitOfMeasure, value, timestamp, suffix }] }
```

Rules:

1. **Always batch — never call per sensor.** One request per poll tick.
2. **Poll every 30 seconds** (the portal's own cadence): immediate fetch,
   then `setInterval`; **stop polling when the user leaves the screen**.
3. **Sensors with no recent data are omitted** — not an error. Show "No
   recent data"; the next poll fills it in.
4. Key readings by `sensorId.toLowerCase()`.
5. Display `value` + `suffix` (both already in the caller's units); fall back
   to the local UOM symbol table (§9) only if `suffix` is missing. Show the
   reading's `timestamp` so stale data is visible.
6. Group cards by `metric` — prefer the live reading's metric, fall back to
   discovery metadata.
7. On a failed poll, keep showing last-good readings; surface the error
   separately.
8. If unit preferences change while open, trigger an immediate re-poll.

## 6. Device state & control

⚠️ **These endpoints command real hardware.** Forcing a device overrides its
automation until `auto` is restored. Put a visible warning in any control UI.

### 6.1 `interfaceType` drives the control UI

| `interfaceType` | Render | Metadata object |
| --- | --- | --- |
| `0` Default | ON / AUTO / OFF buttons | — |
| `1` Numeric | **read-only** value + unit | `numericValueInterface` `{ unitOfMeasure, metric }` |
| `2` On/Off | ON / AUTO / OFF buttons | — |
| `3` Percentage slider | buttons + slider (`%`) | `percentageSliderInterface` |
| `4` 4–20 mA slider | buttons + slider (`mA`) | `fourToTwentyMilliampSliderInterface` |
| `5` 0–10 V slider | buttons + slider (`V`) | `zeroToTenVoltSliderInterface` |
| `6` BACnet dropdown | **read-only** option name | `bacnetDropdownInterface` `{ dropdownOptions: [{ optionName, bacnetValue }] }` |
| `7` Textbox | **read-only** text | — |

- Slider metadata: `{ unitOfMeasure, minimumSliderValue, maximumSliderValue,
  sliderStepSize }` → slider min/max/step (defaults 0/100/1).
- Types **1, 6, 7 are automation-only** — the set-state endpoint rejects
  manual commands; show "Controlled by automation".
- Group cards by `deviceType` (equipment category — table in §9).

### 6.2 Live device state — derive it, the API doesn't return it

```
POST /api/v2/organization/{orgId}/devices/data/live
Body: { "deviceIds": [...] }
→ { "deviceData": [{ deviceId, isActive, isManual, throttle, customValue, timestamp }] }
```

| `isManual` | `isActive` | State | Badge |
| --- | --- | --- | --- |
| `true` | `true` | ForcedOn (`2`) | ON |
| `true` | `false` | ForcedOff (`-2`) | OFF |
| `false` | `true` | AutoOn (`1`) | AUTO ON |
| `false` | `false` | AutoOff (`-1`) | AUTO OFF |
| — | `null` | NoChange (`0`) | AUTO / unknown |

```js
function deriveDeviceState(isActive, isManual) {
  if (isActive == null) return 0;
  if (isManual) return isActive ? 2 : -2;
  return isActive ? 1 : -1;
}
```

- `isManual === true` → show a "manual override — automation is paused" note.
- `throttle` (0–100) is only meaningful for slider types (3/4/5); `0`/`null`
  otherwise — don't render a level indicator for non-slider devices.
- `customValue` carries the value for Numeric (`1`) devices and the
  `bacnetValue` for BACnet dropdowns (`6`) — map to the matching
  `optionName` for display.
- Omitted devices = no state data → "No recent data", controls disabled.
- Poll batched every 30 seconds, same as sensors (§5).

### 6.3 Commands

```
PUT /api/v2/room/{roomId}/device/{deviceId}/state?value=<value>
```

| `value` | Effect |
| --- | --- |
| `true` | Force **ON** (overrides all automation rules and setpoints) |
| `false` | Force **OFF** (overrides all automation rules and setpoints) |
| `auto` | Return to automatic control (clears the manual override) |
| number 1–100 | Output level for slider devices (maps to the interface's range) |

- No response body — treat 2xx as accepted.
- **After every command, immediately re-poll live data to confirm** (the
  documented pattern). Disable that device's controls and show a pending
  indicator until the confirmation poll returns.
- Sliders: stage the value while dragging; send only on release (native
  `change` event), never per `input` tick.

## 7. Historical data & charting

### 7.1 The endpoint is already chart-shaped

```
POST /api/v2/organization/{orgId}/sensors/data/chart
Body: { "sensorIds": [...], "start": "<ISO>", "end": "<ISO>", "includeDayNight": true }
```

```json
{
  "series": [{
    "name": "Air Temperature",
    "seriesType": 1,
    "unit": "°F",
    "yAxis": { "min": 60, "max": 90, "tickAmount": 6 },
    "data": [{ "x": "2026-06-01T00:00:00Z", "y": 72.1 }]
  }],
  "dayNight": [{ "x": "...T06:00:00Z", "y": 1 }, { "x": "...T20:00:00Z", "y": 0 }]
}
```

- `seriesType` — series of the **same type must share one y-axis**.
- `unit` and `yAxis` bounds arrive already converted to the `Uom-*` headers —
  use the suggested bounds as-is.
- `data[].y` can be `null` (gaps).
- `dayNight`: `y=1` starts a DAY period, the next `y=0` ends it (night
  begins). Walk in pairs to shade nights.
- **Resolution is automatic:** ≤1 h → 5-min, ≤7 d → 10-min, ≤14 d → 1-hour,
  >14 d → 1-day. **Beyond 7 days is slow** — show a loading note.
- One request covers all selected sensors; re-fetch on any change to
  selection, range, or unit preferences.

UI shape that works well: sensor picker grouped by metric (checkboxes),
time-range presets (1h/24h/7d/14d/30d), a custom legend with last values, and
the chart.

### 7.2 The six ApexCharts rendering details

**#1 — Day/night shading is a hidden series, not an annotation.** Map the
markers to a step-line **area** series at index 0 with y values **inverted**
(night `y=0` → `100`, day `y=1` → `0`) so the fill covers night bands.
Annotations live in a separate layer that can drift; a series pans/rescales
in lockstep for free. Stroke width `0`, dark translucent fill (e.g. `#101813`
at 0.5), and its **own hidden y-axis pinned to `[0, 100]`** — unpinned, an
all-night dataset would auto-scale and the shading would stop mid-chart.
Index 0 is load-bearing: axes, stroke/fill arrays, and the tooltip all
skip/offset around it.

**#2 — Shared y-axis scales must be pinned.** ApexCharts pairs `yaxis[i]`
with `series[i]`, so every series needs an axis entry in order. Group by
`seriesType` (fallback: same `unit`). The group's first series gets the
visible axis using the API's suggested bounds; every other member gets a
hidden "follower" axis referencing the leader via `seriesName` **and pinning
the exact same min/max** (the union of the group's bounds, falling back to
data extents). A hidden axis without explicit bounds is still auto-scaled
independently — silently breaking the shared scale.

**#3 — The shared tooltip must be custom.** Sensors report on different time
grids; the built-in shared tooltip drops series without a point at the exact
hovered x. In a custom tooltip, for each series (skipping index 0) walk its
own `w.globals.seriesX[i]` **backwards** to the most recent point
at-or-before the hovered time; render carried-forward values at ~0.4 opacity
so inferred values are distinct from measured ones. Carry per-series units in
a side array — Apex doesn't.

**#4 — Stabilize x-axis labels.** Blank every other label, round the rest to
the nearest 30 minutes (consecutive refreshes produce identical text — no
jitter), `hideOverlappingLabels: true`, and derive `tickAmount` from measured
container width (≈ one label per 250 px, clamped 3–8, via ResizeObserver).

**#5 — Disable animations.** Selection/range/unit changes replace the whole
dataset; Apex's tween between unrelated datasets is flicker and can mis-draw
the day/night area. `animations: { enabled: false }`; with core ApexCharts
use `chart.updateOptions(config, false, false)`.

**#6 — `fill.opacity` IS the line opacity.** For `line`-type series,
`stroke.colors` sets the hue but the line's **opacity comes from
`fill.opacity`** ("fill" is a misnomer — nothing is filled). Setting it to 0
makes every line invisible while tooltip and legend keep working. Keep it at
`1` for lines (the 0.5 at index 0 is the day/night wash).

Other charting notes: assign palette colors on the full sorted series list
(not the visible subset) so colors survive legend toggling; sort by
`seriesType` then name for stable order; implement legend toggling by
rebuilding the series/axis arrays from state, not Apex's `toggleSeries()`
(it fights framework-driven updates); never hide the last visible series (an
empty chart throws); convert `x` to epoch ms; hide Apex's built-in legend
(it would list the DayNight helper) and render your own; wrapping core
`apexcharts` directly (mount/update/destroy) works identically in React,
Angular, and Vue.

### 7.3 Device history — the same chart, plus a runtime log

Devices have their own pair of history endpoints. The **chart** one returns
the identical `series` shape as §7.1, so it feeds the same chart component
and can be overlaid on sensor data:

```
POST /api/v2/organization/{orgId}/devices/data/chart
Body: { "deviceIds": [...], "start": "<ISO>", "end": "<ISO>" }
→ { "series": [{ name, seriesType: 256, unit, yAxis: { min, max }, data: [{ x, y }] }],
    "dayNight": [] }
```

- **No `includeDayNight` flag** — `dayNight` is always empty here. If a
  device chart needs shading, fetch the markers from the sensor endpoint
  (§7.1) and reuse them.
- `yAxis` has **`min`/`max` only — no `tickAmount`**. Derive ticks yourself
  or let Apex pick.
- `seriesType` is **always `256`** (Device State), so every device lands on
  one shared axis and never joins a sensor group. `unit` is `"%"` for on/off
  and throttled devices, and an **empty string** for devices plotting a raw
  BACnet number (device-specific scale — give those their own axis).
- Each `y` is one number, resolved in this order: a numeric BACnet reading if
  the device reports one → else the throttle percentage (1–100) for slider
  devices (3/4/5) → else `100` on / `0` off.
- **Plot device series as a step line, never a smooth curve.** The value only
  changes at the recorded timestamps; interpolating between them draws a ramp
  that never happened. Per-series `stroke.curve` — see rendering detail #1 for
  how ApexCharts pairs arrays by index.
- Devices with no state changes in the window are omitted from `series`.

The **log** endpoint gives you the runs between those points — the right
shape for runtime totals, duty-cycle reports and timeline bars:

```
POST /api/v2/organization/{orgId}/devices/data/log
Body: { "deviceIds": [...], "start": "<ISO>", "end": "<ISO>" }
→ { "devices": [{ id, name, logs: [{ on, off, onDurationInSeconds, isManual }] }] }
```

- A period opens when the device switched on and closes at the first
  switch-off. **Only on/off splits a period** — throttle and BACnet changes
  during a run do not, so a light dimmed mid-run stays one period.
- **A device still running when the window ends has no period reported** for
  that run; runs appear only once closed. Widen the range, or read the
  current state from live device data (§6.2), to account for a device that is
  on right now.
- `isManual` describes how the run *started* — `true` a person forced it on,
  `false` automation did. Use it to split scheduled runtime from overrides.
- Sum `onDurationInSeconds` per device for total runtime over the window.
- Devices with no completed period are omitted.

## 8. Users & tasks

Tasks are the organization's work list — assignable, taggable, room-scoped or
org-wide. Every path below is under
`/api/v2/organization/{orgId}`. Pair them with
`GET .../users` (§4) to resolve assignees.

### 8.1 The task shape

Every read endpoint returns this shape:

```json
{
  "id": "uuid", "title": "Clean the drip emitters", "description": "...",
  "status": 2, "priority": 2,
  "dueTimestamp": "2026-06-10T17:00:00Z",
  "startedTimestamp": "2026-06-09T15:04:00Z",
  "completedTimestamp": null,
  "tags": ["irrigation", "maintenance"],
  "roomId": "uuid|null", "userId": "uuid|null",
  "notes":  [{ "id": "uuid", "body": "...", "createTimestamp": "<ISO>" }],
  "images": [{ "id": "uuid", "base64Image": "...", "contentType": "image/png",
               "createTimestamp": "<ISO>" }]
}
```

- **`status` is calculated, never stored** — Started once `startedTimestamp`
  is set, Complete once `completedTimestamp` is set, Past Due when
  `dueTimestamp` has passed while still open, otherwise Open (`1`). Don't try
  to write it; move a task with the start/complete endpoints.
- `roomId` is `null` for org-scoped tasks; `userId` is `null` when unassigned.
- **`notes` and `images` are only populated by get-by-id.** Search always
  returns them empty — re-read the task to render its detail view.

### 8.2 Reading tasks

```
GET  /task/{taskId}      → the task, with notes and images. 404 if not found.
POST /tasks/search       Body: { status?, priority?, roomIds?, userIds?, tags? }
                         → { "tasks": [...] }, notes/images empty
```

- Populated search filters combine with **AND**; every one is optional.
- **`status` and `priority` are bit flags — add them** to match several at
  once (`10` = 2 Started + 8 Past Due). Omitting `status` defaults to `11`
  (Open + Started + Past Due), i.e. everything unfinished; send `4` for
  completed tasks. Omitting `priority` returns all priorities.
- `roomIds` / `userIds` each match **any** of the ids given. Include the empty
  GUID `00000000-0000-0000-0000-000000000000` in `roomIds` to also match tasks
  belonging to no room.
- `tags` matches a task carrying **at least one** of the tags.
- **Not paginated** — the whole matching set returns at once, capped at 5,000
  tasks. Filter server-side rather than fetching broadly and filtering in the
  client.

### 8.3 Writing tasks

| Call | Body / query | Response |
| --- | --- | --- |
| `POST /task` | `{ title*, description?, priority?, tags?, userId?, roomId?, dueTimestamp? }` | `200` + the created task |
| `PUT /task/{taskId}` | same shape | `204` |
| `PUT /task/{taskId}/start?timestamp=<ISO>` | — | `204` |
| `PUT /task/{taskId}/complete?timestamp=<ISO>` | — | `204` |
| `POST /task/{taskId}/note` | `{ note* }` | `204` |
| `POST /task/{taskId}/image` | `{ base64Image*, contentType* }` | `204` |
| `DELETE /task/{taskId}` | — | `204` |

- **Update is a full replacement, not a patch.** Anything left off the request
  is **cleared** — room, assignee, tags, due date included. Always get the
  task by id first and send every value back with your edit applied. Progress
  timestamps are untouched by an update.
- **Omitting `priority` stores the task as High**, not medium. Always send it
  explicitly.
- **Tags cannot contain a comma, semicolon or colon** — those delimit the
  search filter, and a tag containing one is rejected with `400`.
- `timestamp` on start/complete is an optional **query parameter**; omit it to
  use now. Start a task before completing it if you want its runtime recorded
  (duration is calculated server-side from the started timestamp). A task
  already complete is left untouched by either call.
- **Notes and images are additive** — each call appends and leaves existing
  ones, and the task's progress, alone. Re-read by id to show them.
- **Images are JSON, not multipart.** Send raw Base64 in `base64Image` and
  strip any `data:image/jpeg;base64,` prefix first.
- **Delete is permanent** and takes the notes and images with it — no undo, no
  soft delete. To clear a task off the open list while keeping its history,
  complete it instead. Confirm with the user before deleting.

## 9. Enum tables (cache locally)

**RoomType:** `0` Production, `1` Non-Production, `2` Fertigation.

**SensorMetric** (group sensor UI by this):
`0` Temperature, `1` Humidity, `2` Acidity (pH), `3` CO2 Level, `4` Total
Dissolved Solids (TDS), `5` Float Level, `6` Light Level, `7` Battery Level,
`8` Vapor Pressure Deficit (VPD), `9` Water Content, `10` Electrical
Conductivity (EC), `11` Voltage, `12` Electric Current, `13` Dissolved
Oxygen, `14` Flow Rate, `15` Switch State, `16` Vapor Pressure,
`17` Atmospheric Pressure, `18` Wind Direction, `19` Wind Speed, `20` PAR,
`21` Precipitation, `22` Daily Light Integral (DLI), `23` Electrical
Resistance, `24` Reactive Oxygen Species (ROS), `25` Color Temperature,
`26` Light Flicker, `27` Water Pressure, `28` Oxidation Reduction Potential
(ORP), `29` Tank Level, `30` Tank Volume, `31` Air Velocity, `32` Auxiliary
Flow Rate, `33` Injection Ratio, `34` Stock Tank Concentration, `35` Light
On/Off, `255` None.

**UnitOfMeasure → display symbol:**

```js
const UOM_SYMBOLS = {
  0: '°C', 1: '°F', 2: 'pH', 3: 'PPM', 4: '%', 5: 'High/Low', 6: 'EC',
  7: 'Lux', 8: 'kPa', 9: 'mbar', 10: 'V', 11: 'A', 12: 'On/Off', 13: 'gpm',
  14: '°', 15: 'm/s',
  16: 'μmol/m²/s', // PPFD; 20–28 are PPFD calibration variants, same symbol
  17: 'mm/hr', 18: 'mA', 19: 'in',
  20: 'μmol/m²/s', 21: 'μmol/m²/s', 22: 'μmol/m²/s', 23: 'μmol/m²/s',
  24: 'μmol/m²/s', 25: 'μmol/m²/s', 26: 'μmol/m²/s', 27: 'μmol/m²/s',
  28: 'μmol/m²/s',
  29: 'mol/m²/d', 30: 'Ω', 31: 'PPB', 32: 'dS/m', 33: 'μS/cm', 34: 'W/m²',
  35: 'K', 36: 'Hz', 37: 'mV', 38: 'psi', 39: 'bar', 40: 'L/min',
  41: 'm³/min', 42: 'gal', 43: 'L', 44: 'gal/hr', 45: 'L/hr', 46: 'in',
  47: 'm', 48: 'mph', 49: 'km/h', 50: 'mg/L', 51: 'ft/min', 52: 'mL/gal',
  53: 'mL/L', 255: '',
};
```

**DeviceType** (equipment category — group device UI by this):
`0` None, `1` Reservoir Chiller, `2` Reservoir Pump, `3` Light, `4` Fan,
`5` Heater, `6` Air Conditioner, `7` Humidifier, `8` Dehumidifier, `9` CO₂
Burner, `10` CO₂ Regulator, `11` Exhaust Fan, `12` Irrigation, `13` Dosing
Pump, `14` Reservoir Fill, `15` Reservoir Drain, `16` Not in Use, `17` Light
Analog, `18` Light PWM, `19` Dosing Pump (Inline), `20` Motor Vents,
`21` Thermal Screen, `22` Shading Screen, `23` Pad Pump, `24` Valve,
`25` Exclusive Valve, `26` Light Analog (HPS), `27` Light Analog (CMH),
`28` Light Analog (LED), `29` Batch Tank, `30`–`41` Light channel
intensities (White/Red/Deep Red/Far Red/UV/Spectrum/Blue/Green/Cool/Warm),
`255` Unknown.

**InterfaceType:** see the table in §6.1.

**DeviceState (derived):** `-2` ForcedOff, `-1` AutoOff, `0` NoChange,
`1` AutoOn, `2` ForcedOn.

**SeriesType** (`series[].seriesType` in the history endpoints): identical to
**SensorType** (`0`–`42`, `255`) plus `256` **Device State**. Sensor series
carry the sensor's own type; device series are always `256`.

**TaskStatus — bit flags:** `1` Open, `2` Started, `4` Complete, `8` Past Due.
Add them together to search across several states (`10` = Started + Past Due).
A task response always carries exactly one value; the search filter can carry
many. Calculated, never written.

**TaskPriority — bit flags:** `1` High, `2` Medium, `4` Low. Add them to
filter across several (`5` = High + Low). Send exactly one on create/update —
omitting it stores the task as High. A response can return `0` when the stored
priority is none of the three.

## 10. Where to look

Interactive API documentation with a request playground and mock responses
lives in the Growlink portal under **Builder → Playground**. **Nova**, the
portal's built-in AI assistant, can also generate code examples for any
endpoint.
