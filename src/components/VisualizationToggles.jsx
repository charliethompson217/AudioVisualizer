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
  showSpectrograph,
  setShowSpectrograph,
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
  meydaBufferSize,
  setMeydaBufferSize,
  meydaFeaturesToExtract,
  setMeydaFeaturesToExtract,
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

  return (
    <div className="visualization-toggles">
      {!isPlaying && (
        <div className="control-label">
          <input
            className="control-checkbox"
            type="checkbox"
            checked={bpmAndKey}
            onChange={() => setBpmAndKey(!bpmAndKey)}
          />
          <label style={{ pointerEvents: 'none', cursor: 'default' }}>BPM and Key</label>
        </div>
      )}
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showWaveform}
          onChange={() => setShowWaveform(!showWaveform)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Waveform</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showSpectrograph}
          onChange={() => setShowSpectrograph(!showSpectrograph)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Bar graph Spectrograph</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showWaterfallSpectrograph}
          onChange={() => setShowWaterfallSpectrograph(!showWaterfallSpectrograph)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Waterfall Spectrograph</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={pianoEnabled}
          onChange={() => setPianoEnabled(!pianoEnabled)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Synthesizer</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={chromaCircle}
          onChange={() => setChromaCircle(!chromaCircle)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Chroma Circle Graph</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={chromaLine}
          onChange={() => setChromaLine(!chromaLine)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Chroma Line Graph</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={chromaBar}
          onChange={() => setChromaBar(!chromaBar)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Chroma Bar Graph</label>
      </div>
      <div className="control-label">
        <input className="control-checkbox" type="checkbox" checked={rms} onChange={() => setRms(!rms)} />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>RMS</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={spectralSpreadGraph}
          onChange={() => setSpectralSpreadGraph(!spectralSpreadGraph)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Spectral Centroid + Spread Graph</label>
      </div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={loudness}
          onChange={() => setLoudness(!loudness)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Perceptual Loudness</label>
      </div>
      <div className="control-label">
        <select
          value={meydaBufferSize}
          onChange={() => setMeydaBufferSize(parseInt(e.target.value, 10))}
          style={{ paddingLeft: '5px', paddingRight: '5px' }}
        >
          {[512, 1024, 2048, 4096, 8192, 16384].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Meyda Buffer Size</label>
      </div>
    </div>
  );
}
