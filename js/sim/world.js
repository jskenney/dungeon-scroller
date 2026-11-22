// The simulation: one level, the hero, enemies and projectiles, advanced in
// fixed steps. Nothing here draws or reads the keyboard.

import { Hero } from './hero.js';
import { Enemy } from './enemy.js';
import { Boss } from './boss.js';
import { WorldObject } from './object.js';
import { overlap } from './actor.js';
import { makeRng } from '../level/random.js';
import { TILE } from '../level/level.js';

export const NO_INTENTS = Object.freeze({
  dir: 0, vertical: 0, run: false, jumpHeld: false, jumpPressed: false, down: false,
  attack1: false, attack2: false, attack3: false, teleport: false, fly: false, interact: false,
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
    this.entities = entities;
    /** @type {WorldObject[]} */
    this.objects = [];
    /** Gates: solid until opened by a lever or a key. {id, rect, open, locked, col, row, height} */
    this.gates = [];
    this.prompt = null;            // the object the interact key would use right now
    this.complete = false;         // true once the goal has been reached
    this.deaths = 0;
    for (const placed of level.doc.entities ?? []) {
      const x = (placed.col + 0.5) * TILE, y = (placed.row + 1) * TILE;
      if (placed.type === 'enemy') {
        const entity = entities[`enemy/${placed.id}`];
        if (entity?.gameplay) this.enemies.push(new Enemy(entity, config, x, y));
      } else if (placed.type === 'boss') {
        const entity = entities[`boss/${placed.id}`];
        if (entity?.gameplay) this.enemies.push(new Boss(entity, config, x, y));
      } else if (placed.type === 'object') {
        this.addObject(placed.id, x, y, placed);
      } else if (placed.type === 'gate') {
        const height = placed.height ?? 2;
        const rect = { l: placed.col * TILE + 32, t: placed.row * TILE, r: (placed.col + 1) * TILE - 32, b: (placed.row + height) * TILE, kind: 'solid' };
        this.gates.push({ id: placed.id, rect, open: false, locked: Boolean(placed.locked), col: placed.col, row: placed.row, height });
        level.dynamic.push(rect);
      }
    }
  }

  /** The living boss, if the level has one. */
  get boss() { return this.enemies.find(e => e.boss && !e.dead) ?? null; }

  /**
   * The boss arena: entering it wakes the boss and shuts the way back;
   * it opens again when the boss falls or the hero has to start over.
   */
  updateArena() {
    const region = (this.level.doc.regions ?? []).find(r => r.type === 'boss_arena');
    const boss = this.boss;
    if (!region) { if (boss) boss.awake = true; return; }
    this.arena ??= { left: region.col * TILE, right: (region.col + region.cols) * TILE, locked: false, wall: null };
    const arena = this.arena, hero = this.hero;
    if (!arena.locked && boss && !hero.dead && hero.body.x > arena.left + 72 && hero.body.x < arena.right) {
      arena.locked = true;
      arena.wall = { l: arena.left - 24, t: -2000, r: arena.left, b: this.level.height + 400, kind: 'solid' };
      this.level.dynamic.push(arena.wall);
      boss.awake = true;
      this.events.push({ type: 'bossFight', actor: boss, id: boss.entity.id });
    } else if (arena.locked && !boss) {
      this.openArena();
      this.events.push({ type: 'bossDefeated' });
    }
  }

  openArena() {
    const arena = this.arena;
    if (!arena?.locked) return;
    arena.locked = false;
    this.unblock(arena.wall);
    arena.wall = null;
  }

  /** Seconds played. */
  get time() { return this.tick * this.step; }

  addObject(id, x, y, placed = {}) {
    const entity = this.entities[`object/${id}`];
    if (!entity?.gameplay) return null;
    const object = new WorldObject(entity, x, y, placed);
    if (object.g.solid) {
      object.solid = { ...object.rect(), kind: 'solid' };
      this.level.dynamic.push(object.solid);
    }
    this.objects.push(object);
    return object;
  }

  /** Stop an object or gate from blocking movement. */
  unblock(rect) {
    const i = this.level.dynamic.indexOf(rect);
    if (i >= 0) this.level.dynamic.splice(i, 1);
  }

  openGate(gate) {
    if (gate.open) return;
    gate.open = true;
    this.unblock(gate.rect);
    this.events.push({ type: 'gateOpened', x: (gate.rect.l + gate.rect.r) / 2, y: gate.rect.t });
  }

  /** Drop loot at a spot: [{object, chance, count}] with count a number or [min, max]. */
  dropLoot(loot, x, y) {
    const more = this.config.difficulty?.loot ?? 1;
    let n = 0;
    for (const item of loot ?? []) {
      if (this.random() > (item.chance ?? 1) * more) continue;
      const [min, max] = Array.isArray(item.count) ? item.count : [item.count ?? 1, item.count ?? 1];
      const count = min + Math.floor(this.random() * (max - min + 1));
      for (let i = 0; i < count; i++) {
        this.addObject(item.object, x + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 18, y, { wait: 0.35 });
        n++;
      }
    }
  }

  /** Give the hero what a pickup, flag or shrine offers. */
  give(gives = {}, at) {
    const hero = this.hero;
    if (gives.hp) hero.hp = Math.min(hero.maxHp, hero.hp + gives.hp);
    if (gives.hpFraction) hero.hp = Math.min(hero.maxHp, Math.max(hero.hp, hero.maxHp * gives.hpFraction));
    if (gives.mp) hero.mp = Math.min(hero.g.stats.mp, hero.mp + gives.mp);
    if (gives.mpFraction) hero.mp = Math.min(hero.g.stats.mp, Math.max(hero.mp, hero.g.stats.mp * gives.mpFraction));
    if (gives.score) hero.score += gives.score;
    if (gives.keys) hero.keys += gives.keys;
    // A boost: one fixed, or one chosen by chance from a list.
    let boost = gives.boost ?? null;
    if (gives.boostOneOf?.length) boost = gives.boostOneOf[Math.floor(this.random() * gives.boostOneOf.length)];
    if (gives.buff) boost = { stat: 'damage', factor: gives.buff.damage ?? 1, duration: gives.buff.duration };   // older spelling
    if (boost) hero.addBoost(boost);
    this.events.push({ type: 'gave', gives, boost, x: at.x, y: at.rect().t });
  }

  /** Start using an object: pick it up, open it, pull it, light it. */
  useObject(object) {
    const hero = this.hero, kind = object.g.behaviour;
    if (kind === 'container' && object.locked) {
      if (hero.keys < 1) { this.events.push({ type: 'locked', x: object.x, y: object.rect().t }); return; }
      hero.keys--; object.locked = false;
    }
    object.begin();
    this.events.push({ type: 'used', behaviour: kind, id: object.entity.id, x: object.x, y: object.y });
    if (kind === 'pickup') this.give(object.g.gives, object);
    else if (kind === 'checkpoint') {
      this.checkpoint = { x: object.x, y: object.y };
      this.give(object.g.gives, object);
      this.events.push({ type: 'checkpoint', x: object.x, y: object.rect().t });
    } else if (kind === 'shrine') {
      this.give(object.g.gives, object);
      object.cooldown = object.g.cooldown ?? 30;
    } else if (kind === 'goal') {
      this.give(object.g.gives, object);
      this.complete = true;
      this.events.push({ type: 'levelComplete' });
    } else if (kind === 'breakable' && object.solid) {
      this.unblock(object.solid);
      object.solid = null;
    }
  }

  /** Called by an object when its use animation ends. */
  objectFinished(object) {
    const kind = object.g.behaviour;
    if (kind === 'container' || kind === 'breakable') this.dropLoot(object.loot, object.x, object.y);
    else if (kind === 'switch') for (const gate of this.gates) if (gate.id === object.link) this.openGate(gate);
  }

  /** Break anything breakable inside an attack's area. `struck` remembers what one attack already hit. */
  hitObjects(area, struck) {
    for (const object of this.objects) {
      if (!object.ready('attack') || struck.has(object) || !overlap(area, object.rect())) continue;
      struck.add(object);
      this.useObject(object);
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

    this.updateArena();
    for (const enemy of this.enemies) {
      if (Math.abs(enemy.body.x - hero.body.x) > WAKE_DISTANCE && !enemy.dead && !enemy.boss) continue;
      enemy.update(this, dt);
    }
    for (const p of this.projectiles) p.update(this, dt);

    // Objects: touch to take, the interact key to open or pull, a key to unlock a gate.
    this.prompt = null;
    if (!hero.dead) {
      const body = hero.bodyRect();
      for (const object of this.objects) {
        if (object.ready('touch') && overlap(body, object.rect())) this.useObject(object);
        else if (!this.prompt && object.ready('interact') && overlap(body, object.rect())) this.prompt = object;
      }
      if (intents.interact && this.prompt) this.useObject(this.prompt);
      for (const gate of this.gates) {
        if (gate.open || !gate.locked) continue;
        const near = { l: gate.rect.l - 10, t: gate.rect.t, r: gate.rect.r + 10, b: gate.rect.b };
        if (!overlap(body, near)) continue;
        if (hero.keys > 0) { hero.keys--; this.openGate(gate); }
        else if (this.tick % 60 === 0) this.events.push({ type: 'locked', x: (gate.rect.l + gate.rect.r) / 2, y: gate.rect.t + 40 });
      }
    }
    for (const object of this.objects) object.update(this, dt);
    // The relic appears once no boss is left.
    if (!this.enemies.some(e => e.boss && !e.dead)) for (const object of this.objects) object.hidden = false;

    // Touching an enemy hurts a little and pushes the hero away.
    if (this.config.rules?.touchDamage !== false && !hero.dead && hero.invulnerable <= 0) {
      const body = hero.bodyRect();
      for (const enemy of this.enemies) {
        if (enemy.dead || !overlap(body, enemy.bodyRect())) continue;
        if (enemy.boss && !enemy.awake) continue;
        const amount = (enemy.g.stats.touchDamage ?? 0) * enemy.touchScale * (this.config.difficulty?.touchDamage ?? 1);
        if (amount > 0) { this.hurtHero(amount, enemy, {}, this.config.rules?.touchKnockback ?? 220); break; }
      }
    }

    this.enemies = this.enemies.filter(e => !e.gone);
    this.objects = this.objects.filter(o => !o.gone);
    this.projectiles = this.projectiles.filter(p => !p.gone);

    // Falling out of the bottom of the level, or dying, costs a life.
    if (this.complete) { /* the level is won; nothing more can go wrong */ }
    else if (!hero.dead && hero.body.y - hero.body.h > this.level.height + 200) this.respawn();
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
      if (!struck.size || source.pierce) this.hitObjects(area, struck);
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
    this.events.push({ type: 'damage', team: 'enemy', actor: enemy, x: enemy.body.x, y: enemy.body.y - enemy.body.h, amount: dealt });
    if (enemy.dead) {
      this.hero.score += enemy.g.stats.score ?? 0;
      this.events.push({ type: 'kill', actor: enemy, id: enemy.entity.id, x: enemy.body.x, y: enemy.body.y });
      this.dropLoot(enemy.g.drops, enemy.body.x, enemy.body.y);
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
    this.deaths++;
    hero.lives = Math.max(0, hero.lives - 1);
    if (hero.lives <= 0) {
      this.over = true;
      if (!hero.dead) { hero.dead = true; hero.hp = 0; hero.action = { slot: 'death', t: 0, frame: -1 }; }
      this.events.push({ type: 'gameOver' });
      return;
    }
    hero.revive(this.checkpoint.x, this.checkpoint.y);
    // The boss fight starts again from the beginning.
    this.openArena();
    for (const enemy of this.enemies) if (enemy.boss && !enemy.dead) enemy.reset();
    this.projectiles = this.projectiles.filter(p => p.team === 'hero');
    this.events.push({ type: 'respawn' });
  }
}
