
export type SoundType = 'ROLL' | 'WIN' | 'LOSS' | 'CLICK';

class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy initialization handled in play() to comply with autoplay policies
  }

  private init() {
    if (this.context) return;
    
    try {
      // Support standard and webkit prefixed AudioContext for broader browser support
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.3; // Default volume (30%)
      }
    } catch (e) {
      console.error("Audio initialization failed", e);
    }
  }

  private ensureContext() {
    this.init();
    // Resume context if suspended (browser autoplay policy)
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  play(sound: SoundType) {
    if (this.muted) return;
    
    this.ensureContext();
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;

    switch (sound) {
      case 'CLICK':
        // Short high-pitched blip
        this.playTone(800, 'sine', 0.05, t);
        break;
      case 'ROLL':
        // Simulate dice shaking with scattered collision noises
        for(let i = 0; i < 10; i++) {
            const timeOffset = Math.random() * 1.5; // Spread over 1.5 seconds
            this.playNoise(0.04, t + timeOffset);
        }
        break;
      case 'WIN':
        // Victory Fanfare (Major Arpeggio)
        this.playTone(523.25, 'triangle', 0.1, t);       // C5
        this.playTone(659.25, 'triangle', 0.1, t + 0.15); // E5
        this.playTone(783.99, 'triangle', 0.1, t + 0.30); // G5
        this.playTone(1046.50, 'sine', 0.6, t + 0.45);    // C6
        break;
      case 'LOSS':
        // Defeat Sound (Descending Slide)
        this.playSlide(250, 50, 'sawtooth', 0.6, t);
        break;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number) {
    if (!this.context || !this.masterGain) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playSlide(startFreq: number, endFreq: number, type: OscillatorType, duration: number, startTime: number) {
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.linearRampToValueAtTime(endFreq, startTime + duration);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.linearRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playNoise(duration: number, startTime: number) {
      if (!this.context || !this.masterGain) return;
      
      const bufferSize = this.context.sampleRate * duration;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.context.createBufferSource();
      noise.buffer = buffer;
      
      // Filter the noise for a duller "thud" sound
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(startTime);
  }

  toggleMute() {
    this.muted = !this.muted;
    // Suspend context when muted to save battery/resources
    if (this.muted && this.context && this.context.state === 'running') {
        this.context.suspend();
    } 
    // Resume when unmuted
    else if (!this.muted && this.context && this.context.state === 'suspended') {
        this.context.resume();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const audioManager = new AudioManager();
