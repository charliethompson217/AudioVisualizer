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

import { useEffect, useRef, useState } from 'react';
import { createSpectrumVisualizer } from '@audiovisualizer/spectrum';

/* The existing JavaScript app does not use runtime PropTypes. */
/* eslint-disable react/prop-types */

const controlStyle = { margin: '10px' };

export default function Spectrum({
  showLabels,
  showScroll,
  brightnessPower = 1,
  audio,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  const hostRef = useRef(null);
  const visualizerRef = useRef(null);
  const [brightness, setBrightness] = useState(brightnessPower);
  const [lengthPower, setLengthPower] = useState(1);
  const [minSemitone, setMinSemitone] = useState(12);
  const [maxSemitone, setMaxSemitone] = useState(108);
  const [showNoteLabels, setShowNoteLabels] = useState(showLabels);
  const [showFrequencyLabels, setShowFrequencyLabels] = useState(showLabels);

  useEffect(() => {
    if (!hostRef.current) return;
    const visualizer = createSpectrumVisualizer(hostRef.current);
    visualizerRef.current = visualizer;

    return () => {
      visualizerRef.current = null;
      visualizer.destroy();
    };
  }, []);

  useEffect(() => {
    visualizerRef.current?.update({
      analyser: audio?.analyser ?? null,
      brightnessPower: brightness,
      lengthPower,
      minSemitone,
      maxSemitone,
      noteHues,
      showNoteLabels,
      showFrequencyLabels,
      showScroll,
    });
  }, [
    audio?.analyser,
    brightness,
    lengthPower,
    minSemitone,
    maxSemitone,
    noteHues,
    showNoteLabels,
    showFrequencyLabels,
    showScroll,
  ]);

  useEffect(() => {
    setShowNoteLabels(showLabels);
    setShowFrequencyLabels(showLabels);
  }, [showLabels]);

  return (
    <div>
      <h2>Spectrum</h2>
      <div className="has-border" style={{ width: '90%' }}>
        <div style={controlStyle}>
          <label htmlFor="minFreqSlider" className="control-label">
            Min frequency semitone: {minSemitone}
          </label>
          <input
            id="minFreqSlider"
            type="range"
            min="-36"
            max={maxSemitone - 0.5}
            step="0.5"
            value={minSemitone}
            onChange={(event) => setMinSemitone(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={controlStyle}>
          <label htmlFor="maxFreqSlider" className="control-label">
            Max frequency semitone: {maxSemitone}
          </label>
          <input
            id="maxFreqSlider"
            type="range"
            min={minSemitone + 0.5}
            max="140"
            step="0.5"
            value={maxSemitone}
            onChange={(event) => setMaxSemitone(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={controlStyle}>
          <label htmlFor="brightnessSlider" className="control-label">
            Brightness exponent: {brightness.toFixed(2)}
          </label>
          <input
            id="brightnessSlider"
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={controlStyle}>
          <label htmlFor="lengthPowerSlider" className="control-label">
            Length exponent: {lengthPower.toFixed(2)}
          </label>
          <input
            id="lengthPowerSlider"
            type="range"
            min="0.1"
            max="10"
            step="0.01"
            value={lengthPower}
            onChange={(event) => setLengthPower(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <label style={controlStyle}>
          <input
            type="checkbox"
            checked={showNoteLabels}
            onChange={(event) => setShowNoteLabels(event.target.checked)}
          />{' '}
          Note labels
        </label>
        <label style={controlStyle}>
          <input
            type="checkbox"
            checked={showFrequencyLabels}
            onChange={(event) => setShowFrequencyLabels(event.target.checked)}
          />{' '}
          Min/max frequency labels
        </label>
      </div>

      <div ref={hostRef} className="spectrum" style={{ width: '100%', height: 'min(62.5vw, 100vh)', minHeight: 240 }} />
    </div>
  );
}
