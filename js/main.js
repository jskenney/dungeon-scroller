// Game shell: boots the site configuration and assets, then moves between
// the title, hero selection, level selection, settings and play screens.

import { loadConfig } from './config.js';
import { loadAssets } from './assets/loader.js';
import { Settings, ACTIONS } from './settings.js';
import { Input } from './input.js';
import { Stage } from './render/stage.js';
import { WorldView } from './render/worldView.js';
import { Level, TILE } from './level/level.js';
import { generateLevel } from './level/generate.js';
import { levelToJson } from './level/build.js';
import { randomSeed } from './level/random.js';
import { World } from './sim/world.js';
import { keyboardIntents } from './sim/controllers/keyboard.js';
import { h, keyName } from './ui/dom.js';
import { cardElement, plainCard, spritePreview } from './ui/card.js';
import { loadProgress, saveProgress, resetProgress } from './profile.js';
import { Hud } from './ui/hud.js';
import { Bubbles } from './ui/bubbles.js';
import { AudioEngine } from './audio/audio.js';
import { Speech } from './speech/speech.js';
import { POCKET } from './speech/pocket.js';
import { LineDirector } from './speech/lines.js';
import { fetchJson, resolve } from './config.js';

const ui = document.getElementById('ui');
const game = {
  config: null, assets: null, settings: null, input: null, stage: null,
  hero: null, world: null, view: null, hud: null, debugText: null,
  lookAhead: 0,
  audio: null, speech: null, bubbles: null, lines: null,
  entry: null,                    // the level being played: {name, doc, tileset, seed?}
  paused: false, back: null,       // back: what Escape does on the current screen
};

/** Replace the current screen. `back` is called when Escape is pressed. */
function show(element, back = null) {
  ui.replaceChildren(element);
  game.back = back;
  element.querySelector('[autofocus]')?.focus();
}

/** A short note on a hero's saved gold and upgrades, for the selection screen. */
function progressNote(heroId) {
  const saved = loadProgress(heroId), levels = Object.values(saved.upgrades).reduce((a, b) => a + b, 0);
  return saved.gold || levels ? ` · ${saved.gold} gold · ${levels} upgrade${levels === 1 ? '' : 's'}` : '';
}

const heroes = () => Object.values(game.assets.entities).filter(e => e.kind === 'player' && e.gameplay);
const cardFor = entity => game.assets.cards.find(c => c.subjectEntity === entity);

/**
 * A menu screen drawn on one of the framed stone backgrounds. The whole frame
 * is fitted inside the window; `content` goes in the area the art keeps clear.
 * `which` is a key of display.backdrops in the site configuration. With no
 * such art, the content is shown on a plain dimmed screen as before.
 */
function framed(which, content, extraClass = '') {
  const art = game.assets.backdrops.find(b => b.id === game.config.display?.backdrops?.[which]);
  if (!art) return h('div', { class: `screen centered ${extraClass}` }, content);
  const { frame, menuRect: m, columns, rows, animation } = art;
  const pct = (v, of) => `${(v / of) * 100}%`;
  const picture = h('div', { class: 'frame-art', style: {
    aspectRatio: `${frame.w} / ${frame.h}`, width: `min(100vw, 100vh * ${frame.w / frame.h})`, backgroundImage: `url("${art.imageUrl}")`, backgroundSize: `${columns * 100}% ${rows * 100}%` } },
    h('div', { class: 'frame-area', style: { left: pct(m.x, frame.w), top: pct(m.y, frame.h), width: pct(m.w, frame.w), height: pct(m.h, frame.h) } }, content));
  // Step through the frames at the art's own timings, for as long as the screen is shown.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  const step = () => {
    if (index > 0 && !picture.isConnected) return;
    const i = index % animation.durations.length;
    picture.style.backgroundPosition = `${columns > 1 ? ((i % columns) / (columns - 1)) * 100 : 0}% ${rows > 1 ? (Math.floor(i / columns) / (rows - 1)) * 100 : 0}%`;
    index++;
    if (!still) setTimeout(step, animation.durations[i]);
  };
  step();
  return h('div', { class: `screen framed ${extraClass}` }, picture);
}

function panel(title, ...children) {
  return h('section', { class: 'panel' }, h('h1', {}, title), ...children);
}

// ----------------------------------------------------------------------- title

function titleScreen() {
  stopPlay();
  game.audio.music(game.audio.musicFor('title'));
  const problems = game.assets.problems.filter(p => p.level === 'error').length;
  const screen = framed('title', h('div', { class: 'title-block' },
    h('h1', { class: 'logo' }, game.config.title ?? 'Dungeon Scroller'),
    h('div', { class: 'menu' },
      h('button', { type: 'button', autofocus: true, onclick: heroScreen }, 'Play'),
      h('button', { type: 'button', onclick: () => settingsScreen(titleScreen, true) }, 'Settings'),
      h('a', { class: 'button', href: 'viewer.html' }, 'Asset viewer'))), 'title');
  screen.append(h('p', { class: 'footnote' },
    game.usedExample ? 'Using example.dungeon.json (no dungeon.json found). ' : '',
    problems ? h('a', { href: 'viewer.html#problems' }, `${problems} asset problem${problems === 1 ? '' : 's'} found — open the viewer.`) : ''));
  show(screen);
}

// --------------------------------------------------------------- hero selection

function heroScreen() {
  stopPlay();
  const list = heroes();
  let chosen = list.find(e => e.id === game.settings.lastHero) ?? list[0];
  const preview = h('div', { class: 'hero-preview' });
  const choose = entity => {
    chosen = entity;
    for (const b of grid.children) b.setAttribute('aria-pressed', String(b.dataset.id === entity.id));
    preview.replaceChildren(spritePreview(entity, 'idle', 1, true), h('div', {},
      h('strong', {}, entity.name), h('div', { class: 'muted' }, entity.gameplay.role, progressNote(entity.id))));
  };
  const confirm = () => { game.settings.lastHero = chosen.id; game.hero = chosen; levelScreen(); };
  const grid = h('div', { class: 'card-grid' }, list.map(entity => {
    const card = cardFor(entity);
    return h('button', { type: 'button', class: 'card-button', 'data-id': entity.id, 'aria-pressed': 'false',
      'aria-label': `${entity.name}, ${entity.gameplay.role}`,
      autofocus: entity === chosen,
      onclick: () => (chosen === entity ? confirm() : choose(entity)) },
      card ? cardElement(card, entity) : h('div', { class: 'card missing' }, entity.name));
  }));
  show(framed('menus', h('div', { class: 'select' },
    h('header', { class: 'bar-top' },
      h('button', { type: 'button', onclick: titleScreen }, '← Back'),
      h('h1', {}, 'Choose your hero'),
      preview,
      h('button', { type: 'button', class: 'primary', onclick: confirm }, 'Continue')),
    grid)), titleScreen);
  choose(chosen);
}

// -------------------------------------------------------------- level selection

function levelScreen() {
  stopPlay();
  const levels = game.assets.levels.map((level, i) => h('button', { type: 'button', class: 'level', autofocus: i === 0,
    onclick: () => startPlay(level) },
    h('strong', {}, level.name),
    h('span', { class: 'muted' }, level.description)));

  // Random dungeon: the same theme, length, difficulty and seed always give the same level.
  const query = new URLSearchParams(location.search);
  const defaults = game.config.generator ?? {};
  const option = (value, label, chosen) => h('option', { value, selected: String(value) === String(chosen) }, label);
  const theme = h('select', { id: 'gen-theme' }, game.assets.tilesets.map(t =>
    option(t.id, t.id.replaceAll('_', ' '), query.get('theme') ?? defaults.defaultTheme)));
  const length = h('select', { id: 'gen-length' }, [[80, 'Short'], [140, 'Medium'], [220, 'Long']].map(([v, label]) =>
    option(v, label, query.get('length') ?? defaults.defaultLength ?? 140)));
  const difficulty = h('select', { id: 'gen-difficulty' }, [1, 2, 3, 4, 5].map(v =>
    option(v, ['1 · gentle', '2', '3 · standard', '4', '5 · hard'][v - 1], query.get('difficulty') ?? defaults.defaultDifficulty ?? 1)));
  const seed = h('input', { id: 'gen-seed', type: 'text', maxlength: 40, size: 14, placeholder: 'random', value: query.get('seed') ?? '',
    autocomplete: 'off', spellcheck: 'false' });
  const error = h('p', { class: 'warn', role: 'alert' });
  const play = () => {
    try {
      startRandom({ theme: theme.value, length: Number(length.value), difficulty: Number(difficulty.value), seed: seed.value.trim() || randomSeed() });
    } catch (e) {
      error.textContent = e.message;
    }
  };
  const random = h('form', { class: 'level generator', onsubmit: e => { e.preventDefault(); play(); } },
    h('strong', {}, 'Random dungeon'),
    h('span', { class: 'muted' }, 'A new level built from a seed. Use the same seed and settings to get the same level again.'),
    h('div', { class: 'fields' },
      h('label', {}, 'Theme ', theme), h('label', {}, 'Length ', length), h('label', {}, 'Difficulty ', difficulty),
      h('label', {}, 'Seed ', seed), h('button', { type: 'submit', class: 'primary' }, 'Play')),
    error);

  show(framed('menus', panel('Choose a level',
    h('p', { class: 'muted' }, `Playing as ${game.hero.name}.`),
    h('div', { class: 'levels' }, random, levels),
    h('div', { class: 'row' }, h('button', { type: 'button', onclick: heroScreen }, '← Change hero')))), heroScreen);
}

/** What every hero can certainly do, in tiles; the generator never asks for more. */
function heroLimits() {
  const gravity = game.config.physics?.gravity ?? 2400;
  let maxRise = Infinity, maxGap = Infinity;
  for (const hero of heroes()) {
    const m = hero.gameplay.movement;
    const airTime = 2 * Math.sqrt(2 * m.jumpHeight / gravity);
    maxRise = Math.min(maxRise, Math.floor(m.jumpHeight * 0.85 / TILE));
    maxGap = Math.min(maxGap, Math.floor(m.walkSpeed * airTime * 0.9 / TILE));
  }
  return { maxRise: Math.max(1, maxRise), maxGap: Math.max(1, maxGap) };
}

function startRandom({ theme, length, difficulty, seed }) {
  const tileset = game.assets.tilesets.find(t => t.id === theme) ?? game.assets.tilesets[0];
  const ofKind = kind => Object.values(game.assets.entities).filter(e => e.kind === kind && e.gameplay).map(e => e.id);
  const { doc } = generateLevel({ seed, tileset, tilesetId: tileset.id, length, difficulty,
    enemies: ofKind('enemy'), bosses: ofKind('boss'), limits: heroLimits(),
    npcs: Object.values(game.assets.entities).filter(e => e.kind === 'npc' && e.gameplay?.role === 'merchant').map(e => e.id) });
  // Put the recipe in the address bar so the level can be shared or replayed.
  const query = new URLSearchParams({ seed, theme: tileset.id, length, difficulty });
  history.replaceState(null, '', `${location.pathname}?${query}`);
  startPlay({ id: doc.id, name: 'Random dungeon', doc, tileset, seed, recipe: { theme: tileset.id, length, difficulty } });
}

// --------------------------------------------------------------------- settings

/** The spoken-voice choice: off, the browser's voice, or Pocket TTS with its download and model size. */
function voiceSettings(render) {
  const s = game.settings, speech = game.speech, pocket = speech.pocket;
  const status = h('span', { class: 'muted', role: 'status' });
  const download = h('button', { type: 'button', onclick: () => { s.pocketAgreed = true; speech.start(); } });
  game.voiceStatus = () => {
    if (!status.isConnected && status.parentNode) return;
    const chosen = s.voiceMode === 'pocket';
    download.hidden = !chosen || pocket.state === 'loading' || pocket.state === 'ready';
    download.textContent = pocket.state === 'error' ? 'Try again' : `Download (about ${pocket.megabytes} MB, once)`;
    status.textContent = !chosen ? '' : pocket.state === 'ready' ? 'Ready.' : pocket.state === 'loading' ? pocket.progress
      : pocket.state === 'error' ? `Could not start: ${pocket.error}.` : s.pocketAgreed ? '' : 'Not downloaded yet.';
  };
  const option = (value, label) => h('option', { value, selected: s.voiceMode === value }, label);
  const choice = h('select', { 'aria-label': 'Spoken voices', onchange: e => { s.voiceMode = e.target.value; speech.stop(); speech.start(); render(); } },
    option('off', 'Off (speech bubbles only)'),
    speech.canSpeakAloud ? option('browser', 'The browser\'s voice') : null,
    speech.canUsePocket ? option('pocket', 'Pocket TTS (natural voice)') : null);
  const out = [h('label', { class: 'field' }, h('span', { class: 'field-name' }, 'Spoken voices'), choice)];
  if (s.voiceMode === 'pocket') {
    out.push(h('div', { class: 'field' }, download, status),
      h('label', { class: 'field' },
        h('input', { type: 'checkbox', checked: s.pocketFullPrecision, onchange: e => { s.pocketFullPrecision = e.target.checked; speech.reload(); render(); } }),
        ` Full-precision voice model (about ${POCKET.megabytes.full} MB instead of ${POCKET.megabytes.int8} MB)`),
      h('p', { class: 'muted small' }, 'Pocket TTS by Kyutai, CC BY 4.0. It runs in this browser; nothing you play is sent anywhere.'));
  }
  queueMicrotask(game.voiceStatus);
  return out;
}

/** @param {Function} returnTo  where Done goes  @param {boolean} [onFrame]  draw on the menu background (not used over a paused game) */
function settingsScreen(returnTo, onFrame = false) {
  const s = game.settings;
  let capturing = null;                       // action waiting for a key press
  const render = () => {
    const rows = ACTIONS.map(([action, label]) => {
      const clash = s.conflicts(action);
      return h('tr', {},
        h('th', { scope: 'row' }, label),
        h('td', {}, capturing === action ? h('em', {}, 'Press a key… (Esc cancels)')
          : s.keys(action).map(code => h('kbd', {}, keyName(code))),
          clash.length ? h('span', { class: 'warn' }, ` also used by ${clash.map(a => ACTIONS.find(x => x[0] === a)[1]).join(', ')}`) : ''),
        h('td', {},
          h('button', { type: 'button', onclick: () => { capturing = action; render(); } }, 'Change'),
          s.isCustom(action) ? h('button', { type: 'button', onclick: () => { s.resetKeys(action); render(); } }, 'Default') : ''));
    });
    const zoomText = () => `about ${Math.round(game.stage.visibleTiles * 10) / 10} tiles across`;
    const zoomOut = h('span', { class: 'muted' }, zoomText());
    const zoom = direction => { game.stage.zoomBy(direction); zoomOut.textContent = zoomText(); };
    show((onFrame ? c => framed('menus', c) : c => h('div', { class: 'screen centered' }, c))(panel('Settings',
      h('h2', {}, 'Display'),
      h('div', { class: 'field' }, 'Zoom ',
        h('button', { type: 'button', 'aria-label': 'Zoom out', onclick: () => zoom(-1) }, '−'),
        h('button', { type: 'button', 'aria-label': 'Zoom in', onclick: () => zoom(1) }, '+'),
        zoomOut),
      h('label', { class: 'field' },
        h('input', { type: 'checkbox', checked: s.pixelPerfect, onchange: e => { s.pixelPerfect = e.target.checked; zoomOut.textContent = zoomText(); } }),
        ' Pixel-perfect scaling (every art pixel the same size)'),
      h('h2', {}, 'Sound'),
      [['master', 'Overall'], ['music', 'Music'], ['sfx', 'Effects'], ['voice', 'Voice']].map(([name, label]) =>
        h('label', { class: 'field' }, h('span', { class: 'field-name' }, label),
          h('input', { type: 'range', min: 0, max: 100, step: 5, value: Math.round(s.volume(name) * 100),
            oninput: e => { s.setVolume(name, e.target.value / 100); if (name !== 'music') game.audio.play('coin'); } }))),
      h('label', { class: 'field' },
        h('input', { type: 'checkbox', checked: s.muted, onchange: e => { s.muted = e.target.checked; } }), ' Mute all sound'),
      voiceSettings(render),
      h('h2', {}, 'Keys'),
      h('table', { class: 'keys' }, h('tbody', {}, rows)),
      h('div', { class: 'row' },
        h('button', { type: 'button', onclick: e => { if (confirm('Erase every hero\'s gold and upgrades?')) { resetProgress(); e.target.textContent = 'Progress erased'; } } }, 'Erase progress'),
        h('button', { type: 'button', onclick: () => { s.resetKeys(); render(); } }, 'Reset all keys'),
        h('button', { type: 'button', class: 'primary', autofocus: true, onclick: returnTo }, 'Done')))),
      () => { if (capturing) { capturing = null; render(); } else returnTo(); });
    game.capture = capturing ? code => {
      s.setKeys(capturing, [code]);
      capturing = null;
      render();
    } : null;
  };
  render();
}

// ------------------------------------------------------------------------- play

const goods = () => game.assets.catalogs?.npcs?.goods ?? {};
const progressKey = hero => `${hero.gold}|${JSON.stringify(hero.upgrades)}`;

function startPlay(entry) {
  game.entry = entry;
  const level = new Level(entry.doc, entry.tileset);
  game.world = new World(level, game.hero, game.config, game.assets.entities, goods());
  // Gold and upgrades bought earlier come along into every level.
  const saved = loadProgress(game.hero.id);
  Object.assign(game.world.hero, { gold: saved.gold, upgrades: saved.upgrades });
  game.world.hero.applyUpgrades(goods());
  game.savedState = progressKey(game.world.hero);
  game.view = new WorldView(game.stage, game.world, sceneryFor(entry.tileset));
  game.view.interactKey = keyName(game.settings.keys('interact')[0] ?? 'KeyE');
  game.speech.stop();
  game.lines = new LineDirector();
  game.world.events.push({ type: 'levelStart' });
  game.audio.music(game.audio.musicFor('level', entry.tileset.id));
  game.hud = new Hud(game.hero, game.settings);
  const b = game.world.hero.body;
  game.lookAhead = 0;
  game.stage.follow(b.x, b.y - 60, 0, true);
  resume();
}

/** The scenery strips made for a tileset, if the site has them switched on. */
function sceneryFor(tileset) {
  const display = game.config.display ?? {};
  if (display.parallax === false) return {};
  return { parallax: game.assets.parallax.find(p => p.tileset === tileset.id) ?? null,
    replaceBackground: display.parallaxReplacesBackgroundTiles !== false, ground: display.parallaxGround ?? 1 };
}

function stopPlay() {
  game.speech?.stop();
  // Level music ends with the level; the menus play their own, if any is listed.
  if (game.world) game.audio?.music(game.audio.musicFor('title'));
  if (game.world) showBackdrop();
  game.world = null; game.view = null; game.hud = null; game.paused = false;
  game.input.setEnabled(false);
}

/** A level behind the menus, so they are not shown over an empty screen. */
function showBackdrop() {
  const entry = game.assets.levels[0];
  if (!entry) { game.stage.clear(); return; }
  const level = new Level(entry.doc, entry.tileset);
  const scenery = sceneryFor(entry.tileset);
  game.stage.showLevel(level, scenery.parallax, scenery.replaceBackground, scenery.ground);
  game.stage.follow(level.spawn.x + 300, level.spawn.y - 120, 0, true);
}

function resume() {
  game.paused = false;
  game.debugText = h('div', { class: 'debug', hidden: !game.stage.debug });
  show(h('div', { class: 'screen play' }, game.hud.el,
    h('div', { class: 'notice' }, game.world.level.name, game.entry.seed ? ` · seed ${game.entry.seed}` : '', ' · ',
      keyName(game.settings.keys('pause')[0] ?? 'Escape'), ' for the menu'),
    game.debugText), null);
  game.input.setEnabled(true);
  game.canvas.focus();
}

function pause() {
  game.paused = true;
  game.input.setEnabled(false);
  const entry = game.entry;
  show(h('div', { class: 'screen centered scrim' }, panel('Paused',
    entry.seed ? h('p', { class: 'muted' }, `Random dungeon · seed ${entry.seed} · ${entry.recipe.theme.replaceAll('_', ' ')} · `
      + `length ${entry.recipe.length} · difficulty ${entry.recipe.difficulty}`) : null,
    h('div', { class: 'menu' },
      h('button', { type: 'button', autofocus: true, onclick: resume }, 'Resume'),
      h('button', { type: 'button', onclick: () => startPlay(entry) }, 'Restart level'),
      entry.seed ? h('button', { type: 'button', onclick: () => startRandom({ ...entry.recipe, seed: randomSeed() }) }, 'New random level') : null,
      entry.seed ? h('button', { type: 'button', onclick: () => saveLevelFile(entry) }, 'Save level file') : null,
      h('button', { type: 'button', onclick: () => settingsScreen(pause) }, 'Settings'),
      h('button', { type: 'button', onclick: levelScreen }, 'Change level'),
      h('button', { type: 'button', onclick: heroScreen }, 'Change hero'),
      h('button', { type: 'button', onclick: titleScreen }, 'Quit to title')))), resume);
}

/** A merchant's shop: their card, what they sell, and the hero's gold. The world waits while it is open. */
function shopScreen(npc) {
  const world = game.world, hero = world.hero;
  world.openShop(npc);
  game.input.setEnabled(false);
  const close = () => { world.closeShop(); resume(); };
  const render = (message = '') => {
    const card = game.assets.cards.find(c => c.subjectEntity === npc.entity);
    const rows = (npc.g.stock ?? []).map(id => {
      const good = world.goods[id], { price, level, maxed } = world.priceOf(id);
      const owned = good.kind === 'upgrade' ? `Level ${level} of ${good.maxLevel}` : '';
      return h('li', { class: 'good' },
        h('div', {}, h('strong', {}, good.name), h('span', { class: 'muted' }, good.description), owned ? h('span', { class: 'owned' }, owned) : null),
        h('button', { type: 'button', class: 'primary', disabled: maxed || hero.gold < price,
          onclick: () => { const result = world.buy(npc, id); render(result === 'bought' ? `Bought ${good.name}.` : ''); } },
          maxed ? 'Owned' : `${price} gold`));
    });
    show(h('div', { class: 'screen centered scrim' }, h('section', { class: 'panel shop' },
      card ? h('div', { class: 'shop-card' }, plainCard(card, npc.entity.name, 'Merchant', npc.entity.description)) : null,
      h('div', { class: 'shop-goods' },
        h('h1', {}, npc.entity.name),
        h('p', { class: 'gold' }, `You have ${hero.gold} gold.`),
        h('ul', {}, rows),
        h('p', { class: 'muted', role: 'status' }, message || 'Upgrades are permanent and stay with this hero between levels.'),
        h('div', { class: 'row' }, h('button', { type: 'button', autofocus: true, onclick: close }, 'Leave'))))), close);
  };
  render();
}

function completeScreen() {
  game.paused = true;
  game.input.setEnabled(false);
  const entry = game.entry, world = game.world;
  const seconds = Math.round(world.time), clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  show(h('div', { class: 'screen centered scrim' }, panel('Level complete',
    h('table', { class: 'results' }, h('tbody', {},
      h('tr', {}, h('th', {}, 'Time'), h('td', {}, clock)),
      h('tr', {}, h('th', {}, 'Score'), h('td', {}, world.hero.score)),
      h('tr', {}, h('th', {}, 'Deaths'), h('td', {}, world.deaths)))),
    h('div', { class: 'menu' },
      entry.seed ? h('button', { type: 'button', autofocus: true, onclick: () => startRandom({ ...entry.recipe, seed: randomSeed() }) }, 'Next random level') : null,
      h('button', { type: 'button', autofocus: !entry.seed, onclick: () => startPlay(entry) }, 'Play again'),
      h('button', { type: 'button', onclick: levelScreen }, 'Change level'),
      h('button', { type: 'button', onclick: heroScreen }, 'Change hero'),
      h('button', { type: 'button', onclick: titleScreen }, 'Quit to title')))), levelScreen);
}

function gameOverScreen() {
  game.paused = true;
  game.input.setEnabled(false);
  const entry = game.entry;
  show(h('div', { class: 'screen centered scrim' }, panel('Game over',
    h('p', { class: 'muted' }, `Score ${game.world.hero.score}.`),
    h('div', { class: 'menu' },
      h('button', { type: 'button', autofocus: true, onclick: () => startPlay(entry) }, 'Try again'),
      h('button', { type: 'button', onclick: levelScreen }, 'Change level'),
      h('button', { type: 'button', onclick: heroScreen }, 'Change hero'),
      h('button', { type: 'button', onclick: titleScreen }, 'Quit to title')))), levelScreen);
}

/** Download a generated level as a JSON file that can be added to levels/. */
function saveLevelFile(entry) {
  const blob = new Blob([levelToJson(entry.doc)], { type: 'application/json' });
  const link = h('a', { href: URL.createObjectURL(blob), download: `${entry.doc.id}.json` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Which sound each simulation event makes. */
const ABILITY_CUE = { melee: 'swing', area: 'cast', projectile: 'shoot', target: 'cast', heal: 'heal', eruption: 'cast', breath: 'breath' };
const USE_CUE = { container: 'chest', breakable: 'break', switch: 'lever', shrine: 'shrine' };

function playCues(world) {
  const audio = game.audio, stage = game.stage;
  const half = stage.app.screen.width / 2 / stage.scale;
  for (const e of world.events) {
    let cue = null;
    switch (e.type) {
      case 'jump': cue = 'jump'; break;
      case 'land': cue = 'land'; break;
      case 'ability': cue = ABILITY_CUE[e.kind]; break;
      case 'teleport': cue = 'teleport'; break;
      case 'damage': cue = e.team === 'hero' ? 'hurt' : 'hit'; break;
      case 'kill': cue = 'defeat'; break;
      case 'gave': cue = e.gives.keys ? 'key' : e.gives.score ? 'coin' : 'pickup'; break;
      case 'used': cue = USE_CUE[e.behaviour]; break;
      case 'checkpoint': cue = 'checkpoint'; break;
      case 'gateOpened': cue = 'gate'; break;
      case 'locked': cue = 'locked'; break;
      case 'heroDied': cue = 'fall'; break;
      case 'respawn': cue = 'respawn'; break;
      case 'alert': cue = e.actor.boss ? null : 'alert'; break;
      case 'enemyAttack': cue = e.actor.boss && e.kind === 'melee' ? 'growl' : ABILITY_CUE[e.kind]; break;
      case 'shockwave': cue = 'shockwave'; break;
      case 'bossPhase': cue = 'phase'; break;
      case 'bossFight': cue = 'boss'; audio.music(audio.musicFor('boss') ?? audio.wanted); break;
      case 'bossDefeated': audio.music(audio.musicFor('level', world.level.tileset.id)); break;
      case 'levelComplete': cue = 'complete'; audio.music(audio.musicFor('complete')); break;
      case 'gameOver': cue = 'gameover'; break;
      case 'bought': cue = 'chest'; break;
      case 'cannotAfford': cue = 'locked'; break;
      default:
    }
    // Sounds come from the left or right according to where they happen on screen.
    if (cue) audio.play(cue, { pan: e.x == null ? 0 : (e.x - stage.camera.x) / half * 0.8 });
  }
}

function tick(dt) {
  const { input, world, stage } = game;
  if (!world || game.paused) { input.endFrame(); return; }
  if (input.pressed('pause')) { input.endFrame(); pause(); return; }
  if (input.pressed('zoomIn')) stage.zoomBy(1);
  if (input.pressed('zoomOut')) stage.zoomBy(-1);
  if (input.pressed('debug')) { stage.setDebug(!stage.debug); game.debugText.hidden = !stage.debug; }

  // The simulation runs in fixed steps; key presses are kept until a step has used them.
  const steps = world.advance(dt, first => keyboardIntents(input, first));

  // Draw between the last two simulation states so motion is smooth at any refresh rate.
  const hero = world.hero, b = hero.body;
  const { x, y } = game.view.update(dt);
  if (input.pressed('mute')) game.settings.muted = !game.settings.muted;
  playCues(world);
  for (const line of game.lines.update(world.events, world, dt)) game.speech.say(line.actor, line.text);
  game.bubbles.update(dt);
  const shopAt = world.events.find(e => e.type === 'shop')?.actor;
  // Keep gold and upgrades saved as they change.
  if (progressKey(world.hero) !== game.savedState) { saveProgress(game.hero.id, world.hero); game.savedState = progressKey(world.hero); }
  const gameOver = world.events.some(e => e.type === 'gameOver');
  const complete = world.events.some(e => e.type === 'levelComplete');
  world.events.length = 0;                    // sounds will read these later
  // Look a little ahead of a hero who keeps moving one way. The offset follows
  // the movement speed and eases slowly, so turning around does not jolt the view.
  const ahead = Math.max(-1, Math.min(1, b.vx / 280)) * 48;
  game.lookAhead += (ahead - game.lookAhead) * Math.min(1, dt * 1.5);
  stage.follow(x + game.lookAhead, y - 60, dt);
  if (stage.debug) {
    game.debugText.textContent = `x ${b.x.toFixed(1)}  y ${b.y.toFixed(1)}  vx ${b.vx.toFixed(0)}  vy ${b.vy.toFixed(0)}  `
      + `${b.grounded ? 'on ' + b.groundKind : 'in air'}  ${hero.pose.slot} ${hero.pose.frame + 1}  `
      + `enemies ${world.enemies.length}  tick ${world.tick}`;
  }
  game.hud.update(hero);
  // During a boss fight the bar shows across the top and the view stays inside the arena.
  const arena = world.arena?.locked ? world.arena : null;
  game.hud.updateBoss(arena ? world.boss : null);
  const ease = Math.min(1, dt * 4), bounds = stage.bounds;
  bounds.left += ((arena ? arena.left : 0) - bounds.left) * ease;
  bounds.right += ((arena ? arena.right : world.level.width) - bounds.right) * ease;
  if (steps > 0) input.endFrame();
  if (gameOver) gameOverScreen();
  else if (complete) completeScreen();
  else if (shopAt) shopScreen(shopAt);
}

// ------------------------------------------------------------------------- boot

async function main() {
  const status = document.getElementById('boot-status');
  try {
    const { config, url, usedExample } = await loadConfig();
    Object.assign(game, { config, usedExample });
    document.title = config.title ?? document.title;
    game.settings = new Settings(config);
    game.input = new Input(game.settings);
    game.canvas = document.getElementById('game');
    game.stage = new Stage(game.canvas, game.settings);
    await game.stage.init();
    game.assets = await loadAssets(config, url, (done, total) => {
      status.textContent = `Loading ${done} of ${total}`;
    });
    let audioCatalog = null;
    const audioUrl = config.catalogs?.audio ? resolve(config.catalogs.audio, url) : null;
    if (audioUrl) { try { audioCatalog = await fetchJson(audioUrl); } catch (error) { console.warn(error.message); } }
    game.audio = new AudioEngine(config, game.settings, audioCatalog, audioUrl ?? url);
    game.bubbles = new Bubbles(document.getElementById('bubbles'), game.stage);
    game.speech = new Speech(game.bubbles, game.settings, game.audio, config, url);
    // Copying a recorded voice needs an extra model file, so only ask for it when a character uses one.
    game.speech.wantsCloning = Object.values(game.assets.entities).some(e => e.gameplay?.voice?.clip);
    game.speech.pocket.onChange = () => game.voiceStatus?.();
    game.speech.start();
    // A small click for every button and link in the menus.
    ui.addEventListener('click', e => { if (e.target.closest('button, a.button')) game.audio.play('ui'); });
    if (!heroes().length) throw new Error('No playable heroes were loaded. Open viewer.html to see what is wrong.');

    showBackdrop();
    game.stage.onTick = tick;

    window.addEventListener('keydown', e => {
      if (game.capture) {                       // settings screen is waiting for a key
        e.preventDefault();
        if (e.code === 'Escape') game.back?.(); else game.capture(e.code);
        return;
      }
      if (e.code === 'Escape' && game.back) { e.preventDefault(); game.back(); }
    });
    game.canvas.addEventListener('wheel', e => {
      if (!game.world || game.paused) return;
      e.preventDefault();
      game.stage.zoomBy(e.deltaY > 0 ? -1 : 1);
    }, { passive: false });

    document.getElementById('boot').remove();
    titleScreen();
  } catch (error) {
    console.error(error);
    status.textContent = `Could not start: ${error.message}`;
  }
}

main();
