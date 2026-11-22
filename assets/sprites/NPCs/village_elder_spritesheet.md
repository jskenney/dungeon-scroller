# Village Elder — Sprite Sheet Guide

## 1. Asset and character

This guide describes the final game asset **`village_elder_spritesheet.png`**: an older woman shown full-body in right-facing side view, with silver hair in a low braid, a calm face, a triangular plum shawl fastened by a plain brass brooch, an ankle-length slate-blue dress, sturdy leather shoes, and a small hip pouch. She carries a plain wooden walking stick in the forward hand and uses her free hand for greetings, conversation and trade. Her upright posture and deliberate gestures distinguish her at gameplay scale. Warm gold light marks received healing; violet and cyan mark teleportation.

| Property | Value |
|---|---|
| Image filename | `village_elder_spritesheet.png` |
| Canvas | 576 × 1152 pixels |
| Grid | 6 columns × 12 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Animation count | 12 |
| Frame slots | 72: 71 visible frames and one intentionally transparent frame |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native facing | Right; slight head turns in social gestures |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a cell | 9 pixels |
| Nominal ground contact | Cell-local pixel y = 84 |
| Suggested fixed logical pivot | (48, 85), measured from the cell's top-left boundary |
| Verified SHA-256 | `bc7d562ca39204d526890865e2cdc6c6c0903dce5ccd3ab53a5e2baeba0a91fe` |

The **96 × 96 size is the animation frame rectangle**, including transparent padding. The visible body, clothing, equipment, handled goods and effects occupy different bounds in different poses. Preserve the complete cell when importing. The visible idle silhouette is 52 pixels tall in every frame, including the braid and walking stick; walking poses are 51–52 pixels tall. The 96 × 96 extraction rectangle includes transparent padding and is not the character's body size. Keep the complete frame so the cane, trade items and local effects retain their registration. The digest above identifies the final PNG documented here.

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
| Rest the stick on the ground | Breathe and lift the shawl slightly | Shift weight gently | Ease the shoulders | Let the shawl hem settle | Return toward the starting stance |

**Suggested durations:** `[160, 160, 160, 160, 160, 160]` ms; **total:** 960 ms. **Finish:** repeat.

### Row 02 — Walk

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| First foot contact under the stick | Transfer weight and advance the stick | Pass the free foot forward | Opposite foot contact and stick support | Shift through the next support pose | Bring the next foot forward toward the first contact |

**Suggested durations:** `[180, 180, 180, 180, 180, 180]` ms; **total:** 1080 ms. **Finish:** repeat.

The walking stick moves with the gait. Its visible placement is part of the animation; do not pin a separate copy to the ground while the drawn stick advances.

### Row 03 — Death

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Buckle while holding the stick | Lower toward one knee | Tip sideways and loosen the grip | Land with the stick slipping beside her | Settle the shawl and fallen stick | Hold the identical fallen pose |

**Suggested durations:** `[100, 140, 160, 150, 180, 200]` ms; **total:** 930 ms. **Finish:** hold frame 6.

### Row 04 — Take a hit

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Flinch through the shoulders | Draw the free hand inward | Take a short recoiling step | Replant and steady the walking stick | Straighten the shoulders | Return to the normal idle pose |

**Suggested durations:** `[60, 80, 100, 100, 120, 120]` ms; **total:** 580 ms. **Finish:** controller decision.

### Row 05 — Heal / receive healing

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lower the chin | Bring the free hand to the chest | Gather received warm gold light at the chest | Straighten as the light spreads | Let the remaining gold light fade | Return to idle without the glow |

**Suggested durations:** `[100, 120, 150, 180, 140, 120]` ms; **total:** 810 ms. **Finish:** idle.

### Row 06 — Buy

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Accept and hold the dried-herb bundle | Lift the herbs for inspection | Tuck the herbs into the hip pouch | Draw a small coin with the free hand | Extend the coin toward the player | Finish the exchange and return to idle |

**Suggested durations:** `[130, 160, 170, 150, 170, 140]` ms; **total:** 920 ms. **Finish:** idle.

Here the elder buys the player's dried herbs and pays the player. The stick remains planted while the free hand handles the herbs, pouch and coin.

### Row 07 — Sell

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Reach into the pouch for the woven charm | Raise the woven charm for display | Extend the charm toward the player | Open the empty palm after the charm is taken | Receive a small gold coin | Pocket the coin and return to idle |

**Suggested durations:** `[140, 160, 170, 140, 150, 140]` ms; **total:** 900 ms. **Finish:** idle.

The elder sells a woven charm and receives payment. The charm is a handled item, while the brass brooch remains part of the shawl.

### Row 08 — Wave

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Notice the player | Lift the free hand beside the shoulder | Wave the palm outward | Wave it back | Lower the free hand | Return to normal idle |

**Suggested durations:** `[100, 130, 100, 100, 120, 120]` ms; **total:** 670 ms. **Finish:** idle.

### Row 09 — Talking

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Rest with a closed mouth | Open the mouth with a measured nod | Raise a small palm-up gesture | Speak with the open palm held forward | Lower the gesture and close the mouth | Return to the exact starting talking pose |

**Suggested durations:** `[160, 130, 150, 170, 140, 150]` ms; **total:** 900 ms. **Finish:** repeat.

Keep the feet and planted stick fixed in world space during conversation. The mouth shapes and small free-hand gesture supply the motion.

### Row 10 — Hide

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Glance ahead | Draw the stick close | Bend the knees | Lower into a compact crouch | Tuck the head and elbows beside the stick | Hold the identical crouched pose |

**Suggested durations:** `[110, 120, 130, 140, 160, 180]` ms; **total:** 840 ms. **Finish:** hold frame 6.

The crouch remains fully visible. Any cover and its occlusion belong to the level.

### Row 11 — Teleport out

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Brace with the stick | Gather violet and cyan sparks at the shoes | Wrap a thin ripple around her and the stick | Break the whole silhouette into colored flecks | Fade to the last few sparks | Become fully transparent |

**Suggested durations:** `[90, 100, 120, 110, 100, 80]` ms; **total:** 600 ms. **Finish:** hold invisible frame 6.

### Row 12 — Teleport in

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Show a small violet and cyan spark | Widen it into a thin ripple | Reveal the elder and stick as a silhouette | Resolve the braid, shawl, body and stick | Plant shoes and stick as sparks fade | Return to the exact normal idle pose |

**Suggested durations:** `[90, 100, 120, 120, 100, 120]` ms; **total:** 650 ms. **Finish:** idle or locomotion.

### Suggested gameplay event points

These hooks are starting choices for the controller, not automatic actions contained in the PNG. Dispatch each event **once when entering its frame**, including an F1 event when a clip starts, not on every render update.

| Action / event | Suggested frame | Controller action |
|---|---|---|
| `healing_received` | Row 5, F3 | Acknowledge an authorized incoming heal as the chest glow appears. The gesture receives healing; it does not cast a spell or choose healing targets. |
| `buy_goods_received` | Row 6, F1 | Use the held herbs as a visual receipt cue for a validated handoff from the player; inventory changes remain the transaction controller's responsibility. |
| `buy_payment_offer` | Row 6, F5 | Present the elder's payment to the player. Resolve the exchange once through the transaction controller, rather than treating every rendered coin as a new payment. |
| `sell_goods_handoff` | Row 7, F4 | The charm has left the elder's hand. Use this visual handoff after the trade has been validated. |
| `sell_payment_received` | Row 7, F5 | The elder receives the player's coin. Use the receipt cue to finish the validated sale without creating a second coin or charm. |
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
  {"id":"walk","row":2,"loop":true,"ms":[180,180,180,180,180,180],"finish":"repeat"},
  {"id":"death","row":3,"loop":false,"ms":[100,140,160,150,180,200],"finish":"hold frame 6"},
  {"id":"hit","row":4,"loop":false,"ms":[60,80,100,100,120,120],"finish":"controller decision"},
  {"id":"heal","row":5,"loop":false,"ms":[100,120,150,180,140,120],"finish":"idle","events":{"3":"healing_received"}},
  {"id":"buy","row":6,"loop":false,"ms":[130,160,170,150,170,140],"finish":"idle","events":{"1":"buy_goods_received","5":"buy_payment_offer"}},
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
| Heal, row 5 | `[84, 84, 84, 84, 84, 84]` | The glow stays at or above the common ground line. |
| Teleport out, row 11 | `[84, 85, 86, 85, 81, empty]` | F6 is intentionally empty; preceding values include sparks and the dissolving silhouette. |
| Teleport in, row 12 | `[64, 77, 85, 84, 84, 84]` | Includes the initial spark, ripple, forming body and final solid idle pose. |

The table measures the lowest **visible pixel**, including magic. It is not a collision or foot-contact test. Do not vertically realign effect frames to their visible bottoms. Incoming healing, teleport activation and destination transfer are game rules; the local glow, ripple and flecks are already drawn into the frames.

### Walking stick, braid and free-hand gestures

The walking stick is already drawn in each relevant frame. Preserve the complete cell and mirror the whole image when changing facing. Avoid adding a second cane sprite on top of it. The braid, triangular shawl and stick are the main small-scale identification features.

During buying, selling, waving and talking, the forward hand supports the planted stick while the free hand performs the gesture. In death the stick slips to the ground and remains visible beside the body. Teleportation includes the stick, so do not leave a separate cane object behind when the elder becomes invisible.

### Trade direction and item identity

The buy row receives dried herbs and pays a coin; the sell row hands over a woven charm and receives a coin. These directions are from the elder's point of view. The permanent hip pouch and shawl brooch are equipment, not the goods being exchanged.

The herbs, charm and coins are already part of their specific frame pixels. Their appearance is an animation cue, not an inventory record. Authoritative item counts, payment checks and interrupted-trade behavior should be handled by the game's transaction logic.

### Receiving healing and taking cover

The gold sequence depicts the elder receiving healing at her chest. It does not establish a ranged healing spell or a cast socket. Keep incoming-heal rules separate from the visual response.

The hide animation ends in a compact visible crouch with the stick close. Place level cover in front when occlusion is wanted, and define the crouched collision shape separately. The sheet has no dedicated crouch-walk or stand-up row.

### Pixel-art import and gameplay geometry

Use integer display scales when practical and avoid smoothing or lossy recompression. The minimum transparent cell-edge padding in this PNG is **9 pixels**. Preserve the original frame size and registration when repacking; if a filtered texture atlas is required, use its padding/extrusion controls to prevent texture bleeding.

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
