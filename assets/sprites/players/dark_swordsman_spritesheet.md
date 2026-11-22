# Dark Swordsman — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`dark_swordsman_spritesheet.png`**: a full-body, right-facing traveling swordsman who practices dark mind magic. He has dark hair, a fitted charcoal gambeson, a worn leather sword belt and scabbard, one steel shoulder guard, tall riding boots, and a muted burgundy sash. He carries a straight one-handed sword with a plain crossguard low and forward in guard. Mind magic uses compact violet contours and pale lavender highlights near the eyes or free hand. The physical sword slash uses body and blade motion without magical effects.

| Property | Value |
|---|---|
| Image filename | `dark_swordsman_spritesheet.png` |
| Canvas | 576 × 1344 pixels |
| Grid | 6 columns × 14 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Visible idle bounds, including equipment | 42–46 × 51–53 pixels across row 1 |
| Animation count | 14 |
| Frame slots | 84: 83 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 5 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `e4228b9cf299bca1db924bc0825122118ec5b370f0b014a83d8757829211673c` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible character, sword, scabbard and effects occupy different bounds in different poses. Preserve the complete cell when importing. The digest above identifies the final PNG documented here; measurements and exact transition matches below refer to that file.

The PNG contains pixels only. Playback durations, collision shapes, world movement and state transitions below are implementation recommendations; they are not encoded animation metadata. Mind Hex’s frame-4 trigger is part of the requested animation design and must be implemented in the controller. Other event hooks are suggested starting choices.

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

For example, the Mind Hex release is **row 5, column 4**, rectangle **`(288, 384, 96, 96)`**, flattened index **27**. The invisible end of teleport-out is **row 9, column 6**, rectangle **`(480, 768, 96, 96)`**, index **53**. Keep that empty slot in the animation.

## 3. Animation catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. A loop wraps from column 6 to column 1. A one-shot plays once; its finish behavior is listed below.

| Row | Animation ID | Animation | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `idle` | Idle | 0 | 0–5 | Loop |
| 02 | `run` | Run | 96 | 6–11 | Loop |
| 03 | `jump` | Jump | 192 | 12–17 | Once; grounded locomotion |
| 04 | `mind_jolt` | Mind Jolt | 288 | 18–23 | Once; grounded locomotion |
| 05 | `mind_hex` | Mind Hex | 384 | 24–29 | Once; grounded locomotion |
| 06 | `sword_slash` | Sword Slash | 480 | 30–35 | Once; grounded locomotion |
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
| Low sword guard | breathe and shift weight | small grip adjustment | weight settles | burgundy sash moves slightly | return toward the first stance |

**Suggested durations:** `[140, 140, 140, 140, 140, 140]` ms; **total:** 840 ms. **Finish:** repeat.

### Row 02 — Run

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lead-foot contact | passing pose | opposite leg reaches | opposite-foot contact | opposite passing pose | first leg reaches toward contact |

**Suggested durations:** `[80, 80, 80, 80, 80, 80]` ms; **total:** 480 ms. **Finish:** repeat.

The sword is carried low and close, with its point trailing behind the running body. The sash trails in the same direction, and the cycle stays in place.

### Row 03 — Jump

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Crouch | push off | rise with sword tucked close | apex | descend | land on the shared ground line |

**Suggested durations:** `[80, 70, 110, 120, 110, 100]` ms; **total:** 590 ms. **Finish:** grounded locomotion.

### Row 04 — Mind Jolt

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Plant the feet | focus the head and gaze forward | draw the free hand inward | snap the palm open with a short violet ripple at head height | let the ripple collapse | normal low guard |

**Suggested durations:** `[80, 90, 110, 80, 90, 100]` ms; **total:** 550 ms. **Finish:** grounded locomotion.

Mind Jolt uses an open palm and a local forward ripple. Keep this gesture distinct from the temple gesture in Mind Hex.

### Row 05 — Mind Hex

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Fix the gaze forward | raise two free-hand fingers to the temple | gather a thin violet contour around the eyes | hold the stare as the contour flashes: trigger Mind Hex | lower the hand as the flash fades | normal low guard |

**Suggested durations:** `[90, 110, 140, 100, 110, 100]` ms; **total:** 650 ms. **Finish:** grounded locomotion.

**Frame 4 is the required Mind Hex trigger.** The hand stays at the temple while the eye contour flashes. No traveling projectile or enemy-side distortion is included in the hero sheet; create the target distortion separately around the selected enemy’s head.

### Row 06 — Sword Slash

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Set the feet | draw the sword back | turn the shoulders into the swing | sweep and extend the blade across the front | follow through low | normal low guard |

**Suggested durations:** `[75, 100, 85, 65, 105, 110]` ms; **total:** 540 ms. **Finish:** grounded locomotion.

The backward load, shoulder turn, extended contact and low follow-through form the physical slash. There are no violet spell effects in this row.

### Row 07 — Hit reaction

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch | recoil through the shoulders | stagger | plant the rear foot | steady the blade | normal low guard |

**Suggested durations:** `[60, 75, 85, 90, 95, 110]` ms; **total:** 515 ms. **Finish:** controller decision.

### Row 08 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle | drop to one knee | tip sideways | land as the sword slips beside the body | settle with body and full sword visible | hold the same fallen pose |

**Suggested durations:** `[110, 150, 160, 180, 180, 200]` ms; **total:** 980 ms. **Finish:** hold frame 6.

### Row 09 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace | show a violet outline and tint | split body and sword into offset silhouettes | draw the silhouettes into a thin trace | let the trace fade | become completely transparent |

**Suggested durations:** `[90, 100, 110, 100, 90, 70]` ms; **total:** 560 ms. **Finish:** hold invisible frame 6.

### Row 10 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Thin violet trace only | split into offset silhouettes | align into one body-and-sword silhouette | resolve normal costume and sword | plant boots as the outline fades | normal low guard |

**Suggested durations:** `[80, 100, 110, 110, 90, 100]` ms; **total:** 590 ms. **Finish:** idle or locomotion.

### Row 11 — Crouch entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | lower the hips | bring the sword alongside the body | keep its point clear of the floor while lowering | settle into the low crawl-ready pose | hold the same low pose |

**Suggested durations:** `[70, 80, 80, 90, 90, 90]` ms; **total:** 500 ms. **Finish:** hold frame 6 or crawl.

### Row 12 — Crawl

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Shared low starting pose | shift onto the next knee and free-hand support | pass the free limbs forward | alternate support | advance the next knee | recover toward the initial low pose |

**Suggested durations:** `[120, 120, 120, 120, 120, 120]` ms; **total:** 720 ms. **Finish:** repeat.

The free hand supports the crawl while the sword stays alongside the body, with its point above the ground.

### Row 13 — Fly up / ascent entry

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bend the knees | gather a narrow violet distortion beneath the boots | lift off | straighten into upright levitation | sash trails downward | stable upright ascent silhouette |

**Suggested durations:** `[90, 110, 120, 140, 140, 160]` ms; **total:** 760 ms. **Finish:** hold frame 6 or directional flight.

This is unsupported upright levitation. The narrow effect under the boots is a visual distortion, not a platform.

### Row 14 — Directional flight

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lean forward with sword alongside the body | legs and sash trail behind | slight upper bob | close violet afterimage follows the silhouette | slight lower bob | return toward the first airborne pose |

**Suggested durations:** `[90, 90, 90, 90, 90, 90]` ms; **total:** 540 ms. **Finish:** repeat.

The forward-leaning travel silhouette differs from upright ascent. The sword remains tucked beside the body, and the faint violet afterimage stays close to the silhouette.

### Suggested gameplay event points

Mind Hex on **row 5, F4** is the required spell cue from the animation specification. The other hooks below are starting choices for the controller. None is automatic metadata in the PNG. Dispatch each event **once when entering its frame**, not on every render update.

| Action | Suggested frame | Controller action |
|---|---|---|
| Jump | Row 3, F2 | Begin the physical jump when the movement controller permits takeoff. |
| Mind Jolt | Row 4, F4 | Apply the short-range mind pulse as the open-palm ripple appears. Define range, valid targets and effects separately. |
| Mind Hex | Row 5, F4 — required cue | Apply the spell to the selected target and spawn a separate distortion around that enemy’s head. Do not launch a traveling projectile. |
| Sword Slash | Row 6, F4 | Enable the melee contact window at the extended blade. An F3–F4 window is an optional tuning choice; disable it during recovery. |
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

This engine-neutral example builds every sequence, supports uneven frame durations, and draws a complete cell around a fixed pivot. It assumes `dark_swordsman_spritesheet.png` has already been loaded into `image`. The game decides which clip to play and what to do when it finishes.

```javascript
const HERO_CELL = 96;
const HERO_COLUMNS = 6;
const HERO_PIVOT = { x: 48, y: 85 };

const heroSpecs = [
  {"id":"idle","row":1,"loop":true,"ms":[140,140,140,140,140,140],"finish":"repeat"},
  {"id":"run","row":2,"loop":true,"ms":[80,80,80,80,80,80],"finish":"repeat"},
  {"id":"jump","row":3,"loop":false,"ms":[80,70,110,120,110,100],"finish":"grounded locomotion","events":{"2":"takeoff_request","6":"landing_visual"}},
  {"id":"mind_jolt","row":4,"loop":false,"ms":[80,90,110,80,90,100],"finish":"grounded locomotion","events":{"4":"mind_jolt_pulse"}},
  {"id":"mind_hex","row":5,"loop":false,"ms":[90,110,140,100,110,100],"finish":"grounded locomotion","events":{"4":"mind_hex_apply"}},
  {"id":"sword_slash","row":6,"loop":false,"ms":[75,100,85,65,105,110],"finish":"grounded locomotion","events":{"4":"sword_contact"}},
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
const cast = HERO_ANIMATIONS.mind_hex;
const sample = sampleHero(cast, 370); // sample.frame is the required Mind Hex trigger frame.
```

`sampleHero` does not dispatch events. Track crossed frame boundaries separately, including every boundary crossed by a long update, and dispatch each `enterEvent` once. The finite duration of the final frame does not force the sprite to disappear: the controller can keep sampling the completed clip, which returns F6, until it selects the next animation. Reset elapsed time when a new one-shot begins.

### State transitions

| Current action | Recommended continuation |
|---|---|
| Idle / run | Switch according to horizontal movement input; apply world translation in the movement controller. |
| Jump | Use F1–F2 for takeoff, F3 while rising, F4 near the apex, F5 while falling, then F6 on contact. Holding an air pose to match physics is preferable to repeatedly restarting the whole row. |
| Mind Jolt / Mind Hex / Sword Slash | Finish recovery, then select idle or locomotion if the character is still able to act. |
| Hit | Return to the controller's appropriate ground or air state; a lethal hit can instead enter death. |
| Death | Hold F6. Despawning, resurrection or a scene change is a separate game decision. |
| Teleport out | Hold the invisible F6 until destination transfer is ready; start teleport-in at the destination. |
| Teleport in | F6 is exactly idle F1, so idle can continue without a pose jump. |
| Crouch | Hold F6 while stationary; enter crawl at F1 when moving low. |
| Crawl | Loop while moving; return to the shared low hold when stopping. |
| Stand from crouch | There is no separate stand-up row. An optional reverse sequence such as crouch F6 → F4 → F3 → F2 → F1 uses existing art; tune its timings and clearance checks. |
| Fly up | Play once, then hold F6 while continuing upright levitation or select directional flight when moving horizontally. There is no separate six-frame vertical-ascent loop. |
| Directional flight | Repeat F1–F6 at a fixed visual root; the movement controller supplies travel. Preserve the close afterimage and the drawn bob. |

## 5. Important integration notes

### Exact transition frames in the delivered PNG

These equalities were verified from the final frame pixels, not merely assumed from the requested animation plan:

| Relationship | Result |
|---|---|
| Death, row 8 F5 and F6 | Identical fallen pose, including the dropped sword. |
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
| Mind Hex, row 5 | `[84, 84, 84, 84, 84, 84]` | All six frames retain the shared grounded contact line while the temple and eye effects change. |
| Fly up, row 13 | `[84, 85, 82, 81, 81, 81]` | Includes the violet distortion below lifted boots; the lowest visible effect pixel is not the boot-contact position. |
| Directional flight, row 14 | `[67, 66, 66, 67, 68, 68]` | The airborne body, sword and close afterimage have a small recurring bob above the nominal ground. |

Do not realign those rows to their visible bottom: doing so would remove the jump, move the body when an effect appears, or cancel the flight offset. Keep the fixed cell pivot and apply game movement separately. Account for the modest visual offsets when authoring precise collision and attachment positions.

The Mind Jolt ripple, Mind Hex eye contour, teleport silhouettes and traces, takeoff distortion and close flight afterimage are already part of the frame pixels. The game supplies mind-spell rules, melee damage windows, collision masks and destination transfer. Mind Hex’s target-side distortion is a separate effect that appears at the enemy’s head; this PNG contains neither that effect nor an enemy sprite.

Keep the sword visible when mirroring or attaching gameplay sockets. The low guard, rearward run carry, physical slash, low crawl and fallen sword have different blade orientations within the same cell. Author blade contact shapes and hand or eye sockets per pose when precision matters; full-cell rectangles and opaque-pixel bounds are not gameplay collision shapes.

Use integer display scales when practical and avoid smoothing or lossy recompression. Every visible frame retains at least five pixels of cell-edge padding. If repacking into a filtered texture atlas, handle texture bleeding with the atlas tool's padding/extrusion settings while preserving the original frame size and pivot offsets. Flipping left should mirror the complete cell and its local sockets consistently. Do not flip or move just the visible character independently of the effects.

## 6. Exact rectangle appendix

Every entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order. These rectangles include the complete transparent padding, equipment and local effects.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `run` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `jump` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `mind_jolt` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `mind_hex` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `sword_slash` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `hit` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `death` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `teleport_out` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `teleport_in` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `crouch` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `crawl` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `fly_up` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `directional_flight` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |

Row 9 F6 must remain present even though its rectangle contains no visible pixels. The animation IDs, timings and event names in this guide are suggested integration names; rename them to fit the game without changing the atlas coordinates. Preserve Mind Hex’s frame-4 trigger even if its event name changes.
