// What heroes and enemies have in common: a body, health, a facing, hit and
// hurt boxes, and timed conditions (stun, slow, weakness, brief invulnerability).

/** Do two rectangles {l, t, r, b} overlap? */
export function overlap(a, b) {
  return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
}

export class Actor {
  /**
   * @param {object} entity  sheet entity (animations) with its `gameplay` catalog entry
   * @param {object} config  site configuration
   */
  constructor(entity, config) {
    this.entity = entity;
    this.g = entity.gameplay;
    this.config = config;
    const box = this.g.body;
    // The simulation centres the actor on its body box; the art is shifted to match.
    this.artShift = -(box.x + box.w / 2);
    // The body box may float above the pivot (a hovering enemy's hem); keep that gap.
    this.bodyLift = -(box.y + box.h);
    this.body = { x: 0, y: 0, vx: 0, vy: 0, w: box.w, h: box.h, grounded: false, groundKind: null, dropTimer: 0 };
    this.prev = { x: 0, y: 0, lift: 0 };
    this.facing = 1;
    this.maxHp = this.g.stats.hp;
    this.hp = this.maxHp;
    this.dead = false;
    this.stun = 0;                             // seconds left unable to act
    this.slow = { factor: 1, time: 0 };        // movement multiplier
    this.weak = { factor: 1, time: 0 };        // damage-taken multiplier (hex)
    this.invulnerable = 0;                     // seconds left ignoring damage
    this.flash = 0;                            // seconds left tinted after a hit
    this.pose = { slot: 'idle', frame: 0 };
    this.anim = 'idle'; this.animTime = 0;
  }

  /** World x of the sprite's pivot (the art is not always centred on the body). */
  get pivotX() { return this.body.x + this.artShift * this.facing; }
  /** World y of the sprite's pivot (the ground line for anything that walks). */
  get pivotY() { return this.body.y + this.bodyLift; }

  bodyRect() {
    const b = this.body;
    return { l: b.x - b.w / 2, t: b.y - b.h, r: b.x + b.w / 2, b: b.y };
  }

  /** A catalog box (relative to the pivot, drawn for facing right) in world coordinates. */
  boxRect(box, grow = 0) {
    const px = this.pivotX, py = this.pivotY;
    const l = this.facing === 1 ? px + box.x : px - (box.x + box.w);
    return { l: l - grow, t: py + box.y - grow, r: l + box.w + grow, b: py + box.y + box.h + grow };
  }

  get speedFactor() { return this.slow.time > 0 ? this.slow.factor : 1; }

  /** Count down the timed conditions. */
  tickStatus(dt) {
    this.stun = Math.max(0, this.stun - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.slow.time = Math.max(0, this.slow.time - dt);
    this.weak.time = Math.max(0, this.weak.time - dt);
  }

  /** Apply the lasting part of an ability's effect: {stun, slow, damageTaken, duration}. */
  applyEffect(effect = {}) {
    if (effect.stun) this.stun = Math.max(this.stun, effect.stun);
    if (effect.slow) this.slow = { factor: effect.slow, time: effect.duration ?? 2 };
    if (effect.damageTaken) this.weak = { factor: effect.damageTaken, time: effect.duration ?? 5 };
  }

  /** Remove health, honouring invulnerability and weakness. Returns the damage dealt. */
  loseHealth(amount) {
    if (this.dead || this.invulnerable > 0 || amount <= 0) return 0;
    const dealt = Math.max(1, Math.round(amount * (this.weak.time > 0 ? this.weak.factor : 1)));
    this.hp = Math.max(0, this.hp - dealt);
    this.flash = 0.12;
    return dealt;
  }
}
