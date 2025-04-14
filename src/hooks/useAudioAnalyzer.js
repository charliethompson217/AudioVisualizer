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
import Meyda from 'meyda';

export function useAudioAnalyzer(
  analyser,
  audioContext,
  isPlaying,
  bins = 2048,
  smoothing = 0.8,
  minDecibels = -100,
  maxDecibels = -30,
  meydaBufferSize = 512,
  meydaFeaturesToExtract
) {
  const [dataArray, setDataArray] = useState(null);
  const dataArrayRef = useRef(null);
  const meydaAnalyzerRef = useRef(null);
  const meydaBufferSizeRef = useRef(meydaBufferSize);

  const [chroma, setChroma] = useState([]);
  const [rms, setRms] = useState(0);
  const [spectralCentroid, setSpectralCentroid] = useState(0);
  const [spectralSpread, setSpectralSpread] = useState(0);
  const [amplitudeSpectrum, setAmplitudeSpectrum] = useState([]);
  const [complexSpectrum, setComplexSpectrum] = useState({});
  const [energy, setEnergy] = useState(0);
  const [loudness, setLoudness] = useState({});
  const [mfcc, setMfcc] = useState([]);
  const [perceptualSharpness, setPerceptualSharpness] = useState(0);
  const [perceptualSpread, setPerceptualSpread] = useState(0);
  const [powerSpectrum, setPowerSpectrum] = useState([]);
  const [spectralFlatness, setSpectralFlatness] = useState(0);
  const [spectralFlux, setSpectralFlux] = useState(0);
  const [spectralKurtosis, setSpectralKurtosis] = useState(0);
  const [spectralRolloff, setSpectralRolloff] = useState(0);
  const [spectralSkewness, setSpectralSkewness] = useState(0);
  const [spectralSlope, setSpectralSlope] = useState(0);
  const [zcr, setZcr] = useState(0);

  // Update meydaBufferSizeRef when buffer size changes
  useEffect(() => {
    meydaBufferSizeRef.current = meydaBufferSize;
  }, [meydaBufferSize]);

  // Configure analyzer node when parameters change
  useEffect(() => {
    if (isPlaying && analyser) {
      analyser.fftSize = bins;
      analyser.smoothingTimeConstant = smoothing;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;

      const data = new Uint8Array(analyser.frequencyBinCount);
      dataArrayRef.current = data;
      setDataArray(data);
    }
  }, [bins, smoothing, minDecibels, maxDecibels, isPlaying, analyser]);

  // Create Meyda analyzer when analyser and audioContext are available
  useEffect(() => {
    if (analyser && audioContext && isPlaying && Meyda) {
      if (meydaAnalyzerRef.current) {
        meydaAnalyzerRef.current.stop();
      }

      meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContext,
        source: analyser,
        bufferSize: meydaBufferSizeRef.current,
        featureExtractors: meydaFeaturesToExtract,
        callback: (features) => {
          if (meydaFeaturesToExtract.includes('chroma')) setChroma(features.chroma || []);
          if (meydaFeaturesToExtract.includes('rms')) setRms(features.rms || 0);
          if (meydaFeaturesToExtract.includes('spectralCentroid')) setSpectralCentroid(features.spectralCentroid || 0);
          if (meydaFeaturesToExtract.includes('spectralSpread')) setSpectralSpread(features.spectralSpread || 0);
          if (meydaFeaturesToExtract.includes('amplitudeSpectrum'))
            setAmplitudeSpectrum(features.amplitudeSpectrum || []);
          if (meydaFeaturesToExtract.includes('complexSpectrum')) setComplexSpectrum(features.complexSpectrum || {});
          if (meydaFeaturesToExtract.includes('energy')) setEnergy(features.energy || 0);
          if (meydaFeaturesToExtract.includes('loudness')) setLoudness(features.loudness || {});
          if (meydaFeaturesToExtract.includes('mfcc')) setMfcc(features.mfcc || []);
          if (meydaFeaturesToExtract.includes('perceptualSharpness'))
            setPerceptualSharpness(features.perceptualSharpness || 0);
          if (meydaFeaturesToExtract.includes('perceptualSpread')) setPerceptualSpread(features.perceptualSpread || 0);
          if (meydaFeaturesToExtract.includes('powerSpectrum')) setPowerSpectrum(features.powerSpectrum || []);
          if (meydaFeaturesToExtract.includes('spectralFlatness')) setSpectralFlatness(features.spectralFlatness || 0);
          if (meydaFeaturesToExtract.includes('spectralFlux')) setSpectralFlux(features.spectralFlux || 0);
          if (meydaFeaturesToExtract.includes('spectralKurtosis')) setSpectralKurtosis(features.spectralKurtosis || 0);
          if (meydaFeaturesToExtract.includes('spectralRolloff')) setSpectralRolloff(features.spectralRolloff || 0);
          if (meydaFeaturesToExtract.includes('spectralSkewness')) setSpectralSkewness(features.spectralSkewness || 0);
          if (meydaFeaturesToExtract.includes('spectralSlope')) setSpectralSlope(features.spectralSlope || 0);
          if (meydaFeaturesToExtract.includes('zcr')) setZcr(features.zcr || 0);
        },
      });
      meydaAnalyzerRef.current.start();
    }

    return () => {
      if (meydaAnalyzerRef.current) {
        meydaAnalyzerRef.current.stop();
        meydaAnalyzerRef.current = null;
      }
    };
  }, [analyser, audioContext, isPlaying, meydaBufferSize, meydaFeaturesToExtract]);

  return {
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
  };
}
