// Bosses: large enemies that fight in three phases. Each phase unlocks another
// attack and quickens the boss. They are not staggered by hits, and they wait
// in their arena until the hero walks in.

import { Enemy } from './enemy.js';
import { overlap } from './actor.js';
import { Projectile } from './projectile.js';
import { eventsOnFrame } from '../assets/animation.js';

export class Boss extends Enemy {
  constructor(entity, config, x, y) {
    super(entity, config, x, y);
    this.boss = true;
    this.awake = false;            // set when the hero enters the arena
    this.phase = 0;
    this.start = { x: this.body.x, y: this.body.y };
    this.airborne = 0;             // seconds left hovering after taking off
    this.outOfReach = 0;           // seconds the hero has stayed overhead
  }

  get tempo() { return this.g.phases[this.phase]?.tempo ?? 1; }
  get touchScale() { return this.action?.leaping ? 2 : 1; }

  attackList() {
    const allowed = this.g.phases[this.phase]?.attacks ?? Object.keys(this.g.attacks);
    return allowed.map(slot => [slot, this.g.attacks[slot]]);
  }

  reachOf(attack) {
    if (attack.type === 'shockwave') return attack.radius * 0.8;
    if (attack.type === 'dive') return 520;
    if (attack.type === 'breath') return (attack.box?.x ?? 0) + (attack.box?.w ?? 0) + attack.range * 0.85;
    return super.reachOf(attack);
  }

  /** Back to full strength at the starting spot, when the hero has to try again. */
  reset() {
    this.hp = this.maxHp; this.dead = false; this.deadTime = 0; this.gone = false;
    this.phase = 0; this.awake = false; this.action = null; this.cooldown = {};
    this.hover = false; this.airborne = 0; this.outOfReach = 0;
    this.stun = 0; this.weak.time = 0; this.slow.time = 0;
    Object.assign(this.body, { x: this.start.x, y: this.start.y, vx: 0, vy: 0 });
    this.prev = { x: this.start.x, y: this.start.y, lift: 0 };
  }

  /** Bosses shrug off blows: no stagger and no knock-back, and stuns are brief. */
  takeHit(amount, direction, effect = {}) {
    const dealt = this.loseHealth(amount);
    if (!dealt) return 0;
    this.applyEffect({ ...effect, stun: effect.stun ? effect.stun * 0.25 : 0 });
    this.alert = 6;
    if (this.hp <= 0) {
      this.dead = true;
      this.hover = false;
      this.action = { slot: 'death', t: 0, frame: -1 };
      return dealt;
    }
    // Moving to the next phase: a pause, then faster and with one more attack.
    const fraction = this.hp / this.maxHp;
    while (this.phase < this.g.phases.length - 1 && fraction <= this.g.phases[this.phase].untilHp) {
      this.phase++;
      this.rest = 0.9;
      this.changedPhase = true;
    }
    return dealt;
  }

  /** The area a breath attack covers: forward from its box by its range. */
  breathRect(attack) {
    const r = this.boxRect(attack.box);
    return this.facing === 1 ? { ...r, r: r.r + attack.range } : { ...r, l: r.l - attack.range };
  }

  onFrame(world, clip, frame) {
    super.onFrame(world, clip, frame);
    const a = this.action, attack = a.attack, hero = world.hero, b = this.body;
    if (!attack) return;
    const damage = attack.damage * (this.config.difficulty?.enemyDamage ?? 1);
    const events = clip.events ?? [];
    // A leaping melee attack takes off one frame before it lands its first blow.
    const firstHit = events.find(e => e.type === 'melee' || e.type === 'impact');
    if (attack.leap && firstHit && frame + 1 === firstHit.frame - 1 && !events.some(e => e.type === 'leap')) {
      const air = 2 * Math.sqrt(2 * attack.leap.height / this.gravity);
      const distance = Math.min(attack.leap.distance, Math.abs(hero.body.x - b.x) + 20);
      b.vx = this.facing * distance / air;
      b.vy = -Math.sqrt(2 * this.gravity * attack.leap.height);
      b.grounded = false; a.leaping = true;
    }
    for (const e of events) {
      if (e.frame !== frame + 1) continue;
      if (e.type === 'leap' && attack.type === 'dive') {
        // Dive at where the hero is standing.
        const distance = Math.max(40, Math.min(460, Math.abs(hero.body.x - b.x)));
        const air = 2 * Math.sqrt(2 * 90 / this.gravity);
        b.vx = this.facing * distance / air;
        b.vy = -Math.sqrt(2 * this.gravity * 90);
        b.grounded = false; a.leaping = true; this.hover = false;
      } else if (e.type === 'impact' && attack.type === 'dive' && !a.struck) {
        if (Math.abs(hero.body.x - b.x) < attack.radius + b.w / 2 && Math.abs(hero.body.y - b.y) < 120) {
          a.struck = true;
          world.hurtHero(damage, this, attack.effect);
        }
        world.events.push({ type: 'shockwave', x: b.x, y: b.y, radius: attack.radius + b.w / 2, color: this.g.color });
      } else if (e.type === 'emit' && attack.type === 'shockwave') {
        // A wave along the ground: a hero in the air is not touched.
        if (hero.body.grounded && Math.abs(hero.body.x - b.x) < attack.radius && Math.abs(hero.body.y - b.y) < 160) {
          world.hurtHero(damage, this, attack.effect);
        }
        world.events.push({ type: 'shockwave', x: b.x, y: b.y, radius: attack.radius, color: this.g.color });
      } else if (e.type === 'emit' && attack.type === 'projectile') {
        const p = attack.projectile, x = b.x + this.facing * (b.w / 2 + 6), y = b.y - b.h * 0.75;
        const aim = Math.atan2((hero.body.y - hero.body.h * 0.5) - y, hero.body.x - x);
        const count = p.count ?? 1;
        for (let i = 0; i < count; i++) {
          const angle = aim + ((i - (count - 1) / 2) * (p.spread ?? 0) * Math.PI) / 180;
          world.projectiles.push(new Projectile({ team: 'enemy', owner: this, x, y, vx: Math.cos(angle) * p.speed, vy: Math.sin(angle) * p.speed,
            range: p.range, damage, effect: attack.effect, radius: 9, color: this.g.color ?? '#7fe3c8' }));
        }
      }
    }
  }

  update(world, dt) {
    const hero = world.hero, b = this.body;
    if (!this.awake && !this.dead) {
      // Waiting in the arena: stand and breathe.
      this.prev = { x: b.x, y: b.y, lift: 0 };
      this.animTime += dt * 1000;
      const idle = this.entity.animations.idle, total = idle.durations.reduce((s, d) => s + d, 0);
      let t = this.animTime % total, frame = 0;
      while (t >= idle.durations[frame]) t -= idle.durations[frame++];
      this.pose = { slot: 'idle', frame };
      this.facing = hero.body.x >= b.x ? 1 : -1;
      return;
    }
    this.alert = 5;                                   // a boss never loses track of the hero
    // Take to the air for a while if the hero stays out of reach overhead.
    if (!this.dead && !this.action) {
      const above = b.y - b.h - hero.body.y;
      this.outOfReach = above > 60 && !hero.dead ? this.outOfReach + dt : 0;
      if (!this.hover && this.outOfReach > 2.5 && this.entity.animations.fly) { this.hover = true; this.airborne = 4; }
    }
    if (this.hover && !this.dead) {
      this.airborne -= dt;
      this.home.y = Math.min(this.start.y, hero.body.y + 10);
      if (this.airborne <= 0 && !this.action) { this.hover = false; this.outOfReach = 0; }
    }
    super.update(world, dt);
    if (this.dead) { this.gone = false; return; }     // the body stays where it fell
    if (this.hover && !this.action && this.stun <= 0) {
      const fly = this.entity.animations.fly, total = fly.durations.reduce((s, d) => s + d, 0);
      let t = (world.tick * world.step * 1000) % total, frame = 0;
      while (t >= fly.durations[frame]) t -= fly.durations[frame++];
      this.pose = { slot: 'fly', frame };
    }
    // Breath: hurts once while its frames show and the hero stands in it.
    const a = this.action;
    if (a?.attack?.type === 'breath' && !a.struck && !hero.dead
        && eventsOnFrame(this.entity.animations[a.slot], Math.max(0, a.frame)).some(e => e.type === 'emit')
        && overlap(this.breathRect(a.attack), hero.bodyRect())) {
      a.struck = true;
      world.hurtHero(a.attack.damage * (this.config.difficulty?.enemyDamage ?? 1), this, a.attack.effect);
    }
    if (this.changedPhase) {
      this.changedPhase = false;
      world.events.push({ type: 'bossPhase', phase: this.phase + 1, x: b.x, y: b.y - b.h });
    }
  }

  /** The breath area that is live right now, for drawing. */
  activeBreath() {
    const a = this.action;
    if (this.dead || a?.attack?.type !== 'breath') return null;
    const live = eventsOnFrame(this.entity.animations[a.slot], Math.max(0, a.frame)).some(e => e.type === 'emit');
    return live ? this.breathRect(a.attack) : null;
  }
}
