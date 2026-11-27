// Pocket TTS: a natural voice that runs in the player's browser.
// Kyutai's Pocket TTS model, through pocket-tts-js and ONNX Runtime Web, in a
// Web Worker (WebAssembly, on the CPU). The same pinned versions and the same
// way of talking to the worker as the EPUB reader this was taken from.
//
// Files come from a folder on this site (speech.pocket.files, filled by
// tools/fetch-pocket.sh, and shareable with the reader) when the whole of a
// part is there, and otherwise from jsDelivr and Hugging Face if the site
// allows that. Nothing is downloaded until the player chooses this voice.

import { resolve } from '../config.js';

export const POCKET = {
  lib: 'https://cdn.jsdelivr.net/npm/pocket-tts-js@0.1.0/src/',
  ort: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/',
  model: 'https://huggingface.co/vlapky/pocket-tts-onnx/resolve/c469236dbc5f68287fa2fbf175b66de3b80123af/onnx',
  bundle: 'english_2026-04',
  megabytes: { full: 431, int8: 170 },      // what the player downloads, as the reader measures it
  cacheName: 'pocket-tts-js-v1',            // the same store the reader uses, so one download serves both on one site
};
const MODELS = ['text_conditioner', 'flow_lm_main', 'flow_lm_flow', 'mimi_decoder'];
const CLONE_SECONDS = 10;                   // the model uses at most this much of a recording

/** Is there a real file here, and not a "not found" page? Reads only the first bytes. */
async function realFile(url) {
  try {
    const sameSite = new URL(url, location.href).origin === location.origin;
    const r = await fetch(url, { cache: 'no-store', ...(sameSite && { headers: { Range: 'bytes=0-63' } }) });
    const html = (r.headers.get('content-type') ?? '').includes('text/html');
    r.body?.cancel().catch(() => {});
    return r.ok && !html;
  } catch { return false; }
}
const allReal = async (base, names) => (await Promise.all(names.map(n => realFile(base + n)))).every(Boolean);

/** What a character's `voice` setting asks for: a built-in voice by name, or a recording to copy. */
export function voiceSpec(voice, fallback) {
  const v = typeof voice === 'string' ? { name: voice } : voice ?? {};
  const name = (v.name ?? fallback ?? '').toLowerCase() || null;
  return { name, clip: v.clip ?? null, pitch: v.pitch ?? 1, key: v.clip ? `clip:${v.clip}` : name };
}

export class PocketVoice {
  /**
   * @param {object} options  speech.pocket from the site configuration
   * @param {string} configUrl  where that configuration was loaded from (paths are relative to it)
   * @param {() => boolean} fullPrecision  whether the larger, full-precision model is wanted
   */
  constructor(options, configUrl, fullPrecision) {
    this.options = options ?? {};
    this.local = new URL(resolve(this.options.files ?? 'pocket/', configUrl), location.href).href.replace(/\/?$/, '/');
    this.fullPrecision = fullPrecision;
    this.state = 'idle';               // idle | loading | ready | error
    this.error = '';
    this.progress = '';
    this.voices = [];                  // names of the built-in voices
    this.sampleRate = 24000;
    this.cloning = false;              // whether recordings can be copied (the encoder was loaded)
    this.onChange = null;              // called whenever state or progress changes
    this.worker = null;
    this.pending = new Map();
    this.nextId = 1;
    this.files = {};
    this.refs = new Map();             // voice key -> the worker's reference for it
    this.jobs = [];                    // lines waiting to be spoken into audio
    this.busy = false;
    this.collect = null;
  }

  get megabytes() { return POCKET.megabytes[this.fullPrecision() ? 'full' : 'int8']; }
  get ready() { return this.state === 'ready'; }

  changed() { this.onChange?.(); }

  startWorker(lib) {
    // The library's worker is imported into a small worker of our own: a worker
    // can only be started from this site, and the library may be on a CDN.
    // Messages that arrive before it has loaded are kept and handed over.
    const source = `const queued = []; self.onmessage = e => queued.push(e.data);
import(${JSON.stringify(lib + 'worker.js')}).then(() => { for (const data of queued) self.onmessage({ data }); }, e => setTimeout(() => { throw e; }));`;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const w = new Worker(url, { type: 'module' });
    const revoke = () => URL.revokeObjectURL(url);
    w.addEventListener('message', revoke, { once: true });
    w.addEventListener('error', revoke, { once: true });
    w.onmessage = ({ data: m }) => {
      if (m.type === 'progress') {
        if (m.label && m.total) this.files[m.label] = { loaded: m.loaded || 0, total: m.total };
        const all = Object.values(this.files), total = all.reduce((a, f) => a + f.total, 0);
        const loaded = all.reduce((a, f) => a + Math.min(f.loaded, f.total), 0);
        this.progress = total > 2e6 ? `Downloading… ${Math.round(loaded / 1048576)} of about ${this.megabytes} MB` : 'Loading…';
        this.changed();
      } else if (m.type === 'ready') {
        this.bundle = m.bundle;
      } else if (m.type === 'chunk') {
        this.collect?.push(m.audio);
      } else if (m.type === 'result' || m.type === 'error') {
        const job = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.type === 'result') job?.res(m.result); else job?.rej(new Error(m.error));
      }
    };
    w.onerror = w.onmessageerror = e => {
      if (this.worker !== w) return;
      for (const j of this.pending.values()) j.rej(new Error(e.message || 'the voice stopped working'));
      this.pending.clear();
      this.fail(`the voice stopped working (${e.message || 'its worker failed'})`);
    };
    return w;
  }

  request(type, payload, transfer = []) {
    if (!this.worker) return Promise.reject(new Error(this.error || 'the voice is not loaded'));
    const id = this.nextId++;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.worker.postMessage({ id, type, payload }, transfer); });
  }

  fail(message) {
    this.state = 'error'; this.error = message;
    this.worker?.terminate(); this.worker = null;
    this.jobs.length = 0; this.busy = false;
    this.changed();
  }

  /**
   * Download (the first time) and start the model.
   * @param {boolean} wantCloning  some character's voice is a recording, so the encoder is needed too
   */
  async load(wantCloning = false) {
    if (this.state === 'loading' || this.state === 'ready') return;
    this.state = 'loading'; this.error = ''; this.progress = 'Loading…'; this.files = {};
    this.changed();
    const q = this.fullPrecision() ? '' : '_int8', dir = `model/${POCKET.bundle}/`;
    const [lib, ort, model] = await Promise.all([
      allReal(this.local + 'lib/', ['worker.js', 'binary.js', 'tokenizer.js']),
      allReal(this.local + 'ort/', ['ort.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']),
      allReal(this.local + dir, ['bundle.json', 'tokenizer.model', 'voices.bin', ...MODELS.map(f => f + q + '.onnx')])]);
    const cdn = this.options.allowCdn !== false;
    if (!cdn && !(lib && ort && model)) {
      this.fail(`the Pocket TTS files are not on this site (run tools/fetch-pocket.sh${q ? '' : ' --full'}), and downloading them from elsewhere is switched off`);
      return;
    }
    // Copying a recording needs one more model file. A site copy without it still speaks; recordings are then skipped.
    const cloning = wantCloning && (!model || await realFile(`${this.local}${dir}mimi_encoder${q}.onnx`));
    if (wantCloning && !cloning) console.warn('Pocket TTS: custom voices need the voice encoder, which is not in this site\'s copy (tools/fetch-pocket.sh --cloning). Those characters use their fallback voice.');
    try {
      this.worker?.terminate(); this.pending.clear(); this.refs.clear();
      this.worker = this.startWorker(lib ? this.local + 'lib/' : POCKET.lib);
      await this.request('init', { language: POCKET.bundle, quantized: !this.fullPrecision(), voiceCloning: cloning,
        modelBaseUrl: model ? this.local + 'model' : POCKET.model, ortBaseUrl: ort ? this.local + 'ort/' : POCKET.ort,
        voicesUrl: null, maxThreads: 8, cache: true, cacheName: POCKET.cacheName });
      this.voices = this.bundle?.predefinedVoices ?? [];
      this.sampleRate = this.bundle?.sampleRate ?? 24000;
      this.cloning = cloning;
      this.state = 'ready'; this.progress = '';
      this.changed();
      this.pump();
    } catch (error) {
      this.fail(error.message);
    }
  }

  /** Stop and forget the model (it stays in the browser's storage), for example to load the other precision. */
  unload() {
    this.worker?.terminate(); this.worker = null;
    for (const j of this.pending.values()) j.rej(new Error('the voice was reloaded'));
    this.pending.clear(); this.refs.clear(); this.jobs.length = 0; this.busy = false;
    this.state = 'idle'; this.progress = ''; this.error = '';
    this.changed();
  }

  /** The worker's reference for a voice: a built-in one by name, or one copied from a recording. */
  async reference(spec) {
    if (this.refs.has(spec.key)) return this.refs.get(spec.key);
    let ref = null;
    if (spec.clip && this.cloning) {
      try {
        const response = await fetch(spec.clip);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        // Decoding in a context at the model's rate resamples the recording for us.
        const decoder = new OfflineAudioContext(1, 1, this.sampleRate);
        const buffer = await decoder.decodeAudioData(await response.arrayBuffer());
        const length = Math.min(buffer.length, this.sampleRate * CLONE_SECONDS), mono = new Float32Array(length);
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          const data = buffer.getChannelData(c);
          for (let i = 0; i < length; i++) mono[i] += data[i] / buffer.numberOfChannels;
        }
        ref = (await this.request('cloneVoice', { audio: mono, ref: spec.key }, [mono.buffer])).ref;
      } catch (error) {
        console.warn(`Pocket TTS: the recording ${spec.clip} could not be used (${error.message}); using "${spec.name}" instead.`);
      }
    }
    if (!ref) {
      const name = this.voices.includes(spec.name) ? spec.name : null;
      if (!name) throw new Error(`there is no built-in voice called "${spec.name}"`);
      ref = (await this.request('loadBuiltinVoice', { name })).ref;
    }
    this.refs.set(spec.key, ref);
    return ref;
  }

  /**
   * Turn a line into audio. Lines are done one at a time; `urgent` ones go first.
   * @returns {Promise<{data: Float32Array, rate: number}>}
   */
  generate(text, spec, urgent = false) {
    return new Promise((res, rej) => {
      const job = { text, spec, res, rej };
      if (urgent) this.jobs.unshift(job); else this.jobs.push(job);
      this.pump();
    });
  }

  async pump() {
    if (this.busy || !this.ready) return;
    this.busy = true;
    while (this.jobs.length && this.ready) {
      const job = this.jobs.shift();
      try {
        const voiceRef = await this.reference(job.spec);
        this.collect = [];
        try { await this.request('generate', { text: job.text, voiceRef }); }
        finally { var parts = this.collect; this.collect = null; }
        const data = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
        let at = 0;
        for (const p of parts) { data.set(p, at); at += p.length; }
        job.res({ data, rate: this.sampleRate });
      } catch (error) {
        job.rej(error);
      }
    }
    this.busy = false;
  }

  /** Drop lines that have not been started (a level was left). */
  clearQueue() {
    for (const job of this.jobs.splice(0)) job.rej(new Error('no longer needed'));
  }
}
