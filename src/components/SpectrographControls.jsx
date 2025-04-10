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

export default function SpectrographControls({
  bins,
  setBins,
  minDecibels,
  setMinDecibels,
  maxDecibels,
  setMaxDecibels,
  smoothing,
  setSmoothing,
  showLabels,
  setShowLabels,
  showScroll,
  setShowScroll,
}) {
  return (
    <div className="controls-row has-border spectrograph-controls">
      <label className="control-label">
        FFT Size:
        <select
          className="control-select"
          value={bins}
          onChange={(e) => setBins(parseInt(e.target.value, 10))}
        >
          {[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].map(
            (power) => (
              <option key={power} value={power}>
                {power}
              </option>
            )
          )}
        </select>
      </label>

      <label className="control-label">
        Min Decibels:
        <span>{minDecibels} dB</span>
        <input
          className="control-slider"
          type="range"
          min="-120"
          max={0}
          step="1"
          value={minDecibels}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value < maxDecibels) {
              setMinDecibels(value);
            }
          }}
        />
      </label>

      <label className="control-label">
        Max Decibels:
        <span>{maxDecibels} dB</span>
        <input
          className="control-slider"
          type="range"
          min={-120}
          max="0"
          step="1"
          value={maxDecibels}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value > minDecibels) {
              setMaxDecibels(value);
            }
          }}
        />
      </label>

      <label className="control-label">
        Smoothing:
        <input
          className="control-slider"
          type="range"
          min="0.000"
          max="1.00"
          step="0.001"
          value={smoothing}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value > 0) {
              setSmoothing(parseFloat(value));
            }
          }}
        />
      </label>

      <label className="control-label">
        Labels
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showLabels}
          onChange={() => setShowLabels(!showLabels)}
        />
      </label>

      <label className="control-label">
        Bar
        <input
          className="control-checkbox"
          type="checkbox"
          checked={showScroll}
          onChange={() => setShowScroll(!showScroll)}
        />
      </label>
    </div>
  );
}
