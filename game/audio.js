export class Audio {
  constructor(music, settings, dialogue = null) { this.music = music; this.dialogue = dialogue; this.settings = settings; this.muted = false; }
  setTrack(source) {
    if (!source) return;
    if (this.music.getAttribute('src') === source) { this.music.currentTime = 0; return; }
    this.music.pause(); this.music.src = source; this.music.load();
  }
  setDialogue(source) {
    if (!this.dialogue || !source) return;
    if (this.dialogue.getAttribute('src') === source) { this.dialogue.currentTime = 0; return; }
    this.dialogue.pause(); this.dialogue.src = source; this.dialogue.load();
  }
  prime() {
    // Asset loading can outlive the browser's transient click activation.
    // A muted play/pause unlocks media while the click is still active; the
    // actual intro voice begins only when the cutscene starts.
    for (const media of [this.music, this.dialogue].filter(Boolean)) {
      const volume = media.volume;
      media.volume = 0;
      const attempt = media.play();
      media.pause(); media.currentTime = 0; media.volume = volume;
      attempt?.catch(() => {});
    }
  }
  play() { this.music.volume = this.muted ? 0 : this.settings.music; this.music.play().catch(() => {}); }
  playDialogue() {
    if (!this.dialogue) return;
    this.dialogue.volume = this.muted ? 0 : this.settings.effects;
    this.dialogue.currentTime = 0;
    this.dialogue.play().catch(() => {});
  }
  stopDialogue() { if (this.dialogue) { this.dialogue.pause(); this.dialogue.currentTime = 0; } }
  pause() { this.music.pause(); this.stopDialogue(); }
  sync() {
    this.music.volume = this.muted ? 0 : this.settings.music;
    if (this.dialogue) this.dialogue.volume = this.muted ? 0 : this.settings.effects;
  }
}
