// Sound: three buses (music, effects, voice) under a master volume.
// Effects come from the files listed in data/audio.json; a cue with no file
// plays a synthesized stand-in. Music cross-fades between tracks; a track is
// either a sound file, which streams, or a MIDI file, which is played by a
// built-in piano-like voice.
//
// Browsers only allow sound after the user has pressed or clicked something,
// so the audio context is created on the first such moment.

import { resolve } from '../config.js';
import { playStandIn, STAND_INS } from './synth.js';
import { parseMidi, MidiPlayer } from './midi.js';

export class AudioEngine {
  /**
   * @param {object} config    site configuration
   * @param {import('../settings.js').Settings} settings
   * @param {object|null} catalog  parsed data/audio.json, or null
   * @param {string} catalogUrl
   */
  constructor(config, settings, catalog, catalogUrl) {
    this.config = config; this.settings = settings;
    this.catalog = catalog ?? { sounds: {}, music: {} };
    this.catalogUrl = catalogUrl;
    this.context = null;
    this.buffers = new Map();          // cue -> decoded AudioBuffer
    this.lastPlayed = new Map();       // cue -> time, to stop one cue stacking up
    this.track = null;                 // {id, stop()} currently playing
    this.songs = new Map();            // url -> parsed MIDI song
    this.lastTune = new Map();         // music id -> the playlist entry played most recently
    this.wanted = null;                // music id asked for before sound was unlocked
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    settings.onChange(() => this.applyVolumes());
  }

  get standIns() { return this.config.audio?.standIn !== false; }

  unlock() {
    if (this.context) { if (this.context.state === 'suspended') this.context.resume(); return; }
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.connect(this.context.destination);
    this.bus = { music: this.context.createGain(), sfx: this.context.createGain(), voice: this.context.createGain() };
    for (const node of Object.values(this.bus)) node.connect(this.master);
    this.applyVolumes();
    this.loadFiles();
    if (this.wanted) this.music(this.wanted);
  }

  applyVolumes() {
    if (!this.context) return;
    const s = this.settings, now = this.context.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.volume('master'), now, 0.02);
    for (const name of ['music', 'sfx', 'voice']) this.bus[name].gain.setTargetAtTime(s.volume(name), now, 0.02);
  }

  /** Fetch and decode every effect file the catalog lists. Missing files fall back to stand-ins. */
  async loadFiles() {
    for (const [cue, entry] of Object.entries(this.catalog.sounds ?? {})) {
      const file = (entry?.files ?? []).find(f => this.canPlay(f));
      if (!file) continue;
      try {
        const response = await fetch(resolve(file, this.catalogUrl));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.buffers.set(cue, { buffer: await this.context.decodeAudioData(await response.arrayBuffer()), volume: entry.volume ?? 1 });
      } catch (error) {
        console.warn(`Sound "${cue}" (${file}) could not be loaded: ${error.message}`);
      }
    }
  }

  canPlay(file) {
    const type = { ogg: 'audio/ogg', opus: 'audio/ogg; codecs=opus', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', flac: 'audio/flac' }[file.split('.').pop().toLowerCase()];
    return Boolean(type) && new Audio().canPlayType(type) !== '';
  }

  /**
   * Play an effect.
   * @param {string} cue
   * @param {{pan?: number, volume?: number}} [options]  pan from -1 (left) to 1 (right)
   */
  play(cue, { pan = 0, volume = 1 } = {}) {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    // The same cue many times in one instant is just louder noise.
    const last = this.lastPlayed.get(cue) ?? -1;
    if (context.currentTime - last < 0.04) return;
    this.lastPlayed.set(cue, context.currentTime);
    let out = this.bus.sfx;
    if (pan && context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      panner.connect(this.bus.sfx);
      out = panner;
    }
    const loaded = this.buffers.get(cue);
    if (loaded) {
      const source = context.createBufferSource(), amp = context.createGain();
      source.buffer = loaded.buffer;
      source.playbackRate.value = 0.96 + Math.random() * 0.08;      // slight variation so repeats do not grate
      amp.gain.value = loaded.volume * volume;
      source.connect(amp).connect(out);
      source.start();
    } else if (this.standIns && STAND_INS[cue]) {
      playStandIn(context, out, cue, volume);
    }
  }

  /** Switch to a music track by id (as named in the catalog), cross-fading. null stops the music. */
  music(id) {
    this.wanted = id;
    if (!this.context || this.track?.id === id) return;
    const context = this.context, now = context.currentTime;
    if (this.track) { this.track.stop(); this.track = null; }
    const entry = id ? this.catalog.music?.[id] : null;
    if (entry?.playlist?.length) { this.playList(id, entry); return; }
    const file = (entry?.files ?? []).find(f => this.canPlay(f));
    if (!file) return;
    const element = new Audio(resolve(file, this.catalogUrl));
    element.loop = true; element.crossOrigin = 'anonymous';
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(entry.volume ?? 1, now, 0.6);
    context.createMediaElementSource(element).connect(gain).connect(this.bus.music);
    element.play().catch(() => {});
    this.track = { id, stop: () => {
      gain.gain.setTargetAtTime(0, context.currentTime, 0.4);
      setTimeout(() => { element.pause(); element.src = ''; }, 2000);
    } };
  }

  /**
   * Play the MIDI files of a playlist one after another for as long as this
   * music is wanted. 'shuffle' picks at random without repeating a piece
   * straight away; otherwise they play in the order listed.
   */
  playList(id, entry) {
    const player = new MidiPlayer(this.context, this.bus.music);
    const track = { id, stop: () => player.stop() };
    this.track = track;
    const list = entry.playlist;
    const pick = () => {
      const last = this.lastTune.get(id) ?? -1;
      let index = (last + 1) % list.length;
      if (entry.order === 'shuffle' && list.length > 1) do { index = Math.floor(Math.random() * list.length); } while (index === last);
      this.lastTune.set(id, index);
      return list[index];
    };
    const next = async () => {
      const url = resolve(pick(), this.catalogUrl);
      try {
        if (!this.songs.has(url)) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          this.songs.set(url, parseMidi(await response.arrayBuffer()));
        }
        if (this.track !== track) return;                    // something else was asked for while this loaded
        player.play(this.songs.get(url), { volume: entry.volume ?? 1, loop: list.length === 1, onEnd: next });
      } catch (error) {
        console.warn(`Music "${id}" (${url}) could not be played: ${error.message}`);
      }
    };
    next();
  }

  /** The music id for a moment in the game: 'title', 'boss', 'complete', or a level's tileset. */
  musicFor(moment, tilesetId) {
    const m = this.catalog.music ?? {};
    if (moment === 'level') return m[`level:${tilesetId}`] ? `level:${tilesetId}` : m.level ? 'level' : null;
    return m[moment] ? moment : null;
  }
}
