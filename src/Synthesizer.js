// Synthesizer.js

export default class Synthesizer {
    constructor(audioContext, options) {
      this.audioContext = audioContext;
      this.harmonicAmplitudes = options.harmonicAmplitudes;
      this.attackTime = options.attackTime;
      this.decayTime = options.decayTime;
      this.sustainLevel = options.sustainLevel;
      this.releaseTime = options.releaseTime;
      this.analyserNode = options.analyserNode;
      this.getVolume = options.getVolume;
      this.getMidiVolume = options.getMidiVolume;
  
      this.activeOscillators = new Map();
      this.sustain = false;
    }
  
    updateHarmonicAmplitudes(newAmplitudes) {
      this.harmonicAmplitudes = newAmplitudes;
    }
  
    updateADSR({ attackTime, decayTime, sustainLevel, releaseTime }) {
      this.attackTime = attackTime;
      this.decayTime = decayTime;
      this.sustainLevel = sustainLevel;
      this.releaseTime = releaseTime;
    }
  
    noteOn(noteNumber, velocity = 127, isMidi = false) {
        const frequency = this.midiNoteToFrequency(noteNumber);
        const gainNode = this.audioContext.createGain();
      
        // Calculate volume based on velocity and overall volume
        const volume = (velocity / 127) * (isMidi ? this.getMidiVolume() : this.getVolume());
      
        gainNode.gain.value = 0;
      
        // Connect gainNode to both analyserNode and destination
        if (this.analyserNode) {
          gainNode.connect(this.analyserNode);
        }
        gainNode.connect(this.audioContext.destination);
      
        const now = this.audioContext.currentTime;
      
        // Apply ADSR envelope
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + this.attackTime);
        gainNode.gain.linearRampToValueAtTime(
          volume * this.sustainLevel,
          now + this.attackTime + this.decayTime
        );
      
        // Create oscillators for each harmonic
        const oscillators = [];
        for (const [harmonic, amplitude] of Object.entries(this.harmonicAmplitudes)) {
          if (amplitude > 0) {
            const oscillator = this.audioContext.createOscillator();
            oscillator.frequency.value = frequency * harmonic;
            oscillator.type = 'sine';
      
            const harmonicGain = this.audioContext.createGain();
            harmonicGain.gain.value = amplitude;
      
            oscillator.connect(harmonicGain);
            harmonicGain.connect(gainNode);
      
            oscillator.start(now);
            oscillators.push(oscillator);
          }
        }
      
        this.activeOscillators.set(noteNumber, { gainNode, oscillators });
      }
  
    noteOff(noteNumber, isMidi = false) {
      const note = this.activeOscillators.get(noteNumber);
      if (!note) return;
  
      const gainNode = note.gainNode;
      const now = this.audioContext.currentTime;
  
      // Apply release portion of ADSR envelope
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + this.releaseTime);
  
      // Stop oscillators after release time
      note.oscillators.forEach((oscillator) => {
        oscillator.stop(now + this.releaseTime + 0.1);
      });
  
      // Remove from active oscillators after release time
      setTimeout(() => {
        this.activeOscillators.delete(noteNumber);
      }, (this.releaseTime + 0.1) * 1000);
    }
  
    midiNoteToFrequency(noteNumber) {
      return 440 * Math.pow(2, (noteNumber - 69) / 12);
    }
  
    applySustain() {
      this.sustain = true;
    }
  
    releaseSustain() {
      this.sustain = false;
      // Handle logic to release sustained notes if necessary
    }
  
    changeInstrument(programNumber) {
      // Implement instrument change logic if needed
    }
  
    bendPitch(value) {
      // Implement pitch bend logic if needed
    }
  }