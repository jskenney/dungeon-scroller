# Skeleton Enemy Sprite Sheet — Implementation Guide

## 1. Asset and contents

This guide describes the final **`undead_enemy_spritesheet.png`**. It contains three ranks of left-facing undead enemies for a side-scrolling game: a normal skeleton, a skeleton knight, and a death knight. Use this filename rather than one of the earlier source or review images. The PNG stores the artwork; animation names, frame durations, collision shapes, damage, movement speed, and transitions must be defined in the game.

| Property | Value |
|---|---|
| Image dimensions | **576 × 2016 pixels** |
| Grid | **6 columns × 21 rows** |
| Frame/cell dimensions | **96 × 96 pixels** |
| Total frames | **126** |
| Animation rows | **21**, six frames each |
| Color format | RGBA PNG |
| Transparency | Binary alpha: transparent `0`, visible `255` |
| Native facing | Left |
| Grid origin | `(0, 0)`, at the top-left image corner |
| Grid spacing / outer margin | `0 / 0` pixels |
| Ground contact | Last visible ground pixel at local **y = 84** in every frame |
| Minimum internal transparent edge padding | **3 pixels**, measured across the final sheet |
| Suggested logical drawing pivot | **(48, 85)**, in cell pixel-boundary coordinates |

The transparent space is **inside** each 96 × 96 cell; it is not grid spacing. Do not configure a three-pixel importer margin because the artwork has three pixels of minimum padding.

| Enemy | Rows, inclusive | Flat frame indices, inclusive | Appearance |
|---|---:|---:|---|
| Normal skeleton | 01–07 | 0–41 | Wiry ivory bones, cracked jaw, deep eye sockets, exposed ribs, long forearms, faded red waist sash, empty hands. |
| Skeleton knight | 08–14 | 42–83 | The same exposed skeletal anatomy and red sash, a broader guard, and a chipped short sword. It remains visibly less armored than the next rank. |
| Death knight | 15–21 | 84–125 | Skeletal anatomy beneath tarnished black plate, visible cracked jaw, torn teal tabard, and a heavy blade carried with both hands. |

The three ranks share the bone palette and skeletal features. Their attack rows use body and weapon motion; this sheet does not contain projectile, spell, or arena-effect animations. There are no flight or jump rows in this sheet.

## 2. Coordinate conventions and slicing

All **row and column numbers in this guide are 1-based**. Pixel coordinates and flat frame indices are **0-based**. The x coordinate increases rightward and y increases downward. A rectangle is written as `(x, y, width, height)` and uses half-open bounds: `(x, y, 96, 96)` covers x through x + 95 and y through y + 95.

For row `r` in 1–21 and column `c` in 1–6:

```text
x = (c - 1) × 96
y = (r - 1) × 96
width = 96
height = 96
flat_index = (r - 1) × 6 + (c - 1)
```

| Column / stage | 1 / F1 | 2 / F2 | 3 / F3 | 4 / F4 | 5 / F5 | 6 / F6 |
|---|---:|---:|---:|---:|---:|---:|
| Zero-based column | 0 | 1 | 2 | 3 | 4 | 5 |
| Source x | 0 | 96 | 192 | 288 | 384 | 480 |

Every animation reads **F1 → F2 → F3 → F4 → F5 → F6** across one row. For example, skeleton knight thrust contact at row 12, column 4 is source rectangle **`(288, 1056, 96, 96)`**, flat index **69**. The last cell in the sheet is `(480, 1920, 96, 96)`, index 125.

## 3. Animation catalog

### Row map

`Loop` means restart at F1 after F6. `Once → locomotion` means play once and return control to the state machine, usually to that enemy’s idle or walk. `Once → hold F6` means stop on the corpse pose until the game removes it. The identifiers below are recommended code names; the PNG has no embedded animation identifiers.

| Row | Animation | Identifier | Source y | Flat indices | Playback |
|---:|---|---|---:|---:|---|
| 01 | Normal skeleton — Idle | `normal_skeleton_idle` | 0 | 0–5 | Loop |
| 02 | Normal skeleton — Walk | `normal_skeleton_walk` | 96 | 6–11 | Loop |
| 03 | Normal skeleton — Hit reaction | `normal_skeleton_hit` | 192 | 12–17 | Once → locomotion |
| 04 | Normal skeleton — Death | `normal_skeleton_death` | 288 | 18–23 | Once → hold F6 |
| 05 | Normal skeleton — Quick claw swipe | `normal_skeleton_light_attack` | 384 | 24–29 | Once → locomotion |
| 06 | Normal skeleton — Lunging rake | `normal_skeleton_medium_attack` | 480 | 30–35 | Once → locomotion |
| 07 | Normal skeleton — Two-handed slam | `normal_skeleton_heavy_attack` | 576 | 36–41 | Once → locomotion |
| 08 | Skeleton knight — Idle | `skeleton_knight_idle` | 672 | 42–47 | Loop |
| 09 | Skeleton knight — Walk | `skeleton_knight_walk` | 768 | 48–53 | Loop |
| 10 | Skeleton knight — Hit reaction | `skeleton_knight_hit` | 864 | 54–59 | Once → locomotion |
| 11 | Skeleton knight — Death | `skeleton_knight_death` | 960 | 60–65 | Once → hold F6 |
| 12 | Skeleton knight — Quick thrust | `skeleton_knight_light_attack` | 1056 | 66–71 | Once → locomotion |
| 13 | Skeleton knight — Overhead chop | `skeleton_knight_medium_attack` | 1152 | 72–77 | Once → locomotion |
| 14 | Skeleton knight — Lunging sweep | `skeleton_knight_heavy_attack` | 1248 | 78–83 | Once → locomotion |
| 15 | Death knight — Idle | `death_knight_idle` | 1344 | 84–89 | Loop |
| 16 | Death knight — Walk | `death_knight_walk` | 1440 | 90–95 | Loop |
| 17 | Death knight — Hit reaction | `death_knight_hit` | 1536 | 96–101 | Once → locomotion |
| 18 | Death knight — Death | `death_knight_death` | 1632 | 102–107 | Once → hold F6 |
| 19 | Death knight — Pommel strike | `death_knight_light_attack` | 1728 | 108–113 | Once → locomotion |
| 20 | Death knight — Two-handed slash | `death_knight_medium_attack` | 1824 | 114–119 | Once → locomotion |
| 21 | Death knight — Overhead cleave | `death_knight_heavy_attack` | 1920 | 120–125 | Once → locomotion |

### Pose order in the delivered rows

These are reading cues for the finished six-frame rows, not separate poses that need to be drawn. Some deliberate holds and guard returns reuse identical pixels; retain their timeline slots as explained below.

| Row | F1 | F2 | F3 | F4 | F5 | F6 |
|---:|---|---|---|---|---|---|
| 01 | Neutral hunch | Jaw/shoulder shift | Sway forward | Uneven shoulder rise | Sway back | Near starting stance |
| 02 | First foot plant | Weight passes forward | Passing legs | Opposite foot plant | Weight passes back | Passing into first plant |
| 03 | Impact jolt | Shoulders recoil | Stagger | Catch balance | Straighten | Exact idle guard |
| 04 | Buckle | Drop to knees | Tip forward | Collapse inward | Settled bone pile | Same pile held |
| 05 | Lead-shoulder twitch | Hand lifts | Claw snaps forward | Full reach/contact | Arm retracts | Exact idle guard |
| 06 | Lean back | Draw arm wide | Lower hips | Rake with long step | Catch balance | Exact idle guard |
| 07 | Plant feet | Raise both arms | Hold overhead | Slam hands down | Low follow-through | Exact idle guard |
| 08 | Low sword guard | Grip/shoulder shift | Small upper-body shift | Weight settles | Sash/shoulder shift | Near starting guard |
| 09 | First boot plant | Advance over support | Passing legs | Opposite boot plant | Weight transfer | Passing into first plant |
| 10 | Flinch | Draw sword inward | Recoil | Rear-foot balance | Raise blade | Exact idle guard |
| 11 | Stagger with sword | Sword drops inside cell | Kneel beside sword | Fold into bones | Settled remains/sword | Same remains held |
| 12 | Set wrist | Draw blade back | Thrust forward | Full extension | Withdraw | Exact idle guard |
| 13 | Blade raised diagonally | Blade held high | Same high pose held | Chop downward | Low follow-through | Exact idle guard |
| 14 | Widen stance | Blade behind hip | Load rear leg | Step into sweep | Deep lunge finish | Exact idle guard |
| 15 | Broad low guard | Shoulder shift | Grip/weight adjustment | Settle weight | Tabard shift | Near starting guard |
| 16 | Heavy first foot plant | Weight transfer | Passing legs | Opposite foot plant | Weight transfer | Passing into first plant |
| 17 | Chest-plate jolt | Rock back | Blade lowers for balance | Lead foot replants | Blade rises | Exact idle guard |
| 18 | Lose balance | Drop to one knee | Blade slips beside body | Armor collapses | Settled armor/blade | Same remains held |
| 19 | Tighten grip | Bring blade close | Pommel drives forward | Contact reach | Pull back | Exact idle guard |
| 20 | Lower blade | Draw it back | Load rear leg | Slash at waist height | Low follow-through | Exact idle guard |
| 21 | Brace | Blade overhead | Same raised pose held | Cleave down | Planted low finish | Exact idle guard |

### Suggested playback durations and gameplay events

**The following timings and damage windows are implementation recommendations, not data embedded in the PNG and not recorded gameplay measurements.** They provide a starting point: the unarmored skeleton feels quick, the skeleton knight measured, and the death knight slower and heavier. Tune them with movement speed, attack reach, difficulty, and player reaction time.

Each duration array is **milliseconds for F1 through F6**, in that order. The total is the sum of these six durations. Death totals describe the transition before its indefinite corpse hold; they do not specify when the corpse should disappear. Suggested active columns refer to animation stages, not hitbox coordinates.

| Row | Duration array in ms, F1–F6 | Total / loop period, ms | Suggested damage-active columns |
|---:|---|---:|---|
| 01 | `[170, 170, 170, 170, 170, 170]` | 1020 | None |
| 02 | `[85, 85, 85, 85, 85, 85]` | 510 | None |
| 03 | `[55, 70, 80, 85, 90, 80]` | 460 | None |
| 04 | `[90, 110, 120, 150, 180, 180]` | 830 | None |
| 05 | `[60, 60, 45, 75, 90, 100]` | 430 | F3, F4 |
| 06 | `[90, 110, 100, 70, 120, 120]` | 610 | F4 |
| 07 | `[110, 130, 240, 70, 160, 160]` | 870 | F4 |
| 08 | `[180, 180, 180, 180, 180, 180]` | 1080 | None |
| 09 | `[120, 120, 120, 120, 120, 120]` | 720 | None |
| 10 | `[70, 90, 100, 100, 110, 100]` | 570 | None |
| 11 | `[120, 140, 140, 160, 180, 180]` | 920 | None |
| 12 | `[70, 80, 55, 80, 110, 110]` | 505 | F3, F4 |
| 13 | `[120, 140, 220, 80, 150, 140]` | 850 | F4 |
| 14 | `[120, 150, 220, 90, 180, 160]` | 920 | F4, F5 |
| 15 | `[220, 220, 220, 220, 220, 220]` | 1320 | None |
| 16 | `[170, 170, 170, 170, 170, 170]` | 1020 | None |
| 17 | `[90, 110, 120, 120, 130, 120]` | 690 | None |
| 18 | `[160, 180, 180, 220, 240, 240]` | 1220 | None |
| 19 | `[100, 110, 70, 90, 140, 140]` | 650 | F3, F4 |
| 20 | `[140, 160, 210, 100, 180, 180]` | 970 | F4 |
| 21 | `[160, 180, 320, 110, 220, 220]` | 1210 | F4 |

For a light attack, F1–F2 is the short preparation and F3–F4 is the forward contact region. Medium attacks release at F4 after their larger preparation. Heavy attacks deliberately give F3 more time before the F4 release. The knight’s lunging sweep can remain active through F5 because its extended follow-through still carries the blade forward; make it a single attack instance so one victim is not damaged twice merely because two frames are active.

The pommel strike uses the hilt/near-hand region, not the far blade tip. Author its hit shape accordingly. None of these suggested windows supplies a hitbox, reach value, knockback amount, damage value, sound, or invulnerability rule.

## 4. Building and playing the sequences

### Import and clip construction

1. Import the PNG at its original dimensions with nearest-neighbor/point sampling. Disable smoothing and lossy texture compression where they would soften pixel edges.
2. Slice a fixed grid of 96 × 96 cells, with zero outer margin and zero spacing. Keep the full transparent cell for every frame.
3. Create one six-frame clip for each catalog row. In an importer using zero-based rows, subtract one from the documented row number. Use the flat indices listed above if it imports the atlas as a single numbered sequence.
4. Assign the durations from the recommendation table, or your own six positive durations. Configure the loop or completion behavior from the row map.
5. Give every frame the same logical pivot. Apply horizontal travel, collisions, attack triggers, and facing through the game’s actor/state logic.

The following engine-independent JavaScript constructs all 21 clip descriptors. It does not depend on a particular rendering library. `frameRect()` accepts the guide’s 1-based row and column; the clip’s `columns0` list is explicitly zero-based for use in code.

```javascript
const CELL = 96;
const COLUMNS = 6;
const ROWS = 21;
const PIVOT = { x: 48, y: 85 };

function frameRect(row1, column1) {
  if (row1 < 1 || row1 > ROWS || column1 < 1 || column1 > COLUMNS) {
    throw new RangeError("Sprite row/column outside this sheet");
  }
  return {
    x: (column1 - 1) * CELL,
    y: (row1 - 1) * CELL,
    width: CELL,
    height: CELL
  };
}

// [identifier, row1, durationMs[F1..F6], loop, after, activeColumns1]
const definitions = [
  ["normal_skeleton_idle", 1, [170, 170, 170, 170, 170, 170], true, "repeat", []],
  ["normal_skeleton_walk", 2, [85, 85, 85, 85, 85, 85], true, "repeat", []],
  ["normal_skeleton_hit", 3, [55, 70, 80, 85, 90, 80], false, "locomotion", []],
  ["normal_skeleton_death", 4, [90, 110, 120, 150, 180, 180], false, "hold", []],
  ["normal_skeleton_light_attack", 5, [60, 60, 45, 75, 90, 100], false, "locomotion", [3, 4]],
  ["normal_skeleton_medium_attack", 6, [90, 110, 100, 70, 120, 120], false, "locomotion", [4]],
  ["normal_skeleton_heavy_attack", 7, [110, 130, 240, 70, 160, 160], false, "locomotion", [4]],
  ["skeleton_knight_idle", 8, [180, 180, 180, 180, 180, 180], true, "repeat", []],
  ["skeleton_knight_walk", 9, [120, 120, 120, 120, 120, 120], true, "repeat", []],
  ["skeleton_knight_hit", 10, [70, 90, 100, 100, 110, 100], false, "locomotion", []],
  ["skeleton_knight_death", 11, [120, 140, 140, 160, 180, 180], false, "hold", []],
  ["skeleton_knight_light_attack", 12, [70, 80, 55, 80, 110, 110], false, "locomotion", [3, 4]],
  ["skeleton_knight_medium_attack", 13, [120, 140, 220, 80, 150, 140], false, "locomotion", [4]],
  ["skeleton_knight_heavy_attack", 14, [120, 150, 220, 90, 180, 160], false, "locomotion", [4, 5]],
  ["death_knight_idle", 15, [220, 220, 220, 220, 220, 220], true, "repeat", []],
  ["death_knight_walk", 16, [170, 170, 170, 170, 170, 170], true, "repeat", []],
  ["death_knight_hit", 17, [90, 110, 120, 120, 130, 120], false, "locomotion", []],
  ["death_knight_death", 18, [160, 180, 180, 220, 240, 240], false, "hold", []],
  ["death_knight_light_attack", 19, [100, 110, 70, 90, 140, 140], false, "locomotion", [3, 4]],
  ["death_knight_medium_attack", 20, [140, 160, 210, 100, 180, 180], false, "locomotion", [4]],
  ["death_knight_heavy_attack", 21, [160, 180, 320, 110, 220, 220], false, "locomotion", [4]],

];

const clips = Object.fromEntries(definitions.map(
  ([id, row1, durationMs, loop, after, activeColumns1]) => [id, {
    row1,
    columns0: [0, 1, 2, 3, 4, 5],
    frameIndices: [0, 1, 2, 3, 4, 5].map(c => (row1 - 1) * 6 + c),
    rectangles: [1, 2, 3, 4, 5, 6].map(c => frameRect(row1, c)),
    durationMs,
    loop,
    after,
    activeColumns1
  }]
));

function sampleClip(clip, elapsedMs) {
  const total = clip.durationMs.reduce((sum, ms) => sum + ms, 0);
  const elapsed = Math.max(0, elapsedMs);
  const finished = !clip.loop && elapsed >= total;
  if (finished) {
    return { column1: 6, rect: clip.rectangles[5], finished: true };
  }
  let t = clip.loop ? elapsed % total : elapsed;
  for (let i = 0; i < 6; i++) {
    if (t < clip.durationMs[i]) {
      return { column1: i + 1, rect: clip.rectangles[i], finished: false };
    }
    t -= clip.durationMs[i];
  }
  return { column1: 6, rect: clip.rectangles[5], finished: false };
}

// Example: start this clip with elapsedMs = 0 when an attack is accepted.
const attack = clips.skeleton_knight_light_attack;
const elapsedMs = 150; // Replace with time since this clip began.
const sample = sampleClip(attack, elapsedMs);
// Draw sample.rect from undead_enemy_spritesheet.png at the fixed actor pivot.
// If sample.finished and attack.after === "locomotion", let the state machine
// select idle or walk. If after === "hold", keep the returned final rectangle.
```

Reset elapsed time when entering a new clip, not on every update. A walk loop must accumulate time while walking rather than continually restarting at F1. Do not reverse or ping-pong the walk frames: play their authored left-to-right order and mirror the rendered sprite when its facing changes.

### World position, pivot, and flipping

With the suggested pivot `(48, 85)`, draw a 96 × 96 source cell so its top-left destination is `(actorX - 48, groundY - 85)` at native size. This places the bottom edge of source pixel row 84 on the world ground boundary. At scale `s`, multiply both the frame dimensions and pivot offsets by `s`; prefer integer display scales when practical.

The packer used a nominal pelvis registration near local x54, while the suggested drawing pivot is the convenient cell-center x48. Those are different concepts: x48 is an engine anchor, not a claim that every pelvis pixel lies there. If your gameplay root must sit directly under the nominal pelvis, use `(54, 85)` consistently instead and perform mirroring around that same world-space pivot. Do not choose a new pivot from each frame’s visible bounds.

All frames face left. To face right, mirror the drawing around the actor’s fixed pivot; keep the sequence order unchanged. Mirror any separate hitboxes, weapon markers, or facing-dependent offsets in the same coordinate system. Walking and attack motion are poses in place; the game determines world displacement and speed. Do not move an actor by the amount that its sword, sash, or silhouette bounding box shifts between frames.

### Clip completion and events

For idle and walk, F6 returns to F1 continuously. For hit reactions and attacks, play through F6, then let the state machine choose locomotion or the next authorized action. F6 is already the exact first idle/guard frame for that enemy, which makes a return to idle visually predictable. For death, stop on F6 and retain it until your corpse cleanup, fade, or scene logic removes the actor; do not loop the death or return it to guard.

Dispatch an attack event on entering the chosen release stage, or keep a hit shape active for the recommended interval. Process all crossed frame boundaries if a slow update skips across a release frame. Track which targets have been hit during one attack instance. These recommendations prevent frame rate from deciding whether an attack fires, and prevent repeated damage from a held contact pose.

## 5. Important notes about the delivered artwork

- **Full-cell geometry is authoritative.** The 96 × 96 crop rectangle includes transparent room for swords, lunges, scattered bones, and fallen equipment. Tight-cropping each frame and centering that crop again will introduce motion that is not in the source sheet. If an atlas optimizer trims sprites, preserve the original 96 × 96 source size and per-frame trim offsets.
- **Grounded registration is consistent.** Every final frame’s lowest visible pixel is local y84, including the final bone piles and armored remains. The visible bodies are smaller than a cell; 96 × 96 is the extraction size, not the character’s measured body size or a collision-box recommendation.
- **The death holds are exact duplicates.** F5 and F6 match pixel-for-pixel in rows 04, 11, and 18. Keep both slots if using these six-frame timing arrays; the last slot then remains held indefinitely.
- **Two anticipation holds are exact duplicates.** F2 and F3 match in skeleton knight overhead chop (row 13) and death knight overhead cleave (row 21). The longer F3 duration is intentional telegraph time. Automatically removing duplicate images without preserving their combined duration would shorten the windup.
- **Guard returns are exact copies.** For each enemy, F6 of its hit, light, medium, and heavy rows equals F1 of its idle row: rows 03/05/06/07 return to row 01; rows 10/12/13/14 return to row 08; rows 17/19/20/21 return to row 15. These were checked against the final PNG rather than inferred from visual similarity.
- **Physical strikes stay in the sprite.** The sword, hilt, hands, bones, armor, and sash belong to each frame. Do not spawn a second weapon over the baked-in one unless you deliberately replace that presentation. Dropped blades remain part of the death artwork; a separately interactive dropped weapon would need its own game asset and logic.
- **Collision remains separate.** A large sword or bone pile changes the alpha bounds without defining the actor’s body collider. Author body/hurt shapes and attack shapes separately. Choose whether deaths disable collision, leave a corpse obstacle, or simply remain visual.
- **No gameplay metadata is embedded.** Damage, timing, velocity, hit stun, sound, hit stop, loot, invulnerability, and state transitions are not encoded in this PNG. The tables and code above are recommended implementation data that you can change without changing the image.

Verification used the final PNG, the saved frame map, the packing code, and the export validation report. The image is 576 × 2016 RGBA with 126 nonempty cells, alpha values only 0 and 255, a common visible ground y84, and at least three transparent pixels between each cell boundary and its silhouette. This verifies export geometry and the stated duplicate frames; it is not an engine playtest.

For identifying this exact delivered file, its SHA-256 is:

```text
663416557085e92aff0300ddb3b9298a970a170fb683d3e12a1736eddcc8975d
```

## 6. Exact frame rectangles

Each entry is **`(x, y, width, height)`**, in pixels, for the complete frame. Rows are 1-based; F1–F6 correspond to columns 1–6. The row map in section 3 supplies the animation name and flat frame-index range for every row.

| Row | F1 | F2 | F3 | F4 | F5 | F6 |
|---:|---|---|---|---|---|---|
| 01 | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |
| 15 | `(0, 1344, 96, 96)` | `(96, 1344, 96, 96)` | `(192, 1344, 96, 96)` | `(288, 1344, 96, 96)` | `(384, 1344, 96, 96)` | `(480, 1344, 96, 96)` |
| 16 | `(0, 1440, 96, 96)` | `(96, 1440, 96, 96)` | `(192, 1440, 96, 96)` | `(288, 1440, 96, 96)` | `(384, 1440, 96, 96)` | `(480, 1440, 96, 96)` |
| 17 | `(0, 1536, 96, 96)` | `(96, 1536, 96, 96)` | `(192, 1536, 96, 96)` | `(288, 1536, 96, 96)` | `(384, 1536, 96, 96)` | `(480, 1536, 96, 96)` |
| 18 | `(0, 1632, 96, 96)` | `(96, 1632, 96, 96)` | `(192, 1632, 96, 96)` | `(288, 1632, 96, 96)` | `(384, 1632, 96, 96)` | `(480, 1632, 96, 96)` |
| 19 | `(0, 1728, 96, 96)` | `(96, 1728, 96, 96)` | `(192, 1728, 96, 96)` | `(288, 1728, 96, 96)` | `(384, 1728, 96, 96)` | `(480, 1728, 96, 96)` |
| 20 | `(0, 1824, 96, 96)` | `(96, 1824, 96, 96)` | `(192, 1824, 96, 96)` | `(288, 1824, 96, 96)` | `(384, 1824, 96, 96)` | `(480, 1824, 96, 96)` |
| 21 | `(0, 1920, 96, 96)` | `(96, 1920, 96, 96)` | `(192, 1920, 96, 96)` | `(288, 1920, 96, 96)` | `(384, 1920, 96, 96)` | `(480, 1920, 96, 96)` |
