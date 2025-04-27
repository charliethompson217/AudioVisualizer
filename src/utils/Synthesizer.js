/*
A free online tool to visualize audio files with spectrogram, waveform, MIDI conversion and more.
Copyright (C) 2024 Charles Thompson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import * as Tone from 'tone';

export default class Synthesizer {
  constructor(audioContext, options) {
    Tone.setContext(audioContext);
    this.synthesisMode = options.synthesisMode;
    this.instrument = options.instrument || 'piano';
    this.sampleBaseUrl = options.sampleBaseUrl;
    this.harmonicAmplitudes = options.harmonicAmplitudes;
    this.attackTime = options.attackTime;
    this.attackCurve = options.attackCurve;
    this.decayTime = options.decayTime;
    this.decayCurve = options.decayCurve;
    this.sustainLevel = options.sustainLevel;
    this.releaseTime = options.releaseTime;
    this.releaseCurve = options.releaseCurve;
    this.analyserNode = options.analyserNode;
    this.getVolume = options.getVolume;
    this.vibratoDepth = options.vibratoDepth;
    this.vibratoRate = options.vibratoRate;
    this.tremoloDepth = options.tremoloDepth;
    this.tremoloRate = options.tremoloRate;
    this.activeNotes = new Map();
    this.oscillatorType = options.oscillatorType;
    this.sampler = null;
    this.outputNode = new Tone.Gain(1);

    if (this.synthesisMode === 'sample') {
      this.initializeSampler();
    }
  }

  async initializeSampler() {
    if (!this.instrument) {
      this.instrument = 'piano';
      console.warn('No instrument specified, defaulting to piano');
    }

    let sampleMaps;
    try {
      const response = await fetch('/samples.json');
      if (!response.ok) throw new Error('Failed to fetch samples.json');
      sampleMaps = await response.json();
    } catch (error) {
      console.error('Error loading sample maps:', error);
      return;
    }

    if (!sampleMaps[this.instrument]) {
      console.warn(`Instrument "${this.instrument}" not found in sample maps, defaulting to piano`);
      this.instrument = 'piano';
    }

    const sampleMap = sampleMaps[this.instrument];
    const samples = {};

    for (const [note, file] of Object.entries(sampleMap)) {
      samples[note] = `${this.sampleBaseUrl}/${this.instrument}/${file}`;
    }

    if (this.sampler) {
      this.sampler.dispose();
    }

    this.sampler = new Tone.Sampler({
      urls: samples,
      attack: this.attackTime,
      attackCurve: this.attackCurve,
      release: this.releaseTime,
      releaseCurve: this.releaseCurve,
      onload: () => console.log(`Sampler loaded with instrument: ${this.instrument}`),
    });
    this.sampler.connect(this.outputNode);
  }

  getOutputNode() {
    return this.outputNode;
  }

  updateOscillatorType(newOscillatorType) {
    if (this.synthesisMode === 'additive') {
      this.oscillatorType = newOscillatorType;
    }
  }

  updateHarmonicAmplitudes(newAmplitudes) {
    if (this.synthesisMode === 'additive') {
      this.harmonicAmplitudes = newAmplitudes;
    }
  }

  updateADSR({ attackTime, attackCurve, decayTime, decayCruve, sustainLevel, releaseTime, releaseCurve }) {
    if (this.synthesisMode === 'additive') {
      this.attackTime = attackTime;
      this.attackCurve = attackCurve;
      this.decayTime = decayTime;
      this.decayCruve = decayCruve;
      this.sustainLevel = sustainLevel;
      this.releaseTime = releaseTime;
      this.releaseCurve = releaseCurve;
    }
  }

  updateVibratoAndTremolo({ vibratoDepth, vibratoRate, tremoloDepth, tremoloRate }) {
    if (this.synthesisMode === 'additive') {
      this.vibratoDepth = vibratoDepth;
      this.vibratoRate = vibratoRate;
      this.tremoloDepth = tremoloDepth;
      this.tremoloRate = tremoloRate;
    }
  }

  updateSamplerSettings({ instrument, releaseTime, releaseCurve, attackTime, attackCurve }) {
    const instrumentChanged = instrument && instrument !== this.instrument;
    if (instrument) this.instrument = instrument;
    this.releaseTime = releaseTime;
    this.releaseCurve = releaseCurve;
    this.attackTime = attackTime;
    this.attackCurve = attackCurve;
    if (this.sampler && !instrumentChanged) {
      this.sampler.release = this.releaseTime;
      this.sampler.releaseCurve = this.releaseCurve;
      this.sampler.attack = this.attackTime;
      this.sampler.attackCurve = this.attackCurve;
    }

    if (instrumentChanged && this.synthesisMode === 'sample') {
      if (this.sampler) {
        this.stopAllNotes();
        this.sampler.dispose();
        this.sampler = null;
      }
      this.initializeSampler();
    }
  }

  updateSynthesisMode(mode, instrument) {
    const modeChanged = mode !== this.synthesisMode;
    this.synthesisMode = mode;

    if (instrument) {
      this.instrument = instrument;
    }

    if (mode === 'sample' && (!this.instrument || this.instrument === 'undefined')) {
      this.instrument = 'piano';
    }

    if (mode === 'sample') {
      if (!this.sampler || modeChanged) {
        if (this.sampler) {
          this.sampler.dispose();
          this.sampler = null;
        }
        this.initializeSampler();
      }
    } else if (mode === 'additive' && this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
  }

  noteOn(noteNumber, velocity = 127) {
    if (this.synthesisMode === 'sample' && this.sampler) {
      const noteName = Tone.Frequency(noteNumber, 'midi').toNote();
      const volume = (velocity / 127) * this.getVolume();
      const gain = new Tone.Gain(volume);
      this.sampler.connect(gain);
      gain.connect(this.outputNode);
      this.sampler.triggerAttack(noteName, Tone.now(), volume);
      const noteId = `${noteNumber}_${performance.now()}`;
      this.activeNotes.set(noteId, { sampler: this.sampler, gain, noteName });
    } else {
      const frequency = this.midiNoteToFrequency(noteNumber);
      const volume = (velocity / 127) * this.getVolume();
      const partials = Array.from({ length: 8 }, (_, i) => this.harmonicAmplitudes[i + 1] || 0);

      const { attackTime, attackCurve, decayTime, decayCurve, sustainLevel, releaseTime, releaseCurve } = this;

      const oscillatorConfig = {
        type: this.oscillatorType,
        partials: partials,
      };

      const synth = new Tone.Synth({
        oscillator: oscillatorConfig,
        envelope: {
          attack: attackTime,
          attackCurve: attackCurve,
          decay: decayTime,
          decayCurve: decayCurve,
          sustain: sustainLevel,
          release: releaseTime,
          releaseCurve: releaseCurve,
        },
      });

      const volumeGain = new Tone.Gain(volume);
      synth.connect(volumeGain);
      volumeGain.connect(this.outputNode);

      let vibratoLFO = null;
      if (this.vibratoDepth > 0 && this.vibratoRate > 0) {
        vibratoLFO = new Tone.LFO({
          frequency: this.vibratoRate,
          min: frequency - this.vibratoDepth,
          max: frequency + this.vibratoDepth,
          type: 'sine',
        }).start();
        vibratoLFO.connect(synth.oscillator.frequency);
      }

      let tremoloLFO = null;
      if (this.tremoloDepth > 0 && this.tremoloRate > 0) {
        tremoloLFO = new Tone.LFO({
          frequency: this.tremoloRate,
          min: volume * (1 - this.tremoloDepth),
          max: volume * (1 + this.tremoloDepth),
          type: 'sine',
        }).start();
        tremoloLFO.connect(volumeGain.gain);
      }

      const noteId = `${noteNumber}_${performance.now()}`;
      this.activeNotes.set(noteId, {
        synth,
        volumeGain,
        vibratoLFO,
        tremoloLFO,
        releaseTime,
      });
      synth.triggerAttack(frequency);
    }
  }

  noteOff(noteNumber) {
    this.activeNotes.forEach((entry, noteId) => {
      if (noteId.startsWith(`${noteNumber}_`)) {
        if (this.synthesisMode === 'sample' && entry.sampler) {
          entry.sampler.triggerRelease(entry.noteName, Tone.now());
          Tone.context.setTimeout(() => {
            entry.gain.dispose();
            this.activeNotes.delete(noteId);
          }, this.releaseTime);
        } else {
          entry.synth.triggerRelease();
          Tone.context.setTimeout(() => {
            entry.synth.dispose();
            entry.volumeGain.dispose();
            entry.vibratoLFO?.dispose();
            entry.tremoloLFO?.dispose();
            this.activeNotes.delete(noteId);
          }, entry.releaseTime);
        }
      }
    });
  }

  stopAllNotes() {
    this.activeNotes.forEach((entry, noteId) => {
      if (this.synthesisMode === 'sample' && entry.sampler) {
        entry.sampler.triggerRelease(entry.noteName, Tone.now());
        Tone.context.setTimeout(() => {
          entry.gain.dispose();
          this.activeNotes.delete(noteId);
        }, this.releaseTime);
      } else {
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

  midiNoteToFrequency(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }
}
