import { Howl, Howler } from "howler";
export class AudioSystem {
  private tracks = new Map<string, Howl>();
  private current = "";
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  volume = 0.55;
  started = false;
  start() {
    if (this.started) {
      this.context?.resume();
      return;
    }
    this.started = true;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.13 * this.volume;
    this.master.connect(this.context.destination);
    this.context.resume();
  }
  setVolume(v: number) {
    this.volume = v;
    Howler.volume(v * 0.48);
    if (this.master) this.master.gain.value = v * 0.13;
  }
  world(name: string) {
    if (!this.started || name === this.current) return;
    const old = this.tracks.get(this.current);
    old?.fade(old.volume(), 0, 900);
    setTimeout(() => old?.pause(), 950);
    this.current = name;
    let next = this.tracks.get(name);
    if (!next) {
      next = new Howl({
        src: ["/audio/" + name + ".ogg"],
        loop: true,
        volume: 0,
        html5: false,
        onloaderror: () => console.warn("Music unavailable: " + name),
      });
      this.tracks.set(name, next);
    }
    if (!next.playing()) next.play();
    next.fade(0, 1, 1200);
  }
  tone(f: number, d = 0.5, type: OscillatorType = "sine", gain = 1) {
    if (!this.context || !this.master) return;
    const t = this.context.currentTime,
      o = this.context.createOscillator(),
      g = this.context.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain * 0.4, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + d + 0.05);
  }
  cue(kind: string) {
    this.start();
    if (
      ["rustle", "strike", "hit", "dodge"].includes(kind) &&
      this.context &&
      this.master
    ) {
      const ctx = this.context,
        d = kind === "rustle" ? 1.4 : 0.22,
        buffer = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] =
          (Math.random() * 2 - 1) * Math.sin((i / data.length) * Math.PI);
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value =
        kind === "rustle" ? 1700 : kind === "dodge" ? 800 : 250;
      filter.Q.value = 0.6;
      gain.gain.value = kind === "rustle" ? 0.35 : 0.5;
      source.connect(filter).connect(gain).connect(this.master);
      source.start();
      return;
    }
    if (kind === "bell") {
      for (const n of [261.63, 392, 523.25, 659.25])
        this.tone(n, 4, "sine", 0.5);
    } else if (kind === "reward") {
      [523, 659, 784, 1047].forEach((n, i) =>
        setTimeout(() => this.tone(n, 1.3, "sine", 0.6), i * 100),
      );
    } else if (kind === "pull") {
      this.tone(65, 3, "triangle", 0.45);
      this.tone(98, 2, "sine", 0.5);
    } else if (kind === "burst") {
      this.cue("bell");
      this.cue("reward");
    } else if (kind === "step")
      this.tone(90 + Math.random() * 35, 0.07, "triangle", 0.12);
    else this.tone(440, 0.25, "sine", 0.4);
  }
  pause() {
    Howler.mute(true);
    this.context?.suspend();
  }
  resume() {
    Howler.mute(false);
    this.context?.resume();
  }
  dispose() {
    this.tracks.forEach((t) => t.unload());
    this.context?.close();
  }
}
