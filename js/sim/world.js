// The simulation: one level, the actors in it, advanced in fixed steps.
// Nothing here draws or reads the keyboard.

import { Hero } from './hero.js';

export const NO_INTENTS = Object.freeze({
  dir: 0, vertical: 0, run: false, jumpHeld: false, jumpPressed: false, down: false,
  attack1: false, attack2: false, attack3: false, teleport: false, fly: false,
});

export class World {
  /**
   * @param {import('../level/level.js').Level} level
   * @param {object} heroEntity  sheet entity with `gameplay`
   * @param {object} config      site configuration
   */
  constructor(level, heroEntity, config) {
    this.level = level;
    this.config = config;
    this.step = 1 / (config.physics?.tickRate ?? 60);
    this.accumulator = 0;
    this.tick = 0;
    this.hero = new Hero(heroEntity, config);
    this.checkpoint = { ...level.spawn };
    this.hero.placeAt(this.checkpoint.x, this.checkpoint.y);
    this.events = [];
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
    const hero = this.hero;
    hero.update(intents, this.level, this.step);
    this.events.push(...hero.events.splice(0));
    // Falling out of the bottom of the level costs a life.
    if (hero.body.y - hero.body.h > this.level.height + 200) this.respawn();
    this.tick++;
  }

  respawn() {
    const hero = this.hero;
    hero.lives = Math.max(0, hero.lives - 1);
    hero.hp = hero.g.stats.hp;
    hero.placeAt(this.checkpoint.x, this.checkpoint.y);
    this.events.push({ type: 'respawn' });
  }
}
