
export type SoundType = 'ROLL' | 'WIN' | 'LOSS' | 'CLICK' | 'SUCCESS';

class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;

  constructor() {
    // Load mute state from storage
    try {
        const saved = localStorage.getItem('app_muted');
        this.muted = saved === 'true';
    } catch(e) { 
        this.muted = false; 
    }

    // Add global listeners to unlock audio context on first interaction
    if (typeof window !== 'undefined') {
        const unlock = () => {
             this.initContext();
             // Remove listeners after first interaction
             window.removeEventListener('click', unlock);
             window.removeEventListener('keydown', unlock);
             window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }
  }

  public async initContext() {
    if (this.context) {
        // If context exists but is suspended (Autoplay Policy), try to resume
        if (this.context.state === 'suspended') {
            try {
                await this.context.resume();
            } catch (e) {
                // Resume might fail if called without user gesture, ignoring safe error
            }
        }
        return;
    }
    
    try {
      // Support standard and webkit prefixed AudioContext for broader browser support
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.5;
      }
    } catch (e) {
      console.error("Audio initialization failed", e);
    }
  }

  // Explicitly resume (can be called from UI buttons to force unlock)
  public resume() {
      this.initContext();
  }

  public async play(sound: SoundType) {
    if (this.muted) return;
    
    // Ensure context is initialized and active
    await this.initContext();

    if (!this.context || !this.masterGain) return;
    
    // Double check state
    if (this.context.state === 'suspended') {
        try { await this.context.resume(); } catch(e) { return; }
    }

    // Use safe current time
    const t = this.context.currentTime;

    switch (sound) {
      case 'CLICK':
        // Short high-pitched blip
        this.playTone(800, 'sine', 0.05, t);
        break;
      case 'ROLL':
        // Simulate dice shaking with scattered collision noises
        for(let i = 0; i < 8; i++) {
            const timeOffset = Math.random() * 0.8; 
            this.playNoise(0.04, t + timeOffset);
        }
        break;
      case 'WIN':
        // Victory Fanfare
        this.playTone(523.25, 'triangle', 0.1, t);       // C5
        this.playTone(659.25, 'triangle', 0.1, t + 0.15); // E5
        this.playTone(783.99, 'triangle', 0.1, t + 0.30); // G5
        this.playTone(1046.50, 'sine', 0.6, t + 0.45);    // C6
        break;
      case 'LOSS':
        // Defeat Sound (Descending Slide)
        this.playSlide(250, 50, 'sawtooth', 0.6, t);
        break;
      case 'SUCCESS':
        // Success Chime
        this.playTone(880, 'sine', 0.1, t);
        this.playTone(1108, 'sine', 0.1, t + 0.1);
        this.playTone(1318, 'sine', 0.4, t + 0.2);
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
    try {
        localStorage.setItem('app_muted', String(this.muted));
    } catch(e) {}

    // Suspend context when muted to save battery
    if (this.muted && this.context && this.context.state === 'running') {
        this.context.suspend();
    } else if (!this.muted) {
        this.resume();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const audioManager = new AudioManager();
