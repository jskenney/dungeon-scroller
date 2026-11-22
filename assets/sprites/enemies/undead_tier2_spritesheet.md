# Mid-tier undead sprite sheet — implementation guide

This guide describes the final `undead_tier2_spritesheet.png`: the Undead Wolf, Wight, and Lich, facing **left** toward a right-facing hero. The coordinate and duplicate-frame facts below were checked against the final PNG. The pose descriptions summarize the visible animation; timing, combat events, pivots, and transitions are implementation recommendations you can tune for your game.

## 1. Asset contents and dimensions

| Property | Value |
|---|---|
| PNG filename | `undead_tier2_spritesheet.png` |
| Canvas | **576 × 2016 pixels** |
| Grid | **6 columns × 21 rows** |
| Frame/cell size | **96 × 96 pixels** |
| Total frames | **126**, including intentional recovery and death-hold repeats |
| Animations | **21**, each occupying one complete row |
| Image mode | RGBA PNG |
| Alpha | Binary: 0 transparent, 255 opaque |
| Grid margin / spacing | **0 / 0 pixels**; cell-internal transparent padding is already included |
| Direction | Left-facing artwork |
| Minimum transparent edge padding | **5 pixels** in every cell of this final PNG |

| Character | Rows, inclusive | Region `(x, y, width, height)` | Description |
|---|---:|---|---|
| Undead Wolf | 1–7 | `(0, 0, 576, 672)` | Low, long quadruped with patchy ash-gray fur, exposed ivory ribs, a cracked muzzle, and faint grave-colored eyes. |
| Wight | 8–14 | `(0, 672, 576, 672)` | Lean undead warrior with a sunken face, chainmail, a charcoal mantle, a pitted blade, and free-hand grave magic. |
| Lich | 15–21 | `(0, 1344, 576, 672)` | Hovering skeletal archmage with a narrow crown, ragged robes, and a crooked staff with a pale blue-green crystal. |

All frame rectangles are 96 × 96. The visible character is smaller and changes shape with the pose; never use the visible bounding box as the grid size. Measured opaque bounds for the first idle frame are 59 × 33 pixels for the Wolf, 54 × 53 for the Wight, and 44 × 55 for the Lich. Across all poses, including weapons and local effects, the respective width/height ranges are Wolf 52–62 / 20–37, Wight 43–61 / 23–67, and Lich 44–63 / 23–68 pixels.

The palette uses bone ivory, worn brown-gray metal, charcoal, and muted blue-green magic. The background is transparent; labels, grid lines, scenery, and floor shadows are absent. Put this Markdown file beside the PNG if you want a portable asset folder; all references here use the PNG basename.

## 2. Coordinate conventions and frame lookup

Rows and columns in this document are **1-based**. Pixel coordinates are **0-based**, measured from the image’s **top-left**: x increases right, y increases down. Each rectangle is `(x, y, width, height)` and is half-open: pixels from x through x + width − 1 and y through y + height − 1 belong to it. A separate flattened frame index is **0-based** and increases left to right, then top to bottom.

```text
x = (column - 1) × 96
y = (row - 1) × 96
rectangle = (x, y, 96, 96)
flatIndex = (row - 1) × 6 + (column - 1)
```

| Column / sequence position | Zero-based local frame | X coordinate | Pixel x range, inclusive |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

For example, the Wolf’s airborne pounce is **row 7, column 4**: rectangle `(288, 576, 96, 96)`, flat index **39**. The Lich’s volley release is **row 20, column 4**: rectangle `(288, 1824, 96, 96)`, flat index **117**. Both use local animation frame index 3 in zero-based code.

## 3. Animation catalog

Every row plays **C1 → C2 → C3 → C4 → C5 → C6**. Only idle and movement rows loop. Other living actions play once and then yield to the appropriate state; each death plays once and holds C6. A row contains six displayed frames, not necessarily six unique pieces of artwork.

| Row | Character / animation | Suggested animation ID | Y coordinate | Flat indices | Playback |
|---:|---|---|---:|---|---|
| 01 | Wolf — Idle | `undead_wolf_idle` | 0 | 0–5 | Loop C1–C6 |
| 02 | Wolf — Stalking trot | `undead_wolf_move` | 96 | 6–11 | Loop C1–C6 |
| 03 | Wolf — Hit reaction | `undead_wolf_hit` | 192 | 12–17 | Once; state transition |
| 04 | Wolf — Death | `undead_wolf_death` | 288 | 18–23 | Once; hold C6 |
| 05 | Wolf — Light — Snap bite | `undead_wolf_bite` | 384 | 24–29 | Once; state transition |
| 06 | Wolf — Medium — Raking lunge | `undead_wolf_rake` | 480 | 30–35 | Once; state transition |
| 07 | Wolf — Heavy — Pounce | `undead_wolf_pounce` | 576 | 36–41 | Once; state transition |
| 08 | Wight — Idle | `wight_idle` | 672 | 42–47 | Loop C1–C6 |
| 09 | Wight — Measured walk | `wight_move` | 768 | 48–53 | Loop C1–C6 |
| 10 | Wight — Hit reaction | `wight_hit` | 864 | 54–59 | Once; state transition |
| 11 | Wight — Death | `wight_death` | 960 | 60–65 | Once; hold C6 |
| 12 | Wight — Light — Rising cut | `wight_rising_cut` | 1056 | 66–71 | Once; state transition |
| 13 | Wight — Medium — Grave grasp | `wight_grave_grasp` | 1152 | 72–77 | Once; state transition |
| 14 | Wight — Heavy — Empowered cleave | `wight_empowered_cleave` | 1248 | 78–83 | Once; state transition |
| 15 | Lich — Hovering idle | `lich_idle` | 1344 | 84–89 | Loop C1–C6 |
| 16 | Lich — Glide | `lich_move` | 1440 | 90–95 | Loop C1–C6 |
| 17 | Lich — Hit reaction | `lich_hit` | 1536 | 96–101 | Once; state transition |
| 18 | Lich — Death | `lich_death` | 1632 | 102–107 | Once; hold C6 |
| 19 | Lich — Light — Grave bolt | `lich_grave_bolt` | 1728 | 108–113 | Once; state transition |
| 20 | Lich — Medium — Spectral volley | `lich_spectral_volley` | 1824 | 114–119 | Once; state transition |
| 21 | Lich — Heavy — Grave eruption | `lich_grave_eruption` | 1920 | 120–125 | Once; state transition |

### Undead Wolf: rows 1–7

| Row / animation | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 01 — Idle | Low stalking stance | Muzzle dips | Ear / shoulder shift | Weight shifts | Muzzle rises | Settle toward start |
| 02 — Stalking trot | First diagonal support pair | Passing stride | Next step begins | Opposite diagonal support pair | Passing stride | Return toward first support |
| 03 — Hit reaction | Impact jolt | Head and chest recoil | Forepaws skid / stagger | Catch balance | Replant paws | Idle stance |
| 04 — Death | Stumble | Forelegs buckle | Roll / lower to side | Head and hindquarters drop | Settled fallen pose | Same fallen pose |
| 05 — Light — Snap bite | Dip muzzle | Open jaws | Closed-jaw contact | Brief closed-jaw extension | Pull back | Idle stance |
| 06 — Medium — Raking lunge | Rock weight back | Raise one forepaw | Drive forward | Rake downward | Land on striking paw | Idle stance |
| 07 — Heavy — Pounce | Lower chest | Coil hind legs | Held crouch | Airborne forepaw extension | Low landing | Idle stance |

### Wight: rows 8–14

| Row / animation | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 08 — Idle | Blade held low | Shoulders shift | Grip / fingers move | Mantle settles | Weight shifts | Settle toward start |
| 09 — Measured walk | First foot plant | Weight transfers | Feet pass | Opposite foot plant | Rear foot lifts | Passing step toward start |
| 10 — Hit reaction | Chest jolt | Lean back | Pull blade close | Catch weight on rear foot | Square shoulders | Idle guard |
| 11 — Death | Lose blade grip | Sink to one knee beside blade | Fold sideways | Mantle and body collapse | Settled body and blade | Same settled remains |
| 12 — Light — Rising cut | Lower sword tip | Turn wrist / prepare | Cut upward | High extension | Lower blade | Idle guard |
| 13 — Medium — Grave grasp | Prepare free arm | Open hand | Gather palm light | Reach forward | Close glowing fingers | Idle guard |
| 14 — Heavy — Empowered cleave | Plant feet | Raise blade | Held charged blade | Downward cleave | Low follow-through | Idle guard |

### Lich: rows 15–21

| Row / animation | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 15 — Hovering idle | Neutral hover | Rise slightly | Upper part of bob | Return through center | Lower part of bob | Settle toward first hover |
| 16 — Glide | Lean into glide | Robes trail | Forward glide pose | Maximum trailing hems | Robes ripple back | Approach starting glide |
| 17 — Hit reaction | Skull snaps back | Staff tilts with recoil | Robes flare; staff retained | Dip toward ground | Steady staff / rise | Idle hover |
| 18 — Death | Crystal flickers | Lose height | Drop staff / sink | Collapse onto ground | Settled robes, bones and staff; glow faded | Same grounded remains |
| 19 — Light — Grave bolt | Prepare staff | Tip crystal forward | Compact spark at crystal | Small recoil | Raise staff | Idle hover |
| 20 — Medium — Spectral volley | Prepare staff / hand | Staff lifts; lights appear | Three lights gather around crystal | Three-light release flare | Lights fade | Idle hover |
| 21 — Heavy — Grave eruption | Prepare casting stance | Lift staff high | Held bright crystal | Point down-left with local flash | Hold casting finish | Idle hover |

### Actual repeats and transition frames

The following are byte-for-byte identical in the final PNG, confirmed by comparing complete 96 × 96 cells:

- Death rows **4, 11, and 18** have identical **C5 and C6**. Play both as listed or combine their durations; after completion, hold C6.
- Wolf rows **3, 5, 6, and 7**, C6, match **row 1, C1**.
- Wight rows **10, 12, 13, and 14**, C6, match **row 8, C1**.
- Lich rows **17, 19, 20, and 21**, C6, match **row 15, C1**.

Keep these repeats in a straightforward six-frame import. They provide recovery and held-pose time. The Wolf bite’s C3 and C4 both show closed-jaw contact, but they are separate rendered cells and are **not** byte-identical. Wight death was arranged to start with blade loss, then kneeling and collapse; its final two frames show the settled body with the dropped blade. Lich death ends with the faded-glow version of its remains in both C5 and C6. There is no need to reconstruct or reorder any source-generation frames: use the final row order.

## 4. Constructing and playing the animations

### Import and state handling

1. Load the PNG as an RGBA texture and slice a regular **96 × 96** grid, with six columns, zero outer grid margin, and zero inter-cell spacing.
2. Create one animation per catalog row and append its six cells in increasing column order. Do not continue into the next row.
3. Set only the six idle/movement animations to repeat. When a one-shot attack or hit response ends, select idle, movement, or another gameplay state as appropriate. Do not automatically replay an attack just because its last frame resembles idle.
4. When death ends, keep C6 visible until corpse cleanup or a deliberate state change. Do not return the character to idle.
5. Apply world movement, pathfinding, jumps, collision, damage, and projectile travel separately from frame playback. These sprites are registered in place.

### Recommended starting timings and events

The PNG stores **no frame durations, frame-rate metadata, gameplay events, hurtboxes, or hitboxes**. The values below are suggested starting points in milliseconds, ordered C1–C6. A long C3 makes a heavy windup readable without adding frames. The total is one six-frame pass, excluding any indefinite hold after death. Event columns are suggestions, not extracted gameplay metadata; use collision checks and ensure an attack can only apply the intended number of hits.

| Animation ID | C1–C6 durations, ms | Total, ms | Suggested event / handling |
|---|---|---:|---|
| `undead_wolf_idle` | `[160, 160, 160, 160, 160, 160]` | 960 | No combat event. |
| `undead_wolf_move` | `[90, 90, 90, 90, 90, 90]` | 540 | Optional footstep cues on C1 and C4. |
| `undead_wolf_hit` | `[60, 90, 100, 100, 100, 100]` | 550 | Receive damage when your gameplay system reports impact; this row displays the response. |
| `undead_wolf_death` | `[120, 140, 160, 180, 200, 200]` | 1000 | Disable normal AI and attacks on death entry; retain C6 afterward. |
| `undead_wolf_bite` | `[70, 70, 60, 80, 100, 120]` | 500 | Suggested bite contact on entering C3; optional active window C3–C4. |
| `undead_wolf_rake` | `[90, 110, 80, 90, 120, 130]` | 620 | Suggested claw contact C4; movement can begin at C3. |
| `undead_wolf_pounce` | `[100, 130, 220, 100, 140, 140]` | 830 | Suggested leap event C4 and landing/contact C5; gate actual contact through collision. |
| `wight_idle` | `[180, 180, 180, 180, 180, 180]` | 1080 | No combat event. |
| `wight_move` | `[130, 130, 130, 130, 130, 130]` | 780 | Optional footsteps on C1 and C4. |
| `wight_hit` | `[70, 100, 110, 110, 110, 110]` | 610 | Incoming damage is controlled by gameplay; the sword stays in hand. |
| `wight_death` | `[140, 160, 180, 190, 220, 220]` | 1110 | Disable attacks on death entry; retain C6 afterward. |
| `wight_rising_cut` | `[80, 80, 70, 90, 120, 130]` | 570 | Suggested blade contact C3–C4. |
| `wight_grave_grasp` | `[100, 120, 180, 90, 140, 150]` | 780 | Suggested grasp/cast event C4; resolve the grasp at C5 if desired. |
| `wight_empowered_cleave` | `[120, 150, 260, 90, 170, 170]` | 960 | Suggested melee strike C4; charge is held at C3. |
| `lich_idle` | `[180, 180, 180, 180, 180, 180]` | 1080 | No combat event; crystal light is part of the image. |
| `lich_move` | `[120, 120, 120, 120, 120, 120]` | 720 | Apply world travel independently; no footstep event. |
| `lich_hit` | `[70, 100, 110, 120, 130, 120]` | 650 | Gameplay controls incoming damage; C4 is the lowest hover dip. |
| `lich_death` | `[140, 170, 180, 200, 240, 240]` | 1170 | End hover and normal casting on death entry; retain C6 afterward. |
| `lich_grave_bolt` | `[80, 80, 70, 90, 120, 140]` | 580 | Spawn one separate traveling bolt on entering C3, at a chosen staff-tip socket. |
| `lich_spectral_volley` | `[100, 130, 190, 90, 160, 160]` | 830 | Spawn the volley once on entering C4; the crystal itself is not one of the three lights. |
| `lich_grave_eruption` | `[130, 160, 280, 100, 180, 170]` | 1020 | Trigger a separate ground/arena effect on entering C4; choose its destination in gameplay. |

Fire a cast or sound event when **entering** its chosen column, not on every render tick spent in that column. When one update advances past several frames, process each crossed frame-entry event. For melee active windows, track whether each target has already been hit during the current attack. The local cyan/green pixels in the sprite are presentation; they are not an automatically generated damage volume.

### Engine-independent JavaScript descriptors

This code creates every row’s six crop rectangles and timing definitions. `row` is 1-based; each generated `localFrame` and `flatIndex` is 0-based. The same formulas work in any engine even if its animation API differs.

```javascript
const sheet = {
  image: "undead_tier2_spritesheet.png",
  width: 576, height: 2016, columns: 6, rows: 21,
  frameWidth: 96, frameHeight: 96,
  pivot: { x: 48, y: 85 } // Recommended pixel-boundary pivot.
};

// mode: "loop", "once", or "hold" (one pass, then retain final frame).
const definitions = [
  {"id":"undead_wolf_idle","row":1,"mode":"loop","ms":[160,160,160,160,160,160]},
  {"id":"undead_wolf_move","row":2,"mode":"loop","ms":[90,90,90,90,90,90]},
  {"id":"undead_wolf_hit","row":3,"mode":"once","ms":[60,90,100,100,100,100]},
  {"id":"undead_wolf_death","row":4,"mode":"hold","ms":[120,140,160,180,200,200]},
  {"id":"undead_wolf_bite","row":5,"mode":"once","ms":[70,70,60,80,100,120]},
  {"id":"undead_wolf_rake","row":6,"mode":"once","ms":[90,110,80,90,120,130]},
  {"id":"undead_wolf_pounce","row":7,"mode":"once","ms":[100,130,220,100,140,140]},
  {"id":"wight_idle","row":8,"mode":"loop","ms":[180,180,180,180,180,180]},
  {"id":"wight_move","row":9,"mode":"loop","ms":[130,130,130,130,130,130]},
  {"id":"wight_hit","row":10,"mode":"once","ms":[70,100,110,110,110,110]},
  {"id":"wight_death","row":11,"mode":"hold","ms":[140,160,180,190,220,220]},
  {"id":"wight_rising_cut","row":12,"mode":"once","ms":[80,80,70,90,120,130]},
  {"id":"wight_grave_grasp","row":13,"mode":"once","ms":[100,120,180,90,140,150]},
  {"id":"wight_empowered_cleave","row":14,"mode":"once","ms":[120,150,260,90,170,170]},
  {"id":"lich_idle","row":15,"mode":"loop","ms":[180,180,180,180,180,180]},
  {"id":"lich_move","row":16,"mode":"loop","ms":[120,120,120,120,120,120]},
  {"id":"lich_hit","row":17,"mode":"once","ms":[70,100,110,120,130,120]},
  {"id":"lich_death","row":18,"mode":"hold","ms":[140,170,180,200,240,240]},
  {"id":"lich_grave_bolt","row":19,"mode":"once","ms":[80,80,70,90,120,140]},
  {"id":"lich_spectral_volley","row":20,"mode":"once","ms":[100,130,190,90,160,160]},
  {"id":"lich_grave_eruption","row":21,"mode":"once","ms":[130,160,280,100,180,170]}
];

const animations = Object.fromEntries(definitions.map(def => [def.id, {
  ...def,
  frames: def.ms.map((durationMs, localFrame) => ({
    localFrame,
    flatIndex: (def.row - 1) * 6 + localFrame,
    x: localFrame * 96, y: (def.row - 1) * 96,
    width: 96, height: 96, durationMs
  }))
}]));

function sampleAnimation(animation, elapsedMs) {
  const total = animation.ms.reduce((sum, ms) => sum + ms, 0);
  const elapsed = Math.max(0, elapsedMs);
  const finished = animation.mode !== "loop" && elapsed >= total;
  if (finished) return { frame: animation.frames[5], finished: true };
  let t = animation.mode === "loop" ? elapsed % total : elapsed;
  for (const frame of animation.frames) {
    if (t < frame.durationMs) return { frame, finished: false };
    t -= frame.durationMs;
  }
  return { frame: animation.frames[5], finished };
}

// Example: begin a new attack by resetting its elapsed time to zero.
const attack = animations.undead_wolf_pounce;
const sample = sampleAnimation(attack, 480);
// At 480 ms this example has entered C4 (localFrame 3).
// The caller handles state changes and frame-entry combat events.
```

The sampler intentionally returns the last frame after every one-shot completes. Your state machine must then decide whether to change animations. For `mode: "hold"`, leave the last frame active; for `mode: "once"`, choose the next living state. Use a timer reset on entry to a new state, so a previous animation’s elapsed time cannot skip the new windup.

## 5. Alignment, drawing, and important integration notes

### Ground, hover, and fixed pivots

The normal ground-contact line is local **y = 84**, counted as an inclusive pixel row inside a 96 × 96 cell. Its lower pixel boundary is y = 85. A convenient fixed logical ground pivot is therefore **(48, 85)**, or normalized **(0.5, 0.8854167)** if the engine measures normalized origins from the top-left. This pivot is a recommendation for your importer; it is not metadata embedded in the PNG. The packing process used a separate anatomical horizontal registration target near **x = 54**. That body landmark is not a requirement to place the game object’s pivot at x = 54.

| Frames | Measured local bottom pixel(s) | Meaning |
|---|---|---|
| Wolf rows 1–7, except r7c4 | 84 | Grounded paws or fallen body. |
| Wolf pounce r7c4 | 74 | A 10-pixel visual lift; full bounds `(8, 39)` through `(68, 74)`. |
| Wight rows 8–14 | 84 | Boots, fallen remains, or dropped blade meet the shared baseline. |
| Lich idle r15 C1–C6 | 74, 73, 73, 74, 75, 75 | Small pre-drawn hover bob. |
| Lich glide r16 C1–C6 | 74 in every frame | Steady hem height for in-place travel. |
| Lich hit r17 C1–C6 | 74, 74, 76, 80, 76, 74 | Brief dip, then return to hover. |
| Lich death r18 C1–C6 | 74, 79, 83, 84, 84, 84 | Loss of height followed by grounded remains. |
| Lich attacks r19–r21 | 74 in every frame | Casts remain in the hover band. |

These bottom measurements describe visible pixels; they are not collision shapes or physical joint coordinates. Keep the **same cell rectangle and logical pivot** across all states, including death. Do not re-center individual frames on their opaque bounds, feet, crystal, or effect. That would introduce visible sliding and erase the Lich’s intentional hover changes. If you already place an airborne game object above ground, account for the lift drawn into the art so it is not unintentionally applied twice.

With the recommended pivot, native-size drawing starts at `(worldX − 48, worldY − 85)`. All artwork faces left. Mirror around the fixed pivot to face right; mirror weapon/projectile sockets and hitboxes as well. Use nearest-neighbor sampling, disable image smoothing, and prefer integer display scaling when you want a uniformly sharp pixel grid. Avoid lossy image conversion. If a later atlas packer trims transparent space, retain each original 96 × 96 size and trim offset so the same logical pivot can be restored.

### Movement, weapons, and separate effects

- **Wolf:** The trot alternates diagonal support pairs. The rake uses one forepaw; the heavy pounce uses both. The airborne pounce frame already moves the silhouette slightly left and upward inside its cell. Apply actual forward travel and collision through the game object, without deriving movement from changing image bounds.
- **Wight:** The pitted blade remains part of living hit and attack poses. Grave grasp uses the free hand while the blade stays low. Its death includes the dropped sword inside the same cells, so you do not need another sword sprite merely to show the corpse.
- **Lich:** The crown and staff remain visible in living poses. The hit-reaction flare frame retains the staff. The spectral volley contains **three satellite lights** around the crystal; the crystal itself is a separate central element. The bolt spark, volley flare, and eruption flash are compact local effects baked into the frames. Create traveling bolts, remote eruption effects, and target selection as separate game objects.
- **Collision:** The transparent 96 × 96 cell is a drawing container, not a sensible universal collider. Configure body hurtboxes and attack volumes for the pose/gameplay state. Do not make chains of opacity pixels, robe tips, or spell glows determine physical collision.
- **Recoveries:** C6 of each hit/attack row is an exact idle recovery frame. If you immediately enter the idle row afterward, the repeated pose can create extra rest time; tune the final-frame duration or idle entry time deliberately. Keep the death hold separate from these recoveries.

### Asset identity

This guide was checked against the final PNG with SHA-256:

```text
99a965d7a421fdafdf91592c66f607605ff5a25f88d02261326661e0e413f888
```

A changed checksum does not by itself mean a visual problem, but a resized or repacked replacement requires its coordinates and alignment to be checked again. No source-generation files or packing scripts are required at runtime.

## 6. Exact frame rectangle appendix

Every tuple below is **`(x, y, width, height)`** in image pixels. Row and column labels are 1-based. These are complete cells, including transparency. For example, a crop API that expects `(left, top, right, bottom)` instead needs `(x, y, x + width, y + height)`.

| Row | C1 | C2 | C3 | C4 | C5 | C6 |
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

