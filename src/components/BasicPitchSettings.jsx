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

import React, { useState, useEffect } from 'react';

export default function BasicPitchSettings({
  generateBrowserMIDI,
  onsetThreshold,
  setOnsetThreshold,
  frameThreshold,
  setFrameThreshold,
  minDurationSec,
  setMinDurationSec,
}) {
  const [localOnset, setLocalOnset] = useState(onsetThreshold);
  const [localFrame, setLocalFrame] = useState(frameThreshold);
  const [localMinDuration, setLocalMinDuration] = useState(minDurationSec);

  // Sync local state with props
  useEffect(() => {
    setLocalOnset(onsetThreshold);
    setLocalFrame(frameThreshold);
    setLocalMinDuration(minDurationSec);
  }, [onsetThreshold, frameThreshold, minDurationSec]);

  return (
    <>
      {generateBrowserMIDI && (
        <div style={{ position: 'relative' }}>
          <label className="control-label">
            Onset Threshold: {localOnset.toFixed(2)}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={localOnset}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setLocalOnset(value);
                setOnsetThreshold(value);
              }}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
          <label className="control-label">
            Frame Threshold: {localFrame.toFixed(2)}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={localFrame}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setLocalFrame(value);
                setFrameThreshold(value);
              }}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
          <label className="control-label">
            Min Duration (sec): {localMinDuration.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localMinDuration}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setLocalMinDuration(value);
                setMinDurationSec(value);
              }}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
        </div>
      )}
    </>
  );
}
