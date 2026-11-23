# Building Blocks — Collectible Card Guide

## 1. Asset summary

This guide describes **`building_blocks_card.png`**, the finished collectible object card for Building Blocks. It is one complete illustration, with the card viewed straight-on and filling the canvas edge to edge. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `building_blocks_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with textured surfaces, shaded clusters and warm highlights |
| Object view | Three-quarter view of a wooden block arch with a loose beam in front |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `7c63a3189302f03c51c9d24447611e98471a3829b1701212c0fb2ccd2a38ab5e` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single static card illustration; there is no animation grid or frame sequence. Gameplay sprites and their animation frames, if used by the game, are separate assets.

## 2. Picture description

### Block structure

Four wooden cubes form two upright pillars. Each pillar has one natural golden-brown cube at the bottom and one faded-red cube above it. A single large teal wooden arch rests across the two red cubes. The arch has a broad, nearly flat upper surface and a rounded opening underneath, leaving a clear passage between the pillars. The five assembled pieces are the main focal element.

The structure occupies the upper and middle parts of the composition. Its three-quarter view shows the front faces and portions of the top and side surfaces, giving each piece visible depth. The left pillar sits farther down the picture than the right pillar, following the perspective of the wooden surface. The opening beneath the arch remains unobstructed, with the dark planks visible through it.

### Wood surfaces and loose beam

The cubes and arch have rounded, worn corners, visible grain and small cracks. The teal and faded-red paint is rubbed away along edges and scattered patches, exposing warm wood beneath. Strong amber light catches the upper and left edges, while the sides and opening carry deeper brown and blue shadows. These surface details make the pieces read as substantial wooden building blocks.

A separate natural-wood rectangular beam lies across the lower-left foreground, angled slightly downward toward the right. Its long top face, front face and short end are visible. Like the assembled blocks, it has rounded corners, fine grain and bright warm edge highlights. It remains to the left of the reserved text region. Together, the scene contains four cubes, one arch piece and this one loose beam.

### Background and card frame

The blocks stand on a dark wooden surface in a warm tavern setting. A glowing hanging lantern at upper left lights timber supports, metal fittings, stone walls and the planks beneath the blocks. A broad stone arch recedes into the upper background, where a small distant amber light and dark interior details remain subordinate to the wooden structure. The detailed wood surface fades into a smooth, very dark midnight-blue field toward the lower right.

A thin antique-gold border follows the card perimeter. A stacked-cube motif decorates the upper-left corner, and an arch-block motif sits at the upper right. Small gold star-like ornaments accent the lower corners. The lower-right corner ornament remains beyond the reserved text rectangle, near the outside corner. There are no names, numbers, captions, logos or placeholder text in the image.

## 3. Reserved text rectangle

### Coordinate convention

Coordinates use the **top-left image boundary as `(0, 0)`**, with x increasing to the right and y increasing downward. Coordinates are zero-based. The rectangle includes its left and top edges and excludes its right and bottom edges.

**Canonical rectangle: `(x: 450, y: 952, width: 490, height: 364)` pixels.**

| Measurement | Pixels | Fraction of the complete image |
|---|---:|---:|
| Left edge / x | 450 | 45% of width |
| Top edge / y | 952 | 68% of height |
| Width | 490 | 49% of width |
| Height | 364 | 26% of height |
| Right edge, excluded | 940 | 94% of width |
| Bottom edge, excluded | 1316 | 94% of height |

The covered pixel columns are **450–939**, inclusive. The covered pixel rows are **952–1315**, inclusive. Equivalently, a point is inside when `450 ≤ x < 940` and `952 ≤ y < 1316`.

The normalized rectangle is **`(0.45, 0.68, 0.49, 0.26)`** in `(x, y, width, height)` notation. Its normalized corner bounds are `(0.45, 0.68)` to `(0.94, 0.94)`.

### Appearance and intended use

The reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. The cubes, arch piece, loose beam, lantern and corner ornament remain outside it. The detailed wooden surface fades away toward the region's top and left, blending into the surrounding illustration; no visible box outline or panel border is drawn.

This is an **opaque part of the artwork**, ready for the game to draw light text over it. It is not a transparent cutout. Keep the complete text layout, including outlines, shadows and any additional icons, inside the reserved bounds. Allow padding within the rectangle so glyphs do not touch its edges.

## 4. Placement at other display sizes

Preserve the card's 5:7 aspect ratio and scale the image and text rectangle together. When the displayed card has width `W`, its height is `H = W × 1.4`. For an image drawn at screen position `(imageLeft, imageTop)`:

```text
scale = W / 1000
textX = imageLeft + 450 * scale
textY = imageTop  + 952 * scale
textWidth  = 490 * scale
textHeight = 364 * scale
```

| Displayed card size | Text rectangle relative to the card's top left |
|---|---|
| 1000 × 1400 | `(450, 952, 490, 364)` |
| 500 × 700 | `(225, 476, 245, 182)` |
| 2000 × 2800 | `(900, 1904, 980, 728)` |

These examples use `(x, y, width, height)`. If a UI container adds padding or letterboxing, calculate the rectangle from the actual displayed image origin and size, including that offset. Cropping the card changes the mapping and can remove part of the reserved area or its border.

For an engine that uses a **bottom-left origin with y increasing upward**, the same native rectangle is **`(450, 84, 490, 364)`**. The bottom offset is `1400 - 1316 = 84`. In normalized bottom-left coordinates, its rectangle is `(0.45, 0.06, 0.49, 0.26)`. Use one coordinate convention consistently.

## 5. Integration notes

- Draw the card first, then draw the game's text and UI elements over the reserved rectangle.
- Use light text, such as ivory or near-white, against the dark field. Choose the font size, line spacing and internal padding for the actual display size.
- Wrap and clip text to the reserved rectangle. The artwork does not define a particular title line, statistic layout or number of description lines.
- Keep the image upright and preserve its full composition. Mirroring would move the quiet text region to the opposite side and require a different overlay layout.
- Use nearest-neighbor/point sampling when retaining crisp pixel edges is the priority. Avoid lossy recompression or texture settings that introduce halos.
- Keep the gold border and block-themed corner accents visible. The lower-right ornament sits outside the reserved bounds and should not become part of the text layout.

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game. The illustrated arrangement does not define gameplay rules, object movement or an animation sequence.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "building_blocks_card.png",
  "width": 1000,
  "height": 1400,
  "aspectRatio": "5:7",
  "format": "PNG",
  "colorMode": "RGB",
  "opaque": true,
  "embeddedLettering": false,
  "coordinateOrigin": "top-left",
  "positiveX": "right",
  "positiveY": "down",
  "textOverlay": {
    "x": 450,
    "y": 952,
    "width": 490,
    "height": 364,
    "rightExclusive": 940,
    "bottomExclusive": 1316,
    "normalized": {
      "x": 0.45,
      "y": 0.68,
      "width": 0.49,
      "height": 0.26
    },
    "background": "very dark midnight blue, with slight tonal variation"
  },
  "sha256": "7c63a3189302f03c51c9d24447611e98471a3829b1701212c0fb2ccd2a38ab5e"
}
```
