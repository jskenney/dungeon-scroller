// The simulation: one level, the hero, enemies and projectiles, advanced in
// fixed steps. Nothing here draws or reads the keyboard.

import { Hero } from './hero.js';
import { Enemy } from './enemy.js';
import { overlap } from './actor.js';
import { makeRng } from '../level/random.js';
import { TILE } from '../level/level.js';

export const NO_INTENTS = Object.freeze({
  dir: 0, vertical: 0, run: false, jumpHeld: false, jumpPressed: false, down: false,
  attack1: false, attack2: false, attack3: false, teleport: false, fly: false,
});

const WAKE_DISTANCE = 1500;      // enemies farther than this from the hero stand still
const RESPAWN_DELAY = 1.6;       // seconds the death pose shows before the hero returns

export class World {
  /**
   * @param {import('../level/level.js').Level} level
   * @param {object} heroEntity  sheet entity with `gameplay`
   * @param {object} config      site configuration
   * @param {Record<string, object>} [entities]  sheet entities by "kind/id", for things the level places
   */
  constructor(level, heroEntity, config, entities = {}) {
    this.level = level;
    this.config = config;
    this.step = 1 / (config.physics?.tickRate ?? 60);
    this.accumulator = 0;
    this.tick = 0;
    // Enemy choices use their own seeded source, so a level plays the same way each time.
    const rng = makeRng(`${level.id}:${level.doc.generator?.seed ?? ''}`);
    this.random = rng.next;
    this.hero = new Hero(heroEntity, config);
    this.checkpoint = { ...level.spawn };
    this.hero.placeAt(this.checkpoint.x, this.checkpoint.y);
    /** @type {Enemy[]} */
    this.enemies = [];
    this.projectiles = [];
    this.events = [];
    this.over = false;             // true when the last life is lost
    for (const placed of level.doc.entities ?? []) {
      if (placed.type !== 'enemy') continue;
      const entity = entities[`enemy/${placed.id}`];
      if (!entity?.gameplay) continue;
      this.enemies.push(new Enemy(entity, config, (placed.col + 0.5) * TILE, (placed.row + 1) * TILE));
    }
  }

  /**
   * Advance by real time, in whole fixed steps.
   * @param {number} seconds  time since the last call
   * @param {(firstStep: boolean) => object} readIntents  called once per step; presses
   *        should be reported only when firstStep is true so they are not counted twice
   * @returns {number} how many steps ran
   */
  advance(seconds, readIntents) {
    this.accumulator = Math.min(this.accumulator + seconds, this.step * 5);   // never spiral after a stall
    let steps = 0;
    while (this.accumulator >= this.step) {
      this.stepOnce(readIntents(steps === 0));
      this.accumulator -= this.step;
      steps++;
    }
    return steps;
  }

  /** Fraction of a step that has elapsed since the last one; used to draw smoothly. */
  get alpha() { return this.accumulator / this.step; }

  stepOnce(intents) {
    const hero = this.hero, dt = this.step;
    hero.update(intents, this, dt);
    this.events.push(...hero.events.splice(0));

    for (const enemy of this.enemies) {
      if (Math.abs(enemy.body.x - hero.body.x) > WAKE_DISTANCE && !enemy.dead) continue;
      enemy.update(this, dt);
    }
    for (const p of this.projectiles) p.update(this, dt);

    // Touching an enemy hurts a little and pushes the hero away.
    if (this.config.rules?.touchDamage !== false && !hero.dead && hero.invulnerable <= 0) {
      const body = hero.bodyRect();
      for (const enemy of this.enemies) {
        if (enemy.dead || !overlap(body, enemy.bodyRect())) continue;
        const amount = (enemy.g.stats.touchDamage ?? 0) * (this.config.difficulty?.touchDamage ?? 1);
        if (amount > 0) { this.hurtHero(amount, enemy, {}, this.config.rules?.touchKnockback ?? 220); break; }
      }
    }

    this.enemies = this.enemies.filter(e => !e.gone);
    this.projectiles = this.projectiles.filter(p => !p.gone);

    // Falling out of the bottom of the level, or dying, costs a life.
    if (!hero.dead && hero.body.y - hero.body.h > this.level.height + 200) this.respawn();
    else if (hero.dead && hero.deadTime > RESPAWN_DELAY && !this.over) this.respawn();
    this.tick++;
  }

  /** Damage whatever a projectile or burst touches on the other team. */
  strike(source, area, struck) {
    if (source.team === 'hero') {
      for (const enemy of this.enemies) {
        if (enemy.dead || struck.has(enemy) || !overlap(area, enemy.bodyRect())) continue;
        struck.add(enemy);
        this.hurtEnemy(enemy, source.damage, source, source.effect ?? {});
        if (!source.pierce) break;
      }
    } else if (!this.hero.dead && !struck.has(this.hero) && overlap(area, this.hero.bodyRect())) {
      struck.add(this.hero);
      this.hurtHero(source.damage, source, source.effect ?? {});
    }
  }

  hurtEnemy(enemy, amount, source, effect = {}) {
    const from = source.body?.x ?? source.x ?? enemy.body.x;
    const direction = enemy.body.x >= from ? 1 : -1;
    const dealt = enemy.takeHit(amount, direction, effect ?? {});
    if (!dealt) return;
    this.events.push({ type: 'damage', team: 'enemy', x: enemy.body.x, y: enemy.body.y - enemy.body.h, amount: dealt });
    if (enemy.dead) {
      this.hero.score += enemy.g.stats.score ?? 0;
      this.events.push({ type: 'kill', id: enemy.entity.id, x: enemy.body.x, y: enemy.body.y });
    }
  }

  hurtHero(amount, source, effect = {}, knockback = 220) {
    const hero = this.hero;
    const from = source.body?.x ?? source.x ?? hero.body.x;
    const direction = hero.body.x >= from ? 1 : -1;
    const dealt = hero.takeHit(amount, direction, effect ?? {}, knockback);
    if (!dealt) return;
    this.events.push({ type: 'damage', team: 'hero', x: hero.body.x, y: hero.body.y - hero.body.h, amount: dealt });
    if (hero.dead) this.events.push({ type: 'heroDied' });
  }

  respawn() {
    const hero = this.hero;
    hero.lives = Math.max(0, hero.lives - 1);
    if (hero.lives <= 0) {
      this.over = true;
      if (!hero.dead) { hero.dead = true; hero.hp = 0; hero.action = { slot: 'death', t: 0, frame: -1 }; }
      this.events.push({ type: 'gameOver' });
      return;
    }
    hero.revive(this.checkpoint.x, this.checkpoint.y);
    this.projectiles = this.projectiles.filter(p => p.team === 'hero');
    this.events.push({ type: 'respawn' });
  }
}
