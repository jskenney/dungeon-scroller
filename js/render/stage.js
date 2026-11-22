// The game canvas: a PixiJS stage that fills the window, a camera with
// whole-pixel zoom, tile rooms and actor sprites.

import { Application, Container, Graphics, Sprite } from '../../vendor/pixi.min.mjs';

const TILE = 96;

export class Stage {
  /** @param {HTMLCanvasElement} canvas @param {import('../settings.js').Settings} settings */
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.app = new Application();
    this.world = new Container();
    this.camera = { x: 0, groundY: 0 };
    this.bounds = { left: 0, right: TILE * 10 };
    this.scale = 1;             // CSS pixels per world pixel
    this.onTick = null;         // (seconds) => void
  }

  async init() {
    await this.app.init({
      canvas: this.canvas, resizeTo: window, background: 0x07080c, antialias: false,
      resolution: window.devicePixelRatio || 1, autoDensity: true, preference: 'webgl',
    });
    this.app.stage.addChild(this.world);
    let lastDpr = window.devicePixelRatio || 1;
    window.addEventListener('resize', () => {
      const dpr = window.devicePixelRatio || 1;      // changes with the browser's own zoom
      if (dpr !== lastDpr) { lastDpr = dpr; this.app.renderer.resolution = dpr; }
      this.app.resize();
      this.layout();
    });
    this.settings.onChange(() => this.layout());
    this.app.ticker.add(ticker => {
      // Clamp long gaps (tab in the background) so nothing teleports.
      this.onTick?.(Math.min(ticker.deltaMS, 50) / 1000);
    });
    this.layout();
  }

  get dpr() { return window.devicePixelRatio || 1; }

  /** Snap a CSS-pixel coordinate to a whole device pixel. */
  snap(v) { return Math.round(v * this.dpr) / this.dpr; }

  /**
   * Work out the scale from the window width and the chosen view width.
   * In pixel-perfect mode each art pixel becomes a whole number of device
   * pixels; the canvas still fills the width and the visible tiles adjust.
   */
  layout() {
    const widthPx = this.app.screen.width * this.dpr;
    let perPixel = widthPx / (this.settings.viewTiles * TILE);
    if (this.settings.pixelPerfect) perPixel = Math.max(1, Math.ceil(perPixel - 0.5));
    this.perPixel = perPixel;
    this.scale = perPixel / this.dpr;
    this.world.scale.set(this.scale);
    this.place();
  }

  /**
   * Zoom in (+1) or out (-1). In pixel-perfect mode each step is one whole
   * device pixel per art pixel; otherwise it is one tile of view width.
   */
  zoomBy(direction) {
    const s = this.settings;
    if (!s.pixelPerfect) { s.viewTiles -= direction; return; }
    const widthPx = this.app.screen.width * this.dpr;
    const next = Math.max(1, this.perPixel + direction);
    const tiles = widthPx / (next * TILE);
    if (tiles < (s.display.minViewTiles ?? 4) || tiles > (s.display.maxViewTiles ?? 24)) return;
    s.viewTiles = tiles;
  }

  /** Tiles visible across the window at the current scale. */
  get visibleTiles() { return this.app.screen.width / (this.scale * TILE); }

  place() {
    const { width, height } = this.app.screen;
    const half = width / 2 / this.scale;
    const roomWidth = this.bounds.right - this.bounds.left;
    const x = roomWidth <= half * 2
      ? this.bounds.left + roomWidth / 2
      : Math.max(this.bounds.left + half, Math.min(this.bounds.right - half, this.camera.x));
    this.world.position.set(this.snap(width / 2 - x * this.scale), this.snap(height * 0.78 - this.camera.groundY * this.scale));
  }

  /** Point the camera at a world x; the ground line sits at 78% of the window height. */
  follow(x, groundY) {
    this.camera.x = x;
    this.camera.groundY = groundY;
    this.place();
  }

  clear() {
    for (const child of this.world.removeChildren()) child.destroy({ children: true });
  }

  /**
   * Build a flat room from a tileset's "runs": a floor with fill beneath it,
   * and background masonry behind when the tileset has some.
   * @returns {{width: number, groundY: number}}
   */
  buildFlatRoom(tileset, columns = 40) {
    this.clear();
    const run = Object.values(tileset.runs ?? {}).find(r => r.below) ?? Object.values(tileset.runs ?? {})[0];
    const members = ref => tileset.groups?.[ref] ?? [ref];
    const pick = (ref, i) => tileset.tiles[members(ref)[(i * 7 + (i >> 2)) % members(ref).length]];
    // Background: mostly plain masonry, with an occasional recess.
    const plain = (back => back?.filter(id => !id.includes('recess')))(tileset.groups?.background);
    const backdrop = (col, row) => {
      const n = Math.abs((col * 73856093) ^ (row * 19349663));
      if (n % 17 === 0 && row > -6 && row < -1) return tileset.tiles[tileset.groups.background.find(id => id.includes('recess')) ?? plain[0]];
      return tileset.tiles[plain[n % plain.length]];
    };
    const place = (tile, col, row) => {
      if (!tile) return;
      const sprite = new Sprite(tile.texture);
      sprite.position.set(col * TILE, row * TILE);
      this.world.addChild(sprite);
    };
    const back = tileset.groups?.background;
    if (back) {
      for (let row = -8; row < 0; row++) for (let col = 0; col < columns; col++) place(backdrop(col, row), col, row);
    } else {
      const sky = new Graphics();
      sky.rect(0, -8 * TILE, columns * TILE, 8 * TILE).fill({ color: 0x0c1220 });
      this.world.addChild(sky);
    }
    for (let col = 0; col < columns; col++) {
      place(col === 0 ? pick(run.left, 0) : col === columns - 1 ? pick(run.right, 0) : pick(run.center, col), col, 0);
      for (let row = 1; row < 7; row++) place(pick(run.below ?? run.center, col + row), col, row);
    }
    this.actors = new Container();
    this.world.addChild(this.actors);
    this.bounds = { left: 0, right: columns * TILE };
    return { width: columns * TILE, groundY: 0 };
  }

  /** Add a sprite for a sheet entity; returns a view the caller updates each frame. */
  addActor(entity) {
    const pivot = entity.pivot ?? entity.sheet.pivot;
    const sprite = new Sprite(entity.animations.idle.frames[0]);
    sprite.pivot.set(pivot.x, pivot.y);
    this.actors.addChild(sprite);
    const drawnRight = entity.sheet.facing === 'right';
    return {
      sprite,
      /** Show one frame of an animation at a world position, facing 1 (right) or -1 (left). */
      show(slot, frame, x, y, facing) {
        const clip = entity.animations[slot];
        const mirror = (facing === 1) === drawnRight ? 1 : -1;
        const [dx, dy] = clip.offsets?.[frame] ?? [0, 0];
        sprite.texture = clip.frames[frame];
        sprite.scale.set(mirror, 1);
        sprite.position.set(Math.round(x + dx * mirror), Math.round(y + dy));
      },
    };
  }
}
