// The playable hero: movement rules, abilities and animation choice.
// Pure simulation — it reads intents and a level, and changes its own state.
//
// Intents (from a keyboard, an AI or the network) are:
//   { dir: -1|0|1, vertical: -1|0|1, run, jumpHeld, jumpPressed, down,
//     attack1, attack2, attack3, teleport, fly }      (the last six are presses)

import { moveBody, isFree } from './physics.js';
import { sampleClip, clipLength, locomotion } from '../assets/animation.js';

const COYOTE = 0.1;            // seconds after leaving a ledge when a jump still works
const JUMP_BUFFER = 0.1;       // seconds a jump press is remembered before landing
const LAND_POSE = 0.09;        // seconds the landing frame shows
const DROP_TIME = 0.22;        // seconds platforms are ignored after dropping through
const GROUND_ACCEL = 2400;     // px/s²

export class Hero {
  /**
   * @param {object} entity  sheet entity (animations) with its `gameplay` catalog entry
   * @param {object} config  site configuration (physics, rules, difficulty)
   */
  constructor(entity, config) {
    this.entity = entity;
    this.g = entity.gameplay;
    this.config = config;
    this.gravity = config.physics?.gravity ?? 2400;
    this.maxFall = config.physics?.maxFallSpeed ?? 1400;
    this.moves = locomotion(entity.animations, config.physics?.runSpeedMultiplier ?? 1.75);
    const body = this.g.body;
    this.standH = body.h;
    this.crouchH = this.g.crouchBody?.h ?? Math.round(body.h * 0.6);
    // The simulation centres the actor on its body box; the art is shifted to match.
    this.artShift = -(body.x + body.w / 2);
    this.body = { x: 0, y: 0, vx: 0, vy: 0, w: body.w, h: body.h, grounded: false, groundKind: null, dropTimer: 0 };
    this.facing = 1;
    this.hp = this.g.stats.hp;
    this.mp = this.g.stats.mp;
    this.lives = config.rules?.lives ?? 9999;
    this.score = 0;
    this.crouching = false; this.flying = false; this.running = false;
    this.action = null;          // {slot, t} while an attack or teleport animation plays
    this.teleporting = null;     // 'out' | 'in'
    this.coyote = 0; this.jumpBuffer = 0; this.landPose = 0; this.flyTime = 0;
    this.visualLift = 0;         // smooths stair steps on screen; decays to 0
    this.anim = 'idle'; this.animTime = 0;
    this.pose = { slot: 'idle', frame: 0 };
    this.prev = { x: 0, y: 0, lift: 0 };
    this.events = [];
  }

  placeAt(x, y) {
    Object.assign(this.body, { x, y, vx: 0, vy: 0, grounded: false, groundKind: null, h: this.standH });
    this.prev = { x, y, lift: 0 };
    this.crouching = this.flying = false;
    this.action = this.teleporting = null;
    this.visualLift = 0;
  }

  tryAbility(slot) {
    const ability = this.g.abilities[slot];
    if (!ability || this.action || this.crouching) return;
    if (!this.body.grounded && !ability.air) return;      // melee and ground effects need the ground
    if (this.mp < ability.mp) return;
    this.mp -= ability.mp;
    this.action = { slot, t: 0 };
    this.events.push({ type: 'ability', slot });
  }

  /** Advance one fixed step. */
  update(intents, level, dt) {
    const b = this.body, g = this.g, move = g.movement;
    this.prev = { x: b.x, y: b.y, lift: this.visualLift };
    this.running = intents.run;

    // One-shot actions: attacks and the two halves of a teleport.
    if (this.action) {
      this.action.t += dt * 1000;
      if (this.action.t >= clipLength(this.entity.animations[this.action.slot])) {
        if (this.teleporting === 'out') {
          // Go as far as there is room for, up to the full distance.
          for (let d = g.teleport.distance; d >= 0; d -= 8) {
            const x = b.x + d * this.facing;
            if (x > b.w && x < level.width - b.w && isFree(level, x, b.y, b.w, b.h)) { b.x = x; break; }
          }
          this.prev = { x: b.x, y: b.y, lift: this.visualLift };
          this.teleporting = 'in';
          this.action = { slot: 'teleport_in', t: 0 };
        } else {
          this.teleporting = null;
          this.action = null;
        }
      }
    }
    const busy = Boolean(this.action);
    const rooted = busy && (b.grounded || this.teleporting);

    if (!busy) {
      if (intents.attack1) this.tryAbility('attack1');
      else if (intents.attack2) this.tryAbility('attack2');
      else if (intents.attack3) this.tryAbility('attack3');
      else if (intents.teleport && !this.crouching && this.mp >= g.teleport.mp) {
        this.mp -= g.teleport.mp;
        this.teleporting = 'out';
        this.action = { slot: 'teleport_out', t: 0 };
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

      const speed = this.crouching ? move.crawlSpeed : this.running ? move.runSpeed : move.walkSpeed;
      const target = rooted ? 0 : intents.dir * speed;
      const accel = GROUND_ACCEL * (b.grounded ? 1 : move.airControl) * dt;
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
    if (this.action) {
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
