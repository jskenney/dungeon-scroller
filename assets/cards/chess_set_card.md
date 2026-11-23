# Chess Set — Collectible Card Guide

## 1. Asset summary

This guide describes **`chess_set_card.png`**, the finished collectible object card for the Chess Set. It is one complete illustration, viewed straight-on as a card and filling the canvas edge to edge. Within the illustration, an open folding chessboard appears at an oblique angle on a wooden table. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `chess_set_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Object view | Fully open folding chessboard in oblique perspective, with six separate pieces |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `81af930de6a4260f32d94ec3d157894f0a9d4c4b203bbd4943e756069e3a8756` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Board and construction

A wooden folding chessboard lies fully open across the upper and middle parts of the card. Its playing surface has an 8 × 8 grid of alternating pale maple and dark walnut squares, with four files on each half of the board. The two halves meet along a straight fold seam, which runs diagonally downward and to the right in the illustration. Brass hinges sit at the far and near ends of this seam.

The board has a thick wooden case with a raised perimeter, visible grain, worn edges and small brass fittings. The pale squares catch the lantern light, while the dark squares retain their rich brown grain. Its nearest corner projects toward the lower-left area, showing the depth of the case below the playing surface. The board's edges form a strong diagonal composition and keep the main object clear of the lower-right text area.

### Chess pieces

Six separate pieces stand on the board: an ivory king, pawn and horse-head knight, together with a slate-colored king, pawn and crenellated rook. The ivory knight is prominent in the left foreground, with a carved mane, a clearly shaped horse head and a broad circular base. The slate rook stands in the right foreground, with a cylindrical body and a battlement-like top.

The ivory king rises near the upper center of the board, and the slate king stands closer to the middle. Both have cross-shaped finials. The ivory pawn sits to the left of center, while the slate pawn is farther back on the right. Warm highlights and dark cast shadows distinguish the pieces from the squares beneath them. Their arrangement presents the set as a collectible object; exact square assignments and a playable game state are not part of this asset's specification.

### Background and card frame

A glowing lantern hangs in the upper left, casting amber light over the stone wall, timber supports and wooden tabletop. A broad slate-stone arch occupies the upper-right background, opening into a dim interior with a small distant warm light. The tabletop remains visibly textured along the left side and beneath the board, then fades into a very dark midnight-blue field toward the lower right.

A thin antique-gold border follows the card perimeter. A small gold knight ornament marks the upper-left corner, and a gold rook marks the upper-right corner. Small star accents decorate the lower corners. The lower-right ornament remains beyond the reserved text rectangle, near the outside corner. There are no names, numbers, captions, logos or placeholder text in the image.

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

The reserved rectangle is a quiet, very dark midnight-blue field with slight tonal variation. The chessboard, pieces and brass fittings remain above or to the left of it, and the warm tabletop texture fades out before the text field. The rectangle contains no lantern, stone arch or corner ornament. Its top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

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
- Keep the gold border, upper chess ornaments and lower star accents visible. The lower-right ornament sits outside the reserved bounds and should not become part of the text layout.
- Treat the board and pieces as static collectible artwork. Supply any interactive chessboard, square coordinates and game rules separately.

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "chess_set_card.png",
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
  "sha256": "81af930de6a4260f32d94ec3d157894f0a9d4c4b203bbd4943e756069e3a8756"
}
```
