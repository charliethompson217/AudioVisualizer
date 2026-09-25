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

import React, { useEffect } from 'react';

export default function VisualizationToggles({
  bpmAndKey,
  setBpmAndKey,
  showWaveform,
  setShowWaveform,
  showBarSpectrograph,
  setShowBarSpectrograph,
  showCircleSpectrograph,
  setShowCircleSpectrograph,
  showSpiralSpectrograph,
  setShowSpiralSpectrograph,
  showWaterfallSpectrograph,
  setShowWaterfallSpectrograph,
  pianoEnabled,
  setPianoEnabled,
  chromaCircle,
  setChromaCircle,
  chromaLine,
  setChromaLine,
  chromaBar,
  setChromaBar,
  rms,
  setRms,
  loudness,
  setLoudness,
  spectralSpreadGraph,
  setSpectralSpreadGraph,
  isPlaying,
  useMic,
  muteMic,
  setMuteMic,
  meydaBufferSize,
  setMeydaBufferSize,
  meydaFeaturesToExtract,
  setMeydaFeaturesToExtract,
  generateBrowserMIDI,
  setGenerateBrowserMIDI,
  showPosteriorgram,
  setShowPosteriorgram,
}) {
  useEffect(() => {
    const newFeatures = [];

    if (chromaCircle || chromaLine || chromaBar) {
      newFeatures.push('chroma');
    }

    if (rms) {
      newFeatures.push('rms');
    }

    if (loudness) {
      newFeatures.push('loudness');
    }

    if (spectralSpreadGraph) {
      newFeatures.push('spectralCentroid', 'spectralSpread');
    }

    if (JSON.stringify(newFeatures) !== JSON.stringify(meydaFeaturesToExtract)) {
      setMeydaFeaturesToExtract(newFeatures);
    }
  }, [
    chromaCircle,
    chromaLine,
    chromaBar,
    rms,
    loudness,
    spectralSpreadGraph,
    meydaFeaturesToExtract,
    setMeydaFeaturesToExtract,
  ]);

  const groups = [
    {
      title: 'Spectrum',
      items: [
        ['Waveform', showWaveform, setShowWaveform],
        ['Spectrum', showBarSpectrograph, setShowBarSpectrograph],
        ['Circle spectrograph', showCircleSpectrograph, setShowCircleSpectrograph],
        ['Spiral spectrograph', showSpiralSpectrograph, setShowSpiralSpectrograph],
        ['Waterfall spectrograph', showWaterfallSpectrograph, setShowWaterfallSpectrograph],
      ],
    },
    {
      title: 'Pitch & synthesis',
      items: [
        ['Synthesizer', pianoEnabled, setPianoEnabled],
        ['Chroma circle', chromaCircle, setChromaCircle],
        ['Chroma line', chromaLine, setChromaLine],
        ['Chroma bars', chromaBar, setChromaBar],
      ],
    },
    {
      title: 'Measurements',
      items: [
        ['RMS', rms, setRms],
        ['Spectral centroid + spread', spectralSpreadGraph, setSpectralSpreadGraph],
        ['Perceptual loudness', loudness, setLoudness],
      ],
    },
  ];

  return (
    <div className="visualization-toggles">
      <div className="toggle-groups">
        {groups.map(({ title, items }) => (
          <fieldset className="toggle-group" key={title}>
            <legend>{title}</legend>
            {items.map(([label, checked, setChecked]) => (
              <label className="toggle-option" key={label}>
                <input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="analysis-options">
        {!isPlaying && (
          <>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={generateBrowserMIDI}
                onChange={() => setGenerateBrowserMIDI(!generateBrowserMIDI)}
              />
              <span>Generate MIDI</span>
            </label>
            {generateBrowserMIDI && (
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={showPosteriorgram}
                  onChange={() => setShowPosteriorgram(!showPosteriorgram)}
                />
                <span>Show posteriorgram</span>
              </label>
            )}
            <label className="toggle-option">
              <input type="checkbox" checked={bpmAndKey} onChange={() => setBpmAndKey(!bpmAndKey)} />
              <span>BPM & key</span>
            </label>
          </>
        )}
        <label className="buffer-control">
          <span>Meyda buffer size</span>
          <select value={meydaBufferSize} onChange={(e) => setMeydaBufferSize(parseInt(e.target.value, 10))}>
            {[512, 1024, 2048, 4096, 8192, 16384].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        {useMic && (
          <label className="toggle-option">
            <input type="checkbox" checked={muteMic} onChange={() => setMuteMic(!muteMic)} />
            <span>Mute microphone</span>
          </label>
        )}
      </div>
    </div>
  );
}
