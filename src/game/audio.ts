import boomUrl from '../assets/audio/explosion.wav?url';
import shootUrl from '../assets/audio/shoot.wav?url';
import musicUrl from '../assets/audio/background-music.mp3?url';

const MUSIC_VOLUME = 0.12;
const DUCKED_VOLUME = 0.04;

/**
 * Sound effects via WebAudio (pitch-varied, latency-free after init), music via
 * a plain looping <audio> element. Init must happen inside a user gesture so
 * autoplay policies are satisfied.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private music: HTMLAudioElement | null = null;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;
  private _muted: boolean;

  constructor() {
    this._muted = localStorage.getItem('space-port-muted') === 'true';
  }

  get muted(): boolean {
    return this._muted;
  }

  async init(): Promise<void> {
    if (this.ctx) {
      await this.ctx.resume().catch(() => undefined);
      return;
    }

    const Ctor = window.AudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();

    const entries: Array<[string, string]> = [
      ['shoot', shootUrl],
      ['explosion', boomUrl],
    ];
    for (const [name, url] of entries) {
      try {
        const res = await fetch(url);
        this.buffers.set(name, await this.ctx.decodeAudioData(await res.arrayBuffer()));
      } catch {
        // A missing/undecodable sfx disables just that sound.
      }
    }

    this.music = new Audio(musicUrl);
    this.music.loop = true;
    this.music.volume = MUSIC_VOLUME;
    if (!this._muted) void this.music.play().catch(() => undefined);
  }

  private play(name: string, gain: number, detune = false): void {
    if (!this.ctx || this._muted) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    if (detune) source.playbackRate.value = 0.9 + Math.random() * 0.3;

    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    source.connect(amp).connect(this.ctx.destination);
    source.start();
  }

  shoot(): void {
    this.play('shoot', 0.15, true);
  }

  explosion(): void {
    this.play('explosion', 0.35);
    this.duckMusic();
  }

  /** Briefly dip the music under a loud effect. */
  duckMusic(): void {
    if (!this.music || this._muted) return;
    this.music.volume = DUCKED_VOLUME;
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      if (this.music) this.music.volume = MUSIC_VOLUME;
    }, 700);
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    localStorage.setItem('space-port-muted', String(this._muted));

    if (this.music) {
      if (this._muted) this.music.pause();
      else void this.music.play().catch(() => undefined);
    }
    return this._muted;
  }

  destroy(): void {
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.music?.pause();
    this.music = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
