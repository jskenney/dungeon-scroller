# Dungeon Dice — Collectible Card Guide

## 1. Asset summary

This guide describes **`dungeon_dice_card.png`**, the finished collectible object card for the dungeon dice. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any item name, statistics, description or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `dungeon_dice_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Object view | Seven dice in three-quarter view on a receding tabletop, with the two foreground D6s showing their upper faces |
| Materials | Carved bone ivory and dark dungeon slate with antique-brass bevels |
| Embedded lettering | None; die values are represented by recessed dots |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `3a383b416f8adb5e25bc38894512a49b57399d4a96020ec5842d98a33396ffe4` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Dice and materials

Seven dice form the central subject. Two large D6s occupy the foreground: a bone-ivory cube at the lower left and a slate cube immediately behind and to its right. Both have broad, clearly visible upper faces. The ivory D6 shows five recessed pips on top; the slate D6 shows three in a diagonal. Smaller pip patterns also appear on their visible side faces.

The bone dice use warm ivory surfaces, beige and brown shadows, worn corners and restrained chips. The slate dice use cool charcoal-gray faces outlined by thin antique-brass bevels. Warm light catches the bevels and the upper edges of the ivory dice while the shaded sides retain their distinct material colors.

The five additional dice rise behind the cubes in a staggered arrangement. Their shape, material and position are as follows; positions describe the artwork rather than sprite extraction rectangles.

| Die | Material | Position and identifying shape |
|---|---|---|
| Foreground D6 | Bone ivory | Lowest and farthest left; a cube with a five-pip upper face |
| Rear foreground D6 | Dungeon slate and brass | Behind and right of the ivory cube; a cube with a three-pip upper face |
| D4 | Bone ivory | Left middle, behind the cubes; a pointed tetrahedron with a broad triangular face |
| D8 | Dungeon slate and brass | Above and right of the D4; a diamond-like octahedron with upper and lower points and triangular faces |
| D10 | Bone ivory | Near the middle, above the slate D6; a broad forward kite-shaped face and tapering lower point |
| D12 | Dungeon slate and brass | Upper middle-right; a prominent pentagonal face surrounded by smaller facets |
| D20 | Bone ivory | Highest die, near the upper middle; a forward triangle and several surrounding triangular facets |

### Arrangement and carved pips

The foreground cubes establish depth, and the five dice behind them remain separated enough for their silhouettes and facet patterns to be read individually. All seven dice remain inside the outer card frame. The composition climbs from the lower-left foreground through the middle toward the upper center, leaving the lower-right region quiet.

Each visible value is formed from small circular recesses. The holes have dark centers and upper-left inner walls, with a narrow highlight along the lower-right inner edge. The bone recesses use warm brown interiors and ivory rims; the slate recesses use dark interiors and cool stone rim highlights. The larger foreground pips make this carved appearance particularly clear.

Warm lantern light comes from the upper left, revealing the pips, worn corners, bevels and shallow surface texture. Contact shadows remain close to the dice on the table. The pip patterns are already part of this static illustration and remain fixed when the collectible card is displayed.

### Background and card frame

A dim tavern gaming nook fills the upper background. A hanging lantern and weathered timber support occupy the upper left, while low-contrast slate masonry and a recessed stone arch continue across the upper right. The dice sit on a worn wooden table with diagonal plank edges and visible grain beneath and around the cluster. The table and background fade into very dark midnight blue toward the reserved text area.

A thin antique-gold border follows the card perimeter. Three small round gold pips form a diagonal motif at each upper corner. Small star-like accents decorate the bottom corners; the lower-right ornament remains outside the reserved rectangle, close to the outer corner. The image contains no item names, labels, letters, numerals, logos or placeholder text.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It is clear of dice, carved pips, visible contact shadows, table grain, lantern highlights, scenery details and corner ornament. The top and left transitions blend into the surrounding shadows; no visible box outline or panel border is drawn.

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
- Keep the gold border and corner accents visible. The lower-right ornament sits outside the reserved bounds and should not become part of the text layout.
- Treat the depicted die values as fixed decorative artwork. Use `polyhedral_dice_spritesheet.png` and its separate guide to assemble gameplay dice, pip overlays and changing results.

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "dungeon_dice_card.png",
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
  "sha256": "3a383b416f8adb5e25bc38894512a49b57399d4a96020ec5842d98a33396ffe4"
}
```

