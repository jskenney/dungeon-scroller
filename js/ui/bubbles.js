// Speech bubbles: HTML elements that follow a character's head. Being HTML,
// the text stays sharp at any zoom and can be read by assistive software.

import { h } from './dom.js';

const TYPE_SPEED = 42;        // characters per second while a line appears
const FADE = 0.3;

export class Bubbles {
  /** @param {HTMLElement} layer @param {import('../render/stage.js').Stage} stage */
  constructor(layer, stage) {
    this.layer = layer;
    this.stage = stage;
    this.items = new Map();     // actor -> {el, text, age, hold}
  }

  /** Show a line above an actor, replacing anything it was already saying. */
  say(actor, text) {
    this.items.get(actor)?.el.remove();
    const el = h('div', { class: `bubble ${actor.boss ? 'boss-line' : actor.team === 'enemy' ? 'enemy-line' : 'hero-line'}`, role: 'status' });
    this.layer.append(el);
    this.items.set(actor, { el, text, age: 0, hold: 1.4 + text.length * 0.055 });
  }

  clear() {
    for (const item of this.items.values()) item.el.remove();
    this.items.clear();
  }

  /** Move every bubble to its speaker and advance its typing and fading. */
  update(dt) {
    const { stage } = this, world = stage.world;
    const { width, height } = stage.app.screen;
    for (const [actor, item] of this.items) {
      item.age += dt;
      const typed = Math.min(item.text.length, Math.ceil(item.age * TYPE_SPEED));
      if (item.shown !== typed) { item.el.textContent = item.text.slice(0, typed); item.shown = typed; }
      const end = item.text.length / TYPE_SPEED + item.hold;
      if (item.age > end + FADE || actor.gone) { item.el.remove(); this.items.delete(actor); continue; }
      const b = actor.body;
      const x = world.position.x + b.x * stage.scale;
      const y = world.position.y + (b.y - b.h - 10) * stage.scale;
      const offscreen = x < -40 || x > width + 40 || y < -20 || y > height + 40;
      item.el.style.display = offscreen ? 'none' : '';
      if (offscreen) continue;
      const half = item.el.offsetWidth / 2;
      const left = Math.max(8 + half, Math.min(width - 8 - half, x));
      const top = Math.max(item.el.offsetHeight + 8, y);
      item.el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px) translate(-50%, -100%)`;
      item.el.style.setProperty('--tail', `${Math.round(x - left)}px`);
      item.el.style.opacity = item.age > end ? String(1 - (item.age - end) / FADE) : '1';
    }
  }
}
