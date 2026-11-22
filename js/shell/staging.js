// Staging room: a flat floor where the chosen hero can be moved around.
//
// This is a stand-in until the real simulation (collision, enemies, combat)
// is built. It exists so that input, key bindings, animation selection, the
// camera, zoom and the HUD can all be exercised now. Attacks play their
// animation and spend MP but hit nothing.

import { sampleClip, clipLength, locomotion } from '../assets/animation.js';

const LAND_MS = 90;

export class StagingRoom {
  /**
   * @param {import('../render/stage.js').Stage} stage
   * @param {import('../input.js').Input} input
   * @param {object} config   site configuration
   * @param {object} hero     sheet entity with its `gameplay` catalog entry
   * @param {object} tileset
   */
  constructor(stage, input, config, hero, tileset) {
    this.stage = stage; this.input = input; this.config = config; this.hero = hero;
    this.g = hero.gameplay;
    this.room = stage.buildFlatRoom(tileset);
    this.view = stage.addActor(hero);
    this.gravity = config.physics?.gravity ?? 2400;
    this.maxFall = config.physics?.maxFallSpeed ?? 1400;
    this.moves = locomotion(hero.animations, config.physics?.runSpeedMultiplier ?? 1.75);
    this.s = {
      x: 96 * 4, y: 0, vx: 0, vy: 0, facing: 1,
      grounded: true, crouching: false, flying: false, running: false,
      action: null,           // {slot, t} while an attack or teleport plays
      teleport: null,         // 'out' | 'in'
      landed: 0,              // ms left of the landing pose
      anim: 'idle', animT: 0,
      hp: this.g.stats.hp, mp: this.g.stats.mp,
      lives: config.rules?.lives ?? 9999, score: 0,
    };
  }

  startAction(slot) { this.s.action = { slot, t: 0 }; }

  tryAbility(slot) {
    const s = this.s, ability = this.g.abilities[slot];
    if (!ability || s.action || s.crouching) return;
    if (!s.grounded && !ability.air) return;            // melee and ground effects need the ground
    if (s.mp < ability.mp) return;
    s.mp -= ability.mp;
    this.startAction(slot);
  }

  update(dt) {
    const s = this.s, g = this.g, input = this.input, move = g.movement;
    const dir = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
    const vertical = (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0);
    s.running = input.held('run');

    // One-shot actions: attacks and the two halves of a teleport.
    if (s.action) {
      s.action.t += dt * 1000;
      if (s.action.t >= clipLength(this.hero.animations[s.action.slot])) {
        if (s.teleport === 'out') {
          const reach = g.teleport.distance * s.facing;
          s.x = Math.max(48, Math.min(this.room.width - 48, s.x + reach));
          s.teleport = 'in';
          this.startAction('teleport_in');
        } else {
          s.teleport = null;
          s.action = null;
        }
      }
    }
    const busy = Boolean(s.action);
    const rooted = busy && (s.grounded || s.teleport);

    if (!busy) {
      if (input.pressed('attack1')) this.tryAbility('attack1');
      else if (input.pressed('attack2')) this.tryAbility('attack2');
      else if (input.pressed('attack3')) this.tryAbility('attack3');
      else if (input.pressed('teleport') && !s.crouching && s.mp >= g.teleport.mp) {
        s.mp -= g.teleport.mp;
        s.teleport = 'out';
        s.vx = s.vy = 0;
        this.startAction('teleport_out');
      }
    }

    // Flight: on/off with the fly key, according to the hero's flight mode.
    const flight = g.flight ?? { mode: 'none' };
    if (input.pressed('fly') && !s.teleport) {
      if (s.flying) s.flying = false;
      else if (flight.mode === 'free' || (flight.mode === 'mp' && s.mp > 1)) {
        s.flying = true; s.grounded = false; s.crouching = false; s.vy = 0; s.flyT = 0;
        if (s.y > -8) s.y = -8;
      }
    }
    if (s.flying && flight.mode === 'mp') {
      s.mp -= flight.mpPerSecond * dt;
      if (s.mp <= 0) { s.mp = 0; s.flying = false; }
    }
    if (!s.flying) {
      const regen = (g.stats.mpRegen ?? 0) * (this.config.difficulty?.mpRegen ?? 1);
      s.mp = Math.min(g.stats.mp, s.mp + regen * dt);
    }

    if (dir && !rooted) s.facing = dir;

    if (s.flying) {
      s.flyT += dt * 1000;
      s.vx = rooted ? 0 : dir * flight.speed;
      s.vy = rooted ? 0 : vertical * flight.speed;
    } else {
      s.crouching = s.grounded && input.held('down') && !busy;
      const speed = s.crouching ? move.crawlSpeed : s.running ? move.runSpeed : move.walkSpeed;
      const target = rooted ? 0 : dir * speed;
      const accel = (s.grounded ? 2400 : 2400 * move.airControl) * dt;
      s.vx += Math.max(-accel, Math.min(accel, target - s.vx));
      if (input.pressed('jump') && s.grounded && !s.crouching && !busy) {
        s.vy = -Math.sqrt(2 * this.gravity * move.jumpHeight);
        s.grounded = false;
      }
      if (!s.grounded) {
        // Releasing jump early cuts the rise short.
        if (s.vy < 0 && !input.held('jump')) s.vy += this.gravity * 1.5 * dt;
        s.vy = Math.min(this.maxFall, s.vy + this.gravity * dt);
      }
    }
    if (s.teleport) s.vx = s.vy = 0;

    s.x = Math.max(48, Math.min(this.room.width - 48, s.x + s.vx * dt));
    s.y += s.vy * dt;
    if (s.y >= 0) {
      if (!s.grounded && !s.flying) s.landed = LAND_MS;
      s.y = 0; s.vy = 0; s.grounded = true;
      if (s.flying && vertical > 0) s.flying = false;     // flying down onto the floor lands
    } else {
      s.grounded = false;
    }
    s.y = Math.max(-96 * 7, s.y);
    s.landed = Math.max(0, s.landed - dt * 1000);

    this.draw(dt, dir);
    this.stage.follow(s.x, 0);
  }

  /** Choose the animation and frame for the current state. */
  draw(dt, dir) {
    const s = this.s, clips = this.hero.animations;
    let slot, frame = null, rate = 1;
    if (s.action) {
      slot = s.action.slot;
      frame = sampleClip(clips[slot], s.action.t).frame;
    } else if (s.flying) {
      if (s.flyT < clipLength(clips.fly_up)) { slot = 'fly_up'; frame = sampleClip(clips.fly_up, s.flyT).frame; }
      else if (dir) slot = 'fly';
      else { slot = 'fly_up'; frame = clips.fly_up.durations.length - 1; }
    } else if (!s.grounded) {
      slot = 'jump';
      frame = s.vy < -140 ? 2 : s.vy < 140 ? 3 : 4;         // rising, apex, falling
    } else if (s.landed > 0) {
      slot = 'jump'; frame = 5;
    } else if (s.crouching) {
      if (Math.abs(s.vx) > 5) slot = 'crawl';
      else { slot = 'crouch'; frame = clips.crouch.durations.length - 1; }
    } else if (Math.abs(s.vx) > 8) {
      const gait = s.running ? this.moves.run : this.moves.walk;
      slot = gait.slot; rate = gait.rate;
    } else {
      slot = 'idle';
    }
    if (slot !== s.anim) { s.anim = slot; s.animT = 0; }
    s.animT += dt * 1000 * rate;
    if (frame === null) frame = sampleClip(clips[slot], s.animT).frame;
    this.view.show(slot, frame, s.x, s.y, s.facing);
  }
}
