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
import { cardElement, spritePreview } from './ui/card.js';
import { Hud } from './ui/hud.js';

const ui = document.getElementById('ui');
const game = {
  config: null, assets: null, settings: null, input: null, stage: null,
  hero: null, world: null, view: null, hud: null, debugText: null,
  lookAhead: 0,
  entry: null,                    // the level being played: {name, doc, tileset, seed?}
  paused: false, back: null,       // back: what Escape does on the current screen
};

/** Replace the current screen. `back` is called when Escape is pressed. */
function show(element, back = null) {
  ui.replaceChildren(element);
  game.back = back;
  element.querySelector('[autofocus]')?.focus();
}

const heroes = () => Object.values(game.assets.entities).filter(e => e.kind === 'player' && e.gameplay);
const cardFor = entity => game.assets.cards.find(c => c.subjectEntity === entity);

function panel(title, ...children) {
  return h('section', { class: 'panel' }, h('h1', {}, title), ...children);
}

// ----------------------------------------------------------------------- title

function titleScreen() {
  stopPlay();
  const problems = game.assets.problems.filter(p => p.level === 'error').length;
  show(h('div', { class: 'screen title' },
    h('div', { class: 'title-block' },
      h('h1', { class: 'logo' }, game.config.title ?? 'Dungeon Scroller'),
      h('div', { class: 'menu' },
        h('button', { type: 'button', autofocus: true, onclick: heroScreen }, 'Play'),
        h('button', { type: 'button', onclick: () => settingsScreen(titleScreen) }, 'Settings'),
        h('a', { class: 'button', href: 'viewer.html' }, 'Asset viewer'))),
    h('p', { class: 'footnote' },
      game.usedExample ? 'Using example.dungeon.json (no dungeon.json found). ' : '',
      problems ? h('a', { href: 'viewer.html#problems' }, `${problems} asset problem${problems === 1 ? '' : 's'} found — open the viewer.`) : '')));
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
      h('strong', {}, entity.name), h('div', { class: 'muted' }, entity.gameplay.role)));
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
  show(h('div', { class: 'screen select' },
    h('header', { class: 'bar-top' },
      h('button', { type: 'button', onclick: titleScreen }, '← Back'),
      h('h1', {}, 'Choose your hero'),
      preview,
      h('button', { type: 'button', class: 'primary', onclick: confirm }, 'Continue')),
    grid), titleScreen);
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

  show(h('div', { class: 'screen centered' }, panel('Choose a level',
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
    enemies: ofKind('enemy'), bosses: ofKind('boss'), limits: heroLimits() });
  // Put the recipe in the address bar so the level can be shared or replayed.
  const query = new URLSearchParams({ seed, theme: tileset.id, length, difficulty });
  history.replaceState(null, '', `${location.pathname}?${query}`);
  startPlay({ id: doc.id, name: 'Random dungeon', doc, tileset, seed, recipe: { theme: tileset.id, length, difficulty } });
}

// --------------------------------------------------------------------- settings

function settingsScreen(returnTo) {
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
    show(h('div', { class: 'screen centered' }, panel('Settings',
      h('h2', {}, 'Display'),
      h('div', { class: 'field' }, 'Zoom ',
        h('button', { type: 'button', 'aria-label': 'Zoom out', onclick: () => zoom(-1) }, '−'),
        h('button', { type: 'button', 'aria-label': 'Zoom in', onclick: () => zoom(1) }, '+'),
        zoomOut),
      h('label', { class: 'field' },
        h('input', { type: 'checkbox', checked: s.pixelPerfect, onchange: e => { s.pixelPerfect = e.target.checked; zoomOut.textContent = zoomText(); } }),
        ' Pixel-perfect scaling (every art pixel the same size)'),
      h('h2', {}, 'Keys'),
      h('table', { class: 'keys' }, h('tbody', {}, rows)),
      h('div', { class: 'row' },
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

function startPlay(entry) {
  game.entry = entry;
  const level = new Level(entry.doc, entry.tileset);
  game.world = new World(level, game.hero, game.config, game.assets.entities);
  game.view = new WorldView(game.stage, game.world);
  game.hud = new Hud(game.hero, game.settings);
  const b = game.world.hero.body;
  game.lookAhead = 0;
  game.stage.follow(b.x, b.y - 60, 0, true);
  resume();
}

function stopPlay() {
  if (game.world) showBackdrop();
  game.world = null; game.view = null; game.hud = null; game.paused = false;
  game.input.setEnabled(false);
}

/** A level behind the menus, so they are not shown over an empty screen. */
function showBackdrop() {
  const entry = game.assets.levels[0];
  if (!entry) { game.stage.clear(); return; }
  const level = new Level(entry.doc, entry.tileset);
  game.stage.showLevel(level);
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
  const gameOver = world.events.some(e => e.type === 'gameOver');
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
  if (steps > 0) input.endFrame();
  if (gameOver) gameOverScreen();
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
