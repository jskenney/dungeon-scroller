# Earth Mage — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`earth_mage_spritesheet.png`**: a full-body, right-facing earth mage with dark hair, a short ochre mantle, a dark brown coat, a moss-green sash, and sturdy boots. A compact shield with a slate face, an iron rim, and a raised bronze boss stays strapped to his forward forearm. He casts with the other hand. Earth magic uses chunky slate fragments, warm sandstone highlights, and sparse dust; the physical shield bash has no magical effects.

| Property | Value |
|---|---|
| Image filename | `earth_mage_spritesheet.png` |
| Canvas | 576 × 1344 pixels |
| Grid | 6 columns × 14 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Visible idle bounds, including equipment | 36–39 × 51–53 pixels across row 1 |
| Animation count | 14 |
| Frame slots | 84: 83 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 5 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `be3e47838cfe25653139d507887146209d0101e69504c467b4af0cabcc6a26f5` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible character, shield and effects occupy different bounds in different poses. Preserve the complete cell when importing. The digest above identifies the final PNG documented here; measurements and exact transition matches below refer to that file.

The PNG contains pixels only. Playback durations, collision shapes, world movement and state transitions below are implementation recommendations; they are not encoded animation metadata. Event triggers are suggested controller hooks rather than embedded PNG behavior.

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

For example, the Stone Shot release is **row 5, column 4**, rectangle **`(288, 384, 96, 96)`**, flattened index **27**. The invisible end of teleport-out is **row 9, column 6**, rectangle **`(480, 768, 96, 96)`**, index **53**. Keep that empty slot in the animation.

## 3. Animation catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. A loop wraps from column 6 to column 1. A one-shot plays once; its finish behavior is listed below.

| Row | Animation ID | Animation | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `idle` | Idle | 0 | 0–5 | Loop |
| 02 | `run` | Run | 96 | 6–11 | Loop |
| 03 | `jump` | Jump | 192 | 12–17 | Once; grounded locomotion |
| 04 | `stone_eruption` | Stone Eruption | 288 | 18–23 | Once; grounded locomotion |
| 05 | `stone_shot` | Stone Shot | 384 | 24–29 | Once; grounded locomotion |
| 06 | `shield_bash` | Shield Bash | 480 | 30–35 | Once; grounded locomotion |
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
| Low shield guard | breathe in | shift weight | breathe out | ochre mantle sways | settle toward the first stance |

**Suggested durations:** `[140, 140, 140, 140, 140, 140]` ms; **total:** 840 ms. **Finish:** repeat.

### Row 02 — Run

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lead-foot contact | passing pose | opposite leg reaches | opposite-foot contact | opposite passing pose | first leg reaches toward contact |

**Suggested durations:** `[80, 80, 80, 80, 80, 80]` ms; **total:** 480 ms. **Finish:** repeat.

The shield stays close to the torso so the alternating legs remain visible. The run cycle is drawn in place; the movement controller supplies travel.

### Row 03 — Jump

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Crouch | push off | rise with shield tucked close | apex | descend | land on the shared ground line |

**Suggested durations:** `[80, 70, 110, 120, 110, 100]` ms; **total:** 590 ms. **Finish:** grounded locomotion.

### Row 04 — Stone Eruption

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Plant the feet | lower the free hand | gather stones just ahead of the boots | lift the hand sharply as short jagged spires rise vertically | spires crumble into fragments and dust | normal idle |

**Suggested durations:** `[90, 110, 140, 100, 110, 100]` ms; **total:** 650 ms. **Finish:** grounded locomotion.

The spires are a local, vertical eruption immediately ahead of the boots. The free hand performs the cast while the shield remains on the other forearm.

### Row 05 — Stone Shot

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Raise the free hand | draw pebbles into a small cluster | compress them into one angular stone | flick the stone just beyond the fingertips | loose grit falls | normal idle |

**Suggested durations:** `[90, 100, 140, 90, 100, 100]` ms; **total:** 620 ms. **Finish:** grounded locomotion.

Only the stone leaving the hand and nearby grit are in this row. The traveling stone must be a separate game entity or effect.

### Row 06 — Shield Bash

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Set the feet | draw the strapped shield close | dip the shoulder | step and drive the shield forward with the boss exposed | pull back | normal idle |

**Suggested durations:** `[80, 100, 110, 75, 105, 110]` ms; **total:** 580 ms. **Finish:** grounded locomotion.

This row communicates impact through the step, shoulder and shield. It contains no stone spell, flash or magical swing effect.

### Row 07 — Hit reaction

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch | recoil through the shoulders | stagger | plant the rear foot | steady the shield | normal idle |

**Suggested durations:** `[60, 75, 85, 90, 95, 110]` ms; **total:** 515 ms. **Finish:** controller decision.

### Row 08 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle | drop to one knee | tip sideways | land with the shield resting against the forearm | settle with body and shield visible | hold the same fallen pose |

**Suggested durations:** `[110, 150, 160, 180, 180, 200]` ms; **total:** 980 ms. **Finish:** hold frame 6.

### Row 09 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace | raise a pebble ring | spiral pebbles around body and shield | break the silhouette into grit | draw the grit inward | become completely transparent |

**Suggested durations:** `[90, 100, 110, 100, 90, 70]` ms; **total:** 560 ms. **Finish:** hold invisible frame 6.

### Row 10 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Small pebble cluster only | spiral pebbles upward | reveal an earthy silhouette | resolve body, costume and shield | plant boots as dust settles | normal idle |

**Suggested durations:** `[80, 100, 110, 110, 90, 100]` ms; **total:** 590 ms. **Finish:** idle or locomotion.

### Row 11 — Crouch entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | lower the hips | bring the shield close | angle its lower rim clear of the ground | settle into the low crawl-ready pose | hold the same low pose |

**Suggested durations:** `[70, 80, 80, 90, 90, 90]` ms; **total:** 500 ms. **Finish:** hold frame 6 or crawl.

### Row 12 — Crawl

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Shared low starting pose | shift onto the next knee and free-hand support | pass the free limbs forward | alternate support | advance the next knee | recover toward the initial low pose |

**Suggested durations:** `[120, 120, 120, 120, 120, 120]` ms; **total:** 720 ms. **Finish:** repeat.

The shield stays tucked against the forearm, with its lower rim above the ground. The free hand supports the crawl.

### Row 13 — Fly up / ascent entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | gather stone fragments beneath the boots | form a compact slab as the boots lift | straighten upright on the floating slab | hold the slab stance as pebbles drop away | stable upright ascent on the slab |

**Suggested durations:** `[90, 110, 120, 140, 140, 160]` ms; **total:** 760 ms. **Finish:** hold frame 6 or directional flight.

The slab forms during this one-shot. The boots remain on its flat top after it forms, and the upright silhouette can be held at F6.

### Row 14 — Directional flight

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Ride the slab with bent knees and forward lean | mantle streams behind | slight upper bob | grit trails close behind the slab | slight lower bob | return toward the first riding pose |

**Suggested durations:** `[90, 90, 90, 90, 90, 90]` ms; **total:** 540 ms. **Finish:** repeat.

This is slab riding with bent knees, not horizontal body flight. Keep the same slab and fixed cell pivot through the loop; the small bob and grit trail are already drawn.

### Suggested gameplay event points

These hooks are starting choices for the controller, not hitboxes or automatic effects contained in the PNG. Dispatch each event **once when entering its frame**, not on every render update.

| Action | Suggested frame | Controller action |
|---|---|---|
| Jump | Row 3, F2 | Begin the physical jump when the movement controller permits takeoff. |
| Stone Eruption | Row 4, F4 | Enable the short ground-spire hit area when the spires rise. The local spire artwork is already in the frame. |
| Stone Shot | Row 5, F4 | Spawn a separately animated stone at an authored free-hand socket and apply its forward travel. |
| Shield Bash | Row 6, F4 | Enable a short melee contact window at the shield boss; disable it during withdrawal and recovery. |
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

This engine-neutral example builds every sequence, supports uneven frame durations, and draws a complete cell around a fixed pivot. It assumes `earth_mage_spritesheet.png` has already been loaded into `image`. The game decides which clip to play and what to do when it finishes.

```javascript
const HERO_CELL = 96;
const HERO_COLUMNS = 6;
const HERO_PIVOT = { x: 48, y: 85 };

const heroSpecs = [
  {"id":"idle","row":1,"loop":true,"ms":[140,140,140,140,140,140],"finish":"repeat"},
  {"id":"run","row":2,"loop":true,"ms":[80,80,80,80,80,80],"finish":"repeat"},
  {"id":"jump","row":3,"loop":false,"ms":[80,70,110,120,110,100],"finish":"grounded locomotion","events":{"2":"takeoff_request","6":"landing_visual"}},
  {"id":"stone_eruption","row":4,"loop":false,"ms":[90,110,140,100,110,100],"finish":"grounded locomotion","events":{"4":"stone_eruption_contact"}},
  {"id":"stone_shot","row":5,"loop":false,"ms":[90,100,140,90,100,100],"finish":"grounded locomotion","events":{"4":"stone_shot_release"}},
  {"id":"shield_bash","row":6,"loop":false,"ms":[80,100,110,75,105,110],"finish":"grounded locomotion","events":{"4":"shield_contact"}},
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
const cast = HERO_ANIMATIONS.stone_shot;
const sample = sampleHero(cast, 370); // sample.frame is the stone-release frame.
```

`sampleHero` does not dispatch events. Track crossed frame boundaries separately, including every boundary crossed by a long update, and dispatch each `enterEvent` once. The finite duration of the final frame does not force the sprite to disappear: the controller can keep sampling the completed clip, which returns F6, until it selects the next animation. Reset elapsed time when a new one-shot begins.

### State transitions

| Current action | Recommended continuation |
|---|---|
| Idle / run | Switch according to horizontal movement input; apply world translation in the movement controller. |
| Jump | Use F1–F2 for takeoff, F3 while rising, F4 near the apex, F5 while falling, then F6 on contact. Holding an air pose to match physics is preferable to repeatedly restarting the whole row. |
| Stone Eruption / Stone Shot / Shield Bash | Finish recovery, then select idle or locomotion if the character is still able to act. |
| Hit | Return to the controller's appropriate ground or air state; a lethal hit can instead enter death. |
| Death | Hold F6. Despawning, resurrection or a scene change is a separate game decision. |
| Teleport out | Hold the invisible F6 until destination transfer is ready; start teleport-in at the destination. |
| Teleport in | F6 is exactly idle F1, so idle can continue without a pose jump. |
| Crouch | Hold F6 while stationary; enter crawl at F1 when moving low. |
| Crawl | Loop while moving; return to the shared low hold when stopping. |
| Stand from crouch | There is no separate stand-up row. An optional reverse sequence such as crouch F6 → F4 → F3 → F2 → F1 uses existing art; tune its timings and clearance checks. |
| Fly up | Play once, then hold F6 for upright ascent on the slab or select directional flight for forward riding. There is no separate six-frame vertical-ascent loop. |
| Directional flight | Repeat F1–F6 at a fixed visual root while riding the slab. The movement controller supplies travel; do not move the slab independently of the boots. |

## 5. Important integration notes

### Exact transition frames in the delivered PNG

These equalities were verified from the final frame pixels, not merely assumed from the requested animation plan:

| Relationship | Result |
|---|---|
| Death, row 8 F5 and F6 | Identical fallen pose, including the attached shield. |
| Crouch, row 11 F5 and F6 | Identical low hold. F4 is a distinct entry pose. |
| Crouch, row 11 F6 and crawl, row 12 F1 | Identical pose and placement. |
| Attack recoveries, rows 4, 5 and 6 F6; hit recovery, row 7 F6 | Each is identical to idle, row 1 F1. |
| Teleport-in, row 10 F6 and idle, row 1 F1 | Identical pose and placement. |
| Teleport-out, row 9 F6 | Fully transparent; still a valid 96 × 96 frame. |

### Ground, jump, hover and effects

Grounded standing, crouching, crawling and fallen poses use the **nominal** contact line at local y84. Run passing poses and jump poses include deliberate drawn lift. Effects can extend below the boots, so do not infer collision contact from the last opaque pixel.

| Row / effect | Measured local lowest visible pixel, F1–F6 | Meaning |
|---|---|---|
| Jump, row 3 | `[84, 81, 73, 65, 77, 84]` | Includes the drawn rise and apex; these values are not a physics trajectory. |
| Stone Eruption, row 4 | `[84, 84, 85, 85, 85, 84]` | The gathered stones, spires and crumbling fragments reach one pixel below the nominal boot-contact line in F3–F5. |
| Fly up, row 13 | `[84, 86, 84, 80, 83, 78]` | Includes the slab and falling grit. In F5, a low pebble makes the visible bound lower than the slab itself. |
| Directional flight, row 14 | `[78, 77, 77, 78, 79, 79]` | Includes the compact slab and grit trail. The small recurring bob stays inside the cell. |

Do not realign those rows to their visible bottom: doing so would remove the jump, move the body when an effect appears, or cancel the flight offset. Keep the fixed cell pivot and apply game movement separately. Account for the modest visual offsets when authoring precise collision and attachment positions.

The stone spires, local Stone Shot release, teleport grit, floating slab and its nearby pebbles are already part of the frame pixels. The game supplies projectile travel, damage windows, collision masks and destination transfer. The slab is part of the character artwork; it does not automatically create a moving-platform collider or a separate world object. Keep the body and slab together when drawing and moving the actor.

The shield is attached to the forward forearm in casting, crawling, flight and the fallen pose. Its bronze boss is the readable contact feature of the bash. Author a shield contact shape or spell socket per pose when precision matters; neither the full cell nor the opaque-pixel bounds are gameplay collision shapes.

Use integer display scales when practical and avoid smoothing or lossy recompression. Every visible frame retains at least five pixels of cell-edge padding. If repacking into a filtered texture atlas, handle texture bleeding with the atlas tool's padding/extrusion settings while preserving the original frame size and pivot offsets. Flipping left should mirror the complete cell and its local sockets consistently. Do not flip or move just the visible character independently of the effects.

## 6. Exact rectangle appendix

Every entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order. These rectangles include the complete transparent padding, equipment and local effects.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `run` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `jump` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `stone_eruption` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `stone_shot` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `shield_bash` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `hit` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `death` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `teleport_out` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `teleport_in` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `crouch` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `crawl` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `fly_up` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `directional_flight` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |

Row 9 F6 must remain present even though its rectangle contains no visible pixels. The animation IDs, timings and event names in this guide are suggested integration names; rename them to fit the game without changing the atlas coordinates.
