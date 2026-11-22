// Non-player characters: they stand where the level puts them, greet a hero
// who comes near, and either trade or talk when the hero interacts.

import { clipLength, sampleClip } from '../assets/animation.js';

let nextId = 1;

export class Npc {
  /** @param {object} entity sheet entity with its `gameplay` catalog entry */
  constructor(entity, x, y) {
    this.id = nextId++;
    this.isNpc = true;
    this.team = 'npc';
    this.entity = entity;
    this.g = entity.gameplay;
    this.x = x; this.y = y;
    this.facing = 1;
    this.greeted = false;
    this.action = null;                  // {slot, t} for a one-off gesture: wave, sell
    this.t = 0;
    this.pose = { slot: 'idle', frame: 0 };
    this.gone = false;
  }

  /** Where speech bubbles and prompts attach. */
  get body() { return { x: this.x, y: this.y, w: this.g.box.w, h: this.g.box.h }; }

  /** The area the hero stands in to interact. */
  rect() {
    const b = this.g.box;
    return { l: this.x + b.x, t: this.y + b.y, r: this.x + b.x + b.w, b: this.y + b.y + b.h };
  }

  gesture(slot) { if (this.entity.animations[slot]) this.action = { slot, t: 0 }; }

  update(world, dt) {
    const hero = world.hero, clips = this.entity.animations;
    this.t += dt * 1000;
    const dx = hero.body.x - this.x, near = Math.abs(dx) < 150 && Math.abs(hero.body.y - this.y) < 110 && !hero.dead;
    if (near) this.facing = dx >= 0 ? 1 : -1;
    if (near && !this.greeted) {
      this.greeted = true;
      this.gesture('wave');
      world.events.push({ type: 'npcGreet', actor: this, x: this.x, y: this.y });
    } else if (!near && Math.abs(dx) > 500) {
      this.greeted = false;              // will greet again after the hero has been away
    }
    if (this.action) {
      this.action.t += dt * 1000;
      if (this.action.t >= clipLength(clips[this.action.slot])) this.action = null;
    }
    if (this.action) this.pose = { slot: this.action.slot, frame: sampleClip(clips[this.action.slot], this.action.t).frame };
    else if (world.shop === this && clips.talk) this.pose = { slot: 'talk', frame: sampleClip(clips.talk, this.t).frame };
    else this.pose = { slot: 'idle', frame: sampleClip(clips.idle, this.t).frame };
  }
}
