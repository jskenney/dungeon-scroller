// The game canvas: a PixiJS stage that fills the window, a camera with
// whole-pixel zoom, level tiles, actor sprites and a debug overlay.

import { Application, Container, Graphics, Sprite } from '../../vendor/pixi.min.mjs';
import { TILE, slopeSurface } from '../level/level.js';

export class Stage {
  /** @param {HTMLCanvasElement} canvas @param {import('../settings.js').Settings} settings */
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.app = new Application();
    this.world = new Container();
    this.camera = { x: 0, y: 0 };
    this.bounds = { left: 0, top: 0, right: TILE * 10, bottom: TILE * 8 };
    this.scale = 1;             // CSS pixels per world pixel
    this.perPixel = 1;          // device pixels per world pixel
    this.onTick = null;         // (seconds) => void
    this.debug = false;
    this.level = null;
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
      this.onTick?.(Math.min(ticker.deltaMS, 100) / 1000);
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

  /** Position the world so the camera point is centred, without showing past the level's edges. */
  place() {
    const { width, height } = this.app.screen;
    const halfW = width / 2 / this.scale, halfH = height / 2 / this.scale;
    const b = this.bounds;
    const x = b.right - b.left <= halfW * 2 ? (b.left + b.right) / 2
      : Math.max(b.left + halfW, Math.min(b.right - halfW, this.camera.x));
    // A level shorter than the window sits at the bottom of it.
    const y = b.bottom - b.top <= halfH * 2 ? b.bottom - halfH
      : Math.max(b.top + halfH, Math.min(b.bottom - halfH, this.camera.y));
    this.world.position.set(this.snap(width / 2 - x * this.scale), this.snap(height / 2 - y * this.scale));
  }

  /**
   * Move the camera toward a point. Horizontal movement is immediate;
   * vertical movement eases so stairs and jumps do not jolt the view.
   */
  follow(x, y, dt = 0, immediate = false) {
    this.camera.x = x;
    this.camera.y = immediate ? y : this.camera.y + (y - this.camera.y) * Math.min(1, dt * 6);
    this.place();
  }

  clear() {
    for (const child of this.world.removeChildren()) child.destroy({ children: true });
    this.actors = this.debugLayer = this.debugLive = null;
  }

  /** Draw a level's tile layers and prepare the actor and debug layers. */
  showLevel(level) {
    this.clear();
    this.level = level;
    const tiles = level.tileset.tiles;
    const textures = level.palette.map(id => (id ? tiles[id]?.texture : null));
    const drawLayer = rows => {
      const layer = new Container();
      if (!rows) return layer;
      for (let row = 0; row < level.rows; row++) {
        for (let col = 0; col < level.cols; col++) {
          const texture = textures[rows[row][col]];
          if (!texture) continue;
          const sprite = new Sprite(texture);
          sprite.position.set(col * TILE, row * TILE);
          layer.addChild(sprite);
        }
      }
      layer.cullable = true;
      return layer;
    };
    this.actors = new Container();
    this.debugLayer = new Graphics();
    this.debugLive = new Graphics();
    this.world.addChild(drawLayer(level.layers.background), drawLayer(level.layers.terrain), this.actors,
      drawLayer(level.layers.foreground), this.debugLayer, this.debugLive);
    this.bounds = { left: 0, top: 0, right: level.width, bottom: level.height };
    this.drawCollision();
  }

  setDebug(on) {
    this.debug = on;
    this.drawCollision();
    if (!on) this.debugLive?.clear();
  }

  /** Outline every collision shape in the level (debug overlay). */
  drawCollision() {
    const g = this.debugLayer, level = this.level;
    if (!g || !level) return;
    g.clear();
    if (!this.debug) return;
    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        const cell = level.cellAt(col, row);
        if (!cell) continue;
        const ox = col * TILE, oy = row * TILE;
        if (cell.kind === 'slope') {
          const s = { l: ox, t: oy, r: ox + TILE, b: oy + TILE, dir: cell.dir };
          g.poly([ox, slopeSurface(s, ox), ox + TILE, slopeSurface(s, ox + TILE), ox + TILE, oy + TILE, ox, oy + TILE])
            .fill({ color: 0xc084fc, alpha: 0.25 }).stroke({ width: 1, color: 0xc084fc });
          continue;
        }
        const color = cell.kind === 'platform' ? 0x5ac8fa : 0xef6b6b;
        for (const q of cell.rects) {
          g.rect(ox + q[0], oy + q[1], q[2] - q[0], q[3] - q[1]).fill({ color, alpha: 0.2 }).stroke({ width: 1, color });
        }
      }
    }
  }

  /** Outline a body box (debug overlay). Call once per frame after clearing. */
  drawBody(x, y, w, h, color = 0x63c98a) {
    if (!this.debug || !this.debugLive) return;
    this.debugLive.rect(x - w / 2, y - h, w, h).stroke({ width: 1, color })
      .moveTo(x - 4, y).lineTo(x + 4, y).stroke({ width: 1, color: 0xe0b354 });
  }

  /** Add a sprite for a sheet entity; returns a view the caller updates each frame. */
  addActor(entity, artShift = 0) {
    const pivot = entity.pivot ?? entity.sheet.pivot;
    const sprite = new Sprite(entity.animations.idle.frames[0]);
    sprite.pivot.set(pivot.x, pivot.y);
    this.actors.addChild(sprite);
    const drawnRight = entity.sheet.facing === 'right';
    return {
      sprite,
      /**
       * Show one frame of an animation with the actor's feet at (x, y), facing 1 or -1.
       * artShift moves the art so the body box, not the cell centre, sits on x.
       */
      show(slot, frame, x, y, facing) {
        const clip = entity.animations[slot];
        const mirror = (facing === 1) === drawnRight ? 1 : -1;
        const [dx, dy] = clip.offsets?.[frame] ?? [0, 0];
        sprite.texture = clip.frames[frame];
        sprite.scale.set(mirror, 1);
        sprite.position.set(Math.round(x + dx * mirror + artShift * facing), Math.round(y + dy));
      },
    };
  }
}
