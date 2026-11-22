# Dungeon Scroller — Design Document

Status: **draft 2** — design and build plan. Asset JSON (phase 0) exists for every sheet that has a guide; no game code exists yet.

Dungeon Scroller is a 2D side-scrolling action platformer that runs entirely in the browser as a static website. The player picks a hero from a set of character cards, picks a level (hand-made or randomly generated), and fights through undead-filled dungeons and graveyards to a boss. Everything the game draws, plays, or spawns is described by JSON, so assets and levels can be swapped without touching code, and a server or local AI can later supply levels, missions, and other players.

---

## 1. Goals and constraints

| # | Goal | Consequence for the design |
|---|---|---|
| G1 | Static website; the whole game runs in the browser | No server code required. Only `fetch` of files that sit next to `index.html`. |
| G2 | Relative paths only | No URL begins with `/` or a hostname. The site works from any sub-directory. |
| G3 | HTTPS in production | We may rely on secure-context browser features (Web Audio, service workers, WebGPU, `wss://`). |
| G4 | No build step, no Node/npm for the site owner | Plain ES modules. Third-party code is vendored into the repo as ready-to-use files. |
| G5 | High-quality graphics and audio | Sharp pixel art at any window size or zoom; HiDPI aware; lossless-quality audio pipeline. |
| G6 | Game fills the browser width; user can zoom in and out | Resolution-independent camera; see §6. |
| G7 | Data-driven: `dungeon.json` → catalogs → per-asset JSON | The engine hard-codes no asset path, key binding, stat, or animation timing. |
| G8 | Levels from JSON files or a seeded random generator | One level schema, several interchangeable sources; see §10. |
| G9 | Ready for an optional backend (levels, missions, multiplayer, chat, AI) | Simulation is separate from rendering and input; actors are driven by swappable controllers; see §15. |
| G10 | Characters speak via speech bubbles, later via in-browser text-to-speech | Dialogue is data; speech output goes through a provider interface; see §13. |
| G11 | MIT licensed; all assets are AI generated | `LICENSE` at the root; vendored libraries must be MIT-compatible. |

**Out of scope for version 1:** gamepad and touch input, multiplayer, backend, text-to-speech, NPC behaviour beyond standing and talking, saving mid-level.

---

## 2. Technology

| Area | Choice | Why |
|---|---|---|
| Rendering | **PixiJS 8** (MIT), vendored as `vendor/pixi.min.mjs` | Batched WebGL/WebGPU sprites, nearest-neighbour sampling, filters for later lighting. No CDN, so the site is self-contained. |
| Simulation | **Our own**, fixed 60 Hz timestep | Platformer feel, stairs, 45° slopes and one-way platforms need purpose-built collision. Has no dependency on PixiJS or the DOM, so it can later run on a server. |
| Language | Plain JavaScript ES modules with JSDoc type comments | Runs directly in the browser; editors still give type hints. |
| HUD, menus, bubbles | HTML and CSS layered over the canvas | Text stays sharp at every zoom, is easy to style, and is readable by a speech system. |
| Audio | Web Audio API, used directly | Three buses (music, effects, voice) with independent volume. No library needed. |
| Persistence | `localStorage` for settings and progress | Small, synchronous, enough for version 1. |
| Tests | A `tests.html` page that runs simulation tests in the browser | No Node required. |

**Local development** needs a static file server only because browsers refuse to load ES modules and JSON from `file://`. Any server works; Python ships one:

```bash
python3 -m http.server 8000
```

### 2.1 Why sprites are not stored in IndexedDB

Decision: **no IndexedDB for sprites.** Building the animation sequences at start-up does not copy pixels — it only creates lightweight rectangles that point into the already-decoded sheet — so there is nothing expensive to cache. The image files themselves are cached by the browser's ordinary HTTP cache. Storing decoded copies in IndexedDB would duplicate that cache, add invalidation problems when a sheet is replaced, and gain no measurable load time.

Where local storage does earn its place later:

- **Offline play / instant reload:** a service worker with the Cache API (requires HTTPS, which we have).
- **Server- or AI-generated content:** IndexedDB for downloaded levels, missions, and generated voice audio.
- **Large save files:** IndexedDB if saves outgrow `localStorage`.

---

## 3. Repository layout

```
index.html                 the game: title, hero and level selection, settings, play screen
viewer.html                asset viewer: every sheet entity, tileset and card, with checks (§16)
dungeon.json               site configuration; the first file fetched (§4). Not in the repository.
example.dungeon.json       documented example; used when dungeon.json is missing
LICENSE                    MIT
DESIGN.md                  this document
css/                       page, HUD, menu and speech-bubble styles
js/                        game source (§5)
vendor/pixi.min.mjs        vendored PixiJS 8.23.0 (MIT; licence in vendor/pixi.LICENSE)
data/                      catalogs: which assets exist and their gameplay values (§4.2)
levels/                    static level files (§10)
tests.html                 in-browser simulation tests
levels/                    static level files
assets/
  cards/                   character and enemy cards
  music/                   background music
  sfx/                     sound effects
  sprites/players/         96×96 hero sheets
  sprites/enemies/         96×96 enemy sheets
  sprites/bosses/          256×256 boss sheets
  sprites/NPCs/            96×96 NPC sheets
  sprites/objects/         96×96 object sheets
  tilesheets/              96×96 terrain tiles (not animated)
```

Each sheet is three files with the same base name: `.png` (pixels), `.md` (human guide), `.json` (machine description, §4.3).

---

## 4. Configuration and data

Loading is a chain. Every path inside a JSON file is **relative to the file that contains it**, resolved with `new URL(path, urlOfThatFile)`. Moving or swapping a folder of assets therefore never requires editing unrelated files.

```
index.html
  └─ dungeon.json  (or example.dungeon.json)     site config, controls, asset list, catalog paths, api
       ├─ assets.cards[]         →  <card>.json     →  <card>.png       card art and text area (§4.5)
       ├─ assets.spritesheets[]  →  <sheet>.json    →  <sheet>.png      art facts (§4.3)
       ├─ assets.tilesets[]      →  <tileset>.json  →  <tileset>.png    art facts (§4.4)
       ├─ data/players.json   ─┐
       ├─ data/enemies.json    │  gameplay values (§4.2); each entry names a
       ├─ data/bosses.json     ├─ sheet entity by ID and, for heroes and
       ├─ data/npcs.json       │  enemies, a card image
       ├─ data/objects.json   ─┘
       ├─ data/audio.json     →  music and sound-effect files
       └─ data/levels.json    →  levels/*.json and generator presets
```

### 4.1 `dungeon.json`

The site configuration, fetched from the directory the game was loaded from. **`dungeon.json` is not kept in the repository**: each installation writes its own. If the fetch fails (file missing), the game loads **`example.dungeon.json`** from the same directory instead, so a fresh checkout runs without any set-up. `example.dungeon.json` is the reference for every setting.

| Block | Purpose |
|---|---|
| `assets` | Lists of sprite-sheet and tileset JSON files to load. Swapping art means changing a path here. |
| `catalogs` | Paths to the gameplay catalogs (§4.2). |
| `display` | Default, minimum and maximum view width in tiles; pixel-perfect scaling on or off. |
| `controls` | Default key bindings: action → list of `KeyboardEvent.code` values. |
| `levels` | Path to the index of static levels (`data/levels.json`). |
| `rules` | Lives (default 9999), respawn behaviour, and whether touching an enemy hurts. |
| `difficulty` | Multipliers applied on top of the catalog values (enemy health, enemy damage, touch damage, player damage, MP regeneration, loot). All are 1 for now; changing them here retunes the whole game without editing the catalogs. |
| `physics` | World constants: tick rate, gravity, terminal speed, run multiplier. |
| `audio`, `speech` | Default volumes; speech provider. |
| `generator` | Defaults for random levels. |
| `api` | `null` in version 1; §15 describes what it will hold. |

**Key bindings are configurable at two levels.** The site's defaults come from `controls` in `dungeon.json`. Each player can then rebind any action in the settings screen (choose the action, press the new key; conflicts are flagged; "reset to defaults" restores the site's bindings). A player's bindings are stored in `localStorage` and override the site defaults. Key names are `KeyboardEvent.code` values, so bindings do not depend on keyboard language.

### 4.2 Catalogs (`data/*.json`) — gameplay values

A catalog holds the **gameplay** values for every thing of one kind: `data/players.json`, `data/enemies.json`, `data/bosses.json`, `data/objects.json`. Each entry names the sheet entity it belongs to, so art and gameplay can be changed independently. All numbers are starting values for play-testing.

```json
{
  "schema": "dungeon-scroller/catalog@1",
  "kind": "player",
  "defaults": {
    "stats": { "mpRegen": 4, "invulnerableAfterHit": 0.8 },
    "movement": { "walkSpeed": 160, "runSpeed": 280, "jumpHeight": 144, "crawlSpeed": 70, "airControl": 0.7 },
    "teleport": { "mp": 20, "distance": 288 }
  },
  "entries": {
    "fire_mage": {
      "sheet": "../assets/sprites/players/fire_mage_spritesheet.json",
      "entity": "fire_mage",
      "card": "../assets/cards/fire_mage_card.json",
      "role": "High damage, fragile",
      "blurb": "Burns everything in front of him.",
      "stats": { "hp": 80, "mp": 120 },
      "flight": { "mode": "mp", "mpPerSecond": 10, "speed": 240 },
      "body": { "x": -14, "y": -52, "w": 19, "h": 52 },
      "crouchBody": { "x": -14, "y": -31, "w": 19, "h": 31 },
      "abilities": {
        "attack1": { "type": "area", "mp": 15, "damage": 22, "air": false, "box": { "x": 5, "y": -48, "w": 46, "h": 34 } },
        "attack2": { "type": "projectile", "mp": 10, "damage": 18, "air": true, "projectile": { "speed": 560, "range": 600 } },
        "attack3": { "type": "melee", "mp": 0, "damage": 8, "air": false, "box": { "x": 5, "y": -44, "w": 19, "h": 21 } }
      }
    }
  }
}
```

- **Defaults.** Every entry inherits the catalog's `defaults` and may override any value, so a single hero can be made faster or given a longer teleport without repeating the rest.
- **Boxes.** All boxes are in pixels relative to the actor's pivot (feet, on the ground line) for an actor **facing right**: `x` is the left edge, `y` the top edge (negative is up). They mirror with the sprite. `body` and `crouchBody` are collision boxes; the simulation centres the actor on the body box's horizontal middle. An ability's `box` is active during the `melee`, `area`, `impact` or `emit` event window of that slot's animation (§4.3).
- **Boxes were drafted from the sprite pixels** and are adjusted by eye in the viewer (§16.1).
- **Ability names** come from the animation labels in the sheet JSON and are not repeated here.
- **Ability types:** `melee`, `area` (short-range effect in front), `projectile`, `target` (applies to a chosen enemy, no projectile), `heal`. Optional `effect` values: `knockback` (px/s), `slow` (speed factor) and `stun` (seconds) with `duration`, `damageTaken` (multiplier on the target).
- **`air`** says whether the ability can be used while jumping or flying. Ranged abilities can; melee and ground effects cannot.
- **`flight.mode`** is `"none"`, `"mp"` (drains `mpPerSecond` while airborne) or `"free"`.

**Heroes**

| Hero | Role | HP | MP | Attack 1 | Attack 2 | Attack 3 (no MP) | Flight |
|---|---|---|---|---|---|---|---|
| Light and space mage | Support | 90 | 140 | Heal 30 HP (25 MP) | Space bolt 16 (12 MP) | Staff 10 | MP, 10/s |
| Fire mage | High damage, fragile | 80 | 120 | Flame fan 22 (15 MP) | Firebolt 18 (10 MP) | Dagger 8 | MP, 10/s |
| Water mage | Control | 100 | 110 | Wave 14, knockback (14 MP) | Bolt 14, slows (10 MP) | Spear 12 | MP, 10/s |
| Wind mage | Mobility, ranged | 85 | 110 | Gust 10, strong knockback (12 MP) | Blade 14, passes through (12 MP) | Arrow 9 | Free |
| Earth mage | Tank | 140 | 80 | Spires 20, ground only (16 MP) | Stone 16, arcs (10 MP) | Shield bash 12, stuns | MP, 20/s |
| Dark swordsman | Melee | 130 | 70 | Mind jolt 6, stuns (12 MP) | Hex: target takes +50% damage for 6 s (18 MP) | Sword 18 | None |

**Enemies** (`attack1`–`attack3` are light, medium, heavy)

| Enemy | Archetype | HP | Damage L / M / H | Speed | Touch | Score |
|---|---|---|---|---|---|---|
| Normal skeleton | walker | 30 | 8 / 12 / 18 | 110 | 4 | 10 |
| Skeleton knight | guard | 60 | 10 / 16 / 22 | 80 | 5 | 25 |
| Death knight | guard | 120 | 12 / 20 / 30 | 60 | 6 | 60 |
| Undead wolf | pouncer | 45 | 8 / 12 / 20 | 240 | 4 | 20 |
| Wight | guard | 80 | 12 / 14 / 24 | 90 | 6 | 40 |
| Lich | caster | 70 | bolt 10 / three bolts of 8 / eruption 26 | 100 | 5 | 50 |

**Bosses** have three phases, changing at 66% and 33% health; each phase adds an attack and raises the tempo (1.0, 1.15, 1.3). The fourth attack is used only in the last phase.

| Boss | HP | Attacks 1–4 |
|---|---|---|
| Undead dragon | 600 | Bite 20; tail sweep 26 with knockback; gravefire breath 30; dive 40 |
| Undead Fenrir | 700 | Fang snap 20; raking lunge 26; pounce 34; howl 24 in a wide radius, stuns |
| Death monarch | 800 | Thrust 22; sweep 28 with knockback; cleave 38; three spectral blades of 30 |

**Objects** carry `use` (`touch`, `interact`, `attack`, `none`), a `behaviour`, what they give, and a `box` (the touch, interaction or hit area; also the collision box when `solid`). Values: potions restore 40 HP or 40 MP; coin 1 point, gem 10; scroll doubles damage for 15 s; shrine refills HP and MP every 30 s; flag sets the respawn point and refills HP; crates and barrels are solid and break in one hit; the relic ends the level.

### 4.3 Per-sheet JSON — art facts

One JSON file per PNG, written from the sheet's markdown guide and checked against the PNG. It records only what the guide states or what can be measured from the pixels: grid, facing, pivot, which rows belong to which entity, and how each row plays. Nothing is guessed — **a sheet gets its JSON only after its guide exists.** A sheet may hold several entities (the enemy sheets hold three each, the boss sheet three, the object sheet sixteen).

```json
{
  "schema": "dungeon-scroller/spritesheet@1",
  "kind": "enemy",
  "image": "undead_tier2_spritesheet.png",
  "guide": "undead_tier2_spritesheet.md",
  "sha256": "99a965d7…",
  "size": { "w": 576, "h": 2016 },
  "cell": { "w": 96, "h": 96 },
  "columns": 6,
  "rows": 21,
  "facing": "left",
  "pivot": { "x": 48, "y": 85 },
  "groundY": 84,
  "notes": ["…"],
  "entities": {
    "undead_wolf": {
      "name": "Undead Wolf",
      "description": "Low, long quadruped…",
      "rows": [1, 7],
      "region": { "x": 0, "y": 0, "w": 576, "h": 672 },
      "idleBounds": { "x": 11, "y": 52, "w": 59, "h": 33 },
      "animations": {
        "idle":    { "id": "undead_wolf_idle", "label": "Idle", "row": 1, "loop": true,
                     "durations": [160, 160, 160, 160, 160, 160] },
        "attack1": { "id": "undead_wolf_bite", "label": "Snap bite", "row": 5, "end": "state",
                     "durations": [70, 70, 60, 80, 100, 120],
                     "events": [ { "frame": 3, "type": "melee", "until": 4 } ] }
      }
    }
  }
}
```

| Field | Meaning |
|---|---|
| `kind` | `player`, `enemy`, `boss`, `object`, or `npc`. |
| `sha256` | Digest of the PNG the JSON was written for, so a changed image can be detected. |
| `facing` | Direction the art faces as drawn. The renderer mirrors the whole cell about the pivot for the other direction. |
| `pivot`, `groundY` | The fixed point of every cell that is placed on the actor's world position, and the cell row of the lowest grounded pixel. |
| `entities.<id>.rows`, `region` | The entity's block of sheet rows (1-based, inclusive) and the same block in pixels. The loader uploads `region` as its own texture (§5.1). |
| `idleBounds` | Measured opaque bounds of the first idle frame, cell-local. A starting point for authoring collision boxes; not itself a collision box. |
| `animations` | Keyed by **standard slot name** (below). `id` and `label` keep the guide's own names for the action. |
| `row` | Sheet row, 1-based. Frames always play left to right, one per column. |
| `loop` / `end` | Either `"loop": true`, or `end`: `"state"` (the actor's state machine chooses what follows), `"hold"` (stay on the last frame), `"remove"` (objects: delete after the last frame). |
| `durations` | Milliseconds per frame, one per column. Starting values from the guide; tune freely. |
| `offsets` | Optional. One `[dx, dy]` pair per frame, in whole art pixels, that shifts where that frame is drawn. It corrects frames that were drawn slightly out of position in the sheet, without editing the image. Values are in the sheet's drawn orientation (positive x is right in the image) and are mirrored automatically with the sprite. Omitted means no shift. |
| `events` | Fired once on entering `frame` (1-based). With `until`, the event is a window that stays active through that frame. `note` carries the guide's advice. |
| `emptyFrames` | Frames that are intentionally fully transparent (teleport-out's last frame, the last frame of every object's vanish row). |

Event types: `melee` (hit window), `spawn` (launch a projectile or remote effect), `emit` (start a sustained effect such as a breath or howl), `area` (enable a short close-range area attack drawn in the frame), `cast` (apply a targeted spell with no travelling projectile), `heal`, `takeoff`, `land`, `leap`, `impact`, `teleport`, `footstep`.

Object entities add `registration` (`ground`, `float`, or `wall` — how the art sits relative to the ground line), `commit` (`accept`: the reward is applied when the interaction starts; `complete`: when the interact row finishes), `persistent` (keeps its activated look instead of vanishing: flag, lever, shrine, torch), and `resultBounds` (measured bounds of the final interact frame).

**What is deliberately not in the sheet JSON:** collision boxes, hit-box shapes, damage, speeds, and any other gameplay value. The guides state that the art defines none of these; they are authored in the catalogs (§4.2), where an ability refers to an animation slot and supplies the box that the slot's `melee` window activates.

**Standard animation slots.** The engine addresses animations by slot name; each sheet maps its own rows onto them.

| Kind | Cell | Slots, in sheet row order |
|---|---|---|
| Player | 96 | `idle`, `walk` and/or `run`, `jump`, `attack1`, `attack2`, `attack3`, `hit`, `death`, `teleport_out`, `teleport_in`, `crouch`, `crawl`, `fly_up`, `fly` |
| Enemy | 96 | `idle`, `walk` and/or `run`, `hit`, `death`, `attack1`, `attack2`, `attack3` |
| Boss | 256 | `idle`, `walk` and/or `run`, `fly`, `hit`, `death`, `attack1`, `attack2`, `attack3`, `attack4` |
| Object | 96 | `idle`, `interact`, `vanish` |
| NPC | 96 | pending — at least `idle`; `walk` and `talk` if drawn |

**Walk and run.** A sheet may provide `walk`, `run`, or both.

- **Both present:** walking plays `walk`, running plays `run`.
- **Only one present** (whichever the art calls it): it is treated as the walk, and running plays the same animation faster, scaled by the ratio of run speed to walk speed.

The current hero sheet draws only a run cycle and the enemy and boss sheets only a walk cycle, so today every actor uses the single-animation rule.

### 4.4 Tileset JSON

Tiles are static. The tileset JSON names each cell and gives its default collision shape and layer, so levels refer to tiles by stable ID.

```json
{
  "schema": "dungeon-scroller/tileset@1",
  "image": "old_stone_dungeon_tileset.png",
  "cell": { "w": 96, "h": 96 }, "columns": 8, "rows": 5, "surfaceY": 0,
  "tiles": {
    "floor_left":        { "row": 1, "col": 1, "name": "Left end", "shape": "solid", "layer": "terrain" },
    "platform_center_a": { "row": 2, "col": 2, "name": "Repeatable middle A", "shape": "platform", "layer": "terrain",
                           "bounds": { "x": 0, "y": 0, "w": 96, "h": 16 } },
    "stairs_right":      { "row": 3, "col": 2, "name": "Stairs rising right", "shape": "stairs_right", "layer": "terrain" },
    "wall_left":         { "row": 4, "col": 1, "name": "Left boundary wall face", "shape": "rect", "rect": [0, 0, 24, 96], "layer": "terrain" },
    "hanging_chain":     { "row": 5, "col": 6, "name": "Hanging chain", "shape": "none", "layer": "decor" }
  },
  "groups": { "floor_center": ["floor_center_a", "floor_center_b", "floor_cracked"], "fill": ["fill_a", "fill_b"] },
  "runs": { "floor": { "left": "floor_left", "center": "floor_center", "right": "floor_right", "single": "floor_single", "below": "fill" } },
  "assemblies": { "stairs_rising_right": { "parts": [
      { "tile": "landing_left_lower", "dx": -1, "dy": 1 }, { "tile": "stairs_right", "dx": 0, "dy": 0 },
      { "tile": "landing_right_upper", "dx": 1, "dy": 0 } ] } }
}
```

- **Shapes:** `none`, `solid` (full cell), `platform` (one-way, standable from above, 16 px deck), `rect` (a sub-rectangle), `slope_right` / `slope_left` (45°), `stairs_right` / `stairs_left` (six 16 px steps). The file carries a `shapes` table describing each.
- **Layers:** `terrain`, `background`, `decor` — defaults that a level may override.
- **`bounds`** is the measured opaque area for tiles that do not fill their cell; `empty` marks an intentionally blank cell.
- **`groups`** are interchangeable variants; **`runs`** say how to cap and fill a horizontal stretch; **`assemblies`** are multi-tile constructions (stairs with landings, arches, the graveyard entrance, the two-piece tree) with offsets in tiles. The level generator builds from these, so a new tileset that supplies the same structure works without code changes.

### 4.5 Asset inventory today

| Sheet | Contents | Guide | JSON |
|---|---|---|---|
| `players/light_space_mage` | Heal, space cast, staff strike | yes | **done** |
| `players/fire_mage` | Flame burst, firebolt, dagger slash | yes | **done** |
| `players/water_mage` | Breaker wave, water bolt, spear thrust | yes | **done** |
| `players/wind_mage` | Gust burst, wind blade, bow shot | yes | **done** |
| `players/earth_mage` | Stone eruption, stone shot, shield bash | yes | **done** |
| `players/dark_swordsman` | Mind jolt, mind hex, sword slash | yes | **done** |
| `enemies/undead_enemy` | normal skeleton, skeleton knight, death knight (7 rows each) | yes | **done** |
| `enemies/undead_tier2` | undead wolf, wight, lich (7 rows each) | yes | **done** |
| `bosses/undead_boss` | undead dragon, undead Fenrir, death monarch (9 rows each, 1536×6912) | yes | **done** |
| `objects/interactive_world_objects` | 16 objects × 3 rows: chest, healing potion, space potion, coin, gem, key, gravestone, checkpoint flag, crate, barrel, urn, wall torch, lever, spell scroll, healing shrine, relic | yes | **done** |
| `tilesheets/old_stone_dungeon` | 40 tiles: floors, platforms, stairs, walls, ceilings, details | yes | **done** |
| `tilesheets/ruined_graveyard` | 40 tiles (one blank): ground, platforms, 45° slopes, entrance, ruins, props | yes | **done** |

Each JSON was generated from its guide and verified against the PNG: image size, grid, the SHA-256 printed in the guide, every row assigned exactly once, and measured bounds matching the sizes the guides quote.

All six hero sheets share one 14-row layout: idle, run, jump, three attacks (listed above), hit, death, teleport out/in, crouch, crawl, fly up, flight. In every hero sheet the first attack is a short-range spell, the second a ranged or targeted spell, and the third a physical weapon attack (the light and space mage's first is a heal).

Not yet in the repository: cards, music, sound effects, NPC sheets, parallax backgrounds, and travelling projectile/effect sprites.

**Cards.** Each card is a PNG with no lettering and a quiet reserved area that the game writes into, plus a guide and a JSON file (`dungeon-scroller/card@1`):

```json
{
  "schema": "dungeon-scroller/card@1",
  "image": "light_space_mage_card.png",
  "size": { "w": 1000, "h": 1400 },
  "subject": { "kind": "player", "sheet": "../sprites/players/light_space_mage_spritesheet.json", "entity": "light_space_mage" },
  "textArea": { "x": 450, "y": 680, "w": 500, "h": 650 },
  "guideTextArea": { "x": 450, "y": 952, "w": 490, "h": 364 },
  "textBackground": "#010921",
  "textTone": "light"
}
```

- `subject` ties the card to a sheet entity, so the selection screen can find a character's card (and the reverse) without a separate table.
- `textArea` is in card pixels and scales with the displayed card. Every card is 1000 × 1400, but **each card has its own text area**, so the layout adapts to the rectangle it is given (font size and line count are fitted to it) and never assumes a fixed position. Where the art allows, `textArea` is extended beyond the guide's rectangle over pixels measured to be just as dark and empty, keeping clear of the figure, border and corner ornaments; the guide's original is kept as `guideTextArea`. The game lays out name, statistics and abilities from the gameplay catalog inside it as an HTML overlay; `textTone` (`light` or `dark`) and `textBackground` (the measured average colour of the area) choose a readable text colour.
- Cards are listed under `assets.cards` in `dungeon.json`. Cards are 5:7 and are drawn with smooth scaling when shown smaller than native size, nearest-neighbour when larger.

All six heroes have a card with JSON. Enemy and boss cards are still to come.

**When a guide and this design disagree, this design wins.** The markdown guides are the source for facts about the art (grid, rows, measurements); rendering and gameplay choices — scaling filters, text areas, collision, timing — follow this document and the JSON files.

**Projectiles and travelling effects.** The guides state that bolts, breath streams and arena effects are not part of the character sheets. Where an ability has no projectile sprite — neither rows in its own sheet nor a dedicated effect sheet named in the catalog — the game draws it with a **particle effect** tinted to the character's magic colour. Supplying a sprite later replaces the particles without code changes.

---

## 5. Architecture

```
js/
  main.js            boot: load config, show title screen
  config.js          fetch + validate dungeon.json and catalogs, resolve relative paths
  assets/            loader, sheet slicing, animation building, audio decoding
  sim/               the simulation — no PixiJS, no DOM, no fetch
    world.js         entities, fixed-step update, events out
    physics.js       movement and tile collision
    combat.js        hit boxes, damage, status
    actor.js         state machines for players, enemies, bosses, objects
    controllers/     keyboard.js, ai.js, (future) remote.js
  level/             schema, static loader, procedural generator, (future) remote provider
  render/            PixiJS stage, camera, tile layers, sprite views, effects
  ui/                HUD, menus, card and level selection, speech bubbles
  audio/             buses, music, effects
  speech/            speech providers (bubble; later Web Speech and neural TTS)
```

**The central rule:** `sim/` knows nothing about drawing, keyboards, or the network. Each tick it receives *intents* (move left, jump, attack 2) from one controller per actor and produces a new world state plus a list of events (`hit`, `died`, `picked_up`, `said`). Rendering, audio, HUD, and speech only read state and react to events.

This is what keeps the future open at low cost:

- A keyboard, an AI routine, a remote player, and a language model are all just controllers.
- The world state is plain serialisable data, so it can be sent over a socket or replaced by a server's snapshot.
- The same simulation code can run on a server for authoritative multiplayer.

**Main loop.** `requestAnimationFrame` drives rendering at the display's refresh rate. The simulation advances in fixed 1/60 s steps from an accumulator, and the renderer interpolates between the last two states, so motion is smooth on 120 Hz and 144 Hz displays and identical on every machine.

**Start-up sequence.**

1. Fetch `dungeon.json`; if it is missing, fetch `example.dungeon.json`. Then fetch all catalogs in parallel.
2. Show the title screen immediately; a click or key press there also unlocks audio.
3. Fetch every sheet and tileset JSON listed in `assets`, then their PNGs, with a progress bar.
4. For each sheet: decode, slice (§5.1), and build one animation set per player, NPC, enemy, boss, and object.
5. Go to character selection.

### 5.1 Sheet slicing

The boss sheet is 6912 px tall, taller than the 4096 px texture limit of some graphics hardware. The loader therefore never uploads a multi-entity sheet whole. For each entity it cuts that entity's block of rows out of the decoded image with `createImageBitmap(image, x, y, w, h)` and uploads the block as its own texture (a boss becomes 1536×2304). Frames are then rectangles within that texture. Sheets are not edited on disk, and the sheet JSON keeps describing the PNG exactly as delivered.

---

## 6. Display, camera, and zoom

- **Units.** One world unit is one source-art pixel. A tile is 96 units; a hero stands about 40 units tall.
- **Canvas.** Fills the whole browser window. Its backing store is sized in physical pixels (`CSS size × devicePixelRatio`), so it is sharp on HiDPI screens and stays sharp when the browser's own zoom changes.
- **Scale.** `scale = canvas width in physical pixels ÷ visible world width`. The default view is about 8 tiles wide, which shows a hero at roughly an eighth of the window height.
- **Pixel-perfect mode (default).** The scale is rounded to a whole number so every art pixel becomes an identical block of screen pixels. The canvas still fills the width; the number of visible tiles adjusts slightly instead. With this off, any fractional scale is allowed.
- **Sampling.** Nearest-neighbour everywhere; no smoothing, no mipmaps. The camera position is snapped to whole physical pixels to avoid shimmer.
- **Zoom.** `+` / `−` and the mouse wheel step the view between `minViewTiles` and `maxViewTiles`. In pixel-perfect mode each step is one whole device pixel per art pixel; otherwise one tile of view width. Zoom is remembered in `localStorage`. Zooming changes how much of the level is visible; it never changes game rules.
- **Camera.** Follows the hero with a small dead zone and look-ahead in the facing direction, eases vertically only when the hero lands or leaves the dead zone, and clamps to the level bounds. Boss arenas lock the camera to the arena.
- **Layers, back to front:** parallax backgrounds, background tiles, rear details, terrain, objects, actors, effects and projectiles, foreground tiles, then the HTML layer (speech bubbles, HUD, menus).

---

## 7. Movement and physics

All values below are starting points held in JSON (`dungeon.json` for world values, the catalogs for per-character values) and are expected to be tuned by play-testing.

**Controls.** These are the defaults shipped in `example.dungeon.json`; a site can change them in `dungeon.json` and each player can rebind them in the settings screen (§4.1).

| Action | Key | Notes |
|---|---|---|
| Move | ← → | Walk |
| Run | hold Shift | Uses the `run` animation if the sheet has both; otherwise the one cycle, faster (§4.3) |
| Jump | Space | Hold longer for a higher jump |
| Crouch / crawl | ↓ / ↓ + ← → | Lower body box: ducks under projectiles and high swings, and fits through low passages |
| Drop through platform | ↓ + Space | One-way platforms only |
| Attacks 1, 2, 3 | Z, X, C | Character-specific abilities |
| Teleport | V | Short blink in the facing direction, costs MP |
| Fly | F | Toggle; ← → ↑ ↓ steer. Only if the character's `flight.mode` allows |
| Interact | E | Chests, levers, shrines, NPCs |
| Zoom | + / − / wheel | |
| Pause, mute | Esc, M | |

**Movement model.**

- Horizontal: acceleration toward a target speed and friction when no key is held, with reduced control in the air.
- Jump: launch velocity derived from the character's `jumpHeight`; releasing the key early cuts the rise for short hops.
- Forgiveness: about 0.1 s of "coyote time" after walking off a ledge and 0.1 s of jump buffering before landing.
- Gravity with a terminal fall speed; no fall damage in version 1.
- Hit reaction: brief knock-back and about 0.8 s of invulnerability with a flicker.

**Flight**, per character:

| `flight.mode` | Behaviour |
|---|---|
| `none` | Fly key does nothing. |
| `mp` | Drains `mpPerSecond` while airborne; flight ends and the hero falls when MP runs out. |
| `free` | Unrestricted. |

Entering flight plays `fly_up` once, then holds its last frame while hovering or rising and switches to the `fly` loop when moving horizontally. Gravity is off while flying.

**Collision.** Actors are axis-aligned boxes; terrain is the tile shapes of §4.4. Each tick moves on x then y and resolves against nearby tiles only.

- Stairs: steps of 16 px or less are climbed automatically, so stairs walk like a ramp.
- Slopes: the feet follow the surface line, with a downward snap so the hero does not hop when descending.
- One-way platforms: solid only when landing from above.
- Fast projectiles are swept so they cannot pass through thin walls.

**Crouching** has two uses. In combat the lower `crouchBody` box lets projectiles and high swings pass overhead. In levels it opens **low passages**: a standing hero is about 52 px tall and fits any one-tile gap, so a passage that forces a crawl must leave less than that. Crouched heroes are 29–37 px tall, so a low-passage tile should leave a **40 px gap** (solid from the top of the cell down to 56 px). Such a tile needs no new collision shape — it is a `rect` of `[0, 0, 96, 56]` — but the current tilesets do not contain one yet. A hero cannot stand up while under a low ceiling.

**Attacking in the air.** Ranged abilities (`air: true`) can be used while jumping or flying; melee and ground effects only on the ground.

**Scale reference** for level design and the generator: the hero is about half a tile tall; a jump clears 1.5 tiles vertically, and about 1.1 tiles horizontally at walking speed or 2 when running.

---

## 8. Combat and gameplay

**Resources.** HP and MP per character. MP regenerates slowly; HP does not. Both are restored by potions and healing shrines.

**Attacks.** Each hero has three ability slots whose behaviour is declared in the player catalog: `melee` (a hit box during chosen frames), `projectile` (spawned at a chosen frame), `heal`, or `area`. The moment of effect comes from the animation's `events`, so a swing damages when the art shows it landing. Projectiles without sprite art are drawn as particle effects (§4.5).

**Touching enemies.** A hero whose body overlaps an enemy's body takes that enemy's `touchDamage` — about half its light attack — and is pushed back; the short invulnerability after any hit stops it repeating. A boss's touch damage doubles while it is charging, leaping or diving. `rules.touchDamage` turns this off for a site.

**Damage.** Attack boxes overlap body boxes. A hit applies damage, knock-back, the `hit` animation, a short hit-stop for impact, and a floating damage number.

**Objects** (all present in the object sheet):

| Object | Behaviour |
|---|---|
| Gold coin, gem | Score pickup |
| Healing potion / space potion | Restore HP / MP |
| Spell scroll | Doubles damage for 15 seconds |
| Iron key | Opens one locked chest or grate |
| Treasure chest | Interact to open; releases loot |
| Lever | Toggles a linked grate, platform, or door |
| Crate, barrel, burial urn | Breakable; may drop loot |
| Gravestone | Decoration, or an enemy spawn point |
| Wall torch | Light source |
| Checkpoint flag | Save point: sets the respawn position and refills HP |
| Healing shrine | Refills HP and MP, with a cool-down |
| Dungeon relic | Level goal; appears after the boss falls |

**Lives and failure.** On death the hero respawns at the last checkpoint flag (or the level start) and loses one life. The lives count comes from `rules.lives` and defaults to **9999**, which is effectively unlimited. At zero lives the level ends in a game-over screen. Levels may override the count.

**Level loop.** Enter → explore, fight, collect, use keys and levers → reach the boss arena → defeat the boss → take the relic → results screen (time, score, deaths).

**HUD.** Hero portrait, HP and MP bars with numbers, lives, score, keys held, ability icons with MP cost and cool-down, and a boss health bar during boss fights.

---

## 9. Enemy and boss behaviour

Enemies act on their surroundings through an `AIController` that reads the world and emits the same intents a keyboard would.

**Sensors, sampled each tick:** floor ahead (ledge check), wall ahead, distance and direction to the nearest hero, clear line of sight, own HP fraction, whether a hero is inside an attack's reach.

**States:** `idle` → `patrol` → `alert` → `chase` → `attack` → `recover`, plus `hurt`, `retreat`, and `dead`. Transitions and numbers come from an archetype named in the enemy catalog:

| Archetype | Behaviour | Used by |
|---|---|---|
| `walker` | Patrols a platform, turns at ledges and walls, chases on sight, melee in reach | Normal skeleton |
| `guard` | Holds a post, advances slowly, favours heavy attacks, does not leave its platform | Skeleton knight, death knight, wight |
| `pouncer` | Fast approach, leaps at range, backs off after attacking | Undead wolf |
| `caster` | Hovers, keeps distance, fires projectiles, repositions when approached | Lich |

Each enemy entry sets sight range, speeds, attack choice weights, cool-downs, and whether it may leave its platform or drop off ledges.

**Bosses** use a scripted phase machine. Phases switch at HP thresholds; each phase has a weighted list of attack patterns with visible wind-ups (the `durations` of the wind-up frames), and `fly` is used for repositioning. Boss fights take place in a closed arena with a locked camera.

---

## 10. Levels

### 10.1 One schema, several sources

Every level, whatever its origin, is the same JSON document. The game asks a `LevelProvider` for a level and does not care where it came from.

| Provider | Version | Source |
|---|---|---|
| `procedural` | 1, built first | Seeded generator in the browser |
| `static` | 1 | A file in `levels/` |
| `remote` | future | Backend or local AI, via `dungeon.json` → `api` |

```json
{
  "schema": "dungeon-scroller/level@1",
  "id": "crypt-01",
  "name": "The Lower Crypt",
  "tileset": "old_stone_dungeon",
  "size": { "cols": 120, "rows": 14 },
  "palette": ["", "floor_center_a", "fill_a", "platform_center", "stairs_right"],
  "layers": {
    "background": [[0, 0, 0], [0, 0, 0]],
    "terrain":    [[0, 0, 3], [1, 1, 1]],
    "foreground": [[0, 0, 0], [0, 0, 0]]
  },
  "spawn": { "col": 2, "row": 11 },
  "entities": [
    { "type": "enemy",  "id": "normal_skeleton", "col": 14, "row": 11, "lines": { "alert": ["…bones…"] } },
    { "type": "object", "id": "checkpoint_flag", "col": 40, "row": 11 },
    { "type": "object", "id": "lever", "col": 52, "row": 8, "link": "grate-1" },
    { "type": "boss",   "id": "death_monarch", "col": 110, "row": 11 }
  ],
  "regions": [ { "type": "boss_arena", "col": 100, "row": 2, "cols": 20, "rows": 12 } ],
  "music": "crypt_theme",
  "rules": { "lives": 9999 }
}
```

Layer cells are indexes into `palette` (0 is empty), which keeps files small and readable. Collision comes from each tile's `shape` in the tileset JSON; a level can add an explicit `collision` layer to override it.

**Level editing tools.** Version 1 uses only this JSON format, written by the generator or by hand. A documented later enhancement is an importer for maps drawn in *Tiled*, a free visual map editor, so levels could be painted with a mouse instead of typed as numbers. Nothing in the format prevents this.

### 10.2 Procedural generator

- **Seeded and repeatable.** A small seeded random-number generator drives every choice, so the same seed and settings always give the same level. The seed is shown on screen and accepted from the URL (`?seed=…`), so levels can be shared.
- **Built from sections.** A level is a chain of sections drawn from templates: flat run, gap, stair or slope climb, stacked platforms, low crawl passage, lever-and-grate lock, treasure side-room, checkpoint rest, boss arena.
- **Always completable.** Sections join only where the exit of one is reachable from the entrance of the next using the jump and crawl limits of §7. The whole level is then verified by a reachability walk from spawn to boss before it is accepted. Flight is never required.
- **Difficulty budget.** Each section spends points on enemies and hazards; the budget rises along the level and with the chosen difficulty. Checkpoint flags are placed at regular intervals and before the boss.
- **Theme.** A preset chooses the tileset, enemy pool, boss, music, and decoration density. The generator uses each tileset's `groups` to vary the look without changing the shape.
- **Output** is an ordinary level document, so a generated level can be saved to `levels/` as a static file. The first static test levels will be produced this way.

---

## 11. Game flow and screens

1. **Title** — title art, "press any key" (also unlocks audio), settings.
2. **Character selection** — a row of cards from `assets/cards`, with name, blurb, HP, MP, flight type, and the three abilities, read from the player catalog. The selected hero's idle animation plays alongside.
3. **Level selection** — static levels from `data/levels.json`, plus "Random dungeon" with theme, difficulty, length, and an optional seed. (Later: "Join game" and missions.)
4. **Play** — canvas with HUD.
5. **Pause** — resume, restart from checkpoint, settings (volumes, key rebinding, zoom, pixel-perfect), quit to menu. Settings are also reachable from the title screen.
6. **Results / game over** — statistics; next level, retry, or menu.

Settings, key bindings, last hero, and best results are saved in `localStorage`.

---

## 12. Audio

- **Buses.** Music, effects, and voice, each with its own gain, feeding a master gain. Volumes come from `dungeon.json` and user settings.
- **Music.** One looping track per level with cross-fades between menu, level, and boss tracks. Streamed through a media element so long tracks do not need to be fully decoded in memory.
- **Effects.** Decoded once into buffers at load. Triggered by simulation events and by animation `events` of type `sound`. Slight random pitch variation prevents repetition fatigue; positional panning follows the source's place on screen.
- **Quality and formats.** Source material at 48 kHz stereo. Music as high-bitrate Ogg Opus with an AAC (`.m4a`) alternative listed for browsers that need it; short effects as lossless FLAC or WAV. `data/audio.json` lists alternatives per sound and the loader picks the first the browser can play.
- **Autoplay.** Browsers block audio until the user interacts; the title screen's first key press starts the audio context.

---

## 13. Dialogue and speech

- **Lines are data.** Catalog entries and level entities carry `lines` keyed by trigger: `spawn`, `alert`, `attack`, `hurt`, `lowHp`, `death`, `interact`, `idle`. NPC entries can hold short scripted exchanges.
- **Speech bubbles.** An HTML element anchored to the speaker's head position each frame, with a tail pointing at them. Text is typed out, held for a time proportional to its length, then faded. Bubbles stay sharp at every zoom, avoid overlapping each other, and are clamped inside the window. Speakers off screen do not show bubbles.
- **Speech provider interface.** `speak(actor, text, options)` and `stop(actor)`. Version 1 ships the `bubble` provider only. Later providers, used alongside the bubble:
  - `webspeech` — the browser's built-in speech synthesis; no download, quality varies by system.
  - `neural` — a high-quality voice model running in the browser (WebGPU or WebAssembly), with a voice assigned per character and generated audio cached in IndexedDB.
- The same event path will carry lines produced by a server or AI (§15).

---

## 14. Quality, accessibility, and performance

- Only tiles and actors near the camera are drawn and simulated in detail; distant enemies sleep.
- Sprites sharing a texture are batched; tile layers are drawn in chunks.
- Target: steady 60 simulation ticks per second and display-rate rendering on integrated graphics.
- Key bindings are remappable; text sizes follow browser settings; screen shake and flashes can be reduced; nothing is conveyed by colour alone.
- A debug overlay (toggle key) shows collision boxes, hit boxes, AI state, frame time, and the level seed.

---

## 15. Future enhancement: optional backend, multiplayer, and AI

Version 1 never contacts a server. The design below is documented so that nothing built now has to be undone.

**Configuration.** `dungeon.json` → `api` changes from `null` to something like:

```json
{
  "base": "https://example.org/dungeon/api/",
  "levels": "levels",
  "missions": "missions",
  "socket": "wss://example.org/dungeon/ws",
  "speech": "tts"
}
```

Every feature degrades to the offline behaviour when its entry is absent.

| Capability | How it attaches |
|---|---|
| Levels and missions from a server | A `remote` `LevelProvider` fetches the same level schema (§10.1). A mission wraps a level with objectives, briefing text, and rewards. |
| Multiplayer | A `RemoteController` feeds other players' intents or positions into the simulation over a WebSocket. Later, the server runs the same `sim/` code and is authoritative; clients predict locally and reconcile. |
| Player communication | Chat messages travel on the same socket and appear as speech bubbles over the sender, with an optional chat log. |
| AI director | A local or hosted model generates levels and missions in the level schema, and may place or adjust entities during play. |
| AI-played NPCs and enemies | The model acts through the controller interface: it receives a compact view of nearby state and returns intents and lines to speak. |

**World snapshot.** The state exchanged with a server is the simulation's own entity list:

```json
{ "tick": 18230, "entities": [
  { "id": "e17", "kind": "enemy", "type": "lich", "x": 4310, "y": 912, "vx": -40, "vy": 0,
    "facing": "left", "state": "attack2", "hp": 34, "hpMax": 60 }
] }
```

**Security notes for that phase:** HTTPS and `wss://` only; the server's address comes only from `dungeon.json`; all text from other players or an AI is inserted as text, never as HTML; level documents from a server are validated against the schema before use.

---

## 16. Build plan

Each phase ends with something that can be opened in a browser and checked.

| Phase | Deliverable |
|---|---|
| **0. Asset JSON** | **Done:** JSON for every sprite sheet, tileset and hero card, `example.dungeon.json`, and the gameplay catalogs in `data/` with drafted boxes. Boxes and values are refined through the viewer and play-testing. |
| **1. Skeleton, viewer and shell** | **Done:** `viewer.html`; configuration loading with the `example.dungeon.json` fallback; vendored PixiJS; the asset loader; and the game shell in `index.html` (§16.2). |
| **2. Simulation core** | **Done:** fixed-step world, tile collision for every shape, the hero controller, the level format with loader and builder, two test courses, the debug overlay and in-browser tests (§16.3). |
| **3. Procedural levels** | Seeded generator with section templates and reachability check; level schema loader; three or four generated levels saved as static test files. |
| **4. Combat and enemies** | Abilities, projectiles, damage, enemy archetypes, HP/MP, HUD. |
| **5. Objects and rules** | Pickups, chests, keys, levers, breakables, checkpoint flags, shrines, lives, respawn. |
| **6. Bosses** | Phase machine, arenas, boss health bar, relic and results screen. |
| **7. Front end** | Title, character cards, level selection, pause and settings including key rebinding, saved preferences. |
| **8. Audio and dialogue** | Music, effects, speech bubbles, character lines. |
| **9. Polish** | Parallax backgrounds, lighting from torches, particles, performance pass, accessibility options. |
| **Later** | NPC behaviour, gamepad and touch, text-to-speech, offline support, Tiled import, backend and multiplayer (§15). |

---

### 16.1 The asset viewer

`viewer.html` loads the site configuration and every asset it lists through the same loader the game will use, so what it shows is what the game will draw.

- **Characters, enemies, bosses, objects:** one animation at a time with a frame-by-frame timeline (durations, event frames, blank frames), or every animation at once. Play, pause, step, slow motion, mirror to the other facing, integer zoom. Overlays show the cell, the pivot and ground line, and the measured idle bounds.
- **Tilesets:** the sheet with each tile's collision shape drawn over it and details on hover, plus example constructions built from the tileset's `runs` and `assemblies`.
- **Cards:** the card with its text area outlined and sample text laid out inside it.
- **Gameplay values and boxes:** the details panel lists each entity's catalog values. The collision box (green), hit box (red, filled while its frames are active) and use box (blue) are drawn over the sprite. Choose a box in the *Adjust* list to move it with the arrows and resize it with W−/W+/H−/H+ (Shift + arrows, Shift + Alt + arrows). Changes join the unsaved adjustments.
- **Checks:** image size, grid, checksum, row usage, required animation slots, event frames, tile references, card subjects, and catalog entries (sheet entity exists, every ability has an animation, melee and area attacks have a box and a triggering frame). The header shows the number of problems found.

- **Frame alignment:** in the single view, the nudge buttons (or Shift + arrow keys) move the frame on screen one pixel at a time; the optional "idle ghost" draws a faint copy of the first idle frame as a fixed reference. Adjustments are kept in the browser and listed in the details panel as JSON, ready to copy; they become permanent when written into the sheet JSON as `offsets` (§4.3). The viewer cannot write files itself.

Keys: Space play/pause, ←/→ step a frame, Shift + arrows nudge a frame, F mirror, A single/all, +/− zoom. Each view has its own address (for example `viewer.html#boss/undead_dragon/attack3`), so a specific animation can be linked.

### 16.2 The game shell

`index.html` is the game's single page. The canvas fills the window and every screen is HTML laid over it.

| Screen | What it does |
|---|---|
| Title | Play, Settings, and a link to the asset viewer. Notes when `example.dungeon.json` is in use and when the loader found asset problems. |
| Hero selection | Every hero that has gameplay values, shown as its card with name, role, statistics and abilities written into the card's text area from the catalog. The chosen hero's idle animation plays in the header; the choice is remembered. |
| Level selection | Lists the static levels from the level index. "Random dungeon" is shown but disabled until the generator exists. |
| Settings | Zoom, pixel-perfect scaling, and key rebinding: choose *Change*, press a key; shared keys are flagged; any action or all of them can be reset to the site defaults. Stored in the browser. |
| Play | The canvas with the HUD: hero name, HP and MP bars with numbers, lives, score, and each ability with its key and MP cost (dimmed when unaffordable). |
| Pause | Resume, Settings, Change level, Change hero, Quit to title. Escape goes back on every screen. |

Modules: `js/main.js` (boot and screens), `js/settings.js`, `js/input.js` (keys to actions through the bindings), `js/render/stage.js` (canvas, camera, whole-pixel zoom, rooms, actor sprites), `js/ui/` (cards, HUD, DOM helpers).

**The play screen runs the simulation** (§16.3). Each frame it gives the elapsed time to the world, which advances in fixed steps, then draws the hero between the last two simulated positions so motion is smooth at any refresh rate. Key presses are held until a simulation step has used them, so none are lost or counted twice.

### 16.3 The simulation core

Everything under `js/sim/` and `js/level/` is plain data and arithmetic: no rendering, no DOM, no network. It can be run in a test, on a server, or headless.

| Module | Role |
|---|---|
| `js/level/level.js` | A level document turned into a collision grid: solid rectangles (blocks, walls, ceilings, each stair step), one-way platforms and 45° slopes. Validates level documents. |
| `js/level/build.js` | Builds a level document from a character map, choosing the right art for each cell from any tileset (caps, fills, variants, stairs or slopes, ceilings, backdrop). The level generator will use it too. |
| `js/sim/physics.js` | Moves a box against the level. |
| `js/sim/hero.js` | The hero's rules: walking, running, jumping, crouching, dropping through platforms, flight, teleport, abilities, MP, and which animation frame to show. |
| `js/sim/world.js` | Owns the level and the actors; advances in fixed 1/60 s steps; respawns a hero that falls out of the level. |
| `js/sim/controllers/keyboard.js` | Turns key state into intents. AI and network controllers will produce the same intents. |

**Collision rules as built**

- A body is a box described by the point between its feet. It moves horizontally, then vertically.
- **Steps:** a grounded body walks up any ledge of 16 px or less (one stair step) and is kept on the ground when walking down steps or slopes, so stairs and ramps need no jumping and do not launch the hero. The picture eases over each 16 px step so stairs look smooth.
- **Slopes:** the feet follow the slope's surface at the body's centre line.
- **One-way platforms** hold a body that arrives from above and ignore one moving up through them; crouch + jump drops through.
- **Ceilings** stop upward movement; a crouched hero cannot stand up without headroom.
- **Level edges:** the left and right sides are walls, the top is open, and falling out of the bottom costs a life and returns the hero to the last checkpoint (the level start for now).
- **Feel:** jumps can be made up to 0.1 s after leaving a ledge, a jump pressed up to 0.1 s before landing still happens, and releasing jump early gives a shorter hop.

**Levels.** `dungeon.json` → `levels` names an index file (`data/levels.json`) listing the static levels to offer. Two test courses exist, `levels/dungeon-test.json` and `levels/graveyard-test.json`, covering stairs, slopes, stacked platforms, pits and ceilings. They contain no enemies or objects yet.

**Debug overlay.** The debug key (`` ` `` by default) outlines every collision shape and the hero's body box, and shows position, velocity, ground type, animation frame and tick.

**Tests.** `tests.html` runs the simulation tests in the browser: landing, walls, stairs up and down, slopes, platforms, ceilings, low passages, level edges, jump height, short hops, late jumps, crouching under a ceiling, ability rules, teleport, flight and pits. They build their own small levels and need no assets.

Not in the simulation yet: enemies, objects, damage, projectiles and checkpoints (phases 4 and 5).

## 17. Open items

1. **Box review**: the drafted collision and hit boxes need checking in the viewer. **Low-passage tiles** need drawing (a 40 px gap). NPC, audio and level catalogs do not exist yet.
2. **Cards**: the first card PNGs, and the rectangle of the common information area.
3. **NPC sheet layout** and what NPCs do in version 1.
4. **Parallax backgrounds** per theme.
5. **Music and sound effects**: file formats as delivered, and a naming convention for `data/audio.json`.
6. **`LICENSE` file** (MIT) and a short `README.md`.
7. **Spell scroll effect** and scoring rules.
