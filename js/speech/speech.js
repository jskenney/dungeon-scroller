// Speech output. Every line is shown as a speech bubble. The player can also
// have lines spoken: by the browser's own voice, or by Pocket TTS, a natural
// voice that runs in the browser after a one-time download (see pocket.js).

import { resolve } from '../config.js';
import { PocketVoice, voiceSpec } from './pocket.js';

const LATE = 4;            // seconds after which a line still not ready is dropped: its bubble has gone
const KEEP = 400;          // spoken lines kept in memory

/** Stage directions such as *snarl* are shown but not read out. */
const speakable = text => !/^\*.*\*$/.test(text);
const spoken = text => text.replace(/…/g, '. ');

export class Speech {
  /**
   * @param {import('../ui/bubbles.js').Bubbles} bubbles
   * @param {import('../settings.js').Settings} settings
   * @param {import('../audio/audio.js').AudioEngine} audio
   * @param {object} config  site configuration  @param {string} configUrl
   */
  constructor(bubbles, settings, audio, config, configUrl) {
    this.bubbles = bubbles;
    this.settings = settings;
    this.audio = audio;
    this.options = config.speech?.pocket ?? {};
    this.synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.pocket = new PocketVoice(this.options, configUrl, () => settings.pocketFullPrecision);
    this.clips = new Map();            // voice and text -> Promise of an AudioBuffer
    this.playing = new Map();          // actor -> the sound it is making
    this.pitches = new WeakMap();      // actor -> its own pitch, where the voice gives a range
    this.warned = new Set();           // voices already complained about
    this.wantsCloning = false;         // set from the catalogs: some character's voice is a recording
  }

  get canSpeakAloud() { return Boolean(this.synth); }
  get canUsePocket() { return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && this.options.enabled !== false; }

  /** Start Pocket TTS if the player has chosen it and agreed to its download. */
  start() {
    const s = this.settings;
    if (s.voiceMode === 'pocket' && s.pocketAgreed && this.canUsePocket) this.pocket.load(this.wantsCloning);
  }

  /** The voice a character speaks with: its own `voice` from the catalogs, else the site's default. */
  specFor(actor) {
    const voice = actor?.g?.voice ?? null;
    const spec = voiceSpec(voice, this.options.defaultVoice);
    if (spec.clip) {
      spec.clip = resolve(spec.clip, actor.entity?.catalogUrl ?? location.href);
      spec.key = `clip:${spec.clip}`;
      // A recording that cannot be used falls back to the named voice, or the site's default.
      spec.name ??= (this.options.defaultVoice ?? '').toLowerCase() || null;
    }
    return spec.key ? spec : null;
  }

  /** The audio for a line in a voice. It is made when the line is first spoken, and kept in case it is said again. */
  clip(text, spec, urgent = false) {
    const key = `${spec.key}|${text}`;
    if (!this.clips.has(key)) {
      const made = this.pocket.generate(spoken(text), spec, urgent).then(({ data, rate }) => {
        const buffer = this.audio.context.createBuffer(1, Math.max(1, data.length), rate);
        buffer.getChannelData(0).set(data);
        return buffer;
      });
      made.catch(error => {
        this.clips.delete(key);
        if (error.message !== 'no longer needed' && !this.warned.has(spec.key)) { this.warned.add(spec.key); console.warn(`Pocket TTS: ${error.message}`); }
      });
      this.clips.set(key, made);
      if (this.clips.size > KEEP) this.clips.delete(this.clips.keys().next().value);
    }
    return this.clips.get(key);
  }

  /** Say a line as an actor. */
  say(actor, text) {
    this.bubbles.say(actor, text);
    const s = this.settings;
    if (s.muted || !speakable(text)) return;
    if (s.voiceMode === 'pocket' && this.pocket.ready) { this.sayWithPocket(actor, text); return; }
    if (s.voiceMode !== 'browser' || !this.synth) return;
    const utterance = new SpeechSynthesisUtterance(spoken(text));
    utterance.volume = s.volume('voice') * s.volume('master');
    utterance.pitch = actor.boss ? 0.3 : actor.team === 'enemy' ? 0.6 : 1;
    utterance.rate = actor.boss ? 0.8 : 1;
    this.synth.speak(utterance);
  }

  /**
   * How high or low a character speaks. A single number is used as it is. A range, [low, high],
   * gives each individual its own pitch, chosen once, so two skeletons do not sound alike.
   */
  pitchFor(actor, spec) {
    let pitch = spec.pitch;
    if (Array.isArray(pitch)) {
      if (!this.pitches.has(actor)) this.pitches.set(actor, pitch[0] + Math.random() * (pitch[1] - pitch[0]));
      pitch = this.pitches.get(actor);
    }
    return Math.max(0.5, Math.min(2, Number(pitch) || 1));
  }

  sayWithPocket(actor, text) {
    const context = this.audio.context, spec = this.specFor(actor);
    if (!spec || !context || context.state !== 'running') return;
    const asked = context.currentTime;
    this.clip(text, spec, true).then(buffer => {
      // A line that took too long would be heard after its bubble has gone.
      if (context.currentTime - asked > LATE || this.settings.voiceMode !== 'pocket') return;
      this.playing.get(actor)?.stop();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = this.pitchFor(actor, spec);
      source.connect(this.audio.bus.voice);
      source.onended = () => { if (this.playing.get(actor) === source) this.playing.delete(actor); };
      this.playing.set(actor, source);
      source.start();
    }).catch(() => {});
  }

  stop() {
    this.bubbles.clear();
    this.synth?.cancel();
    for (const source of this.playing.values()) { try { source.stop(); } catch { /* already ended */ } }
    this.playing.clear();
    this.pocket.clearQueue();
  }

  /** The player changed precision: the other model has to be loaded, and old audio no longer matches. */
  reload() {
    this.clips.clear();
    this.pocket.unload();
    this.start();
  }
}
