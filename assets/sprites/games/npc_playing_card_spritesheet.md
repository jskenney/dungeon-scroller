# NPC Playing Cards — Sprite Sheet Guide

## 1. Asset and deck

This guide describes **[npc_playing_card_spritesheet.png](npc_playing_card_spritesheet.png)**: an NPC-themed playing-card atlas for the dungeon fantasy game. It contains a shared midnight-blue back, five parchment face templates, and four separate suit icons. The Young Villager is the upright Joker, the Shopkeeper is the King, the Village Elder is the Queen, and the Village Priest is the Jack. Thin antique-gold frames, pale parchment, rounded corners, and the NPCs' familiar clothes and props keep the deck consistent with the existing cards. Ranks and suit assignments are supplied by the game.

The layout matches **[hero_playing_card_spritesheet.png](hero_playing_card_spritesheet.png)** and the corrected dungeon deck, **[playing_card_spritesheet_v2.png](playing_card_spritesheet_v2.png)**. The Back, Plain Card Face, Heart, Diamond, Spade, and Club are reused **pixel for pixel** from the hero sheet, and those same six sprites also match the corrected dungeon sheet. The four portrait interiors provide the NPC theme; the common frame, outline, extraction geometry, and overlay positions remain shared.

The guide follows the same six-section structure as the other sprite-sheet guides, with card assembly and display behavior in place of character animation playback. The Joker shows one upright figure. The King, Queen, and Jack use paired upper-body portraits joined at the waist; these are court illustrations, not full-body gameplay sprites.

| Property | Value |
|---|---|
| Image filename | `npc_playing_card_spritesheet.png` |
| Companion hero deck | `hero_playing_card_spritesheet.png` |
| Companion corrected dungeon deck | `playing_card_spritesheet_v2.png` |
| File size | 379,886 bytes |
| Canvas | 800 × 448 pixels |
| Grid | 5 columns × 2 rows |
| Full-cell extraction size | 160 × 224 pixels for every sprite |
| Card aspect ratio | 5:7 |
| Sprite slots | 10; every slot contains visible pixels |
| Card templates | 6: shared back, Joker, King, Queen, Jack, and plain face |
| Standalone suit icons | 4: Heart, Diamond, Spade, Club |
| Embedded animation clips | 0; these are static components |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Native view | Straight-on, upright portrait cards |
| Sheet margin and inter-cell spacing | 0 pixels |
| Card outline | Matching alpha masks; tight local bounds `(1, 0, 158, 224)` inside every 160 × 224 card cell |
| Suggested fixed card pivot | (80, 112), measured from the cell's top-left boundary |
| Shared suit sampling area | Cell-local `(32, 64, 96, 96)` |
| Suggested pivot inside that suit crop | (48, 48) |
| Verified SHA-256 | `68512fbb401e1c5507028d8ce2c6af9f4917668b96124b20ac2db26612c7485d` |

The **160 × 224 size is the extraction rectangle**, including transparency. Each card's tight opaque bounding rectangle is local `(1, 0, 158, 224)`, covering x1–158 and y0–223; rounded corners leave additional transparent pixels within that rectangle. Every card contains **35,252 opaque pixels**. Keep the complete 160 × 224 cell when importing so the common pivot and overlay coordinates remain stable. A suit occupies a smaller area inside its same-sized cell and has no parchment background.

The PNG contains pixels only. Card identities, ranks, suits, deck order, number-card pip layouts, selection states, dealing, and flip timing are game data or controller behavior. The assembly layouts and display timings below are implementation recommendations, not metadata embedded in the image. All measured properties in this guide refer to the PNG identified by the digest above.

## 2. Coordinates and sprite locations

All human-readable **rows and columns are numbered from 1**. Pixel coordinates and flattened sprite indices start at **0**. The origin is the top-left of the image; x increases rightward and y downward.

Use rectangle notation **`(x, y, width, height)`**, with the right and bottom edges excluded. For row `r` and column `c`:

```text
x = (c - 1) * 160
y = (r - 1) * 224
rectangle = (x, y, 160, 224)
spriteIndex = (r - 1) * 5 + (c - 1)
```

| Column | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–159 |
| 2 | 1 | 160 | 160–319 |
| 3 | 2 | 320 | 320–479 |
| 4 | 3 | 480 | 480–639 |
| 5 | 4 | 640 | 640–799 |

| Row | y | Covered y pixels | Contents, left to right |
|---:|---:|---|---|
| 1 | 0 | 0–223 | Card Back, Joker, King, Queen, Jack |
| 2 | 224 | 224–447 | Plain Card Face, Heart, Diamond, Spade, Club |

For example, the **King** is row 1, column 3: rectangle **`(320, 0, 160, 224)`**, flattened index **2**. The **Heart** occupies row 2, column 2: full-cell rectangle **`(160, 224, 160, 224)`**, index **6**. Its recommended suit-only sampling rectangle is **`(192, 288, 96, 96)`**.

### Reserved rank and suit index areas

Every face template—Joker, King, Queen, Jack, and Plain Card Face—has the following two clear parchment areas. These coordinates are **local to its 160 × 224 card cell**.

| Area | Local rectangle | Covered x pixels | Covered y pixels | Intended orientation |
|---|---|---|---|---|
| Upper-left index | `(12, 12, 32, 48)` | 12–43 | 12–59 | Upright rank and suit |
| Lower-right index | `(116, 164, 32, 48)` | 116–147 | 164–211 | Same index group rotated 180° |

Both areas are opaque parchment **`#F7E6D1`**, RGB **(247, 230, 209)**, in the delivered image. They contain no rank, suit mark, portrait, ornament, or grain. They are not transparent holes and are not separate sprites. The shared card back does not use these index areas.

Rotate the complete upper-left index group by **180° around the card center `(80, 112)`** to place its matching lower-right group. In boundary coordinates, this maps `(x, y)` to `(160 - x, 224 - y)`. A rectangle `(x, y, w, h)` maps to `(160 - x - w, 224 - y - h, w, h)`. Use a rotation, not a horizontal reflection of the text.

For individual raster-pixel indices, a 180° rotation instead maps `(x, y)` to `(159 - x, 223 - y)`. The formulas above use rectangle boundaries; keeping these two coordinate conventions distinct prevents a one-pixel registration error.

All five NPC face templates use the same standard **32 × 48** overlay reserves. No NPC-specific offset or larger index rectangle is needed. Use these standard coordinates when switching between deck themes.

The exact global index rectangles for all five faces are listed in section 6. If the card is drawn at screen position `(screenX, screenY)` with scale `s`, a local coordinate becomes `(screenX + localX*s, screenY + localY*s)`. Apply the same scale and transform to the card artwork, index groups, and central pips.

## 3. Sprite catalog

Read the sheet left to right to identify its components. **Adjacent cells are different assets, not successive animation frames.** Display a selected template for as long as the card state requires it.

| Row | Column | Index | Sprite ID | Sprite | Use |
|---:|---:|---:|---|---|---|
| 1 | 1 | 0 | `card_back` | Shared card back | Every face-down card |
| 1 | 2 | 1 | `joker` | Upright Young Villager | Optional Joker card |
| 1 | 3 | 2 | `king` | Double-ended Shopkeeper | King of any suit |
| 1 | 4 | 3 | `queen` | Double-ended Village Elder | Queen of any suit |
| 1 | 5 | 4 | `jack` | Double-ended Village Priest | Jack of any suit |
| 2 | 1 | 5 | `plain_face` | Blank parchment card | Ace and ranks 2–10; other custom cards |
| 2 | 2 | 6 | `heart` | Deep-crimson Heart | Corner suit marks and central pips |
| 2 | 3 | 7 | `diamond` | Deep-crimson Diamond | Corner suit marks and central pips |
| 2 | 4 | 8 | `spade` | Charcoal Spade | Corner suit marks and central pips |
| 2 | 5 | 9 | `club` | Charcoal Club | Corner suit marks and central pips |

### Card Back — `card_back`

The same corrected midnight-blue Back used by the dungeon deck carries opposing antique-gold arches, ironwork-like crossbars, dark masonry, and a central gold diamond. The upper and lower arch peaks, center line, columns, and ornament are aligned. The lower half is an exact vertical mirror of the upper half, and the complete card also matches its left/right reflection and its **180° rotation**, including the frame and texture.

Use this sprite for every face-down NPC card. Its pixels are identical to the hero deck's Back and the corrected dungeon deck's Back, so the image itself does not reveal a hidden rank, suit, orientation, or deck theme. Keep those identities in game data.

### Joker — `joker`

The Young Villager appears in one upright portrait, turned slightly to the right with a playful smile and a raised open hand in a greeting wave. He has tousled chestnut-brown hair, a faded olive tunic, a short tan cape with worn edges and a small round clasp, a leather belt, a brown belt pouch, and patched brown trousers. His other hand rests near the pouch. The tilted stance and fluttering cape give him a lively, informal silhouette. The waving hand remains separate from the face.

This is a **single upright central portrait**, not a double-ended court. It includes the torso and much of the trousers; his boots are outside the illustrated crop. The wave, smile, and cape pose are fixed artwork, not successive animation frames. Multiple Joker instances may share this image. Optional Joker labels, suit assignment, and distinct Joker rules belong to the game.

### King — `king`

The middle-aged Shopkeeper has swept dark hair with silver at the temples, a thick dark moustache, and a welcoming expression beneath a modest antique-gold crown. Cream rolled sleeves and a rust-red vest frame a dark brown leather apron. In the upright half, he holds a small green corked bottle upright on the right; his other hand rests near a leather coin purse with a brass clasp on the left. The belt, brass buckle, apron pocket, bottle, and purse keep his shopkeeper identity recognizable in the royal role.

The upper-body portrait ends at the waist, and its exact **180° rotated copy** forms the lower half. The complete bottle and purse remain visible within their respective halves. The sleeves follow natural contours around the clear index areas. Add `K` and the selected suit in the standard corners; the bottle, everyday clothing, and crown do not assign a suit, card value, or special rule.

### Queen — `queen`

The Village Elder has a lined face, a calm expression, a long silver braid, and a thin gold circlet above her brow. A triangular plum shawl fastened with a round brass brooch sits over her slate-blue dress. A small brown pouch appears at the waist. In the upright half, one hand grips her familiar plain wooden walking stick on the right while her other hand makes a gentle palm-up gesture on the left. The braid, shawl, brooch, stick, and open palm remain distinct.

The lower half is the exact **180° counterpart** of the upper-body portrait. The artwork shows a visible section of the walking stick within each half; it does not show her full standing dress, shoes, or the stick's full gameplay length. The braid curves clear of the upper-left index and its rotated lower-right counterpart. Add `Q` and the chosen suit. The circlet marks the court role while preserving the elder's familiar appearance.

### Jack — `jack`

The Village Priest has wavy dark-brown hair, a clean-shaven face, and a calm expression. He wears an ivory robe, a muted burgundy stole, a cord belt, and a small brown pouch. A brass sun pendant hangs against his chest. In the upright half, his offered hand on the right holds a **separate brass sun charm**, while the other hand rests near the pouch. The offered charm and chest pendant are two distinct gold shapes, with clear space between them. The fingertips end naturally, leaving parchment between the hand and the card border.

The upper-body portrait and its exact **180° rotated copy** form one double-ended template. The robe, stole, pouch, pendant, and charm remain readable in both orientations. The full robe hem and shoes are not shown. No separate healing effect is depicted; the gold accents belong to the two brass sun objects. Add `J` and the chosen suit in the standard corners; the ivory and burgundy costume remains the same for all four suits.

### Plain Card Face — `plain_face`

The blank card uses the same frame, rounded outline, and pale parchment as the portrait cards. Its interior is evenly lit with faint parchment variation away from the uniform index patches. Use it as the base for the Ace and numbered cards. Central suit pips, rank text, and any custom symbols are drawn by the game.

### Suit icons — `heart`, `diamond`, `spade`, `club`

Each suit is a solid silhouette on a transparent background, with no card behind it. The Heart has two rounded lobes and a pointed base; the Diamond has four points; the Spade has an upward point, rounded lobes, and a short stem; the Club has three lobes and a short stem.

| Suit | Exact opaque color | Recommended common crop within its cell | Logical anchor in the full cell |
|---|---|---|---|
| Heart | `#922738`, RGB (146, 39, 56) | `(32, 64, 96, 96)` | `(80, 112)` |
| Diamond | `#922738`, RGB (146, 39, 56) | `(32, 64, 96, 96)` | `(80, 112)` |
| Spade | `#222630`, RGB (34, 38, 48) | `(32, 64, 96, 96)` | `(80, 112)` |
| Club | `#222630`, RGB (34, 38, 48) | `(32, 64, 96, 96)` | `(80, 112)` |

Use the **common 96 × 96 crop** when stamping a suit into a small destination square. Scaling the entire 160 × 224 source cell into that square would also scale its large transparent margins, making the visible suit unnecessarily small. The common crop preserves the intended relative visual weights of the four symbols. Exact tight opaque bounds are supplied in section 6 for importers that require trimming.

## 4. Building cards and playing display transitions

### Import and slice

1. Import the original PNG at its native dimensions, preserve alpha, and use nearest-neighbor/point sampling.
2. Slice a regular grid with size **160 × 224**, offset **(0, 0)**, margin **0**, spacing **0**, five columns, and two rows.
3. Name the ten slices using the catalog. Preserve the full cells for card templates and their common **(80, 112)** pivot, or `(0.5, 0.5)` in normalized coordinates.
4. Define a second view of each suit slice using the shared **96 × 96** crop at local `(32, 64)`. Its logical pivot is **(48, 48)**.
5. Supply the game's rank glyphs separately. No font, alphabet, numeral set, or corner rank is included in this PNG.
6. Compose each face from its base template and runtime overlays. Keep card identity and face-up/face-down state separate from the selected texture.

### Card assembly recipes

Here, a **central pip** means one instance of a suit symbol placed in the middle of a card. It is separate from the two smaller corner suit marks.

| Card type or state | Base sprite | Added by the game |
|---|---|---|
| Face-down card | `card_back` | No visible rank or suit |
| Ace | `plain_face` | Two `A` indices, two corner suit marks, and one larger central suit pip |
| Number card, 2–10 | `plain_face` | Two rank indices, two corner suit marks, and the corresponding number of central pips |
| Jack | `jack` | Two `J` indices and two corner suit marks |
| Queen | `queen` | Two `Q` indices and two corner suit marks |
| King | `king` | Two `K` indices and two corner suit marks |
| Joker | `joker` | No overlay required; any optional Joker designation is game-authored |
| Unassigned or custom face | `plain_face` | The game's chosen content, within the card outline |

A conventional 52-card deck can reuse these templates for four suits and thirteen ranks per suit: Ace, 2–10, Jack, Queen, and King. Joker count and behavior are rule choices. The sprite sheet does not contain 52 precomposed card images, card values, a shuffle order, or game rules.

### Suggested index layout

These are recommended **local destination rectangles**, not additional image assets. They leave padding inside the reserved upper-left index area.

| Element | Upper-left destination rectangle | Matching lower-right rectangle after 180° rotation |
|---|---|---|
| Rank glyph or `10` glyph group | `(14, 14, 28, 22)` | `(118, 188, 28, 22)` |
| Suit mark | `(22, 39, 12, 12)` | `(126, 173, 12, 12)` |

Render the rank in a readable pixel font and fit both digits of `10` inside the rank rectangle. Match the rank color to the selected suit if using the conventional red/black distinction. Clip the entire upper-left index group to `(12, 12, 32, 48)`; rotating that group also rotates its clipping region into the lower-right reserve.

### Suggested numbered-card pip layouts

The following center positions are an optional, complete layout for Ace through 10. They are **card-local coordinates**, not atlas coordinates. Use a **32 × 32** destination square for the Ace's central symbol and **20 × 20** for each central pip on ranks 2–10. The crop sampled for each stamp remains the same 96 × 96 suit source rectangle.

| Rank | Central pip count | Local pip centers `(x, y)` |
|---|---:|---|
| A | 1 | `(80,112)` |
| 2 | 2 | `(80,60)`, `(80,164)` |
| 3 | 3 | `(80,60)`, `(80,112)`, `(80,164)` |
| 4 | 4 | `(56,60)`, `(104,60)`, `(56,164)`, `(104,164)` |
| 5 | 5 | `(56,60)`, `(104,60)`, `(80,112)`, `(56,164)`, `(104,164)` |
| 6 | 6 | `(56,60)`, `(104,60)`, `(56,112)`, `(104,112)`, `(56,164)`, `(104,164)` |
| 7 | 7 | `(56,60)`, `(104,60)`, `(80,86)`, `(56,112)`, `(104,112)`, `(56,164)`, `(104,164)` |
| 8 | 8 | `(56,60)`, `(104,60)`, `(80,86)`, `(56,112)`, `(104,112)`, `(80,138)`, `(56,164)`, `(104,164)` |
| 9 | 9 | `(56,52)`, `(104,52)`, `(56,92)`, `(104,92)`, `(80,112)`, `(56,132)`, `(104,132)`, `(56,172)`, `(104,172)` |
| 10 | 10 | `(56,52)`, `(104,52)`, `(80,72)`, `(56,92)`, `(104,92)`, `(56,132)`, `(104,132)`, `(80,152)`, `(56,172)`, `(104,172)` |

All listed stamp rectangles fit within the plain face and avoid both index reserves. For a conventional opposed arrangement, rotate pips whose center is below y112 by 180°; leave pips on the middle line upright. Do not place these central pip patterns over the court portraits.

### JavaScript example: descriptors and card composition

This Canvas 2D example draws one native-size card at the current local origin. It assumes `npc_playing_card_spritesheet.png` is loaded into `image`; the `DECK_ID` and `DECK_IMAGE_FILE` constants below identify that theme for the caller's loader and cache. The caller supplies `drawRankGlyph(ctx, rank, rectangle, color)`, a routine that draws the game's pixel-font glyphs inside the given rectangle. That callback is required for ordinary face-up cards because rank glyphs are not part of the atlas.

```javascript
const DECK_ID = "npc";
const DECK_IMAGE_FILE = "npc_playing_card_spritesheet.png";
const CARD_WIDTH = 160;
const CARD_HEIGHT = 224;
const CARD_COLUMNS = 5;
const CARD_PIVOT = { x: 80, y: 112 };

const spriteGrid = {
  card_back: [1, 1], joker: [1, 2], king: [1, 3],
  queen: [1, 4], jack: [1, 5], plain_face: [2, 1],
  heart: [2, 2], diamond: [2, 3], spade: [2, 4], club: [2, 5]
};

const CARD_SPRITES = Object.fromEntries(
  Object.entries(spriteGrid).map(([id, [row, column]]) => [id, {
    id, row, column,
    index: (row - 1) * CARD_COLUMNS + column - 1,
    rect: { x: (column - 1) * CARD_WIDTH,
            y: (row - 1) * CARD_HEIGHT,
            width: CARD_WIDTH, height: CARD_HEIGHT }
  }])
);

const SUIT_COLORS = {
  heart: "#922738", diamond: "#922738",
  spade: "#222630", club: "#222630"
};
const COURT_SPRITES = { J: "jack", Q: "queen", K: "king" };

const PIP_LAYOUTS = {
  A: [[80,112]],
  2: [[80,60],[80,164]],
  3: [[80,60],[80,112],[80,164]],
  4: [[56,60],[104,60],[56,164],[104,164]],
  5: [[56,60],[104,60],[80,112],[56,164],[104,164]],
  6: [[56,60],[104,60],[56,112],[104,112],[56,164],[104,164]],
  7: [[56,60],[104,60],[80,86],[56,112],[104,112],
      [56,164],[104,164]],
  8: [[56,60],[104,60],[80,86],[56,112],[104,112],
      [80,138],[56,164],[104,164]],
  9: [[56,52],[104,52],[56,92],[104,92],[80,112],
      [56,132],[104,132],[56,172],[104,172]],
  10: [[56,52],[104,52],[80,72],[56,92],[104,92],
       [56,132],[104,132],[80,152],[56,172],[104,172]]
};

function drawCardSprite(ctx, image, id) {
  const r = CARD_SPRITES[id].rect;
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    0, 0, CARD_WIDTH, CARD_HEIGHT);
}

function stampSuit(ctx, image, suit, centerX, centerY, size, upsideDown = false) {
  const r = CARD_SPRITES[suit].rect;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.translate(centerX, centerY);
    if (upsideDown) ctx.rotate(Math.PI);
    ctx.drawImage(image, r.x + 32, r.y + 64, 96, 96,
      -size / 2, -size / 2, size, size);
  } finally {
    ctx.restore();
  }
}

function drawUpperIndex(ctx, image, rank, suit, drawRankGlyph) {
  ctx.save();
  try {
    ctx.beginPath();
    ctx.rect(12, 12, 32, 48);
    ctx.clip();
    drawRankGlyph(ctx, rank, { x: 14, y: 14, width: 28, height: 22 },
      SUIT_COLORS[suit]);
    stampSuit(ctx, image, suit, 28, 45, 12);
  } finally {
    ctx.restore();
  }
}

function drawDeckCard(ctx, image, card, drawRankGlyph) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  try {
    if (card.faceDown) {
      drawCardSprite(ctx, image, "card_back");
      return;
    }
    const rank = String(card.rank).toUpperCase();
    if (rank === "JOKER") {
      drawCardSprite(ctx, image, "joker");
      return;
    }
    const suit = card.suit; // heart, diamond, spade, or club
    if (!Object.prototype.hasOwnProperty.call(SUIT_COLORS, suit)) {
      throw new RangeError("Unknown card suit");
    }
    const isCourt = Object.prototype.hasOwnProperty.call(COURT_SPRITES, rank);
    const isNumber = Object.prototype.hasOwnProperty.call(PIP_LAYOUTS, rank);
    if (!isCourt && !isNumber) throw new RangeError("Unknown card rank");
    if (typeof drawRankGlyph !== "function") {
      throw new TypeError("Supply the game's bitmap-font rank renderer");
    }

    drawCardSprite(ctx, image, isCourt ? COURT_SPRITES[rank] : "plain_face");
    if (isNumber) {
      const size = rank === "A" ? 32 : 20;
      for (const [x, y] of PIP_LAYOUTS[rank]) {
        stampSuit(ctx, image, suit, x, y, size, y > CARD_PIVOT.y);
      }
    }
    drawUpperIndex(ctx, image, rank, suit, drawRankGlyph);
    ctx.save();
    try {
      ctx.translate(CARD_WIDTH, CARD_HEIGHT);
      ctx.rotate(Math.PI);
      drawUpperIndex(ctx, image, rank, suit, drawRankGlyph);
    } finally {
      ctx.restore();
    }
  } finally {
    ctx.restore();
  }
}

// Example calls after loading image and providing drawRankGlyph:
// drawDeckCard(ctx, image, { rank: "7", suit: "heart" }, drawRankGlyph);
// drawDeckCard(ctx, image, { rank: "K", suit: "spade" }, drawRankGlyph);
// drawDeckCard(ctx, image, { faceDown: true });
// drawDeckCard(ctx, image, { rank: "JOKER" });
```

The composition helpers restore the caller's Canvas state if a rank renderer or image draw throws an error, and the error continues to the caller.

The function draws into the caller's current coordinate system; it does not clear the destination or position the card on a game table. Clear an offscreen card texture before composing into it, or let the scene renderer redraw its background. To place a card around a world/UI center, translate to that center, apply the card's scale and rotation, then translate by `(-80, -112)` before calling the function. This keeps portraits, ranks, corner symbols, and central pips together during movement.

If faces are cached, include the **deck/theme ID**, rank, suit, and relevant visual style in each cache key, for example `npc:K:spade`. Otherwise a cached King from another theme can appear after switching to the NPC deck. Keep the logical card object separate from that image so several identical-looking cards or Jokers can still be distinct game objects.

### Display states and transitions

The sheet supplies one static image per component. There is no left-to-right flip sequence, deal loop, shuffle row, or intermediate edge-on card sprite.

| Current action or state | Recommended display behavior | Finish / controller event |
|---|---|---|
| Face down | Hold `card_back` at the card's current transform. | Continue until the game reveals it. |
| Face up | Hold the assembled rank/suit face or the Joker. | Continue until its state changes. |
| Dealing | Move the complete card from the deck position to its destination. | Mark the move complete once the card arrives. |
| Revealing / flipping | Compress the visible card horizontally about its center, swap the displayed side at the narrowest point, then expand. | Hold the revealed face; issue the side-change event once. |
| Hiding a card | Use the same flip behavior with the front and back exchanged. | Hold `card_back`. |
| Selecting / hovering | Apply a small whole-card lift, scale change, or game-authored outline. | Return to the resting transform when selection ends. |
| Discarding / collecting | Move or fade the complete card according to the game's presentation. | Remove it from the scene when the controller finishes. |

A **200 ms flip** is a reasonable starting choice: spend 100 ms compressing and 100 ms expanding. For progress `t` from 0 to 1, `abs(cos(PI*t))` supplies a simple horizontal scale. Swap the displayed texture when crossing `t = 0.5`, even if a long update skips over that exact instant. Skip drawing at zero width if the renderer requires it. The duration, side-change event, and game rules remain controller choices; they are not encoded in any atlas cell.

## 5. Important integration notes

### Verified relationships in the delivered PNG

These checks refer to the final PNG pixels, not only the original design request.

| Relationship or property | Verified result |
|---|---|
| Six card outlines | Identical alpha masks, each with 35,252 opaque pixels; tight local bounds `(1, 0, 158, 224)` inside its 160 × 224 cell |
| All six card frames | Same complete eight-pixel perimeter as the corrected dungeon deck |
| Side-border registration | Opaque side spans x1–158 throughout local rows 8–215; left and right border strips match across rows 111/112 |
| Back and entire bottom row | Pixel-identical to both `hero_playing_card_spritesheet.png` and `playing_card_spritesheet_v2.png` |
| Shared back reflected left/right or top/bottom | Identical pixels; the center line and arch artwork remain aligned |
| Shared back rotated 180° | Identical pixels |
| King, Queen, and Jack rotated 180° | Each template is identical to its own rotated copy |
| Plain face rotated 180° | Identical pixels |
| Joker rotated 180° | Different; its portrait has one upright orientation |
| All ten standard index patches across five faces | Uniform opaque RGBA `(247, 230, 209, 255)` |
| Heart and Diamond | One opaque color each, RGB `(146, 39, 56)` |
| Spade and Club | One opaque color each, RGB `(34, 38, 48)` |
| Transparency | Every pixel has alpha 0 or 255; no translucent fringe |
| Baked-in card identity | No ranks, numbers, or corner suit assignments; game data supplies them |

### Compatibility with the hero and corrected dungeon decks

All three decks use the same sprite IDs, row and column order, extraction rectangles, card pivot, standard index reserves, suit crops, and overlay colors. The six reused sprites are flattened indices **0, 5, 6, 7, 8, and 9**: Back, Plain Face, Heart, Diamond, Spade, and Club. Only the four portrait interiors at indices **1–4** differ. The NPC PNG also preserves the hero sheet's complete alpha layout and the common eight-pixel frame perimeter.

| Deck theme | PNG | Joker / King / Queen / Jack |
|---|---|---|
| NPC | `npc_playing_card_spritesheet.png` | Young Villager / Shopkeeper / Village Elder / Village Priest |
| Hero | `hero_playing_card_spritesheet.png` | Dark Swordsman / Older Light-and-Space Mage / Water Mage woman / Earth Mage |
| Corrected dungeon | `playing_card_spritesheet_v2.png` | Skeletal Jester / Skeletal Monarch / Crypt Queen / Young Skeleton Guard |

Switch themes by selecting a different loaded image while retaining the same `drawDeckCard` function, logical card data, and slicing descriptors. Include the chosen theme in every composed-face cache key. No costume color, trade item, sun charm, or NPC identity changes the suit or rank recorded in the game's card object.

Use the corrected dungeon filename shown above when comparing or swapping decks. The older `playing_card_spritesheet.png` is a separate earlier asset and is not the reference for the verified shared-pixel comparisons in this guide.

### Preserve pivots and relative symbol sizes

Keep the complete card rectangle and fixed `(80, 112)` pivot when changing between back and face. Automatically trimming every sprite independently can cause a visible position shift or change the apparent card size.

The four suit icons have intentionally different tight bounds. The common 96 × 96 crop preserves their relative scale and alignment. The Spade's measured opaque bounding-box center is `(80, 111.5)` in the full cell, while the other three are `(80, 112)`. Retain the shared logical `(80, 112)` anchor rather than independently moving each silhouette to its own visible center. The half-pixel difference comes from the Spade's odd-height pixel footprint.

If an importer trims icons, preserve each trim offset and use the corresponding pivot from section 6. Do not stretch a tight Heart, Diamond, Spade, or Club crop into a common square: that changes the proportions and relative visual weight. Either retain the common sampling box or scale tight crops uniformly while retaining their original offsets.

### Rendering, borders, and transparency

Use point sampling and integer display positions when practical. Integer enlargement preserves the native pixel grid; deliberate reduction of suit symbols is already supported by sampling their common crop. Inspect corner marks at the game's actual display size, especially the two-digit rank `10`. A bitmap font keeps the rank treatment consistent with the artwork.

The card interiors are opaque parchment or midnight blue. The NPCs' clothing, crowns, circlet, bottle, purses, walking stick, and sun objects are part of the static portrait artwork inside the cards. Pixels outside the rounded card outlines are transparent, and suit cells are transparent everywhere except their silhouettes. There are no cast shadows or glows outside the cards, guide lines, or additional sheet border.

The source atlas has **zero gutters**. When repacking it for a renderer that uses filtering or mipmaps, add padding/extrusion in the destination atlas and retain the original logical rectangles and pivots. Do not expand a source crop into an adjacent cell to create padding. Preserve the original PNG alpha and avoid lossy recompression.

### Runtime overlays and orientation

Keep all rank glyphs and corner suit marks inside their reserved rectangles, and rotate the complete lower index group by 180°. Scale and rotate the assembled face as a unit. The portrait templates do not encode a particular suit; use the same King, Queen, and Jack artwork for all suits.

The exact 180° symmetry guarantee applies to the delivered static back and the listed templates. A composed numbered card has the pip arrangement and orientation chosen by the game. The Joker remains an upright portrait. A 90° rotation is not an alternate upright card orientation.

The sheet contains no animation timing, face selection logic, hit areas, rank values, scoring, deck order, or randomization. Define interaction bounds and game rules separately. An opaque-pixel mask can support rounded-corner hit testing if desired, while a full 160 × 224 logical rectangle is a convenient default for layout.

## 6. Exact rectangle appendix

All rectangles below use **`(x, y, width, height)`**, with excluded right and bottom edges. Atlas coordinates use the full 800 × 448 image. Local coordinates use the relevant 160 × 224 cell.

### Full-cell rectangles

| Row | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
|---|---|---|---|---|---|
| 1 | Back `(0, 0, 160, 224)` | Joker `(160, 0, 160, 224)` | King `(320, 0, 160, 224)` | Queen `(480, 0, 160, 224)` | Jack `(640, 0, 160, 224)` |
| 2 | Plain face `(0, 224, 160, 224)` | Heart `(160, 224, 160, 224)` | Diamond `(320, 224, 160, 224)` | Spade `(480, 224, 160, 224)` | Club `(640, 224, 160, 224)` |

### Card outline and optional trimmed bounds

The full 160 × 224 cell is the recommended import rectangle. The following are measured tight bounds if a tool requires trimming. The bounding rectangles still contain transparent corner pixels. The common pivot becomes `(79, 112)` relative to a trimmed card because the trim removes one pixel column on the left.

| Card | Tight local rectangle | Tight atlas rectangle | Opaque pixels |
|---|---|---|---:|
| Back | `(1, 0, 158, 224)` | `(1, 0, 158, 224)` | 35,252 |
| Joker | `(1, 0, 158, 224)` | `(161, 0, 158, 224)` | 35,252 |
| King | `(1, 0, 158, 224)` | `(321, 0, 158, 224)` | 35,252 |
| Queen | `(1, 0, 158, 224)` | `(481, 0, 158, 224)` | 35,252 |
| Jack | `(1, 0, 158, 224)` | `(641, 0, 158, 224)` | 35,252 |
| Plain face | `(1, 0, 158, 224)` | `(1, 224, 158, 224)` | 35,252 |

### Global index rectangles in the atlas

These identify blank areas **inside each source template**. When composing a card at native size, use the shared local index rectangles from section 2 instead of these atlas offsets.

| Face template | Upper-left index in atlas | Lower-right index in atlas |
|---|---|---|
| Joker | `(172, 12, 32, 48)` | `(276, 164, 32, 48)` |
| King | `(332, 12, 32, 48)` | `(436, 164, 32, 48)` |
| Queen | `(492, 12, 32, 48)` | `(596, 164, 32, 48)` |
| Jack | `(652, 12, 32, 48)` | `(756, 164, 32, 48)` |
| Plain face | `(12, 236, 32, 48)` | `(116, 388, 32, 48)` |

### Suit sampling and exact opaque bounds

The **recommended common crop** is the source rectangle for uniform suit stamping. The **tight crop** is the measured opaque bounding rectangle; transparent pixels can still occur inside that rectangle around the silhouette's curved or angled edges.

| Suit | Recommended common atlas crop | Tight local crop | Tight atlas crop | Logical pivot within tight crop |
|---|---|---|---|---|
| Heart | `(192, 288, 96, 96)` | `(37, 71, 86, 82)` | `(197, 295, 86, 82)` | `(43, 41)` |
| Diamond | `(352, 288, 96, 96)` | `(33, 65, 94, 94)` | `(353, 289, 94, 94)` | `(47, 47)` |
| Spade | `(512, 288, 96, 96)` | `(39, 66, 82, 91)` | `(519, 290, 82, 91)` | `(41, 46)` |
| Club | `(672, 288, 96, 96)` | `(35, 67, 90, 90)` | `(675, 291, 90, 90)` | `(45, 45)` |

For example, the Heart's common crop covers atlas pixel columns **192–287** and rows **288–383**. Its actual opaque bounding rectangle covers columns **197–282** and rows **295–376**. Keep the common crop's transparent padding when following the composition example.

For normalized atlas coordinates, divide an atlas rectangle's x and width by **800**, and its y and height by **448**. Those are image-texture coordinates, not card-local layout coordinates. The sprite IDs, suggested pip layouts, and display timings in this guide can be renamed or tuned without changing the source rectangles.
