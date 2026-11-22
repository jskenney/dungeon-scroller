// Asset viewer: shows every sprite sheet entity, tileset and card named in the
// site configuration, exactly as the game's loader builds them, and reports
// anything in the JSON that does not match the images.

import { Application, Container, Graphics, Sprite, Text } from '../../vendor/pixi.min.mjs';
import { loadConfig } from '../config.js';
import { loadAssets } from '../assets/loader.js';
import { sampleClip, eventsOnFrame, locomotion, clipLength } from '../assets/animation.js';

const $ = id => document.getElementById(id);

/** Tiny DOM builder: h('p', {class: 'x'}, 'text', childNode, …). Text is never parsed as HTML. */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'style') Object.assign(el.style, value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const COLORS = {
  background: 0x0d0f14, ground: 0x4b556b, cell: 0x3b4458, pivot: 0xe0b354, bounds: 0x63c98a,
  selected: 0xe0b354, label: 0x8b94a8, checkerA: 0x161b26, checkerB: 0x1d2331, grid: 0x39425a,
  solid: 0xef6b6b, platform: 0x5ac8fa, rect: 0xf59e42, slope: 0xc084fc, stairs: 0xc084fc, hover: 0xffffff,
};
const KIND_TITLES = { player: 'Players', enemy: 'Enemies', boss: 'Bosses', npc: 'NPCs', object: 'Objects' };
const HOLD_MS = 600; // pause on the last frame before a one-shot animation repeats

const state = {
  config: null, configUrl: '', usedExample: false, assets: null,
  selection: null,          // {type: 'entity'|'tileset'|'card'|'problems', item}
  slot: 'idle',
  entityView: 'single',     // 'single' | 'all'
  tilesetView: 'atlas',     // 'atlas' | 'built'
  zoom: null,               // device pixels per art pixel; null = fit automatically
  pan: { x: 0, y: 0 },
  playing: true, speed: 1, flip: false, elapsed: 0,
  hoverTile: null, pinnedTile: null,
  edits: {},                // unsaved frame offsets: "sheet.json|entity|slot" -> [[dx, dy], …]
};
const EDITS_KEY = 'dungeon-scroller.viewer.offsetEdits';

let app;
/** Things the per-frame update needs from the scene that was last built. */
let scene = { sprites: [], frameShown: -1, tileAt: null, highlight: null };

// --------------------------------------------------------------------- helpers

const dpr = () => window.devicePixelRatio || 1;
/** Snap a CSS-pixel coordinate to a whole device pixel so art stays sharp. */
const snap = v => Math.round(v * dpr()) / dpr();

function displayFrame(clip, elapsed) {
  if (clip.loop) return sampleClip(clip, elapsed).frame;
  return sampleClip(clip, elapsed % (clipLength(clip) + HOLD_MS)).frame;
}

function frameStart(clip, frame) {
  return clip.durations.slice(0, frame).reduce((a, b) => a + b, 0);
}

const editKey = (entity, clip) => `${entity.sheet.url.split('/').pop()}|${entity.id}|${clip.slot}`;

/** Per-frame [dx, dy] offsets in art pixels: unsaved edits first, then the JSON, then none. */
function offsetsFor(entity, clip) {
  return state.edits[editKey(entity, clip)] ?? clip.offsets ?? clip.durations.map(() => [0, 0]);
}

function saveEdits() {
  try { localStorage.setItem(EDITS_KEY, JSON.stringify(state.edits)); } catch { /* storage unavailable */ }
}

function loadEdits() {
  try { state.edits = JSON.parse(localStorage.getItem(EDITS_KEY)) ?? {}; } catch { state.edits = {}; }
  // Drop adjustments that the JSON files now contain, or that no longer match anything.
  const saved = {};
  for (const entity of Object.values(state.assets.entities)) {
    for (const clip of Object.values(entity.animations)) {
      saved[editKey(entity, clip)] = JSON.stringify(clip.offsets ?? clip.durations.map(() => [0, 0]));
    }
  }
  for (const [key, offsets] of Object.entries(state.edits)) {
    if (!(key in saved) || saved[key] === JSON.stringify(offsets)) delete state.edits[key];
  }
  saveEdits();
}

/** Move the frame on screen by (dx, dy) art pixels and remember it as an unsaved edit. */
function nudge(dx, dy) {
  const entity = state.selection?.type === 'entity' ? state.selection.item : null;
  const clip = currentClip();
  if (!entity || state.entityView !== 'single') return;
  const offsets = offsetsFor(entity, clip).map(o => [...o]);
  const frame = displayFrame(clip, state.elapsed);
  offsets[frame] = dx === null ? [0, 0] : [offsets[frame][0] + dx, offsets[frame][1] + dy];
  const original = clip.offsets ?? clip.durations.map(() => [0, 0]);
  if (JSON.stringify(offsets) === JSON.stringify(original)) delete state.edits[editKey(entity, clip)];
  else state.edits[editKey(entity, clip)] = offsets;
  saveEdits();
  state.playing = false;
  state.elapsed = frameStart(clip, frame);
  refresh();
}

/** Unsaved edits as JSON grouped by sheet file, entity and animation slot. */
function editsAsJson() {
  const out = {};
  for (const [key, offsets] of Object.entries(state.edits)) {
    const [file, entity, slot] = key.split('|');
    ((out[file] ??= {})[entity] ??= {})[slot] = offsets;
  }
  return JSON.stringify(out, null, 1).replace(/\[\s+(-?\d+),\s+(-?\d+)\s+\]/g, '[$1, $2]').replace(/\],\s+\[/g, '], [').replace(/\[\s+\[/g, '[[').replace(/\]\s+\]/g, ']]');
}

function currentClip() {
  const entity = state.selection?.type === 'entity' ? state.selection.item : null;
  return entity ? (entity.animations[state.slot] ?? entity.animations.idle ?? Object.values(entity.animations)[0]) : null;
}

function facingText(entity) {
  if (entity.kind === 'object') return 'not directional';
  const native = entity.sheet.facing;
  const shown = state.flip ? (native === 'left' ? 'right' : 'left') : native;
  return `facing ${shown}${state.flip ? ' (mirrored)' : ' (as drawn)'}`;
}

function endText(clip) {
  if (clip.loop) return 'loops';
  return { state: 'plays once', hold: 'plays once, holds last frame', remove: 'plays once, then removed' }[clip.end] ?? 'plays once';
}

// ------------------------------------------------------------------ navigation

function hashFor(selection, slot) {
  if (!selection) return '';
  if (selection.type === 'problems') return '#problems';
  if (selection.type === 'entity') return `#${selection.item.kind}/${selection.item.id}${slot ? '/' + slot : ''}`;
  return `#${selection.type}/${selection.item.id}`;
}

function selectionFromHash() {
  const [type, id, slot] = decodeURIComponent(location.hash.slice(1)).split('/');
  const a = state.assets;
  if (type === 'problems') return { selection: { type: 'problems' } };
  if (type === 'tileset') {
    const item = a.tilesets.find(t => t.id === id);
    if (item) return { selection: { type: 'tileset', item } };
  } else if (type === 'card') {
    const item = a.cards.find(c => c.id === id);
    if (item) return { selection: { type: 'card', item } };
  } else if (a.entities[`${type}/${id}`]) {
    return { selection: { type: 'entity', item: a.entities[`${type}/${id}`] }, slot };
  }
  return null;
}

function defaultSelection() {
  const a = state.assets;
  if (a.problems.some(p => p.level === 'error')) return { type: 'problems' };
  const first = Object.values(a.entities)[0];
  if (first) return { type: 'entity', item: first };
  if (a.tilesets[0]) return { type: 'tileset', item: a.tilesets[0] };
  if (a.cards[0]) return { type: 'card', item: a.cards[0] };
  return { type: 'problems' };
}

function buildNav() {
  const nav = $('nav');
  nav.replaceChildren();
  const a = state.assets;
  for (const [kind, title] of Object.entries(KIND_TITLES)) {
    const list = Object.values(a.entities).filter(e => e.kind === kind);
    if (!list.length) continue;
    nav.append(h('h3', {}, title));
    for (const e of list) nav.append(h('a', { href: hashFor({ type: 'entity', item: e }) }, e.name));
  }
  if (a.tilesets.length) {
    nav.append(h('h3', {}, 'Tilesets'));
    for (const t of a.tilesets) nav.append(h('a', { href: `#tileset/${t.id}` }, t.id.replaceAll('_', ' ')));
  }
  if (a.cards.length) {
    nav.append(h('h3', {}, 'Cards'));
    for (const c of a.cards) nav.append(h('a', { href: `#card/${c.id}` }, c.subjectEntity?.name ?? c.id));
  }
}

function markNav() {
  const base = hashFor(state.selection);
  for (const link of $('nav').querySelectorAll('a')) {
    if (link.getAttribute('href') === base) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function applyHash() {
  const parsed = selectionFromHash() ?? { selection: defaultSelection() };
  const changedItem = parsed.selection.type !== state.selection?.type || parsed.selection.item !== state.selection?.item;
  state.selection = parsed.selection;
  if (changedItem) {
    state.zoom = null;
    state.pan = { x: 0, y: 0 };
    state.elapsed = 0;
    state.hoverTile = state.pinnedTile = null;
    state.slot = 'idle';
  }
  if (parsed.slot && state.selection.item?.animations?.[parsed.slot] && parsed.slot !== state.slot) {
    state.slot = parsed.slot;
    state.elapsed = 0;
  }
  refresh();
}

/** Change the address bar without adding a history entry for every click. */
function setHash(selection, slot) {
  history.replaceState(null, '', hashFor(selection, slot));
  applyHash();
}

// ---------------------------------------------------------------------- scenes

function clearStage() {
  for (const child of app.stage.removeChildren()) child.destroy({ children: true });
  scene = { sprites: [], frameShown: -1, tileAt: null, highlight: null, contentHeight: null };
}

function label(text, x, y, color = COLORS.label) {
  const t = new Text({ text, style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: color } });
  t.position.set(snap(x), snap(y));
  return t;
}

function buildEntitySingle(entity) {
  const { w: cw, h: ch } = entity.sheet.cell;
  const pivot = entity.pivot ?? entity.sheet.pivot;
  const W = app.screen.width, H = app.screen.height;
  const zoom = state.zoom ?? Math.max(1, Math.min(12, Math.floor(Math.min(W * 0.8 / cw, H * 0.72 / ch) * dpr())));
  const S = zoom / dpr();
  const ox = snap(W / 2 + state.pan.x), oy = snap(H * 0.74 + state.pan.y);
  const clip = currentClip();
  const mirror = state.flip ? -1 : 1;
  const g = new Graphics();

  if ($('show-pivot').checked) {
    g.moveTo(0, oy).lineTo(W, oy).stroke({ width: 1, color: COLORS.ground });
  }
  // The cell, as placed around the pivot (mirroring keeps the pivot fixed).
  const cellLeft = ox - (state.flip ? cw - pivot.x : pivot.x) * S;
  if ($('show-cell').checked) {
    g.rect(cellLeft, oy - pivot.y * S, cw * S, ch * S).stroke({ width: 1, color: COLORS.cell });
  }
  const sprite = new Sprite(clip.frames[0]);
  sprite.pivot.set(pivot.x, pivot.y);
  sprite.scale.set(S * mirror, S);
  // Faint copy of the first idle frame, as a fixed reference for lining frames up.
  let ghost = null;
  if ($('show-ghost').checked && entity.animations.idle) {
    const idle = entity.animations.idle;
    const [gx, gy] = offsetsFor(entity, idle)[0];
    ghost = new Sprite(idle.frames[0]);
    ghost.pivot.set(pivot.x, pivot.y);
    ghost.scale.set(S * mirror, S);
    ghost.position.set(ox + gx * S * mirror, oy + gy * S);
    ghost.alpha = 0.35;
    ghost.tint = 0x66ccff;
  }
  const overlay = new Graphics();
  if ($('show-bounds').checked && entity.idleBounds) {
    const b = entity.idleBounds;
    const left = state.flip ? ox - (b.x + b.w - pivot.x) * S : ox + (b.x - pivot.x) * S;
    overlay.rect(left, oy + (b.y - pivot.y) * S, b.w * S, b.h * S).stroke({ width: 1, color: COLORS.bounds });
  }
  if ($('show-pivot').checked) {
    overlay.moveTo(ox - 7, oy).lineTo(ox + 7, oy).moveTo(ox, oy - 7).lineTo(ox, oy + 7).stroke({ width: 1, color: COLORS.pivot });
  }
  app.stage.addChild(g);
  if (ghost) app.stage.addChild(ghost);
  app.stage.addChild(sprite, overlay);
  scene.sprites = [{ sprite, clip, entity, x: ox, y: oy, S, mirror }];
  return zoom;
}

function buildEntityAll(entity) {
  const { w: cw, h: ch } = entity.sheet.cell;
  const clips = Object.values(entity.animations);
  const W = app.screen.width, H = app.screen.height;
  const gap = 10, labelH = 20, margin = 14;
  const layout = zoom => {
    const S = zoom / dpr();
    const cols = Math.max(1, Math.min(clips.length, Math.floor((W - margin * 2 + gap) / (cw * S + gap))));
    const rows = Math.ceil(clips.length / cols);
    return { S, cols, rows, height: rows * (ch * S + labelH + gap) + margin * 2 };
  };
  // Prefer a readable size and let the grid scroll, unless a larger size fits whole.
  let zoom = state.zoom;
  if (zoom == null) {
    zoom = Math.max(1, Math.floor(4 * dpr()));
    while (zoom > Math.max(1, Math.round(2 * dpr())) && layout(zoom).height > H) zoom--;
    while (zoom > 1 && layout(zoom).cols < Math.min(3, clips.length)) zoom--;
  }
  const { S, cols, height } = layout(zoom);
  scene.contentHeight = height;
  state.pan.y = Math.min(0, Math.max(state.pan.y, H - height));
  state.pan.x = 0;
  const totalW = cols * (cw * S + gap) - gap;
  const left = Math.max(margin, (W - totalW) / 2) + state.pan.x;
  const g = new Graphics();
  app.stage.addChild(g);
  clips.forEach((clip, i) => {
    const x = snap(left + (i % cols) * (cw * S + gap));
    const y = snap(margin + state.pan.y + Math.floor(i / cols) * (ch * S + labelH + gap));
    const selected = clip.slot === state.slot;
    g.rect(x, y, cw * S, ch * S).fill({ color: COLORS.checkerA })
      .stroke({ width: 1, color: selected ? COLORS.selected : COLORS.cell });
    const sprite = new Sprite(clip.frames[0]);
    sprite.scale.set(state.flip ? -S : S, S);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    sprite.on('pointertap', () => { state.entityView = 'single'; state.zoom = null; state.pan = { x: 0, y: 0 }; setHash(state.selection, clip.slot); });
    const caption = label(`${clip.slot} · ${clip.label}`, x + 2, y + ch * S + 3, selected ? COLORS.selected : COLORS.label);
    if (caption.width > cw * S - 4) caption.text = clip.slot;
    app.stage.addChild(sprite, caption);
    scene.sprites.push({ sprite, clip, entity, x: state.flip ? x + cw * S : x, y, S, mirror: state.flip ? -1 : 1 });
  });
  return zoom;
}

/** Draw a tile's collision shape; (x, y) is the tile's top-left on screen. */
function drawShape(g, tile, x, y, S) {
  const fill = (color) => ({ color, alpha: 0.18 });
  const line = (color) => ({ width: 1, color, alpha: 0.9 });
  switch (tile.shape) {
    case 'solid':
      g.rect(x, y, 96 * S, 96 * S).fill(fill(COLORS.solid)).stroke(line(COLORS.solid));
      break;
    case 'platform':
      g.rect(x, y, 96 * S, 16 * S).fill(fill(COLORS.platform));
      g.moveTo(x, y + 1).lineTo(x + 96 * S, y + 1).stroke({ width: 2, color: COLORS.platform });
      break;
    case 'rect': {
      const [rx, ry, rw, rh] = tile.rect;
      g.rect(x + rx * S, y + ry * S, rw * S, rh * S).fill(fill(COLORS.rect)).stroke(line(COLORS.rect));
      break;
    }
    case 'slope_right':
      g.poly([x, y + 96 * S, x + 96 * S, y, x + 96 * S, y + 96 * S]).fill(fill(COLORS.slope)).stroke(line(COLORS.slope));
      break;
    case 'slope_left':
      g.poly([x, y, x + 96 * S, y + 96 * S, x, y + 96 * S]).fill(fill(COLORS.slope)).stroke(line(COLORS.slope));
      break;
    case 'stairs_right':
    case 'stairs_left':
      for (let i = 0; i < 6; i++) {
        const top = tile.shape === 'stairs_right' ? 80 - 16 * i : 16 * i;
        g.rect(x + i * 16 * S, y + top * S, 16 * S, (96 - top) * S).fill(fill(COLORS.stairs)).stroke(line(COLORS.stairs));
      }
      break;
    default:
  }
}

function checker(g, x, y, w, h, square) {
  g.rect(x, y, w, h).fill({ color: COLORS.checkerA });
  for (let j = 0; j * square < h; j++) {
    for (let i = (j % 2); i * square < w; i += 2) {
      g.rect(x + i * square, y + j * square, Math.min(square, w - i * square), Math.min(square, h - j * square)).fill({ color: COLORS.checkerB });
    }
  }
}

function buildTilesetAtlas(tileset) {
  const W = app.screen.width, H = app.screen.height;
  const cw = tileset.cell.w, ch = tileset.cell.h;
  const zoom = state.zoom ?? Math.max(1, Math.floor(Math.min((W - 28) / (tileset.columns * cw), (H - 28) / (tileset.rows * ch)) * dpr()));
  const S = zoom / dpr();
  const aw = tileset.columns * cw * S, ah = tileset.rows * ch * S;
  const left = snap(Math.max(14, (W - aw) / 2) + state.pan.x), top = snap(Math.max(14, (H - ah) / 2) + state.pan.y);
  const back = new Graphics(), shapes = new Graphics(), grid = new Graphics(), highlight = new Graphics();
  checker(back, left, top, aw, ah, cw * S / 4);
  app.stage.addChild(back);
  for (const tile of Object.values(tileset.tiles)) {
    const x = left + (tile.col - 1) * cw * S, y = top + (tile.row - 1) * ch * S;
    const sprite = new Sprite(tile.texture);
    sprite.position.set(x, y);
    sprite.scale.set(S);
    app.stage.addChild(sprite);
    if ($('show-shapes').checked) drawShape(shapes, tile, x, y, S);
  }
  if ($('show-grid').checked) {
    for (let c = 0; c <= tileset.columns; c++) grid.moveTo(left + c * cw * S, top).lineTo(left + c * cw * S, top + ah);
    for (let r = 0; r <= tileset.rows; r++) grid.moveTo(left, top + r * ch * S).lineTo(left + aw, top + r * ch * S);
    grid.stroke({ width: 1, color: COLORS.grid });
  }
  app.stage.addChild(shapes, grid, highlight);
  scene.highlight = highlight;
  scene.tileAt = (px, py) => {
    const col = Math.floor((px - left) / (cw * S)) + 1, row = Math.floor((py - top) / (ch * S)) + 1;
    return Object.values(tileset.tiles).find(t => t.col === col && t.row === row) ?? null;
  };
  scene.tileRect = tile => [left + (tile.col - 1) * cw * S, top + (tile.row - 1) * ch * S, cw * S, ch * S];
  drawTileHighlight();
  return zoom;
}

function drawTileHighlight() {
  const g = scene.highlight;
  if (!g) return;
  g.clear();
  for (const [tile, color] of [[state.pinnedTile, COLORS.selected], [state.hoverTile, COLORS.hover]]) {
    if (tile && scene.tileRect) g.rect(...scene.tileRect(tile)).stroke({ width: 2, color });
  }
}

/** Example constructions from the tileset's "runs" and "assemblies". */
function builtExamples(tileset) {
  const members = ref => tileset.groups?.[ref] ?? [ref];
  const pick = (ref, i) => members(ref)[i % members(ref).length];
  const examples = [];
  for (const [name, run] of Object.entries(tileset.runs ?? {})) {
    const parts = [];
    for (let i = 0; i < 5; i++) {
      parts.push({ tile: i === 0 ? pick(run.left, 0) : i === 4 ? pick(run.right, 0) : pick(run.center, i - 1), dx: i, dy: 0 });
      if (run.below) parts.push({ tile: pick(run.below, i), dx: i, dy: 1 });
    }
    if (run.single) parts.push({ tile: pick(run.single, 0), dx: 6, dy: 0 });
    examples.push({ name: `run: ${name}`, parts });
  }
  for (const [name, assembly] of Object.entries(tileset.assemblies ?? {})) {
    examples.push({ name, parts: assembly.parts });
  }
  for (const ex of examples) {
    const minX = Math.min(...ex.parts.map(p => p.dx)), minY = Math.min(...ex.parts.map(p => p.dy));
    ex.parts = ex.parts.map(p => ({ ...p, dx: p.dx - minX, dy: p.dy - minY }));
    ex.cols = Math.max(...ex.parts.map(p => p.dx)) + 1;
    ex.rows = Math.max(...ex.parts.map(p => p.dy)) + 1;
  }
  return examples;
}

function buildTilesetBuilt(tileset) {
  const W = app.screen.width, H = app.screen.height;
  const examples = builtExamples(tileset);
  const gap = 22, labelH = 20, margin = 14;
  const layout = zoom => {
    const S = zoom / dpr(), T = 96 * S;
    let x = margin, y = margin, rowH = 0;
    const places = examples.map(ex => {
      const w = Math.max(ex.cols * T, 110);
      if (x > margin && x + w > W - margin) { x = margin; y += rowH + gap; rowH = 0; }
      const place = { ex, x, y: y + labelH };
      x += w + gap;
      rowH = Math.max(rowH, ex.rows * T + labelH);
      return place;
    });
    return { S, T, places, height: y + rowH + margin };
  };
  let zoom = state.zoom;
  if (zoom == null) {
    zoom = Math.max(1, Math.floor(2 * dpr()));
    while (zoom > Math.max(1, Math.round(dpr())) && layout(zoom).height > H) zoom--;
  }
  const { S, T, places, height } = layout(zoom);
  scene.contentHeight = height;
  state.pan.y = Math.min(0, Math.max(state.pan.y, H - height));
  state.pan.x = 0;
  const shapes = new Graphics();
  for (const { ex, x, y } of places) {
    const px = snap(x + state.pan.x), py = snap(y + state.pan.y);
    app.stage.addChild(label(ex.name.replaceAll('_', ' '), px, py - labelH));
    for (const part of ex.parts) {
      const tile = tileset.tiles[part.tile];
      if (!tile) continue;
      const sprite = new Sprite(tile.texture);
      sprite.position.set(px + part.dx * T, py + part.dy * T);
      sprite.scale.set(S);
      app.stage.addChild(sprite);
      if ($('show-shapes').checked) drawShape(shapes, tile, px + part.dx * T, py + part.dy * T, S);
    }
  }
  app.stage.addChild(shapes);
  return zoom;
}

// ----------------------------------------------------------------- DOM panels

function buildCardView(card) {
  const pct = (v, total) => `${(v / total) * 100}%`;
  const area = (a, cls, ...children) => a && h('div', {
    class: `area ${cls}${$('show-areas').checked ? ' outline' : ''}`,
    style: { left: pct(a.x, card.size.w), top: pct(a.y, card.size.h), width: pct(a.w, card.size.w), height: pct(a.h, card.size.h) },
  }, ...children);
  const subject = card.subjectEntity;
  const abilities = subject ? ['attack1', 'attack2', 'attack3', 'attack4'].map(s => subject.animations[s]?.label).filter(Boolean) : [];
  const sample = $('show-sample').checked && h('div', { class: `text ${card.textTone === 'dark' ? 'dark' : 'light'}` },
    h('div', { class: 'name' }, subject?.name ?? card.id),
    h('div', {}, subject?.description ?? ''),
    h('ul', { class: 'abilities' }, abilities.map(a => h('li', {}, a))),
    h('div', { class: 'sample' }, 'Sample layout. Statistics will come from the gameplay catalog.'));
  const el = h('div', { class: 'card' },
    h('img', { src: card.imageUrl, alt: `${subject?.name ?? card.id} card` }),
    area(card.guideTextArea, 'guide'),
    area(card.textArea, 'main', sample));
  // Smooth when shown smaller than native size, crisp when larger.
  new ResizeObserver(() => {
    const large = el.clientWidth * dpr() > card.size.w;
    el.classList.toggle('large', large);
    el.classList.toggle('small', !large);
  }).observe(el);
  $('card-view').replaceChildren(el);
}

function buildProblemsView() {
  const { problems } = state.assets;
  const view = $('problems-view');
  view.replaceChildren(h('h2', {}, 'Checks'));
  view.append(h('p', { class: 'muted' },
    `Configuration: ${state.configUrl.split('/').pop()}` + (state.usedExample ? ' (dungeon.json was not found, so the example is in use).' : '.')));
  if (!problems.length) {
    view.append(h('p', { class: 'ok' }, 'Every JSON file matches its image. No problems found.'));
  }
  for (const p of problems) {
    view.append(h('div', { class: `problem ${p.level}` }, h('div', { class: 'file' }, `${p.level} · ${p.file}`), p.message));
  }
}

/** Fill the details panel, skipping empty entries. */
function setDetails(...nodes) {
  $('details').replaceChildren(...nodes.flat().filter(n => n != null && n !== false));
}

function row(dl, term, value) {
  if (value == null || value === '') return;
  dl.append(h('dt', {}, term), h('dd', {}, value));
}

function entityDetails(entity) {
  const sheet = entity.sheet;
  const clip = currentClip();
  const dl = h('dl');
  row(dl, 'Kind', entity.kind);
  row(dl, 'ID', entity.id);
  row(dl, 'Sheet', sheet.image);
  row(dl, 'Rows', `${entity.rows[0]}–${entity.rows[1]} of ${sheet.rows}`);
  row(dl, 'Cell', `${sheet.cell.w} × ${sheet.cell.h}`);
  row(dl, 'Pivot', `(${sheet.pivot.x}, ${sheet.pivot.y})`);
  if (entity.kind !== 'object') row(dl, 'Drawn facing', sheet.facing);
  if (entity.idleBounds) row(dl, 'Idle size', `${entity.idleBounds.w} × ${entity.idleBounds.h} px`);
  row(dl, 'Sits', { ground: 'on the ground', float: 'floating above the ground', wall: 'on a wall', hover: 'hovering' }[entity.registration]);
  row(dl, 'Reward', { accept: 'when the interaction starts', complete: 'when the interaction finishes' }[entity.commit]);
  if (entity.persistent) row(dl, 'After use', 'stays in its activated state');

  const move = locomotion(entity.animations, state.config.physics?.runSpeedMultiplier ?? 1.75);
  const moveText = move && (move.walk.slot === move.run.slot
    ? `Only a "${move.walk.slot}" cycle is drawn: it is used for walking, and played ${move.run.rate}× faster for running.`
    : 'Separate walk and run cycles are drawn; each is used for its own speed.');

  const list = h('div', { class: 'anim-list' }, Object.values(entity.animations).map(c =>
    h('button', { type: 'button', 'aria-pressed': String(c === clip), onclick: () => setHash(state.selection, c.slot) },
      h('span', {}, c.label, ' ', h('span', { class: 'slot' }, c.slot)),
      h('span', { class: 'muted' }, `${clipLength(c)} ms`))));

  const cdl = h('dl');
  row(cdl, 'Slot', clip.slot);
  row(cdl, 'Guide name', clip.id);
  row(cdl, 'Sheet row', clip.row);
  row(cdl, 'Playback', endText(clip));
  row(cdl, 'Length', `${clipLength(clip)} ms`);
  const events = (clip.events ?? []).map(e => h('li', {},
    h('span', { class: 'tag' }, e.type), ` frame ${e.frame}${e.until ? '–' + e.until : ''}`, e.note ? ` — ${e.note}` : ''));

  const offsets = offsetsFor(entity, clip);
  row(cdl, 'Frame offsets', offsets.some(o => o[0] || o[1]) ? JSON.stringify(offsets) : 'none');
  const editCount = Object.keys(state.edits).length;
  const editsPanel = editCount ? [
    h('h3', {}, `Unsaved adjustments (${editCount})`),
    h('p', { class: 'muted' }, 'These exist only in this browser. Copy them and send them to be written into the JSON files.'),
    h('textarea', { readonly: true, rows: 8, 'aria-label': 'Unsaved frame offsets as JSON' }, editsAsJson()),
    h('div', { class: 'row' },
      h('button', { type: 'button', onclick: async e => {
        try { await navigator.clipboard.writeText(editsAsJson()); e.target.textContent = 'Copied'; }
        catch { e.target.textContent = 'Select the text and copy it'; }
      } }, 'Copy'),
      h('button', { type: 'button', onclick: () => { if (confirm('Discard all unsaved frame adjustments?')) { state.edits = {}; saveEdits(); refresh(); } } }, 'Discard all')),
  ] : [];

  setDetails(
    h('h2', {}, entity.name), h('p', { class: 'muted' }, entity.description), dl,
    moveText && h('p', { class: 'muted', style: { marginTop: '10px' } }, moveText),
    h('h3', {}, 'Animations'), list,
    h('h3', {}, clip.label), cdl,
    events.length ? h('h3', {}, 'Events') : null, events.length ? h('ul', {}, events) : null,
    ...editsPanel,
    sheet.notes?.length ? h('h3', {}, 'Sheet notes') : null,
    sheet.notes?.length ? h('ul', {}, sheet.notes.map(n => h('li', {}, n))) : null);
}

function tilesetDetails(tileset) {
  const tile = state.hoverTile ?? state.pinnedTile;
  const dl = h('dl');
  row(dl, 'Image', tileset.image);
  row(dl, 'Grid', `${tileset.columns} × ${tileset.rows} tiles of ${tileset.cell.w} px`);
  row(dl, 'Tiles', Object.keys(tileset.tiles).length);
  const parts = [h('h2', {}, tileset.id.replaceAll('_', ' ')), dl];
  if (state.tilesetView === 'atlas') {
    parts.push(h('h3', {}, 'Tile'));
    if (tile) {
      const tdl = h('dl');
      row(tdl, 'ID', tile.id);
      row(tdl, 'Name', tile.name);
      row(tdl, 'Position', `row ${tile.row}, column ${tile.col}`);
      row(tdl, 'Collision', tile.shape === 'rect' ? `rect [${tile.rect.join(', ')}]` : tile.shape);
      row(tdl, 'Meaning', tileset.shapes?.[tile.shape]);
      row(tdl, 'Layer', tile.layer);
      if (tile.bounds) row(tdl, 'Visible area', `${tile.bounds.w} × ${tile.bounds.h} at (${tile.bounds.x}, ${tile.bounds.y})`);
      if (tile.empty) row(tdl, 'Note', 'intentionally blank');
      const groups = Object.entries(tileset.groups ?? {}).filter(([, ids]) => ids.includes(tile.id)).map(([n]) => n);
      if (groups.length) row(tdl, 'Variant of', groups.join(', '));
      parts.push(tdl);
    } else {
      parts.push(h('p', { class: 'muted' }, 'Point at a tile to see its details. Click to keep it selected.'));
    }
    const legend = [['solid', 'solid block'], ['platform', 'one-way platform'], ['rect', 'partial block'], ['slope', 'slope or stairs']];
    parts.push(h('h3', {}, 'Collision colours'), h('ul', {}, legend.map(([key, text]) =>
      h('li', {}, h('span', { style: { color: '#' + COLORS[key].toString(16).padStart(6, '0') } }, '■ '), text))));
  } else {
    const notes = Object.entries(tileset.assemblies ?? {}).filter(([, a]) => a.note);
    parts.push(h('h3', {}, 'Assemblies'), h('ul', {}, notes.map(([n, a]) => h('li', {}, h('b', {}, n.replaceAll('_', ' ')), ': ', a.note))));
  }
  if (tileset.notes?.length) parts.push(h('h3', {}, 'Notes'), h('ul', {}, tileset.notes.map(n => h('li', {}, n))));
  setDetails(...parts);
}

function cardDetails(card) {
  const dl = h('dl');
  const rect = a => a && `(${a.x}, ${a.y}) ${a.w} × ${a.h}`;
  row(dl, 'Image', card.image);
  row(dl, 'Size', `${card.size.w} × ${card.size.h}`);
  row(dl, 'Character', card.subjectEntity?.name ?? 'not found');
  row(dl, 'Text area', rect(card.textArea));
  row(dl, 'Guide text area', rect(card.guideTextArea));
  row(dl, 'Text tone', card.textTone);
  row(dl, 'Background', card.textBackground);
  setDetails(
    h('h2', {}, `${card.subjectEntity?.name ?? card.id} card`), dl,
    h('p', { class: 'muted', style: { marginTop: '10px' } },
      'Solid green: the area the game writes into. Dashed red: the smaller area the guide reserved.'),
    card.notes?.length ? h('h3', {}, 'Notes') : null,
    card.notes?.length ? h('ul', {}, card.notes.map(n => h('li', {}, n))) : null);
}

function buildTimeline(clip) {
  const bar = $('timeline');
  const offsets = offsetsFor(state.selection.item, clip);
  const signed = v => (v > 0 ? '+' : '') + v;
  bar.replaceChildren(...clip.durations.map((ms, i) => {
    const tags = eventsOnFrame(clip, i).map(e => h('span', { class: 'tag' }, e.type));
    const [dx, dy] = offsets[i];
    if (dx || dy) tags.push(h('span', { class: 'tag offset' }, [dx ? `x${signed(dx)}` : '', dy ? `y${signed(dy)}` : ''].filter(Boolean).join(' ')));
    if (clip.emptyFrames?.includes(i + 1)) tags.push(h('span', { class: 'tag empty' }, 'blank'));
    return h('button', { type: 'button', title: `Show frame ${i + 1}`, onclick: () => { state.playing = false; state.elapsed = frameStart(clip, i); syncToolbar(); } },
      h('span', { class: 'f' }, `F${i + 1}`), h('span', { class: 'ms' }, `${ms} ms`), h('span', {}, tags));
  }));
}

// -------------------------------------------------------------------- refresh

function syncToolbar() {
  const type = state.selection?.type;
  for (const group of $('toolbar').querySelectorAll('[data-for]')) group.hidden = group.dataset.for !== type;
  $('toolbar').hidden = type === 'problems';
  $('view-single').setAttribute('aria-pressed', String(state.entityView === 'single'));
  $('view-all').setAttribute('aria-pressed', String(state.entityView === 'all'));
  $('view-atlas').setAttribute('aria-pressed', String(state.tilesetView === 'atlas'));
  $('view-built').setAttribute('aria-pressed', String(state.tilesetView === 'built'));
  $('flip').setAttribute('aria-pressed', String(state.flip));
  $('play').textContent = state.playing ? 'Pause' : 'Play';
  for (const id of ['zoom-in', 'zoom-out', 'zoom-label']) $(id).hidden = type === 'card';
  $('nudge-group').hidden = type !== 'entity' || state.entityView !== 'single';
}

/** Rebuild everything for the current selection. */
function refresh() {
  const sel = state.selection;
  clearStage();
  markNav();
  syncToolbar();
  $('card-view').hidden = sel.type !== 'card';
  $('problems-view').hidden = sel.type !== 'problems';
  const single = sel.type === 'entity' && state.entityView === 'single';
  $('timeline').hidden = !single;
  $('readout').hidden = !single;
  let zoom = null;
  if (sel.type === 'entity') {
    zoom = state.entityView === 'single' ? buildEntitySingle(sel.item) : buildEntityAll(sel.item);
    entityDetails(sel.item);
    if (single) buildTimeline(currentClip());
  } else if (sel.type === 'tileset') {
    zoom = state.tilesetView === 'atlas' ? buildTilesetAtlas(sel.item) : buildTilesetBuilt(sel.item);
    tilesetDetails(sel.item);
  } else if (sel.type === 'card') {
    buildCardView(sel.item);
    cardDetails(sel.item);
  } else {
    buildProblemsView();
    setDetails(h('p', { class: 'muted' }, 'Choose an asset on the left to view it.'));
  }
  scene.zoom = zoom;
  if (zoom != null) $('zoom-label').textContent = `${zoom / dpr() === Math.round(zoom / dpr()) ? zoom / dpr() : (zoom / dpr()).toFixed(2)}×`;
  updateFrames(true);
}

/** Per-frame: advance animations and keep the timeline and readout in step. */
function updateFrames(force = false) {
  for (const { sprite, clip, entity, x, y, S, mirror } of scene.sprites) {
    const frame = displayFrame(clip, state.elapsed);
    if (sprite.texture !== clip.frames[frame]) sprite.texture = clip.frames[frame];
    const [dx, dy] = offsetsFor(entity, clip)[frame];
    sprite.position.set(x + dx * S * mirror, y + dy * S);
  }
  if (state.selection?.type !== 'entity' || state.entityView !== 'single') return;
  const clip = currentClip();
  const frame = displayFrame(clip, state.elapsed);
  if (!force && frame === scene.frameShown) return;
  scene.frameShown = frame;
  [...$('timeline').children].forEach((b, i) => b.classList.toggle('current', i === frame));
  const active = eventsOnFrame(clip, frame).map(e => e.type);
  $('readout').replaceChildren(
    `${clip.label} · frame ${frame + 1}/${clip.durations.length} · ${clip.durations[frame]} ms · ${facingText(state.selection.item)}`,
    active.length ? ' · ' : '', active.length ? h('b', {}, active.join(', ')) : '');
}

function stepFrame(delta) {
  const clip = currentClip();
  if (!clip) return;
  const n = clip.durations.length;
  const frame = (displayFrame(clip, state.elapsed) + delta + n) % n;
  state.playing = false;
  state.elapsed = frameStart(clip, frame);
  syncToolbar();
}

function changeZoom(delta) {
  const next = Math.max(1, Math.min(16, (scene.zoom ?? 1) + delta));
  if (next === scene.zoom) return;
  state.zoom = next;
  refresh();
}

// ----------------------------------------------------------------------- wiring

function wire() {
  window.addEventListener('hashchange', applyHash);
  $('problems-button').addEventListener('click', () => setHash({ type: 'problems' }));
  $('view-single').addEventListener('click', () => { state.entityView = 'single'; state.zoom = null; state.pan = { x: 0, y: 0 }; refresh(); });
  $('view-all').addEventListener('click', () => { state.entityView = 'all'; state.zoom = null; state.pan = { x: 0, y: 0 }; refresh(); });
  $('view-atlas').addEventListener('click', () => { state.tilesetView = 'atlas'; state.zoom = null; state.pan = { x: 0, y: 0 }; refresh(); });
  $('view-built').addEventListener('click', () => { state.tilesetView = 'built'; state.zoom = null; state.pan = { x: 0, y: 0 }; refresh(); });
  $('zoom-in').addEventListener('click', () => changeZoom(1));
  $('zoom-out').addEventListener('click', () => changeZoom(-1));
  $('play').addEventListener('click', () => { state.playing = !state.playing; syncToolbar(); });
  $('step-back').addEventListener('click', () => stepFrame(-1));
  $('step-forward').addEventListener('click', () => stepFrame(1));
  $('speed').addEventListener('change', e => { state.speed = Number(e.target.value); });
  $('flip').addEventListener('click', () => { state.flip = !state.flip; refresh(); });
  $('nudge-left').addEventListener('click', () => nudge(state.flip ? 1 : -1, 0));
  $('nudge-right').addEventListener('click', () => nudge(state.flip ? -1 : 1, 0));
  $('nudge-up').addEventListener('click', () => nudge(0, -1));
  $('nudge-down').addEventListener('click', () => nudge(0, 1));
  $('nudge-reset').addEventListener('click', () => nudge(null));
  for (const id of ['show-ghost', 'show-cell', 'show-pivot', 'show-bounds', 'show-shapes', 'show-grid', 'show-areas', 'show-sample']) {
    $(id).addEventListener('change', refresh);
  }

  const canvas = $('canvas');
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, pan: { ...state.pan }, moved: false }; });
  window.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointermove', e => {
    if (drag && (drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4)) {
      drag.moved = true;
      state.pan = { x: drag.pan.x + e.clientX - drag.x, y: drag.pan.y + e.clientY - drag.y };
      refresh();
      return;
    }
    if (scene.tileAt) {
      const box = canvas.getBoundingClientRect();
      const tile = scene.tileAt(e.clientX - box.left, e.clientY - box.top);
      if (tile !== state.hoverTile) { state.hoverTile = tile; drawTileHighlight(); tilesetDetails(state.selection.item); }
    }
  });
  canvas.addEventListener('pointerleave', () => {
    if (state.hoverTile) { state.hoverTile = null; drawTileHighlight(); if (state.selection.type === 'tileset') tilesetDetails(state.selection.item); }
  });
  canvas.addEventListener('click', e => {
    if (!scene.tileAt) return;
    const box = canvas.getBoundingClientRect();
    state.pinnedTile = scene.tileAt(e.clientX - box.left, e.clientY - box.top);
    drawTileHighlight();
    tilesetDetails(state.selection.item);
  });
  $('stage').addEventListener('wheel', e => {
    if (scene.zoom == null) return;
    e.preventDefault();
    if (scene.contentHeight != null) {      // scrolling views: the wheel scrolls
      state.pan.y -= e.deltaY;
      refresh();
    } else {
      changeZoom(e.deltaY < 0 ? 1 : -1);
    }
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.ctrlKey || e.metaKey || e.altKey) return;
    const entity = state.selection?.type === 'entity';
    // Shift + arrows nudge the frame on screen; mirrored view nudges in screen direction too.
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
    if (e.shiftKey && dir && entity) nudge(dir[0] * (state.flip ? -1 : 1), dir[1]);
    else if (e.shiftKey) return;
    else if (e.code === 'Space' && entity) { state.playing = !state.playing; syncToolbar(); }
    else if (e.code === 'ArrowRight' && entity) stepFrame(1);
    else if (e.code === 'ArrowLeft' && entity) stepFrame(-1);
    else if (e.code === 'KeyF' && entity) { state.flip = !state.flip; refresh(); }
    else if (e.code === 'KeyA' && entity) { state.entityView = state.entityView === 'single' ? 'all' : 'single'; state.zoom = null; state.pan = { x: 0, y: 0 }; refresh(); }
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') changeZoom(1);
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') changeZoom(-1);
    else return;
    e.preventDefault();
  });

  // Keep the canvas sharp when the window is resized or the browser zoom changes.
  let lastDpr = dpr();
  new ResizeObserver(() => {
    if (dpr() !== lastDpr) {
      lastDpr = dpr();
      app.renderer.resolution = lastDpr;
    }
    app.resize();
    if (state.selection) refresh();
  }).observe($('stage'));
}

async function main() {
  const loading = $('loading');
  try {
    const { config, url, usedExample } = await loadConfig();
    Object.assign(state, { config, configUrl: url, usedExample });
    $('config-source').textContent = usedExample
      ? 'Using example.dungeon.json (no dungeon.json found)'
      : 'Using dungeon.json';

    app = new Application();
    await app.init({
      canvas: $('canvas'), resizeTo: $('stage'), background: COLORS.background,
      antialias: false, resolution: dpr(), autoDensity: true, preference: 'webgl',
    });

    state.assets = await loadAssets(config, url, (done, total, name) => {
      loading.textContent = `Loading ${done} of ${total}${name ? ' — ' + name : ''}`;
    });

    const { problems } = state.assets;
    const errors = problems.filter(p => p.level === 'error').length;
    const button = $('problems-button');
    button.hidden = false;
    button.textContent = problems.length ? `${problems.length} problem${problems.length === 1 ? '' : 's'}` : 'No problems';
    button.className = errors ? 'bad' : problems.length ? 'warn' : 'good';

    loadEdits();
    buildNav();
    wire();
    app.ticker.add(ticker => {
      if (state.playing) state.elapsed += ticker.deltaMS * state.speed;
      updateFrames();
    });
    loading.hidden = true;
    applyHash();
  } catch (error) {
    console.error(error);
    loading.hidden = false;
    loading.textContent = `Could not start the viewer: ${error.message}`;
  }
}

main();
