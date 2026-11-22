# Fire Mage — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`fire_mage_spritesheet.png`**: a full-body, right-facing fire mage with dark hair, a short ember-red mantle, a charcoal coat, a copper clasp, dark leather boots, and a compact single-edged dagger with a copper guard and a hip sheath. Flame effects use yellow-white cores, orange edges and scattered deep-red embers. The dagger slash uses body and blade motion without flame.

| Property | Value |
|---|---|
| Image filename | `fire_mage_spritesheet.png` |
| Canvas | 576 × 1344 pixels |
| Grid | 6 columns × 14 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Animation count | 14 |
| Frame slots | 84: 83 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 5 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `caa3f0e1055042a6a6afb814fb4ac395dcf15c5eab7de5c4c1ffa252c46fa881` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible character, dagger, sheath and effects occupy different bounds in different poses. Preserve the complete cell when importing. The standing idle F1 silhouette, including costume and equipment, measures 32 × 52 pixels inside its 96 × 96 cell. The digest above identifies the exact PNG documented here.

The PNG contains pixels only. Playback durations, event triggers, collision shapes, world movement and state transitions below are implementation recommendations; they are not encoded animation metadata.

## 2. Coordinates and frame locations

All human-readable **rows and columns in this guide are numbered from 1**. Pixel coordinates and flattened frame indices start at **0**. The origin is the top-left of the image; x increases rightward and y downward.

Use rectangle notation **`(x, y, width, height)`**, with the right and bottom edges excluded. For row `r` and column `c`:

```text
x = (c - 1) * 96
y = (r - 1) * 96
rectangle = (x, y, 96, 96)
frameIndex = (r - 1) * 6 + (c - 1)
```

| Column / sequence frame | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

For example, the Firebolt release is **row 5, column 4**, rectangle **`(288, 384, 96, 96)`**, flattened index **27**. The invisible end of teleport-out is **row 9, column 6**, rectangle **`(480, 768, 96, 96)`**, index **53**. Keep that empty slot in the animation.

## 3. Animation catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. A loop wraps from column 6 to column 1. A one-shot plays once; its finish behavior is listed below.

| Row | Animation ID | Animation | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `idle` | Idle | 0 | 0–5 | Loop |
| 02 | `run` | Run | 96 | 6–11 | Loop |
| 03 | `jump` | Jump | 192 | 12–17 | Once; grounded locomotion |
| 04 | `flame_burst` | Flame Burst | 288 | 18–23 | Once; grounded locomotion |
| 05 | `firebolt` | Firebolt | 384 | 24–29 | Once; grounded locomotion |
| 06 | `dagger_slash` | Dagger Slash | 480 | 30–35 | Once; grounded locomotion |
| 07 | `hit` | Hit reaction | 576 | 36–41 | Once; controller decision |
| 08 | `death` | Death | 672 | 42–47 | Once; hold frame 6 |
| 09 | `teleport_out` | Teleport out | 768 | 48–53 | Once; hold invisible frame 6 |
| 10 | `teleport_in` | Teleport in | 864 | 54–59 | Once; idle or locomotion |
| 11 | `crouch` | Crouch entry | 960 | 60–65 | Once; hold frame 6 or crawl |
| 12 | `crawl` | Crawl | 1056 | 66–71 | Loop |
| 13 | `fly_up` | Fly up / ascent entry | 1152 | 72–77 | Once; hold frame 6 or directional flight |
| 14 | `directional_flight` | Directional flight | 1248 | 78–83 | Loop |

### Six-frame poses and starting timings

The following durations are **suggested milliseconds for columns 1–6**, not measured or embedded timings. Keep the listed frame order, then tune the durations to the game's movement speed and combat feel. A longer held windup should lengthen that frame's duration rather than duplicate or skip an unrelated pose.

### Row 01 — Idle

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Relaxed idle with dagger sheathed | gentle inhale | weight shifts | exhale | short mantle settles | return toward the first stance |

**Suggested durations:** `[140, 140, 140, 140, 140, 140]` ms; **total:** 840 ms. **Finish:** repeat.

### Row 02 — Run

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lead foot contact with forward lean | push and passing support | opposite leg reaches | opposite foot contact | opposite passing support | first leg reaches toward the next contact |

**Suggested durations:** `[80, 80, 80, 80, 80, 80]` ms; **total:** 480 ms. **Finish:** repeat.

### Row 03 — Jump

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Crouch | push off | rise | apex | descend | land in a crouch |

**Suggested durations:** `[80, 70, 110, 120, 110, 100]` ms; **total:** 590 ms. **Finish:** grounded locomotion.

### Row 04 — Flame Burst

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Plant the feet | pull the casting hand close | gather a compact flame | thrust an open palm and release the short fan of fire | fan breaks into embers | return to the normal sheathed-dagger idle |

**Suggested durations:** `[90, 100, 140, 90, 110, 110]` ms; **total:** 640 ms. **Finish:** grounded locomotion.

### Row 05 — Firebolt

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Raise the casting hand | gather a small flame | compress it into a bright orb | snap the hand forward with the bolt launch at the fingertips | hold the follow-through as the embers fade | return to the normal idle |

**Suggested durations:** `[90, 110, 150, 100, 100, 100]` ms; **total:** 650 ms. **Finish:** grounded locomotion.

### Row 06 — Dagger Slash

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Set the feet and grip the dagger | draw the dagger back | rotate the body into the swing | slash across the front near waist height | follow through low | return to idle with the dagger sheathed |

**Suggested durations:** `[75, 100, 85, 65, 105, 110]` ms; **total:** 540 ms. **Finish:** grounded locomotion.

### Row 07 — Hit reaction

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch at impact | recoil through the shoulders | stagger back | catch balance | straighten | return to idle |

**Suggested durations:** `[60, 75, 85, 90, 95, 110]` ms; **total:** 515 ms. **Finish:** controller decision.

### Row 08 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle | drop to one knee | tip sideways | hit the ground | settle with the body and equipment visible | hold the same fallen pose |

**Suggested durations:** `[110, 150, 160, 180, 180, 200]` ms; **total:** 980 ms. **Finish:** hold frame 6.

### Row 09 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace | narrow spiral of embers surrounds the body | silhouette becomes glowing cinders | cinders pull inward | last sparks fade | become completely transparent |

**Suggested durations:** `[90, 100, 110, 100, 90, 70]` ms; **total:** 560 ms. **Finish:** hold invisible frame 6.

### Row 10 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Single ember without a body | ember expands into a spiral | fiery silhouette forms | costume and dagger resolve | boots plant as the sparks fade | normal idle stance |

**Suggested durations:** `[80, 100, 110, 110, 90, 100]` ms; **total:** 590 ms. **Finish:** idle or locomotion.

### Row 11 — Crouch entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | lower the hips | tuck the arms and mantle close | settle into the low crawl-ready stance | hold the same low pose | hold, matching crawl F1 |

**Suggested durations:** `[70, 80, 80, 90, 90, 90]` ms; **total:** 500 ms. **Finish:** hold frame 6 or crawl.

### Row 12 — Crawl

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Low starting hand-and-knee support | shift to the next support | pass the free limbs forward | alternate hand and knee support | advance the next knee and hand | recover toward the first low pose |

**Suggested durations:** `[120, 120, 120, 120, 120, 120]` ms; **total:** 720 ms. **Finish:** repeat.

### Row 13 — Fly up / ascent entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | gather flame beneath the boots | lift off | straighten into upright ascent | small embers trail down | hold the upright ascent silhouette |

**Suggested durations:** `[90, 110, 120, 140, 140, 160]` ms; **total:** 760 ms. **Finish:** hold frame 6 or directional flight.

### Row 14 — Directional flight

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lean forward with legs and fire trail behind | mantle and rearward flame shift | upper bob with trailing legs | passing flame and mantle ripple | lower bob | recover toward the first flight pose |

**Suggested durations:** `[90, 90, 90, 90, 90, 90]` ms; **total:** 540 ms. **Finish:** repeat.

### Suggested gameplay event points

These hooks are starting choices for the controller, not hitboxes or automatic effects contained in the PNG. Dispatch each event **once when entering its frame**, not on every render update.

| Action | Suggested frame | Controller action |
|---|---|---|
| Jump | Row 3, F2 | Begin the physical jump when the movement controller permits takeoff. |
| Flame Burst | Row 4, F4 | Enable the short close-range fire area when the fan appears. The local fan is already in the sprite; damage, reach and duration are separate game rules. |
| Firebolt | Row 5, F4 | Spawn the separate traveling firebolt at a hand socket. The sheet includes only the launch flash and nearby embers. |
| Dagger Slash | Row 6, F4 | Enable the physical blade contact window. Keep the hitbox tied to the dagger, then disable it during recovery; no fire damage or flame effect is implied by this row. |
| Teleport out | Row 9, F6 | The sprite is invisible. Transfer the actor to its destination, then begin teleport-in there. |
| Jump landing | Row 3, F6 | Play the landing visual on actual ground contact. The image alone does not determine contact. |

## 4. Building and playing the sequences

### Import and slice

1. Import the original PNG with nearest-neighbor/point sampling. Preserve its alpha channel and native pixel dimensions.
2. Slice a regular grid with frame size **96 × 96**, offset **(0, 0)**, margin **0**, spacing **0**, six columns and fourteen rows.
3. Keep all 84 cells, including row 9 column 6. Disable automatic removal of empty frames and automatic cropping to the visible silhouette.
4. Assign the same logical pivot to every cell. A convenient choice is **(48, 85)**: horizontal cell center and the boundary immediately below ground-contact pixel 84. In a top-left normalized convention this is `(0.5, 85/96)`; convert the y convention if the engine measures pivots upward from the bottom.
5. Build each named animation from its row's six rectangles. Use the loop and finish settings from the catalog.

The original art's nominal horizontal body anchor is near x43. That is an artwork-registration point, not an instruction to change the pivot every frame. The proposed center pivot is a consistent engine convention. A different fixed pivot is also workable if all drawing, attachments and collision positions use it consistently.

### JavaScript example: descriptors, sampling and drawing

This engine-neutral example builds every sequence, supports uneven frame durations, and draws a complete cell around a fixed pivot. It assumes the PNG has already been loaded into `image`. The game decides which clip to play and what to do when it finishes.

```javascript
const HERO_CELL = 96;
const HERO_COLUMNS = 6;
const HERO_PIVOT = { x: 48, y: 85 };

const heroSpecs = [
  {"id":"idle","row":1,"loop":true,"ms":[140,140,140,140,140,140],"finish":"repeat"},
  {"id":"run","row":2,"loop":true,"ms":[80,80,80,80,80,80],"finish":"repeat"},
  {"id":"jump","row":3,"loop":false,"ms":[80,70,110,120,110,100],"finish":"grounded locomotion","events":{"2":"takeoff_request","6":"landing_visual"}},
  {"id":"flame_burst","row":4,"loop":false,"ms":[90,100,140,90,110,110],"finish":"grounded locomotion","events":{"4":"flame_burst_contact"}},
  {"id":"firebolt","row":5,"loop":false,"ms":[90,110,150,100,100,100],"finish":"grounded locomotion","events":{"4":"firebolt_release"}},
  {"id":"dagger_slash","row":6,"loop":false,"ms":[75,100,85,65,105,110],"finish":"grounded locomotion","events":{"4":"dagger_contact"}},
  {"id":"hit","row":7,"loop":false,"ms":[60,75,85,90,95,110],"finish":"controller decision"},
  {"id":"death","row":8,"loop":false,"ms":[110,150,160,180,180,200],"finish":"hold frame 6"},
  {"id":"teleport_out","row":9,"loop":false,"ms":[90,100,110,100,90,70],"finish":"hold invisible frame 6","events":{"6":"invisible_destination_transfer"}},
  {"id":"teleport_in","row":10,"loop":false,"ms":[80,100,110,110,90,100],"finish":"idle or locomotion"},
  {"id":"crouch","row":11,"loop":false,"ms":[70,80,80,90,90,90],"finish":"hold frame 6 or crawl"},
  {"id":"crawl","row":12,"loop":true,"ms":[120,120,120,120,120,120],"finish":"repeat"},
  {"id":"fly_up","row":13,"loop":false,"ms":[90,110,120,140,140,160],"finish":"hold frame 6 or directional flight"},
  {"id":"directional_flight","row":14,"loop":true,"ms":[90,90,90,90,90,90],"finish":"repeat"},
];

const HERO_ANIMATIONS = Object.fromEntries(heroSpecs.map(spec => {
  const frames = spec.ms.map((durationMs, column0) => ({
    column: column0 + 1,
    index: (spec.row - 1) * HERO_COLUMNS + column0,
    rect: { x: column0 * HERO_CELL, y: (spec.row - 1) * HERO_CELL,
            width: HERO_CELL, height: HERO_CELL },
    durationMs,
    enterEvent: spec.events?.[column0 + 1] ?? null
  }));
  return [spec.id, { ...spec, frames,
    durationMs: spec.ms.reduce((sum, ms) => sum + ms, 0) }];
}));

function sampleHero(clip, elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  const complete = !clip.loop && elapsed >= clip.durationMs;
  if (complete) return { frame: clip.frames[5], complete: true };
  let t = clip.loop ? elapsed % clip.durationMs : elapsed;
  for (const frame of clip.frames) {
    if (t < frame.durationMs) return { frame, complete: false };
    t -= frame.durationMs;
  }
  return { frame: clip.frames[5], complete };
}

function drawHero(ctx, image, frame, rootX, rootY, scale = 1, faceLeft = false) {
  const r = frame.rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(rootX, rootY);
  ctx.scale(faceLeft ? -scale : scale, scale);
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    -HERO_PIVOT.x, -HERO_PIVOT.y, HERO_CELL, HERO_CELL);
  ctx.restore();
}

// Example selection:
const cast = HERO_ANIMATIONS.firebolt;
const sample = sampleHero(cast, 370); // sample.frame is the Firebolt release frame.
```

`sampleHero` does not dispatch events. Track crossed frame boundaries separately, including every boundary crossed by a long update, and dispatch each `enterEvent` once. The finite duration of the final frame does not force the sprite to disappear: the controller can keep sampling the completed clip, which returns F6, until it selects the next animation. Reset elapsed time when a new one-shot begins.

### State transitions

| Current action | Recommended continuation |
|---|---|
| Idle / run | Switch according to horizontal movement input; apply world translation in the movement controller. |
| Jump | Use F1–F2 for takeoff, F3 while rising, F4 near the apex, F5 while falling, then F6 on contact. Holding an air pose to match physics is preferable to repeatedly restarting the whole row. |
| Flame Burst / Firebolt / Dagger Slash | Finish recovery, then select idle or locomotion if the character is still able to act. |
| Hit | Return to the controller's appropriate ground or air state; a lethal hit can instead enter death. |
| Death | Hold F6. Despawning, resurrection or a scene change is a separate game decision. |
| Teleport out | Hold the invisible F6 until destination transfer is ready; start teleport-in at the destination. |
| Teleport in | F6 is exactly idle F1, so idle can continue without a pose jump. |
| Crouch | Hold F6 while stationary; enter crawl at F1 when moving low. |
| Crawl | Loop while moving; return to the shared low hold when stopping. |
| Stand from crouch | There is no separate stand-up row. An optional reverse sequence such as crouch F6 → F3 → F2 → F1 uses existing art; tune its timings and clearance checks. |
| Fly up | Play once, then hold F6 while continuing upright ascent or select directional flight when moving horizontally. There is no separate six-frame vertical-ascent loop. |
| Directional flight | Repeat F1–F6 at a fixed visual root; the movement controller supplies travel. |

## 5. Important integration notes

### Exact transition frames in the delivered PNG

These equalities were verified from the final frame pixels, not merely assumed from the requested animation plan:

| Relationship | Result |
|---|---|
| Death, row 8 F5 and F6 | Identical fallen pose, including the dagger and sheath. |
| Crouch, row 11 F4, F5 and F6 | Identical low hold. |
| Crouch, row 11 F6 and crawl, row 12 F1 | Identical pose and placement. |
| Flame Burst, Firebolt, Dagger Slash and hit reaction, rows 4–7 F6 | Each is exactly idle, row 1 F1. |
| Teleport-in, row 10 F6 and idle, row 1 F1 | Identical pose and placement. |
| Teleport-out, row 9 F6 | Fully transparent; still a valid 96 × 96 frame. |

### Ground, jump, hover and effects

Grounded poses use a **nominal** contact line at local y84. The standing poses, crouch, crawl, grounded landings and fallen hold all use this line. The airborne parts of run, jump and flight contain intentional offsets. A spell or trailing particle can extend below the boots, so do not infer collision contact from the last opaque pixel.

| Row / effect | Measured local lowest visible pixel, F1–F6 | Meaning |
|---|---|---|
| Run, row 2 | `[84, 83, 81, 84, 83, 81]` | Foot-contact phases F1 and F4 touch y84; passing and airborne poses sit slightly above it. |
| Jump, row 3 | `[84, 83, 76, 71, 80, 84]` | Includes the small drawn rise and apex; these values are not a physics trajectory. |
| Flame Burst, row 4 | `[84, 84, 84, 84, 84, 84]` | The short flame fan and embers remain above the common ground contact in this export. |
| Fly up / ascent entry, row 13 | `[84, 84, 83, 82, 80, 81]` | The measured bottom can be a flame or ember rather than the sole of a lifted boot. |
| Directional flight, row 14 | `[77, 74, 74, 75, 76, 79]` | Includes the small body bob and the changing rearward fire trail; the root remains fixed. |

Do not realign those rows to their visible bottom: doing so would remove the jump, move the body when an effect appears, or cancel the flight offset. Keep the fixed cell pivot and apply game movement separately. Account for the modest visual offsets when authoring precise collision and attachment positions.

The local Flame Burst fan, Firebolt launch flash, teleport cinders, takeoff flame and rearward flight trail are already drawn in the cells. The traveling firebolt is a separate sprite or effect controlled by the game. The physical dagger attack has no magical flame. Keep the dagger sheathed in idle, run and crawl, and use the row 6 recovery to return to that normal equipment state. The game supplies damage rules, projectile travel, collision masks and destination transfer. Author spell sockets and hitboxes per pose when precision matters; full-cell rectangles and opaque-pixel bounds are not gameplay collision shapes.

Use integer display scales when practical and avoid smoothing or lossy recompression. Every visible frame has at least five pixels of cell-edge padding. If repacking into a filtered texture atlas, handle texture bleeding with the atlas tool's padding/extrusion settings while preserving the original frame size and pivot offsets. Flipping left should mirror the complete cell and its local sockets consistently. Do not flip or move just the visible character independently of the effects.

## 6. Exact rectangle appendix

Every entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order. These rectangles include the complete transparent padding, equipment and local effects.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `run` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `jump` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `flame_burst` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `firebolt` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `dagger_slash` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `hit` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `death` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `teleport_out` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `teleport_in` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `crouch` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `crawl` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `fly_up` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `directional_flight` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |

Row 9 F6 must remain present even though its rectangle contains no visible pixels. The animation IDs, timings and event names in this guide are suggested integration names; rename them to fit the game without changing the atlas coordinates.
