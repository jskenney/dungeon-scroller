// Reads a Standard MIDI File into a plain list of notes with times in seconds,
// and plays such a list through Web Audio with a simple piano-like voice.
// The reader is pure (no browser APIs), so it can be tested on its own.

/**
 * @param {ArrayBuffer|Uint8Array} data  the bytes of a .mid file
 * @returns {{duration: number, notes: {t: number, d: number, n: number, v: number, ch: number}[], names: string[]}}
 *   t = start and d = length in seconds, n = MIDI note number (60 is middle C), v = loudness 0–1.
 */
export function parseMidi(data) {
  const b = data instanceof Uint8Array ? data : new Uint8Array(data);
  const text = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  const u32 = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const u16 = i => (b[i] << 8) | b[i + 1];
  if (text(0, 4) !== 'MThd') throw new Error('Not a MIDI file.');
  const trackCount = u16(10), division = u16(12);
  if (division & 0x8000) throw new Error('MIDI files timed in video frames are not supported.');
  let at = 8 + u32(4);
  const tempos = [{ tick: 0, us: 500000 }];      // microseconds per quarter note; 120 beats a minute until told otherwise
  const raw = [], names = [];
  let lastTick = 0;
  for (let t = 0; t < trackCount && at < b.length; t++) {
    if (text(at, 4) !== 'MTrk') throw new Error('Damaged MIDI file: a track is missing.');
    const end = at + 8 + u32(at + 4);
    let i = at + 8, tick = 0, status = 0;
    const held = new Map();                      // channel*128+note -> the note still sounding
    const pedal = new Map();                     // channel -> notes released while the sustain pedal is down
    const varLen = () => { let v = 0, c; do { c = b[i++]; v = (v << 7) | (c & 127); } while (c & 128); return v; };
    const finish = (note, when) => { note.end = Math.max(when, note.tick + 1); };
    const release = (ch, n) => {
      const key = ch * 128 + n, note = held.get(key);
      if (!note) return;
      held.delete(key);
      if (pedal.has(ch)) pedal.get(ch).push(note); else finish(note, tick);
    };
    while (i < end) {
      tick += varLen();
      const first = b[i];
      if (first === 0xff) {
        const type = b[i + 1]; i += 2;
        const length = varLen();
        if (type === 0x51) tempos.push({ tick, us: (b[i] << 16) | (b[i + 1] << 8) | b[i + 2] });
        else if (type === 0x03) names.push(text(i, length).trim());
        i += length;
      } else if (first === 0xf0 || first === 0xf7) {
        i++; i += varLen();
      } else {
        if (first & 0x80) { status = first; i++; }
        const kind = status & 0xf0, ch = status & 15, a = b[i++];
        if (kind === 0xc0 || kind === 0xd0) continue;        // instrument change, pressure: one data byte, not used
        const v = b[i++];
        if (kind === 0x90 && v > 0) {
          release(ch, a);
          const note = { tick, end: null, n: a, v: v / 127, ch };
          held.set(ch * 128 + a, note); raw.push(note);
        } else if (kind === 0x80 || kind === 0x90) {
          release(ch, a);
        } else if (kind === 0xb0 && a === 64) {              // sustain pedal
          if (v >= 64) { if (!pedal.has(ch)) pedal.set(ch, []); }
          else if (pedal.has(ch)) { for (const note of pedal.get(ch)) finish(note, tick); pedal.delete(ch); }
        }
      }
    }
    for (const note of held.values()) finish(note, tick);
    for (const list of pedal.values()) for (const note of list) finish(note, tick);
    lastTick = Math.max(lastTick, tick);
    at = end;
  }
  // Ticks to seconds, through every change of tempo.
  tempos.sort((p, q) => p.tick - q.tick);
  const marks = [];
  let seconds = 0;
  tempos.forEach((tempo, k) => {
    if (k) seconds += ((tempo.tick - tempos[k - 1].tick) * tempos[k - 1].us) / division / 1e6;
    marks.push({ tick: tempo.tick, seconds, us: tempo.us });
  });
  const toSeconds = tick => {
    let m = marks[0];
    for (const mark of marks) { if (mark.tick <= tick) m = mark; else break; }
    return m.seconds + ((tick - m.tick) * m.us) / division / 1e6;
  };
  const notes = raw.map(r => { const t = toSeconds(r.tick); return { t, d: toSeconds(r.end) - t, n: r.n, v: r.v, ch: r.ch }; })
    .sort((p, q) => p.t - q.t);
  const lastNote = notes.reduce((m, n) => Math.max(m, n.t + n.d), 0);
  return { duration: Math.max(lastNote, toSeconds(lastTick)), notes, names };
}

/** Plays a parsed song. Notes are handed to the audio clock a little ahead of time, so playback stays even. */
export class MidiPlayer {
  /** @param {AudioContext} context  @param {AudioNode} out  where the sound goes */
  constructor(context, out) {
    this.context = context;
    this.gain = context.createGain();
    // Soften the top end: bare oscillators are harsher than a real instrument.
    this.tone = context.createBiquadFilter();
    this.tone.type = 'lowpass'; this.tone.frequency.value = 3200; this.tone.Q.value = 0.3;
    this.tone.connect(this.gain).connect(out);
    this.timer = null;
  }

  /**
   * @param {{duration: number, notes: object[]}} song
   * @param {{volume?: number, loop?: boolean, onEnd?: () => void}} [options]
   */
  play(song, { volume = 1, loop = false, onEnd = null } = {}) {
    const context = this.context;
    this.gain.gain.cancelScheduledValues(context.currentTime);
    this.gain.gain.value = 0;
    this.gain.gain.setTargetAtTime(volume, context.currentTime, 0.5);
    let origin = context.currentTime + 0.25, next = 0;
    const AHEAD = 1.6, GAP = 2.5;                 // seconds scheduled in advance; pause before a repeat
    const pump = () => {
      const horizon = context.currentTime + AHEAD;
      while (next < song.notes.length && origin + song.notes[next].t < horizon) this.strike(song.notes[next++], origin);
      if (next >= song.notes.length && context.currentTime > origin + song.duration + GAP) {
        if (loop) { origin = context.currentTime + 0.25; next = 0; }
        else { this.halt(); onEnd?.(); }
      }
    };
    this.halt();
    this.timer = setInterval(pump, 200);
    pump();
  }

  /** One note: two tones an octave apart that start sharply and die away, quicker for high notes. */
  strike(note, origin) {
    const context = this.context, start = Math.max(context.currentTime, origin + note.t);
    const frequency = 440 * 2 ** ((note.n - 69) / 12);
    const ring = Math.max(0.5, 3.2 - (note.n - 30) * 0.035);          // seconds for the tone to fade while held
    const stop = start + Math.min(note.d, ring * 2.5) + 0.35;
    const amp = context.createGain(), peak = 0.16 * note.v * note.v + 0.02;
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(peak, start + 0.006);
    amp.gain.setTargetAtTime(peak * 0.12, start + 0.006, ring / 3);
    amp.gain.setTargetAtTime(0, Math.max(start + 0.02, stop - 0.35), 0.07);
    amp.connect(this.tone);
    for (const [type, multiple, level] of [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.1]]) {
      const osc = context.createOscillator(), part = context.createGain();
      osc.type = type; osc.frequency.value = frequency * multiple;
      part.gain.value = level;
      osc.connect(part).connect(amp);
      osc.start(start); osc.stop(stop);
    }
  }

  halt() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  /** Fade out and stop. Notes already handed to the audio clock die away under the fade. */
  stop() {
    this.halt();
    this.gain.gain.cancelScheduledValues(this.context.currentTime);
    this.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.3);
    setTimeout(() => this.tone.disconnect(), 2500);
  }
}
