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

import { useRef, useState, useEffect } from 'react';
import { useAudioContext } from './useAudioContext';
import { useAudioAnalyzer } from './useAudioAnalyzer';
import { useSynthesizer } from './useSynthesizer';
import { useMidiPlayer } from './useMidiPlayer';
import { useKeyboardInput } from './useKeyboardInput';
import { processAudioFileEssentia } from '../utils/essentiaAudioProcessing.js';
import { convertAudioToMidi } from '../utils/midiConversion.js';

export function useAudio(
  mp3File,
  midiFile,
  useMic,
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
  minDurationSec = 0.1
) {
  const volumeRef = useRef(0.5);

  // States for BPM and key detection
  const [bpm, setBpm] = useState(null);
  const [scaleKey, setScaleKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for MIDI conversion
  const [convertedMidiNotes, setConvertedMidiNotes] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(true);
  const [warning, setWarning] = useState(null);
  const [progress, setProgress] = useState(0);

  // Setup audio context and basic audio processing
  const {
    audioContext,
    analyser,
    sampleRate,
    duration,
    play,
    pause,
    seek,
    getCurrentTime,
  } = useAudioContext(mp3File, useMic, isPlaying);

  // Initialize and manage synthesizer
  const synthesizer = useSynthesizer(
    audioContext,
    analyser,
    isPlaying,
    synthesizerSettings,
    volumeRef
  );

  // Setup audio analysis with Web Audio API and Meyda
  const { dataArray, chroma, rms, spectralCentroid, spectralSpread } =
    useAudioAnalyzer(
      analyser,
      audioContext,
      isPlaying,
      bins,
      smoothing,
      minDecibels,
      maxDecibels,
      meydaBufferSize
    );

  // Handle MIDI file parsing and playback
  const { midiNotes } = useMidiPlayer(midiFile, synthesizer, isPlaying);

  // Handle keyboard input for piano
  const { currentVolume } = useKeyboardInput(
    synthesizer,
    isPlaying,
    pianoEnabled
  );

  // Update volumeRef when keyboard input changes the volume
  useEffect(() => {
    if (currentVolume !== undefined) {
      volumeRef.current = currentVolume;
    }
  }, [currentVolume]);

  // Process audio for BPM and key when mp3File changes
  useEffect(() => {
    if (!mp3File || !bpmAndKey) return;

    const analyzeAudio = async () => {
      setIsProcessing(true);
      try {
        const result = await processAudioFileEssentia(mp3File);
        setBpm(result.bpm);
        setScaleKey(result.key);
      } catch (error) {
        setWarning(error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    analyzeAudio();
  }, [mp3File, bpmAndKey]);

  // Convert mp3 to MIDI when mp3File changes
  useEffect(() => {
    if (!mp3File || !generateBrowserMIDI) return;

    const convertMidi = async () => {
      setIsConverting(true);
      setConversionComplete(false);
      setWarning(null);

      try {
        const notes = await convertAudioToMidi(
          mp3File,
          setProgress,
          onsetThreshold,
          frameThreshold,
          minDurationSec
        );

        setConvertedMidiNotes(notes);
        setConversionComplete(true);
      } catch (error) {
        console.error('Conversion failed:', error);
        setWarning(error.message);
        setConversionComplete(false);
      } finally {
        setIsConverting(false);
      }
    };

    convertMidi();
  }, [
    mp3File,
    generateBrowserMIDI,
    onsetThreshold,
    frameThreshold,
    minDurationSec,
  ]);

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
    chroma,
    rms,
    spectralCentroid,
    spectralSpread,
    bpm,
    scaleKey,
    isProcessing,
    isConverting,
    conversionComplete,
    warning,
    progress,
  };
}
