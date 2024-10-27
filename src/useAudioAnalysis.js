// useAudioAnalysis.js

import { useRef, useState, useEffect } from 'react';
import { parseMidi } from 'midi-file';
import Synthesizer from './Synthesizer';

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
  RELEASE_TIME = 0.5
) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const synthesizerRef = useRef(null);
  const octaveRef = useRef(4); // Default octave is 4
  const volumeRef = useRef(1.0); // Default volume is 1.0 (max)
  const midiVolumeRef = useRef(1.0); // Separate volume for MIDI files
  const activeNotesRef = useRef(new Set()); // Track all active notes to ensure they are stopped
  const [dataArray, setDataArray] = useState(null);
  const [sampleRate, setSampleRate] = useState(44100);

  // Initialize Audio Context and Analyser Node
  useEffect(() => {
    if (!isPlaying && !pianoEnabled) {
      // Clean up if not playing and piano is not enabled
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (synthesizerRef.current) {
        synthesizerRef.current = null;
      }
      return;
    }

    if (!audioContextRef.current) {
      const audioContext = new (window.AudioContext || window.AudioContext)({
        latencyHint: 'interactive',
      });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      setSampleRate(audioContext.sampleRate);
    }

    if (!synthesizerRef.current) {
      const synthesizer = new Synthesizer(audioContextRef.current, {
        harmonicAmplitudes,
        attackTime: ATTACK_TIME,
        decayTime: DECAY_TIME,
        sustainLevel: SUSTAIN_LEVEL,
        releaseTime: RELEASE_TIME,
        analyserNode: analyserRef.current,
        getVolume: () => volumeRef.current,
        getMidiVolume: () => midiVolumeRef.current,
      });
      synthesizerRef.current = synthesizer;
    }

    // Set up data array for analyser
    const analyser = analyserRef.current;
    analyser.fftSize = bins;
    analyser.smoothingTimeConstant = smoothing;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;

    const data = new Uint8Array(analyser.frequencyBinCount);
    dataArrayRef.current = data;
    setDataArray(data);

    let source;
    let audioElement;
    let fileURL = null;

    if (useMic) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      });
    } else if (mp3File) {
      if (typeof mp3File === 'string') {
        audioElement = new Audio(mp3File);
      } else if (mp3File instanceof File) {
        fileURL = URL.createObjectURL(mp3File);
        audioElement = new Audio(fileURL);
      }
      audioElement.crossOrigin = 'anonymous';
      source = audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      audioElement.play();
    }

    return () => {
      if (source && source instanceof MediaStreamAudioSourceNode) {
        const tracks = source.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [isPlaying, pianoEnabled, mp3File, useMic]);

  // Update analyser properties in real-time
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.minDecibels = minDecibels;
      if (minDecibels > maxDecibels) {
        analyserRef.current.maxDecibels = minDecibels;
      }
    }
  }, [minDecibels]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.maxDecibels = maxDecibels;
      if (maxDecibels < minDecibels) {
        analyserRef.current.minDecibels = maxDecibels;
      }
    }
  }, [maxDecibels]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = smoothing;
    }
  }, [smoothing]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = bins;
      const newDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      dataArrayRef.current = newDataArray;
      setDataArray(newDataArray);
    }
  }, [bins]);

  // Update synthesizer parameters in real-time
  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateHarmonicAmplitudes(harmonicAmplitudes);
    }
  }, [harmonicAmplitudes]);

  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateADSR({
        attackTime: ATTACK_TIME,
        decayTime: DECAY_TIME,
        sustainLevel: SUSTAIN_LEVEL,
        releaseTime: RELEASE_TIME,
      });
    }
  }, [ATTACK_TIME, DECAY_TIME, SUSTAIN_LEVEL, RELEASE_TIME]);

  // Handle MIDI file playback
  // Handle MIDI file playback
  useEffect(() => {
    if (!midiFile || !synthesizerRef.current) return;

    const fetchMidiFile = async () => {
      try {
        let fileBlob;
        if (typeof midiFile === 'string') {
          const response = await fetch(midiFile);
          if (!response.ok) throw new Error('Failed to fetch MIDI file');
          fileBlob = await response.blob();
        } else if (midiFile instanceof Blob || midiFile instanceof File) {
          fileBlob = midiFile;
        }
        readMidiFile(fileBlob);
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

    function playMidi(parsedMidi) {
      const ticksPerBeat = parsedMidi.header.ticksPerBeat;
      let microsecondsPerBeat = 500000; // Default tempo (120 BPM)

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;

        track.forEach((event) => {
          if (event.meta && event.type === 'setTempo') {
            microsecondsPerBeat = event.microsecondsPerBeat;
          }

          trackTime += event.deltaTime;
          const delay =
            (trackTime / ticksPerBeat) * (microsecondsPerBeat / 1000000);

          if (event.type === 'noteOn' && event.velocity > 0) {
            setTimeout(() => {
              synthesizerRef.current.noteOn(event.noteNumber, event.velocity, true);
            }, delay * 1000);
          } else if (
            event.type === 'noteOff' ||
            (event.type === 'noteOn' && event.velocity === 0)
          ) {
            setTimeout(() => {
              synthesizerRef.current.noteOff(event.noteNumber, true);
            }, delay * 1000);
          } else if (event.type === 'controller') {
            if (event.controllerType === 64) {
              const sustainOn = event.value >= 64;
              if (sustainOn) {
                synthesizerRef.current.applySustain();
              } else {
                synthesizerRef.current.releaseSustain();
              }
            } else if (event.controllerType === 7) {
              midiVolumeRef.current = event.value / 127;
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
      z: 0,
      s: 1,
      x: 2,
      d: 3,
      c: 4,
      v: 5,
      g: 6,
      b: 7,
      h: 8,
      n: 9,
      j: 10,
      m: 11,
    };

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') {
        volumeRef.current = Math.min(volumeRef.current + 0.05, 1.0);
      } else if (event.key === 'ArrowDown') {
        volumeRef.current = Math.max(volumeRef.current - 0.05, 0);
      } else if (event.key === 'ArrowRight') {
        activeNotesRef.current.forEach((noteNumber) =>
          synthesizerRef.current.noteOff(noteNumber)
        );
        activeNotesRef.current.clear();
        octaveRef.current = Math.min(octaveRef.current + 1, 9);
      } else if (event.key === 'ArrowLeft') {
        activeNotesRef.current.forEach((noteNumber) =>
          synthesizerRef.current.noteOff(noteNumber)
        );
        activeNotesRef.current.clear();
        octaveRef.current = Math.max(octaveRef.current - 1, 1);
      } else if (event.key === 'Shift') {
        synthesizerRef.current.applySustain();
      } else if (pianoKeys.includes(event.key)) {
        const noteNumber = 60 + keyNoteMapping[event.key] + 12 * (octaveRef.current - 4);
        synthesizerRef.current.noteOn(noteNumber);
        activeNotesRef.current.add(noteNumber);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        synthesizerRef.current.releaseSustain();
      } else if (pianoKeys.includes(event.key)) {
        const noteNumber = 60 + keyNoteMapping[event.key] + 12 * (octaveRef.current - 4);
        synthesizerRef.current.noteOff(noteNumber);
        activeNotesRef.current.delete(noteNumber);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pianoEnabled]);

  return { analyser: analyserRef.current, dataArray, sampleRate };
}