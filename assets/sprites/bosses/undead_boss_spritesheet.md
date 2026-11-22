# Undead bosses — sprite sheet implementation guide

## 1. Asset and contents

This guide describes the final `undead_boss_spritesheet.png`: one transparent atlas containing the Undead Dragon, Undead Fenrir, and Death Monarch. Every boss faces **left**, toward the right-facing hero. Bone ivory, charcoal, tarnished metal and gold, and muted blue-green grave magic carry the established undead art direction.

| Property | Value |
|---|---|
| PNG filename | `undead_boss_spritesheet.png` |
| Canvas | **1536 × 6912 pixels** |
| Grid | **6 columns × 27 rows** |
| Frame/cell size | **256 × 256 pixels** |
| Total frames | **162 occupied cells** |
| Animations | **27 animations, 6 frames each** |
| Image format | PNG, RGBA |
| Alpha | Binary transparency: alpha is 0 or 255 |
| Grid margin and spacing | **0 pixels**; cells directly adjoin |
| Minimum clear padding inside every cell | **8 pixels**, measured in the final PNG |
| Ground contact line | Local pixel row **y = 232** for ordinary planted poses and remains |
| Source facing direction | Left |
| Timing and gameplay metadata | Not embedded; the schedules and events below are recommendations |

The **256 × 256 cell is the sprite frame**, including its transparent space. The visible creature is smaller and its bounds vary with the pose, wings, tail, robes, chains, sword, and effects. Do not substitute a visible-art bounding box for the frame rectangle.

| Boss | Rows, inclusive | Atlas rectangle `(x, y, width, height)` | Flat frame IDs | Appearance |
|---|---:|---|---:|---|
| Undead Dragon | 1–9 | `(0, 0, 1536, 2304)` | 0–53 | Horned skeletal skull, connected neck, exposed ribs, four legs, two membrane wings, segmented tail; gravefire charges the ribs and jaws. |
| Undead Fenrir | 10–18 | `(0, 2304, 1536, 2304)` | 54–107 | Colossal ash-gray wolf with exposed ribs, large fangs, high ragged mane, and broken chains attached to foreleg shackles. |
| Death Monarch | 19–27 | `(0, 4608, 1536, 2304)` | 108–161 | Crowned skeleton in royal charcoal robes and a torn ivory ermine mantle, carrying a long dark coronation blade with a gold hilt. |

For exact asset identification, the final PNG's SHA-256 is:

```text
0476b3f3b33b7ca2bbe2b03b3e6a6c8c6ba17cb8281bbd95676c5b2b79b4c070
```

## 2. Coordinates, frame IDs, and slicing

**Rows and columns in this guide are one-based. Pixel coordinates and flat frame IDs are zero-based.** The origin is the PNG's top-left corner: x increases rightward and y increases downward. A rectangle `(x, y, width, height)` includes its top and left edges and excludes its bottom and right edges.

For row `r` from 1 through 27 and column `c` from 1 through 6:

```text
x = (c - 1) × 256
y = (r - 1) × 256
width = 256
height = 256
flatFrameID = (r - 1) × 6 + (c - 1)
```

The six frames of one animation are always the six cells in its row, read left to right. In a zero-based frame list, their local frame numbers are `[0, 1, 2, 3, 4, 5]`; in the pose tables below, they are C1 through C6.

| Column | Local frame number | x coordinate | Covered x pixels, inclusive |
|---:|---:|---:|---|
| C1 | 0 | 0 | 0–255 |
| C2 | 1 | 256 | 256–511 |
| C3 | 2 | 512 | 512–767 |
| C4 | 3 | 768 | 768–1023 |
| C5 | 4 | 1024 | 1024–1279 |
| C6 | 5 | 1280 | 1280–1535 |

For example, the dragon's dive landing is **row 9, column 5**, rectangle `(1024, 2048, 256, 256)`, flat ID **52**. The Monarch's final attack release is **row 27, column 4**, rectangle `(768, 6656, 256, 256)`, flat ID **159**.

If an engine uses a bottom-left source-coordinate origin, convert only the rectangle's y coordinate:

```text
bottomLeftY = 6912 - topLeftY - 256
```

Do not reverse the frame order or flip the character vertically to compensate for a source-coordinate convention. Section 6 lists all 162 source rectangles explicitly.

## 3. Animation catalog

The nine rows for each boss are idle, walk, fly, hit reaction, death, light attack, medium attack, heavy attack, and final attack. `Loop` means C6 wraps to C1. `Once → idle` means finish C6, then let the character controller select idle or the next valid state. `Once → hold` means stop on C6; death remains stay there, while final-attack holds wait for the boss controller to choose the next state.

### 3.1 Row map

| Row | Boss | Animation ID | Action | y | Flat IDs | Playback |
|---:|---|---|---|---:|---:|---|
| 01 | Undead Dragon | `dragon_idle` | Idle | 0 | 0–5 | Loop |
| 02 | Undead Dragon | `dragon_walk` | Walk | 256 | 6–11 | Loop |
| 03 | Undead Dragon | `dragon_fly` | Fly | 512 | 12–17 | Loop |
| 04 | Undead Dragon | `dragon_hit` | Hit reaction | 768 | 18–23 | Once → idle |
| 05 | Undead Dragon | `dragon_death` | Death | 1024 | 24–29 | Once → hold |
| 06 | Undead Dragon | `dragon_snap_bite` | Snap bite | 1280 | 30–35 | Once → idle |
| 07 | Undead Dragon | `dragon_tail_sweep` | Tail sweep | 1536 | 36–41 | Once → idle |
| 08 | Undead Dragon | `dragon_gravefire_breath` | Gravefire breath | 1792 | 42–47 | Once → idle |
| 09 | Undead Dragon | `dragon_gravefire_dive` | Gravefire Dive | 2048 | 48–53 | Once → hold |
| 10 | Undead Fenrir | `fenrir_idle` | Idle | 2304 | 54–59 | Loop |
| 11 | Undead Fenrir | `fenrir_walk` | Walk | 2560 | 60–65 | Loop |
| 12 | Undead Fenrir | `fenrir_fly` | Fly / spectral bound | 2816 | 66–71 | Loop |
| 13 | Undead Fenrir | `fenrir_hit` | Hit reaction | 3072 | 72–77 | Once → idle |
| 14 | Undead Fenrir | `fenrir_death` | Death | 3328 | 78–83 | Once → hold |
| 15 | Undead Fenrir | `fenrir_fang_snap` | Fang snap | 3584 | 84–89 | Once → idle |
| 16 | Undead Fenrir | `fenrir_raking_lunge` | Raking lunge | 3840 | 90–95 | Once → idle |
| 17 | Undead Fenrir | `fenrir_crushing_pounce` | Crushing pounce | 4096 | 96–101 | Once → idle |
| 18 | Undead Fenrir | `fenrir_grave_howl` | Grave Howl | 4352 | 102–107 | Once → hold |
| 19 | Death Monarch | `monarch_idle` | Idle | 4608 | 108–113 | Loop |
| 20 | Death Monarch | `monarch_walk` | Walk | 4864 | 114–119 | Loop |
| 21 | Death Monarch | `monarch_fly` | Fly / levitation | 5120 | 120–125 | Loop |
| 22 | Death Monarch | `monarch_hit` | Hit reaction | 5376 | 126–131 | Once → idle |
| 23 | Death Monarch | `monarch_death` | Death | 5632 | 132–137 | Once → hold |
| 24 | Death Monarch | `monarch_royal_thrust` | Royal thrust | 5888 | 138–143 | Once → idle |
| 25 | Death Monarch | `monarch_sweeping_decree` | Sweeping decree | 6144 | 144–149 | Once → idle |
| 26 | Death Monarch | `monarch_execution_cleave` | Execution cleave | 6400 | 150–155 | Once → idle |
| 27 | Death Monarch | `monarch_crown_of_the_grave` | Crown of the Grave | 6656 | 156–161 | Once → hold |

### 3.2 Six-frame pose sequences

These descriptions identify the visible stages in the delivered rows. Repeated contact, charge, and death poses are intentional; their exact duplicates are documented in Section 5.

#### Undead Dragon

| Row / action | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 01 — Idle | Four feet planted; wings folded | Ribs rise slightly | Near wing flexes | Tail sways | Wing and ribs settle | Ease toward the first stance |
| 02 — Walk | Forefoot and opposite hind foot plant | Shoulders move over support | Legs pass | Opposite pair plants | Weight transfers; tail balances | Pass toward the first contact |
| 03 — Fly | Legs tuck; wings rise | High wing position | Downstroke begins | Full downstroke | Wings bend into upstroke | Wings rise toward the first pose |
| 04 — Hit reaction | Skull snaps upward | Neck recoils | Near wing flares | Rear legs catch the weight | Forefeet replant | Exact idle guard |
| 05 — Death | Rib light flickers | Forelegs buckle | Skull lowers | Body collapses sideways | Wings and remains settle | Identical settled remains |
| 06 — Snap bite | Chin draws back | Jaws open | Closed-jaw snap/contact | Identical extended contact hold | Head pulls back | Exact idle guard |
| 07 — Tail sweep | Weight shifts forward | Tail coils behind hips | Torso loads the sweep | Tail whips low toward the front | Low follow-through | Exact idle guard |
| 08 — Gravefire breath | Forefeet spread | Skull rises | Bright rib charge held | Mouth flash and breath pose | Identical breath-pose hold | Exact idle guard; charge ends |
| 09 — Gravefire Dive | Tucked high hover | Wings spread; ribs charge | Charged airborne anticipation | Folded-wing dive down-left | Low claw landing and local flash | Low landing held; flash fades |

#### Undead Fenrir

| Row / action | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 10 — Idle | Low muzzle; paws planted | Chest breathes | Weight shifts across forepaws | Mane bristles | Attached chains settle | Ease toward the first stance |
| 11 — Walk | Forepaw prowl contact | Hind paw advances | Other forepaw plants | Other hind paw advances | Shoulders pass over support | Passing pose into first contact |
| 12 — Fly / spectral bound | Forelegs reach into air | Leading paw meets a spectral flash | Hind legs gather | Next airborne stride | Alternate paw meets a spectral flash | Hind legs tuck into next stride |
| 13 — Hit reaction | Muzzle jolts | Shoulders recoil | Forepaws skid | Haunches lower | Paws replant | Exact idle/prowl stance |
| 14 — Death | Stumble | Forelegs buckle | Body rolls sideways | Head and hind legs lower | Body settles; chains slacken | Identical fallen body |
| 15 — Fang snap | Muzzle dips | Jaws open wide | Closed-jaw fang contact | Identical stretched-neck hold | Head pulls back | Exact idle/prowl stance |
| 16 — Raking lunge | Weight rocks back | One forepaw rises | Hind legs drive forward | Raised paw rakes down | Striking paw catches the landing | Exact idle/prowl stance |
| 17 — Crushing pounce | Chest lowers | Hind legs coil | Deep crouch held | Airborne forepaw extension | Both forepaws land low | Exact idle/prowl stance |
| 18 — Grave Howl | All paws brace | Neck arches | Open-jaw anticipation; magic tightens chains | Raised muzzle howls with local light | Mane and attached chains flare | Raised muzzle held; glow fades |

#### Death Monarch

| Row / action | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| 19 — Idle | Upright guard; blade low | Grip shifts | Shoulders adjust | Mantle settles | Robe hems move | Ease toward first guard |
| 20 — Walk | Leading boot plants | Weight passes over support | Boots pass beneath robes | Opposite boot plants | Rear boot lifts | Pass toward first contact |
| 21 — Fly / levitation | Upright hover; blade angles down | Mantle streams backward | Robe hems trail | Small rise in the bob | Hems ripple | Ease toward first hover |
| 22 — Hit reaction | Chest jolts | Crown and skull tilt | Blade pulls inward | Rear boot catches weight | Shoulders straighten | Exact idle guard |
| 23 — Death | Blade slips from grip | One knee lowers beside blade | Body folds sideways | Crown falls beside skull | Robes, crown, skull and blade settle | Identical settled remains |
| 24 — Royal thrust | Grip tightens | Blade draws back | Thrust begins at chest height | Full forward extension | Blade withdraws | Exact idle guard |
| 25 — Sweeping decree | Shoulders turn | Blade moves behind hip | Open free hand balances; sword hand grips behind hip | Blade sweeps across the front | Low follow-through | Exact idle guard |
| 26 — Execution cleave | Boots plant | Raised two-hand charged blade | Identical raised charge held | Blade cleaves down-left | Low finish held | Exact idle guard |
| 27 — Crown of the Grave | Lift into hover | Real sword rises vertically | Three spectral blades form above crown | Real sword points down; spectral blades flash | Hover above compact grave ring | Sword-down hover; glow fades |

### 3.3 Suggested playback durations

The PNG is a static atlas: it contains **no frame rate, durations, damage windows, animation events, or state transitions**. The following milliseconds-per-frame arrays are starting values for a game controller. They deliberately give heavy and final attacks a long C3 anticipation and a fast release. Adjust them to movement speed and difficulty after playtesting. The total excludes any indefinite hold after C6.

| Animation ID | Duration of C1…C6, milliseconds | One-pass total |
|---|---|---:|
| `dragon_idle` | `[150, 150, 150, 150, 150, 150]` | 900 ms |
| `dragon_walk` | `[130, 130, 130, 130, 130, 130]` | 780 ms |
| `dragon_fly` | `[100, 100, 100, 100, 100, 100]` | 600 ms |
| `dragon_hit` | `[60, 80, 100, 100, 100, 120]` | 560 ms |
| `dragon_death` | `[110, 140, 150, 150, 200, 200]` | 950 ms |
| `dragon_snap_bite` | `[90, 90, 60, 100, 100, 140]` | 580 ms |
| `dragon_tail_sweep` | `[120, 160, 200, 75, 140, 180]` | 875 ms |
| `dragon_gravefire_breath` | `[180, 200, 420, 90, 220, 220]` | 1330 ms |
| `dragon_gravefire_dive` | `[180, 220, 600, 100, 250, 350]` | 1700 ms |
| `fenrir_idle` | `[150, 150, 150, 150, 150, 150]` | 900 ms |
| `fenrir_walk` | `[150, 150, 150, 150, 150, 150]` | 900 ms |
| `fenrir_fly` | `[110, 110, 110, 110, 110, 110]` | 660 ms |
| `fenrir_hit` | `[60, 80, 100, 100, 100, 120]` | 560 ms |
| `fenrir_death` | `[110, 140, 150, 150, 200, 200]` | 950 ms |
| `fenrir_fang_snap` | `[90, 90, 60, 100, 100, 140]` | 580 ms |
| `fenrir_raking_lunge` | `[120, 160, 180, 75, 140, 180]` | 855 ms |
| `fenrir_crushing_pounce` | `[180, 200, 420, 90, 220, 220]` | 1330 ms |
| `fenrir_grave_howl` | `[180, 220, 600, 120, 250, 350]` | 1720 ms |
| `monarch_idle` | `[170, 170, 170, 170, 170, 170]` | 1020 ms |
| `monarch_walk` | `[160, 160, 160, 160, 160, 160]` | 960 ms |
| `monarch_fly` | `[150, 150, 150, 150, 150, 150]` | 900 ms |
| `monarch_hit` | `[60, 80, 100, 100, 100, 120]` | 560 ms |
| `monarch_death` | `[110, 140, 150, 150, 200, 200]` | 950 ms |
| `monarch_royal_thrust` | `[90, 90, 60, 100, 100, 140]` | 580 ms |
| `monarch_sweeping_decree` | `[120, 160, 200, 75, 140, 180]` | 875 ms |
| `monarch_execution_cleave` | `[180, 200, 420, 90, 220, 220]` | 1330 ms |
| `monarch_crown_of_the_grave` | `[180, 240, 650, 100, 250, 350]` | 1770 ms |

For a simpler uniform-rate preview, use approximately 6–8 FPS for idle and slow walking, 8–10 FPS for flight, and 10–12 FPS for hit reactions. For combat playback, use the duration arrays so the anticipation and release do not receive the same dwell time. A repeated bitmap still occupies its own frame duration.

### 3.4 Suggested combat event positions

These are suggested **frame-entry events or active windows**, not properties read from the PNG. Author hitboxes, damage, range, knockback, sound, and projectile behavior in game code. Use one hit-per-target rule per attack instance unless repeated damage is an intentional mechanic.

| Attack | Suggested event or active columns | Integration note |
|---|---|---|
| Dragon snap bite — row 6 | C3 starts contact; C3–C4 may remain active | C3 and C4 are identical. Do not trigger a second bite merely because the held bitmap occupies two cells. |
| Dragon tail sweep — row 7 | C4–C5 | Author a low sweep hitbox in front; it must not depend on the changing whole-sprite bounds. |
| Dragon gravefire breath — row 8 | Emit on C4; optionally sustain through C5 | C4 and C5 are identical. Spawn one breath effect on C4 entry; any sustained damage has its own timer. |
| Dragon Gravefire Dive — row 9 | Start dive on C4; impact on C5 | C4 remains airborne. Trigger landing damage at the actual C5 landing, not at the highest wing or lowest flash pixel. |
| Fenrir fang snap — row 15 | C3 starts contact; C3–C4 may remain active | C3 and C4 are identical held contact. |
| Fenrir raking lunge — row 16 | C4–C5 | Enable the attacking forepaw region for rake and catch; do not use the chains as the body collider. |
| Fenrir crushing pounce — row 17 | Airborne forepaw contact on C4; landing event on C5 | Decide explicitly whether an air contact and landing can both damage the same target. |
| Fenrir Grave Howl — row 18 | Release on C4; optional sustain through C5 | The sheet provides only local jaw/chain light. Spawn any arena effect separately. |
| Monarch royal thrust — row 24 | C3–C4 | Use a narrow forward weapon region. |
| Monarch sweeping decree — row 25 | C4–C5 | C3 is the balanced preparation, with the rear hand visibly gripping the sword. |
| Monarch execution cleave — row 26 | C4–C5 | C2–C3 are a held raised charge, not active damage by default. |
| Monarch Crown of the Grave — row 27 | Release on C4; optional ring event on C5 | The three spectral blades near the crown are local cast imagery, separate from the real coronation sword. |

If a large update advances across multiple animation frames, process every crossed frame-entry event in order. Sampling only the final displayed frame can skip an attack event. On a state restart, reset both the elapsed animation time and that attack instance’s event/hit bookkeeping.

## 4. Building and playing the animations

### 4.1 Import and slice

1. Load `undead_boss_spritesheet.png` without resizing it. Treat the PNG as an RGBA color texture with its alpha preserved.
2. Slice a regular grid of 256 × 256 pixels, with six columns, 27 rows, zero outer margin, and zero spacing. The clear pixels inside each frame are padding, not atlas gutters to subtract.
3. For each animation, select the six cells in its catalog row in C1 → C6 order. Do not use automatic visible-bounds trimming.
4. Assign the loop/end behavior and durations from Section 3, or tune those recommended values in the game. Use the same rendering origin for every frame.
5. Let the controller drive world position and collision independently. Switching animations selects another row; it does not advance into the next row automatically.

### 4.2 Engine-independent JavaScript descriptors

This code produces complete source rectangles and timing data for every named animation. `row` stays one-based; `column`, `frameID`, and the returned frame array are zero-based where indicated. The `endMode` field is a controller instruction: `idle` selects a normal follow-up state, while `hold` freezes C6 until the controller changes state.

```javascript
const SHEET = { file: "undead_boss_spritesheet.png", width: 1536, height: 6912,
                columns: 6, rows: 27, cell: 256, pivot: { x: 128, y: 233 } };

function rectFor(row, column) { // row and column are both 1-based inputs
  if (row < 1 || row > 27 || column < 1 || column > 6) throw new RangeError("Cell");
  return { x: (column - 1) * 256, y: (row - 1) * 256, width: 256, height: 256 };
}

// [name, one-based row, endMode, six frame durations in milliseconds]
const definitions = [
  ["dragon_idle", 1, "loop", [150, 150, 150, 150, 150, 150]],
  ["dragon_walk", 2, "loop", [130, 130, 130, 130, 130, 130]],
  ["dragon_fly", 3, "loop", [100, 100, 100, 100, 100, 100]],
  ["dragon_hit", 4, "idle", [60, 80, 100, 100, 100, 120]],
  ["dragon_death", 5, "hold", [110, 140, 150, 150, 200, 200]],
  ["dragon_snap_bite", 6, "idle", [90, 90, 60, 100, 100, 140]],
  ["dragon_tail_sweep", 7, "idle", [120, 160, 200, 75, 140, 180]],
  ["dragon_gravefire_breath", 8, "idle", [180, 200, 420, 90, 220, 220]],
  ["dragon_gravefire_dive", 9, "hold", [180, 220, 600, 100, 250, 350]],
  ["fenrir_idle", 10, "loop", [150, 150, 150, 150, 150, 150]],
  ["fenrir_walk", 11, "loop", [150, 150, 150, 150, 150, 150]],
  ["fenrir_fly", 12, "loop", [110, 110, 110, 110, 110, 110]],
  ["fenrir_hit", 13, "idle", [60, 80, 100, 100, 100, 120]],
  ["fenrir_death", 14, "hold", [110, 140, 150, 150, 200, 200]],
  ["fenrir_fang_snap", 15, "idle", [90, 90, 60, 100, 100, 140]],
  ["fenrir_raking_lunge", 16, "idle", [120, 160, 180, 75, 140, 180]],
  ["fenrir_crushing_pounce", 17, "idle", [180, 200, 420, 90, 220, 220]],
  ["fenrir_grave_howl", 18, "hold", [180, 220, 600, 120, 250, 350]],
  ["monarch_idle", 19, "loop", [170, 170, 170, 170, 170, 170]],
  ["monarch_walk", 20, "loop", [160, 160, 160, 160, 160, 160]],
  ["monarch_fly", 21, "loop", [150, 150, 150, 150, 150, 150]],
  ["monarch_hit", 22, "idle", [60, 80, 100, 100, 100, 120]],
  ["monarch_death", 23, "hold", [110, 140, 150, 150, 200, 200]],
  ["monarch_royal_thrust", 24, "idle", [90, 90, 60, 100, 100, 140]],
  ["monarch_sweeping_decree", 25, "idle", [120, 160, 200, 75, 140, 180]],
  ["monarch_execution_cleave", 26, "idle", [180, 200, 420, 90, 220, 220]],
  ["monarch_crown_of_the_grave", 27, "hold", [180, 240, 650, 100, 250, 350]],
];

const animations = Object.fromEntries(definitions.map(([name, row, endMode, ms]) => {
  const frames = ms.map((durationMs, i) => ({
    column: i, frameID: (row - 1) * 6 + i, rect: rectFor(row, i + 1), durationMs
  }));
  return [name, { name, row, loop: endMode === "loop", endMode, frames,
                 durationMs: ms.reduce((a, b) => a + b, 0) }];
}));

function sampleClip(clip, elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  const ended = !clip.loop && elapsed >= clip.durationMs;
  let t = clip.loop ? elapsed % clip.durationMs
                   : Math.min(elapsed, clip.durationMs - 1);
  let i = 0;
  while (i < clip.frames.length - 1 && t >= clip.frames[i].durationMs) {
    t -= clip.frames[i].durationMs;
    i += 1;
  }
  return { ...clip.frames[i], localFrame: i, ended, endMode: clip.endMode };
}

const clip = animations.dragon_gravefire_dive;
const elapsedSinceStateStartedMs = 350; // Example; supply your animation clock here.
const current = sampleClip(clip, elapsedSinceStateStartedMs);
// Draw current.rect from the atlas, using the unchanged pivot below.
// After ended: retain C6 for "hold", or let AI choose the next state for "idle".
```

The sampler keeps a completed non-looping clip on its last frame. Handle `ended` as a transition once per state, rather than repeatedly restarting idle every update. For a death state, keep the final frame until corpse removal or a separately designed revival. For final attacks, finish the chosen recovery/hold interval before selecting the next boss action. Do not loop these rows.

### 4.3 Fixed pivot, ground alignment, and facing

A convenient common logical render pivot is **`(128, 233)`**, measured from the top-left boundary of each 256-pixel cell. The grounded artwork’s last contact pixels occupy y232, so the boundary immediately below them is y233. With a top-left normalized pivot convention this is **`(0.5, 0.91015625)`**. With a bottom-left normalized pivot convention, the corresponding y value is **`0.08984375`**. These are recommended engine settings; the PNG has no stored pivot.

For a top-left drawing API and a world anchor `(worldX, worldY)`, draw the whole 256-pixel frame at `(worldX - 128, worldY - 233)`. Apply camera transforms afterward. Keep this origin unchanged for idle, attacks, death, and flight; otherwise a larger wing or longer sword will make the body jump. A project may choose another fixed logical origin, but it must apply that choice consistently.

The anatomical registration points used in the art are separate from this logical pivot:

| Pose group | Anatomical point in the cell | Meaning |
|---|---|---|
| Dragon flight, row 3 | Hip around `(156, 151)` | Wing motion does not determine the body position. |
| Fenrir flight, row 12 | Hip around `(178, 143)` | Spectral paw flashes and hanging chains do not determine the body position. |
| Monarch flight, row 21 | Waist x150; y `[124, 123, 123, 124, 125, 124]` | A small recurring bob is already present. |
| Monarch final attack, row 27 | Waist around `(150, 140)` | The spectral arc and ring fit around the hovering body. |

These are registration targets, not a set of runtime transforms to add. Do not shift frames again by these values. The boss bodies also have deliberately different proportions and horizontal placement within their cells; they are not all centered on the same visible bounding box.

Flip the complete frame horizontally to make a boss face right. With the center-x pivot above, no additional pivot correction is needed. Mirror any separately authored weapon sockets, local effects, and hitboxes too. **Do not reverse the animation’s temporal frame order when changing facing direction.**

## 5. Important implementation notes

### 5.1 In-place motion and airborne frames

Walking, wingbeats, spectral bounds, and levitation animate in place. The game supplies translation, flight altitude, knockback, lunging distance, and arena traversal. The sprites already contain modest local pose offsets and lift: account for that visual lift when choosing the controller’s flight altitude instead of measuring altitude from the lowest opaque pixel.

| Special pose | Verified alignment in the final cell | Practical consequence |
|---|---|---|
| Dragon flight, row 3 | Its lowest visible pixels vary from y181 to y243 because the wings flap; the hip stays registered. | A downstroke can extend below the ground reference even while the body is airborne. Never floor-align the whole alpha bounding box. |
| Dragon dive, row 9 C1–C3 | Charged hover with a fixed hip target around y151. | Keep these anticipation frames airborne. |
| Dragon dive, row 9 C4 | Lowest visible point is y222. | This is still the dive, not the grounded impact. |
| Dragon dive, row 9 C5 | Physical claws meet y232; the compact impact flash extends to y238. | Use the claws/landing event for ground contact; do not raise the sprite to place the flash on the ground line. |
| Dragon dive, row 9 C6 | Low landing pose ends at y232. | The flash has faded; hold the landing before the AI’s next action. |
| Fenrir pounce, row 17 C4 | Entire silhouette ends at y196. | Preserve the clear airborne release; C5 returns to the ground line. |
| Monarch levitation, row 21 | Lowest visible bounds are y212–218. | Boots remain clear of the y232 ground reference. |
| Monarch final cast, row 27 C5 | The compact ring extends to y244 below the hovering body. | The ring is a local effect, not a floor shadow or the body collider. |

### 5.2 Held artwork and recovery copies

The following equalities were checked directly against the final PNG’s RGBA pixels. Preserve their timing roles even though some cells contain the same bitmap.

| Cells | Exact relationship | Why it matters |
|---|---|---|
| Death rows 5, 14, 23 | C5 = C6 | The settled body holds still. Clamp on C6 after playback. |
| Bite rows 6 and 15 | C3 = C4 | A closed-jaw contact is followed by an extension hold. |
| Dragon breath row 8 | C4 = C5 | Release and sustained breath use the same local flash/pose. Trigger release once. |
| Monarch cleave row 26 | C2 = C3 | The raised charged blade remains visibly held before the downstroke. |
| Dragon rows 4, 6, 7, 8 | C6 = row 1 C1 | Hit and ordinary attacks end at the original idle guard. |
| Fenrir rows 13, 15, 16, 17 | C6 = row 10 C1 | Hit and ordinary attacks recover to the original prowl stance. |
| Monarch rows 22, 24, 25, 26 | C6 = row 19 C1 | Hit and ordinary attacks recover to the original guard. |

The final-attack rows **9, 18, and 27 do not end in idle**. Their sixth cells are landing, raised-muzzle, and sword-down hover holds respectively. Their last two cells are not pixel-identical; retain both so the final pose and fading light are shown. There are no fully empty frames anywhere in this sheet.

### 5.3 Equipment, effects, and collision

- The dragon has four legs plus two wings, one skull connected to the neck, and a continuous segmented tail. Wings and tail belong to the sprite; collision geometry should be authored separately for the body and each attack.
- Fenrir’s two broken chains are attached to its foreleg shackles, including flight, death, and howl. Their changing extent is visual animation, not a reason to resize the body collider.
- The Monarch keeps its crown and blade in living poses. Its death leaves the crown, skull, blade, and robes visible. The balanced sweep preparation at row 25 C3 has one open free hand and one closed sword grip.
- The Monarch’s final attack has **three spectral blades**, in addition to its **one real coronation sword**. Treat the spectral imagery as the local anticipation/release cue unless the game intentionally spawns separate blade entities.
- Gravefire, paw flashes, howl light, spectral blades, and the grave ring are compact effects at their origins. Long breath streams, traveling projectiles, damage zones, arena-wide howls, and movement trails are separate game effects.
- The sheet provides no hitboxes, hurtboxes, collision masks, sockets, invulnerability flags, damage values, or physics events. Use stable body colliders and separately designed attack regions; deriving gameplay collision from every opaque pixel would include cloth, chains, wings, and magic.

### 5.4 Pixel rendering and atlas handling

Use point/nearest-neighbor sampling for pixel rendering and avoid smoothing the frames during extraction. Prefer integer display scaling and stable pixel-aligned camera placement when the game’s visual style requires it. Preserve the transparent RGB/alpha image; do not flatten it onto a background.

Keep the full 256-pixel source rectangle for every frame. If a runtime atlas repacker trims transparent pixels, retain the original 256 × 256 source size and per-frame offsets so the renderer reconstructs the original cell. Disable any import option that independently centers each trimmed sprite. If mipmaps or filtered atlas sampling are required by a particular renderer, configure its padding/extrusion handling deliberately so neighboring frames cannot bleed into the sprite.

The full sheet is 6912 pixels tall. Confirm that the chosen target platform and engine accept that texture size without automatic downscaling. If the project requires smaller textures, export the three boss blocks listed in Section 1 as separate 1536 × 2304 images; preserve their 256-pixel cells and adjust their row numbers to local rows 1–9. That is an optional engine packaging step, not a change to this supplied PNG.

## 6. Exact source rectangles for all frames

Every entry below is `(x, y, width, height)` in atlas pixels. Rows and column labels remain one-based. The ending bounds are exclusive; for example `(1280, 6656, 256, 256)` ends exactly at `(1536, 6912)`.

| Row | C1 | C2 | C3 | C4 | C5 | C6 |
|---:|---|---|---|---|---|---|
| 01 | `(0, 0, 256, 256)` | `(256, 0, 256, 256)` | `(512, 0, 256, 256)` | `(768, 0, 256, 256)` | `(1024, 0, 256, 256)` | `(1280, 0, 256, 256)` |
| 02 | `(0, 256, 256, 256)` | `(256, 256, 256, 256)` | `(512, 256, 256, 256)` | `(768, 256, 256, 256)` | `(1024, 256, 256, 256)` | `(1280, 256, 256, 256)` |
| 03 | `(0, 512, 256, 256)` | `(256, 512, 256, 256)` | `(512, 512, 256, 256)` | `(768, 512, 256, 256)` | `(1024, 512, 256, 256)` | `(1280, 512, 256, 256)` |
| 04 | `(0, 768, 256, 256)` | `(256, 768, 256, 256)` | `(512, 768, 256, 256)` | `(768, 768, 256, 256)` | `(1024, 768, 256, 256)` | `(1280, 768, 256, 256)` |
| 05 | `(0, 1024, 256, 256)` | `(256, 1024, 256, 256)` | `(512, 1024, 256, 256)` | `(768, 1024, 256, 256)` | `(1024, 1024, 256, 256)` | `(1280, 1024, 256, 256)` |
| 06 | `(0, 1280, 256, 256)` | `(256, 1280, 256, 256)` | `(512, 1280, 256, 256)` | `(768, 1280, 256, 256)` | `(1024, 1280, 256, 256)` | `(1280, 1280, 256, 256)` |
| 07 | `(0, 1536, 256, 256)` | `(256, 1536, 256, 256)` | `(512, 1536, 256, 256)` | `(768, 1536, 256, 256)` | `(1024, 1536, 256, 256)` | `(1280, 1536, 256, 256)` |
| 08 | `(0, 1792, 256, 256)` | `(256, 1792, 256, 256)` | `(512, 1792, 256, 256)` | `(768, 1792, 256, 256)` | `(1024, 1792, 256, 256)` | `(1280, 1792, 256, 256)` |
| 09 | `(0, 2048, 256, 256)` | `(256, 2048, 256, 256)` | `(512, 2048, 256, 256)` | `(768, 2048, 256, 256)` | `(1024, 2048, 256, 256)` | `(1280, 2048, 256, 256)` |
| 10 | `(0, 2304, 256, 256)` | `(256, 2304, 256, 256)` | `(512, 2304, 256, 256)` | `(768, 2304, 256, 256)` | `(1024, 2304, 256, 256)` | `(1280, 2304, 256, 256)` |
| 11 | `(0, 2560, 256, 256)` | `(256, 2560, 256, 256)` | `(512, 2560, 256, 256)` | `(768, 2560, 256, 256)` | `(1024, 2560, 256, 256)` | `(1280, 2560, 256, 256)` |
| 12 | `(0, 2816, 256, 256)` | `(256, 2816, 256, 256)` | `(512, 2816, 256, 256)` | `(768, 2816, 256, 256)` | `(1024, 2816, 256, 256)` | `(1280, 2816, 256, 256)` |
| 13 | `(0, 3072, 256, 256)` | `(256, 3072, 256, 256)` | `(512, 3072, 256, 256)` | `(768, 3072, 256, 256)` | `(1024, 3072, 256, 256)` | `(1280, 3072, 256, 256)` |
| 14 | `(0, 3328, 256, 256)` | `(256, 3328, 256, 256)` | `(512, 3328, 256, 256)` | `(768, 3328, 256, 256)` | `(1024, 3328, 256, 256)` | `(1280, 3328, 256, 256)` |
| 15 | `(0, 3584, 256, 256)` | `(256, 3584, 256, 256)` | `(512, 3584, 256, 256)` | `(768, 3584, 256, 256)` | `(1024, 3584, 256, 256)` | `(1280, 3584, 256, 256)` |
| 16 | `(0, 3840, 256, 256)` | `(256, 3840, 256, 256)` | `(512, 3840, 256, 256)` | `(768, 3840, 256, 256)` | `(1024, 3840, 256, 256)` | `(1280, 3840, 256, 256)` |
| 17 | `(0, 4096, 256, 256)` | `(256, 4096, 256, 256)` | `(512, 4096, 256, 256)` | `(768, 4096, 256, 256)` | `(1024, 4096, 256, 256)` | `(1280, 4096, 256, 256)` |
| 18 | `(0, 4352, 256, 256)` | `(256, 4352, 256, 256)` | `(512, 4352, 256, 256)` | `(768, 4352, 256, 256)` | `(1024, 4352, 256, 256)` | `(1280, 4352, 256, 256)` |
| 19 | `(0, 4608, 256, 256)` | `(256, 4608, 256, 256)` | `(512, 4608, 256, 256)` | `(768, 4608, 256, 256)` | `(1024, 4608, 256, 256)` | `(1280, 4608, 256, 256)` |
| 20 | `(0, 4864, 256, 256)` | `(256, 4864, 256, 256)` | `(512, 4864, 256, 256)` | `(768, 4864, 256, 256)` | `(1024, 4864, 256, 256)` | `(1280, 4864, 256, 256)` |
| 21 | `(0, 5120, 256, 256)` | `(256, 5120, 256, 256)` | `(512, 5120, 256, 256)` | `(768, 5120, 256, 256)` | `(1024, 5120, 256, 256)` | `(1280, 5120, 256, 256)` |
| 22 | `(0, 5376, 256, 256)` | `(256, 5376, 256, 256)` | `(512, 5376, 256, 256)` | `(768, 5376, 256, 256)` | `(1024, 5376, 256, 256)` | `(1280, 5376, 256, 256)` |
| 23 | `(0, 5632, 256, 256)` | `(256, 5632, 256, 256)` | `(512, 5632, 256, 256)` | `(768, 5632, 256, 256)` | `(1024, 5632, 256, 256)` | `(1280, 5632, 256, 256)` |
| 24 | `(0, 5888, 256, 256)` | `(256, 5888, 256, 256)` | `(512, 5888, 256, 256)` | `(768, 5888, 256, 256)` | `(1024, 5888, 256, 256)` | `(1280, 5888, 256, 256)` |
| 25 | `(0, 6144, 256, 256)` | `(256, 6144, 256, 256)` | `(512, 6144, 256, 256)` | `(768, 6144, 256, 256)` | `(1024, 6144, 256, 256)` | `(1280, 6144, 256, 256)` |
| 26 | `(0, 6400, 256, 256)` | `(256, 6400, 256, 256)` | `(512, 6400, 256, 256)` | `(768, 6400, 256, 256)` | `(1024, 6400, 256, 256)` | `(1280, 6400, 256, 256)` |
| 27 | `(0, 6656, 256, 256)` | `(256, 6656, 256, 256)` | `(512, 6656, 256, 256)` | `(768, 6656, 256, 256)` | `(1024, 6656, 256, 256)` | `(1280, 6656, 256, 256)` |

### Verification scope

Canvas dimensions, PNG/RGBA format, binary alpha, occupied-cell count, minimum padding, ordinary ground alignment, and the exact repeated-frame relationships above were checked against the delivered PNG. Flight registration, connected anatomy, equipment continuity, and the three-blade cast were reviewed visually. Duration arrays, logical pivot choice, event windows, and controller behavior are implementation recommendations supplied by this guide; they are not additional data embedded in the image.
