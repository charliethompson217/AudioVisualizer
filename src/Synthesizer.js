import * as Tone from 'tone';

export default class Synthesizer {
  constructor(audioContext, options) {
    Tone.setContext(audioContext);
    this.harmonicAmplitudes = options.harmonicAmplitudes;
    this.attackTime = options.attackTime;
    this.decayTime = options.decayTime;
    this.sustainLevel = options.sustainLevel;
    this.releaseTime = options.releaseTime;
    this.analyserNode = options.analyserNode;
    this.getVolume = options.getVolume;
    this.vibratoDepth = options.vibratoDepth;
    this.vibratoRate = options.vibratoRate;
    this.tremoloDepth = options.tremoloDepth;
    this.tremoloRate = options.tremoloRate;
    this.activeNotes = new Map();
    this.oscillatorType = options.oscillatorType;
  }

  updateOscillatorType(newOscillatorType) {
    this.oscillatorType = newOscillatorType;
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

  noteOn(noteNumber, velocity = 127) {
    const frequency = this.midiNoteToFrequency(noteNumber);
    const volume = (velocity / 127) * this.getVolume();
    const partials = Array.from({ length: 8 }, (_, i) => this.harmonicAmplitudes[i + 1] || 0);

    const { attackTime, decayTime, sustainLevel, releaseTime } = this;

    const oscillatorConfig = {
      type: this.oscillatorType,
      partials: partials
    };

    const synth = new Tone.Synth({
      oscillator: oscillatorConfig,
      envelope: {
        attack: attackTime,
        decay: decayTime,
        sustain: sustainLevel,
        release: releaseTime
      }
    });

    const volumeGain = new Tone.Gain(volume);
    synth.connect(volumeGain);
    volumeGain.connect(this.analyserNode);

    let vibratoLFO = null;
    if (this.vibratoDepth > 0 && this.vibratoRate > 0) {
      vibratoLFO = new Tone.LFO({
        frequency: this.vibratoRate,
        min: frequency - this.vibratoDepth,
        max: frequency + this.vibratoDepth,
        type: 'sine'
      }).start();
      vibratoLFO.connect(synth.oscillator.frequency);
    }

    let tremoloLFO = null;
    if (this.tremoloDepth > 0 && this.tremoloRate > 0) {
      tremoloLFO = new Tone.LFO({
        frequency: this.tremoloRate,
        min: volume * (1 - this.tremoloDepth),
        max: volume * (1 + this.tremoloDepth),
        type: 'sine'
      }).start();
      tremoloLFO.connect(volumeGain.gain);
    }

    const noteId = `${noteNumber}_${performance.now()}`;
    this.activeNotes.set(noteId, { 
      synth, 
      volumeGain, 
      vibratoLFO, 
      tremoloLFO,
      releaseTime
    });
    synth.triggerAttack(frequency);
  }

  noteOff(noteNumber) {
    this.activeNotes.forEach((entry, noteId) => {
      if (noteId.startsWith(`${noteNumber}_`)) {
        entry.synth.triggerRelease();
        Tone.context.setTimeout(() => {
          entry.synth.dispose();
          entry.volumeGain.dispose();
          entry.vibratoLFO?.dispose();
          entry.tremoloLFO?.dispose();
          this.activeNotes.delete(noteId);
        }, entry.releaseTime);
      }
    });
  }

  stopAllNotes() {
    this.activeNotes.forEach((entry, noteId) => {
      entry.synth.triggerRelease();
      Tone.context.setTimeout(() => {
        entry.synth.dispose();
        entry.volumeGain.dispose();
        entry.vibratoLFO?.dispose();
        entry.tremoloLFO?.dispose();
        this.activeNotes.delete(noteId);
      }, entry.releaseTime);
    });
  }

  midiNoteToFrequency(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }
}