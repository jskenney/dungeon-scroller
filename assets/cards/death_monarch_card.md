# Death Monarch — Collectible Card Guide

## 1. Asset summary

This guide describes **`death_monarch_card.png`**, the finished collectible boss card for the Death Monarch. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `death_monarch_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Character view | Full-body three-quarter pose, hovering upright and looking slightly left |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `fceae4e1d6005ef2238aa64efe622437d4e237cc8145789fc67ca6db985a074a` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Monarch and costume

The Death Monarch is an undead royal figure with an exposed skull, a cracked jaw and visible skeletal hands. A connected vertebral neck joins the skull to the torso beneath the raised collar. A tall, tarnished gold crown, with narrow points and worn detailing, frames the skull. Pale blue-green grave light picks out the eye socket and nearby bone edges.

Layered charcoal and muted teal robes cover the body, with worn gold edging, chains and fittings. A torn ivory ermine mantle, marked with dark spots, spreads across the shoulders. The ragged robe layers sweep down toward the lower-left quarter, where both dark boots remain visible. A clear dark gap beneath the boots establishes the upright hover.

The crowned skull sits in the upper third, slightly left of center, and turns toward the left in a three-quarter view. The shoulders and mantle extend into the center of the card while the lower body stays left. The Monarch is the largest figure and the main focal element.

### Sword and spectral blades

A skeletal hand clearly grips the worn gold hilt of the long black coronation blade on the left side of the image. The sword is held almost vertically with its point downward. Pale edge highlights keep the dark blade readable, and its tip finishes in the lower-left area, clear of the reserved text rectangle. The other skeletal hand extends in front of the robes.

Exactly three small pale blue-green spectral blades form an arc around the crown: one above it and one to either side. Each blade is separated from the crown and its neighbors by visible dark space. Their distinct pointed silhouettes evoke the Crown of the Grave attack. The spectral blades and their compact glow stay in the upper part of the image.

### Background and card frame

A shadowed, empty stone throne stands behind the Monarch on the right, framed by low-contrast slate arches, damaged masonry, hanging banners and worn steps. The architectural detail recedes into darkness below, blending into the smooth midnight-blue reserved text area.

A thin antique-gold border follows the card perimeter. Small pointed crown motifs mark the upper corners. A star ornament sits near the lower-right outer corner, beyond the reserved text rectangle. There are no names, boss labels, statistics, numbers, logos or placeholder text in the image.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It contains no character, robes, boots, sword, spectral blades, grave light, scenery details or corner ornament. The top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

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
  "image": "death_monarch_card.png",
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
  "sha256": "fceae4e1d6005ef2238aa64efe622437d4e237cc8145789fc67ca6db985a074a"
}
```

