# Wind Mage — Collectible Card Guide

## 1. Asset summary

This guide describes **`wind_mage_card.png`**, the finished collectible character card for the wind mage. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `wind_mage_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Character view | Full-body three-quarter pose, looking slightly right |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `7c9cbad76021305bddcf0253fa8f6adfaf8172805110bb41bc7a23e18c7bb22a` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Mage and costume

The mage is a dark-haired, clean-shaven figure wearing a short sage-green mantle over a pale gray coat. A round gold clasp, gold edging and coat fittings pick out the clothing against the dark background. An ivory split scarf wraps around the neck, with its long ends sweeping upward behind the shoulders. Leather belts and straps, dark trousers and tall brown boots complete the outfit. A slim quiver sits behind the shoulder, with arrow fletchings visible above it and its strap crossing the torso.

His face has a long, narrow structure, high cheekbones, a tapered jaw and chin, a fine nose and narrow gray-green eyes. A subtle half-smile gives him an alert expression. The face sits in the upper third of the card, slightly left of center, and looks toward the right. The shoulders and upper torso extend into the center, while the coat hem, legs and both boots angle toward the lower-left area. The character is the main focal element.

### Bow and magic

The mage holds a wooden recurve bow low in the hand on the left side of the image. Both curved limbs and their tips remain visible, and a straight, taut bowstring joins the tips. The grip has pale wrapping, while warm metallic accents mark parts of the bow. The bow stays along the left side, clear of the reserved text region.

The other hand is raised toward the middle-right area. Pale mint and ivory wind ribbons curl above the open palm and sweep behind the shoulders. A few green leaves drift through the upper composition, reinforcing the wind motion alongside the lifted scarf tails. The face, casting hand and bow remain distinct, and the wind effects stay in the upper and middle parts of the image.

### Background and card frame

A shadowed dungeon arch fills the upper background with low-contrast charcoal and slate masonry. The wind ribbons and drifting leaves pass in front of the arch. A small amount of stone ground is visible beneath the boots in the lower left. The background becomes smooth, very dark midnight blue toward the reserved text area.

A thin antique-gold border follows the card perimeter. Small curling wind motifs with leaf accents decorate the upper corners, while small star-like accents mark the lower corners. The lower-right ornament remains beyond the reserved text rectangle, near the outside corner. There are no names, numbers, captions, logos or placeholder text in the image.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It contains no character, bow, quiver, scarf, coat, boots, wind effects, leaves, masonry details or corner ornament. The top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

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

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "wind_mage_card.png",
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
  "sha256": "7c9cbad76021305bddcf0253fa8f6adfaf8172805110bb41bc7a23e18c7bb22a"
}
```

