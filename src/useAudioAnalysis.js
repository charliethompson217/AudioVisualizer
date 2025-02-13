import { useRef, useState, useEffect, useCallback } from 'react';
import { parseMidi } from 'midi-file';
import Synthesizer from './Synthesizer';
import Meyda from 'meyda';

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
  harmonicAmplitudes = { 1: 1.0 },
  ATTACK_TIME,
  DECAY_TIME,
  SUSTAIN_LEVEL,
  RELEASE_TIME,
  vibratoDepth,
  vibratoRate,
  tremoloDepth,
  tremoloRate
) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const synthesizerRef = useRef(null);
  const octaveRef = useRef(4);
  const volumeRef = useRef(0.5);
  const activeKeysRef = useRef(new Set());
  const gainNodeRef = useRef(null);
  const meydaAnalyzerRef = useRef(null);

  const [dataArray, setDataArray] = useState(null);
  const [sampleRate, setSampleRate] = useState(44100);
  const audioElementRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [midiNotes, setMidiNotes] = useState([]);
  const [chroma, setChroma] = useState([]);
  const [rms, setRms] = useState(0);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      analyserRef.current.fftSize = bins;
      analyserRef.current.smoothingTimeConstant = smoothing;
      analyserRef.current.minDecibels = minDecibels;
      analyserRef.current.maxDecibels = maxDecibels;
    }
  }, [bins, smoothing, minDecibels, maxDecibels, isPlaying]);

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

  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateVibratoAndTremolo({
        vibratoDepth,
        vibratoRate,
        tremoloDepth,
        tremoloRate,
      });
    }
  }, [vibratoDepth, vibratoRate, tremoloDepth, tremoloRate]);

  useEffect(() => {
    if (!isPlaying) {
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
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
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

      const gainNode = audioContext.createGain();
      gainNode.gain.value = volumeRef.current;
      gainNodeRef.current = gainNode;

      // Connect analyser to GainNode only if not using microphone
      if (!useMic) {
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
      }
    }

    if (!synthesizerRef.current) {
      const validHarmonicAmplitudes = harmonicAmplitudes && Object.keys(harmonicAmplitudes).length > 0
        ? harmonicAmplitudes
        : { 1: 1.0 };

      const synthesizer = new Synthesizer(audioContextRef.current, {
        harmonicAmplitudes: validHarmonicAmplitudes,
        attackTime: ATTACK_TIME,
        decayTime: DECAY_TIME,
        sustainLevel: SUSTAIN_LEVEL,
        releaseTime: RELEASE_TIME,
        analyserNode: analyserRef.current,
        getVolume: () => volumeRef.current,
        vibratoDepth,
        vibratoRate,
        tremoloDepth,
        tremoloRate,
      });
      synthesizerRef.current = synthesizer;
    }

    // Update GainNode when volume changes
    gainNodeRef.current.gain.value = volumeRef.current;

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
      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration);
      });
      audioElement.addEventListener('ended', () => {
        // Handle end of playback if needed
      });
      // Store audioElement in ref
      audioElementRef.current = audioElement;
    }

    if (analyserRef.current && Meyda) {
      meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: analyserRef.current,
        bufferSize: 512,
        featureExtractors: ['chroma', 'rms'],
        callback: (features) => {
          setChroma(features.chroma || []);
          setRms(features.rms || 0);
        },
      });
      meydaAnalyzerRef.current.start();
    }

    return () => {
      if (source && source instanceof MediaStreamAudioSourceNode) {
        const tracks = source.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
      // Stop all active notes on cleanup
      if (synthesizerRef.current) {
        synthesizerRef.current.stopAllNotes();
      }
      if (meydaAnalyzerRef.current) {
        meydaAnalyzerRef.current.stop();
        meydaAnalyzerRef.current = null;
      }
    };
  }, [isPlaying, pianoEnabled, mp3File, useMic]);

  useEffect(() => {
    if (isPlaying && !useMic && analyserRef.current && gainNodeRef.current) {
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } else if (useMic && analyserRef.current && gainNodeRef.current) {
      try {
        analyserRef.current.disconnect(gainNodeRef.current);
        gainNodeRef.current.disconnect(audioContextRef.current.destination);
      } catch (error) {
        console.warn('Disconnect failed:', error);
      }
    }
  }, [useMic, isPlaying]);

  useEffect(() => {
    if (!midiFile || !synthesizerRef.current || !isPlaying) return;

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
        setMidiNotes(buildNotes(parsedMidi));
        playMidi(parsedMidi);
      };
      reader.readAsArrayBuffer(fileBlob);
    };

    function buildNotes(parsedMidi) {
      const notesResult = [];
      const ticksPerBeat = parsedMidi.header.ticksPerBeat || 480;
      let microsecondsPerBeat = 500000;
      parsedMidi.tracks.forEach((track) => {
        let currentTime = 0;
        const activeMap = {};
        track.forEach((event) => {
          currentTime += event.deltaTime;
          if (event.meta && event.type === 'setTempo') {
            microsecondsPerBeat = event.microsecondsPerBeat;
          }
          const secondsPerTick = microsecondsPerBeat / 1_000_000 / ticksPerBeat;
          const eventTimeSec = currentTime * secondsPerTick;
          if (event.type === 'noteOn' && event.velocity > 0) {
            activeMap[event.noteNumber] = { startTime: eventTimeSec, velocity: event.velocity }; // Store velocity
          } else if (
            event.type === 'noteOff' ||
            (event.type === 'noteOn' && event.velocity === 0)
          ) {
            const note = activeMap[event.noteNumber];
            if (note) {
              notesResult.push({
                noteNumber: event.noteNumber,
                startSec: note.startTime,
                durationSec: eventTimeSec - note.startTime,
                velocity: note.velocity, // Add velocity
              });
              delete activeMap[event.noteNumber];
            }
          }
        });
      });
      return notesResult;
    }

    fetchMidiFile();

    function playMidi(parsedMidi) {
      const ticksPerBeat = parsedMidi.header.ticksPerBeat;
      let microsecondsPerBeat = 500000;
    
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
            const timeoutId = setTimeout(() => {
              synthesizerRef.current?.noteOn(event.noteNumber, event.velocity, true);
            }, delay * 1000);
            timeoutsRef.current.push(timeoutId);
          } else if (
            event.type === 'noteOff' ||
            (event.type === 'noteOn' && event.velocity === 0)
          ) {
            const timeoutId = setTimeout(() => {
              synthesizerRef.current?.noteOff(event.noteNumber);
            }, delay * 1000);
            timeoutsRef.current.push(timeoutId);
          }
        });
      });
    }
    
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [midiFile, isPlaying]);

  useEffect(() => {
    if (!pianoEnabled || !synthesizerRef.current || !isPlaying) return;

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      event.preventDefault();

      if (event.key === 'ArrowLeft') {
        octaveRef.current = Math.max(-1, octaveRef.current - 1);
      } else if (event.key === 'ArrowRight') {
        octaveRef.current = Math.min(9, octaveRef.current + 1);
      } else if (event.key === 'ArrowUp') {
        volumeRef.current = Math.min(2, volumeRef.current + 0.1); // Increase volume
      } else if (event.key === 'ArrowDown') {
        volumeRef.current = Math.max(0.0, volumeRef.current - 0.1); // Decrease volume
      } else if (event.key === ' ') {
        synthesizerRef.current.stopAllNotes();
        return;
      } else {
        const noteNumber = mapKeyToNoteNumber(event.key);
        if (noteNumber !== null) {
          synthesizerRef.current.noteOn(noteNumber);
          activeKeysRef.current.add(event.key);
        }
      }
    };

    const handleKeyUp = (event) => {
      const noteNumber = mapKeyToNoteNumber(event.key);
      if (noteNumber !== null) {
        synthesizerRef.current.noteOff(noteNumber);
        activeKeysRef.current.delete(event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (synthesizerRef.current) {
        synthesizerRef.current.stopAllNotes();
      }
    };
  }, [pianoEnabled, isPlaying]);

  useEffect(() => {
    // Update GainNode whenever volumeRef changes
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeRef.current;
    }
  }, [volumeRef.current]);

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

  function mapKeyToNoteNumber(key) {
    if (key in keyNoteMapping) {
      // Calculate the MIDI note number based on the current octave
      return 60 + keyNoteMapping[key] + 12 * (octaveRef.current - 4);
    }
    return null;
  }

  const play = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioElementRef.current ? audioElementRef.current.currentTime : 0;
  }, []);

  return {
    analyser: analyserRef.current,
    dataArray,
    sampleRate,
    duration,
    play,
    pause,
    seek,
    getCurrentTime,
    midiNotes,
    chroma,
    rms,
  };
}