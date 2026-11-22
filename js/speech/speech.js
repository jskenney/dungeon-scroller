// Speech output. Every line is shown as a speech bubble; when the player
// turns it on, the browser's built-in voice also reads it aloud. A higher
// quality in-browser voice model can be added here later as another provider.

export class Speech {
  /**
   * @param {import('../ui/bubbles.js').Bubbles} bubbles
   * @param {import('../settings.js').Settings} settings
   */
  constructor(bubbles, settings) {
    this.bubbles = bubbles;
    this.settings = settings;
    this.synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  }

  get canSpeakAloud() { return Boolean(this.synth); }

  /** Say a line as an actor. */
  say(actor, text) {
    this.bubbles.say(actor, text);
    const s = this.settings;
    // Stage directions such as *snarl* are shown but not read out.
    if (!this.synth || !s.speakAloud || s.muted || /^\*.*\*$/.test(text)) return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/…/g, '. '));
    utterance.volume = s.volume('voice') * s.volume('master');
    utterance.pitch = actor.boss ? 0.3 : actor.team === 'enemy' ? 0.6 : 1;
    utterance.rate = actor.boss ? 0.8 : 1;
    this.synth.speak(utterance);
  }

  stop() {
    this.bubbles.clear();
    this.synth?.cancel();
  }
}
