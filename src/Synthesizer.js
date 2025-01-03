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
      this.vibratoDepth = options.vibratoDepth;
      this.vibratoRate = options.vibratoRate;
      this.tremoloDepth = options.tremoloDepth;
      this.tremoloRate = options.tremoloRate;
      this.harmonicPhases = options.harmonicPhases || {};
  
      this.activeOscillators = new Map();
      this.activeNotes = new Map();

      this.gainNodePool = [];
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
  
    updateVibratoAndTremolo({ vibratoDepth, vibratoRate, tremoloDepth, tremoloRate }) {
      this.vibratoDepth = vibratoDepth;
      this.vibratoRate = vibratoRate;
      this.tremoloDepth = tremoloDepth;
      this.tremoloRate = tremoloRate;
    }
  
    updateHarmonicPhases(newPhases) {
      this.harmonicPhases = newPhases;
    }

    // Acquire GainNode from pool or create new
    acquireGainNode() {
        const gainNode = this.gainNodePool.length > 0 ? this.gainNodePool.pop() : this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        return gainNode;
    }

    // Release GainNode back to pool
    releaseGainNode(gainNode) {
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.gainNodePool.push(gainNode);
    }

    noteOn(noteNumber, velocity = 127, isMidi = false) {
  
      const frequency = this.midiNoteToFrequency(noteNumber);
      const volume = (velocity / 127) * this.getVolume();
  
      const gainNode = this.acquireGainNode();
  
      const harmonicKeys = Object.keys(this.harmonicAmplitudes).map(Number);
      const harmonicCount = harmonicKeys.length > 0 ? Math.max(...harmonicKeys) : 1;
      const real = new Float32Array(harmonicCount + 1);
      const imag = new Float32Array(harmonicCount + 1);
  
      for (const harmonicStr in this.harmonicAmplitudes) {
        const harmonic = parseInt(harmonicStr);
        const amplitude = this.harmonicAmplitudes[harmonicStr];
  
        const phaseOffset = this.harmonicPhases[harmonicStr] || 0;
        real[harmonic] = (amplitude**2) * Math.cos(phaseOffset);
        imag[harmonic] = (amplitude**2) * Math.sin(phaseOffset);
      }
  
      const periodicWave = this.audioContext.createPeriodicWave(real, imag);
  
      const oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.setPeriodicWave(periodicWave);
  
      // Store active note with unique identifier
      const noteId = `${noteNumber}_${performance.now()}`;
  
      const note = {
        noteId,
        noteNumber,
        gainNode,
        oscillator,
      };
  
      this.activeNotes.set(noteId, note);
  
      // Apply vibrato if vibratoDepth and vibratoRate are greater than zero
      if (this.vibratoDepth > 0 && this.vibratoRate > 0) {
        const vibratoOsc = this.audioContext.createOscillator();
        vibratoOsc.frequency.value = this.vibratoRate;
  
        const vibratoGain = this.audioContext.createGain();
        vibratoGain.gain.value = this.vibratoDepth;
  
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);
  
        vibratoOsc.start();
        note.vibratoOscillator = vibratoOsc;
      }
  
      // Apply tremolo if tremoloDepth and tremoloRate are greater than zero
      if (this.tremoloDepth > 0 && this.tremoloRate > 0) {
        const tremoloOsc = this.audioContext.createOscillator();
        tremoloOsc.frequency.value = this.tremoloRate;
  
        const tremoloGain = this.audioContext.createGain();
        tremoloGain.gain.value = this.tremoloDepth;
  
        tremoloOsc.connect(tremoloGain);
        tremoloGain.connect(gainNode.gain);
  
        tremoloOsc.start();
        note.tremoloOscillator = tremoloOsc;
      }
  
      oscillator.connect(gainNode);
      if (this.analyserNode) {
        gainNode.connect(this.analyserNode);
      }
      gainNode.connect(this.audioContext.destination);
  
      // Apply ADSR envelope with smoother transitions
      const now = this.audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      // Start from zero for a short, click-free fade-in
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.005);
      // Delay oscillator start slightly
      oscillator.start(now + 0.005);
      // Then proceed with the normal ADSR
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.005 + this.attackTime);
      gainNode.gain.linearRampToValueAtTime(
        volume * this.sustainLevel,
        now + 0.005 + this.attackTime + this.decayTime
      );
    }
  
    noteOff(noteNumber) {
      for (const [noteId, note] of this.activeNotes.entries()) {
        if (note.noteNumber === noteNumber) {
          const now = this.audioContext.currentTime;
          note.gainNode.gain.cancelScheduledValues(now);
          note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
          note.gainNode.gain.linearRampToValueAtTime(0.0001, now + this.releaseTime);
  
          // Stop oscillators after release time
          note.oscillator.stop(now + this.releaseTime);
          if (note.vibratoOscillator) {
            note.vibratoOscillator.stop(now + this.releaseTime);
          }
          if (note.tremoloOscillator) {
            note.tremoloOscillator.stop(now + this.releaseTime);
          }

          // Clean up after release phase
          setTimeout(() => {
            this.activeNotes.delete(noteId);
          }, (this.releaseTime + 0.1) * 1000);
        }
      }
    }
  
    stopAllNotes() {
      for (const [noteId, note] of this.activeNotes.entries()) {
        const now = this.audioContext.currentTime;
        note.gainNode.gain.cancelScheduledValues(now);
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
        note.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + this.releaseTime);
  
        // Stop oscillators after release
        note.oscillator.stop(now + this.releaseTime);
        if (note.vibratoOscillator) {
          note.vibratoOscillator.stop(now + this.releaseTime);
        }
        if (note.tremoloOscillator) {
          note.tremoloOscillator.stop(now + this.releaseTime);
        }
  
        // Clean up after release phase
        setTimeout(() => {
          note.gainNode.disconnect();
          if (note.vibratoOscillator) {
            note.vibratoOscillator.disconnect();
          }
          if (note.tremoloOscillator) {
            note.tremoloOscillator.disconnect();
          }
          this.activeNotes.delete(noteId);
        }, (this.releaseTime + 0.1) * 1000);
      }
    }
  
    midiNoteToFrequency(noteNumber) {
      return 440 * Math.pow(2, (noteNumber - 69) / 12);
    }
  }