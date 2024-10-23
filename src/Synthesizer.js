// Synthesizer.js

/**
 * Synthesizer class handles note generation and playback, including MIDI support.
 * It manages active notes, applies ADSR envelopes, handles sustain, pitch bending,
 * and allows instrument changes by altering oscillator types.
 */
class Synthesizer {
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext;
        this.activeNotes = {};
        this.harmonicAmplitudes = options.harmonicAmplitudes || {};
        this.attackTime = options.attackTime || 0.01;
        this.decayTime = options.decayTime || 0.3;
        this.sustainLevel = options.sustainLevel || 0.2;
        this.releaseTime = options.releaseTime || 0.5;
        this.analyserNode = options.analyserNode || null;
        this.getVolume = options.getVolume || (() => 1.0);
        this.getMidiVolume = options.getMidiVolume || (() => 1.0);
        this.sustainOn = false; // Track sustain state
        this.pitchBendAmount = 0; // Store pitch bend value
    }

    /**
     * Starts playing a note.
     * @param {number} noteNumber - MIDI note number to play.
     * @param {number} velocity - Note velocity (0-127).
     * @param {boolean} isMidi - Flag indicating if the note is from a MIDI file.
     */
    noteOn(noteNumber, velocity = 127, isMidi = false) {
        const frequency = this.midiNoteToFrequency(noteNumber);
        const noteId = `note-${noteNumber}`;
        if (this.activeNotes[noteId]) {
            this.noteOff(noteNumber, isMidi);
        }

        const oscillators = [];
        const mainGainNode = this.audioContext.createGain();
        const currentTime = this.audioContext.currentTime;
        const volume = (velocity / 127) * (isMidi ? this.getMidiVolume() : this.getVolume());

        // Apply ADSR envelope
        mainGainNode.gain.setValueAtTime(0, currentTime);
        mainGainNode.gain.linearRampToValueAtTime(volume, currentTime + this.attackTime);
        mainGainNode.gain.linearRampToValueAtTime(
            this.sustainLevel * volume,
            currentTime + this.attackTime + this.decayTime
        );

        // Create oscillators for each harmonic
        for (let harmonic = 1; harmonic <= 8; harmonic++) {
            const harmonicAmplitude = this.harmonicAmplitudes[harmonic] || 0;
            if (harmonicAmplitude === 0) continue;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.frequency.setValueAtTime(frequency * harmonic, currentTime);
            gainNode.gain.setValueAtTime(harmonicAmplitude, currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(mainGainNode);
            oscillators.push(oscillator);
        }

        mainGainNode.connect(this.audioContext.destination);

        if (this.analyserNode) {
            mainGainNode.connect(this.analyserNode);
        }

        oscillators.forEach((oscillator) => {
            oscillator.start();
            // Apply pitch bend if it's active
            if (this.pitchBendAmount !== 0) {
                this.applyPitchBend(oscillator, frequency, this.pitchBendAmount);
            }
        });

        this.activeNotes[noteId] = { oscillators, mainGainNode, frequency };
    }

    /**
     * Stops playing a note.
     * @param {number} noteNumber - MIDI note number to stop.
     * @param {boolean} isMidi - Flag indicating if the note is from a MIDI file.
     */
    noteOff(noteNumber, isMidi = false) {
        const noteId = `note-${noteNumber}`;
        const note = this.activeNotes[noteId];
        if (!note) return;

        const { oscillators, mainGainNode } = note;
        const currentTime = this.audioContext.currentTime;
        const currentGain = mainGainNode.gain.value || 0.001;

        // Apply release phase of the ADSR envelope
        mainGainNode.gain.cancelScheduledValues(currentTime);
        mainGainNode.gain.setValueAtTime(currentGain, currentTime);
        mainGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + this.releaseTime);

        oscillators.forEach((oscillator) => {
            oscillator.stop(currentTime + this.releaseTime);
        });

        delete this.activeNotes[noteId];
    }

    /**
     * Converts MIDI note number to frequency in Hz.
     * @param {number} noteNumber - MIDI note number.
     * @returns {number} Frequency in Hz.
     */
    midiNoteToFrequency(noteNumber) {
        return 440 * Math.pow(2, (noteNumber - 69) / 12);
    }

    /**
     * Applies sustain pedal effect.
     */
    applySustain() {
        this.sustainOn = true; // Set sustain active
    }

    /**
     * Releases the sustain pedal effect.
     */
    releaseSustain() {
        if (!this.sustainOn) return; // Ensure sustain is on

        this.sustainOn = false;
        Object.values(this.activeNotes).forEach(({ oscillators, mainGainNode }) => {
            const currentTime = this.audioContext.currentTime;
            const currentGain = mainGainNode.gain.value || 0.001;

            mainGainNode.gain.cancelScheduledValues(currentTime);
            mainGainNode.gain.setValueAtTime(currentGain, currentTime);
            mainGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + this.releaseTime);

            oscillators.forEach((oscillator) => {
                oscillator.stop(currentTime + this.releaseTime);
            });
        });
        this.activeNotes = {};
    }

    /**
     * Changes the instrument by altering the oscillator waveform type.
     * @param {number} programNumber - MIDI program number to select instrument.
     */
    changeInstrument(programNumber) {
        const waveforms = ['sine', 'square', 'triangle', 'sawtooth'];
        const waveform = waveforms[programNumber % waveforms.length]; // Cycle through basic waveforms

        // Update active notes to the new waveform
        Object.values(this.activeNotes).forEach(({ oscillators }) => {
            oscillators.forEach(oscillator => {
                oscillator.type = waveform;
            });
        });
    }

    /**
     * Applies pitch bend to all oscillators.
     * @param {number} value - Pitch bend value.
     */
    bendPitch(value) {
        // Value typically ranges from -8192 to 8191 (MIDI standard), we map this to ±2 semitones.
        const semitoneRange = 2;
        const bendAmount = (value / 8192) * semitoneRange; // Map pitch bend value

        this.pitchBendAmount = bendAmount;

        // Apply pitch bend to all currently active oscillators
        Object.values(this.activeNotes).forEach(({ oscillators, frequency }) => {
            oscillators.forEach(oscillator => {
                this.applyPitchBend(oscillator, frequency, bendAmount);
            });
        });
    }

    /**
     * Applies pitch bend to a single oscillator.
     * @param {OscillatorNode} oscillator - The oscillator to modify.
     * @param {number} originalFrequency - Original frequency before pitch bend.
     * @param {number} bendAmount - Amount to bend in semitones.
     */
    applyPitchBend(oscillator, originalFrequency, bendAmount) {
        const newFrequency = originalFrequency * Math.pow(2, bendAmount / 12); // Adjust frequency by pitch bend
        oscillator.frequency.setValueAtTime(newFrequency, this.audioContext.currentTime);
    }
}

export default Synthesizer;