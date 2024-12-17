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

    this.activeOscillators = new Map();
    this.activeNotes = new Map();
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

  noteOn(noteNumber, velocity = 127, isMidi = false) {
    if (this.activeNotes.has(noteNumber)) {
      this.noteOff(noteNumber);
    }

    const frequency = this.midiNoteToFrequency(noteNumber);
    const volume = (velocity / 127) * (isMidi ? this.getMidiVolume() : this.getVolume());

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    if (this.analyserNode) {
      gainNode.connect(this.analyserNode);
    }
    gainNode.connect(this.audioContext.destination);

    const harmonicCount = Math.max(...Object.keys(this.harmonicAmplitudes).map(Number));
    const real = new Float32Array(harmonicCount + 1);
    const imag = new Float32Array(harmonicCount + 1);

    for (const harmonicStr in this.harmonicAmplitudes) {
      const harmonic = parseInt(harmonicStr);
      const amplitude = this.harmonicAmplitudes[harmonicStr];

      // Introduce a phase shift to each harmonic
      const phase = Math.PI / 2; // 90 degrees phase shift
      real[harmonic] = amplitude * Math.cos(phase);
      imag[harmonic] = amplitude * Math.sin(phase);
    }

    const periodicWave = this.audioContext.createPeriodicWave(real, imag);

    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.setPeriodicWave(periodicWave);

    const note = {
      noteNumber,
      gainNode,
      oscillator,
    };

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

    oscillator.start();

    // Apply ADSR envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + this.attackTime);
    gainNode.gain.linearRampToValueAtTime(
      volume * this.sustainLevel,
      now + this.attackTime + this.decayTime
    );

    // Store active note with unique identifier
    const noteId = `${noteNumber}_${performance.now()}`;
    this.activeNotes.set(noteId, note);
  }

  noteOff(noteNumber) {
    for (const [noteId, note] of this.activeNotes.entries()) {
      if (note.noteNumber === noteNumber) {
        const now = this.audioContext.currentTime;
        note.gainNode.gain.cancelScheduledValues(now);
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
        note.gainNode.gain.linearRampToValueAtTime(0, now + this.releaseTime);

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
  }

  stopAllNotes() {
    for (const [noteId, note] of this.activeNotes.entries()) {
      const now = this.audioContext.currentTime;
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
      note.gainNode.gain.linearRampToValueAtTime(0, now + this.releaseTime);

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