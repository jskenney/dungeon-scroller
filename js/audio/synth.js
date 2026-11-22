// Stand-in sound effects, synthesized in the browser. They are used for any
// cue that has no sound file listed in data/audio.json, so the game is not
// silent before real effects exist. Each cue is a few tones and noise bursts.
//
// tone:  [ 'tone', wave, startHz, endHz, seconds, gain, delaySeconds ]
// noise: [ 'noise', startHz, endHz, seconds, gain, delaySeconds ]   (filtered noise, sweeping)

export const STAND_INS = {
  jump: [['tone', 'sine', 320, 620, 0.11, 0.25, 0]],
  land: [['noise', 500, 120, 0.07, 0.3, 0]],
  swing: [['noise', 900, 2600, 0.11, 0.22, 0]],
  shoot: [['tone', 'square', 760, 300, 0.13, 0.12, 0], ['noise', 3000, 800, 0.08, 0.12, 0]],
  cast: [['tone', 'sine', 500, 900, 0.16, 0.2, 0], ['tone', 'sine', 750, 1350, 0.16, 0.12, 0.04]],
  heal: [['tone', 'sine', 523, 523, 0.12, 0.2, 0], ['tone', 'sine', 659, 659, 0.12, 0.2, 0.09], ['tone', 'sine', 784, 784, 0.2, 0.2, 0.18]],
  hit: [['noise', 1800, 400, 0.07, 0.3, 0], ['tone', 'square', 190, 120, 0.07, 0.14, 0]],
  hurt: [['tone', 'sawtooth', 420, 140, 0.22, 0.2, 0], ['noise', 900, 300, 0.1, 0.2, 0]],
  defeat: [['tone', 'square', 300, 90, 0.28, 0.14, 0], ['noise', 700, 150, 0.25, 0.2, 0.03]],
  coin: [['tone', 'square', 988, 988, 0.05, 0.1, 0], ['tone', 'square', 1319, 1319, 0.14, 0.1, 0.05]],
  pickup: [['tone', 'sine', 600, 1100, 0.14, 0.2, 0]],
  key: [['tone', 'triangle', 880, 880, 0.06, 0.2, 0], ['tone', 'triangle', 1175, 1175, 0.06, 0.2, 0.07], ['tone', 'triangle', 1568, 1568, 0.14, 0.2, 0.14]],
  chest: [['tone', 'triangle', 180, 260, 0.2, 0.25, 0], ['tone', 'sine', 880, 1320, 0.25, 0.15, 0.15]],
  break: [['noise', 2400, 300, 0.22, 0.35, 0], ['tone', 'square', 140, 70, 0.12, 0.15, 0]],
  lever: [['tone', 'square', 240, 160, 0.05, 0.18, 0], ['noise', 1200, 500, 0.05, 0.18, 0.05]],
  gate: [['noise', 300, 700, 0.6, 0.25, 0], ['tone', 'sawtooth', 70, 110, 0.6, 0.12, 0]],
  locked: [['tone', 'square', 160, 160, 0.07, 0.15, 0], ['tone', 'square', 130, 130, 0.1, 0.15, 0.1]],
  checkpoint: [['tone', 'triangle', 523, 523, 0.1, 0.2, 0], ['tone', 'triangle', 784, 784, 0.1, 0.2, 0.1], ['tone', 'triangle', 1047, 1047, 0.25, 0.2, 0.2]],
  shrine: [['tone', 'sine', 440, 880, 0.5, 0.18, 0], ['tone', 'sine', 660, 1320, 0.5, 0.12, 0.05]],
  teleport: [['tone', 'sine', 300, 1500, 0.3, 0.16, 0], ['noise', 4000, 1500, 0.25, 0.08, 0]],
  fall: [['tone', 'sawtooth', 500, 80, 0.7, 0.2, 0]],
  respawn: [['tone', 'sine', 300, 900, 0.35, 0.18, 0]],
  alert: [['tone', 'square', 220, 330, 0.09, 0.08, 0]],
  growl: [['tone', 'sawtooth', 110, 70, 0.3, 0.2, 0], ['noise', 400, 200, 0.3, 0.15, 0]],
  boss: [['tone', 'sawtooth', 55, 55, 1.0, 0.3, 0], ['tone', 'sawtooth', 82, 82, 1.0, 0.18, 0], ['noise', 200, 900, 0.8, 0.18, 0.1]],
  phase: [['tone', 'sawtooth', 90, 220, 0.5, 0.25, 0], ['noise', 300, 1600, 0.5, 0.22, 0]],
  shockwave: [['noise', 1400, 90, 0.55, 0.4, 0], ['tone', 'sine', 90, 40, 0.5, 0.3, 0]],
  breath: [['noise', 600, 2400, 0.7, 0.3, 0]],
  complete: [['tone', 'triangle', 523, 523, 0.14, 0.22, 0], ['tone', 'triangle', 659, 659, 0.14, 0.22, 0.14], ['tone', 'triangle', 784, 784, 0.14, 0.22, 0.28], ['tone', 'triangle', 1047, 1047, 0.5, 0.22, 0.42]],
  gameover: [['tone', 'triangle', 392, 392, 0.25, 0.22, 0], ['tone', 'triangle', 330, 330, 0.25, 0.22, 0.25], ['tone', 'triangle', 262, 196, 0.7, 0.22, 0.5]],
  ui: [['tone', 'square', 660, 660, 0.03, 0.06, 0]],
};

/** Every cue the game can play; data/audio.json may give a sound file for any of them. */
export const CUES = Object.keys(STAND_INS);

let noiseBuffer = null;

/** Play a stand-in cue into `destination`. */
export function playStandIn(context, destination, cue, volume = 1) {
  const parts = STAND_INS[cue];
  if (!parts) return;
  const now = context.currentTime;
  for (const part of parts) {
    if (part[0] === 'tone') {
      const [, wave, f0, f1, seconds, gain, delay] = part;
      const osc = context.createOscillator(), amp = context.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(f0, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + delay + seconds);
      amp.gain.setValueAtTime(0, now + delay);
      amp.gain.linearRampToValueAtTime(gain * volume, now + delay + 0.008);
      amp.gain.exponentialRampToValueAtTime(0.0008, now + delay + seconds);
      osc.connect(amp).connect(destination);
      osc.start(now + delay); osc.stop(now + delay + seconds + 0.02);
    } else {
      const [, f0, f1, seconds, gain, delay] = part;
      if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), amp = context.createGain();
      source.buffer = noiseBuffer; source.loop = true;
      filter.type = 'bandpass'; filter.Q.value = 0.9;
      filter.frequency.setValueAtTime(f0, now + delay);
      filter.frequency.exponentialRampToValueAtTime(Math.max(30, f1), now + delay + seconds);
      amp.gain.setValueAtTime(gain * volume, now + delay);
      amp.gain.exponentialRampToValueAtTime(0.0008, now + delay + seconds);
      source.connect(filter).connect(amp).connect(destination);
      source.start(now + delay); source.stop(now + delay + seconds + 0.02);
    }
  }
}
