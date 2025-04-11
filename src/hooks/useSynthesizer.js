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

export function useSynthesizer(audioContext, analyser, isPlaying, settings, volumeRef) {
  const synthesizerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || !audioContext || !analyser) {
      if (synthesizerRef.current) {
        synthesizerRef.current = null;
      }
      return;
    }

    if (!synthesizerRef.current) {
      const synthesizer = new Synthesizer(audioContext, {
        harmonicAmplitudes: settings.harmonicAmplitudes,
        attackTime: settings.attackTime,
        decayTime: settings.decayTime,
        sustainLevel: settings.sustainLevel,
        releaseTime: settings.releaseTime,
        analyserNode: analyser,
        getVolume: () => volumeRef.current,
        vibratoDepth: settings.vibratoDepth,
        vibratoRate: settings.vibratoRate,
        tremoloDepth: settings.tremoloDepth,
        tremoloRate: settings.tremoloRate,
        oscillatorType: settings.oscillatorType,
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

  // Update all synthesizer settings in a single useEffect
  useEffect(() => {
    if (synthesizerRef.current) {
      // Update oscillator type
      synthesizerRef.current.updateOscillatorType(settings.oscillatorType);

      // Update harmonic amplitudes
      synthesizerRef.current.updateHarmonicAmplitudes(settings.harmonicAmplitudes);

      // Update ADSR
      synthesizerRef.current.updateADSR({
        attackTime: settings.attackTime,
        decayTime: settings.decayTime,
        sustainLevel: settings.sustainLevel,
        releaseTime: settings.releaseTime,
      });

      // Update vibrato and tremolo
      synthesizerRef.current.updateVibratoAndTremolo({
        vibratoDepth: settings.vibratoDepth,
        vibratoRate: settings.vibratoRate,
        tremoloDepth: settings.tremoloDepth,
        tremoloRate: settings.tremoloRate,
      });
    }
  }, [settings]);

  return synthesizerRef.current;
}
