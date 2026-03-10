// Audio management for workout sounds

const Audio = {
  audioContext: null,

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume audio context if suspended (required for some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  playBeep(frequency = 800, duration = 150, volume = 0.5) {
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  },

  playCountdownBeep() {
    this.playBeep(600, 100, 0.4);
  },

  playEndBlockBeep() {
    this.playBeep(900, 200, 0.6);
  },

  playFinalBeep(callback) {
    // Play 3 longer final beeps
    let count = 0;
    const playNext = () => {
      if (count < 3) {
        this.playBeep(1000, 400, 0.7);
        count++;
        setTimeout(playNext, 600);
      } else if (callback) {
        callback();
      }
    };
    playNext();
  },

  playStartBeep() {
    this.playBeep(1200, 300, 0.6);
  }
};
