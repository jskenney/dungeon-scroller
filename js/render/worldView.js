// Draws a running world: the hero, enemies with health bars, projectiles (from
// the projectile sheet, or as particles when they have no art), damage numbers,
// and the debug overlay. Reads the simulation;
// never changes it.

import { Container, Graphics, Sprite, Text } from '../../vendor/pixi.min.mjs';
import { TILE } from '../level/level.js';
import { clipLength, sampleClip } from '../assets/animation.js';
import { BOOST_NAMES } from '../ui/hud.js';

const tint = hex => parseInt(String(hex ?? '#ffffff').slice(1), 16);
const lerp = (a, b, t) => a + (b - a) * t;

export class WorldView {
  /**
   * @param {import('./stage.js').Stage} stage @param {import('../sim/world.js').World} world
   * @param {{parallax?: object, replaceBackground?: boolean}} [scenery]  strips to draw behind the level
   */
  constructor(stage, world, scenery = {}) {
    this.stage = stage;
    this.world = world;
    stage.showLevel(world.level, scenery.parallax ?? null, scenery.replaceBackground ?? false, scenery.ground ?? 1);
    this.effects = new Container();
    this.bars = new Graphics();
    // Objects and gates sit behind the hero and enemies.
    this.props = new Container();
    stage.world.addChildAt(this.props, stage.world.getChildIndex(stage.actors));
    stage.world.addChildAt(this.effects, stage.world.getChildIndex(stage.actors) + 1);
    this.objectViews = new Map();
    this.gateViews = new Map();
    this.npcViews = new Map();
    this.interactKey = 'E';
    this.prompt = new Text({ text: '', resolution: Math.max(1, Math.round(stage.perPixel)) * 2,
      style: { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 9, fontWeight: '700', fill: 0xffffff, stroke: { color: 0x000000, width: 2 } } });
    this.prompt.anchor.set(0.5, 1);
    this.prompt.visible = false;
    this.breath = new Graphics();
    this.rings = new Graphics();
    this.waves = [];
    this.effects.addChild(this.bars, this.breath, this.rings, this.prompt);
    this.heroView = stage.addActor(world.hero.entity);
    this.enemyViews = new Map();
    this.shots = new Map();
    this.bursts = [];              // impact pictures playing out
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

    // ---- objects and gates
    for (const object of world.objects) {
      let view = this.objectViews.get(object);
      if (!view) { view = stage.addActor(object.entity, 0, this.props); this.objectViews.set(object, view); }
      view.sprite.visible = !object.hidden;
      view.sprite.alpha = object.wait > 0 ? 0.6 : 1;
      view.show(object.pose.slot, object.pose.frame, object.x, object.y, 1);
    }
    for (const [object, view] of this.objectViews) {
      if (world.objects.includes(object)) continue;
      view.sprite.destroy();
      this.objectViews.delete(object);
    }
    for (const npc of world.npcs) {
      let view = this.npcViews.get(npc);
      if (!view) { view = stage.addActor(npc.entity, 0, this.props); this.npcViews.set(npc, view); }
      view.show(npc.pose.slot, npc.pose.frame, npc.x, npc.y, npc.facing);
    }
    for (const gate of world.gates) {
      let view = this.gateViews.get(gate);
      if (!view) { view = this.drawGate(gate); this.gateViews.set(gate, view); }
      // An opened gate slides up out of the way.
      if (gate.open && view.y > -gate.height * TILE) view.y = Math.max(-gate.height * TILE, view.y - 260 * dt);
      view.alpha = gate.open ? Math.max(0, 1 + view.y / (gate.height * TILE)) : 1;
    }
    const target = world.prompt;
    this.prompt.visible = Boolean(target);
    if (target) {
      this.prompt.text = this.interactKey;
      this.prompt.position.set(Math.round(target.x), Math.round(target.rect().t - 6 + Math.sin(this.time * 5) * 2));
    }

    // ---- enemies
    const bars = this.bars.clear();
    for (const enemy of world.enemies) {
      let view = this.enemyViews.get(enemy);
      if (!view) { view = stage.addActor(enemy.entity); this.enemyViews.set(enemy, view); }
      const b = enemy.body;
      const x = lerp(enemy.prev.x, b.x, a), y = lerp(enemy.prev.y, b.y, a);
      view.show(enemy.pose.slot, enemy.pose.frame, x + enemy.artShift * enemy.facing, y + enemy.bodyLift, enemy.facing);
      const fade = enemy.dead && !enemy.boss ? Math.max(0, enemy.deadTime - clipLength(enemy.entity.animations.death) / 1000) / 1.2 : 0;
      view.sprite.alpha = 1 - Math.min(1, fade);
      view.sprite.tint = enemy.flash > 0 ? 0xff7070 : enemy.stun > 0 ? 0xfff0a0 : enemy.weak.time > 0 ? 0xd9a8ff : enemy.slow.time > 0 ? 0x9fc4ff : 0xffffff;
      if (!enemy.dead && !enemy.boss && enemy.hp < enemy.maxHp) {
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

    // ---- boss breath: a stream of flickering particles over the area it covers
    const breath = this.breath.clear();
    for (const enemy of world.enemies) {
      const area = enemy.boss ? enemy.activeBreath() : null;
      if (!area) continue;
      const color = tint(enemy.g.color), width = area.r - area.l, height = area.b - area.t;
      for (let i = 0; i < 46; i++) {
        const along = ((i * 0.137 + this.time * 2.6) % 1);                    // 0 at the mouth, 1 at the far end
        const x = enemy.facing === 1 ? area.l + along * width : area.r - along * width;
        const spread = height * (0.25 + 0.75 * along);
        const y = area.t + height / 2 + (((i * 0.618) % 1) - 0.5) * spread;
        const size = 3 + Math.round(along * 5);
        breath.rect(Math.round(x), Math.round(y), size, size).fill({ color: i % 4 ? color : 0xffffff, alpha: 0.85 - along * 0.55 });
      }
    }
    // ---- ground waves spreading from a boss
    const rings = this.rings.clear();
    this.waves = this.waves.filter(w => {
      w.age += dt;
      const t = w.age / 0.45, reach = w.radius * Math.min(1, t);
      for (const side of [-1, 1]) rings.rect(w.x + side * reach - 5, w.y - 22 * (1 - t * 0.6), 10, 22 * (1 - t * 0.6)).fill({ color: w.color, alpha: 0.9 * (1 - t) });
      rings.rect(w.x - reach, w.y - 3, reach * 2, 3).fill({ color: w.color, alpha: 0.35 * (1 - t) });
      return t < 1;
    });

    // ---- projectiles and bursts: sheet art where a sprite is named, particles otherwise
    for (const p of world.projectiles) {
      let g = this.shots.get(p);
      const art = p.sprite ? this.projectileArt(p.sprite) : null;
      if (!g && art) { g = this.centred(art.animations.flight.frames[0]); g.age = 0; this.shots.set(p, g); }
      if (art) {
        g.age += dt * 1000;
        g.texture = art.animations.flight.frames[sampleClip(art.animations.flight, g.age).frame];
        this.aim(g, art, p.vx, p.vy);
        g.position.set(Math.round(lerp(p.prev.x, p.x, a)), Math.round(lerp(p.prev.y, p.y, a)));
        continue;
      }
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

    // ---- impact pictures: where a shot landed, on a healed hero, on a hexed enemy's head
    for (const e of world.events) {
      const art = e.sprite ? this.projectileArt(e.sprite) : null;
      if (e.type === 'impact' && art) {
        // The flight picture is centred on the shot; its tip is `lead` further along.
        const speed = Math.hypot(e.vx, e.vy) || 1, lead = art.lead ?? 0;
        this.burst(art, e.x + (e.vx / speed) * lead, e.y + (e.vy / speed) * lead, e.vx, e.vy);
      } else if ((e.type === 'heal' || e.type === 'hex') && art && e.actor) {
        this.burst(art, 0, 0, 1, 0, e.actor);
      } else if (e.type === 'impact' && !e.sprite) {
        // No art: a few sparks in the shot's colour.
        const g = new Graphics(); g.sparks = true; g.color = tint(e.color);
        this.effects.addChild(g);
        this.bursts.push({ view: g, x: e.x, y: e.y, t: 0 });
      }
    }
    this.bursts = this.bursts.filter(b => {
      b.t += dt * 1000;
      if (b.view.sparks) {
        const t = b.t / 220;
        b.view.clear();
        for (let i = 0; i < 6 && t < 1; i++) {
          const angle = i * 1.047 + 0.4, reach = 4 + 14 * t;
          b.view.rect(Math.round(b.x + Math.cos(angle) * reach) - 1, Math.round(b.y + Math.sin(angle) * reach) - 1, 3, 3).fill({ color: i % 2 ? b.view.color : 0xffffff, alpha: 1 - t });
        }
        if (t < 1) return true;
      } else {
        const at = sampleClip(b.clip, b.t);
        if (!at.finished) {
          b.view.texture = b.clip.frames[at.frame];
          if (b.actor) {
            // Follows whoever it is on: the chest for a heal, the head for a mind spell.
            const body = b.actor.body, up = b.anchor === 'head' ? body.h - 8 : body.h * 0.5;
            b.view.position.set(Math.round(lerp(b.actor.prev.x, body.x, a)), Math.round(lerp(b.actor.prev.y, body.y, a) - up));
          }
          return true;
        }
      }
      b.view.destroy();
      return false;
    });

    // ---- numbers that float up from hits and heals
    for (const e of world.events) {
      if (e.type === 'damage') this.float(e.x, e.y, String(e.amount), e.team === 'hero' ? 0xff6b6b : 0xffe08a);
      else if (e.type === 'heal' && e.amount > 0) this.float(e.x, e.y, `+${e.amount}`, 0x7be495);
      else if (e.type === 'hex') this.float(e.x, e.y, 'hexed', 0xd9a8ff);
      else if (e.type === 'kill') this.float(e.x, e.y - 40, 'defeated', 0xffffff);
      else if (e.type === 'locked') this.float(e.x, e.y, 'locked', 0xc9ced9);
      else if (e.type === 'minigame') this.float(e.x, e.y, 'mini-game not built yet', 0xc9ced9);
      else if (e.type === 'shockwave') this.waves.push({ x: e.x, y: e.y, radius: e.radius, color: tint(e.color), age: 0 });
      else if (e.type === 'bossPhase') this.float(e.x, e.y, 'enraged', 0xff8a8a);
      else if (e.type === 'checkpoint') this.float(e.x, e.y - 12, 'checkpoint', 0x7be495);
      else if (e.type === 'gateOpened') this.float(e.x, e.y + 60, 'opened', 0xffffff);
      else if (e.type === 'gave') {
        const g = e.gives, label = g.keys ? 'key' : g.gold && !g.score ? `+${g.gold} gold` : e.boost ? (BOOST_NAMES[e.boost.stat] ?? e.boost.stat) : g.hp ? `+${g.hp} HP` : g.mp ? `+${g.mp} MP`
          : g.score ? `+${g.score}` : g.hpFraction && g.mpFraction ? 'restored' : null;
        if (label) this.float(e.x, e.y, label, g.hp || g.hpFraction ? 0x7be495 : g.mp ? 0x8fb8f2 : 0xffe08a);
      }
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
      for (const object of world.objects) {
        if (object.g.use === 'none' || object.hidden) continue;
        const r = object.rect();
        g.rect(r.l, r.t, r.r - r.l, r.b - r.t).stroke({ width: 1, color: object.solid ? 0xef6b6b : 0x5ac8fa });
      }
      for (const gate of world.gates) {
        if (!gate.open) g.rect(gate.rect.l, gate.rect.t, gate.rect.r - gate.rect.l, gate.rect.b - gate.rect.t).stroke({ width: 1, color: 0xef6b6b });
      }
      for (const enemy of world.enemies) {
        if (enemy.dead) continue;
        stage.drawBody(enemy.body.x, enemy.body.y, enemy.body.w, enemy.body.h, 0xf59e42);
        const reach = enemy.boss ? enemy.activeBreath() : null;
        if (reach) g.rect(reach.l, reach.t, reach.r - reach.l, reach.b - reach.t).fill({ color: 0xff5d5d, alpha: 0.2 }).stroke({ width: 1, color: 0xff5d5d });
        const box = enemy.activeBox();
        if (box) {
          g.rect(box.rect.l, box.rect.t, box.rect.r - box.rect.l, box.rect.b - box.rect.t)
            .fill({ color: 0xff5d5d, alpha: box.live ? 0.35 : 0 }).stroke({ width: 1, color: 0xff5d5d });
        }
      }
    }
    return { x: lerp(hero.prev.x, hb.x, a), y: hy };
  }

  /** A gate: the tileset's grate tile if it has one, otherwise drawn bars. A lock is marked in gold. */
  drawGate(gate) {
    const holder = new Container(), inner = new Container();
    holder.position.set(gate.col * TILE, gate.row * TILE);
    const tiles = this.world.level.tileset.tiles;
    const grate = Object.values(tiles).find(t => t.id?.includes('grate') && t.texture);
    for (let i = 0; i < gate.height; i++) {
      if (grate) {
        const sprite = new Sprite(grate.texture);
        sprite.y = i * TILE;
        inner.addChild(sprite);
      } else {
        const bars = new Graphics();
        for (let x = 34; x <= 58; x += 8) bars.rect(x, i * TILE, 4, TILE).fill({ color: 0x3b3f4a });
        bars.rect(32, i * TILE + 10, 32, 5).fill({ color: 0x2b2e37 }).rect(32, i * TILE + 80, 32, 5).fill({ color: 0x2b2e37 });
        inner.addChild(bars);
      }
    }
    if (gate.locked) {
      const lock = new Graphics();
      lock.rect(41, gate.height * TILE / 2 - 8, 14, 16).fill({ color: 0xe3b95c }).rect(46, gate.height * TILE / 2 - 3, 4, 7).fill({ color: 0x3a2c08 });
      inner.addChild(lock);
    }
    holder.addChild(inner);
    this.props.addChild(holder);
    return inner;
  }

  /** The sheet entity for a projectile sprite name, if that sheet is loaded. */
  projectileArt(id) {
    return this.world.entities?.[`projectile/${id}`] ?? null;
  }

  /** A sprite on the effects layer, held by its centre pivot. */
  centred(texture) {
    const sprite = new Sprite(texture);
    sprite.pivot.set(texture.width / 2, texture.height / 2);
    this.effects.addChild(sprite);
    return sprite;
  }

  /**
   * Point projectile art along its travel. The art is drawn travelling right:
   * going left it is mirrored, so it never appears upside down. Art that
   * tumbles in its own frames is mirrored but not turned.
   */
  aim(sprite, art, vx, vy) {
    const mirror = vx < 0 ? -1 : 1;
    sprite.scale.set(mirror, 1);
    sprite.rotation = art.orient === 'fixed' ? 0 : Math.atan2(vy * mirror, vx * mirror);
  }

  /** Start an impact picture at a point, or on an actor it will follow. */
  burst(art, x, y, vx, vy, actor = null) {
    const clip = art.animations.impact, view = this.centred(clip.frames[0]);
    if (!actor) { this.aim(view, art, vx, vy); view.position.set(Math.round(x), Math.round(y)); }
    this.bursts.push({ view, clip, t: 0, actor, anchor: art.impactAnchor });
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
