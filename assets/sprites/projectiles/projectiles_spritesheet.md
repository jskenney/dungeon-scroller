# Projectiles — Sprite Sheet Guide

## 1. Asset and contents

This guide describes the final [`projectiles_spritesheet.png`](projectiles_spritesheet.png) for the dungeon fantasy side-scrolling game. It contains thirteen projectile types, each with a six-frame flight loop, a six-frame impact and a six-frame deflection. Physical weapons use weathered wood, steel, slate and copper or bronze accents. The spell colors follow the heroes and undead enemies: sandstone and slate for earth, orange and ivory for fire, mint and ivory for wind, teal and cyan for water, ivory-gold for healing, violet and cyan for space, lavender and violet for mind magic, and pale blue-green for grave energy.

The sheet contains only projectiles and local effects. There are no characters, targets, walls, scenery, floor shadows, labels or grid lines.

| Property | Value |
|---|---|
| Image filename | `projectiles_spritesheet.png` |
| Canvas | 576 × 3744 pixels |
| Grid | 6 columns × 39 rows |
| Extraction size | 96 × 96 pixels for every frame |
| Projectile count | 13; three consecutive rows per projectile |
| Animation count | 39: 13 flight loops, 13 impacts and 13 deflections |
| Frame slots | 234: 221 visible cells and 13 intentionally transparent endings |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native travel direction | Right; rotating weapons and flasks change orientation within their loops |
| Margin and inter-cell spacing | 0 pixels |
| Logical pivot | (48, 48), measured from the top-left cell boundary |
| Impact registration | Local (48, 48) is the hit point or recipient-effect anchor |
| Smallest transparent padding inside a visible cell | 4 pixels |
| PNG file size | 251,590 bytes |
| Verified SHA-256 | `c2221546d81e8c7710a912bb6cc526c6628b7e3e1695c8f0b7dff3e89dc45e7a` |

The **96 × 96 size is the full extraction rectangle**, including transparent padding. It is not the visible projectile size. Preserve all cells at this size so each frame retains its registration. The PNG stores pixels only: clip identifiers, durations, collision shapes, spell rules and state transitions in this guide are implementation suggestions.

### Projectile inventory and measured gameplay scale

The bounds below are the **opaque bounds of flight F1**, in cell-local `(x, y, width, height)` coordinates. They include any visible trail or loose particles and are provided to explain the artwork's relative scale. They are not collision boxes and must not replace the fixed frame pivot.

| Index | Projectile ID | Projectile | Rows | Flight F1 visible bounds |
|---:|---|---|---|---|
| 0 | `arrow` | Arrow | 01–03 | `(28, 44, 41, 10)` |
| 1 | `thrown_dagger` | Thrown dagger | 04–06 | `(36, 43, 26, 10)` |
| 2 | `thrown_shield` | Thrown shield | 07–09 | `(35, 34, 26, 28)` |
| 3 | `thrown_spear` | Thrown spear | 10–12 | `(24, 44, 46, 8)` |
| 4 | `magic_thrown_rock` | Magic thrown rock | 13–15 | `(28, 39, 29, 17)` |
| 5 | `magic_fireball` | Magic fireball | 16–18 | `(14, 35, 42, 26)` |
| 6 | `magic_wind_slash` | Magic wind slash | 19–21 | `(28, 34, 35, 27)` |
| 7 | `magic_water_ball` | Magic water ball | 22–24 | `(32, 39, 25, 18)` |
| 8 | `magic_heal` | Magic heal | 25–27 | `(19, 37, 39, 21)` |
| 9 | `magic_space_attack` | Magic space attack | 28–30 | `(26, 35, 29, 26)` |
| 10 | `magic_mind_attack` | Magic mind attack | 31–33 | `(19, 35, 38, 26)` |
| 11 | `magic_undead_energy_attack` | Magic undead energy attack | 34–36 | `(18, 37, 41, 20)` |
| 12 | `thrown_potion` | Thrown potion | 37–39 | `(38, 32, 20, 25)` |

The spear is longer than the dagger, the shield has a broader body, and magical trails can extend well behind small central cores. Do not enlarge each projectile independently to fill its cell; that would change the intended relationship to the heroes' equipment.

## 2. Coordinates and frame locations

Human-readable **rows, columns and F1–F6 start at 1**. Pixel coordinates, projectile indices, state indices and flattened frame indices start at **0**. The origin is the image's top-left corner; x increases rightward and y increases downward. Rectangles use **`(x, y, width, height)`**, with right and bottom edges excluded.

```text
For human row r = 1…39 and column c = 1…6:
x = (c - 1) * 96
y = (r - 1) * 96
rectangle = (x, y, 96, 96)
frameIndex = (r - 1) * 6 + (c - 1)

For zero-based projectile p = 0…12:
flight row = 3*p + 1
impact row = 3*p + 2
deflection row = 3*p + 3

For zero-based state s = 0 flight, 1 impact, 2 deflection
and zero-based frame f = 0…5:
rowIndex = 3*p + s
flatIndex = 18*p + 6*s + f
rectangle = (96*f, 96*(3*p+s), 96, 96)
```

| Column / sequence frame | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

Examples: arrow impact F1 is **R2 C1**, rectangle **`(0, 96, 96, 96)`**, flat index **6**. Fireball peak-impact F3 is **R17 C3**, rectangle **`(192, 1536, 96, 96)`**, index **98**. The final potion deflection pose is **R39 C6**, rectangle **`(480, 3648, 96, 96)`**, index **233**.

### Complete row catalog

Read every row **F1 → F2 → F3 → F4 → F5 → F6**. Only flight loops. Impact finishes on an empty frame. Deflection finishes on a visible recovery frame and can then resume flight.

| Row | Animation ID | Sequence | y | Flat indices | Playback / finish |
|---:|---|---|---:|---|---|
| 01 | `arrow_flight` | Flight | 0 | 0–5 | Loop F1–F6 |
| 02 | `arrow_impact` | Impact | 96 | 6–11 | Once; empty F6 / remove visual |
| 03 | `arrow_deflection` | Deflection | 192 | 12–17 | Once; visible F6, then flight |
| 04 | `thrown_dagger_flight` | Flight | 288 | 18–23 | Loop F1–F6 |
| 05 | `thrown_dagger_impact` | Impact | 384 | 24–29 | Once; empty F6 / remove visual |
| 06 | `thrown_dagger_deflection` | Deflection | 480 | 30–35 | Once; visible F6, then flight |
| 07 | `thrown_shield_flight` | Flight | 576 | 36–41 | Loop F1–F6 |
| 08 | `thrown_shield_impact` | Impact | 672 | 42–47 | Once; empty F6 / remove visual |
| 09 | `thrown_shield_deflection` | Deflection | 768 | 48–53 | Once; visible F6, then flight |
| 10 | `thrown_spear_flight` | Flight | 864 | 54–59 | Loop F1–F6 |
| 11 | `thrown_spear_impact` | Impact | 960 | 60–65 | Once; empty F6 / remove visual |
| 12 | `thrown_spear_deflection` | Deflection | 1056 | 66–71 | Once; visible F6, then flight |
| 13 | `magic_thrown_rock_flight` | Flight | 1152 | 72–77 | Loop F1–F6 |
| 14 | `magic_thrown_rock_impact` | Impact | 1248 | 78–83 | Once; empty F6 / remove visual |
| 15 | `magic_thrown_rock_deflection` | Deflection | 1344 | 84–89 | Once; visible F6, then flight |
| 16 | `magic_fireball_flight` | Flight | 1440 | 90–95 | Loop F1–F6 |
| 17 | `magic_fireball_impact` | Impact | 1536 | 96–101 | Once; empty F6 / remove visual |
| 18 | `magic_fireball_deflection` | Deflection | 1632 | 102–107 | Once; visible F6, then flight |
| 19 | `magic_wind_slash_flight` | Flight | 1728 | 108–113 | Loop F1–F6 |
| 20 | `magic_wind_slash_impact` | Impact | 1824 | 114–119 | Once; empty F6 / remove visual |
| 21 | `magic_wind_slash_deflection` | Deflection | 1920 | 120–125 | Once; visible F6, then flight |
| 22 | `magic_water_ball_flight` | Flight | 2016 | 126–131 | Loop F1–F6 |
| 23 | `magic_water_ball_impact` | Impact | 2112 | 132–137 | Once; empty F6 / remove visual |
| 24 | `magic_water_ball_deflection` | Deflection | 2208 | 138–143 | Once; visible F6, then flight |
| 25 | `magic_heal_flight` | Flight | 2304 | 144–149 | Loop F1–F6 |
| 26 | `magic_heal_impact` | Impact | 2400 | 150–155 | Once; empty F6 / remove visual |
| 27 | `magic_heal_deflection` | Deflection | 2496 | 156–161 | Once; visible F6, then flight |
| 28 | `magic_space_attack_flight` | Flight | 2592 | 162–167 | Loop F1–F6 |
| 29 | `magic_space_attack_impact` | Impact | 2688 | 168–173 | Once; empty F6 / remove visual |
| 30 | `magic_space_attack_deflection` | Deflection | 2784 | 174–179 | Once; visible F6, then flight |
| 31 | `magic_mind_attack_flight` | Flight | 2880 | 180–185 | Loop F1–F6 |
| 32 | `magic_mind_attack_impact` | Impact | 2976 | 186–191 | Once; empty F6 / remove visual |
| 33 | `magic_mind_attack_deflection` | Deflection | 3072 | 192–197 | Once; visible F6, then flight |
| 34 | `magic_undead_energy_attack_flight` | Flight | 3168 | 198–203 | Loop F1–F6 |
| 35 | `magic_undead_energy_attack_impact` | Impact | 3264 | 204–209 | Once; empty F6 / remove visual |
| 36 | `magic_undead_energy_attack_deflection` | Deflection | 3360 | 210–215 | Once; visible F6, then flight |
| 37 | `thrown_potion_flight` | Flight | 3456 | 216–221 | Loop F1–F6 |
| 38 | `thrown_potion_impact` | Impact | 3552 | 222–227 | Once; empty F6 / remove visual |
| 39 | `thrown_potion_deflection` | Deflection | 3648 | 228–233 | Once; visible F6, then flight |

## 3. Six-frame sequences and suggested timings

The tables describe the visible progression in the delivered sheet. Small glints, shaft vibration and contour changes are subtle at native size. All listed times are **suggested milliseconds for F1–F6**, not an FPS setting or metadata embedded in the PNG. The flight totals describe one loop; impact and deflection totals describe one complete pass.

Every impact begins with contact on F1 and reaches its greatest measured opaque-pixel area at F3. F6 is completely transparent. The visual peak does not determine damage timing: apply the gameplay result when the collision or spell event occurs.

Every deflection keeps a recognizable weapon, flask or spell core, and **F6 is an exact RGBA copy of that projectile's flight F1**. After F6 has been displayed for its duration, resuming at flight F2 avoids showing that same pose for two consecutive frame durations. Starting flight at F1 is also valid if the extra hold is desired.

### 01. Arrow — rows 01–03

A straight wooden arrow with a steel point and muted fletching. The shaft stays nearly horizontal during flight, with small changes in the tail. Its physical contact uses a pale metal spark.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Right-facing shaft | Fletching flutters | Tail shifts slightly | Flutter passes | Fletching settles | Return toward the first tail pose |
| Impact | Arrowhead contacts with a spark | Flash grows around the tip | Largest contact flash | Shaft loses contrast and breaks away | Last small flecks | Fully transparent |
| Deflection | Compact spark at the tip | Shaft cants upward | Counter-wobble | Shaft levels | Wobble settles | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[80, 80, 80, 80, 80, 80]` ms | 480 ms |
| Impact | `[40, 45, 55, 55, 65, 50]` ms | 310 ms |
| Deflection | `[40, 45, 50, 50, 55, 60]` ms | 300 ms |

The arrow's flight pivot lies along the shaft. Its impact row instead registers the arrowhead contact to the cell center. Keep the impact flash at the collision point when changing states; do not retain the flight-center world position by accident.

### 02. Thrown dagger — rows 04–06

The fire mage's compact single-edged dagger, with a copper guard and dark grip. The six flight poses form an end-over-end tumble. The copper detail distinguishes it from the arrow and spear.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Blade points right | First turning pose | Continue through the tumble | Blade points to the opposite side | Continue the second half-turn | Approach the starting spin phase |
| Impact | Blade contact and small spark | Edge glint strengthens | Brightest contact cluster | Dagger and glint diminish | Last steel flecks | Fully transparent |
| Deflection | Sharp contact spark | Dagger turns off-axis | Counter-wobble | Blade levels toward recovery | Turn settles | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[55, 55, 55, 55, 55, 55]` ms | 330 ms |
| Impact | `[40, 45, 55, 55, 60, 45]` ms | 300 ms |
| Deflection | `[35, 40, 45, 45, 50, 55]` ms | 270 ms |

This is a physical thrown dagger without flame. Its spin is already drawn into the frames. Apply a travel heading or an additional game rotation only deliberately; continuously adding another full spin changes the authored motion.

### 03. Thrown shield — rows 07–09

The earth mage's iron-rimmed shield with a slate face and raised bronze boss. Flight turns the shield through its face, edge and back; the boss is visible when its front faces the viewer.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Front face and bronze boss | Face turns obliquely | Narrow edge view | Back turns into view | Return through the edge | Front face approaches the start |
| Impact | Leading-rim contact spark | Compact dust at the rim | Expanded spark and dust | Shield clears into fragments | Last dust grains | Fully transparent |
| Deflection | Rim spark on the intact shield | Shield tilts | Face wobbles back | Narrow edge passes | Front face steadies | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[80, 80, 80, 80, 80, 80]` ms | 480 ms |
| Impact | `[50, 55, 70, 65, 70, 50]` ms | 360 ms |
| Deflection | `[45, 60, 65, 65, 65, 70]` ms | 370 ms |

The full impact row removes the visual. Use deflection when the shield must remain intact and continue moving. A returning or recoverable shield requires a game-controlled return path; the atlas contains no boomerang trajectory.

### 04. Thrown spear — rows 10–12

The water mage's compact spear, with a dark shaft, pale bindings and a leaf-shaped steel point. Flight holds the point to the right with restrained shaft vibration.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Spear points right | Small shaft vibration | Bindings and edge shimmer | Shaft settles through the cycle | Subtle counter-vibration | Return toward the first straight pose |
| Impact | Point contacts; shaft angles up-left | Contact glint and small flecks | Peak point flash | Shaft clears into small fragments | Last contact flecks | Fully transparent |
| Deflection | Spark at the point | Shaft swings downward | Shaft swings back upward | Spear levels | Vibration settles | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[85, 85, 85, 85, 85, 85]` ms | 510 ms |
| Impact | `[40, 45, 60, 55, 60, 50]` ms | 310 ms |
| Deflection | `[40, 50, 55, 60, 60, 65]` ms | 330 ms |

The impact shaft is intentionally canted into the upper-left portion of the cell so its full length fits behind the centered hit point. That drawing is an impact pose, not a flight displacement. The spear remains a physical weapon without water effects.

### 05. Magic thrown rock — rows 13–15

A compact angular stone with slate shadows, warm sandstone highlights and a short trail of grit. Changing facets give its flight a tumbling motion around the stone core.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | First highlighted facet | Stone turns | Next broad facet | Flatter side passes | Angular corner turns forward | Facets return toward the first pose |
| Impact | Stone contacts with a small flash | Core cracks into chunks | Largest fragment and dust spread | Chunks disperse and shrink | Last grit | Fully transparent |
| Deflection | Edge chips at contact | Stone rocks away | Core turns with loose grains | Stone regains shape | Grit clears | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[85, 85, 85, 85, 85, 85]` ms | 510 ms |
| Impact | `[45, 55, 65, 70, 75, 50]` ms | 360 ms |
| Deflection | `[40, 45, 55, 60, 65, 65]` ms | 330 ms |

Keep the stone core as the moving anchor. The grit trails behind it and should not drag the pivot backward. Deflection preserves a recognizable core even though a few grains chip away.

### 06. Magic fireball — rows 16–18

A yellow-white core with orange flame edges and a short trail of red embers. Its bright core remains stable while the flame envelope pulses.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Compact bright core | Flame tail stretches | Flame tongues pulse | Tail curls and shortens | Ember pattern changes | Flame returns toward the first shape |
| Impact | Flame flattens at contact | Short flame fan opens | Largest flame fan | Flame breaks into embers | Last red-orange sparks | Fully transparent |
| Deflection | Compact contact flare | Flame envelope flattens | Embers peel away | Core reforms its flame | Tail settles | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[65, 65, 65, 65, 65, 65]` ms | 390 ms |
| Impact | `[40, 50, 65, 65, 70, 50]` ms | 340 ms |
| Deflection | `[35, 45, 50, 55, 60, 65]` ms | 310 ms |

Row 17 F3 has the sheet's minimum four-pixel edge padding. Preserve the complete cell. The fan is a local contact burst; it does not specify a cone collider or a second area-damage event.

### 07. Magic wind slash — rows 19–21

A thin pale mint-and-ivory crescent with a crisp leading edge and a few trailing wisps. Its small changes suggest moving air without drawing screen travel into the atlas.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Clean crescent edge | Trailing wisps extend | Inner arc shifts | Crescent shimmers | Wisps break into flecks | Return toward the first crescent |
| Impact | Leading edge contacts with a flash | Crescent opens into two arcs | Arcs spread to their visual peak | Arcs break into flecks | Last pale wisps | Fully transparent |
| Deflection | Crescent pinches at contact | Curve compresses | Edge twists outward | Curved blade reforms | Wisps settle | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[60, 60, 60, 60, 60, 60]` ms | 360 ms |
| Impact | `[35, 45, 55, 55, 65, 45]` ms | 300 ms |
| Deflection | `[35, 40, 45, 50, 55, 60]` ms | 285 ms |

Use the crescent as a directional projectile. Its changing wisps are part of the visual, not a changing collision radius. Keep the pale edge on a normal alpha-blended layer unless the game intentionally adds another lighting treatment.

### 08. Magic water ball — rows 22–24

A rounded teal orb with a cyan rim, pale foam pixels and a short droplet trail. The surface ripples while the orb's core stays registered.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Rounded teal orb | Rim ripple turns | Foam highlight moves | Surface undulates | Droplets change | Return toward the first ripple |
| Impact | Orb flattens at contact | Splash opens | Largest splash and droplet spread | Droplets separate and fall | Last small drops | Fully transparent |
| Deflection | Orb squashes with a glint | Compressed water mass | A few droplets shed | Rounded body reforms | Rim steadies | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[85, 85, 85, 85, 85, 85]` ms | 510 ms |
| Impact | `[45, 55, 65, 70, 75, 50]` ms | 360 ms |
| Deflection | `[40, 50, 60, 65, 70, 75]` ms | 360 ms |

Flight and deflection remain anchored to the orb, not the trailing droplets. The impact splash clears entirely; it does not create persistent water on the floor.

### 09. Magic heal — rows 25–27

An ivory-gold mote inside a small pulsing ring, with a short warm trail. Its impact becomes a restorative bloom rather than a damaging explosion.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Ivory mote and gold ring | Ring brightens | Ring pulses outward | Glow steadies | Warm trail changes | Return toward the first pulse |
| Impact | Warm light blooms on the recipient | Thin ring forms beneath the central mote | Ring widens with rising lights | Ring and lights diminish | Last rising gold lights | Fully transparent |
| Deflection | Ring compresses into a bright point | Compact mote remains | Ring begins reopening | Ring widens around the core | Normal pulse returns | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[100, 100, 100, 100, 100, 100]` ms | 600 ms |
| Impact | `[70, 85, 110, 110, 125, 80]` ms | 580 ms |
| Deflection | `[50, 60, 75, 80, 90, 95]` ms | 450 ms |

Place impact at a chosen recipient attachment point. The horizontal healing ring lies a little below the central flare within the drawing; do not snap the whole effect to a floor baseline. No recipient is painted into the frame. Healing amount, eligibility and application time belong to the game.

### 10. Magic space attack — rows 28–30

A compact violet rift with a cyan edge and dark center. The rim ripples around the dark opening, with a few nearby violet and cyan flecks.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Small clean rift | Cyan rim shifts | Violet edge ripples | Opening subtly changes shape | Nearby flecks move | Return toward the first outline |
| Impact | Compact rift contact | Opening expands | Largest open rift | Rift contracts inward | Last violet-cyan flecks | Fully transparent |
| Deflection | Rift skews at contact | Offset echo appears | Opening leans and distorts | Contours draw together | Clean opening returns | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[80, 80, 80, 80, 80, 80]` ms | 480 ms |
| Impact | `[45, 60, 80, 65, 70, 50]` ms | 370 ms |
| Deflection | `[40, 55, 60, 65, 70, 70]` ms | 360 ms |

Register the effect to the rift's dark opening, not to the outermost cyan pixel. The dark center is intentional color information; a pure additive blend can erase it and change the spell's appearance.

### 11. Magic mind attack — rows 31–33

A restrained lavender pulse with offset violet contours and a narrow distortion between them. Its impact uses two small ring contours, with no enemy or head drawn.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Paired thin contours | Leading contour shimmers | Offset spacing changes subtly | Lavender edge pulses | Trailing flecks diminish | Return toward the first pulse |
| Impact | Small lavender contact flare | Paired rings gather | Rings reach their visual peak | Contours diminish | Last violet flecks | Fully transparent |
| Deflection | Contours pinch with a flash | Pulse narrows | Contours split and twist | Edges draw back together | Traveling pulse reforms | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[90, 90, 90, 90, 90, 90]` ms | 540 ms |
| Impact | `[45, 65, 80, 75, 80, 55]` ms | 400 ms |
| Deflection | `[40, 50, 60, 60, 70, 70]` ms | 350 ms |

Use a target-head socket for impact placement. If the dark swordsman's existing Mind Hex remains an immediate targeted spell, spawn this impact row directly at the target and skip flight. Providing a traveling pulse here does not require changing that attack's gameplay.

### 12. Magic undead energy attack — rows 34–36

A pale blue-green grave bolt with a dim charcoal core and a ragged tail of spectral sparks. The dark core stays distinct from the bright rim.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Grave bolt and ragged tail | Spectral tail flickers | Rim sharpens | Tail shifts | Sparks peel away | Return toward the first bolt |
| Impact | Small grave-light contact | Jagged flare expands | Largest blue-green burst | Burst breaks into dim motes | Last spectral sparks | Fully transparent |
| Deflection | Compact contact flash | Outer light peels away | Core remains under the sparks | Bright rim reforms | Tail settles | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[75, 75, 75, 75, 75, 75]` ms | 450 ms |
| Impact | `[45, 55, 75, 70, 75, 50]` ms | 370 ms |
| Deflection | `[40, 50, 55, 60, 65, 70]` ms | 340 ms |

Keep the charcoal core intact during a rebound. The bolt is an enemy-style grave-magic visual; damage, allegiance, reflection ownership and target rules are separate state maintained by the game.

### 13. Thrown potion — rows 37–39

A round corked glass flask containing amber liquid. The neck rotates around the flask's rounded belly, and the highlights and liquid shapes change through the tumble.

| Sequence | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| Flight | Cork and neck upright | Flask rotates diagonally | Neck passes toward the side | Flask turns upside down | Rotation continues through the other side | Return toward the upright phase |
| Impact | Glass contact glint | Flask breaks into amber splash and shards | Largest splash and shard spread | Fragments separate and fade | Last droplets and glass flecks | Fully transparent |
| Deflection | Small glass glint; flask intact | Sealed flask tilts away | Counter-wobble | Belly steadies | Neck returns toward upright | Exact flight F1 |

| Sequence | Suggested durations, F1–F6 | Total |
|---|---|---:|
| Flight | `[85, 85, 85, 85, 85, 85]` ms | 510 ms |
| Impact | `[45, 55, 65, 75, 80, 55]` ms | 375 ms |
| Deflection | `[45, 60, 70, 70, 75, 80]` ms | 400 ms |

Deflection leaves the cork, flask and liquid intact. Impact consumes the drawn flask and ends empty. Amber liquid is a visual choice; the game decides whether the potion heals, harms, applies a status or has another effect.

## 4. Building and playing the sequences

### Import and slice

1. Import the original PNG at **576 × 3744**, retaining its alpha channel and native dimensions. Use point/nearest-neighbor sampling.
2. Slice a regular grid of **96 × 96** frames, with offset **(0, 0)**, margin **0**, spacing **0**, six columns and thirty-nine rows.
3. Preserve all **234 logical cells**, including the thirteen blank impact endings. Disable automatic deletion of transparent frames and automatic cropping to each visible silhouette.
4. Give every frame the same logical pivot, **(48, 48)**. Its normalized position is **(0.5, 0.5)** in either a top-origin or bottom-origin normalized convention.
5. Build the thirty-nine clips from the catalog. Use six ordered frames per clip. Set flight to repeat and impact/deflection to play once.
6. Maintain world position, velocity, collisions and allegiance outside the animation. Choose each visual state's world anchor using the next table.

### World anchors and contact placement

The logical pivot is fixed, but the meaning of its world position changes when an impact begins.

| State or effect | Place local (48, 48) at | What the game supplies |
|---|---|---|
| Flight | The moving weapon center, flask belly or spell core | Position, velocity, heading and lifetime |
| Deflection | The continuing projectile's body/core center | Rebound direction, separation from the surface and any travel |
| Ordinary impact | The resolved world collision contact | A stationary impact origin and an optional surface/incoming orientation |
| Healing impact | A recipient healing socket | Recipient selection and optional attachment while the recipient moves |
| Mind impact | A target-head socket | Target position and optional attachment while the head moves |

For an unrotated frame drawn at scale `k`, its top-left destination is `(anchorX - 48*k, anchorY - 48*k)`. Rotate around the anchor, not around the cell's top-left. Do not center the art using its bounding box on each frame: trails, sparks, splashes and spin phases change those bounds.

**An impact is not a continuation of the flight-center placement.** An arrow's point is ahead of its flight pivot. When it hits, the impact row already puts that point at local (48, 48). Draw the impact there at the actual contact position rather than at the old arrow-center position. The same distinction applies to the spear point and shield rim.

Deflection retains body-center registration, so its contact glint may be away from (48, 48). Preserve the projectile center resolved at collision instead of moving that center onto the surface hit point. For precise per-frame contact, author a local socket and use:

```text
bodyCenterWorld = hitPointWorld - R(angle) * (contactSocketLocal - (48,48)) * scale
```

Here `R(angle)` rotates the local offset into world space. Contact sockets and colliders are not supplied by the PNG. For most directional shots, a small capsule, circle or line segment can be authored separately from the trail. Apply any new rebound heading consistently to both the rendered frame and the collision/socket model.

### State transitions and game events

| Current state / event | Visual action | Gameplay action |
|---|---|---|
| Spawn | Start flight F1 at the launch socket | Set position, velocity, owner and collision rules |
| Traveling | Loop flight F1–F6 | Move the projectile independently of the animation clock |
| Successful contact | Begin impact F1 at the contact/recipient anchor | Apply damage, healing or status once; disable the consumed projectile's repeated contacts |
| Impact completes | Hold empty F6 or release the visual to a pool | Finish only the visual lifetime; do not apply the effect again |
| Deflectable contact | Begin deflection F1 while preserving the body-center anchor | Resolve rebound velocity, ownership changes and separation/collision cooldown |
| Deflection completes | Continue with flight F2, or F1 for an extra identical hold | Keep the same live projectile and continue the rebound trajectory |
| Lifetime expires without contact | Remove the projectile or use a game-selected effect | There is no separate timeout row in this atlas |

Impact and deflection are **alternative outcomes**, not an eighteen-frame chain. Do not play flight, then impact, then deflection automatically. A collision resolver decides which outcome applies. If the art is shown in an asset viewer, preview the three rows independently.

Damage and healing should be dispatched from game events rather than inferred from animation brightness. A renderer may skip intermediate frames during a slow update, and an impact may remain visible for many render calls. Neither situation should change the number of hits.

### JavaScript example: clip descriptors, sampling and drawing

This example uses plain JavaScript and Canvas-style drawing. It assumes the original PNG has already been loaded into `image`. The numerical specifications match the row catalog and the suggested timings above. The animation helpers do not perform physics, collision detection, target selection or image loading.

```javascript
const PROJECTILE_CELL = 96;
const PROJECTILE_COLUMNS = 6;
const PROJECTILE_PIVOT = { x: 48, y: 48 };
const PROJECTILE_STATES = ["flight", "impact", "deflection"];

// The array order is the zero-based projectile index.
// Each entry is [id, flight durations, impact durations, deflection durations].
const projectileSpecs = [
  ["arrow",[80,80,80,80,80,80],[40,45,55,55,65,50],[40,45,50,50,55,60]],
  ["thrown_dagger",[55,55,55,55,55,55],[40,45,55,55,60,45],[35,40,45,45,50,55]],
  ["thrown_shield",[80,80,80,80,80,80],[50,55,70,65,70,50],[45,60,65,65,65,70]],
  ["thrown_spear",[85,85,85,85,85,85],[40,45,60,55,60,50],[40,50,55,60,60,65]],
  ["magic_thrown_rock",[85,85,85,85,85,85],[45,55,65,70,75,50],[40,45,55,60,65,65]],
  ["magic_fireball",[65,65,65,65,65,65],[40,50,65,65,70,50],[35,45,50,55,60,65]],
  ["magic_wind_slash",[60,60,60,60,60,60],[35,45,55,55,65,45],[35,40,45,50,55,60]],
  ["magic_water_ball",[85,85,85,85,85,85],[45,55,65,70,75,50],[40,50,60,65,70,75]],
  ["magic_heal",[100,100,100,100,100,100],[70,85,110,110,125,80],[50,60,75,80,90,95]],
  ["magic_space_attack",[80,80,80,80,80,80],[45,60,80,65,70,50],[40,55,60,65,70,70]],
  ["magic_mind_attack",[90,90,90,90,90,90],[45,65,80,75,80,55],[40,50,60,60,70,70]],
  ["magic_undead_energy_attack",[75,75,75,75,75,75],[45,55,75,70,75,50],[40,50,55,60,65,70]],
  ["thrown_potion",[85,85,85,85,85,85],[45,55,65,75,80,55],[45,60,70,70,75,80]],
];

const PROJECTILE_ANIMATIONS = {};
projectileSpecs.forEach(([id, ...timings], projectileIndex) => {
  PROJECTILE_STATES.forEach((state, stateIndex) => {
    const row0 = 3 * projectileIndex + stateIndex;
    const frames = timings[stateIndex].map((durationMs, frame0) => ({
      number: frame0 + 1,
      index: row0 * PROJECTILE_COLUMNS + frame0,
      rect: {
        x: frame0 * PROJECTILE_CELL,
        y: row0 * PROJECTILE_CELL,
        width: PROJECTILE_CELL,
        height: PROJECTILE_CELL
      },
      durationMs
    }));
    PROJECTILE_ANIMATIONS[id + "_" + state] = {
      id, state, row: row0 + 1, loop: state === "flight", frames,
      durationMs: frames.reduce((total, frame) => total + frame.durationMs, 0)
    };
  });
});

function getProjectileClip(id, state) {
  const clip = PROJECTILE_ANIMATIONS[id + "_" + state];
  if (!clip) throw new Error("Unknown projectile clip: " + id + "_" + state);
  return clip;
}

function sampleProjectileClip(clip, elapsedMs) {
  if (!Number.isFinite(elapsedMs)) throw new Error("Invalid elapsed time");
  const elapsed = Math.max(0, elapsedMs);
  const complete = !clip.loop && elapsed >= clip.durationMs;
  if (complete) return { frame: clip.frames[5], complete: true };
  let t = clip.loop ? elapsed % clip.durationMs : elapsed;
  for (const frame of clip.frames) {
    if (t < frame.durationMs) return { frame, complete: false };
    t -= frame.durationMs;
  }
  return { frame: clip.frames[5], complete: false };
}

function beginProjectileState(visual, state) {
  getProjectileClip(visual.id, state); // Validate before changing the state.
  visual.state = state;
  visual.elapsedMs = 0;
  visual.done = false;
}

function advanceProjectileVisual(visual, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new Error("deltaMs must be a finite, nonnegative number");
  }
  let clip = getProjectileClip(visual.id, visual.state);
  if (visual.done) return sampleProjectileClip(clip, visual.elapsedMs);
  visual.elapsedMs += deltaMs;

  if (visual.state === "deflection" && visual.elapsedMs >= clip.durationMs) {
    const carryMs = visual.elapsedMs - clip.durationMs;
    visual.state = "flight";
    clip = getProjectileClip(visual.id, "flight");
    // Deflection F6 already displayed the exact flight F1 pixels.
    // Continue at F2 and preserve any time beyond the transition.
    visual.elapsedMs = clip.frames[0].durationMs + carryMs;
  }

  const sample = sampleProjectileClip(clip, visual.elapsedMs);
  if (visual.state === "impact" && sample.complete) visual.done = true;
  return sample;
}

function drawProjectile(ctx, image, frame, anchorX, anchorY,
                        angleRadians = 0, scale = 1) {
  const r = frame.rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(angleRadians);
  ctx.scale(scale, scale);
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    -PROJECTILE_PIVOT.x, -PROJECTILE_PIVOT.y,
    PROJECTILE_CELL, PROJECTILE_CELL);
  ctx.restore();
}

// A live visual begins at flight F1.
const visual = {
  id: "magic_fireball", state: "flight", elapsedMs: 0, done: false
};
const first = advanceProjectileVisual(visual, 0);
// drawProjectile(ctx, image, first.frame, bodyCenter.x, bodyCenter.y);

// At a resolved hit, set the visual's world anchor to hitPoint separately,
// apply the gameplay result once, and begin the impact row:
// beginProjectileState(visual, "impact");
//
// At a deflection, retain the collision-resolved body center, resolve the
// rebound in game logic, and call beginProjectileState(visual, "deflection").
```

Draw using the returned frame until `visual.done` becomes true, then remove or pool the completed impact visual. The blank F6 has its own duration before completion. A completed impact continues to sample that empty frame if retained. Flight never sets `done`; the game decides its lifetime.

The sampler automatically returns deflection to flight at F2. If an extra recovery hold is wanted, change the transition time to `carryMs` so it starts flight at F1 instead. Reset the clock whenever a new impact or deflection is accepted. The game must also update the anchor and travel heading; changing the animation row alone does not move a projectile.

## 5. Important integration notes

### Verified empty frames and recovery relationships

The following results were checked against the complete RGBA pixels of the delivered PNG. Every listed impact ending contains only **(0, 0, 0, 0)** pixels. Every listed deflection ending is exactly equal to its own first flight frame, including trails and all transparent pixels.

| Projectile | Empty impact F6 | Empty flat index | Deflection F6 = flight F1 | Flat index equality |
|---|---|---:|---|---|
| Arrow | R2 C6 | 11 | R3 C6 = R1 C1 | 17 = 0 |
| Thrown dagger | R5 C6 | 29 | R6 C6 = R4 C1 | 35 = 18 |
| Thrown shield | R8 C6 | 47 | R9 C6 = R7 C1 | 53 = 36 |
| Thrown spear | R11 C6 | 65 | R12 C6 = R10 C1 | 71 = 54 |
| Magic thrown rock | R14 C6 | 83 | R15 C6 = R13 C1 | 89 = 72 |
| Magic fireball | R17 C6 | 101 | R18 C6 = R16 C1 | 107 = 90 |
| Magic wind slash | R20 C6 | 119 | R21 C6 = R19 C1 | 125 = 108 |
| Magic water ball | R23 C6 | 137 | R24 C6 = R22 C1 | 143 = 126 |
| Magic heal | R26 C6 | 155 | R27 C6 = R25 C1 | 161 = 144 |
| Magic space attack | R29 C6 | 173 | R30 C6 = R28 C1 | 179 = 162 |
| Magic mind attack | R32 C6 | 191 | R33 C6 = R31 C1 | 197 = 180 |
| Magic undead energy attack | R35 C6 | 209 | R36 C6 = R34 C1 | 215 = 198 |
| Thrown potion | R38 C6 | 227 | R39 C6 = R37 C1 | 233 = 216 |

The flat indices in the last column refer to different atlas cells whose contents are equal; they are not interchangeable numeric addresses. If an importer deduplicates identical texture storage, it must still preserve each logical frame and its duration.

Only the deflection endpoint equality is guaranteed. Do not assume flight F6 equals flight F1: the loop uses successive spin, shimmer or trail phases. In particular, the dagger and potion have intentional end-over-end motion, and the shield alternates its visible face and edge.

### Pivots, scale and collision

The fixed (48, 48) pivot is a logical registration point. It does not mean the center of the opaque bounds, the brightest pixel or the particle centroid is exactly (48, 48) in every pose. The weapon/core is registered to that point, with normal pixel-level changes from rotation, shape deformation and raster alignment.

There is **no common ground line** for this sheet. Flight and deflection are drawn around a center, and impacts are drawn around their contact. Do not bottom-align splashes, fragments or shafts. The small local movements in the frames are visual motion; the game separately controls translation, arcs, bounces and rebound distance.

Use authored collision geometry rather than the entire 96 × 96 cell or each frame's changing alpha bounds. Grit, embers, water droplets, wind wisps and contact flashes should not accidentally enlarge a shot's reach. For fast projectiles, the collision system should account for the distance traveled between updates rather than relying on one rendered pose.

If a deflection would immediately collide with the same surface again, resolve the projectile's separation and collision policy in game logic. Do not hide that problem by translating the artwork away from its pivot. Reflection may also change ownership or eligible targets; those properties are not encoded by the effect color.

### Recipient effects and launch effects

Healing and mind impacts contain no recipient. A healing socket can be attached to the torso or another intended effect center, and a mind socket should follow the target's head. Decide whether each effect stays at the original hit position or follows the recipient while it plays. Either policy can use the same frames without changing their internal alignment.

Hero casting animations already contain small local launch flashes. Spawn traveling projectiles from the appropriate hand, staff or weapon socket when the game releases the attack, and let the caster's remaining local effect finish independently. This sheet has no caster windup, hand pose or melee animation.

Mind Hex can remain a direct targeted attack: trigger its target-side impact on the existing spell-release event and omit the flight row. A heal can likewise use only its recipient impact when no traveling mote is needed. The physical arrow, dagger, shield and spear can be used without adding their owner's elemental magic.

The thrown potion's impact is only the flask break, amber splash and glass fragments. It does not include a separate healing ring, persistent pool or area marker. Spawn any additional game effect explicitly if that potion's rules call for it.

### Pixel rendering, transparency and atlas handling

The exported alpha channel uses only 0 and 255. Dissolves and fades are drawn through changing colors, smaller shapes and fewer pixels rather than a soft alpha blur. Use ordinary alpha compositing as the baseline. The dark cores of space and undead energy and the dark material details on weapons are meaningful parts of the art.

Keep nearest-neighbor sampling and prefer integer display scales and aligned draw positions when possible. Arbitrary engine rotation may change the raster silhouette even with smoothing disabled; the dagger, shield and potion already include rotation phases in the atlas. Apply an additional continuous spin only if it is part of the chosen game behavior.

There are no gutters between cells. Every visible pose has transparent padding, with a minimum of **four pixels in fireball impact R17 C3**. If a texture pipeline requires filtering or mipmaps, repack with suitable gutters/extrusion while preserving each frame's original 96 × 96 logical size and (48, 48) pivot. Do not change this source sheet's grid or rescale the whole tall atlas to meet an importer limit.

The texture is 3744 pixels tall. Confirm that the chosen runtime and import settings preserve that height. If an engine requires smaller textures, extract the thirteen complete **576 × 288** projectile strips without resizing. Preserve the same cell dimensions and convert each global row into its local strip row; the source row map in this guide still identifies the original data.

### What the file does and does not encode

The artwork supplies projectile identity, six-frame visual sequences, color, local deformation, contact flashes and transparent endings. It does not specify speed, range, gravity, damage, healing amount, knockback, homing, blocking rules, collision masks, surface normals, target selection, sound or gameplay timing. The suggested millisecond values are starting choices and can be tuned without changing any atlas coordinates.

Keep the digest in section 1 with your asset records if multiple exports circulate. It identifies the exact PNG documented here. The Markdown and PNG can be kept together so the relative asset link at the top opens the matching image.

## 6. Exact rectangle appendix

Every entry is **`(x, y, 96, 96)`** in the original PNG. These are complete frame rectangles, including transparent padding. F1–F6 is the playback order; the intentionally empty impact F6 cells are valid rectangles and remain in the table.

| Row / animation | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|
| 01 `arrow_flight` | `(0, 0, 96, 96)` | `(96, 0, 96, 96)` | `(192, 0, 96, 96)` | `(288, 0, 96, 96)` | `(384, 0, 96, 96)` | `(480, 0, 96, 96)` |
| 02 `arrow_impact` | `(0, 96, 96, 96)` | `(96, 96, 96, 96)` | `(192, 96, 96, 96)` | `(288, 96, 96, 96)` | `(384, 96, 96, 96)` | `(480, 96, 96, 96)` |
| 03 `arrow_deflection` | `(0, 192, 96, 96)` | `(96, 192, 96, 96)` | `(192, 192, 96, 96)` | `(288, 192, 96, 96)` | `(384, 192, 96, 96)` | `(480, 192, 96, 96)` |
| 04 `thrown_dagger_flight` | `(0, 288, 96, 96)` | `(96, 288, 96, 96)` | `(192, 288, 96, 96)` | `(288, 288, 96, 96)` | `(384, 288, 96, 96)` | `(480, 288, 96, 96)` |
| 05 `thrown_dagger_impact` | `(0, 384, 96, 96)` | `(96, 384, 96, 96)` | `(192, 384, 96, 96)` | `(288, 384, 96, 96)` | `(384, 384, 96, 96)` | `(480, 384, 96, 96)` |
| 06 `thrown_dagger_deflection` | `(0, 480, 96, 96)` | `(96, 480, 96, 96)` | `(192, 480, 96, 96)` | `(288, 480, 96, 96)` | `(384, 480, 96, 96)` | `(480, 480, 96, 96)` |
| 07 `thrown_shield_flight` | `(0, 576, 96, 96)` | `(96, 576, 96, 96)` | `(192, 576, 96, 96)` | `(288, 576, 96, 96)` | `(384, 576, 96, 96)` | `(480, 576, 96, 96)` |
| 08 `thrown_shield_impact` | `(0, 672, 96, 96)` | `(96, 672, 96, 96)` | `(192, 672, 96, 96)` | `(288, 672, 96, 96)` | `(384, 672, 96, 96)` | `(480, 672, 96, 96)` |
| 09 `thrown_shield_deflection` | `(0, 768, 96, 96)` | `(96, 768, 96, 96)` | `(192, 768, 96, 96)` | `(288, 768, 96, 96)` | `(384, 768, 96, 96)` | `(480, 768, 96, 96)` |
| 10 `thrown_spear_flight` | `(0, 864, 96, 96)` | `(96, 864, 96, 96)` | `(192, 864, 96, 96)` | `(288, 864, 96, 96)` | `(384, 864, 96, 96)` | `(480, 864, 96, 96)` |
| 11 `thrown_spear_impact` | `(0, 960, 96, 96)` | `(96, 960, 96, 96)` | `(192, 960, 96, 96)` | `(288, 960, 96, 96)` | `(384, 960, 96, 96)` | `(480, 960, 96, 96)` |
| 12 `thrown_spear_deflection` | `(0, 1056, 96, 96)` | `(96, 1056, 96, 96)` | `(192, 1056, 96, 96)` | `(288, 1056, 96, 96)` | `(384, 1056, 96, 96)` | `(480, 1056, 96, 96)` |
| 13 `magic_thrown_rock_flight` | `(0, 1152, 96, 96)` | `(96, 1152, 96, 96)` | `(192, 1152, 96, 96)` | `(288, 1152, 96, 96)` | `(384, 1152, 96, 96)` | `(480, 1152, 96, 96)` |
| 14 `magic_thrown_rock_impact` | `(0, 1248, 96, 96)` | `(96, 1248, 96, 96)` | `(192, 1248, 96, 96)` | `(288, 1248, 96, 96)` | `(384, 1248, 96, 96)` | `(480, 1248, 96, 96)` |
| 15 `magic_thrown_rock_deflection` | `(0, 1344, 96, 96)` | `(96, 1344, 96, 96)` | `(192, 1344, 96, 96)` | `(288, 1344, 96, 96)` | `(384, 1344, 96, 96)` | `(480, 1344, 96, 96)` |
| 16 `magic_fireball_flight` | `(0, 1440, 96, 96)` | `(96, 1440, 96, 96)` | `(192, 1440, 96, 96)` | `(288, 1440, 96, 96)` | `(384, 1440, 96, 96)` | `(480, 1440, 96, 96)` |
| 17 `magic_fireball_impact` | `(0, 1536, 96, 96)` | `(96, 1536, 96, 96)` | `(192, 1536, 96, 96)` | `(288, 1536, 96, 96)` | `(384, 1536, 96, 96)` | `(480, 1536, 96, 96)` |
| 18 `magic_fireball_deflection` | `(0, 1632, 96, 96)` | `(96, 1632, 96, 96)` | `(192, 1632, 96, 96)` | `(288, 1632, 96, 96)` | `(384, 1632, 96, 96)` | `(480, 1632, 96, 96)` |
| 19 `magic_wind_slash_flight` | `(0, 1728, 96, 96)` | `(96, 1728, 96, 96)` | `(192, 1728, 96, 96)` | `(288, 1728, 96, 96)` | `(384, 1728, 96, 96)` | `(480, 1728, 96, 96)` |
| 20 `magic_wind_slash_impact` | `(0, 1824, 96, 96)` | `(96, 1824, 96, 96)` | `(192, 1824, 96, 96)` | `(288, 1824, 96, 96)` | `(384, 1824, 96, 96)` | `(480, 1824, 96, 96)` |
| 21 `magic_wind_slash_deflection` | `(0, 1920, 96, 96)` | `(96, 1920, 96, 96)` | `(192, 1920, 96, 96)` | `(288, 1920, 96, 96)` | `(384, 1920, 96, 96)` | `(480, 1920, 96, 96)` |
| 22 `magic_water_ball_flight` | `(0, 2016, 96, 96)` | `(96, 2016, 96, 96)` | `(192, 2016, 96, 96)` | `(288, 2016, 96, 96)` | `(384, 2016, 96, 96)` | `(480, 2016, 96, 96)` |
| 23 `magic_water_ball_impact` | `(0, 2112, 96, 96)` | `(96, 2112, 96, 96)` | `(192, 2112, 96, 96)` | `(288, 2112, 96, 96)` | `(384, 2112, 96, 96)` | `(480, 2112, 96, 96)` |
| 24 `magic_water_ball_deflection` | `(0, 2208, 96, 96)` | `(96, 2208, 96, 96)` | `(192, 2208, 96, 96)` | `(288, 2208, 96, 96)` | `(384, 2208, 96, 96)` | `(480, 2208, 96, 96)` |
| 25 `magic_heal_flight` | `(0, 2304, 96, 96)` | `(96, 2304, 96, 96)` | `(192, 2304, 96, 96)` | `(288, 2304, 96, 96)` | `(384, 2304, 96, 96)` | `(480, 2304, 96, 96)` |
| 26 `magic_heal_impact` | `(0, 2400, 96, 96)` | `(96, 2400, 96, 96)` | `(192, 2400, 96, 96)` | `(288, 2400, 96, 96)` | `(384, 2400, 96, 96)` | `(480, 2400, 96, 96)` |
| 27 `magic_heal_deflection` | `(0, 2496, 96, 96)` | `(96, 2496, 96, 96)` | `(192, 2496, 96, 96)` | `(288, 2496, 96, 96)` | `(384, 2496, 96, 96)` | `(480, 2496, 96, 96)` |
| 28 `magic_space_attack_flight` | `(0, 2592, 96, 96)` | `(96, 2592, 96, 96)` | `(192, 2592, 96, 96)` | `(288, 2592, 96, 96)` | `(384, 2592, 96, 96)` | `(480, 2592, 96, 96)` |
| 29 `magic_space_attack_impact` | `(0, 2688, 96, 96)` | `(96, 2688, 96, 96)` | `(192, 2688, 96, 96)` | `(288, 2688, 96, 96)` | `(384, 2688, 96, 96)` | `(480, 2688, 96, 96)` |
| 30 `magic_space_attack_deflection` | `(0, 2784, 96, 96)` | `(96, 2784, 96, 96)` | `(192, 2784, 96, 96)` | `(288, 2784, 96, 96)` | `(384, 2784, 96, 96)` | `(480, 2784, 96, 96)` |
| 31 `magic_mind_attack_flight` | `(0, 2880, 96, 96)` | `(96, 2880, 96, 96)` | `(192, 2880, 96, 96)` | `(288, 2880, 96, 96)` | `(384, 2880, 96, 96)` | `(480, 2880, 96, 96)` |
| 32 `magic_mind_attack_impact` | `(0, 2976, 96, 96)` | `(96, 2976, 96, 96)` | `(192, 2976, 96, 96)` | `(288, 2976, 96, 96)` | `(384, 2976, 96, 96)` | `(480, 2976, 96, 96)` |
| 33 `magic_mind_attack_deflection` | `(0, 3072, 96, 96)` | `(96, 3072, 96, 96)` | `(192, 3072, 96, 96)` | `(288, 3072, 96, 96)` | `(384, 3072, 96, 96)` | `(480, 3072, 96, 96)` |
| 34 `magic_undead_energy_attack_flight` | `(0, 3168, 96, 96)` | `(96, 3168, 96, 96)` | `(192, 3168, 96, 96)` | `(288, 3168, 96, 96)` | `(384, 3168, 96, 96)` | `(480, 3168, 96, 96)` |
| 35 `magic_undead_energy_attack_impact` | `(0, 3264, 96, 96)` | `(96, 3264, 96, 96)` | `(192, 3264, 96, 96)` | `(288, 3264, 96, 96)` | `(384, 3264, 96, 96)` | `(480, 3264, 96, 96)` |
| 36 `magic_undead_energy_attack_deflection` | `(0, 3360, 96, 96)` | `(96, 3360, 96, 96)` | `(192, 3360, 96, 96)` | `(288, 3360, 96, 96)` | `(384, 3360, 96, 96)` | `(480, 3360, 96, 96)` |
| 37 `thrown_potion_flight` | `(0, 3456, 96, 96)` | `(96, 3456, 96, 96)` | `(192, 3456, 96, 96)` | `(288, 3456, 96, 96)` | `(384, 3456, 96, 96)` | `(480, 3456, 96, 96)` |
| 38 `thrown_potion_impact` | `(0, 3552, 96, 96)` | `(96, 3552, 96, 96)` | `(192, 3552, 96, 96)` | `(288, 3552, 96, 96)` | `(384, 3552, 96, 96)` | `(480, 3552, 96, 96)` |
| 39 `thrown_potion_deflection` | `(0, 3648, 96, 96)` | `(96, 3648, 96, 96)` | `(192, 3648, 96, 96)` | `(288, 3648, 96, 96)` | `(384, 3648, 96, 96)` | `(480, 3648, 96, 96)` |

The last rectangle ends exactly at x = 576 and y = 3744. Clip identifiers, suggested durations and helper names may be renamed to fit the game; preserve the row order, six logical frames per sequence, fixed pivot and endpoint behavior.
