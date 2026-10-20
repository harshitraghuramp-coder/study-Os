import { SoundType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackNodes: Map<SoundType, { gain: GainNode; stop: () => void }> = new Map();
  private birdTimer: number | null = null;
  private vinylTimer: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setTrackVolume(type: SoundType, vol: number) {
    const track = this.trackNodes.get(type);
    if (track && this.ctx) {
      track.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public playTrack(type: SoundType, volume: number = 0.5) {
    if (this.trackNodes.has(type)) return;
    const ctx = this.getContext();

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(volume, ctx.currentTime);
    trackGain.connect(this.masterGain!);

    let stopFn = () => {};

    switch (type) {
      case 'binaural':
        stopFn = this.createBinauralBeat(ctx, trackGain);
        break;
      case 'brownnoise':
        stopFn = this.createBrownNoise(ctx, trackGain);
        break;
      case 'pinknoise':
        stopFn = this.createPinkNoise(ctx, trackGain);
        break;
      case 'rain':
        stopFn = this.createRainSound(ctx, trackGain);
        break;
      case 'forest':
        stopFn = this.createForestSound(ctx, trackGain);
        break;
      case 'lofi':
        stopFn = this.createLofiCrackle(ctx, trackGain);
        break;
    }

    this.trackNodes.set(type, { gain: trackGain, stop: stopFn });
  }

  public stopTrack(type: SoundType) {
    const track = this.trackNodes.get(type);
    if (track) {
      try {
        track.stop();
      } catch (e) {
        console.error('Error stopping track:', e);
      }
      this.trackNodes.delete(type);
    }
  }

  public stopAll() {
    this.trackNodes.forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
    this.trackNodes.clear();
    if (this.birdTimer) clearInterval(this.birdTimer);
    if (this.vinylTimer) clearInterval(this.vinylTimer);
  }

  // Pure 40Hz Gamma Binaural Beat (216 Hz left, 256 Hz right)
  private createBinauralBeat(ctx: AudioContext, dest: GainNode) {
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();

    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(216, ctx.currentTime);
    oscR.frequency.setValueAtTime(256, ctx.currentTime); // 40Hz difference

    // Channel merger for stereo separation
    const merger = ctx.createChannelMerger(2);
    oscL.connect(merger, 0, 0); // left channel
    oscR.connect(merger, 0, 1); // right channel

    merger.connect(dest);
    oscL.start();
    oscR.start();

    return () => {
      try {
        oscL.stop();
        oscR.stop();
        oscL.disconnect();
        oscR.disconnect();
        merger.disconnect();
      } catch {}
    };
  }

  // Deep Brown Noise (masks conversation & distraction)
  private createBrownNoise(ctx: AudioContext, dest: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    noise.connect(filter);
    filter.connect(dest);
    noise.start();

    return () => {
      try {
        noise.stop();
        noise.disconnect();
        filter.disconnect();
      } catch {}
    };
  }

  // Pink Noise
  private createPinkNoise(ctx: AudioContext, dest: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    noise.connect(filter);
    filter.connect(dest);
    noise.start();

    return () => {
      try {
        noise.stop();
        noise.disconnect();
        filter.disconnect();
      } catch {}
    };
  }

  // Rain & Gentle Storm Simulator
  private createRainSound(ctx: AudioContext, dest: GainNode) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      left[i] = (Math.random() * 2 - 1) * 0.25;
      right[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    // LFO for rain intensity swell
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    lfoGain.gain.setValueAtTime(300, ctx.currentTime);

    lfo.connect(filter.frequency);
    noise.connect(filter);
    filter.connect(dest);

    lfo.start();
    noise.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
        noise.disconnect();
        filter.disconnect();
      } catch {}
    };
  }

  // Forest Breeze with occasional harmonic bird chirps
  private createForestSound(ctx: AudioContext, dest: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const wind = ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(350, ctx.currentTime);

    wind.connect(windFilter);
    windFilter.connect(dest);
    wind.start();

    // Occasional procedural bird chirp synthesizer
    const playChirp = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const osc = ctx.createOscillator();
        const chirpGain = ctx.createGain();
        const baseFreq = 2200 + Math.random() * 600;
        const now = ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 700, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, now + 0.18);

        chirpGain.gain.setValueAtTime(0.001, now);
        chirpGain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(chirpGain);
        chirpGain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.22);
      } catch {}
    };

    const intervalId = window.setInterval(() => {
      if (Math.random() > 0.4) {
        playChirp();
      }
    }, 4500);

    return () => {
      try {
        clearInterval(intervalId);
        wind.stop();
        wind.disconnect();
        windFilter.disconnect();
      } catch {}
    };
  }

  // Lo-Fi Vinyl Crackle Simulator
  private createLofiCrackle(ctx: AudioContext, dest: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Warm subtle rumble
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.03;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, ctx.currentTime);

    noise.connect(filter);
    filter.connect(dest);
    noise.start();

    // Procedural pops & clicks
    const playPop = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const osc = ctx.createOscillator();
        const popGain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random() * 800, now);

        popGain.gain.setValueAtTime(0.04, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

        osc.connect(popGain);
        popGain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.02);
      } catch {}
    };

    const popInterval = window.setInterval(() => {
      if (Math.random() > 0.3) {
        playPop();
      }
    }, 400);

    return () => {
      try {
        clearInterval(popInterval);
        noise.stop();
        noise.disconnect();
        filter.disconnect();
      } catch {}
    };
  }

  // Pleasant Completion Chime (528 Hz Solfeggio / Zen bell chime)
  public playCompletionChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const fundamental = 528; // Transformation/Zen frequency

      const frequencies = [fundamental, fundamental * 1.5, fundamental * 2.01, fundamental * 2.76];
      const gains = [0.3, 0.15, 0.08, 0.04];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch (e) {
      console.error('Error playing chime:', e);
    }
  }
}

export const soundEngine = new SoundEngine();
