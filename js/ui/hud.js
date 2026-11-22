// Heads-up display for the play screen: health, mana, lives, score and the
// hero's abilities with their keys. Plain HTML over the canvas.

import { h, keyName } from './dom.js';
import { describeAbility } from './card.js';

/** What each temporary boost is called on screen. */
export const BOOST_NAMES = { damage: 'Power', attackSpeed: 'Haste', moveSpeed: 'Swiftness', mpRegen: 'Focus', toughness: 'Stone skin' };

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
    this.lives = h('span'); this.score = h('span'); this.keys = h('span'); this.boost = h('span', { class: 'boost' });
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
    this.bossName = h('div', { class: 'boss-name' });
    this.bossFill = h('div', { class: 'fill' });
    this.bossBar = h('div', { class: 'boss', hidden: true }, this.bossName, h('div', { class: 'bar boss-hp', role: 'meter', 'aria-label': 'Boss health' }, this.bossFill));
    this.el = h('div', { class: 'hud' }, this.bossBar,
      h('div', { class: 'hud-status' },
        h('div', { class: 'hud-name' }, hero.name),
        this.hp.el, this.mp.el,
        h('div', { class: 'hud-line' }, h('span', {}, 'Lives ', this.lives), h('span', {}, 'Score ', this.score),
          h('span', {}, 'Keys ', this.keys), this.boost)),
      h('div', { class: 'hud-abilities' }, abilities));
    this.last = {};
    this.refreshKeys();
    settings.onChange(() => this.refreshKeys());
  }

  refreshKeys() {
    for (const s of this.slots) s.key.textContent = this.settings.keys(s.action).map(keyName)[0] ?? '—';
  }

  /** Show a boss's name and health across the top, or hide it when there is no fight. */
  updateBoss(boss) {
    const id = boss?.id ?? null;
    if (id !== this.last.bossId) {
      this.bossBar.hidden = !boss;
      if (boss) this.bossName.textContent = boss.entity.name ?? boss.entity.id;
      this.last.bossId = id; this.last.bossHp = null;
    }
    if (boss && boss.hp !== this.last.bossHp) {
      this.bossFill.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
      this.last.bossHp = boss.hp;
    }
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
    for (const slot of this.slots) slot.el.classList.toggle('cooling', (s.cooldowns?.[slot.action] ?? 0) > 0);
    if (s.lives !== this.last.lives) this.lives.textContent = s.lives >= 9000 ? '∞' : s.lives;   // the default of 9999 means unlimited
    if (s.score !== this.last.score) this.score.textContent = s.score;
    const keys = s.keys ?? 0;
    const boost = (s.boosts ?? []).map(b => `${BOOST_NAMES[b.stat] ?? b.stat} ${Math.ceil(b.time)}s`).join(' · ');
    if (keys !== this.last.keys) this.keys.textContent = keys;
    if (boost !== this.last.boost) this.boost.textContent = boost;
    this.last = { ...this.last, hp, mp, lives: s.lives, score: s.score, keys, boost };
  }
}
