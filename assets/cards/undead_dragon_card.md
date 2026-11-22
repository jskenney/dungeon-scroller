# Undead Dragon — Collectible Card Guide

## 1. Asset summary

This guide describes **`undead_dragon_card.png`**, the finished collectible boss card for the Undead Dragon. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `undead_dragon_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Character view | Crouched full-body three-quarter pose, facing slightly left; some rear anatomy is occluded |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `128c8aeb3bd2ade4a96ecc45fa9664d66cc21f1b70449c9888cad37eebfa1617` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Dragon and pose

The Undead Dragon is an immense skeletal creature with a cracked, horned ivory skull, long swept-back horns, a dark eye socket and exposed jagged teeth. The open jaws hold a faint pale blue-green glow. A visibly connected bony neck curves from the skull into the exposed rib cage, with projecting vertebral spikes along the back. Bone-ivory highlights distinguish the skull, ribs and joints from the charcoal and slate shadows.

The skull sits in the upper third, left of center, and faces slightly left. The dragon crouches in a three-quarter pose, with its rib cage filling the center-left and its foreclaws braced on broken stone in the lower-left portion. A bent rear leg is visible behind the torso; other rear anatomy is partly occluded by the body and wings. The dragon is the largest element and the main focal subject.

### Wings, tail and gravefire

One large near wing rises across the upper-right portion of the card. Its long skeletal struts, pale joints and torn charcoal membranes remain distinct, with ragged edges and holes revealing the dark background. One smaller folded far wing sits behind the torso on the left. The horns and the raised wingtip remain inside the gold frame.

The long segmented tail curls around the feet in the lower-left area, with its linked vertebrae and pointed end clearly defined. Pale blue-green gravefire gathers between the ribs and glows inside the jaws, suggesting an imminent breath attack. The brightest light stays within the rib cage, while the skull and wing joints carry restrained ivory highlights. The wings, tail and local glow leave the lower-right text region clear.

### Background and card frame

A ruined burial vault fills the upper background with a broken stone arch, shadowed pillars and low-contrast slate masonry. Broken stones support the foreclaws and curled tail in the lower left. The background becomes smooth, very dark midnight blue toward the reserved text area.

A thin antique-gold border follows the card perimeter. Swept horn-like curved accents decorate the upper corners, and a small pointed gold accent marks the lower-right corner. That lower-right ornament remains beyond the reserved text rectangle, near the outside edge. There are no names, boss labels, statistics, numbers, logos or placeholder text in the image.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It contains no dragon, claws, tail, wings, gravefire, masonry details or corner ornament. The top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

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
  "image": "undead_dragon_card.png",
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
  "sha256": "128c8aeb3bd2ade4a96ecc45fa9664d66cc21f1b70449c9888cad37eebfa1617"
}
```

