// Player settings kept in this browser: key bindings, zoom, last hero.
// The site's dungeon.json supplies the defaults; anything the player changes
// is stored here and overrides them.

const STORAGE_KEY = 'dungeon-scroller.settings';

/** Actions in the order the settings screen lists them, with their labels. */
export const ACTIONS = [
  ['left', 'Move left'], ['right', 'Move right'], ['up', 'Up / fly up'], ['down', 'Crouch / fly down'],
  ['jump', 'Jump'], ['run', 'Run (hold)'],
  ['attack1', 'Attack 1'], ['attack2', 'Attack 2'], ['attack3', 'Attack 3'],
  ['teleport', 'Teleport'], ['fly', 'Fly on / off'], ['interact', 'Interact'],
  ['zoomIn', 'Zoom in'], ['zoomOut', 'Zoom out'], ['pause', 'Pause'], ['mute', 'Mute'], ['debug', 'Debug overlay'],
];

export class Settings {
  /** @param {object} config parsed site configuration */
  constructor(config) {
    this.config = config;
    this.stored = { controls: {} };
    try {
      this.stored = { controls: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch { /* storage unavailable or unreadable: defaults apply */ }
    this.listeners = new Set();
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stored)); } catch { /* ignore */ }
    for (const fn of this.listeners) fn();
  }

  onChange(fn) { this.listeners.add(fn); }

  /** Site default keys for an action. */
  defaultKeys(action) { return this.config.controls?.[action] ?? []; }

  /** Keys in effect for an action: the player's choice, else the site default. */
  keys(action) { return this.stored.controls[action] ?? this.defaultKeys(action); }

  isCustom(action) { return action in this.stored.controls; }

  setKeys(action, codes) { this.stored.controls[action] = codes; this.save(); }

  resetKeys(action) {
    if (action) delete this.stored.controls[action]; else this.stored.controls = {};
    this.save();
  }

  /** Other actions that share a key with this one. */
  conflicts(action) {
    const mine = new Set(this.keys(action));
    return ACTIONS.map(a => a[0]).filter(other => other !== action && this.keys(other).some(k => mine.has(k)));
  }

  get display() { return this.config.display ?? {}; }
  get viewTiles() { return this.stored.viewTiles ?? this.display.defaultViewTiles ?? 8; }
  set viewTiles(v) {
    const min = this.display.minViewTiles ?? 4, max = this.display.maxViewTiles ?? 24;
    this.stored.viewTiles = Math.max(min, Math.min(max, v));
    this.save();
  }
  get pixelPerfect() { return this.stored.pixelPerfect ?? this.display.pixelPerfect ?? true; }
  set pixelPerfect(v) { this.stored.pixelPerfect = Boolean(v); this.save(); }

  get lastHero() { return this.stored.lastHero ?? null; }
  set lastHero(id) { this.stored.lastHero = id; this.save(); }
}
