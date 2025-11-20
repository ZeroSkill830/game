
// Audio Synthesizer - No external assets required
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

export const initAudio = () => {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3; // Master volume
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, volume: number = 1) => {
  if (!ctx || !masterGain) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(masterGain);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const createNoiseBuffer = () => {
  if (!ctx) return null;
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

let noiseBuffer: AudioBuffer | null = null;

// --- Sound Effects ---

export const playGunshot = (type: 'pistol' | 'shotgun' | 'smg' = 'pistol') => {
  if (!ctx || !masterGain) return;
  
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
  
  // Noise part (The "Bang")
  if (noiseBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    const gain = ctx.createGain();
    
    // Customize based on weapon type
    if (type === 'shotgun') {
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(1.2, ctx.currentTime); // Louder
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4); // Longer
    } else if (type === 'smg') {
        filter.frequency.setValueAtTime(1500, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.6, ctx.currentTime); // Quieter but sharper
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
        // Pistol
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    }

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  // Tonal part (The "Kick")
  if (type === 'shotgun') {
      createOscillator('sawtooth', 60, 0.3, 0.6);
  } else if (type === 'smg') {
      createOscillator('triangle', 200, 0.1, 0.3);
  } else {
      createOscillator('triangle', 150, 0.1, 0.5);
      createOscillator('sawtooth', 80, 0.3, 0.3);
  }
};

export const playEmptyClick = () => {
  createOscillator('square', 800, 0.05, 0.2);
};

export const playHitMarker = () => {
    createOscillator('triangle', 2000, 0.05, 0.2);
};

export const playReload = () => {
  if (!ctx) return;
  // Slide sound
  setTimeout(() => createOscillator('sine', 600, 0.1, 0.2), 0);
  // Click sound
  setTimeout(() => createOscillator('square', 1200, 0.05, 0.3), 300);
};

export const playFootstep = () => {
  if (!ctx || !masterGain) return;
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
  
  if (noiseBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    
    // Randomize pitch slightly
    source.playbackRate.value = 0.8 + Math.random() * 0.4;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    source.start();
  }
};

let ambienceOsc: OscillatorNode | null = null;

export const startAmbience = () => {
    if (!ctx || !masterGain || ambienceOsc) return;
    
    // Brown noise approximation (Low filtered noise) for office AC/Hum
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
    if (noiseBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start();
    }
};