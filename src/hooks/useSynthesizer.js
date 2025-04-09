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

import { useRef, useEffect } from 'react';
import Synthesizer from '../utils/Synthesizer';

export function useSynthesizer(
  audioContext,
  analyser,
  isPlaying,
  harmonicAmplitudes = { 1: 1.0 },
  attackTime = 0.05,
  decayTime = 0.1,
  sustainLevel = 0.7,
  releaseTime = 0.2,
  vibratoDepth = 0,
  vibratoRate = 5,
  tremoloDepth = 0,
  tremoloRate = 5,
  oscillatorType = 'sine',
  volume = 0.5
) {
  const synthesizerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || !audioContext || !analyser) {
      if (synthesizerRef.current) {
        synthesizerRef.current = null;
      }
      return;
    }

    if (!synthesizerRef.current) {
      const validHarmonicAmplitudes =
        harmonicAmplitudes && Object.keys(harmonicAmplitudes).length > 0
          ? harmonicAmplitudes
          : { 1: 1.0 };

      const synthesizer = new Synthesizer(audioContext, {
        harmonicAmplitudes: validHarmonicAmplitudes,
        attackTime,
        decayTime,
        sustainLevel,
        releaseTime,
        analyserNode: analyser,
        getVolume: () => volume,
        vibratoDepth,
        vibratoRate,
        tremoloDepth,
        tremoloRate,
        oscillatorType,
      });
      synthesizerRef.current = synthesizer;
    }

    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.stopAllNotes();
        synthesizerRef.current = null;
      }
    };
  }, [isPlaying, audioContext, analyser]);

  // Update oscillator type when it changes
  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateOscillatorType(oscillatorType);
    }
  }, [oscillatorType]);

  // Update harmonic amplitudes when they change
  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateHarmonicAmplitudes(harmonicAmplitudes);
    }
  }, [harmonicAmplitudes]);

  // Update ADSR settings when they change
  useEffect(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.updateADSR({
        attackTime,
        decayTime,
        sustainLevel,
        releaseTime,
      });
    }
  }, [attackTime, decayTime, sustainLevel, releaseTime]);

  // Update vibrato and tremolo settings when they change
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

  return synthesizerRef.current;
}
