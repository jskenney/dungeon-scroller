// Enemies: movement, attacks and the four behaviours (walker, guard, pouncer,
// caster). An enemy senses its surroundings — floor ahead, walls, where the
// hero is and whether it can be seen — and acts on that.

import { Actor, overlap } from './actor.js';
import { moveBody } from './physics.js';
import { Projectile, Eruption } from './projectile.js';
import { sampleClip, clipLength, eventsOnFrame, locomotion } from '../assets/animation.js';

const HIT_EVENTS = new Set(['melee', 'impact']);
let nextId = 1;

export class Enemy extends Actor {
  constructor(entity, config, x, y) {
    super(entity, config);
    this.id = nextId++;
    this.team = 'enemy';
    this.ai = this.g.ai ?? { archetype: 'boss', sight: 1200, dropsOffLedges: false };
    this.hover = Boolean(this.ai.hover);
    this.maxHp = Math.max(1, Math.round(this.g.stats.hp * (config.difficulty?.enemyHealth ?? 1)));
    this.hp = this.maxHp;
    this.gravity = config.physics?.gravity ?? 2400;
    this.maxFall = config.physics?.maxFallSpeed ?? 1400;
    this.moves = locomotion(entity.animations, 1.4);
    this.body.x = x;
    this.body.y = y - this.bodyLift;
    this.home = { x, y: this.body.y };
    this.prev = { x, y: this.body.y, lift: 0 };
    this.facing = -1;
    this.state = 'patrol';
    this.action = null;                 // {slot, t, frame, struck} while attacking or reeling
    this.cooldown = {};                 // seconds until each attack can be used again
    this.rest = 0;                      // pause between attacks
    this.retreat = 0;                   // seconds left backing away
    this.alert = 0;                     // seconds the hero is remembered after being seen
    this.deadTime = 0;
    this.gone = false;
  }

  /** Speed-up applied to movement and cooldowns (bosses quicken as they weaken). */
  get tempo() { return 1; }
  /** Multiplier on touch damage right now. */
  get touchScale() { return 1; }
  /** The attacks this enemy may use at the moment: [slot, attack] pairs. */
  attackList() { return Object.entries(this.g.attacks); }
  /** How far away an attack that is not a melee swing can be used from. */
  reachOf(attack) { return attack.range ?? attack.projectile?.range ?? 0; }

  // ------------------------------------------------------------------ senses

  /** Is there floor just beyond the feet in this direction? */
  floorAhead(level, dir) {
    const b = this.body, x = b.x + dir * (b.w / 2 + 6);
    return level.rectsIn(x - 1, b.y + 1, x + 1, b.y + 20).length > 0 || level.slopesIn(x, b.y - 20, x, b.y + 20).length > 0;
  }

  /** Is the way to the hero clear of walls? */
  canSee(level, hero) {
    const b = this.body, h = hero.body;
    const dx = h.x - b.x, dy = h.y - b.y;
    if (Math.abs(dx) > this.ai.sight || Math.abs(dy) > 240) return false;
    const y0 = b.y - b.h * 0.7, y1 = h.y - h.h * 0.6, steps = Math.ceil(Math.abs(dx) / 40);
    for (let i = 1; i < steps; i++) {
      const x = b.x + dx * (i / steps), y = y0 + (y1 - y0) * (i / steps);
      if (level.rectsIn(x - 1, y - 1, x + 1, y + 1).some(r => r.kind === 'solid')) return false;
    }
    return true;
  }

  // ----------------------------------------------------------------- actions

  takeHit(amount, direction, effect = {}) {
    const dealt = this.loseHealth(amount);
    if (!dealt) return 0;
    this.applyEffect(effect);
    this.alert = 4;
    if (this.hp <= 0) {
      this.dead = true;
      this.action = { slot: 'death', t: 0, frame: -1 };
      this.body.vx = direction * 60;
      return dealt;
    }
    this.body.vx = direction * (effect.knockback ?? 110);
    if (!this.hover) { this.body.vy = -120; this.body.grounded = false; }
    this.action = { slot: 'hit', t: 0, frame: -1 };       // a hit interrupts whatever it was doing
    return dealt;
  }

  /** Attacks that are ready and would reach the hero from here. */
  usableAttacks(world, sees) {
    const hero = world.hero, b = this.body, dx = hero.body.x - b.x, reach = Math.abs(dx);
    const usable = [];
    for (const [slot, attack] of this.attackList()) {
      if ((this.cooldown[slot] ?? 0) > 0) continue;
      if (attack.leap) {
        if (b.grounded && sees && reach > 70 && reach < attack.leap.distance + 30) usable.push([attack.weight ?? 1, slot]);
      } else if (attack.type === 'melee') {
        const facing = this.facing;
        this.facing = dx >= 0 ? 1 : -1;
        if (overlap(this.boxRect(attack.box, 4), hero.bodyRect())) usable.push([attack.weight ?? 1, slot]);
        this.facing = facing;
      } else if (sees && reach < this.reachOf(attack)) {
        usable.push([attack.weight ?? 1, slot]);
      }
    }
    return usable;
  }

  startAttack(slot, hero) {
    this.facing = hero.body.x >= this.body.x ? 1 : -1;
    this.action = { slot, t: 0, frame: -1, struck: false, attack: this.g.attacks[slot] };
    this.state = 'attack';
  }

  /** Things that happen on entering a frame of an attack animation. */
  onFrame(world, clip, frame) {
    const a = this.action, attack = a.attack, hero = world.hero, b = this.body;
    if (!attack) return;
    const damage = attack.damage * (this.config.difficulty?.enemyDamage ?? 1);
    for (const e of clip.events ?? []) {
      if (e.frame !== frame + 1) continue;
      if (e.type === 'leap' && attack.leap) {
        const air = 2 * Math.sqrt(2 * attack.leap.height / this.gravity);
        b.vx = this.facing * attack.leap.distance / air;
        b.vy = -Math.sqrt(2 * this.gravity * attack.leap.height);
        b.grounded = false;
        a.leaping = true;
      } else if (e.type === 'spawn' && attack.type === 'projectile') {
        const p = attack.projectile, x = b.x + this.facing * (b.w / 2 + 6), y = b.y - b.h * 0.7;
        const aim = Math.atan2((hero.body.y - hero.body.h * 0.5) - y, hero.body.x - x);
        const count = p.count ?? 1;
        for (let i = 0; i < count; i++) {
          const angle = aim + ((i - (count - 1) / 2) * (p.spread ?? 0) * Math.PI) / 180;
          world.projectiles.push(new Projectile({ team: 'enemy', owner: this, x, y, vx: Math.cos(angle) * p.speed, vy: Math.sin(angle) * p.speed,
            range: p.range, damage, effect: attack.effect, color: this.g.color ?? '#7fe3c8' }));
        }
      } else if (e.type === 'spawn' && attack.type === 'eruption') {
        world.projectiles.push(new Eruption({ team: 'enemy', owner: this, x: hero.body.x, y: hero.body.y, radius: attack.radius, delay: attack.delay,
          damage, effect: attack.effect, color: this.g.color ?? '#7fe3c8' }));
      }
    }
  }

  // ------------------------------------------------------------------ update

  update(world, dt) {
    const b = this.body, level = world.level, hero = world.hero, clips = this.entity.animations;
    this.prev = { x: b.x, y: b.y, lift: 0 };
    this.tickStatus(dt);
    for (const slot of Object.keys(this.cooldown)) this.cooldown[slot] = Math.max(0, this.cooldown[slot] - dt);
    this.rest = Math.max(0, this.rest - dt);
    this.retreat = Math.max(0, this.retreat - dt);
    this.alert = Math.max(0, this.alert - dt);

    let wantX = 0;                       // desired horizontal speed
    let slot = 'idle', frame = null, rate = 1;

    if (this.dead) {
      this.deadTime += dt;
      this.action.t += dt * 1000;
      slot = 'death'; frame = sampleClip(clips.death, this.action.t).frame;
      if (this.deadTime > clipLength(clips.death) / 1000 + 1.2) this.gone = true;
      this.hover = false;                // a fallen caster drops to the floor
    } else if (this.stun > 0) {
      slot = 'hit'; frame = Math.min(2, clips.hit.durations.length - 1);
      this.action = null; this.state = 'chase';
    } else if (this.action) {
      const a = this.action, clip = clips[a.slot];
      a.t += dt * 1000;
      const now = sampleClip(clip, a.t).frame;
      while (a.frame < now) { a.frame++; this.onFrame(world, clip, a.frame); }
      slot = a.slot; frame = now;
      // A melee or landing frame hurts the hero once per attack.
      if (a.attack && !a.struck && eventsOnFrame(clip, now).some(e => HIT_EVENTS.has(e.type)) && a.attack.box
          && overlap(this.boxRect(a.attack.box), hero.bodyRect())) {
        a.struck = true;
        world.hurtHero(a.attack.damage * (this.config.difficulty?.enemyDamage ?? 1), this, a.attack.effect);
      }
      if (a.leaping && b.grounded && b.vy >= 0 && a.t > 120) a.leaping = false;
      if (a.t >= clipLength(clip)) {
        if (a.attack) {
          this.cooldown[a.slot] = (a.attack.cooldown ?? 1.5) / this.tempo;
          this.rest = 0.35;
          if (this.ai.retreatAfterAttack) this.retreat = this.ai.retreatAfterAttack;
        }
        this.action = null;
        this.state = 'chase';
      }
    } else {
      // ---- decide what to do
      const sees = !hero.dead && this.canSee(level, hero);
      if (sees && this.alert <= 0) world.events.push({ type: 'alert', actor: this, x: b.x, y: b.y });
      if (sees) this.alert = 3;
      const aware = !hero.dead && this.alert > 0;
      const dx = hero.body.x - b.x, toward = dx >= 0 ? 1 : -1, reach = Math.abs(dx);
      const speed = this.g.stats.speed * this.speedFactor * this.tempo;
      const usable = aware && this.rest <= 0 ? this.usableAttacks(world, sees) : [];
      if (usable.length) {
        let roll = world.random() * usable.reduce((s, u) => s + u[0], 0), chosen = usable[0][1];
        for (const [weight, name] of usable) { roll -= weight; if (roll < 0) { chosen = name; break; } }
        this.startAttack(chosen, hero);
        world.events.push({ type: 'enemyAttack', actor: this, slot: chosen, kind: this.g.attacks[chosen].type, x: b.x, y: b.y });
        slot = chosen; frame = 0;
      } else if (this.retreat > 0 && aware) {
        wantX = -toward * speed; this.facing = toward;
      } else if (aware) {
        this.state = 'chase';
        this.facing = toward;
        if (this.ai.archetype === 'caster') {
          const want = this.ai.preferredDistance;
          if (reach < want * 0.7) wantX = -toward * speed;
          else if (reach > want * 1.2) wantX = toward * speed;
        } else if (this.ai.archetype === 'guard' && Math.abs(b.x + toward * 8 - this.home.x) > this.ai.leash) {
          wantX = 0;                                    // will not leave its post
        } else if (reach > b.w / 2 + hero.body.w / 2 + 6) {
          wantX = toward * speed;
        }
      } else if (this.ai.archetype === 'guard' || this.ai.archetype === 'caster') {
        // Return to the post, then wait there.
        const back = this.home.x - b.x;
        if (Math.abs(back) > 6) { this.facing = back > 0 ? 1 : -1; wantX = this.facing * speed * 0.5; }
        this.state = 'idle';
      } else {
        this.state = 'patrol';
        wantX = this.facing * speed * 0.5;
      }
      // Never walk off a ledge it is not allowed to drop from; patrols turn round instead.
      if (wantX && !this.hover && b.grounded && !this.floorAhead(level, Math.sign(wantX)) && !(aware && this.ai.dropsOffLedges)) {
        if (this.state === 'patrol') this.facing = -this.facing;
        wantX = 0;
      }
    }

    // ---- move
    const leaping = this.action?.leaping;
    if (!leaping) {
      const controlled = !this.dead && !this.action && this.stun <= 0;
      const target = controlled ? wantX : 0;
      const accel = (b.grounded || this.hover ? 1400 : 300) * dt;
      b.vx += Math.max(-accel, Math.min(accel, target - b.vx));
    }
    if (this.hover) {
      b.vy += Math.max(-600 * dt, Math.min(600 * dt, (this.home.y - b.y) * 4 - b.vy));
    } else {
      b.vy = Math.min(this.maxFall, b.vy + this.gravity * dt);
    }
    const moved = moveBody(level, b, dt);
    if (moved.hitWall && this.state === 'patrol' && !this.action) this.facing = -this.facing;
    if (b.y - b.h > level.height + 200) this.gone = true;        // fell out of the level

    // ---- pose
    if (frame === null) {
      if (Math.abs(b.vx) > 6 && this.moves) {
        const gait = this.state === 'chase' ? this.moves.run : this.moves.walk;
        slot = gait.slot; rate = Math.max(0.5, Math.abs(b.vx) / Math.max(1, this.g.stats.speed));
      }
      if (slot !== this.anim) { this.anim = slot; this.animTime = 0; }
      this.animTime += dt * 1000 * rate;
      frame = sampleClip(clips[slot], this.animTime).frame;
    } else {
      this.anim = slot;
    }
    this.pose = { slot, frame };
  }

  /** The attack box that is dangerous right now, for the debug overlay. */
  activeBox() {
    const a = this.action;
    if (!a?.attack?.box || this.dead) return null;
    const live = eventsOnFrame(this.entity.animations[a.slot], Math.max(0, a.frame)).some(e => HIT_EVENTS.has(e.type));
    return { rect: this.boxRect(a.attack.box), live };
  }
}
