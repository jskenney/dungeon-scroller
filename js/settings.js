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

  /** A volume from 0 to 1: 'master', 'music', 'sfx' or 'voice'. */
  volume(name) { return this.stored.volumes?.[name] ?? this.config.audio?.[name] ?? 1; }
  setVolume(name, value) {
    this.stored.volumes = { ...this.stored.volumes, [name]: Math.max(0, Math.min(1, value)) };
    this.save();
  }
  get muted() { return Boolean(this.stored.muted); }
  set muted(v) { this.stored.muted = Boolean(v); this.save(); }

  /**
   * How lines are spoken: 'off' (speech bubbles only), 'browser' (the browser's own voice) or
   * 'pocket' (Pocket TTS). The site sets the starting choice with speech.provider.
   */
  get voiceMode() {
    if (this.stored.voiceMode) return this.stored.voiceMode;
    if (this.stored.speakAloud != null) return this.stored.speakAloud ? 'browser' : 'off';   // from before there was a choice
    return { webspeech: 'browser', pocket: 'pocket' }[this.config.speech?.provider] ?? 'off';
  }
  set voiceMode(v) { this.stored.voiceMode = v; this.save(); }
  /** The player has agreed to Pocket TTS's download. A site's default never downloads it on its own. */
  get pocketAgreed() { return Boolean(this.stored.pocketAgreed); }
  set pocketAgreed(v) { this.stored.pocketAgreed = Boolean(v); this.save(); }
  /** The larger, full-precision Pocket TTS model instead of the 8-bit one. */
  get pocketFullPrecision() { return this.stored.pocketFullPrecision ?? Boolean(this.config.speech?.pocket?.fullPrecision); }
  set pocketFullPrecision(v) { this.stored.pocketFullPrecision = Boolean(v); this.save(); }

  /** The playing-card deck last chosen in a card game. */
  get cardDeck() { return this.stored.cardDeck ?? null; }
  set cardDeck(id) { this.stored.cardDeck = id; this.save(); }

  get lastHero() { return this.stored.lastHero ?? null; }
  set lastHero(id) { this.stored.lastHero = id; this.save(); }
}
