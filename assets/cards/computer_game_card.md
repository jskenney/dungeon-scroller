# Computer Game — Collectible Card Guide

## 1. Asset summary

This guide describes **`computer_game_card.png`**, the finished collectible object card for Computer Game. It is one complete illustration, viewed straight-on as a card and filling the canvas edge to edge. The main subject is a small, powered game console with a slate housing and brass fittings. The game supplies any names, statistics, descriptions or other lettering as a separate overlay.

| Property | Value |
|---|---|
| Image filename | `computer_game_card.png` |
| Canvas | 1000 × 1400 pixels |
| Aspect ratio | 5:7, portrait |
| Format | PNG |
| Color mode | RGB; fully opaque, with no alpha channel |
| Artwork style | Detailed pixel art with crisp contours and shaded pixel clusters |
| Object view | Three-quarter front view of a console, with its top and right side visible |
| Embedded lettering | None |
| Reserved text rectangle | `(450, 952, 490, 364)` in `(x, y, width, height)` notation |
| Verified image SHA-256 | `49b45d00150a5b00d17bd3229e9851cfb41cbdf2172348ed3686fb674efe046e` |

The checksum identifies the final 1000 × 1400 card documented here. This is a single, static card illustration; there is no animation grid or frame sequence. The screen scene, two physical buttons and status light are all painted into the PNG.

## 2. Picture description

### Slate console and brass controls

The console occupies the left and middle parts of the composition, above the reserved text region. Its heavy charcoal-slate housing has a squared silhouette, a slightly sloping top and a broad base. Visible seams, chipped corners and fine cracks give the body a worn stone appearance. The view exposes the top and right side while keeping the front screen and controls clearly readable.

A thick, weathered brass bezel surrounds the recessed screen. Its warm gold surface has darker scuffs and small irregular marks, with a round fastener near each corner. The brass catches the lantern's amber light along its upper and left edges. The screen sits behind the bezel, so the border and dark inner rim give the display a sense of depth.

Exactly two chunky brass buttons sit side by side on the sloping control deck beneath the screen. Both are broad, raised shapes with softened corners, bright upper faces and darker sides. Dark recesses around their bases separate them from the slate deck. A single square cyan status light is set into the front face of the console's base, below and between the buttons.

### Powered screen and dungeon scene

The recessed screen is lit with a concentrated cyan and turquoise glow. It shows a small, blocky cyan adventurer standing near the center of a charcoal-and-cyan stone corridor. The figure's square head, dark eyes and bright silhouette are clearly readable within the display.

A stone arch frames the adventurer, with a darker passage and another opening receding behind it. Cyan highlights trace the nearer masonry and tiled floor, while the passage falls toward dark teal and charcoal in the distance. The scene contains no display lettering.

The screen's cool light stays local to the display and nearby inner bezel, contrasting with the warmer brass and surrounding lantern light. The small front status light adds a second, separate cyan accent, with a faint glow immediately around its setting.

### Tavern setting and card frame

The console rests on a broad surface of wooden planks in a dim tavern setting. Long seams and grain run diagonally across the visible wood. Strong amber highlights gather to the left of the console and along the planks behind it, while the surface grows darker toward the right and lower parts of the image. The lower-right composition resolves into the quiet midnight-blue field reserved for text.

A hanging lantern in the upper left supplies the main warm light. It hangs from a bracket near a substantial timber support, illuminating nearby stonework and the edges of the wood. A large shadowed stone arch fills the upper-right background. A small distant warm glow appears within that background, but the console and its cyan screen remain the main focal point.

A thin antique-gold border follows the card perimeter. A small gold arch motif occupies the upper-left corner, and a pair of round gold button motifs sits in the upper-right corner. These corner decorations echo the screen's dungeon arch and the console's two buttons. Small gold star-like accents mark the lower corners; the lower-right ornament remains outside the reserved text rectangle. There are no names, numbers, captions, logos or placeholder text in the image.

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

The reserved rectangle is a smooth, very dark midnight-blue field with slight tonal variation. The console, display scene, buttons, status light, lantern and corner ornaments stay outside it. The wood fades into the dark surrounding field before this area becomes the text layout. The top and left transitions blend into the illustration; no visible box outline or panel border is drawn.

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
- Use nearest-neighbor/point sampling when retaining crisp pixel edges is the priority. Avoid lossy recompression or texture settings that introduce halos around the gold border and cyan lights.
- Keep the gold border, upper arch motif, upper button motifs and lower corner accents visible. The lower-right ornament sits outside the reserved bounds and should not become part of the text layout.
- The screen scene, two buttons and status light are baked into the illustration. Supply any screen overlays, button hit regions, animation or playable dungeon content separately in the game.

The image contains artwork only. Overlay text, fonts, interaction behavior and any animated UI effects are supplied by the game.

## 6. Copyable asset metadata

The following JSON is an integration reference, not metadata embedded in the PNG. Rectangle right and bottom boundaries are exclusive.

```json
{
  "image": "computer_game_card.png",
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
  "sha256": "49b45d00150a5b00d17bd3229e9851cfb41cbdf2172348ed3686fb674efe046e"
}
```
