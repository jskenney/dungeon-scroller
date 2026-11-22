# Traveling Merchant — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`traveling_merchant_spritesheet.png`**: a full-body, right-facing traveling merchant with a short beard, a readable face beneath a broad brown felt hat, a weathered teal cloak, a sand-colored tunic, patched brown trousers, and dusty leather boots. A tall canvas trade pack and a bedroll strapped across its top sit behind the body. The front-access satchel and the small hip coin purse remain separate attached containers. Loose goods appear only during the trade sequences. Warm gold marks received healing; violet and cyan mark teleportation.

| Property | Value |
|---|---|
| Image filename | `traveling_merchant_spritesheet.png` |
| Canvas | 576 × 1152 pixels |
| Grid | 6 columns × 12 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Animation count | 12 |
| Frame slots | 72: 71 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right; slight head turns in social gestures |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 4 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `4d4e03615d6b7bf850dda0b5f13a392c0b4ddd01f6d8c43ce072f24d6cdfd183` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible body, clothing, equipment, handled goods and effects occupy different bounds in different poses. Preserve the complete cell when importing. The idle silhouette is 59–60 pixels tall including the hat and trade pack; the slightly leaning walk is 58–59 pixels tall. Those additions extend above the body, so this is not a 60-pixel anatomical height. Every extraction rectangle remains 96 × 96 pixels, including transparent space, carried equipment and effects. The digest above identifies the final PNG documented here.

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
| Stand under the pack with hands near the strap and satchel | Take a small breath and shift the load | Lightly tug one shoulder strap | Ease the shoulder beneath the attached pack | Let the cloak hem settle | Return toward the starting stance |

**Suggested durations:** `[160, 160, 160, 160, 160, 160]` ms; **total:** 960 ms. **Finish:** repeat.

### Row 02 — Walk

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Plant the lighter near boot forward and the darker far boot behind | Transfer weight as the far foot passes forward | Reach ahead with the darker far foot while the near leg trails | Plant the far boot ahead as the near foot begins to lift behind | Pass the lighter near knee forward over the planted far foot | Reach forward with the near boot toward the next contact |

**Suggested durations:** `[160, 160, 160, 160, 160, 160]` ms; **total:** 960 ms. **Finish:** repeat.

### Row 03 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle beneath the pack | Drop toward one knee | Tip sideways with the load still attached | Land on the side with the pack strapped on | Settle the cloak, body and bedroll | Hold the identical fallen pose |

**Suggested durations:** `[100, 140, 160, 150, 180, 200]` ms; **total:** 930 ms. **Finish:** hold frame 6.

### Row 04 — Take a hit

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch at impact | Grip a shoulder strap | Stagger as the pack shifts with the body | Plant the rear foot | Straighten beneath the load | Return to the normal idle pose |

**Suggested durations:** `[60, 80, 100, 100, 120, 120]` ms; **total:** 580 ms. **Finish:** controller decision.

### Row 05 — Heal / receive healing

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Hunch slightly | Bring one hand to the chest | Receive a small warm gold glow at the chest | Straighten as the gold light spreads close around the body | Let the gold light fade | Return to idle without the effect |

**Suggested durations:** `[100, 120, 150, 180, 140, 120]` ms; **total:** 810 ms. **Finish:** idle.

### Row 06 — Buy

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Receive a loose goods pouch in the forward hand | Turn the pouch for inspection | Stow the goods pouch in the front satchel | Draw a small gold coin from the hip purse | Offer the coin toward the off-screen player | Return to idle with empty hands |

**Suggested durations:** `[130, 160, 170, 150, 170, 140]` ms; **total:** 920 ms. **Finish:** idle.

Buy is named from the merchant's perspective: the merchant receives the loose goods pouch and pays the player. The received pouch is a temporary handled item; it is not the permanently attached front satchel or hip coin purse.

### Row 07 — Sell

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Draw a small rolled map from the front satchel | Tilt the map up for display | Extend the map toward the off-screen player | Open the empty hand after the map is taken | Receive and hold a gold coin | Pocket the coin and return to idle |

**Suggested durations:** `[140, 160, 170, 140, 150, 140]` ms; **total:** 900 ms. **Finish:** idle.

Sell gives the rolled parchment map to the player and brings payment back to the merchant. The map is gone by F4; the coin appears in F5 and is pocketed before the idle finish.

### Row 08 — Wave

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Notice the player | Raise one open hand beside the hat brim | Wave the palm outward | Wave back | Lower the hand | Return to idle |

**Suggested durations:** `[100, 130, 100, 100, 120, 120]` ms; **total:** 670 ms. **Finish:** idle.

### Row 09 — Talking

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Hold a relaxed closed-mouth pose | Open the mouth with a small nod | Make a brief palm-up speaking gesture | Continue the open-mouth palm-up gesture | Lower the gesture and close the mouth | Return to the identical starting talking pose |

**Suggested durations:** `[160, 130, 150, 170, 140, 150]` ms; **total:** 900 ms. **Finish:** repeat.

### Row 10 — Hide

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Glance ahead | Grip both pack straps | Bend the knees beneath the load | Duck low with the pack attached | Tuck the head beneath the hat brim in a compact crouch | Hold the identical crouch |

**Suggested durations:** `[110, 120, 130, 140, 160, 180]` ms; **total:** 840 ms. **Finish:** hold frame 6.

The pack stays strapped on throughout the crouch. The sheet supplies the complete visible pose; the level supplies any cover.

### Row 11 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace with the merchant and load fully visible | Gather violet and cyan sparks at the boots | Wrap a thin ripple around the body, hat, pack and bedroll | Break the full silhouette into colored flecks | Leave only the last fading flecks | Become fully transparent |

**Suggested durations:** `[90, 100, 120, 110, 100, 80]` ms; **total:** 600 ms. **Finish:** hold invisible frame 6.

### Row 12 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Show a small cluster of violet and cyan sparks | Expand the sparks into a thin ripple | Reveal the ghostly merchant and complete load | Resolve the face, cloak, pack and attachments | Plant the boots while the remaining sparks fade | Return to the exact normal idle pose |

**Suggested durations:** `[90, 100, 120, 120, 100, 120]` ms; **total:** 650 ms. **Finish:** idle or locomotion.

### Suggested gameplay event points

These hooks are starting choices for the controller, not automatic actions contained in the PNG. Dispatch each event **once when entering its frame**, including an F1 event when a clip starts, not on every render update.

| Action / event | Suggested frame | Controller action |
|---|---|---|
| `healing_received` | Row 5, F3 | Acknowledge an authorized incoming heal as the chest glow appears. The gesture receives healing; it does not cast a spell or choose healing targets. |
| `buy_goods_received` | Row 6, F1 | Use this as the visual cue that the merchant has received the loose pouch. The trade controller still validates and records the agreed exchange. |
| `buy_payment_offered` | Row 6, F5 | Signal that the merchant offers payment to the player. The pictured coin does not transfer currency automatically. |
| `sell_goods_handoff` | Row 7, F4 | The hand is now empty after the map leaves it. Use this cue to coordinate an already accepted goods handoff. |
| `sell_payment_received` | Row 7, F5 | The merchant visibly receives the coin. Coordinate the payment result with the same transaction used for the map handoff. |
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
  {"id":"walk","row":2,"loop":true,"ms":[160,160,160,160,160,160],"finish":"repeat"},
  {"id":"death","row":3,"loop":false,"ms":[100,140,160,150,180,200],"finish":"hold frame 6"},
  {"id":"hit","row":4,"loop":false,"ms":[60,80,100,100,120,120],"finish":"controller decision"},
  {"id":"heal","row":5,"loop":false,"ms":[100,120,150,180,140,120],"finish":"idle","events":{"3":"healing_received"}},
  {"id":"buy","row":6,"loop":false,"ms":[130,160,170,150,170,140],"finish":"idle","events":{"1":"buy_goods_received","5":"buy_payment_offered"}},
  {"id":"sell","row":7,"loop":false,"ms":[140,160,170,140,150,140],"finish":"idle","events":{"4":"sell_goods_handoff","5":"sell_payment_received"}},
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
| Heal, row 5 | `[84, 84, 84, 87, 84, 84]` | Gold light extends below the planted boots in F4: y87. |
| Teleport out, row 11 | `[84, 85, 88, 85, 81, empty]` | F6 is intentionally empty; preceding values include sparks and the dissolving silhouette. |
| Teleport in, row 12 | `[64, 78, 86, 85, 85, 84]` | Includes the initial spark, ripple, forming body and final solid idle pose. |

The table measures the lowest **visible pixel**, including magic. It is not a collision or foot-contact test. Do not vertically realign effect frames to their visible bottoms. Incoming healing, teleport activation and destination transfer are game rules; the local glow, ripple and flecks are already drawn into the frames.

### Pack, bedroll and attached containers

The hat, canvas pack, bedroll, straps, front satchel and hip purse belong to the character sprite. They remain attached in the walk, hit, death and hide sequences, and dissolve and reform with the body during teleportation. Keep the complete frame rather than fitting the import rectangle around the torso alone.

The tall equipment raises the idle silhouette above the underlying body scale. The broad fallen pose uses more horizontal space; retain its authored placement rather than independently shrinking or recentering that frame.

### Trade goods and transaction direction

The buy row receives a loose pouch and pays a coin; the sell row gives a rolled map and receives a coin. Both exchanges face an off-screen partner to the right. The small front satchel and the hip purse are permanent equipment, while the loose pouch, map and coin are temporary handled props.

Use the frame events as visual synchronization points for an accepted transaction. Track transaction identity and completion in the game so a repeated event, replayed clip or interrupted exchange cannot duplicate goods or payment. The sprite contains neither inventory rules nor a customer character.

### Received healing and complete teleportation

The gold sequence shows the merchant receiving healing with a hand at the chest. It is not an outgoing spell cast. Keep that cue distinct from the violet/cyan teleport ripple and flecks.

Teleportation includes the complete carried load. Keep the invisible final slot of teleport-out and the fixed frame pivot; changing alignment to the remaining sparks would shift the merchant's position when the full body returns.

### Pixel-art import and gameplay geometry

Use integer display scales when practical and avoid smoothing or lossy recompression. The minimum transparent cell-edge padding in this PNG is **4 pixels**. Preserve the original frame size and registration when repacking; if a filtered texture atlas is required, use its padding/extrusion controls to prevent texture bleeding.

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
