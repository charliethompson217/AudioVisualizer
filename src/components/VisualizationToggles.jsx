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

import React from 'react';

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
  generateBrowserMIDI,
  setGenerateBrowserMIDI,
  onsetThreshold,
  setOnsetThreshold,
  frameThreshold,
  setFrameThreshold,
  minDurationSec,
  setMinDurationSec,
  chromaCircle,
  setChromaCircle,
  chromaLine,
  setChromaLine,
  rms,
  setRms,
  spectralSpreadGraph,
  setSpectralSpreadGraph,
  isPlaying,
}) {
  return (
    <div className="visualization-toggles">
      <label className="control-label">
        BPM and Key
        <input
          className="control-checkbox"
          type="checkbox"
          checked={bpmAndKey}
          onChange={() => setBpmAndKey(!bpmAndKey)}
        />
      </label>
      <label className="control-label">
        Waveform
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showWaveform}
          onChange={() => setShowWaveform(!showWaveform)}
        />
      </label>
      <label className="control-label">
        Bar graph Spectrograph
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showSpectrograph}
          onChange={() => setShowSpectrograph(!showSpectrograph)}
        />
      </label>
      <label className="control-label">
        Waterfall Spectrograph
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showWaterfallSpectrograph}
          onChange={() =>
            setShowWaterfallSpectrograph(!showWaterfallSpectrograph)
          }
        />
      </label>
      {!isPlaying && (
        <label className="control-label">
          Synthesizer
          <input
            className="control-checkbox"
            type="checkbox"
            checked={pianoEnabled}
            onChange={() => setPianoEnabled(!pianoEnabled)}
          />
        </label>
      )}
      <label className="control-label">
        Generate MIDI
        <input
          type="checkbox"
          checked={generateBrowserMIDI}
          onChange={(e) => {
            const checked = e.target.checked;
            setGenerateBrowserMIDI(checked);
          }}
        />
      </label>
      {generateBrowserMIDI && (
        <>
          <label>
            {' '}
            Onset Threshold
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={onsetThreshold}
              onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Frame Threshold
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={frameThreshold}
              onChange={(e) => setFrameThreshold(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Min Duration (sec)
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={minDurationSec}
              onChange={(e) => setMinDurationSec(parseFloat(e.target.value))}
            />
          </label>
        </>
      )}
      <label className="control-label">
        Chroma Circle Graph
        <input
          className="control-checkbox"
          type="checkbox"
          checked={chromaCircle}
          onChange={() => setChromaCircle(!chromaCircle)}
        />
      </label>
      <label className="control-label">
        Chroma Line Graph
        <input
          className="control-checkbox"
          type="checkbox"
          checked={chromaLine}
          onChange={() => setChromaLine(!chromaLine)}
        />
      </label>
      <label className="control-label">
        RMS
        <input
          className="control-checkbox"
          type="checkbox"
          checked={rms}
          onChange={() => setRms(!rms)}
        />
      </label>
      <label className="control-label">
        Spectral Centroid + Spread Graph
        <input
          className="control-checkbox"
          type="checkbox"
          checked={spectralSpreadGraph}
          onChange={() => setSpectralSpreadGraph(!spectralSpreadGraph)}
        />
      </label>
    </div>
  );
}
