// Asset loading: fetches the sheet, tileset and card JSON named in the site
// configuration, loads their images, checks one against the other, and builds
// ready-to-draw textures. Problems are collected, not thrown, so one bad file
// does not stop the rest from loading.

import { ImageSource, Texture, Rectangle } from '../../vendor/pixi.min.mjs';
import { fetchJson, resolve } from '../config.js';
import { REQUIRED_SLOTS, locomotion } from './animation.js';
import { Level } from '../level/level.js';

/**
 * @typedef {{level: 'error'|'warning', file: string, message: string}} Problem
 */

async function fetchBytes(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.arrayBuffer();
}

async function sha256Hex(bytes) {
  if (!globalThis.crypto?.subtle) return null; // needs HTTPS or localhost
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function nearestTexture(bitmap) {
  return new ImageSource({ resource: bitmap, scaleMode: 'nearest', alphaMode: 'premultiply-alpha-on-upload' });
}

function shortName(url) {
  return url.split('/').pop();
}

/** Load a JSON file and the PNG it names; report size and checksum mismatches. */
async function loadPair(jsonUrl, problems) {
  const file = shortName(jsonUrl);
  const json = await fetchJson(jsonUrl);
  const imageUrl = resolve(json.image, jsonUrl);
  const bytes = await fetchBytes(imageUrl);
  const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }),
    { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  if (json.size && (bitmap.width !== json.size.w || bitmap.height !== json.size.h)) {
    problems.push({ level: 'error', file,
      message: `Image is ${bitmap.width}×${bitmap.height} but the JSON says ${json.size.w}×${json.size.h}.` });
  }
  if (json.sha256) {
    const actual = await sha256Hex(bytes);
    if (actual === null) {
      problems.push({ level: 'warning', file, message: 'Checksum not verified (page is not on HTTPS or localhost).' });
    } else if (actual !== json.sha256) {
      problems.push({ level: 'warning', file,
        message: `${json.image} has changed since this JSON was written (checksum differs). Re-check the JSON against the image.` });
    }
  }
  return { json, jsonUrl, imageUrl, bitmap, file };
}

async function loadSpritesheet(jsonUrl, problems) {
  const { json, imageUrl, bitmap, file } = await loadPair(jsonUrl, problems);
  const { w: cw, h: ch } = json.cell;
  if (json.columns * cw !== bitmap.width || json.rows * ch !== bitmap.height) {
    problems.push({ level: 'error', file,
      message: `Grid ${json.columns}×${json.rows} of ${cw}×${ch} cells does not match the image size.` });
  }
  const usedRows = new Map();
  const entities = {};
  for (const [id, entity] of Object.entries(json.entities)) {
    // Each entity's block of rows becomes its own texture, so a tall sheet
    // never exceeds the graphics hardware's texture size limit.
    const r = entity.region;
    const block = await createImageBitmap(bitmap, r.x, r.y, r.w, r.h, { premultiplyAlpha: 'none' });
    const source = nearestTexture(block);
    const animations = {};
    for (const [slot, clip] of Object.entries(entity.animations)) {
      if (clip.row < entity.rows[0] || clip.row > entity.rows[1]) {
        problems.push({ level: 'error', file, message: `${id}.${slot}: row ${clip.row} is outside the entity's rows.` });
        continue;
      }
      if (clip.durations.length !== json.columns) {
        problems.push({ level: 'error', file, message: `${id}.${slot}: ${clip.durations.length} durations for ${json.columns} frames.` });
      }
      if (clip.offsets && (clip.offsets.length !== json.columns ||
          !clip.offsets.every(o => Array.isArray(o) && o.length === 2 && o.every(Number.isInteger)))) {
        problems.push({ level: 'error', file, message: `${id}.${slot}: "offsets" must be one [dx, dy] pair of whole numbers per frame.` });
        clip.offsets = undefined;
      }
      if (!clip.loop && !clip.end) {
        problems.push({ level: 'warning', file, message: `${id}.${slot}: neither "loop" nor "end" is set.` });
      }
      for (const e of clip.events ?? []) {
        if (e.frame < 1 || (e.until ?? e.frame) > json.columns || (e.until ?? e.frame) < e.frame) {
          problems.push({ level: 'error', file, message: `${id}.${slot}: event "${e.type}" names a frame outside 1–${json.columns}.` });
        }
      }
      if (usedRows.has(clip.row)) {
        problems.push({ level: 'warning', file, message: `Row ${clip.row} is used by both ${usedRows.get(clip.row)} and ${id}.${slot}.` });
      }
      usedRows.set(clip.row, `${id}.${slot}`);
      const y = (clip.row - 1) * ch - r.y;
      const frames = [];
      for (let c = 0; c < json.columns; c++) {
        frames.push(new Texture({ source, frame: new Rectangle(c * cw - r.x, y, cw, ch) }));
      }
      animations[slot] = { ...clip, offsets: clip.offsets ?? null, slot, frames };
    }
    for (const slot of REQUIRED_SLOTS[json.kind] ?? []) {
      if (!(slot in animations)) problems.push({ level: 'error', file, message: `${id}: missing the "${slot}" animation.` });
    }
    if (json.kind !== 'object' && !locomotion(animations)) {
      problems.push({ level: 'error', file, message: `${id}: has neither a "walk" nor a "run" animation.` });
    }
    entities[id] = { ...entity, id, kind: json.kind, animations, source, sheet: null };
  }
  for (let row = 1; row <= json.rows; row++) {
    if (!usedRows.has(row)) problems.push({ level: 'warning', file, message: `Row ${row} of the image is not used by any animation.` });
  }
  bitmap.close?.();
  const sheet = { ...json, url: jsonUrl, imageUrl, entities };
  for (const entity of Object.values(entities)) entity.sheet = sheet;
  return sheet;
}

const TILE_SHAPES = new Set(['none', 'solid', 'platform', 'rect', 'slope_right', 'slope_left', 'stairs_right', 'stairs_left']);

async function loadTileset(jsonUrl, problems) {
  const { json, imageUrl, bitmap, file } = await loadPair(jsonUrl, problems);
  const { w: cw, h: ch } = json.cell;
  const source = nearestTexture(bitmap);
  const tiles = {};
  for (const [id, tile] of Object.entries(json.tiles)) {
    if (tile.row < 1 || tile.row > json.rows || tile.col < 1 || tile.col > json.columns) {
      problems.push({ level: 'error', file, message: `Tile ${id}: row/col is outside the grid.` });
      continue;
    }
    if (!TILE_SHAPES.has(tile.shape)) problems.push({ level: 'error', file, message: `Tile ${id}: unknown shape "${tile.shape}".` });
    if (tile.shape === 'rect' && !Array.isArray(tile.rect)) problems.push({ level: 'error', file, message: `Tile ${id}: shape "rect" needs a rect.` });
    tiles[id] = { ...tile, id,
      texture: new Texture({ source, frame: new Rectangle((tile.col - 1) * cw, (tile.row - 1) * ch, cw, ch) }) };
  }
  const known = id => id in tiles;
  for (const [name, ids] of Object.entries(json.groups ?? {})) {
    for (const id of ids) if (!known(id)) problems.push({ level: 'error', file, message: `Group ${name}: unknown tile "${id}".` });
  }
  for (const [name, assembly] of Object.entries(json.assemblies ?? {})) {
    for (const part of assembly.parts) if (!known(part.tile)) problems.push({ level: 'error', file, message: `Assembly ${name}: unknown tile "${part.tile}".` });
  }
  for (const [name, run] of Object.entries(json.runs ?? {})) {
    for (const [role, ref] of Object.entries(run)) {
      if (!known(ref) && !(ref in (json.groups ?? {}))) problems.push({ level: 'error', file, message: `Run ${name}.${role}: "${ref}" is neither a tile nor a group.` });
    }
  }
  const id = file.replace(/_tileset\.json$|\.json$/, '');
  return { ...json, id, url: jsonUrl, imageUrl, tiles, source };
}

async function loadCard(jsonUrl, problems) {
  const { json, imageUrl, bitmap, file } = await loadPair(jsonUrl, problems);
  const inside = a => a && a.x >= 0 && a.y >= 0 && a.x + a.w <= bitmap.width && a.y + a.h <= bitmap.height;
  if (!inside(json.textArea)) problems.push({ level: 'error', file, message: 'textArea is missing or extends outside the image.' });
  bitmap.close?.();
  const id = file.replace(/_card\.json$|\.json$/, '');
  return { ...json, id, url: jsonUrl, imageUrl,
    subjectSheetUrl: json.subject?.sheet ? resolve(json.subject.sheet, jsonUrl) : null };
}

/** Load the static levels listed in the level index and check each against its tileset. */
async function loadLevels(config, configUrl, result, problems) {
  result.levels = [];
  if (!config.levels) return;
  const indexUrl = resolve(config.levels, configUrl), indexFile = shortName(indexUrl);
  let index;
  try {
    index = await fetchJson(indexUrl);
  } catch (error) {
    problems.push({ level: 'error', file: indexFile, message: `Could not load: ${error.message}` });
    return;
  }
  const loaded = await Promise.all((index.entries ?? []).map(async entry => {
    const url = resolve(entry.file, indexUrl), file = shortName(url);
    try {
      const doc = await fetchJson(url);
      const tileset = result.tilesets.find(t => t.id === doc.tileset);
      if (!tileset) { problems.push({ level: 'error', file, message: `Uses tileset "${doc.tileset}", which is not loaded.` }); return null; }
      const found = Level.validate(doc, tileset);
      for (const message of found) problems.push({ level: 'error', file, message });
      if (found.length) return null;
      if (doc.id !== entry.id) problems.push({ level: 'warning', file, message: `Its id "${doc.id}" differs from "${entry.id}" in ${indexFile}.` });
      return { id: entry.id, name: doc.name ?? entry.id, description: entry.description ?? '', doc, tileset, url };
    } catch (error) {
      problems.push({ level: 'error', file, message: `Could not load: ${error.message}` });
      return null;
    }
  }));
  result.levels = loaded.filter(Boolean);
}

/** Deep-merge catalog defaults under an entry (the entry wins). */
function withDefaults(defaults, entry) {
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return entry ?? defaults;
  if (entry == null) return structuredClone(defaults);
  if (typeof entry !== 'object' || Array.isArray(entry)) return entry;
  const out = { ...entry };
  for (const [key, value] of Object.entries(defaults)) out[key] = withDefaults(value, entry[key]);
  return out;
}

const isBox = b => b && ['x', 'y', 'w', 'h'].every(k => Number.isFinite(b[k])) && b.w > 0 && b.h > 0;

/**
 * Load the gameplay catalogs and attach each entry to its sheet entity as
 * `entity.gameplay`. Catalogs hold stats, abilities, behaviour and boxes.
 */
async function loadCatalogs(config, configUrl, result, problems) {
  const paths = Object.entries(config.catalogs ?? {}).filter(([key]) => !key.startsWith('$') && key !== 'audio');
  result.catalogs = {};
  await Promise.all(paths.map(async ([name, path]) => {
    const url = resolve(path, configUrl), file = shortName(url);
    let catalog;
    try {
      catalog = await fetchJson(url);
    } catch (error) {
      problems.push({ level: 'error', file, message: `Could not load: ${error.message}` });
      return;
    }
    result.catalogs[name] = catalog;
    for (const [id, raw] of Object.entries(catalog.entries ?? {})) {
      const entry = withDefaults(catalog.defaults, raw);
      const sheet = result.sheets.find(s => s.url === resolve(entry.sheet ?? '', url));
      const entity = sheet?.entities[entry.entity];
      if (!entity) {
        problems.push({ level: 'error', file, message: `${id}: sheet or entity not found among the loaded sheets.` });
        continue;
      }
      if (entity.kind !== catalog.kind) problems.push({ level: 'error', file, message: `${id}: is a ${entity.kind} in its sheet but listed in a ${catalog.kind} catalog.` });
      if (entity.gameplay) problems.push({ level: 'error', file, message: `${id}: also defined in ${entity.catalogFile}.` });
      for (const key of ['body', 'crouchBody', 'box']) {
        if (entry[key] && !isBox(entry[key])) problems.push({ level: 'error', file, message: `${id}.${key}: not a valid box.` });
      }
      if (catalog.kind !== 'object' && !isBox(entry.body)) problems.push({ level: 'error', file, message: `${id}: has no body box.` });
      for (const [slot, action] of Object.entries(entry.abilities ?? entry.attacks ?? {})) {
        const clip = entity.animations[slot];
        if (!clip) { problems.push({ level: 'error', file, message: `${id}.${slot}: the sheet has no such animation.` }); continue; }
        if (action.box && !isBox(action.box)) problems.push({ level: 'error', file, message: `${id}.${slot}: box is not valid.` });
        if (['melee', 'area'].includes(action.type)) {
          if (!action.box) problems.push({ level: 'error', file, message: `${id}.${slot}: a ${action.type} attack needs a box.` });
          if (!(clip.events ?? []).some(e => ['melee', 'area', 'impact'].includes(e.type))) {
            problems.push({ level: 'warning', file, message: `${id}.${slot}: the animation has no frame that triggers the hit.` });
          }
        }
      }
      for (const phase of entry.phases ?? []) {
        for (const slot of phase.attacks) {
          if (!entry.attacks?.[slot]) problems.push({ level: 'error', file, message: `${id}: a phase uses "${slot}", which is not defined.` });
        }
      }
      if (entry.card && !result.cards.some(c => c.url === resolve(entry.card, url))) {
        problems.push({ level: 'warning', file, message: `${id}: its card is not in the configuration's card list.` });
      }
      entity.gameplay = entry;
      entity.catalogFile = file;
    }
  }));
  if (paths.length) {
    // Only kinds that have a catalog are expected to have gameplay values (NPCs have none yet).
    const kinds = new Set(Object.values(result.catalogs).map(c => c.kind));
    for (const [key, entity] of Object.entries(result.entities)) {
      if (!entity.gameplay && kinds.has(entity.kind)) problems.push({ level: 'warning', file: shortName(entity.sheet.url), message: `${key} has no gameplay values in any catalog.` });
    }
  }
}

/**
 * Load everything listed under `assets` in the site configuration.
 * @param {object} config        parsed dungeon.json
 * @param {string} configUrl     where it was loaded from
 * @param {(done: number, total: number, name: string) => void} [onProgress]
 */
export async function loadAssets(config, configUrl, onProgress = () => {}) {
  /** @type {Problem[]} */
  const problems = [];
  const lists = config.assets ?? {};
  const jobs = [
    ...(lists.spritesheets ?? []).map(path => ({ path, load: loadSpritesheet, into: 'sheets' })),
    ...(lists.tilesets ?? []).map(path => ({ path, load: loadTileset, into: 'tilesets' })),
    ...(lists.cards ?? []).map(path => ({ path, load: loadCard, into: 'cards' })),
  ];
  const result = { sheets: [], tilesets: [], cards: [], problems };
  let done = 0;
  onProgress(0, jobs.length, '');
  const loaded = await Promise.all(jobs.map(async job => {
    const url = resolve(job.path, configUrl);
    try {
      return await job.load(url, problems);
    } catch (error) {
      problems.push({ level: 'error', file: shortName(url), message: `Could not load: ${error.message}` });
      return null;
    } finally {
      onProgress(++done, jobs.length, shortName(url));
    }
  }));
  jobs.forEach((job, i) => { if (loaded[i]) result[job.into].push(loaded[i]); });

  // Entities by kind, and a check that IDs are unique across sheets.
  result.entities = {};
  for (const sheet of result.sheets) {
    for (const entity of Object.values(sheet.entities)) {
      const key = `${entity.kind}/${entity.id}`;
      if (result.entities[key]) {
        problems.push({ level: 'error', file: shortName(sheet.url), message: `Entity "${key}" is also defined in ${shortName(result.entities[key].sheet.url)}.` });
      } else {
        result.entities[key] = entity;
      }
    }
  }
  await loadCatalogs(config, configUrl, result, problems);
  await loadLevels(config, configUrl, result, problems);

  // Cards must point at an entity that was loaded.
  for (const card of result.cards) {
    const sheet = result.sheets.find(s => s.url === card.subjectSheetUrl);
    card.subjectEntity = sheet?.entities[card.subject?.entity] ?? null;
    if (!card.subjectEntity) {
      problems.push({ level: 'error', file: shortName(card.url), message: 'The card\'s subject does not match any loaded sheet entity.' });
    }
  }
  return result;
}
