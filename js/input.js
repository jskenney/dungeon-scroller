// Keyboard input mapped to game actions through the current key bindings.

import { ACTIONS } from './settings.js';

export class Input {
  /** @param {import('./settings.js').Settings} settings */
  constructor(settings) {
    this.settings = settings;
    this.down = new Set();      // key codes currently held
    this.edges = new Set();     // actions pressed since the last endFrame()
    this.enabled = false;       // true only while the play screen has control
    this.byCode = new Map();
    this.rebuild();
    settings.onChange(() => this.rebuild());
    window.addEventListener('keydown', e => this.onKey(e, true));
    window.addEventListener('keyup', e => this.onKey(e, false));
    window.addEventListener('blur', () => this.down.clear());
  }

  rebuild() {
    this.byCode.clear();
    for (const [action] of ACTIONS) {
      for (const code of this.settings.keys(action)) {
        if (!this.byCode.has(code)) this.byCode.set(code, []);
        this.byCode.get(code).push(action);
      }
    }
  }

  onKey(e, isDown) {
    const actions = this.byCode.get(e.code);
    if (!isDown) { this.down.delete(e.code); return; }
    if (!this.enabled || !actions || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();                       // stop arrows and Space from scrolling the page
    if (!e.repeat) for (const action of actions) this.edges.add(action);
    this.down.add(e.code);
  }

  /** Is any key bound to this action held? */
  held(action) {
    return this.enabled && this.settings.keys(action).some(code => this.down.has(code));
  }

  /** Was this action pressed since the last frame? */
  pressed(action) { return this.edges.has(action); }

  endFrame() { this.edges.clear(); }

  setEnabled(on) {
    this.enabled = on;
    this.down.clear();
    this.edges.clear();
  }
}
