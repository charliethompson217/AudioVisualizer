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

import { useRef, useState, useEffect, useCallback } from 'react';
import { useAudioContext } from './useAudioContext';
import { useAudioAnalyzer } from './useAudioAnalyzer';
import { useSynthesizer } from './useSynthesizer';
import { useMidiPlayer } from './useMidiPlayer';
import { useKeyboardInput } from './useKeyboardInput';
import { convertAudioToPosteriorgrams, buildNotes } from '../utils/midiConversion.js';

export function useAudio(
  mp3File,
  midiFile,
  useMic,
  muteMic,
  bins,
  smoothing,
  isPlaying,
  minDecibels,
  maxDecibels,
  pianoEnabled,
  synthesizerSettings,
  meydaBufferSize,
  bpmAndKey = true,
  generateBrowserMIDI = true,
  onsetThreshold = 0.3,
  frameThreshold = 0.3,
  minDurationSec = 0.1,
  meydaFeaturesToExtract,
  setWarning
) {
  const volumeRef = useRef(0.5);
  const synthRef = useRef(null);

  // States for MIDI conversion
  const [convertedMidiNotes, setConvertedMidiNotes] = useState(null);
  const [basicPitchData, setBasicPitchData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(true);
  const [progress, setProgress] = useState(0);

  // Setup audio context and basic audio processing
  const { audioContext, analyser, sampleRate, duration, play, pause, seek, getCurrentTime, source } = useAudioContext(
    mp3File,
    useMic,
    muteMic,
    isPlaying,
    synthRef.current
  );

  // Initialize and manage synthesizer
  const synthesizer = useSynthesizer(audioContext, analyser, isPlaying, synthesizerSettings, volumeRef);

  useEffect(() => {
    synthRef.current = synthesizer;
  }, [synthesizer]);

  // Setup audio analysis with Web Audio API and Meyda
  const {
    dataArray,
    chroma,
    rms,
    spectralCentroid,
    spectralSpread,
    amplitudeSpectrum,
    complexSpectrum,
    energy,
    loudness,
    mfcc,
    perceptualSharpness,
    perceptualSpread,
    powerSpectrum,
    spectralFlatness,
    spectralFlux,
    spectralKurtosis,
    spectralRolloff,
    spectralSkewness,
    spectralSlope,
    zcr,
    bpm,
    scaleKey,
    isProcessing,
    essentiaFeatures,
  } = useAudioAnalyzer(
    analyser,
    audioContext,
    isPlaying,
    bins,
    smoothing,
    minDecibels,
    maxDecibels,
    meydaBufferSize,
    meydaFeaturesToExtract,
    mp3File,
    bpmAndKey,
    source,
    setWarning
  );

  // Handle MIDI file parsing and playback
  const { midiNotes } = useMidiPlayer(midiFile, synthesizer, isPlaying, setWarning);

  // Handle keyboard input for piano
  const { currentVolume } = useKeyboardInput(synthesizer, isPlaying, pianoEnabled);

  // Update volumeRef when keyboard input changes the volume
  useEffect(() => {
    if (currentVolume !== undefined) {
      volumeRef.current = currentVolume;
    }
  }, [currentVolume]);

  // Memoize buildNotes to avoid redundant computations
  const memoizedBuildNotes = useCallback((frames, onsets, contours, onset, frame, minDur) => {
    return buildNotes(frames, onsets, contours, onset, frame, minDur);
  }, []);

  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const debouncedConvertMidi = useRef(
    debounce((frames, onsets, contours, onset, frame, minDur) => {
      const notes = memoizedBuildNotes(frames, onsets, contours, onset, frame, minDur);
      setConvertedMidiNotes(notes);
    }, 300)
  ).current;

  // Convert mp3 to posteriorgrams
  useEffect(() => {
    if (!mp3File || !generateBrowserMIDI) return;

    const getData = async () => {
      setIsConverting(true);
      setConversionComplete(false);

      try {
        const data = await convertAudioToPosteriorgrams(mp3File, setProgress);
        setBasicPitchData(data);
        setConversionComplete(true);
      } catch (error) {
        console.error('Conversion failed:', error);
        setWarning(error.message);
        setConversionComplete(false);
      } finally {
        setIsConverting(false);
      }
    };

    getData();
  }, [mp3File, generateBrowserMIDI, setWarning]);

  // Update MIDI notes when thresholds or basicPitchData change
  useEffect(() => {
    if (!basicPitchData || !generateBrowserMIDI) return;
    const { frames, onsets, contours } = basicPitchData;
    if (frames && onsets && contours) {
      debouncedConvertMidi(frames, onsets, contours, onsetThreshold, frameThreshold, minDurationSec);
    }
  }, [basicPitchData, onsetThreshold, frameThreshold, minDurationSec, debouncedConvertMidi, generateBrowserMIDI]);

  return {
    analyser,
    dataArray,
    sampleRate,
    duration,
    play,
    pause,
    seek,
    getCurrentTime,
    midiNotes: midiFile ? midiNotes : convertedMidiNotes,
    basicPitchData,
    chroma,
    rms,
    spectralCentroid,
    spectralSpread,
    amplitudeSpectrum,
    complexSpectrum,
    energy,
    loudness,
    mfcc,
    perceptualSharpness,
    perceptualSpread,
    powerSpectrum,
    spectralFlatness,
    spectralFlux,
    spectralKurtosis,
    spectralRolloff,
    spectralSkewness,
    spectralSlope,
    zcr,
    bpm,
    scaleKey,
    isProcessing,
    isConverting,
    conversionComplete,
    progress,
    essentiaFeatures,
  };
}
