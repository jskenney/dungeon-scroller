# Interactive World Objects — Sprite Sheet Guide

## 1. Asset and contents

This guide describes the final **`interactive_world_objects_spritesheet.png`** for the stone dungeon and ruined graveyard. It contains sixteen original objects made from weathered wood, tarnished iron, slate-gray stone, worn cloth, glass and parchment. Warm gold marks treasure and holy effects; violet and cyan mark space magic; pale blue-green marks undead magic. Objects use the same fine pixel treatment and side-scrolling view as the character and terrain sheets.

| Property | Value |
|---|---|
| Image filename | `interactive_world_objects_spritesheet.png` |
| Canvas | 576 × 4608 pixels |
| Grid | 6 columns × 48 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Object count | 16; three consecutive rows per object |
| Animation count | 48: 16 idle loops, 16 interactions, 16 disappearances |
| Frame slots | 288: 272 visible frames and 16 intentionally transparent endings |
| Format | RGBA PNG; alpha values are 0 or 255; transparent pixels have zero RGB |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding inside a visible cell | 9 pixels |
| Nominal grounded contact | Cell-local visible pixel y = 84 |
| Suggested grounded logical pivot | (48, 85), measured from the top-left cell boundary |
| Verified SHA-256 | `c55377d1df35e27523530e53a4af9115fd42a7d9dc1f168c4264108b35757e47` |

The **96 × 96 cell is the extraction rectangle**, not the visible object size. Keep its transparent padding when importing. The coin deliberately occupies much less of its cell than the chest or headstone. Scale the sheet uniformly in the renderer; do not enlarge each object independently to fill its frame.

The PNG stores pixels only. The clip names, timings, collision suggestions, state rules and gameplay hooks below are implementation recommendations. They are not embedded animation, inventory or physics metadata. Measurements and pixel-copy relationships refer to the final PNG identified above.

### Object inventory and measured gameplay scale

Sizes below are the inclusive opaque bounds of **idle F1** and **interaction F6**, measured independently inside their complete cells. The interaction size includes any glint, ring or fragment; it is not a physical collider. Idle shimmer and later poses can change those bounds slightly.

| Object ID | Object | Rows | Idle F1 size | Interaction F6 size | Registration |
|---|---|---|---|---|---|
| `treasure_chest` | Treasure chest | 01–03 | 42 × 28 px | 43 × 45 px | Grounded base |
| `healing_potion` | Healing potion | 04–06 | 15 × 20 px | 33 × 24 px | Floating pickup |
| `space_potion` | Space potion | 07–09 | 9 × 24 px | 31 × 27 px | Floating pickup |
| `gold_coin` | Gold coin | 10–12 | 9 × 10 px | 12 × 11 px | Floating pickup |
| `gem` | Gem | 13–15 | 14 × 20 px | 14 × 22 px | Floating pickup |
| `iron_key` | Iron key | 16–18 | 24 × 10 px | 24 × 12 px | Floating pickup |
| `gravestone` | Gravestone | 19–21 | 44 × 54 px | 58 × 41 px | Grounded base |
| `checkpoint_flag` | Checkpoint flag | 22–24 | 19 × 62 px | 45 × 62 px | Grounded pole foot |
| `wooden_crate` | Wooden crate | 25–27 | 32 × 34 px | 47 × 38 px | Grounded base |
| `barrel` | Barrel | 28–30 | 30 × 36 px | 41 × 19 px | Grounded base |
| `burial_urn` | Burial urn | 31–33 | 25 × 34 px | 36 × 19 px | Grounded base |
| `wall_torch` | Wall torch | 34–36 | 18 × 37 px | 19 × 50 px | Wall bracket |
| `lever` | Lever | 37–39 | 22 × 30 px | 32 × 12 px | Grounded base |
| `spell_scroll` | Spell scroll | 40–42 | 22 × 15 px | 34 × 26 px | Floating parchment |
| `healing_shrine` | Healing shrine | 43–45 | 40 × 42 px | 55 × 43 px | Grounded base |
| `dungeon_relic` | Dungeon relic | 46–48 | 16 × 26 px | 16 × 26 px | Floating relic |

A 9 × 10-pixel coin is therefore correct at native resolution. It should not be cropped, rescaled to 96 × 96 and reinserted. The same distinction applies to the key, gem and bottles. The larger props retain their own authored dimensions through opening or breaking.

## 2. Coordinates and frame locations

Human-readable **rows, columns and F1–F6 labels start at 1**. Pixel coordinates, object indices and flattened frame indices start at **0**. The origin is the image's top-left; x increases right and y increases downward. Rectangles use **`(x, y, width, height)`** with right and bottom edges excluded.

```text
x = (column - 1) * 96
y = (row - 1) * 96
rectangle = (x, y, 96, 96)
frameIndex = (row - 1) * 6 + (column - 1)

For zero-based object index i from 0 through 15:
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

For example, the chest's fully open result is **R2 C6**, rectangle **`(480, 96, 96, 96)`**, flat index **11**. Its disappearance begins with the same pixels at **R3 C1**, rectangle **`(0, 192, 96, 96)`**, index **12**. The final relic ending is **R48 C6**, rectangle **`(480, 4512, 96, 96)`**, index **287**, and is fully transparent.

### Complete row catalog

Every sequence reads **columns 1 → 2 → 3 → 4 → 5 → 6**. Only idle wraps back to F1. “Hold result” means keep sampling F6 until the controller explicitly starts disappearance or makes another world-state decision.

| Row | Animation ID | Sequence | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `treasure_chest_idle` | Idle | 0 | 0–5 | Loop |
| 02 | `treasure_chest_interaction` | Opening | 96 | 6–11 | Once; hold result F6 |
| 03 | `treasure_chest_disappearance` | Disappearance | 192 | 12–17 | Once; hold blank F6 / remove |
| 04 | `healing_potion_idle` | Idle | 288 | 18–23 | Loop |
| 05 | `healing_potion_interaction` | Selecting | 384 | 24–29 | Once; hold result F6 |
| 06 | `healing_potion_disappearance` | Disappearance | 480 | 30–35 | Once; hold blank F6 / remove |
| 07 | `space_potion_idle` | Idle | 576 | 36–41 | Loop |
| 08 | `space_potion_interaction` | Selecting | 672 | 42–47 | Once; hold result F6 |
| 09 | `space_potion_disappearance` | Disappearance | 768 | 48–53 | Once; hold blank F6 / remove |
| 10 | `gold_coin_idle` | Idle | 864 | 54–59 | Loop |
| 11 | `gold_coin_interaction` | Selecting | 960 | 60–65 | Once; hold result F6 |
| 12 | `gold_coin_disappearance` | Disappearance | 1056 | 66–71 | Once; hold blank F6 / remove |
| 13 | `gem_idle` | Idle | 1152 | 72–77 | Loop |
| 14 | `gem_interaction` | Selecting | 1248 | 78–83 | Once; hold result F6 |
| 15 | `gem_disappearance` | Disappearance | 1344 | 84–89 | Once; hold blank F6 / remove |
| 16 | `iron_key_idle` | Idle | 1440 | 90–95 | Loop |
| 17 | `iron_key_interaction` | Selecting | 1536 | 96–101 | Once; hold result F6 |
| 18 | `iron_key_disappearance` | Disappearance | 1632 | 102–107 | Once; hold blank F6 / remove |
| 19 | `gravestone_idle` | Idle | 1728 | 108–113 | Loop |
| 20 | `gravestone_interaction` | Activating | 1824 | 114–119 | Once; hold result F6 |
| 21 | `gravestone_disappearance` | Disappearance | 1920 | 120–125 | Once; hold blank F6 / remove |
| 22 | `checkpoint_flag_idle` | Idle | 2016 | 126–131 | Loop |
| 23 | `checkpoint_flag_interaction` | Activating | 2112 | 132–137 | Once; hold result F6 |
| 24 | `checkpoint_flag_disappearance` | Disappearance | 2208 | 138–143 | Once; hold blank F6 / remove |
| 25 | `wooden_crate_idle` | Idle | 2304 | 144–149 | Loop |
| 26 | `wooden_crate_interaction` | Opening | 2400 | 150–155 | Once; hold result F6 |
| 27 | `wooden_crate_disappearance` | Disappearance | 2496 | 156–161 | Once; hold blank F6 / remove |
| 28 | `barrel_idle` | Idle | 2592 | 162–167 | Loop |
| 29 | `barrel_interaction` | Opening | 2688 | 168–173 | Once; hold result F6 |
| 30 | `barrel_disappearance` | Disappearance | 2784 | 174–179 | Once; hold blank F6 / remove |
| 31 | `burial_urn_idle` | Idle | 2880 | 180–185 | Loop |
| 32 | `burial_urn_interaction` | Opening | 2976 | 186–191 | Once; hold result F6 |
| 33 | `burial_urn_disappearance` | Disappearance | 3072 | 192–197 | Once; hold blank F6 / remove |
| 34 | `wall_torch_idle` | Idle | 3168 | 198–203 | Loop |
| 35 | `wall_torch_interaction` | Activating | 3264 | 204–209 | Once; hold result F6 |
| 36 | `wall_torch_disappearance` | Disappearance | 3360 | 210–215 | Once; hold blank F6 / remove |
| 37 | `lever_idle` | Idle | 3456 | 216–221 | Loop |
| 38 | `lever_interaction` | Activating | 3552 | 222–227 | Once; hold result F6 |
| 39 | `lever_disappearance` | Disappearance | 3648 | 228–233 | Once; hold blank F6 / remove |
| 40 | `spell_scroll_idle` | Idle | 3744 | 234–239 | Loop |
| 41 | `spell_scroll_interaction` | Opening | 3840 | 240–245 | Once; hold result F6 |
| 42 | `spell_scroll_disappearance` | Disappearance | 3936 | 246–251 | Once; hold blank F6 / remove |
| 43 | `healing_shrine_idle` | Idle | 4032 | 252–257 | Loop |
| 44 | `healing_shrine_interaction` | Activating | 4128 | 258–263 | Once; hold result F6 |
| 45 | `healing_shrine_disappearance` | Disappearance | 4224 | 264–269 | Once; hold blank F6 / remove |
| 46 | `dungeon_relic_idle` | Idle | 4320 | 270–275 | Loop |
| 47 | `dungeon_relic_interaction` | Selecting | 4416 | 276–281 | Once; hold result F6 |
| 48 | `dungeon_relic_disappearance` | Disappearance | 4512 | 282–287 | Once; hold blank F6 / remove |

## 3. Six-frame sequences and suggested timings

The pose tables describe the visible progression at gameplay scale. Tiny bubble, rune and highlight changes are intentionally restrained. All durations are **suggested milliseconds for F1–F6**, with their arithmetic total shown; tune them to the game. A static idle still has six slots. An interaction or disappearance plays once even when its first pose duplicates the preceding state.

### 01. Treasure chest — rows 01–03

A closed oak chest with dark iron bands and a small latch. The opening exposes warm gold light inside the same box; the lid stays open as the chest dissolves.

**Row 01: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Closed chest | Latch highlight grows | Brief latch glint | Glint softens | Closed hold | Closed hold into loop |

**Suggested durations:** `[220, 180, 140, 160, 220, 240]` ms; **total:** 1160 ms.

**Row 02: Opening — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Lid starts lifting | Lid partly raised | Lid nearly open; gold interior | Fully open | Open lid and warm light held |

**Suggested durations:** `[80, 110, 140, 140, 120, 180]` ms; **total:** 770 ms.

**Row 03: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact open result | Interior light begins dimming | Edges dissolve into amber pixels | Partial open chest and fragments | Scattered amber motes | Fully transparent |

**Suggested durations:** `[100, 140, 150, 150, 140, 80]` ms; **total:** 760 ms.

The chest body keeps its planted origin while the lid rises. Keep the open F6 visible while a loot panel is open; disappearance is a separate choice after looting or removal. The glow is part of the art and does not create inventory contents.

### 02. Healing potion — rows 04–06

A round glass flask with a small cork and warm gold liquid. Its short, broad bulb distinguishes it from the narrow violet space potion.

**Row 04: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Gold liquid at rest | Bubble highlight rises | Bubble/light advances | Small liquid shimmer | Highlight settles | Return toward idle highlight |

**Suggested durations:** `[160, 140, 140, 140, 160, 180]` ms; **total:** 920 ms.

**Row 05: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Begin lifting | Lift with small gold ring | Ring expands | Raised flask and bright ring | Flask visible inside expanded ring |

**Suggested durations:** `[70, 70, 90, 100, 100, 140]` ms; **total:** 570 ms.

**Row 06: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Flask contracts; ring weakens | Small flask remains | Warm point and ring fragments | A few gold pixels | Fully transparent |

**Suggested durations:** `[80, 100, 100, 100, 100, 80]` ms; **total:** 560 ms.

The selection lift is already drawn, reaching about eight pixels above the idle center. Shrinking and ring fading continue at that raised position. A pickup trigger should be larger than the tiny flask art, with its dimensions defined by the game.

### 03. Space potion — rows 07–09

A tall, narrow flask filled with violet liquid and a cyan swirl. The interaction draws a compact violet/cyan ring around the raised bottle.

**Row 07: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Violet flask and cyan swirl | Swirl shifts | Swirl travels through liquid | Cyan highlight turns | Swirl continues | Return toward first pattern |

**Suggested durations:** `[140, 140, 140, 140, 140, 140]` ms; **total:** 840 ms.

**Row 08: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Begin lifting | Swirl gathers around flask | Compact ring forms | Raised flask in ring | Flask intact inside tightened ring |

**Suggested durations:** `[70, 80, 90, 100, 110, 140]` ms; **total:** 590 ms.

**Row 09: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Bottle pulls inward | Small narrow bottle silhouette | Ring and central point remain | Tiny closing spatial spark | Fully transparent |

**Suggested durations:** `[80, 100, 110, 100, 90, 80]` ms; **total:** 560 ms.

Use the same spatial pickup origin through selection and disappearance. The ring is a local collection cue, not a traveling projectile or a teleport destination. The thin bottle remains narrower than the healing flask at native resolution.

### 04. Gold coin — rows 10–12

A small stamped gold coin. Its native idle image is only 9 × 10 pixels, leaving most of the 96-pixel frame transparent.

**Row 10: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Readable stamped face | Face narrows | Near-edge view | Thin edge | Face widens | Broad face before wrap |

**Suggested durations:** `[90, 80, 70, 70, 80, 90]` ms; **total:** 480 ms.

**Row 11: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Coin pops upward | Raised face becomes clear | Brief raised glint | Raised face held | Raised face with small glint |

**Suggested durations:** `[60, 60, 70, 70, 80, 100]` ms; **total:** 440 ms.

**Row 12: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Raised coin contracts | Tiny gold disk | Small gold sparkle | Single residual gold pixel | Fully transparent |

**Suggested durations:** `[60, 70, 70, 70, 70, 60]` ms; **total:** 400 ms.

The repeated broad-face area at the loop boundary is a short visual hold, not an extra frame to remove. Preserve the tiny final sparkle before the empty frame; an importer that drops low-area frames would shorten the disappearance.

### 05. Gem — rows 13–15

A faceted blue gem with pale edge highlights. It keeps a narrow diamond silhouette through its idle shimmer and raised selection.

**Row 13: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Faceted gem at rest | Highlight approaches edge | Edge highlight brightens | Facet highlight passes | Highlight recedes | Return toward first facets |

**Suggested durations:** `[180, 140, 130, 140, 180, 190]` ms; **total:** 960 ms.

**Row 14: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Begin lift | Raised facets tilt slightly | Facet flash grows | Reach upper lift | Raised gem with bright edge |

**Suggested durations:** `[70, 80, 90, 100, 100, 140]` ms; **total:** 580 ms.

**Row 15: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Raised gem holds briefly | Gem splits into light fragments | Smaller separated blue pieces | Last blue fleck | Fully transparent |

**Suggested durations:** `[80, 90, 110, 110, 100, 80]` ms; **total:** 570 ms.

The small downward separation of the late fragments belongs to the animation; do not recenter each fragment frame to its own bounds. Reward value and inventory type are separate from the blue gem artwork.

### 06. Iron key — rows 16–18

A tarnished iron key with a round bow at the left and teeth toward the right. Its long, thin profile separates it from coins, gems and bottles.

**Row 16: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Horizontal key | Slight sway | Sway passes through center | Small reverse sway | Settle toward center | Return toward first angle |

**Suggested durations:** `[180, 180, 180, 180, 180, 180]` ms; **total:** 1080 ms.

**Row 17: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Key starts rising | Lift with teeth forward | Raised key | Tooth glint develops | Raised key with tooth glint |

**Suggested durations:** `[80, 90, 100, 100, 110, 150]` ms; **total:** 630 ms.

**Row 18: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Tooth glint weakens | Teeth and shaft dissolve | Bow remains | Small flecks near bow | Fully transparent |

**Suggested durations:** `[90, 110, 120, 120, 100, 80]` ms; **total:** 620 ms.

Dissolution progresses from the teeth toward the surviving bow. Give the key a stable logical identity for lock checks; do not infer key compatibility from the stamp, color or current animation frame.

### 07. Gravestone — rows 19–21

A cracked slate headstone with moss at its foot and pale grave light in the central crack. Activation separates it into two leaning pieces.

**Row 19: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Cracked stone and faint rune | Faint rune variation | Stone holds | Subtle rune glimmer | Rune softens | Return toward faint rune |

**Suggested durations:** `[240, 240, 240, 240, 240, 240]` ms; **total:** 1440 ms.

**Row 20: Activating — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Rune brightens | Crack deepens | Top begins separating | Two halves lean apart | Split leaning pieces held |

**Suggested durations:** `[100, 140, 160, 170, 180, 240]` ms; **total:** 990 ms.

**Row 21: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact split result | Leaning pieces crumble downward | Low stone chunks settle | Smaller rubble and dust | Sparse stone/dust remnants | Fully transparent |

**Suggested durations:** `[100, 140, 150, 170, 170, 100]` ms; **total:** 830 ms.

The final activated silhouette is wider and shorter than the intact marker. Keep the base registration unchanged as it splits. If the grave triggers a spawn, unlock or quest flag, commit that effect once; the image does not contain the spawned actor.

### 08. Checkpoint flag — rows 22–24

A faded red pennant on a short iron pole with a small finial. The cloth initially hangs slack, then extends to the right as the finial lights.

**Row 22: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Slack red pennant | Cloth tip shifts slightly | Slack cloth moves | Cloth settles | Minor trailing-edge motion | Return toward first hang |

**Suggested durations:** `[180, 180, 180, 180, 180, 180]` ms; **total:** 1080 ms.

**Row 23: Activating — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Pennant starts unfurling | Cloth extends farther | Extended cloth; finial brightens | Flag nearly fully extended | Extended pennant and lit finial |

**Suggested durations:** `[90, 110, 130, 140, 160, 220]` ms; **total:** 850 ms.

**Row 24: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact extended result | Trailing edge begins fading | Most cloth disappears | Pole and finial remain | Sparse fading pole pixels | Fully transparent |

**Suggested durations:** `[100, 140, 160, 170, 180, 100]` ms; **total:** 850 ms.

The pole foot is the physical anchor; centering the visible cloth would move the pole as the flag unfurls. Keep the activated F6 on screen for a persistent checkpoint. There is no separate activated flag loop in this sheet.

### 09. Wooden crate — rows 25–27

A nailed wooden crate with diagonal bracing and a chipped corner. The heavy box holds still before its top boards buckle outward.

**Row 25: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Closed crate hold | Same closed hold | Same closed hold | Same closed hold | Same closed hold | Same closed hold |

**Suggested durations:** `[250, 250, 250, 250, 250, 250]` ms; **total:** 1500 ms.

**Row 26: Opening — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Top seam starts splitting | Lid boards loosen | Boards buckle outward | Top breaks open | Broken-open crate held |

**Suggested durations:** `[70, 90, 90, 100, 120, 180]` ms; **total:** 650 ms.

**Row 27: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact broken-open result | Loose boards fall inward | Broken top continues clearing | Low crate remains | Small wood fragments | Fully transparent |

**Suggested durations:** `[90, 110, 120, 130, 140, 90]` ms; **total:** 680 ms.

All six idle cells are exact held artwork. Preserve their slots for consistent six-frame clip definitions. If the crate drops loot, create that loot as a separate entity once at the chosen break event; it is not drawn inside these frames.

### 10. Barrel — rows 28–30

A squat wooden barrel held by two dark iron hoops. Breaking separates the staves and leaves a sprung hoop beside the collapsed wood.

**Row 28: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Intact barrel hold | Same intact hold | Same intact hold | Same intact hold | Same intact hold | Same intact hold |

**Suggested durations:** `[250, 250, 250, 250, 250, 250]` ms; **total:** 1500 ms.

**Row 29: Opening — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Top staves begin splitting | Split opens | Hoop springs loose | Staves collapse | Low staves and loose hoop |

**Suggested durations:** `[70, 100, 110, 130, 150, 190]` ms; **total:** 750 ms.

**Row 30: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact collapsed result | Staves and hoop settle | Debris becomes sparse | Small debris remains | Last wood/iron flecks | Fully transparent |

**Suggested durations:** `[100, 120, 140, 140, 150, 100]` ms; **total:** 750 ms.

The collapsed hoop stays near the same ground origin as the barrel. Do not shift the low remains upward to center them in their cells. The six identical idle frames are intentional.

### 11. Burial urn — rows 31–33

A muted clay urn with a chipped rim and faded burial marking. Its interaction cracks the vessel into a few large curved shards.

**Row 31: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Intact urn hold | Same intact hold | Same intact hold | Same intact hold | Same intact hold | Same intact hold |

**Suggested durations:** `[240, 240, 240, 240, 240, 240]` ms; **total:** 1440 ms.

**Row 32: Opening — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Fine crack develops | Crack widens | Large pieces separate | Shards fall | Low shards with restrained dust |

**Suggested durations:** `[80, 90, 110, 130, 140, 180]` ms; **total:** 730 ms.

**Row 33: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact shattered result | Shards settle | Smaller shard remnants | Sparse fragments and dust | Last dust/shard pixels | Fully transparent |

**Suggested durations:** `[100, 120, 140, 140, 150, 100]` ms; **total:** 750 ms.

Dust is compact and faint at native size; the large shards carry the break cue. The idle row is a held pose. Treat urn contents, damage, rewards and collision removal as controller decisions.

### 12. Wall torch — rows 34–36

An amber flame above a dark iron wall bracket. The bracket is registered independently of the changing flame silhouette.

**Row 34: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Small amber flame | Flame shortens | Flame stretches | Flame flicks sideways | Compact flicker | Return toward small flame |

**Suggested durations:** `[90, 80, 100, 90, 80, 100]` ms; **total:** 540 ms.

**Row 35: Activating — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Flame starts rising | Brighter flare | Tall flare grows | Flare strengthens | Tall flame; bracket visible |

**Suggested durations:** `[80, 90, 100, 120, 130, 180]` ms; **total:** 700 ms.

**Row 36: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact flared result | Flame drops toward normal | Flame snuffed to ember | Bracket and weak ember fade | Last ember/bracket pixels | Fully transparent |

**Suggested durations:** `[90, 110, 130, 140, 150, 100]` ms; **total:** 720 ms.

The last intact bracket pixel is at local y74 while the flame can rise to y25 in the flare. Do not bottom-align the whole effect or center it by its flame. A point light or illumination radius is optional game data; the PNG supplies only the local flame.

### 13. Lever — rows 37–39

A rusted floor lever on a small stone base. The handle pivots down toward the right and stops at a fully pulled angle.

**Row 37: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Upright lever hold | Minor material highlight | Upright hold | Upright hold | Small highlight variation | Return toward first hold |

**Suggested durations:** `[240, 240, 240, 240, 240, 240]` ms; **total:** 1440 ms.

**Row 38: Activating — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Handle starts moving | Handle inclines | Handle pivots farther down | Near the stop | Fully pulled handle held |

**Suggested durations:** `[90, 110, 120, 140, 160, 220]` ms; **total:** 840 ms.

**Row 39: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact pulled result | Pulled handle begins fading | Handle/base partially dissolve | Small base and handle pieces | Last registered fragments | Fully transparent |

**Suggested durations:** `[100, 130, 140, 150, 160, 100]` ms; **total:** 780 ms.

Hold the fully pulled F6 for a persistent switch. There is no reset or reverse-pull animation authored here. If a reusable mechanism needs to reset, define that policy and its visual transition explicitly rather than looping this interaction row.

### 14. Spell scroll — rows 40–42

Rolled parchment tied with a violet ribbon. The ribbon releases and the paper opens into a small sheet with abstract runes.

**Row 40: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Rolled parchment | Ribbon tip moves | Small ribbon shift | Ribbon settles | Ribbon tip moves back | Return toward first roll |

**Suggested durations:** `[180, 180, 180, 180, 180, 180]` ms; **total:** 1080 ms.

**Row 41: Opening — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Ribbon starts releasing | Roll loosens | Parchment partly open | Runes become visible | Open parchment and runes held |

**Suggested durations:** `[80, 100, 130, 150, 170, 230]` ms; **total:** 860 ms.

**Row 42: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact open result | Paper curls inward | Smaller curled parchment | Small roll and violet flecks | Sparse violet particles | Fully transparent |

**Suggested durations:** `[100, 120, 140, 140, 150, 100]` ms; **total:** 750 ms.

The paper opens around its registered floating center rather than making the eight-pixel pickup lift used by the bottles, coin, gem, key and relic. The runes are abstract art; spell identity and unlock behavior belong to the inventory or ability system.

### 15. Healing shrine — rows 43–45

A compact slate-gray pedestal with a carved sun and dim gold center. Activation brightens the sun and draws a warm ring around the base.

**Row 43: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Dim carved sun | Subtle center shimmer | Dim sun holds | Center highlight shifts | Light settles | Return toward dim center |

**Suggested durations:** `[240, 240, 240, 240, 240, 240]` ms; **total:** 1440 ms.

**Row 44: Activating — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Sun center brightens | Sun rays become clear | Small gold ring forms | Ring and sun brighten | Fully lit shrine and ring held |

**Suggested durations:** `[100, 130, 160, 180, 200, 260]` ms; **total:** 1030 ms.

**Row 45: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact lit result | Ring expands; top begins dissolving | Wider ring and stone fragments | Sparse pedestal remnants and arcs | Fading ring fragments and motes | Fully transparent |

**Suggested durations:** `[110, 150, 170, 180, 180, 110]` ms; **total:** 900 ms.

The final ring was adjusted to expand before fading: nominal widths progress about 55 → 58 → 60 pixels, then the wider arcs become sparse. The physical pedestal stays registered even though gold pixels extend below its base. A permanent shrine can hold its lit result indefinitely without disappearing.

### 16. Dungeon relic — rows 46–48

A small ivory skull mounted in a tall tarnished iron frame. Pale blue-green light in the sockets distinguishes its undead magic from the gold healing objects.

**Row 46: Idle — loop.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Framed skull; dim sockets | Socket light varies | Small grave-light pulse | Pulse softens | Dim glow returns | Return toward first socket light |

**Suggested durations:** `[180, 180, 180, 180, 180, 180]` ms; **total:** 1080 ms.

**Row 47: Selecting — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact idle F1 | Relic starts lifting | Raised sockets brighten | Grave light flares | Relic reaches upper lift | Raised intact relic and bright sockets |

**Suggested durations:** `[80, 90, 110, 120, 140, 180]` ms; **total:** 720 ms.

**Row 48: Disappearance — once.**

| F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|
| Exact raised result | Light draws toward sockets | Frame/skull dissolves into motes | Few blue-green remnants | Sparse grave-light motes | Fully transparent |

**Suggested durations:** `[100, 120, 140, 140, 150, 100]` ms; **total:** 750 ms.

The intact framed relic is only 16 × 26 pixels in idle F1. Keep its lift inside the sprite; moving the world root upward by another eight pixels would double the authored motion. Any curse, quest or collectible effect must be defined separately.

## 4. Import, playback and world state

### Import and slice

1. Import the original PNG with point/nearest-neighbor sampling and preserve its alpha. Use integer display scales when practical.
2. Slice **96 × 96** cells with offset **(0,0)**, margin **0**, spacing **0**, six columns and forty-eight rows.
3. Keep all **288** cells. Turn off trimming, opaque-bounds recentering, empty-frame removal and automatic size normalization.
4. Assign a fixed pivot convention to each object and keep it for all eighteen frames. A shared grounded pivot of **(48,85)** places the boundary beneath visible ground pixel84 on the world ground line.
5. Build the three clips for each object from its three consecutive rows. Only the first clip loops. Supply frame durations in the animation system; a PNG has no FPS setting.

### Recommended state behavior

| Current state | Display and transition |
|---|---|
| Idle | Loop its six frames while the object is available. A static idle may simply display F1, provided interaction still begins from the correct row. |
| Interaction | Play the opening, selection or activation once. Reject duplicate interaction requests while it is running. |
| Result hold | Hold interaction F6 after its full duration. This can last a moment for a pickup or indefinitely for an activated world prop. |
| Disappearance | Start at its own F1, which exactly copies the result. Play once without restarting or wrapping. |
| Gone | Keep its transparent F6 or remove the renderable/entity according to the game's lifecycle. Preserve any persistent world-state record. |

A lever, checkpoint flag or healing shrine should **not automatically vanish when activated**. Their activated F6 is a usable persistent result. A chest may remain open until its loot interface closes. A broken container or gravestone may remain as its final fragments until cleanup is requested. The sheet provides disappearance as an available transition; it does not dictate when the game must use it.

For one-time pickups, mark the object as claimed when the interaction is accepted and disable its pickup trigger immediately. Apply the reward once at acceptance or at one deliberately chosen completion/event point. Do not award it every render frame, on both the interaction and disappearance starts, or whenever the repeated result pixels are shown. Store the consumed/activated flag with a stable world-object ID when persistence is needed.

### Suggested gameplay commit points

These are policy choices used by the example controller, not data hidden in the image. A “complete” commit occurs after the entire interaction row, including the duration of F6. If tighter synchronization is needed, a game can instead dispatch a single event when entering a selected frame; handle every crossed boundary during a long update and use the same idempotent commitment flag.

| Objects | Example commit point | Example game responsibility |
|---|---|---|
| Healing potion, space potion, coin, gem, key, scroll, relic | Interaction accepted | Reserve/collect the item once; apply health, resource, currency or inventory effects according to the object definition. |
| Treasure chest | Opening completes | Mark opened and expose its loot contents; reward transactions can still occur separately in the loot interface. |
| Crate, barrel, urn, gravestone | Breaking/activation completes | Record destruction or activation, update collision if required, and optionally spawn separately defined loot or actors. |
| Checkpoint flag | Activation completes | Record the checkpoint while leaving the extended flag visible. |
| Lever | Activation completes | Set the linked mechanism's state once and retain the pulled pose. |
| Healing shrine | Activation completes | Commit the designed heal/checkpoint effect once and retain the lit pedestal. |
| Wall torch | Flare completes | Set the desired lit state or script flag; lighting is an independent system. |

The provided controller models one accepted interaction per instance. Reusable shrines, resettable levers and respawning pickups need explicit re-arming rules. There is no authored lever-reset row, chest-closing row or activated looping flag row. Replaying idle would restore the earlier visual state; reversing a break animation is not an authored repair animation.

### JavaScript example: all clips, sampling, state and drawing

This single block is runnable JavaScript without external packages. It constructs all **48** clips, supports uneven frame durations and clamps negative sample time to zero. The draw helper accepts an already loaded image and rendering context; its definition does not require a browser to run. The small usage example below it exercises the state transitions without loading an image.

```javascript
const OBJECT_CELL = 96;
const OBJECT_COLUMNS = 6;
const OBJECT_GROUND_PIVOT = { x: 48, y: 85 };

const objectSpecs = [
  {"id":"treasure_chest","firstRow":1,"commitAt":"complete"},
  {"id":"healing_potion","firstRow":4,"commitAt":"accept"},
  {"id":"space_potion","firstRow":7,"commitAt":"accept"},
  {"id":"gold_coin","firstRow":10,"commitAt":"accept"},
  {"id":"gem","firstRow":13,"commitAt":"accept"},
  {"id":"iron_key","firstRow":16,"commitAt":"accept"},
  {"id":"gravestone","firstRow":19,"commitAt":"complete"},
  {"id":"checkpoint_flag","firstRow":22,"commitAt":"complete"},
  {"id":"wooden_crate","firstRow":25,"commitAt":"complete"},
  {"id":"barrel","firstRow":28,"commitAt":"complete"},
  {"id":"burial_urn","firstRow":31,"commitAt":"complete"},
  {"id":"wall_torch","firstRow":34,"commitAt":"complete"},
  {"id":"lever","firstRow":37,"commitAt":"complete"},
  {"id":"spell_scroll","firstRow":40,"commitAt":"accept"},
  {"id":"healing_shrine","firstRow":43,"commitAt":"complete"},
  {"id":"dungeon_relic","firstRow":46,"commitAt":"accept"},
];
const OBJECT_TYPES = Object.fromEntries(objectSpecs.map(spec => [spec.id, spec]));

const objectClipSpecs = [
  {"id":"treasure_chest_idle","objectId":"treasure_chest","phase":"idle","row":1,"loop":true,"ms":[220,180,140,160,220,240]},
  {"id":"treasure_chest_interaction","objectId":"treasure_chest","phase":"interaction","row":2,"loop":false,"ms":[80,110,140,140,120,180]},
  {"id":"treasure_chest_disappearance","objectId":"treasure_chest","phase":"disappearance","row":3,"loop":false,"ms":[100,140,150,150,140,80]},
  {"id":"healing_potion_idle","objectId":"healing_potion","phase":"idle","row":4,"loop":true,"ms":[160,140,140,140,160,180]},
  {"id":"healing_potion_interaction","objectId":"healing_potion","phase":"interaction","row":5,"loop":false,"ms":[70,70,90,100,100,140]},
  {"id":"healing_potion_disappearance","objectId":"healing_potion","phase":"disappearance","row":6,"loop":false,"ms":[80,100,100,100,100,80]},
  {"id":"space_potion_idle","objectId":"space_potion","phase":"idle","row":7,"loop":true,"ms":[140,140,140,140,140,140]},
  {"id":"space_potion_interaction","objectId":"space_potion","phase":"interaction","row":8,"loop":false,"ms":[70,80,90,100,110,140]},
  {"id":"space_potion_disappearance","objectId":"space_potion","phase":"disappearance","row":9,"loop":false,"ms":[80,100,110,100,90,80]},
  {"id":"gold_coin_idle","objectId":"gold_coin","phase":"idle","row":10,"loop":true,"ms":[90,80,70,70,80,90]},
  {"id":"gold_coin_interaction","objectId":"gold_coin","phase":"interaction","row":11,"loop":false,"ms":[60,60,70,70,80,100]},
  {"id":"gold_coin_disappearance","objectId":"gold_coin","phase":"disappearance","row":12,"loop":false,"ms":[60,70,70,70,70,60]},
  {"id":"gem_idle","objectId":"gem","phase":"idle","row":13,"loop":true,"ms":[180,140,130,140,180,190]},
  {"id":"gem_interaction","objectId":"gem","phase":"interaction","row":14,"loop":false,"ms":[70,80,90,100,100,140]},
  {"id":"gem_disappearance","objectId":"gem","phase":"disappearance","row":15,"loop":false,"ms":[80,90,110,110,100,80]},
  {"id":"iron_key_idle","objectId":"iron_key","phase":"idle","row":16,"loop":true,"ms":[180,180,180,180,180,180]},
  {"id":"iron_key_interaction","objectId":"iron_key","phase":"interaction","row":17,"loop":false,"ms":[80,90,100,100,110,150]},
  {"id":"iron_key_disappearance","objectId":"iron_key","phase":"disappearance","row":18,"loop":false,"ms":[90,110,120,120,100,80]},
  {"id":"gravestone_idle","objectId":"gravestone","phase":"idle","row":19,"loop":true,"ms":[240,240,240,240,240,240]},
  {"id":"gravestone_interaction","objectId":"gravestone","phase":"interaction","row":20,"loop":false,"ms":[100,140,160,170,180,240]},
  {"id":"gravestone_disappearance","objectId":"gravestone","phase":"disappearance","row":21,"loop":false,"ms":[100,140,150,170,170,100]},
  {"id":"checkpoint_flag_idle","objectId":"checkpoint_flag","phase":"idle","row":22,"loop":true,"ms":[180,180,180,180,180,180]},
  {"id":"checkpoint_flag_interaction","objectId":"checkpoint_flag","phase":"interaction","row":23,"loop":false,"ms":[90,110,130,140,160,220]},
  {"id":"checkpoint_flag_disappearance","objectId":"checkpoint_flag","phase":"disappearance","row":24,"loop":false,"ms":[100,140,160,170,180,100]},
  {"id":"wooden_crate_idle","objectId":"wooden_crate","phase":"idle","row":25,"loop":true,"ms":[250,250,250,250,250,250]},
  {"id":"wooden_crate_interaction","objectId":"wooden_crate","phase":"interaction","row":26,"loop":false,"ms":[70,90,90,100,120,180]},
  {"id":"wooden_crate_disappearance","objectId":"wooden_crate","phase":"disappearance","row":27,"loop":false,"ms":[90,110,120,130,140,90]},
  {"id":"barrel_idle","objectId":"barrel","phase":"idle","row":28,"loop":true,"ms":[250,250,250,250,250,250]},
  {"id":"barrel_interaction","objectId":"barrel","phase":"interaction","row":29,"loop":false,"ms":[70,100,110,130,150,190]},
  {"id":"barrel_disappearance","objectId":"barrel","phase":"disappearance","row":30,"loop":false,"ms":[100,120,140,140,150,100]},
  {"id":"burial_urn_idle","objectId":"burial_urn","phase":"idle","row":31,"loop":true,"ms":[240,240,240,240,240,240]},
  {"id":"burial_urn_interaction","objectId":"burial_urn","phase":"interaction","row":32,"loop":false,"ms":[80,90,110,130,140,180]},
  {"id":"burial_urn_disappearance","objectId":"burial_urn","phase":"disappearance","row":33,"loop":false,"ms":[100,120,140,140,150,100]},
  {"id":"wall_torch_idle","objectId":"wall_torch","phase":"idle","row":34,"loop":true,"ms":[90,80,100,90,80,100]},
  {"id":"wall_torch_interaction","objectId":"wall_torch","phase":"interaction","row":35,"loop":false,"ms":[80,90,100,120,130,180]},
  {"id":"wall_torch_disappearance","objectId":"wall_torch","phase":"disappearance","row":36,"loop":false,"ms":[90,110,130,140,150,100]},
  {"id":"lever_idle","objectId":"lever","phase":"idle","row":37,"loop":true,"ms":[240,240,240,240,240,240]},
  {"id":"lever_interaction","objectId":"lever","phase":"interaction","row":38,"loop":false,"ms":[90,110,120,140,160,220]},
  {"id":"lever_disappearance","objectId":"lever","phase":"disappearance","row":39,"loop":false,"ms":[100,130,140,150,160,100]},
  {"id":"spell_scroll_idle","objectId":"spell_scroll","phase":"idle","row":40,"loop":true,"ms":[180,180,180,180,180,180]},
  {"id":"spell_scroll_interaction","objectId":"spell_scroll","phase":"interaction","row":41,"loop":false,"ms":[80,100,130,150,170,230]},
  {"id":"spell_scroll_disappearance","objectId":"spell_scroll","phase":"disappearance","row":42,"loop":false,"ms":[100,120,140,140,150,100]},
  {"id":"healing_shrine_idle","objectId":"healing_shrine","phase":"idle","row":43,"loop":true,"ms":[240,240,240,240,240,240]},
  {"id":"healing_shrine_interaction","objectId":"healing_shrine","phase":"interaction","row":44,"loop":false,"ms":[100,130,160,180,200,260]},
  {"id":"healing_shrine_disappearance","objectId":"healing_shrine","phase":"disappearance","row":45,"loop":false,"ms":[110,150,170,180,180,110]},
  {"id":"dungeon_relic_idle","objectId":"dungeon_relic","phase":"idle","row":46,"loop":true,"ms":[180,180,180,180,180,180]},
  {"id":"dungeon_relic_interaction","objectId":"dungeon_relic","phase":"interaction","row":47,"loop":false,"ms":[80,90,110,120,140,180]},
  {"id":"dungeon_relic_disappearance","objectId":"dungeon_relic","phase":"disappearance","row":48,"loop":false,"ms":[100,120,140,140,150,100]},
];

const OBJECT_CLIPS = Object.fromEntries(objectClipSpecs.map(spec => {
  if (spec.ms.length !== 6 || spec.ms.some(ms => !Number.isFinite(ms) || ms <= 0)) {
    throw new Error(`Invalid six-frame timing for ${spec.id}`);
  }
  const frames = spec.ms.map((durationMs, column0) => ({
    column: column0 + 1,
    index: (spec.row - 1) * OBJECT_COLUMNS + column0,
    rect: { x: column0 * OBJECT_CELL, y: (spec.row - 1) * OBJECT_CELL,
            width: OBJECT_CELL, height: OBJECT_CELL },
    durationMs
  }));
  return [spec.id, { ...spec, frames,
    durationMs: spec.ms.reduce((sum, ms) => sum + ms, 0) }];
}));

function sampleObjectClip(clip, elapsedMs) {
  if (!Number.isFinite(elapsedMs)) throw new TypeError("elapsedMs must be finite");
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

function createWorldObject(objectId, onCommit = () => {}) {
  if (!OBJECT_TYPES[objectId]) throw new Error(`Unknown object: ${objectId}`);
  if (typeof onCommit !== "function") throw new TypeError("onCommit must be a function");
  return { objectId, state: "idle", elapsedMs: 0,
           interactionAccepted: false, effectCommitted: false, onCommit };
}

function commitWorldObjectEffect(object) {
  if (object.effectCommitted) return;
  object.effectCommitted = true; // Set before callback to reject re-entrant repeats.
  object.onCommit({ objectId: object.objectId });
}

function beginWorldObjectInteraction(object) {
  if (object.state !== "idle" || object.interactionAccepted) return false;
  object.interactionAccepted = true;
  object.state = "interaction";
  object.elapsedMs = 0;
  if (OBJECT_TYPES[object.objectId].commitAt === "accept") {
    commitWorldObjectEffect(object);
  }
  return true;
}

function beginWorldObjectDisappearance(object) {
  if (object.state !== "hold") return false;
  object.state = "disappearance";
  object.elapsedMs = 0;
  return true; // No reward callback here: its F1 duplicates the result pose.
}

function currentWorldObjectSample(object) {
  const phase = object.state === "hold" ? "interaction"
    : object.state === "gone" ? "disappearance" : object.state;
  const clip = OBJECT_CLIPS[`${object.objectId}_${phase}`];
  const elapsed = (object.state === "hold" || object.state === "gone")
    ? clip.durationMs : object.elapsedMs;
  return sampleObjectClip(clip, elapsed);
}

function advanceWorldObject(object, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new TypeError("deltaMs must be a finite nonnegative number");
  }
  if (object.state === "hold" || object.state === "gone") {
    return currentWorldObjectSample(object);
  }
  object.elapsedMs += deltaMs;
  const clip = OBJECT_CLIPS[`${object.objectId}_${object.state}`];
  const sample = sampleObjectClip(clip, object.elapsedMs);
  if (sample.complete && object.state === "interaction") {
    if (OBJECT_TYPES[object.objectId].commitAt === "complete") {
      commitWorldObjectEffect(object);
    }
    object.state = "hold";
    object.elapsedMs = clip.durationMs;
  } else if (sample.complete && object.state === "disappearance") {
    object.state = "gone";
    object.elapsedMs = clip.durationMs;
  }
  return sample;
}

function drawWorldObject(ctx, image, frame, rootX, rootY, scale = 1,
                         pivot = OBJECT_GROUND_PIVOT) {
  const r = frame.rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(rootX, rootY);
  ctx.scale(scale, scale);
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
                -pivot.x, -pivot.y, OBJECT_CELL, OBJECT_CELL);
  ctx.restore();
}

// Standalone example: one accepted chest opening, an explicit hold, then removal.
const committedObjectIds = [];
const exampleChest = createWorldObject("treasure_chest", event => {
  committedObjectIds.push(event.objectId);
});
beginWorldObjectInteraction(exampleChest);
advanceWorldObject(exampleChest, OBJECT_CLIPS.treasure_chest_interaction.durationMs);
// exampleChest.state is "hold"; the chest stays open until this explicit request:
beginWorldObjectDisappearance(exampleChest);
advanceWorldObject(exampleChest, OBJECT_CLIPS.treasure_chest_disappearance.durationMs);
const exampleFinalSample = currentWorldObjectSample(exampleChest);
// state is "gone", frame.index is 17, and committedObjectIds contains one entry.
```

The sampler keeps F6 on screen for its full assigned duration before reporting `complete`. Further samples of a completed one-shot still return F6; they never wrap to F1. The controller deliberately does not auto-chain interaction to disappearance, even if a long update exceeds the interaction duration. This preserves the explicit result hold and prevents persistent props from vanishing. An engine that immediately removes a renderable on completion should still let the disappearance reach its blank F6.

The example commits an effect once on acceptance or completion, according to `objectSpecs`. Replace its callback with validated game logic. It is an in-memory guard, not a substitute for an authoritative inventory transaction or saved consumed-state record. If using frame-entry events instead, choose that route once and do not also call the same reward from this callback. The callback function itself need not be serialized; persist stable IDs and the logical state instead.

## 5. Important alignment and integration notes

### Exact state-boundary relationships

For every object with idle row `r`, the delivered pixels satisfy the following. These were checked against the final PNG, including transparent pixels and local effects.

| Relationship | Meaning |
|---|---|
| `(r+1, F1) == (r, F1)` | Interaction begins with an exact copy of the first idle pose. |
| `(r+2, F1) == (r+1, F6)` | Disappearance begins with the exact opened, raised, broken or activated result. |
| `(r+2, F6)` has zero alpha throughout | Every disappearance ends fully transparent. |

The duplicate state-boundary image is still a separate frame in a separate row. It does not imply that the two rows should overlap in time or that gameplay effects should execute twice. If the visual hold feels too long, shorten the recommended durations of the duplicated boundary frames; keep their order and pixels.

The intentionally empty cells are **R3, R6, R9, R12, R15, R18, R21, R24, R27, R30, R33, R36, R39, R42, R45 and R48, all at C6**. Their zero-based indices are **17, 35, 53, 71, 89, 107, 125, 143, 161, 179, 197, 215, 233, 251, 269 and 287**. They remain valid 96 × 96 extraction rectangles.

### Ground, floating centers and wall placement

| Registration class | Objects | Placement rule |
|---|---|---|
| Grounded base / pole foot | Chest, gravestone, checkpoint flag, crate, barrel, urn, lever, shrine | Use a fixed root. Intact bases contact visible pixel y84; the suggested boundary pivot `(48,85)` makes `imageTop = groundY - 85` at native 1× scale. |
| Floating pickups with a selection lift | Healing potion, space potion, coin, gem, key, relic | Idle registration is about `(48,64)`; the selection raises the body about eight pixels toward `(48,56)`. Keep the root fixed so that authored motion remains visible. |
| Floating parchment | Scroll | It opens and curls around its own fixed center; no additional eight-pixel selection lift is required. |
| Wall-mounted bracket | Torch | The bracket's visible bottom stays at y74 while the flame changes. A placement convention based on that bottom can use a fixed boundary reference `(48,75)`. |

A common `(48,85)` pivot can be used for every object if the world root is defined consistently. Under that convention, a pickup drawn around y64 already floats roughly twenty-one pixels above the nominal ground boundary. If a game instead places pickups by their floating center, use a fixed `(48,64)` pivot for all eighteen frames of that object. Both conventions work; do not switch pivots when an item lifts or shrinks. In a top-left normalized convention divide pivot coordinates by96; convert the y axis if the engine measures upward from the bottom.

The cell includes the intended lid movement, selection lift, collapsing debris, cloth extension, rings and fading motes. Do not add the same eight-pixel lift again in code. Do not align each frame to its lowest opaque pixel or its bounding-box center: that would raise falling debris, move the torch when its flame grows, shift the flag pole as cloth disappears, and cancel the small pickup motions.

Grounded contact is a physical-art registration, not a promise that every effect pixel ends at y84. In particular, the activated shrine ring extends to y85 and its disappearing arcs can extend lower. Broken debris can lose its original ground-contact pixels as it dissolves. Keep the root and colliders under game control rather than deriving them from changing alpha bounds.

### Collision, effects and persistence

Author object colliders and interaction zones separately from the 96-pixel cells. A coin should normally have a forgiving pickup area larger than its nine-pixel visible width; a chest collider should not expand when its lid opens; a flag should register around its pole rather than its extended cloth. Decide when solid crate, barrel or urn collision is disabled as part of the break state. The sheet does not contain collision polygons, pickup radii, inventory values or damage rules.

Local sparkles, healing/space rings, grave-light motes, dust and torch flames are already painted into the frames. Add separate effects only when the game needs something outside the cell, such as a spawned item, a large healing radius or dynamic illumination. Do not unintentionally duplicate the local ring by spawning an identical effect over it.

Keep the PNG at its original resolution, avoid lossy image formats, and use point sampling for crisp edges. The source grid has **zero margin and spacing** even though each frame contains transparent padding. If an engine repacks or trims sprites, preserve the original 96 × 96 logical size and pivot offsets; retaining the untrimmed cells is the simplest import. If a filtered GPU atlas is built later, its own extrusion/padding is a separate packing setting, not a change to these source rectangles.

## 6. Exact rectangle appendix

Each entry is **`(x, y, 96, 96)`** in the PNG. Columns F1–F6 are the playback order, and every rectangle includes its transparent padding. The complete appendix contains all **288** frame locations, including the sixteen empty disappearance endings.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `treasure_chest_idle` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `treasure_chest_interaction` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `treasure_chest_disappearance` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `healing_potion_idle` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `healing_potion_interaction` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `healing_potion_disappearance` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `space_potion_idle` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `space_potion_interaction` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `space_potion_disappearance` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `gold_coin_idle` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `gold_coin_interaction` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `gold_coin_disappearance` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `gem_idle` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `gem_interaction` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |
| 15 `gem_disappearance` | `(0, 1344, 96, 96)` | `(96, 1344, 96, 96)` | `(192, 1344, 96, 96)` | `(288, 1344, 96, 96)` | `(384, 1344, 96, 96)` | `(480, 1344, 96, 96)` |
| 16 `iron_key_idle` | `(0, 1440, 96, 96)` | `(96, 1440, 96, 96)` | `(192, 1440, 96, 96)` | `(288, 1440, 96, 96)` | `(384, 1440, 96, 96)` | `(480, 1440, 96, 96)` |
| 17 `iron_key_interaction` | `(0, 1536, 96, 96)` | `(96, 1536, 96, 96)` | `(192, 1536, 96, 96)` | `(288, 1536, 96, 96)` | `(384, 1536, 96, 96)` | `(480, 1536, 96, 96)` |
| 18 `iron_key_disappearance` | `(0, 1632, 96, 96)` | `(96, 1632, 96, 96)` | `(192, 1632, 96, 96)` | `(288, 1632, 96, 96)` | `(384, 1632, 96, 96)` | `(480, 1632, 96, 96)` |
| 19 `gravestone_idle` | `(0, 1728, 96, 96)` | `(96, 1728, 96, 96)` | `(192, 1728, 96, 96)` | `(288, 1728, 96, 96)` | `(384, 1728, 96, 96)` | `(480, 1728, 96, 96)` |
| 20 `gravestone_interaction` | `(0, 1824, 96, 96)` | `(96, 1824, 96, 96)` | `(192, 1824, 96, 96)` | `(288, 1824, 96, 96)` | `(384, 1824, 96, 96)` | `(480, 1824, 96, 96)` |
| 21 `gravestone_disappearance` | `(0, 1920, 96, 96)` | `(96, 1920, 96, 96)` | `(192, 1920, 96, 96)` | `(288, 1920, 96, 96)` | `(384, 1920, 96, 96)` | `(480, 1920, 96, 96)` |
| 22 `checkpoint_flag_idle` | `(0, 2016, 96, 96)` | `(96, 2016, 96, 96)` | `(192, 2016, 96, 96)` | `(288, 2016, 96, 96)` | `(384, 2016, 96, 96)` | `(480, 2016, 96, 96)` |
| 23 `checkpoint_flag_interaction` | `(0, 2112, 96, 96)` | `(96, 2112, 96, 96)` | `(192, 2112, 96, 96)` | `(288, 2112, 96, 96)` | `(384, 2112, 96, 96)` | `(480, 2112, 96, 96)` |
| 24 `checkpoint_flag_disappearance` | `(0, 2208, 96, 96)` | `(96, 2208, 96, 96)` | `(192, 2208, 96, 96)` | `(288, 2208, 96, 96)` | `(384, 2208, 96, 96)` | `(480, 2208, 96, 96)` |
| 25 `wooden_crate_idle` | `(0, 2304, 96, 96)` | `(96, 2304, 96, 96)` | `(192, 2304, 96, 96)` | `(288, 2304, 96, 96)` | `(384, 2304, 96, 96)` | `(480, 2304, 96, 96)` |
| 26 `wooden_crate_interaction` | `(0, 2400, 96, 96)` | `(96, 2400, 96, 96)` | `(192, 2400, 96, 96)` | `(288, 2400, 96, 96)` | `(384, 2400, 96, 96)` | `(480, 2400, 96, 96)` |
| 27 `wooden_crate_disappearance` | `(0, 2496, 96, 96)` | `(96, 2496, 96, 96)` | `(192, 2496, 96, 96)` | `(288, 2496, 96, 96)` | `(384, 2496, 96, 96)` | `(480, 2496, 96, 96)` |
| 28 `barrel_idle` | `(0, 2592, 96, 96)` | `(96, 2592, 96, 96)` | `(192, 2592, 96, 96)` | `(288, 2592, 96, 96)` | `(384, 2592, 96, 96)` | `(480, 2592, 96, 96)` |
| 29 `barrel_interaction` | `(0, 2688, 96, 96)` | `(96, 2688, 96, 96)` | `(192, 2688, 96, 96)` | `(288, 2688, 96, 96)` | `(384, 2688, 96, 96)` | `(480, 2688, 96, 96)` |
| 30 `barrel_disappearance` | `(0, 2784, 96, 96)` | `(96, 2784, 96, 96)` | `(192, 2784, 96, 96)` | `(288, 2784, 96, 96)` | `(384, 2784, 96, 96)` | `(480, 2784, 96, 96)` |
| 31 `burial_urn_idle` | `(0, 2880, 96, 96)` | `(96, 2880, 96, 96)` | `(192, 2880, 96, 96)` | `(288, 2880, 96, 96)` | `(384, 2880, 96, 96)` | `(480, 2880, 96, 96)` |
| 32 `burial_urn_interaction` | `(0, 2976, 96, 96)` | `(96, 2976, 96, 96)` | `(192, 2976, 96, 96)` | `(288, 2976, 96, 96)` | `(384, 2976, 96, 96)` | `(480, 2976, 96, 96)` |
| 33 `burial_urn_disappearance` | `(0, 3072, 96, 96)` | `(96, 3072, 96, 96)` | `(192, 3072, 96, 96)` | `(288, 3072, 96, 96)` | `(384, 3072, 96, 96)` | `(480, 3072, 96, 96)` |
| 34 `wall_torch_idle` | `(0, 3168, 96, 96)` | `(96, 3168, 96, 96)` | `(192, 3168, 96, 96)` | `(288, 3168, 96, 96)` | `(384, 3168, 96, 96)` | `(480, 3168, 96, 96)` |
| 35 `wall_torch_interaction` | `(0, 3264, 96, 96)` | `(96, 3264, 96, 96)` | `(192, 3264, 96, 96)` | `(288, 3264, 96, 96)` | `(384, 3264, 96, 96)` | `(480, 3264, 96, 96)` |
| 36 `wall_torch_disappearance` | `(0, 3360, 96, 96)` | `(96, 3360, 96, 96)` | `(192, 3360, 96, 96)` | `(288, 3360, 96, 96)` | `(384, 3360, 96, 96)` | `(480, 3360, 96, 96)` |
| 37 `lever_idle` | `(0, 3456, 96, 96)` | `(96, 3456, 96, 96)` | `(192, 3456, 96, 96)` | `(288, 3456, 96, 96)` | `(384, 3456, 96, 96)` | `(480, 3456, 96, 96)` |
| 38 `lever_interaction` | `(0, 3552, 96, 96)` | `(96, 3552, 96, 96)` | `(192, 3552, 96, 96)` | `(288, 3552, 96, 96)` | `(384, 3552, 96, 96)` | `(480, 3552, 96, 96)` |
| 39 `lever_disappearance` | `(0, 3648, 96, 96)` | `(96, 3648, 96, 96)` | `(192, 3648, 96, 96)` | `(288, 3648, 96, 96)` | `(384, 3648, 96, 96)` | `(480, 3648, 96, 96)` |
| 40 `spell_scroll_idle` | `(0, 3744, 96, 96)` | `(96, 3744, 96, 96)` | `(192, 3744, 96, 96)` | `(288, 3744, 96, 96)` | `(384, 3744, 96, 96)` | `(480, 3744, 96, 96)` |
| 41 `spell_scroll_interaction` | `(0, 3840, 96, 96)` | `(96, 3840, 96, 96)` | `(192, 3840, 96, 96)` | `(288, 3840, 96, 96)` | `(384, 3840, 96, 96)` | `(480, 3840, 96, 96)` |
| 42 `spell_scroll_disappearance` | `(0, 3936, 96, 96)` | `(96, 3936, 96, 96)` | `(192, 3936, 96, 96)` | `(288, 3936, 96, 96)` | `(384, 3936, 96, 96)` | `(480, 3936, 96, 96)` |
| 43 `healing_shrine_idle` | `(0, 4032, 96, 96)` | `(96, 4032, 96, 96)` | `(192, 4032, 96, 96)` | `(288, 4032, 96, 96)` | `(384, 4032, 96, 96)` | `(480, 4032, 96, 96)` |
| 44 `healing_shrine_interaction` | `(0, 4128, 96, 96)` | `(96, 4128, 96, 96)` | `(192, 4128, 96, 96)` | `(288, 4128, 96, 96)` | `(384, 4128, 96, 96)` | `(480, 4128, 96, 96)` |
| 45 `healing_shrine_disappearance` | `(0, 4224, 96, 96)` | `(96, 4224, 96, 96)` | `(192, 4224, 96, 96)` | `(288, 4224, 96, 96)` | `(384, 4224, 96, 96)` | `(480, 4224, 96, 96)` |
| 46 `dungeon_relic_idle` | `(0, 4320, 96, 96)` | `(96, 4320, 96, 96)` | `(192, 4320, 96, 96)` | `(288, 4320, 96, 96)` | `(384, 4320, 96, 96)` | `(480, 4320, 96, 96)` |
| 47 `dungeon_relic_interaction` | `(0, 4416, 96, 96)` | `(96, 4416, 96, 96)` | `(192, 4416, 96, 96)` | `(288, 4416, 96, 96)` | `(384, 4416, 96, 96)` | `(480, 4416, 96, 96)` |
| 48 `dungeon_relic_disappearance` | `(0, 4512, 96, 96)` | `(96, 4512, 96, 96)` | `(192, 4512, 96, 96)` | `(288, 4512, 96, 96)` | `(384, 4512, 96, 96)` | `(480, 4512, 96, 96)` |

The names and timing arrays in this guide are suggested integration identifiers. They may be renamed or tuned without changing the source image, frame order, extraction coordinates or exact transition-frame relationships.
