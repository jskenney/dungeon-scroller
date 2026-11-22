# Undead Fenrir — Collectible Card Guide

## 1. Asset summary

This guide describes **`undead_fenrir_card.png`**, the finished collectible boss card for Undead Fenrir. It is one complete illustration, viewed straight-on and filling the canvas edge to edge. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `undead_fenrir_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Character view | Full-body three-quarter pose, facing slightly left with the muzzle raised in a howl |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `152d9d9700312a578ef564cea71bd38bc686d47036f96c420d1dba7cf69daff0` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single card illustration; there is no animation grid or frame sequence.

## 2. Picture description

### Fenrir and pose

Undead Fenrir is a colossal four-legged wolf with patchy ash-gray fur, a ragged mane and exposed ivory ribs. His cracked, bone-colored muzzle opens to reveal oversized fangs and smaller jagged teeth. Long, uneven fur clusters build up the high shoulders and neck, while the visible rib cage breaks up the darker flank. Pale highlights separate the muzzle, ribs and claws from the surrounding fur.

The full body appears in a three-quarter pose facing slightly left. His head sits in the upper third, left of center, with the muzzle lifted into a howl. The mane, shoulders and rib cage fill the upper and middle portions of the card. Both forelegs reach toward the lower-left foreground, where the large forepaws brace against broken stone. Both rear legs and paws are visible on a receding stone footing above the text area. The four supported legs make the stance readable despite the strong perspective.

A connected, fur-covered tail curls upward from the rump along the upper-right side of the composition. The hindquarters, rear paws and tail remain above the reserved text rectangle. Fenrir is the largest element on the card, with the raised muzzle and bright visible eye as the main focal point.

### Shackles and grave magic

Each foreleg wears its own weathered iron shackle, with rivets, chipped edges and a short attached chain. The two chains descend from their respective cuffs and curl separately around the forepaws on the stone, ending in broken links. Their attachment points and dark metal silhouettes remain visible against the lighter legs and paws.

The visible eye shines pale blue-green. A faint curl of the same grave magic hangs immediately around the open jaws, with restrained light inside the mouth. The lifted muzzle, open jaws and local glow evoke the Grave Howl attack. The effect stays close to the head, leaving the fangs, muzzle, ribs and shackles readable and keeping the lower-right region clear.

### Background and card frame

A ruined graveyard gate fills the upper background. Low-contrast slate pillars, broken iron bars and pointed gate ornaments rise behind Fenrir. Bare branches and muted moss add detail around the damaged masonry. Broken stone beneath the paws establishes the foreground footing, then recedes into smooth, very dark midnight blue toward the reserved text area.

A thin antique-gold border follows the card perimeter. Small broken-chain motifs decorate the upper corners, accompanied by curved gold accents. The lower-right star-like ornament sits beyond the reserved text rectangle, near the outside corner. There are no names, boss labels, statistics, numbers, captions, logos or placeholder text in the image.

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

The entire reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. It contains no part of Fenrir, paws, tail, chains, grave magic, masonry details or corner ornament. The top and left transitions blend into the surrounding illustration; no visible box outline or panel border is drawn.

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
  "image": "undead_fenrir_card.png",
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
  "sha256": "152d9d9700312a578ef564cea71bd38bc686d47036f96c420d1dba7cf69daff0"
}
```

