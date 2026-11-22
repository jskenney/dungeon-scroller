// Game shell: boots the site configuration and assets, then moves between
// the title, hero selection, level selection, settings and play screens.

import { loadConfig } from './config.js';
import { loadAssets } from './assets/loader.js';
import { Settings, ACTIONS } from './settings.js';
import { Input } from './input.js';
import { Stage } from './render/stage.js';
import { StagingRoom } from './shell/staging.js';
import { h, keyName } from './ui/dom.js';
import { cardElement, spritePreview } from './ui/card.js';
import { Hud } from './ui/hud.js';

const ui = document.getElementById('ui');
const game = {
  config: null, assets: null, settings: null, input: null, stage: null,
  hero: null, tileset: null, room: null, hud: null,
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
const tilesetName = t => t.id.replaceAll('_', ' ');

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
  const rooms = game.assets.tilesets.map((tileset, i) => h('button', { type: 'button', class: 'level', autofocus: i === 0,
    onclick: () => startPlay(tileset) },
    h('strong', {}, `Staging room — ${tilesetName(tileset)}`),
    h('span', { class: 'muted' }, 'A flat floor for trying out movement, abilities, zoom and key bindings.')));
  show(h('div', { class: 'screen centered' }, panel('Choose a level',
    h('p', { class: 'muted' }, `Playing as ${game.hero.name}.`),
    h('div', { class: 'levels' }, rooms,
      h('button', { type: 'button', class: 'level', disabled: true },
        h('strong', {}, 'Random dungeon'),
        h('span', { class: 'muted' }, 'Not built yet: arrives with the level generator.'))),
    h('div', { class: 'row' }, h('button', { type: 'button', onclick: heroScreen }, '← Change hero')))), heroScreen);
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

function startPlay(tileset) {
  game.tileset = tileset;
  game.room = new StagingRoom(game.stage, game.input, game.config, game.hero, tileset);
  game.hud = new Hud(game.hero, game.settings);
  resume();
}

function stopPlay() {
  game.room = null; game.hud = null; game.paused = false;
  game.input.setEnabled(false);
}

function resume() {
  game.paused = false;
  show(h('div', { class: 'screen play' }, game.hud.el,
    h('div', { class: 'notice' }, 'Staging room · movement test · ', keyName(game.settings.keys('pause')[0] ?? 'Escape'), ' for the menu')), null);
  game.input.setEnabled(true);
  game.canvas.focus();
}

function pause() {
  game.paused = true;
  game.input.setEnabled(false);
  show(h('div', { class: 'screen centered scrim' }, panel('Paused',
    h('div', { class: 'menu' },
      h('button', { type: 'button', autofocus: true, onclick: resume }, 'Resume'),
      h('button', { type: 'button', onclick: () => settingsScreen(pause) }, 'Settings'),
      h('button', { type: 'button', onclick: levelScreen }, 'Change level'),
      h('button', { type: 'button', onclick: heroScreen }, 'Change hero'),
      h('button', { type: 'button', onclick: titleScreen }, 'Quit to title')))), resume);
}

function tick(dt) {
  const { input, settings, room } = game;
  if (room && !game.paused) {
    if (input.pressed('pause')) { input.endFrame(); pause(); return; }
    if (input.pressed('zoomIn')) game.stage.zoomBy(1);
    if (input.pressed('zoomOut')) game.stage.zoomBy(-1);
    room.update(dt);
    game.hud.update(room.s);
  }
  input.endFrame();
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

    // A room behind the menus, so the title is not an empty screen.
    if (game.assets.tilesets[0]) {
      const room = game.stage.buildFlatRoom(game.assets.tilesets[0]);
      game.stage.follow(room.width / 2, 0);
    }
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
      if (!game.room || game.paused) return;
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
