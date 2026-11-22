// World objects: pickups, chests, breakables, checkpoints, shrines, levers,
// the relic, and scenery. What each one does comes from data/objects.json:
//   use        touch | interact | attack | none
//   behaviour  pickup | container | breakable | checkpoint | shrine | switch | goal | light | decor

import { clipLength, sampleClip } from '../assets/animation.js';

let nextId = 1;

export class WorldObject {
  /**
   * @param {object} entity  sheet entity with its `gameplay` catalog entry
   * @param {number} x       world x of the pivot
   * @param {number} y       world y of the ground line it sits on
   * @param {object} [placed] extra values from the level: link, locked, loot, appears
   */
  constructor(entity, x, y, placed = {}) {
    this.id = nextId++;
    this.entity = entity;
    this.g = entity.gameplay;
    this.x = x; this.y = y;
    this.link = placed.link ?? null;          // gate a lever opens
    this.locked = Boolean(placed.locked);     // needs a key
    this.loot = placed.loot ?? this.g.loot ?? [];
    this.hidden = placed.appears === 'boss_defeated';   // the relic waits for the boss
    this.state = 'idle';                      // idle | using | used | vanishing
    this.t = 0;                               // time in the current state, ms
    this.wait = placed.wait ?? 0;             // seconds before a dropped pickup can be taken
    this.cooldown = 0;                        // seconds before a shrine works again
    this.gone = false;
    this.solid = null;                        // its rectangle in level.dynamic, while it blocks movement
    this.pose = { slot: 'idle', frame: 0 };
  }

  /** The touch, interaction or hit area in world coordinates. */
  rect(grow = 0) {
    const b = this.g.box;
    return { l: this.x + b.x - grow, t: this.y + b.y - grow, r: this.x + b.x + b.w + grow, b: this.y + b.y + b.h + grow };
  }

  /** Can it be used right now by this kind of action? */
  ready(use) {
    return this.g.use === use && this.state === 'idle' && !this.hidden && this.wait <= 0 && this.cooldown <= 0;
  }

  begin() { this.state = 'using'; this.t = 0; }

  update(world, dt) {
    const clips = this.entity.animations;
    this.t += dt * 1000;
    this.wait = Math.max(0, this.wait - dt);
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      if (this.cooldown === 0 && this.state === 'used') { this.state = 'idle'; this.t = 0; }   // a shrine relights
    }
    if (this.state === 'using' && this.t >= clipLength(clips.interact)) {
      world.objectFinished(this);
      // Things that are consumed fade away; things that are switched stay as they are.
      if (this.entity.persistent || this.g.behaviour === 'container' || this.g.behaviour === 'switch') this.state = 'used';
      else { this.state = 'vanishing'; this.t = 0; }
    }
    if (this.state === 'vanishing' && this.t >= clipLength(clips.vanish)) this.gone = true;

    const last = clips.interact.durations.length - 1;
    if (this.state === 'idle') this.pose = { slot: 'idle', frame: sampleClip(clips.idle, this.t).frame };
    else if (this.state === 'using') this.pose = { slot: 'interact', frame: sampleClip(clips.interact, this.t).frame };
    else if (this.state === 'used') this.pose = { slot: 'interact', frame: last };
    else this.pose = { slot: 'vanish', frame: sampleClip(clips.vanish, this.t).frame };
  }
}
