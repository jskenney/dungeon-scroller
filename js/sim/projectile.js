// Things that fly or erupt: bolts, arrows, stones, and delayed ground bursts.
// Drawn as particles, since the sheets contain no projectile art.

import { slopeSurface } from '../level/level.js';

let nextId = 1;

export class Projectile {
  /**
   * @param {object} o  {team: 'hero'|'enemy', x, y, vx, vy, gravity, range, damage,
   *                     effect, pierce, radius, color, owner}
   */
  constructor(o) {
    Object.assign(this, { gravity: 0, pierce: false, radius: 6, effect: null, color: '#ffffff' }, o);
    this.id = nextId++;
    this.kind = 'bolt';
    this.prev = { x: this.x, y: this.y };
    this.left = o.range;          // distance still to travel
    this.struck = new Set();      // targets already hit (a piercing shot hits each once)
    this.gone = false;
  }

  update(world, dt) {
    this.prev = { x: this.x, y: this.y };
    this.vy += this.gravity * dt;
    const dx = this.vx * dt, dy = this.vy * dt;
    this.x += dx; this.y += dy;
    this.left -= Math.hypot(dx, dy);
    const level = world.level, r = this.radius * 0.5;
    const blocked = level.rectsIn(this.x - r, this.y - r, this.x + r, this.y + r).some(q => q.kind === 'solid')
      || level.slopesIn(this.x, this.y, this.x, this.y).some(s => this.y > slopeSurface(s, this.x));
    if (blocked || this.left <= 0 || this.y > level.height + 300) { this.gone = true; return; }
    const hitArea = { l: this.x - this.radius, t: this.y - this.radius, r: this.x + this.radius, b: this.y + this.radius };
    world.strike(this, hitArea, this.struck);
    if (this.struck.size && !this.pierce) this.gone = true;
  }
}

/** A burst that appears at a spot, warns for `delay` seconds, then damages what stands in it. */
export class Eruption {
  constructor(o) {
    Object.assign(this, { radius: 56, delay: 0.5, color: '#7fe3c8', effect: null }, o);
    this.id = nextId++;
    this.kind = 'eruption';
    this.prev = { x: this.x, y: this.y };
    this.age = 0;
    this.burst = false;
    this.gone = false;
  }

  update(world, dt) {
    this.age += dt;
    if (!this.burst && this.age >= this.delay) {
      this.burst = true;
      world.strike(this, { l: this.x - this.radius, t: this.y - 110, r: this.x + this.radius, b: this.y + 8 }, new Set());
    }
    if (this.age > this.delay + 0.35) this.gone = true;
  }
}
