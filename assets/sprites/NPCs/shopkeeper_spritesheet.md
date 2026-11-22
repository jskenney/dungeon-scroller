# Shopkeeper — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`shopkeeper_spritesheet.png`**: a full-body, right-facing middle-aged shopkeeper with short graying dark hair, a dark moustache, rolled light shirt sleeves, a rust-red vest, a worn dark leather apron, sturdy boots, and a brass-buckled coin purse at the near hip. The apron pocket and purse remain recognizable through movement and social gestures. Buying uses a small wrapped parcel; selling uses a corked green bottle. Received healing appears as warm gold light, while teleport effects use violet and cyan.

| Property | Value |
|---|---|
| Image filename | `shopkeeper_spritesheet.png` |
| Canvas | 576 × 1152 pixels |
| Grid | 6 columns × 12 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Animation count | 12 |
| Frame slots | 72: 71 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right; slight head turns in social gestures |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 10 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `cd1327b70fbea4db6ea7fc5ddf0111aaad954f2a94d541c29f8bda583772f008` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible body, clothing, equipment, handled goods and effects occupy different bounds in different poses. Preserve the complete cell when importing. The normal idle figure is 52 pixels tall inside its 96 × 96 frame. Talking poses are 51–52 pixels tall; the slightly lowered coin-draw pose is 50 pixels tall. These are visible artwork bounds, not different extraction sizes. The digest above identifies the final PNG documented here.

The PNG contains pixels only. Playback durations, event triggers, inventory transactions, collision shapes, world movement and state transitions below are implementation recommendations; they are not encoded animation metadata.

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
|---|---|---|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

For example, the fifth pose of buy is **row 6, column 5**, rectangle **`(384, 480, 96, 96)`**, flattened index **34**. The invisible end of teleport-out is **row 11, column 6**, rectangle **`(480, 960, 96, 96)`**, index **65**. Keep that empty slot in the animation. The final teleport-in pose is **row 12, column 6**, rectangle **`(480, 1056, 96, 96)`**, index **71**.

## 3. Animation catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. A loop wraps from column 6 to column 1. A one-shot plays once; its finish behavior is listed below.

| Row | Animation ID | Animation | y | Flat indices | Playback / finish |
|---|---|---|---|---|---|
| 01 | `idle` | Idle | 0 | 0–5 | Loop |
| 02 | `walk` | Walk | 96 | 6–11 | Loop; movement supplied by controller |
| 03 | `death` | Death | 192 | 12–17 | Once; hold frame 6 |
| 04 | `hit` | Take a hit | 288 | 18–23 | Once; idle or controller decision |
| 05 | `heal` | Heal / receive healing | 384 | 24–29 | Once; return to idle |
| 06 | `buy` | Buy | 480 | 30–35 | Once; complete exchange and return to idle |
| 07 | `sell` | Sell | 576 | 36–41 | Once; complete exchange and return to idle |
| 08 | `wave` | Wave | 672 | 42–47 | Once; return to idle |
| 09 | `talking` | Talking | 768 | 48–53 | Loop; feet planted |
| 10 | `hide` | Hide | 864 | 54–59 | Once; hold frame 6 while hidden |
| 11 | `teleport_out` | Teleport out | 960 | 60–65 | Once; hold invisible frame 6 |
| 12 | `teleport_in` | Teleport in | 1056 | 66–71 | Once; idle or locomotion |

### Six-frame poses and starting timings

The following durations are **suggested milliseconds for columns 1–6**, not measured or embedded timings. Keep the listed frame order, then tune the durations to the NPC's movement and interaction pace. A finite duration for F6 does not end a held death or hide state; the controller continues displaying F6 until that state changes.

### Row 01 — Idle

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Stand with one hand near the purse | breathe gently | shift weight | smooth the apron edge | let the apron settle | ease toward the starting stance |

**Suggested durations:** `[160, 160, 160, 160, 160, 160]` ms; **total:** 960 ms. **Finish:** repeat.

### Row 02 — Walk

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Near foot contacts forward | far leg passes as weight shifts | far foot reaches forward; near leg pushes off behind | far foot plants while the near heel lifts | near leg passes forward | near leg reaches toward the next contact |

**Suggested durations:** `[150, 150, 150, 150, 150, 150]` ms; **total:** 900 ms. **Finish:** repeat.

### Row 03 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle | sink to one knee | tip sideways | land on the side | settle the body and apron | hold the identical fallen pose |

**Suggested durations:** `[100, 140, 160, 150, 180, 200]` ms; **total:** 930 ms. **Finish:** hold frame 6.

### Row 04 — Take a hit

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch | pull the elbows inward | stagger back | replant the rear foot | steady the shoulders | return to the exact starting idle pose |

**Suggested durations:** `[60, 80, 100, 100, 120, 120]` ms; **total:** 580 ms. **Finish:** controller decision.

### Row 05 — Heal / receive healing

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Hunch slightly | bring a hand to the chest | gold healing light gathers at the chest | straighten as small gold motes spread | let the motes fade | return to idle without light |

**Suggested durations:** `[100, 120, 150, 180, 140, 120]` ms; **total:** 810 ms. **Finish:** idle.

### Row 06 — Buy

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Reach toward the player with an empty hand | receive the wrapped parcel | turn the parcel to inspect it | nod while holding the parcel and drawing a coin with the other hand | offer the coin while retaining the parcel close to the apron | put the goods away and return to idle with empty hands |

**Suggested durations:** `[130, 160, 170, 150, 170, 140]` ms; **total:** 920 ms. **Finish:** idle.

The shopkeeper receives the parcel before paying. In F4–F5 the parcel and coin are handled by the two existing hands. F6 has no loose parcel or coin. The game supplies the off-screen partner and the actual stock/currency changes.

### Row 07 — Sell

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Draw the corked bottle from the apron pocket | turn it upright for display | extend the bottle toward the player | show an empty hand after the bottle is taken | receive a coin | pocket the coin and return to idle |

**Suggested durations:** `[140, 160, 170, 140, 150, 140]` ms; **total:** 900 ms. **Finish:** idle.

The green bottle is a sale item, distinct from the brass-buckled hip purse. It disappears from the hand after F3; F5 shows the payment coin.

### Row 08 — Wave

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Notice the player | raise one open hand beside the shoulder | flick the wrist outward | flick it back | lower the hand | return to idle |

**Suggested durations:** `[100, 130, 100, 100, 120, 120]` ms; **total:** 670 ms. **Finish:** idle.

### Row 09 — Talking

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Relax with a closed mouth | open the mouth with a small nod | briefly close the mouth and raise one palm | speak with the palm up | lower the gesture and close the mouth | return to the identical first talking pose |

**Suggested durations:** `[160, 130, 150, 170, 140, 150]` ms; **total:** 900 ms. **Finish:** repeat.

### Row 10 — Hide

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Glance ahead | pull the elbows inward | bend the knees | duck low | tuck the head into a compact crouch | hold the identical crouch |

**Suggested durations:** `[110, 120, 130, 140, 160, 180]` ms; **total:** 840 ms. **Finish:** hold frame 6.

The shopkeeper stays fully visible. Place a counter or another cover object in the level and control occlusion there.

### Row 11 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace with the full body visible | gather violet/cyan sparks at the boots | wrap a thin ripple around the body | break the body, apron and purse into flecks | leave only a few fading flecks | become fully transparent |

**Suggested durations:** `[90, 100, 120, 110, 100, 80]` ms; **total:** 600 ms. **Finish:** hold invisible frame 6.

### Row 12 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Show one small violet/cyan spark | widen it into a thin ripple | reveal the full silhouette | resolve the body, apron and purse | plant the boots as sparks fade | end in the exact starting idle pose |

**Suggested durations:** `[90, 100, 120, 120, 100, 120]` ms; **total:** 650 ms. **Finish:** idle or locomotion.

### Suggested gameplay event points

These hooks are starting choices for the controller, not automatic actions contained in the PNG. Dispatch each event **once when entering its frame**, including an F1 event when a clip starts, not on every render update.

| Action / event | Suggested frame | Controller action |
|---|---|---|
| `healing_received` | Row 5, F3 | Acknowledge an authorized incoming heal as the chest glow appears. The gesture receives healing; it does not cast a spell or choose healing targets. |
| `buy_parcel_received` | Row 6, F2 | Mark the visual receipt of the player's parcel after the transaction has been validated. |
| `buy_payment_offer` | Row 6, F5 | Present the shopkeeper's coin to the player; complete the payment through the transaction controller. |
| `sell_bottle_handoff` | Row 7, F4 | The hand is now empty. Resolve the bottle handoff once, with the game controlling stock and recipient inventory. |
| `sell_payment_received` | Row 7, F5 | Mark receipt of the player's payment; the following frame pockets the coin. |
| `invisible_destination_transfer` | Row 11, F6 | The sprite is fully invisible. Transfer the actor when the destination is ready, then begin teleport-in there. |
| `arrival_complete` | Row 12, F6 | Finish arrival and allow the controller to resume idle, walking or interaction. This pose exactly matches idle F1. |

Validate price, stock, currency and recipient state in the transaction controller. Treat these frame events as visual synchronization cues; do not create goods or transfer money simply because a frame is rendered. Track completion for each interaction so replaying or interrupting a clip cannot duplicate a trade.

## 4. Building and playing the sequences

### Import and slice

1. Import the original PNG with nearest-neighbor/point sampling. Preserve its alpha channel and native pixel dimensions.
2. Slice a regular grid with frame size **96 × 96**, offset **(0, 0)**, margin **0**, spacing **0**, six columns and twelve rows.
3. Keep all 72 cells, including row 11 column 6. Disable automatic removal of empty frames and automatic cropping to the visible silhouette.
4. Assign the same logical pivot to every cell. A convenient choice is **(48, 85)**: horizontal cell center and the boundary immediately below ground-contact pixel 84. In a top-left normalized convention this is `(0.5, 85/96)`; in a bottom-left normalized convention it is `(0.5, 11/96)`.
5. Build each named animation from its row's six rectangles. Use the loop and finish settings from the catalog.

The artwork's nominal horizontal body anchor is near x43. That is an artwork-registration point, not an instruction to change the pivot every frame. The proposed center pivot is a consistent engine convention. A different fixed pivot is also workable if drawing, attachments and collision positions all use it consistently.

### JavaScript example: descriptors, sampling and drawing

This engine-neutral example builds every sequence, supports uneven frame durations, and draws a complete cell around a fixed pivot. It assumes the PNG has already been loaded into `image`. The game decides which clip to play and what to do when it finishes.

```javascript
const NPC_CELL = 96;
const NPC_COLUMNS = 6;
const NPC_PIVOT = { x: 48, y: 85 };

const npcSpecs = [
  {"id":"idle","row":1,"loop":true,"ms":[160,160,160,160,160,160],"finish":"repeat"},
  {"id":"walk","row":2,"loop":true,"ms":[150,150,150,150,150,150],"finish":"repeat"},
  {"id":"death","row":3,"loop":false,"ms":[100,140,160,150,180,200],"finish":"hold frame 6"},
  {"id":"hit","row":4,"loop":false,"ms":[60,80,100,100,120,120],"finish":"controller decision"},
  {"id":"heal","row":5,"loop":false,"ms":[100,120,150,180,140,120],"finish":"idle","events":{"3":"healing_received"}},
  {"id":"buy","row":6,"loop":false,"ms":[130,160,170,150,170,140],"finish":"idle","events":{"2":"buy_parcel_received","5":"buy_payment_offer"}},
  {"id":"sell","row":7,"loop":false,"ms":[140,160,170,140,150,140],"finish":"idle","events":{"4":"sell_bottle_handoff","5":"sell_payment_received"}},
  {"id":"wave","row":8,"loop":false,"ms":[100,130,100,100,120,120],"finish":"idle"},
  {"id":"talking","row":9,"loop":true,"ms":[160,130,150,170,140,150],"finish":"repeat"},
  {"id":"hide","row":10,"loop":false,"ms":[110,120,130,140,160,180],"finish":"hold frame 6"},
  {"id":"teleport_out","row":11,"loop":false,"ms":[90,100,120,110,100,80],"finish":"hold invisible frame 6","events":{"6":"invisible_destination_transfer"}},
  {"id":"teleport_in","row":12,"loop":false,"ms":[90,100,120,120,100,120],"finish":"idle or locomotion","events":{"6":"arrival_complete"}},
];

const NPC_ANIMATIONS = Object.fromEntries(npcSpecs.map(spec => {
  const frames = spec.ms.map((durationMs, column0) => ({
    column: column0 + 1,
    index: (spec.row - 1) * NPC_COLUMNS + column0,
    rect: {
      x: column0 * NPC_CELL,
      y: (spec.row - 1) * NPC_CELL,
      width: NPC_CELL,
      height: NPC_CELL
    },
    durationMs,
    enterEvent: spec.events?.[column0 + 1] ?? null
  }));
  return [spec.id, {
    ...spec,
    frames,
    durationMs: spec.ms.reduce((sum, ms) => sum + ms, 0)
  }];
}));

function sampleNpc(clip, elapsedMs) {
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

function drawNpc(ctx, image, frame, rootX, rootY, scale = 1, faceLeft = false) {
  const r = frame.rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(rootX, rootY);
  ctx.scale(faceLeft ? -scale : scale, scale);
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    -NPC_PIVOT.x, -NPC_PIVOT.y, NPC_CELL, NPC_CELL);
  ctx.restore();
}

// Example: sample the fifth pose of the buy sequence.
const buy = NPC_ANIMATIONS.buy;
const fifthPoseTimeMs =
  buy.frames.slice(0, 4).reduce((sum, frame) => sum + frame.durationMs, 0) + 1;
const sample = sampleNpc(buy, fifthPoseTimeMs);
// sample.frame.column === 5; sample.frame.index === 34.
```

`sampleNpc` does not dispatch events. Dispatch an initial F1 event when starting a clip, then track every crossed frame boundary, including multiple boundaries crossed by one long update. Fire each `enterEvent` once for that entry. Keep transaction completion separate from rendering so restarting a trade animation cannot repeat its inventory effects.

When a one-shot completes, `sampleNpc` continues returning F6. The finite listed duration does not force the sprite to disappear or return to idle: the controller selects the next animation, or holds the completed clip. Reset elapsed time when a new one-shot begins.

### State transitions

| Current action | Recommended continuation |
|---|---|
| Idle / walk | Switch according to movement or NPC behavior. Apply world translation in the movement controller; the walk artwork runs in place. |
| Receive healing | Play the visual response to an incoming heal, finish recovery, then select idle or another permitted state. |
| Buy / sell | Run the validated exchange once and finish at idle. Handle stock, payment and interrupted interactions in game logic. |
| Wave | Finish the greeting, then return to idle or begin talking. |
| Talking | Loop while conversation is active. Complete the closing gesture before selecting idle when a smooth finish is desired. |
| Hit | Return to the appropriate behavior state; a lethal hit can instead enter death. |
| Death | Hold F6. Despawning, resurrection and scene changes are separate game decisions. |
| Hide | Hold F6 while the crouched state is active. The NPC remains visible; cover and occlusion come from the level. |
| Stand from hide | There is no separate stand-up row. An optional reverse of hide F5 → F4 → F3 → F2 → F1 reuses existing art; tune timings and check clearance before standing. |
| Teleport out | Hold the invisible F6 until destination transfer is ready; begin teleport-in at the destination. |
| Teleport in | F6 is exactly idle F1, so idle can continue without a pose jump. |

## 5. Important integration notes

### Exact transition frames in the delivered PNG

These equalities were verified from the final frame pixels, not merely assumed from the animation plan:

| Relationship | Result |
|---|---|
| Death, row 3 F5 and F6 | Identical fallen pose and placement. |
| Hide, row 10 F5 and F6 | Identical low hold and placement. |
| Talking, row 9 F1 and F6 | Identical talking-loop endpoint. This does not imply every talking frame equals idle. |
| Teleport-in, row 12 F6 and idle, row 1 F1 | Identical pose and placement. |
| Hit, heal, buy, sell and wave, rows 4–8 F6 | Each exactly matches idle row 1 F1. |
| Teleport-out, row 11 F6 | Fully transparent; still a valid 96 × 96 frame. |

### Ground, scale and local effects

Grounded body poses use cell-local **y = 84** for contact. Standing, walking contacts, fallen remains, the social poses and the final hide crouch retain that common ground line. Keep the cell pivot fixed; the appearance or disappearance of an effect must not move the actor.

| Row / effect | Measured local lowest visible pixel, F1–F6 | Meaning |
|---|---|---|
| Heal, row 5 | `[84, 84, 84, 84, 84, 84]` | The glow stays at or above the common ground line. |
| Teleport out, row 11 | `[84, 84, 85, 84, 84, empty]` | F6 is intentionally empty; preceding values include sparks and the dissolving silhouette. |
| Teleport in, row 12 | `[64, 68, 85, 84, 84, 84]` | Includes the initial spark, ripple, forming body and final solid idle pose. |

The table measures the lowest **visible pixel**, including magic. It is not a collision or foot-contact test. Do not vertically realign effect frames to their visible bottoms. Incoming healing, teleport activation and destination transfer are game rules; the local glow, ripple and flecks are already drawn into the frames.

### Apron, purse and handled goods

Keep the apron and brass-buckled purse attached to the character when mirroring or repacking. The parcel, bottle and coin are local artwork only in their interaction poses; they are not separate inventory objects created by the PNG. Use the game's stock, price and inventory records to determine what is actually traded.

The normal stance leaves a hand near the purse, but the purse buckle is not a collectible coin. The coin-draw pose uses a separate gold coin, and the offer pose extends it toward the off-screen player.

### Social gestures and cover

Talking changes the mouth and one hand while the boots remain planted. Stop or pause the loop from dialogue state rather than moving the NPC to imitate the gesture. A slight head turn does not change the sheet's native right-facing body orientation.

Hide is a visible crouch, not invisibility. A shop counter, shelf, wall, or other cover belongs in the level; none is included in the sprite.

### Pixel-art import and gameplay geometry

Use integer display scales when practical and avoid smoothing or lossy recompression. The minimum transparent cell-edge padding in this PNG is **10 pixels**. Preserve the original frame size and registration when repacking; if a filtered texture atlas is required, use its padding/extrusion controls to prevent texture bleeding.

Flip the complete cell and any authored local sockets consistently when facing left. Do not independently resize or move the head, limbs, clothing, equipment or effects. Author gameplay collision shapes separately: the full 96 × 96 cell and its changing opaque-pixel bounds are not the NPC's collision box. Handled goods, a tall pack or a spell sparkle should not automatically enlarge that box.

## 6. Exact rectangle appendix

Every entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order. These rectangles include the complete transparent padding, equipment, handled items and local effects.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `walk` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `death` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `hit` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `heal` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `buy` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `sell` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `wave` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `talking` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `hide` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `teleport_out` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `teleport_in` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |

Row 11 F6 must remain present even though its rectangle contains no visible pixels. The animation IDs, timings and event names in this guide are suggested integration names; rename them to fit the game without changing the atlas coordinates.
