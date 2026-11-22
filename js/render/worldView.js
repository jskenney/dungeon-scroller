// Draws a running world: the hero, enemies with health bars, projectiles as
// particles, damage numbers, and the debug overlay. Reads the simulation;
// never changes it.

import { Container, Graphics, Text } from '../../vendor/pixi.min.mjs';
import { clipLength } from '../assets/animation.js';

const tint = hex => parseInt(String(hex ?? '#ffffff').slice(1), 16);
const lerp = (a, b, t) => a + (b - a) * t;

export class WorldView {
  /** @param {import('./stage.js').Stage} stage @param {import('../sim/world.js').World} world */
  constructor(stage, world) {
    this.stage = stage;
    this.world = world;
    stage.showLevel(world.level);
    this.effects = new Container();
    this.bars = new Graphics();
    stage.world.addChildAt(this.effects, stage.world.getChildIndex(stage.actors) + 1);
    this.effects.addChild(this.bars);
    this.heroView = stage.addActor(world.hero.entity);
    this.enemyViews = new Map();
    this.shots = new Map();
    this.floaters = [];
    this.time = 0;
  }

  /**
   * Draw the current state, blended between the last two simulation steps.
   * @returns {{x: number, y: number}} where the hero was drawn, for the camera
   */
  update(dt) {
    const world = this.world, a = world.alpha, stage = this.stage;
    this.time += dt;

    // ---- hero
    const hero = world.hero, hb = hero.body;
    const hx = lerp(hero.prev.x, hb.x, a) + hero.artShift * hero.facing;
    const hy = lerp(hero.prev.y + hero.prev.lift, hb.y + hero.visualLift, a);
    this.heroView.show(hero.pose.slot, hero.pose.frame, hx, hy, hero.facing);
    const sprite = this.heroView.sprite;
    // Flicker while briefly invulnerable after a hit; flash red on the hit itself.
    sprite.alpha = hero.invulnerable > 0 && !hero.dead && Math.floor(this.time * 18) % 2 ? 0.4 : 1;
    sprite.tint = hero.flash > 0 ? 0xff7070 : hero.slow.time > 0 ? 0x9fc4ff : 0xffffff;

    // ---- enemies
    const bars = this.bars.clear();
    for (const enemy of world.enemies) {
      let view = this.enemyViews.get(enemy);
      if (!view) { view = stage.addActor(enemy.entity); this.enemyViews.set(enemy, view); }
      const b = enemy.body;
      const x = lerp(enemy.prev.x, b.x, a), y = lerp(enemy.prev.y, b.y, a);
      view.show(enemy.pose.slot, enemy.pose.frame, x + enemy.artShift * enemy.facing, y + enemy.bodyLift, enemy.facing);
      const fade = enemy.dead ? Math.max(0, enemy.deadTime - clipLength(enemy.entity.animations.death) / 1000) / 1.2 : 0;
      view.sprite.alpha = 1 - Math.min(1, fade);
      view.sprite.tint = enemy.flash > 0 ? 0xff7070 : enemy.stun > 0 ? 0xfff0a0 : enemy.weak.time > 0 ? 0xd9a8ff : enemy.slow.time > 0 ? 0x9fc4ff : 0xffffff;
      if (!enemy.dead && enemy.hp < enemy.maxHp) {
        const w = 30, top = y - b.h - 9;
        bars.rect(x - w / 2 - 1, top - 1, w + 2, 5).fill({ color: 0x000000, alpha: 0.7 });
        bars.rect(x - w / 2, top, w * (enemy.hp / enemy.maxHp), 3).fill({ color: 0xd0453f });
      }
    }
    for (const [enemy, view] of this.enemyViews) {
      if (world.enemies.includes(enemy)) continue;
      view.sprite.destroy();
      this.enemyViews.delete(enemy);
    }

    // ---- projectiles and bursts, drawn as particles
    for (const p of world.projectiles) {
      let g = this.shots.get(p);
      if (!g) { g = new Graphics(); g.trail = []; this.effects.addChild(g); this.shots.set(p, g); }
      const color = tint(p.color);
      g.clear();
      if (p.kind === 'eruption') {
        const warn = Math.min(1, p.age / p.delay);
        if (!p.burst) {
          g.ellipse(p.x, p.y - 2, p.radius * warn, 5).fill({ color, alpha: 0.25 + 0.3 * warn });
        } else {
          const t = (p.age - p.delay) / 0.35;
          for (let i = 0; i < 7; i++) {
            const px = p.x + (i - 3) * (p.radius / 3.5);
            g.rect(px - 3, p.y - (70 + (i % 3) * 18) * (1 - t * 0.4), 6, (70 + (i % 3) * 18) * (1 - t)).fill({ color, alpha: 0.8 * (1 - t) });
          }
        }
        continue;
      }
      const x = lerp(p.prev.x, p.x, a), y = lerp(p.prev.y, p.y, a);
      g.trail.unshift([x, y]);
      g.trail.length = Math.min(g.trail.length, 7);
      g.trail.forEach(([tx, ty], i) => {
        const size = Math.max(1, Math.round((p.radius * 0.75) * (1 - i / 8)));
        g.rect(Math.round(tx) - size, Math.round(ty) - size, size * 2, size * 2).fill({ color, alpha: 0.85 - i * 0.11 });
      });
      g.rect(Math.round(x) - 2, Math.round(y) - 2, 4, 4).fill({ color: 0xffffff });
    }
    for (const [p, g] of this.shots) {
      if (world.projectiles.includes(p)) continue;
      g.destroy();
      this.shots.delete(p);
    }

    // ---- numbers that float up from hits and heals
    for (const e of world.events) {
      if (e.type === 'damage') this.float(e.x, e.y, String(e.amount), e.team === 'hero' ? 0xff6b6b : 0xffe08a);
      else if (e.type === 'heal' && e.amount > 0) this.float(e.x, e.y, `+${e.amount}`, 0x7be495);
      else if (e.type === 'hex') this.float(e.x, e.y, 'hexed', 0xd9a8ff);
      else if (e.type === 'kill') this.float(e.x, e.y - 40, 'defeated', 0xffffff);
    }
    this.floaters = this.floaters.filter(f => {
      f.age += dt;
      f.text.y = f.y - f.age * 46;
      f.text.alpha = Math.max(0, 1 - f.age / 0.8);
      if (f.age < 0.8) return true;
      f.text.destroy();
      return false;
    });

    // ---- debug overlay: bodies and attack boxes
    if (stage.debug) {
      const g = stage.debugLive.clear();
      stage.drawBody(hb.x, hb.y, hb.w, hb.h);
      const action = hero.action;
      if (action?.ability?.box) { const r = hero.boxRect(action.ability.box); g.rect(r.l, r.t, r.r - r.l, r.b - r.t).stroke({ width: 1, color: 0xff5d5d }); }
      for (const enemy of world.enemies) {
        if (enemy.dead) continue;
        stage.drawBody(enemy.body.x, enemy.body.y, enemy.body.w, enemy.body.h, 0xf59e42);
        const box = enemy.activeBox();
        if (box) {
          g.rect(box.rect.l, box.rect.t, box.rect.r - box.rect.l, box.rect.b - box.rect.t)
            .fill({ color: 0xff5d5d, alpha: box.live ? 0.35 : 0 }).stroke({ width: 1, color: 0xff5d5d });
        }
      }
    }
    return { x: lerp(hero.prev.x, hb.x, a), y: hy };
  }

  float(x, y, label, color) {
    const text = new Text({ text: label, resolution: Math.max(1, Math.round(this.stage.perPixel)) * 2,
      style: { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 9, fontWeight: '700', fill: color,
        stroke: { color: 0x000000, width: 2 } } });
    text.anchor.set(0.5, 1);
    text.x = Math.round(x + (Math.random() - 0.5) * 10);
    text.y = y;
    this.effects.addChild(text);
    this.floaters.push({ text, y, age: 0 });
  }
}
