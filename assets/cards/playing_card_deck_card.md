# Playing Card Deck — Collectible Card Guide

## 1. Asset summary

This guide describes **`playing_card_deck_card.png`**, the finished collectible object card depicting the dungeon playing-card deck. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any item name, description, statistics or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `playing_card_deck_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Object view | Three face-up cards fanned above a face-down stack in a tavern tabletop composition |
| Embedded lettering | None; the card faces have no baked-in ranks or numbers |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `de4e1e57af46e6710708a093eb878b47e8eb910bdeb277f647e62997f4e7b9b8` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Deck and decorative back

A short stack of face-down playing cards rests on the wooden table in the lower-left area. Several pale card edges are visible beneath the top card, giving the deck thickness. The stack is angled in three-quarter view, with rounded corners and a thin gold border on the exposed top back.

That back uses a midnight-blue field with dark slate details and a symmetrical antique-gold dungeon pattern. Opposing pointed arches, narrow vertical ornaments, a crosswise hinge-like band and a central diamond echo the shared back in the playing-card sprite sheet. Most of the top back remains exposed so the pattern reads alongside the three face-up portraits.

### Face-up cards and composition

Exactly three face-up cards fan across the upper and middle portions of the image. All have pale parchment interiors, rounded corners and thin gold frames. The **King on the left** wears a gold crown, layered dark robes, gold fastenings and a torn ivory ermine mantle. The **Queen in the center** wears a silver diadem, a dark veil and blue-green gems. Both use double-ended skeletal portraits, with a second inverted head and costume detail in the lower half of their respective cards.

The **Joker on the right** has one upright grinning skeletal portrait, a ragged two-point cap, small brass bells and a muted diamond-patterned costume. Its head and cap remain distinct from the adjacent Queen. The three cards overlap near their edges while leaving their portraits readable. Their lower corners remain above the reserved text area, and the stack sits separately below them on the left. All cards stay inside the outer collectible frame.

### Background and card frame

A warm lantern hangs from a timber support in the upper left. Low-contrast slate masonry and a recessed stone arch fill the upper background. The worn tabletop carries amber highlights and visible wood grain around the cards and along the left side, then blends into very dark midnight-blue shadow toward the reserved text area.

A thin antique-gold border follows the outer card perimeter. A small heart-and-diamond pair decorates the upper-left corner, and a spade-and-club pair decorates the upper right. Small star-like accents sit near the lower corners. The lower-right ornament remains beyond the reserved text rectangle. There are no item names, baked-in ranks, numbers, logos or placeholder text. The suit motifs belong to the outer frame; the depicted playing-card faces have no suit index marks.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It contains no cards, card corners, table grain, lantern highlights, masonry details or corner ornament. The top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

This is an **opaque part of the artwork**, ready for the game to draw light text over it. Keep the complete text layout, including outlines, shadows and any additional icons, inside the reserved bounds. Allow padding within the rectangle so glyphs do not touch its edges.

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
- Keep the entire collectible upright and preserve its full composition. The double-ended King and Queen portraits and the symmetrical deck back are features within the illustration. Rotating or mirroring the whole collectible would move the text area and require a different overlay layout.
- Use nearest-neighbor/point sampling when retaining crisp pixel edges is the priority. Avoid lossy recompression or texture settings that introduce halos.
- Keep the gold border and corner accents visible. The lower-right ornament sits outside the reserved bounds and should not become part of the text layout.

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game. Use the separate `playing_card_spritesheet.png` asset for individual playable card faces, backs and suit icons; this collectible is displayed as one complete image.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "playing_card_deck_card.png",
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
  "sha256": "de4e1e57af46e6710708a093eb878b47e8eb910bdeb277f647e62997f4e7b9b8"
}
```

