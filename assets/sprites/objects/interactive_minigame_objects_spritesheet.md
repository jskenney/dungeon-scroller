# Interactive Minigame Objects — Sprite Sheet Guide

## 1. Asset and contents

This guide describes the final **`interactive_minigame_objects_spritesheet.png`** for the dungeon-themed side-scrolling game. It contains six interactive world props: a deck of cards, a pair of dice, a Mahjongg set, a folding board game, a tabletop computer-game console and a pile of building blocks. Their weathered wood, ivory, parchment, slate and restrained brass details match the existing interactive world objects. Lighting comes from the upper left, and the shallow three-quarter side view keeps each object's front and top readable.

| Property | Value |
|---|---|
| Image filename | `interactive_minigame_objects_spritesheet.png` |
| Canvas | 576 × 1728 pixels |
| Grid | 6 columns × 18 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Object count | 6; three consecutive rows per object |
| Animation count | 18: 6 idle loops, 6 interactions, 6 disappearances |
| Frame slots | 108: 102 nonempty cells and 6 intentionally transparent endings |
| Format | RGBA PNG; alpha values are 0 or 255; transparent pixels have zero RGB |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a visible cell | 11 pixels |
| Nominal grounded contact | Cell-local visible pixel y = 84 |
| Suggested grounded logical pivot | (48, 85), measured from the top-left cell boundary |
| Verified SHA-256 | `64c8d68c39c9182d7b9195b409286ce38a0b072ffd97092b6583ec1e83b0a5a3` |

The **96 × 96 cell is the extraction rectangle**, including transparent padding. The visible props occupy smaller areas within it. Their dimensions already match the gameplay scale of the world-object sheet; import the complete cells and scale the sheet uniformly in the renderer.

The PNG stores pixels only. Clip names, timings, interaction zones, minigame launch events and persistence rules below are implementation recommendations. They are not embedded animation or game-state metadata. Measurements and exact-copy relationships refer to the final PNG identified above.

### Object inventory and measured gameplay scale

Sizes below are measured from the opaque bounds of **idle F1** and **interaction F6**, inside their complete cells. An interaction bound includes raised cards, pieces, screen highlights or other visible details. It is not a physical collider.

| Object ID | Object | Rows | Idle F1 size | Interaction F6 size | Registration |
|---|---|---|---|---|---|
| `deck_of_cards` | Deck of cards | 01–03 | 34 × 18 px | 56 × 41 px | Grounded base |
| `dice` | Dice | 04–06 | 37 × 19 px | 36 × 18 px | Grounded pair; authored lifts and bounce |
| `mahjongg_set` | Mahjongg set | 07–09 | 46 × 27 px | 48 × 29 px | Grounded base |
| `board_game` | Board game | 10–12 | 40 × 18 px | 54 × 26 px | Grounded base |
| `computer_game` | Computer game | 13–15 | 38 × 33 px | 37 × 33 px | Grounded base |
| `building_blocks` | Building blocks | 16–18 | 38 × 31 px | 36 × 36 px | Grounded base |

The deck's raised fan is wider than its resting stack, and the open board is wider than its closed case. Preserve those changes within the fixed cells. The console screen, tile motifs, card portraits and dice pips are intended to read as small gameplay details; enlarging each prop independently would change their relative scale.

## 2. Coordinates and frame locations

Human-readable **rows, columns and F1–F6 labels start at 1**. Pixel coordinates, object indices and flattened frame indices start at **0**. The origin is the image's top-left; x increases right and y increases downward. Rectangles use **`(x, y, width, height)`** with right and bottom edges excluded.

```text
x = (column - 1) * 96
y = (row - 1) * 96
rectangle = (x, y, 96, 96)
frameIndex = (row - 1) * 6 + (column - 1)

For zero-based object index i from 0 through 5:
idle row = 3*i + 1
interaction row = 3*i + 2
disappearance row = 3*i + 3
```

| Column / sequence frame | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

For example, the deck's held fan is **R2 C6**, rectangle **`(480, 96, 96, 96)`**, flat index **11**. Its disappearance begins with identical pixels at **R3 C1**, rectangle **`(0, 192, 96, 96)`**, index **12**. The blocks' completed gateway is **R17 C6**, rectangle **`(480, 1536, 96, 96)`**, index **101**. The final empty cell is **R18 C6**, rectangle **`(480, 1632, 96, 96)`**, index **107**.

### Complete row catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. Only idle wraps back to F1. “Hold result” means keep displaying interaction F6 until the controller explicitly chooses the next state.

| Row | Animation ID | Sequence | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `deck_of_cards_idle` | Idle | 0 | 0–5 | Loop |
| 02 | `deck_of_cards_interaction` | Interaction | 96 | 6–11 | Once; hold result F6 |
| 03 | `deck_of_cards_disappearance` | Disappearance | 192 | 12–17 | Once; hold blank F6 / remove |
| 04 | `dice_idle` | Idle | 288 | 18–23 | Loop |
| 05 | `dice_interaction` | Interaction | 384 | 24–29 | Once; hold result F6 |
| 06 | `dice_disappearance` | Disappearance | 480 | 30–35 | Once; hold blank F6 / remove |
| 07 | `mahjongg_set_idle` | Idle | 576 | 36–41 | Loop |
| 08 | `mahjongg_set_interaction` | Interaction | 672 | 42–47 | Once; hold result F6 |
| 09 | `mahjongg_set_disappearance` | Disappearance | 768 | 48–53 | Once; hold blank F6 / remove |
| 10 | `board_game_idle` | Idle | 864 | 54–59 | Loop |
| 11 | `board_game_interaction` | Interaction | 960 | 60–65 | Once; hold result F6 |
| 12 | `board_game_disappearance` | Disappearance | 1056 | 66–71 | Once; hold blank F6 / remove |
| 13 | `computer_game_idle` | Idle | 1152 | 72–77 | Loop |
| 14 | `computer_game_interaction` | Interaction | 1248 | 78–83 | Once; hold result F6 |
| 15 | `computer_game_disappearance` | Disappearance | 1344 | 84–89 | Once; hold blank F6 / remove |
| 16 | `building_blocks_idle` | Idle | 1440 | 90–95 | Loop |
| 17 | `building_blocks_interaction` | Interaction | 1536 | 96–101 | Once; hold result F6 |
| 18 | `building_blocks_disappearance` | Disappearance | 1632 | 102–107 | Once; hold blank F6 / remove |

## 3. Six-frame sequences and suggested timings

The pose tables describe the visible progression in the finished sheet. Small highlights and idle movements are restrained at native size. All durations are **suggested milliseconds for F1–F6**, with their arithmetic total shown; tune them to the game. The PNG itself has no FPS setting.

Only idle loops. Interaction and disappearance each play once. The interaction's listed duration includes its initial F6 display time; the additional **result hold is indefinite** and is not included in that total. Disappearance starts from its own F1 even though that frame duplicates the held result. Interaction F1 already starts the action, such as lifting a card or moving a tile.

### 01. Deck of cards — rows 01–03

A short face-down deck has midnight-blue backs, thin antique-gold borders and a tiny dungeon-arch motif. Three parchment-faced cards rise above the stack during interaction; their small printed portraits echo the separate playing-card sheet.

**Row 01: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Face-down stack at rest | Faint glint begins at one edge | Glint travels over the top card | Highlight reaches the opposite edge | Glint fades | Exact idle F1; resting stack |

**Suggested durations:** `[220, 160, 140, 160, 180, 220]` ms; **total:** 1080 ms.

**Row 02: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lift the top card above the stack | Draw two more cards upward; three backs visible | Turn the three cards face-up | Spread a broad fan above the deck | Lower the fan slightly into its settled pose | Hold the open fan over the stack |

**Suggested durations:** `[110, 140, 140, 140, 140, 220]` ms; **total:** 890 ms.

**Row 03: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: held fan | Fold the raised cards together; backs turn outward | Lower the cards onto the stack | Deck edges break into gold and dark flecks | A few gold and dark pixels remain | Fully transparent |

**Suggested durations:** `[100, 120, 130, 150, 150, 90]` ms; **total:** 740 ms.

The held fan measures 56 × 41 pixels inside its complete cell. Keep the deck's world root fixed as the cards rise and spread. The fan's three faces are decorative; a playable hand, shuffled order, ranks and suit assignments come from the card-game state and the separate `playing_card_spritesheet.png` asset.

### 02. Dice — rows 04–06

Two D6s sit together: carved bone ivory on the left and dark slate with antique-brass bevels on the right. Tiny circular pips use dark recesses and narrow opposite rim highlights. The pair keeps the same material identity as it tumbles.

**Row 04: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Bone one / slate three visible at rest | Small edge highlight begins | Glint crosses the bevels | Highlight softens | Pair returns to its base highlights | Exact idle F1; resting pair |

**Suggested durations:** `[200, 150, 120, 150, 180, 220]` ms; **total:** 1020 ms.

**Row 05: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Lift both dice slightly | Tumble the dice at different angles | Touch down with small local landing flecks | Bounce once above the contact line | Settle with bone four / slate two visible | Hold the settled four-and-two result |

**Suggested durations:** `[100, 130, 80, 100, 150, 220]` ms; **total:** 780 ms.

**Row 06: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: settled pair | Lift both dice slightly | Edges break into ivory and slate flecks | Smaller remaining die silhouettes | Sparse ivory and slate pixels | Fully transparent |

**Suggested durations:** `[100, 120, 140, 140, 150, 90]` ms; **total:** 740 ms.

Interaction F1, F2 and F4 intentionally sit above the grounded baseline. Keep the object root fixed so the authored lift and bounce remain visible. The prominent face values are baked artwork: idle one/three and held four/two. Resolve random outcomes in game logic and display variable results using the separate `polyhedral_dice_spritesheet.png` and its pip overlays.

### 03. Mahjongg set — rows 07–09

A low wooden tray contains two short rows of ivory tiles. Red-dot and muted green bamboo marks distinguish the visible faces. Interaction reveals a red-dot tile and a green-bamboo tile at the front of the tray.

**Row 07: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Tray and two short tile rows at rest | Rim highlight begins | Highlight passes along the rim | Highlight softens | Rim returns toward its base shading | Exact idle F1; settled tray |

**Suggested durations:** `[200, 160, 140, 160, 180, 220]` ms; **total:** 1060 ms.

**Row 08: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Slide one red-dot tile forward | Lift a second tile above the row | Turn the second tile's bamboo face toward the viewer | Place the bamboo tile beside the red-dot tile | Settle both revealed tiles at the front | Hold the two-tile reveal |

**Suggested durations:** `[120, 140, 140, 140, 160, 220]` ms; **total:** 920 ms.

**Row 09: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: revealed pair | Slide the loose tiles back toward the tray | Draw the rows together inside the tray | Tray and tiles break into pale and wood-colored flecks | Sparse pale and brown pixels | Fully transparent |

**Suggested durations:** `[100, 150, 140, 160, 140, 90]` ms; **total:** 780 ms.

The loose tiles are already included in the 96 × 96 frames and settle at the same lower contact line as the tray. They are not separate pickup sprites. Their small motifs identify this world object; the actual Mahjongg layout, available tile types, matching rules and selections belong to the minigame.

### 04. Board game — rows 10–12

A closed folding wooden board has brass hinges and a small clasp. Opening reveals a checkerboard surface; four small carved pieces settle onto separate squares. The open board remains compact enough to read alongside the other world props.

**Row 10: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Closed board with clasp fastened | Clasp highlight grows | Brief clasp glint | Glint softens | Closed resting highlights | Exact idle F1; closed board |

**Suggested durations:** `[220, 180, 140, 180, 200, 240]` ms; **total:** 1160 ms.

**Row 11: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Release the front clasp | Lift the hinged top half | Unfold the board flat; checker grid exposed | Carved pieces descend toward separate squares | Pieces settle with a few tiny motion flecks | Hold the open board and settled pieces |

**Suggested durations:** `[100, 160, 160, 160, 180, 240]` ms; **total:** 1000 ms.

**Row 12: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: open board and pieces | Lower the pieces toward the grid | Board fully closed; exact idle F1 | Closed board dissolves from its corners | A few wood-colored pixels remain | Fully transparent |

**Suggested durations:** `[100, 140, 160, 160, 140, 100]` ms; **total:** 800 ms.

The open result measures 54 × 26 pixels, including the pieces. Its fixed checker pattern and carved-piece arrangement are introductory artwork; board dimensions, legal moves, piece ownership and victory conditions are supplied by the game. Disappearance F3 intentionally reuses the completely closed idle pose before the corner dissolve.

### 05. Computer game — rows 13–15

A compact tabletop console has a dark slate housing, a brass bezel, a recessed screen, two chunky buttons and a tiny cyan status light. The powered screen contains a miniature pixel dungeon corridor and a small adventurer silhouette.

**Row 13: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Dark screen; dim cyan status light | Status light begins brightening | Small cyan pulse | Pulse softens | Status light returns toward its initial brightness | Exact idle F1; dark screen |

**Suggested durations:** `[160, 160, 180, 180, 160, 160]` ms; **total:** 1000 ms.

**Row 14: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| One button depresses; screen remains dark | Cyan light grows at the screen center | Tiny corridor and adventurer motif appear | Adventurer and corridor highlights brighten | Screen glow settles | Hold the powered-on screen |

**Suggested durations:** `[90, 130, 160, 160, 180, 240]` ms; **total:** 960 ms.

**Row 15: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: powered console | Screen contracts to a thin horizontal line | Line extinguishes; dark screen and intact housing | Housing breaks into slate, brass and cyan pieces | A few cyan and brass pixels remain | Fully transparent |

**Suggested durations:** `[120, 160, 140, 150, 150, 100]` ms; **total:** 820 ms.

The corridor and tiny adventurer are painted inside the console screen. They are not a separately animated player or a live render target. Keep any playable computer-game interface separate from this world sprite. The full-size world character is never drawn inside or beside the console animation.

### 06. Building blocks — rows 16–18

A compact pile contains four wooden cubes, one rectangular foundation beam and one curved teal arch block. Faded red, muted teal and natural wood separate the pieces. The interaction builds a miniature dungeon gateway with two stacked supports and the arch between them.

**Row 16: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Small pile resting on the beam | A loose cube begins a gentle rock | Rock reaches its small offset | Cube rocks back | Pieces settle | Exact idle F1; original pile |

**Suggested durations:** `[180, 160, 160, 160, 180, 220]` ms; **total:** 1060 ms.

**Row 17: Interaction — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Spread the cubes into low supports; arch waits behind | Stack the second pair to form two taller supports | Lift the curved arch above the gap | Seat the arch across the supports | Gateway settles on the foundation beam | Hold the finished gateway |

**Suggested durations:** `[140, 160, 160, 160, 180, 240]` ms; **total:** 1040 ms.

**Row 18: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact interaction F6: finished gateway | Lift the arch off the supports | Cubes and arch tumble into a compact pile | Wooden pieces break into colored flecks | A few red, teal and wood-colored pixels | Fully transparent |

**Suggested durations:** `[120, 140, 160, 160, 150, 100]` ms; **total:** 830 ms.

The beam remains the foundation while the four cubes form two stacks. The arch's lift is already animated inside the cell. The finished gate is an activation pose; a construction minigame can define its own inventory, snapping grid and valid builds without treating this fixed arrangement as the player's solution.

## 4. Import, playback and world state

### Import and slice

1. Import the original PNG with point/nearest-neighbor sampling and preserve its alpha. Use integer display scales when practical.
2. Slice **96 × 96** cells with offset **(0,0)**, margin **0**, spacing **0**, six columns and eighteen rows.
3. Keep all **108** cells. Disable trimming, opaque-bounds recentering, empty-frame removal and automatic size normalization.
4. Use a fixed grounded pivot of **(48,85)** for all eighteen frames of each object. This places the boundary beneath visible ground pixel 84 on the world's contact line.
5. Build each object's three clips from its three consecutive rows. Only the idle clip loops. Supply frame durations in the animation system.

### Recommended state behavior

| Current state | Display and transition |
|---|---|
| Idle | Loop the six idle frames while the object is available. Accept one activation request and begin its interaction row at F1. |
| Interaction | Play all six action poses once. Reject duplicate activation requests while the sequence is running. |
| Result hold | Keep interaction F6 visible while the game opens and runs its minigame. The hold can last indefinitely. |
| Disappearance | Start at the exact copied F1 only when removal is explicitly requested. Play the six frames once. |
| Gone | Keep the fully transparent F6 or remove the renderable/entity according to the world's lifecycle. Retain any required saved state. |

A minigame object can remain in its held pose after the interface opens or closes. Disappearance is a separate world-state decision, not the automatic result of activating the object. A long animation update must not consume the hold and immediately make the prop vanish.

If the game pauses world simulation while the minigame is open, enter the result hold before opening that interface. On return, continue from the held pose. The disappearance's exact first-frame copy provides a continuous visual transition even after a long pause.

For reusable stations, define an explicit reset or re-arming policy. Returning directly to idle restores the closed deck/board, dark console or original block pile as a deliberate visual cut. The sheet provides no separate reverse interaction or result-to-idle reset clip. A game can instead complete disappearance, wait until respawn is appropriate, then create a fresh idle cycle.

### Suggested gameplay commit points

The example controller dispatches one **minigame-ready event after the entire interaction row**, including F6's listed duration. The sprite is already in its result hold when the callback runs. This event opens the minigame; rewards, wins, card draws, random dice values and puzzle solutions are resolved separately by that minigame.

| Object | Held result cell / flat index | Ready event after interaction begins | Example game responsibility |
|---|---|---:|---|
| Deck of cards | R2 C6 / 11 | 890 ms | Hold the three-card fan while the card minigame opens. |
| Dice | R5 C6 / 29 | 780 ms | Hold the settled pair while the dice minigame opens; compute its outcomes separately. |
| Mahjongg set | R8 C6 / 47 | 920 ms | Hold the two revealed tiles while the Mahjongg minigame opens. |
| Board game | R11 C6 / 65 | 1000 ms | Hold the open checkerboard and pieces while the board minigame opens. |
| Computer game | R14 C6 / 83 | 960 ms | Hold the powered console while its computer-game interface opens. |
| Building blocks | R17 C6 / 101 | 1040 ms | Hold the finished gateway while the building-block minigame opens. |

These times follow the suggested durations in section 3. If the game should open its interface immediately upon entering F6, dispatch once at that frame-entry boundary instead. Choose one launch point and retain an idempotent guard; repeated rendering of F6 and the copied disappearance F1 must not open another session.

The provided controller models one accepted activation per world-object instance. Use a stable instance ID to distinguish two objects of the same type. Persist availability and completed-session state as required by the game. The callback is an in-memory launch notification, not a saved reward transaction.

### JavaScript example: all clips, sampling, state and drawing

This single block is runnable JavaScript without external packages. It constructs all **18** clips, supports uneven frame durations and clamps negative sample time to zero. Only idle uses modulo playback. The draw helper accepts an already loaded PNG and rendering context; the lifecycle example runs without a browser or image load.

```javascript
const MINIGAME_CELL = 96;
const MINIGAME_COLUMNS = 6;
const MINIGAME_GROUND_PIVOT = { x: 48, y: 85 };

const minigameSpecs = [
  {"id":"deck_of_cards","firstRow":1,"timings":{"idle":[220,160,140,160,180,220],"interaction":[110,140,140,140,140,220],"disappearance":[100,120,130,150,150,90]}},
  {"id":"dice","firstRow":4,"timings":{"idle":[200,150,120,150,180,220],"interaction":[100,130,80,100,150,220],"disappearance":[100,120,140,140,150,90]}},
  {"id":"mahjongg_set","firstRow":7,"timings":{"idle":[200,160,140,160,180,220],"interaction":[120,140,140,140,160,220],"disappearance":[100,150,140,160,140,90]}},
  {"id":"board_game","firstRow":10,"timings":{"idle":[220,180,140,180,200,240],"interaction":[100,160,160,160,180,240],"disappearance":[100,140,160,160,140,100]}},
  {"id":"computer_game","firstRow":13,"timings":{"idle":[160,160,180,180,160,160],"interaction":[90,130,160,160,180,240],"disappearance":[120,160,140,150,150,100]}},
  {"id":"building_blocks","firstRow":16,"timings":{"idle":[180,160,160,160,180,220],"interaction":[140,160,160,160,180,240],"disappearance":[120,140,160,160,150,100]}}
];
const MINIGAME_TYPES = Object.fromEntries(
  minigameSpecs.map(spec => [spec.id, spec])
);
const MINIGAME_PHASES = ["idle", "interaction", "disappearance"];

const MINIGAME_CLIPS = Object.fromEntries(minigameSpecs.flatMap(spec =>
  MINIGAME_PHASES.map((phase, phaseIndex) => {
    const row = spec.firstRow + phaseIndex;
    const ms = spec.timings[phase];
    if (ms.length !== 6 || ms.some(t => !Number.isFinite(t) || t <= 0)) {
      throw new Error("Invalid six-frame timing: " + spec.id + "_" + phase);
    }
    const frames = ms.map((durationMs, column0) => ({
      row,
      column: column0 + 1,
      index: (row - 1) * MINIGAME_COLUMNS + column0,
      rect: {
        x: column0 * MINIGAME_CELL,
        y: (row - 1) * MINIGAME_CELL,
        width: MINIGAME_CELL,
        height: MINIGAME_CELL
      },
      durationMs
    }));
    const id = spec.id + "_" + phase;
    return [id, {
      id, objectId: spec.id, phase, row,
      loop: phase === "idle",
      frames,
      durationMs: ms.reduce((sum, duration) => sum + duration, 0)
    }];
  })
));

function sampleMinigameClip(clip, elapsedMs) {
  if (!Number.isFinite(elapsedMs)) {
    throw new TypeError("elapsedMs must be finite");
  }
  const elapsed = Math.max(0, elapsedMs);
  if (!clip.loop && elapsed >= clip.durationMs) {
    return { frame: clip.frames[5], complete: true };
  }
  let t = clip.loop ? elapsed % clip.durationMs : elapsed;
  for (const frame of clip.frames) {
    if (t < frame.durationMs) return { frame, complete: false };
    t -= frame.durationMs;
  }
  return { frame: clip.frames[5], complete: false };
}

function createMinigameObject(objectId, instanceId, onReady = () => {}) {
  if (!Object.prototype.hasOwnProperty.call(MINIGAME_TYPES, objectId)) {
    throw new Error("Unknown minigame object: " + objectId);
  }
  if (typeof instanceId !== "string" || instanceId.length === 0) {
    throw new TypeError("instanceId must be a nonempty stable world ID");
  }
  if (typeof onReady !== "function") {
    throw new TypeError("onReady must be a function");
  }
  return {
    objectId, instanceId, state: "idle", elapsedMs: 0,
    interactionAccepted: false, readyDispatched: false, onReady
  };
}

function beginMinigameInteraction(object) {
  if (object.state !== "idle" || object.interactionAccepted) return false;
  object.interactionAccepted = true;
  object.state = "interaction";
  object.elapsedMs = 0;
  return true;
}

function beginMinigameDisappearance(object) {
  if (object.state !== "hold") return false;
  object.state = "disappearance";
  object.elapsedMs = 0;
  return true;
}

function currentMinigameSample(object) {
  const phase = object.state === "hold" ? "interaction"
    : object.state === "gone" ? "disappearance" : object.state;
  const clip = MINIGAME_CLIPS[object.objectId + "_" + phase];
  const elapsed = object.state === "hold" || object.state === "gone"
    ? clip.durationMs : object.elapsedMs;
  return sampleMinigameClip(clip, elapsed);
}

function advanceMinigameObject(object, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new TypeError("deltaMs must be finite and nonnegative");
  }
  if (object.state === "hold" || object.state === "gone") {
    return currentMinigameSample(object);
  }
  const phase = object.state;
  const clip = MINIGAME_CLIPS[object.objectId + "_" + phase];
  object.elapsedMs = clip.loop
    ? (object.elapsedMs + deltaMs) % clip.durationMs
    : Math.min(object.elapsedMs + deltaMs, clip.durationMs);

  const sample = sampleMinigameClip(clip, object.elapsedMs);
  if (sample.complete && phase === "interaction") {
    // Set hold and the guard BEFORE invoking game code.
    object.state = "hold";
    object.elapsedMs = clip.durationMs;
    if (!object.readyDispatched) {
      object.readyDispatched = true;
      object.onReady({
        objectId: object.objectId,
        instanceId: object.instanceId
      });
    }
  } else if (sample.complete && phase === "disappearance") {
    object.state = "gone";
    object.elapsedMs = clip.durationMs;
  }
  return currentMinigameSample(object);
}

function drawMinigameObject(ctx, image, frame, rootX, groundY, scale = 1,
                            pivot = MINIGAME_GROUND_PIVOT) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new TypeError("scale must be finite and positive");
  }
  const r = frame.rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(rootX, groundY);
  ctx.scale(scale, scale);
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
                -pivot.x, -pivot.y, MINIGAME_CELL, MINIGAME_CELL);
  ctx.restore();
}

// Standalone lifecycle example; no browser or image load is needed.
const readyEvents = [];
const exampleDeck = createMinigameObject(
  "deck_of_cards",
  "tavern_table_deck_01",
  event => {
    readyEvents.push(event);
    // Open the card minigame here. Keep the world sprite in "hold".
  }
);

beginMinigameInteraction(exampleDeck);
advanceMinigameObject(
  exampleDeck,
  MINIGAME_CLIPS.deck_of_cards_interaction.durationMs
);
// state is "hold"; exactly one ready event was dispatched.
advanceMinigameObject(exampleDeck, 10000);
// Still holds interaction F6. No automatic disappearance or second event.

// Later, after the minigame closes, if the world object should be removed:
beginMinigameDisappearance(exampleDeck);
advanceMinigameObject(
  exampleDeck,
  MINIGAME_CLIPS.deck_of_cards_disappearance.durationMs
);
const exampleFinalSample = currentMinigameSample(exampleDeck);
// state is "gone"; frame.index is 17, the fully transparent R3 C6.
```

The sampler keeps F6 for its full assigned duration before reporting completion. Completed one-shot clips continue to return F6. The controller never automatically chains interaction into disappearance, even if an update exceeds the interaction duration.

The controller enters `hold` and sets `readyDispatched` before calling external game code. Subsequent updates, repeated input and re-entrant callbacks therefore do not dispatch the same launch event again. The disappearance request starts at elapsed time 0, ensuring its duplicated F1 receives its own full duration.

Connect `onReady` to the game's minigame router. Keep reward settlement, random outcomes and reset rules in the game layer. If an object will be reused, explicitly re-arm or replace its controller after the previous session and the chosen visual reset have finished.

## 5. Important alignment and integration notes

### Exact state-boundary relationships

For an object whose idle row is `r`, the delivered pixels satisfy the following relationships. These were verified against the final PNG, including transparent pixels, loose pieces and local effects.

| Relationship | Meaning |
|---|---|
| `(r, F6) == (r, F1)` | Idle returns to the exact starting pixels at its final frame. |
| `(r+2, F1) == (r+1, F6)` | Disappearance begins with the exact held interaction result. |
| `(r+2, F6)` is all-zero RGBA | Every disappearance ends fully transparent, with no hidden colored pixels. |

Interaction F1 is an action pose. There is **no general idle-F1-to-interaction-F1 copy rule** for this sheet. Start the interaction at its own F1 so the lift, button press, clasp release or piece movement is retained.

The duplicate boundary image is still a distinct frame in a distinct row. It does not make either one-shot animation a loop, and it does not imply a second minigame event. If the repeated boundary pose feels too long, tune the two frame durations while preserving the frame order.

| Object | Held interaction F6 | Identical disappearance F1 | Fully transparent ending |
|---|---|---|---|
| Deck of cards | R2 C6, index 11 | R3 C1, index 12 | R3 C6, index 17 |
| Dice | R5 C6, index 29 | R6 C1, index 30 | R6 C6, index 35 |
| Mahjongg set | R8 C6, index 47 | R9 C1, index 48 | R9 C6, index 53 |
| Board game | R11 C6, index 65 | R12 C1, index 66 | R12 C6, index 71 |
| Computer game | R14 C6, index 83 | R15 C1, index 84 | R15 C6, index 89 |
| Building blocks | R17 C6, index 101 | R18 C1, index 102 | R18 C6, index 107 |

The intentionally empty cells are **R3, R6, R9, R12, R15 and R18, all at C6**. Their zero-based indices are **17, 35, 53, 71, 89 and 107**. They remain valid 96 × 96 extraction rectangles.

The folding board has one additional exact relationship: **R12 C3 equals R10 C1**. This is the fully closed board pose used before its corner dissolve. The deck's lowered stack is visually similar to its idle stack, but the guide makes no pixel-identity guarantee for that additional pair.

### Ground line, cell pivot and authored motion

All idle frames and grounded interaction poses end at cell-local visible pixel **y = 84**. The next horizontal boundary is **y = 85**, so the recommended continuous rendering pivot is **(48,85)**. The nominal art contact marker **(48,84)** refers to the last occupied pixel row; it should not be confused with the boundary below that row.

At display scale `s`, with a world root centered at `rootX` and a contact boundary at `groundY`:

```text
imageLeft = rootX   - 48 * s
imageTop  = groundY - 85 * s
drawWidth  = 96 * s
drawHeight = 96 * s
```

In a top-left normalized pivot convention, the boundary pivot is **`(0.5, 85/96)`**, approximately **`(0.5, 0.885416667)`**. For a bottom-left origin with y increasing upward, the equivalent pivot is **`(48,11)`**, normalized **`(0.5, 11/96)`**. Keep the same convention for every frame and object.

Dice interaction **F1, F2 and F4** intentionally lift above the grounded baseline. The disappearance also lifts and shrinks the pair. Cards, tiles, board pieces and the arch block likewise move within their cells while their base remains registered. Keep the world root fixed during these poses; adding a second jump or re-centering each frame would change the authored motion.

The following measured local bounds are useful for inspecting scale or defining a conservative culling region. Each uses `(x, y, width, height)`. The union includes every opaque pixel across all eighteen cells of that object, including effects.

| Object | Idle F1 bounds | Interaction F6 bounds | Union across all poses |
|---|---|---|---|
| Deck of cards | `(31, 67, 34, 18)` | `(20, 44, 56, 41)` | `(19, 41, 57, 44)` |
| Dice | `(30, 66, 37, 19)` | `(31, 67, 36, 18)` | `(25, 56, 47, 29)` |
| Mahjongg set | `(26, 58, 46, 27)` | `(24, 56, 48, 29)` | `(24, 56, 49, 29)` |
| Board game | `(28, 67, 40, 18)` | `(21, 59, 54, 26)` | `(21, 48, 54, 37)` |
| Computer game | `(29, 52, 38, 33)` | `(30, 52, 37, 33)` | `(29, 52, 40, 33)` |
| Building blocks | `(28, 54, 38, 31)` | `(29, 49, 36, 36)` | `(28, 43, 39, 42)` |

Use these bounds for reference rather than as moving pivots. The visible bounds change as cards fan, dice tumble, pieces lift and objects dissolve. Do not trim individual cells and align their new bounding-box centers or lowest remaining pixels.

### Collision, effects and persistence

Define colliders and interaction zones separately from the 96-pixel extraction cells. A useful activation zone can be larger than the tiny prop. Keep physical collision tied to the intended base or world object, rather than expanding it when a fan opens or shrinking it with fading fragments.

Glints, landing flecks, tile fragments, the console's screen imagery and other local effects are already drawn into the frames. The sheet's alpha is binary: its disappearance effect comes from changing and removing opaque pixel clusters. Additional global opacity is optional engine styling and will change the authored dissolve.

The die pips, miniature card portraits, tile motifs, checkerboard pieces, screen corridor and completed block gateway are fixed illustrations. Game logic supplies randomized results, current hands, puzzle layouts, controls, rewards and win conditions. Use `playing_card_spritesheet.png` for separate playable card faces, backs and suits, and `polyhedral_dice_spritesheet.png` for separate dice and pip overlays.

Keep the PNG at its original resolution, use point sampling for crisp edges and avoid lossy recompression. Source margin and spacing are **zero**, while each cell's transparent interior padding remains part of that frame. If an engine repacks or trims sprites, preserve their original 96 × 96 logical size and pivot offsets. Any additional GPU-atlas extrusion belongs to that later packing step.

Save logical world state separately from the sprite animation: whether the station is available, whether a session is active or completed, and whether the object should remain held, disappear or become reusable. The repeated result pixels do not encode those decisions.

## 6. Exact rectangle appendix

Each entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order, and every rectangle includes its transparent padding. This appendix contains all **108** frame locations, including the six empty disappearance endings.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `deck_of_cards_idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `deck_of_cards_interaction` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `deck_of_cards_disappearance` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `dice_idle` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `dice_interaction` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `dice_disappearance` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `mahjongg_set_idle` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `mahjongg_set_interaction` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `mahjongg_set_disappearance` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `board_game_idle` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `board_game_interaction` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `board_game_disappearance` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `computer_game_idle` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `computer_game_interaction` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |
| 15 `computer_game_disappearance` | `(0, 1344, 96, 96)` | `(96, 1344, 96, 96)` | `(192, 1344, 96, 96)` | `(288, 1344, 96, 96)` | `(384, 1344, 96, 96)` | `(480, 1344, 96, 96)` |
| 16 `building_blocks_idle` | `(0, 1440, 96, 96)` | `(96, 1440, 96, 96)` | `(192, 1440, 96, 96)` | `(288, 1440, 96, 96)` | `(384, 1440, 96, 96)` | `(480, 1440, 96, 96)` |
| 17 `building_blocks_interaction` | `(0, 1536, 96, 96)` | `(96, 1536, 96, 96)` | `(192, 1536, 96, 96)` | `(288, 1536, 96, 96)` | `(384, 1536, 96, 96)` | `(480, 1536, 96, 96)` |
| 18 `building_blocks_disappearance` | `(0, 1632, 96, 96)` | `(96, 1632, 96, 96)` | `(192, 1632, 96, 96)` | `(288, 1632, 96, 96)` | `(384, 1632, 96, 96)` | `(480, 1632, 96, 96)` |

The names and timing arrays in this guide are suggested integration identifiers. They may be renamed or tuned without changing the source image, frame order, extraction coordinates or exact transition-frame relationships.
