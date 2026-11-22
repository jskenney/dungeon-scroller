// Heads-up display for the play screen: health, mana, lives, score and the
// hero's abilities with their keys. Plain HTML over the canvas.

import { h, keyName } from './dom.js';
import { describeAbility } from './card.js';

export class Hud {
  constructor(hero, settings) {
    this.hero = hero; this.settings = settings;
    const g = hero.gameplay;
    const bar = (cls, label) => {
      const fill = h('div', { class: 'fill' });
      const value = h('span', { class: 'value' });
      const el = h('div', { class: `bar ${cls}`, role: 'meter', 'aria-label': label }, fill, h('span', { class: 'label' }, label), value);
      return { el, fill, value };
    };
    this.hp = bar('hp', 'HP'); this.mp = bar('mp', 'MP');
    this.lives = h('span'); this.score = h('span');
    this.slots = [];
    const slot = (action, name, cost, title) => {
      const key = h('kbd');
      const el = h('div', { class: 'slot', title }, key, h('span', { class: 'name' }, name), cost != null ? h('span', { class: 'cost' }, cost ? `${cost} MP` : '') : null);
      this.slots.push({ action, key, el, cost: cost ?? 0 });
      return el;
    };
    const abilities = Object.entries(g.abilities).map(([name, a]) =>
      slot(name, hero.animations[name]?.label ?? name, a.mp, describeAbility(a)));
    abilities.push(slot('teleport', 'Teleport', g.teleport.mp, `Blink ${g.teleport.distance} px forward`));
    const mode = g.flight?.mode ?? 'none';
    if (mode !== 'none') abilities.push(slot('fly', 'Fly', null, mode === 'free' ? 'Flies freely' : `Uses ${g.flight.mpPerSecond} MP per second`));
    this.el = h('div', { class: 'hud' },
      h('div', { class: 'hud-status' },
        h('div', { class: 'hud-name' }, hero.name),
        this.hp.el, this.mp.el,
        h('div', { class: 'hud-line' }, h('span', {}, 'Lives ', this.lives), h('span', {}, 'Score ', this.score))),
      h('div', { class: 'hud-abilities' }, abilities));
    this.last = {};
    this.refreshKeys();
    settings.onChange(() => this.refreshKeys());
  }

  refreshKeys() {
    for (const s of this.slots) s.key.textContent = this.settings.keys(s.action).map(keyName)[0] ?? '—';
  }

  /** @param {{hp:number, mp:number, lives:number, score:number}} s */
  update(s) {
    const g = this.hero.gameplay;
    const hp = Math.ceil(s.hp), mp = Math.floor(s.mp);
    if (hp !== this.last.hp) {
      this.hp.fill.style.width = `${(hp / g.stats.hp) * 100}%`;
      this.hp.value.textContent = `${hp} / ${g.stats.hp}`;
      this.hp.el.setAttribute('aria-valuenow', hp);
    }
    if (mp !== this.last.mp) {
      this.mp.fill.style.width = `${(mp / g.stats.mp) * 100}%`;
      this.mp.value.textContent = `${mp} / ${g.stats.mp}`;
      this.mp.el.setAttribute('aria-valuenow', mp);
      for (const slot of this.slots) slot.el.classList.toggle('unaffordable', mp < slot.cost);
    }
    if (s.lives !== this.last.lives) this.lives.textContent = s.lives >= 9999 ? '∞' : s.lives;
    if (s.score !== this.last.score) this.score.textContent = s.score;
    this.last = { hp, mp, lives: s.lives, score: s.score };
  }
}
