// Chooses what characters say. It watches the simulation's events and picks
// lines from the catalogs (the `lines` of each hero, enemy and boss), spacing
// them out so the screen does not fill with chatter. Pure: no DOM, no sound.

export class LineDirector {
  /** @param {() => number} [random] source of chance, 0–1; replaceable in tests */
  constructor(random = Math.random) {
    this.random = random;
    this.clock = 0;
    this.enemySpokeAt = -99;       // enemies share one voice budget
    this.heroSpokeAt = -99;
    this.saidLowHp = false;
    this.last = new Map();         // actor -> last line, to avoid immediate repeats
    this.queue = [];               // lines waiting for their moment
  }

  pick(actor, key) {
    const lines = actor?.g?.lines?.[key];
    if (!lines?.length) return null;
    let line = lines[Math.floor(this.random() * lines.length)];
    if (lines.length > 1 && line === this.last.get(actor)) line = lines[(lines.indexOf(line) + 1) % lines.length];
    this.last.set(actor, line);
    return line;
  }

  /** Queue a line; `delay` seconds from now. */
  say(actor, key, delay = 0) {
    const text = this.pick(actor, key);
    if (text) this.queue.push({ actor, text, at: this.clock + delay });
  }

  /**
   * Take in this frame's events and return the lines that are due.
   * @param {object[]} events  world events (plus {type: 'levelStart'} from the game)
   * @param {object} world
   * @param {number} dt  seconds since the last call
   * @returns {{actor: object, text: string}[]}
   */
  update(events, world, dt) {
    this.clock += dt;
    const hero = world.hero;
    for (const e of events) {
      switch (e.type) {
        case 'levelStart': this.say(hero, 'start', 0.6); break;
        case 'alert':
          if (!e.actor.boss && this.clock - this.enemySpokeAt > 3 && this.random() < 0.45) { this.say(e.actor, 'alert'); this.enemySpokeAt = this.clock; }
          break;
        case 'kill':
          if (e.actor?.boss) this.say(e.actor, 'death');
          else if (this.random() < 0.3 && this.clock - this.enemySpokeAt > 1.5) { this.say(e.actor, 'death'); this.enemySpokeAt = this.clock; }
          else if (this.random() < 0.25 && this.clock - this.heroSpokeAt > 5) { this.say(hero, 'kill', 0.4); this.heroSpokeAt = this.clock; }
          break;
        case 'damage':
          if (e.team === 'hero' && !this.saidLowHp && !hero.dead && hero.hp / hero.maxHp < 0.3) { this.saidLowHp = true; this.say(hero, 'lowHp'); }
          break;
        case 'heroDied': this.say(hero, 'death'); break;
        case 'respawn': this.saidLowHp = false; break;
        case 'bossFight': this.say(e.actor, 'fight', 0.3); this.say(hero, 'bossFight', 2.4); break;
        case 'bossPhase': this.say(e.actor, e.phase === 2 ? 'phase2' : 'phase3'); break;
        case 'levelComplete': this.say(hero, 'complete'); break;
        default:
      }
    }
    const due = this.queue.filter(q => q.at <= this.clock);
    this.queue = this.queue.filter(q => q.at > this.clock);
    return due.map(({ actor, text }) => ({ actor, text }));
  }
}
