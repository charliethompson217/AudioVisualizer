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

  noteOn(noteNumber, velocity = 127, isMidi = false) {
    const frequency = this.midiNoteToFrequency(noteNumber);
    const volume = (velocity / 127) * (isMidi ? this.getMidiVolume() : this.getVolume());

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    if (this.analyserNode) {
      gainNode.connect(this.analyserNode);
    }
    gainNode.connect(this.audioContext.destination);

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

        oscillator.start();

        oscillators.push(oscillator);
      }
    }

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
    this.activeNotes.set(noteId, { noteNumber, gainNode, oscillators });
  }

  noteOff(noteNumber) {
    // Stop all instances of the noteNumber
    for (const [noteId, note] of this.activeNotes.entries()) {
      if (note.noteNumber === noteNumber) {
        const now = this.audioContext.currentTime;
        note.gainNode.gain.cancelScheduledValues(now);
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
        note.gainNode.gain.linearRampToValueAtTime(0, now + this.releaseTime);

        // Clean up after release phase
        setTimeout(() => {
          note.oscillators.forEach((oscillator) => oscillator.stop());
          note.gainNode.disconnect();
          this.activeNotes.delete(noteId);
        }, (this.releaseTime + 0.1) * 1000);
      }
    }
  }

  stopAllNotes() {
    // Stop all active notes
    for (const [noteId, note] of this.activeNotes.entries()) {
      const now = this.audioContext.currentTime;
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
      note.gainNode.gain.linearRampToValueAtTime(0, now + this.releaseTime);

      // Clean up after release phase
      setTimeout(() => {
        note.oscillators.forEach((oscillator) => oscillator.stop());
        note.gainNode.disconnect();
        this.activeNotes.delete(noteId);
      }, (this.releaseTime + 0.1) * 1000);
    }
  }

  midiNoteToFrequency(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }
}