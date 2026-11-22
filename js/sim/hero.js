// The playable hero: movement rules, abilities and animation choice.
// Pure simulation — it reads intents and a level, and changes its own state.
//
// Intents (from a keyboard, an AI or the network) are:
//   { dir: -1|0|1, vertical: -1|0|1, run, jumpHeld, jumpPressed, down,
//     attack1, attack2, attack3, teleport, fly }      (the last six are presses)

import { Actor, overlap } from './actor.js';
import { moveBody, isFree } from './physics.js';
import { Projectile } from './projectile.js';
import { sampleClip, clipLength, eventsOnFrame, locomotion } from '../assets/animation.js';

const COYOTE = 0.1;            // seconds after leaving a ledge when a jump still works
const JUMP_BUFFER = 0.1;       // seconds a jump press is remembered before landing
const LAND_POSE = 0.09;        // seconds the landing frame shows
const DROP_TIME = 0.22;        // seconds platforms are ignored after dropping through
const GROUND_ACCEL = 2400;     // px/s²
const HIT_EVENTS = new Set(['melee', 'area']);

const NOTHING = Object.freeze({ dir: 0, vertical: 0, run: false, jumpHeld: false, jumpPressed: false, down: false,
  attack1: false, attack2: false, attack3: false, teleport: false, fly: false });

export class Hero extends Actor {
  /**
   * @param {object} entity  sheet entity (animations) with its `gameplay` catalog entry
   * @param {object} config  site configuration (physics, rules, difficulty)
   */
  constructor(entity, config) {
    super(entity, config);
    this.team = 'hero';
    this.gravity = config.physics?.gravity ?? 2400;
    this.maxFall = config.physics?.maxFallSpeed ?? 1400;
    this.moves = locomotion(entity.animations, config.physics?.runSpeedMultiplier ?? 1.75);
    this.standH = this.body.h;
    this.crouchH = this.g.crouchBody?.h ?? Math.round(this.body.h * 0.6);
    this.mp = this.g.stats.mp;
    this.lives = config.rules?.lives ?? 9999;
    this.score = 0;
    this.crouching = false; this.flying = false; this.running = false;
    this.action = null;          // {slot, t, frame, struck} while an attack, teleport, hit or death plays
    this.teleporting = null;     // 'out' | 'in'
    this.coyote = 0; this.jumpBuffer = 0; this.landPose = 0; this.flyTime = 0;
    this.visualLift = 0;         // smooths stair steps on screen; decays to 0
    this.deadTime = 0;
    this.buff = { damage: 1, time: 0 };
    this.events = [];
  }

  placeAt(x, y) {
    Object.assign(this.body, { x, y, vx: 0, vy: 0, grounded: false, groundKind: null, h: this.standH });
    this.prev = { x, y, lift: 0 };
    this.crouching = this.flying = false;
    this.action = this.teleporting = null;
    this.visualLift = 0;
  }

  /** Back to full health at a position, after losing a life. */
  revive(x, y) {
    this.dead = false; this.deadTime = 0;
    this.hp = this.maxHp;
    this.mp = this.g.stats.mp;
    this.stun = 0; this.slow.time = 0; this.weak.time = 0;
    this.invulnerable = 1.5;
    this.placeAt(x, y);
  }

  /**
   * Be hit. direction is -1 or 1, the way the blow pushes.
   * @returns {number} damage actually dealt (0 while invulnerable)
   */
  takeHit(amount, direction, effect = {}, knockback = 220) {
    const dealt = this.loseHealth(amount);
    if (!dealt) return 0;
    this.applyEffect(effect);
    const b = this.body;
    this.flying = false; this.teleporting = null;
    b.vx = direction * (effect.knockback ?? knockback);
    b.vy = -260; b.grounded = false;
    if (this.hp <= 0) {
      this.dead = true; this.deadTime = 0;
      this.action = { slot: 'death', t: 0, frame: -1 };
    } else {
      this.invulnerable = this.g.stats.invulnerableAfterHit ?? 0.8;
      this.action = { slot: 'hit', t: 0, frame: -1 };
    }
    return dealt;
  }

  tryAbility(slot) {
    const ability = this.g.abilities[slot];
    if (!ability || this.action || this.crouching) return;
    if (!this.body.grounded && !ability.air) return;      // melee and ground effects need the ground
    if (this.mp < ability.mp) return;
    this.mp -= ability.mp;
    this.action = { slot, t: 0, frame: -1, ability, struck: new Set() };
    this.events.push({ type: 'ability', slot });
  }

  /** Things that happen on entering a frame of an ability's animation. */
  onFrame(world, clip, frame) {
    const ability = this.action.ability, b = this.body;
    if (!ability) return;
    const power = (this.config.difficulty?.playerDamage ?? 1) * (this.buff.time > 0 ? this.buff.damage : 1);
    for (const e of clip.events ?? []) {
      if (e.frame !== frame + 1) continue;
      if (e.type === 'spawn' && ability.projectile) {
        const p = ability.projectile;
        world.projectiles.push(new Projectile({ team: 'hero', owner: this,
          x: b.x + this.facing * (b.w / 2 + 8), y: b.y - b.h * 0.58,
          vx: this.facing * p.speed, vy: p.gravity ? -p.gravity * 0.18 : 0, gravity: p.gravity ?? 0,
          range: p.range, damage: ability.damage * power, effect: ability.effect, pierce: Boolean(p.pierce),
          color: this.g.color ?? '#ffffff' }));
      } else if (e.type === 'heal' && ability.type === 'heal') {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + ability.amount);
        this.events.push({ type: 'heal', x: b.x, y: b.y - b.h, amount: this.hp - before });
      } else if (e.type === 'cast' && ability.type === 'target') {
        // The nearest living enemy in range, preferring those in front.
        let best = null, bestScore = Infinity;
        for (const enemy of world.enemies) {
          if (enemy.dead) continue;
          const dx = enemy.body.x - b.x, distance = Math.hypot(dx, enemy.body.y - b.y);
          if (distance > ability.range) continue;
          const score = distance + (Math.sign(dx) === this.facing ? 0 : 400);
          if (score < bestScore) { best = enemy; bestScore = score; }
        }
        if (best) {
          best.applyEffect(ability.effect);
          if (ability.damage) world.hurtEnemy(best, ability.damage * power, this, {});
          this.events.push({ type: 'hex', x: best.body.x, y: best.body.y - best.body.h });
        }
      }
    }
  }

  /** Advance one fixed step. */
  update(intents, world, dt) {
    const b = this.body, g = this.g, move = g.movement, level = world.level;
    this.prev = { x: b.x, y: b.y, lift: this.visualLift };
    this.tickStatus(dt);
    this.buff.time = Math.max(0, this.buff.time - dt);
    if (this.dead) { this.deadTime += dt; intents = NOTHING; }
    else if (this.stun > 0) intents = NOTHING;
    this.running = intents.run;

    // One-shot actions: attacks, the two halves of a teleport, being hit, dying.
    if (this.action) {
      const a = this.action, clip = this.entity.animations[a.slot];
      a.t += dt * 1000;
      const now = sampleClip(clip, a.t).frame;
      while (a.frame < now) { a.frame++; this.onFrame(world, clip, a.frame); }
      // Melee and close-range effects hurt each enemy once while their frames show.
      if (a.ability?.box && eventsOnFrame(clip, now).some(e => HIT_EVENTS.has(e.type))) {
        const area = this.boxRect(a.ability.box);
        const power = (this.config.difficulty?.playerDamage ?? 1) * (this.buff.time > 0 ? this.buff.damage : 1);
        for (const enemy of world.enemies) {
          if (enemy.dead || a.struck.has(enemy) || !overlap(area, enemy.bodyRect())) continue;
          a.struck.add(enemy);
          world.hurtEnemy(enemy, a.ability.damage * power, this, a.ability.effect);
        }
      }
      if (this.dead) { /* the death pose holds until the world revives the hero */ }
      else if (this.action.t >= clipLength(clip)) {
        if (this.teleporting === 'out') {
          // Go as far as there is room for, up to the full distance.
          for (let d = g.teleport.distance; d >= 0; d -= 8) {
            const x = b.x + d * this.facing;
            if (x > b.w && x < level.width - b.w && isFree(level, x, b.y, b.w, b.h)) { b.x = x; break; }
          }
          this.prev = { x: b.x, y: b.y, lift: this.visualLift };
          this.teleporting = 'in';
          this.action = { slot: 'teleport_in', t: 0, frame: -1 };
        } else {
          this.teleporting = null;
          this.action = null;
        }
      }
    }
    const busy = Boolean(this.action);
    const rooted = busy && (b.grounded || this.teleporting) && this.action.slot !== 'hit';

    if (!busy) {
      if (intents.attack1) this.tryAbility('attack1');
      else if (intents.attack2) this.tryAbility('attack2');
      else if (intents.attack3) this.tryAbility('attack3');
      else if (intents.teleport && !this.crouching && this.mp >= g.teleport.mp) {
        this.mp -= g.teleport.mp;
        this.teleporting = 'out';
        this.action = { slot: 'teleport_out', t: 0, frame: -1 };
      }
    }

    // Flight, by the hero's flight mode: none, mp (drains) or free.
    const flight = g.flight ?? { mode: 'none' };
    if (intents.fly && !this.teleporting) {
      if (this.flying) this.flying = false;
      else if (flight.mode === 'free' || (flight.mode === 'mp' && this.mp > 1)) {
        this.flying = true; this.flyTime = 0; b.vy = 0;
        this.standUp(level);
      }
    }
    if (this.flying && flight.mode === 'mp') {
      this.mp -= flight.mpPerSecond * dt;
      if (this.mp <= 0) { this.mp = 0; this.flying = false; }
    }
    if (!this.flying) {
      const regen = (g.stats.mpRegen ?? 0) * (this.config.difficulty?.mpRegen ?? 1);
      this.mp = Math.min(g.stats.mp, this.mp + regen * dt);
    }

    if (intents.dir && !rooted) this.facing = intents.dir;

    this.coyote = b.grounded ? COYOTE : Math.max(0, this.coyote - dt);
    this.jumpBuffer = intents.jumpPressed ? JUMP_BUFFER : Math.max(0, this.jumpBuffer - dt);

    if (this.teleporting) {
      b.vx = 0; b.vy = 0;
    } else if (this.flying) {
      this.flyTime += dt * 1000;
      b.vx = rooted ? 0 : intents.dir * flight.speed;
      b.vy = rooted ? 0 : intents.vertical * flight.speed;
    } else {
      // Crouch while down is held on the ground; stay crouched under a low ceiling.
      const wantCrouch = b.grounded && intents.down && !busy;
      if (wantCrouch && !this.crouching) { this.crouching = true; b.h = this.crouchH; }
      else if (!wantCrouch && this.crouching) this.standUp(level);

      const speed = (this.crouching ? move.crawlSpeed : this.running ? move.runSpeed : move.walkSpeed) * this.speedFactor;
      const target = rooted ? 0 : intents.dir * speed;
      // Reeling from a hit: the knock-back carries for a moment before control returns.
      const reeling = this.action?.slot === 'hit' && this.action.t < 180;
      const accel = GROUND_ACCEL * (reeling ? 0.15 : b.grounded ? 1 : move.airControl) * dt;
      b.vx += Math.max(-accel, Math.min(accel, target - b.vx));

      if (this.jumpBuffer > 0 && !busy) {
        if (this.crouching && b.groundKind === 'platform') {
          b.dropTimer = DROP_TIME;                        // down + jump drops through a platform
          b.grounded = false; b.y += 1;
          this.jumpBuffer = this.coyote = 0;
          this.standUp(level);
        } else if (this.coyote > 0 && !this.crouching) {
          b.vy = -Math.sqrt(2 * this.gravity * move.jumpHeight);
          b.grounded = false;
          this.jumpBuffer = this.coyote = 0;
          this.events.push({ type: 'jump' });
        }
      }
      // Releasing jump early cuts the rise short.
      if (b.vy < 0 && !intents.jumpHeld) b.vy += this.gravity * 1.5 * dt;
      b.vy = Math.min(this.maxFall, b.vy + this.gravity * dt);
    }

    const moved = moveBody(level, b, dt);
    if (moved.landed) {
      if (this.flying) { if (intents.vertical > 0) this.flying = false; }
      else { this.landPose = LAND_POSE; this.events.push({ type: 'land' }); }
    }
    this.landPose = Math.max(0, this.landPose - dt);
    // Stair steps move the feet instantly; the picture catches up over a few frames.
    // Steps rise 16 px over 16 px, so catching up at walking pace turns the
    // staircase into one even ramp instead of a series of hops and pauses.
    this.visualLift -= moved.stepDy;
    const settle = Math.max(Math.abs(b.vx) * 1.05, 120) * dt;
    this.visualLift = Math.abs(this.visualLift) <= settle ? 0 : this.visualLift - Math.sign(this.visualLift) * settle;

    this.choosePose(intents, dt);
  }

  /** Stand up if there is headroom; otherwise stay crouched. */
  standUp(level) {
    if (!this.crouching) return;
    const b = this.body;
    if (isFree(level, b.x, b.y, b.w, this.standH)) { this.crouching = false; b.h = this.standH; }
  }

  /** Pick the animation and frame that match the current state. */
  choosePose(intents, dt) {
    const b = this.body, clips = this.entity.animations;
    let slot, frame = null, rate = 1;
    if (this.stun > 0 && !this.dead) {
      slot = 'hit'; frame = Math.min(2, clips.hit.durations.length - 1);
    } else if (this.action) {
      slot = this.action.slot;
      frame = sampleClip(clips[slot], this.action.t).frame;
    } else if (this.flying) {
      if (this.flyTime < clipLength(clips.fly_up)) { slot = 'fly_up'; frame = sampleClip(clips.fly_up, this.flyTime).frame; }
      else if (intents.dir) slot = 'fly';
      else { slot = 'fly_up'; frame = clips.fly_up.durations.length - 1; }
    } else if (!b.grounded && this.coyote <= 0) {
      slot = 'jump';
      frame = b.vy < -140 ? 2 : b.vy < 140 ? 3 : 4;         // rising, apex, falling
    } else if (this.landPose > 0) {
      slot = 'jump'; frame = 5;
    } else if (this.crouching) {
      if (Math.abs(b.vx) > 5) slot = 'crawl';
      else { slot = 'crouch'; frame = clips.crouch.durations.length - 1; }
    } else if (Math.abs(b.vx) > 8) {
      const gait = this.running ? this.moves.run : this.moves.walk;
      slot = gait.slot; rate = gait.rate;
    } else {
      slot = 'idle';
    }
    if (slot !== this.anim) { this.anim = slot; this.animTime = 0; }
    this.animTime += dt * 1000 * rate;
    if (frame === null) frame = sampleClip(clips[slot], this.animTime).frame;
    this.pose = { slot, frame };
  }
}
