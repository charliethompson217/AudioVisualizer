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
import * as Tone from 'tone';

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
      Tone.setContext(audioContext);

      const synthesizer = new Synthesizer(audioContext, {
        synthesisMode: settings.synthesisMode,
        instrument: settings.instrument,
        sampleBaseUrl: 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com/samples',
        harmonicAmplitudes: settings.harmonicAmplitudes,
        attackTime: settings.attackTime,
        attackCurve: settings.attackCurve,
        decayTime: settings.decayTime,
        decayCurve: settings.decayCurve,
        sustainLevel: settings.sustainLevel,
        releaseTime: settings.releaseTime,
        releaseCurve: settings.releaseCurve,
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

  useEffect(() => {
    if (synthesizerRef.current) {
      if (settings.synthesisMode === 'sample') {
        synthesizerRef.current.updateSamplerSettings({
          instrument: settings.instrument,
          attackTime: settings.attackTime,
          attackCurve: settings.attackCurve,
          releaseTime: settings.releaseTime,
          releaseCurve: settings.releaseCurve,
        });
        synthesizerRef.current.updateSynthesisMode(settings.synthesisMode);
      } else {
        synthesizerRef.current.updateSynthesisMode(settings.synthesisMode);
        synthesizerRef.current.updateOscillatorType(settings.oscillatorType);
        synthesizerRef.current.updateHarmonicAmplitudes(settings.harmonicAmplitudes);
        synthesizerRef.current.updateADSR({
          attackTime: settings.attackTime,
          attackCurve: settings.attackCurve,
          decayTime: settings.decayTime,
          decayCurve: settings.decayCurve,
          sustainLevel: settings.sustainLevel,
          releaseTime: settings.releaseTime,
          releaseCurve: settings.releaseCurve,
        });
        synthesizerRef.current.updateVibratoAndTremolo({
          vibratoDepth: settings.vibratoDepth,
          vibratoRate: settings.vibratoRate,
          tremoloDepth: settings.tremoloDepth,
          tremoloRate: settings.tremoloRate,
        });
      }
    }
  }, [settings]);

  return synthesizerRef.current;
}
