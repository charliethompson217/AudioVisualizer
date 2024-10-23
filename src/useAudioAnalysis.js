// useAudioAnalysis.js

import { useRef, useState, useEffect } from 'react';
import { parseMidi } from 'midi-file';
import Synthesizer from './Synthesizer';

/**
 * Custom hook to analyze audio input using the Web Audio API.
 * Handles MP3 files, microphone inputs, and synthesizes MIDI files.
 * Also supports a virtual piano keyboard for note input.
 *
 * @param {string} mp3File - URL or local file of the MP3 to analyze.
 * @param {File} midiFile - MIDI file to be processed for note playback.
 * @param {boolean} useMic - Whether to use microphone input.
 * @param {number} bins - FFT bin size (power of 2), affects frequency resolution.
 * @param {number} smoothing - Smoothing factor for FFT data (0 to 1).
 * @param {boolean} isPlaying - Whether audio analysis is running.
 * @param {number} minDecibels - Minimum decibel threshold for filtering noise.
 * @param {number} maxDecibels - Maximum decibel threshold for the analyser.
 * @param {boolean} pianoEnabled - Whether the virtual piano should be enabled.
 * @param {object} harmonicAmplitudes - Object mapping harmonics (1-8) to amplitudes.
 * @param {number} ATTACK_TIME - ADSR envelope attack time in seconds.
 * @param {number} DECAY_TIME - ADSR envelope decay time in seconds.
 * @param {number} SUSTAIN_LEVEL - ADSR sustain level as a fraction of max volume.
 * @param {number} RELEASE_TIME - ADSR envelope release time in seconds.
 * @returns {object} Contains analyser node and the FFT data array for visualization.
 */
export function useAudioAnalysis(
  mp3File,
  midiFile,
  useMic,
  bins,
  smoothing,
  isPlaying,
  minDecibels,
  maxDecibels,
  pianoEnabled,
  harmonicAmplitudes = {},
  ATTACK_TIME = 0.01,
  DECAY_TIME = 0.3,
  SUSTAIN_LEVEL = 0.2,
  RELEASE_TIME = 0.5,
) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const synthesizerRef = useRef(null);
  const octaveRef = useRef(4);  // Default octave is 4
  const volumeRef = useRef(1.0);  // Default volume is 1.0 (max)
  const midiVolumeRef = useRef(1.0); // Separate volume for MIDI files
  const activeNotesRef = useRef(new Set()); // Track all active notes to ensure they are stopped
  const [dataArray, setDataArray] = useState(null);
  const [sampleRate, setSampleRate] = useState(44100);

  useEffect(() => {
    let audioContext;
    let analyser;
    let source;
    let audioElement;
    let fileURL = null; // To track the object URL for local file cleanup

    const setupAudioContext = async () => {
      audioContext = new (window.AudioContext || window.AudioContext)({
        latencyHint: 'interactive',
      });

      analyser = audioContext.createAnalyser();
      analyser.fftSize = bins;
      analyser.smoothingTimeConstant = smoothing;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      dataArrayRef.current = data;
      setDataArray(data);
      setSampleRate(audioContext.sampleRate);

      if (useMic) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } else if (mp3File) {
        // Handle case where mp3File is a URL or a File
        if (typeof mp3File === 'string') {
          // If mp3File is a URL, use it directly
          audioElement = new Audio(mp3File);
        } else if (mp3File instanceof File) {
          // If mp3File is a File object, create a blob URL
          fileURL = URL.createObjectURL(mp3File);
          audioElement = new Audio(fileURL);
        }

        audioElement.crossOrigin = 'anonymous';
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination); // Connect to destination only when playing MP3
        audioElement.play();
      }

      // Initialize the synthesizer
      const synthesizer = new Synthesizer(audioContext, {
        harmonicAmplitudes,
        attackTime: ATTACK_TIME,
        decayTime: DECAY_TIME,
        sustainLevel: SUSTAIN_LEVEL,
        releaseTime: RELEASE_TIME,
        analyserNode: analyser, // Connect synthesizer to analyser for visualization
        getVolume: () => volumeRef.current, // Pass volume to the synthesizer
        getMidiVolume: () => midiVolumeRef.current, // Use separate MIDI volume
      });
      synthesizerRef.current = synthesizer;
    };

    if (isPlaying || pianoEnabled) {
      setupAudioContext();
    }

    // Clean up when component unmounts or dependencies change
    return () => {
      if (audioContext) audioContext.close();
      if (source && source instanceof MediaStreamAudioSourceNode) {
        const tracks = source.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (fileURL) {
        URL.revokeObjectURL(fileURL); // Clean up the blob URL if it was created
      }
    };
  }, [
    mp3File,
    useMic,
    bins,
    smoothing,
    isPlaying,
    minDecibels,
    maxDecibels,
    pianoEnabled,
    harmonicAmplitudes,
    ATTACK_TIME,
    DECAY_TIME,
    SUSTAIN_LEVEL,
    RELEASE_TIME,
  ]);

  // Handle MIDI file playback
  useEffect(() => {
    if (!midiFile || !synthesizerRef.current) return;

    const fetchMidiFile = async () => {
      try {
        // If the midiFile is a URL (from S3 or any other source), fetch it
        if (typeof midiFile === 'string') {
          const response = await fetch(midiFile);
          if (!response.ok) throw new Error('Failed to fetch MIDI file');
          const blob = await response.blob();
          readMidiFile(blob);
        } else if (midiFile instanceof Blob || midiFile instanceof File) {
          // If it's already a Blob or File, read it directly
          readMidiFile(midiFile);
        }
      } catch (error) {
        console.error('Error fetching or processing MIDI file:', error);
      }
    };

    const readMidiFile = (fileBlob) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const parsedMidi = parseMidi(new Uint8Array(arrayBuffer));
        playMidi(parsedMidi);
      };
      reader.readAsArrayBuffer(fileBlob);
    };

    fetchMidiFile();

    /**
     * Plays the parsed MIDI file using the synthesizer.
     * @param {object} parsedMidi - Parsed MIDI file object.
     */
    function playMidi(parsedMidi) {
      const ticksPerBeat = parsedMidi.header.ticksPerBeat;
      let microsecondsPerBeat = 500000; // Default tempo (120 BPM)

      parsedMidi.tracks.forEach(track => {
        let trackTime = 0;

        track.forEach(event => {
          // Check for tempo change events
          if (event.meta && event.type === 'setTempo') {
            microsecondsPerBeat = event.microsecondsPerBeat;
          }

          trackTime += event.deltaTime;
          const delay = (trackTime / ticksPerBeat) * (microsecondsPerBeat / 1000000);  // Adjust delay using tempo

          if (event.type === 'noteOn' && event.velocity > 0) {
            setTimeout(() => {
              synthesizerRef.current.noteOn(event.noteNumber, event.velocity, true); // true for MIDI
            }, delay * 1000);
          } else if (
            event.type === 'noteOff' ||
            (event.type === 'noteOn' && event.velocity === 0)
          ) {
            setTimeout(() => {
              synthesizerRef.current.noteOff(event.noteNumber, true); // true for MIDI
            }, delay * 1000);
          } else if (event.type === 'controller') {
            // Handle sustain pedal (controller type 64)
            if (event.controllerType === 64) {
              const sustainOn = event.value >= 64;
              if (sustainOn) {
                synthesizerRef.current.applySustain();
              } else {
                synthesizerRef.current.releaseSustain();
              }
            } else if (event.controllerType === 7) {
              // Volume control (controller type 7)
              midiVolumeRef.current = event.value / 127; // MIDI volume is 0-127
            }
          } else if (event.type === 'programChange') {
            synthesizerRef.current.changeInstrument(event.programNumber);
          } else if (event.type === 'pitchBend') {
            synthesizerRef.current.bendPitch(event.value);
          }
        });
      });
    }
  }, [midiFile]);

  // Handle keyboard input for the virtual piano
  useEffect(() => {
    if (!pianoEnabled || !synthesizerRef.current) return;

    const pianoKeys = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'];
    const keyNoteMapping = {
      'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11
    };

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') {
        volumeRef.current = Math.min(volumeRef.current + 0.05, 1.0); // Increase volume
      } else if (event.key === 'ArrowDown') {
        volumeRef.current = Math.max(volumeRef.current - 0.05, 0); // Decrease volume
      } else if (event.key === 'ArrowRight') {
        // Stop all currently active notes before changing octave
        activeNotesRef.current.forEach(noteNumber => synthesizerRef.current.noteOff(noteNumber));
        activeNotesRef.current.clear(); // Clear active notes
        octaveRef.current = Math.min(octaveRef.current + 1, 9); // Increase octave
      } else if (event.key === 'ArrowLeft') {
        // Stop all currently active notes before changing octave
        activeNotesRef.current.forEach(noteNumber => synthesizerRef.current.noteOff(noteNumber));
        activeNotesRef.current.clear(); // Clear active notes
        octaveRef.current = Math.max(octaveRef.current - 1, 1); // Decrease octave
      } else if (event.key === 'Shift') {
        synthesizerRef.current.applySustain();
      } else if (pianoKeys.includes(event.key) && !activeNotesRef.current.has(event.key)) {
        const noteNumber = 60 + keyNoteMapping[event.key] + 12 * (octaveRef.current - 4); // Adjust note by octave
        synthesizerRef.current.noteOn(noteNumber);
        activeNotesRef.current.add(noteNumber); // Track the note as active
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        synthesizerRef.current.releaseSustain(); // Release sustain
      } else if (pianoKeys.includes(event.key)) {
        const noteNumber = 60 + keyNoteMapping[event.key] + 12 * (octaveRef.current - 4); // Adjust note by octave
        synthesizerRef.current.noteOff(noteNumber);
        activeNotesRef.current.delete(noteNumber); // Remove the note from active tracking
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up event listeners on unmount or when dependencies change
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pianoEnabled]);

  return { analyser: analyserRef.current, dataArray, sampleRate };
}