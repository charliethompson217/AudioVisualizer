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

export default function SynthesizerSettings({
  synthesizerSettings,
  setSynthesizerSettings,
  selectedPreset,
  setSelectedPreset,
  presets,
}) {
  const {
    oscillatorType,
    harmonicAmplitudes,
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
    vibratoDepth,
    vibratoRate,
    tremoloDepth,
    tremoloRate,
  } = synthesizerSettings;

  // Function to handle harmonic amplitude changes
  const handleHarmonicChange = (harmonic, value) => {
    setSynthesizerSettings((prevSettings) => ({
      ...prevSettings,
      harmonicAmplitudes: {
        ...prevSettings.harmonicAmplitudes,
        [harmonic]: value,
      },
    }));
  };

  // Function to update a single setting
  const updateSetting = (settingName, value) => {
    setSynthesizerSettings((prevSettings) => ({
      ...prevSettings,
      [settingName]: value,
    }));
  };

  return (
    <div className="synthesizer-settings">
      <h2>Synthesizer Settings</h2>
      <div className="preset-options">
        {Object.keys(presets).map((preset) => (
          <label key={preset}>
            <input
              type="radio"
              name="preset"
              value={preset}
              checked={selectedPreset === preset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            />
            {preset}
          </label>
        ))}
      </div>

      <div>
        <div className="oscillator-type">
          <label>
            Oscillator Type:
            <select value={oscillatorType} onChange={(e) => updateSetting('oscillatorType', e.target.value)}>
              <option value="custom">Custom harmonics</option>
              <option value="sine">Sine</option>
              <option value="square">Square</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="triangle">Triangle</option>
            </select>
          </label>
        </div>

        {oscillatorType === 'custom' && (
          <div className="harmonic-controls">
            {/* harmonic sliders */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((harmonic) => (
              <div key={harmonic}>
                <label>
                  Harmonic {harmonic}: {harmonicAmplitudes[harmonic].toFixed(4)}
                  <input
                    type="range"
                    min="0.000"
                    max="1.00"
                    step="0.001"
                    value={harmonicAmplitudes[harmonic]}
                    onChange={(e) => handleHarmonicChange(harmonic, parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <br />
      {/* ADSR sliders */}
      <div>
        <label>
          Attack Time: {attackTime.toFixed(4)}s
          <input
            type="range"
            min="0.001"
            max="2"
            step="0.001"
            value={attackTime}
            onChange={(e) => updateSetting('attackTime', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <div>
        <label>
          Decay Time: {decayTime.toFixed(4)}s
          <input
            type="range"
            min="0.001"
            max="2"
            step="0.001"
            value={decayTime}
            onChange={(e) => updateSetting('decayTime', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <div>
        <label>
          Sustain Level: {sustainLevel.toFixed(4)}
          <input
            type="range"
            min="0.001"
            max="1"
            step="0.001"
            value={sustainLevel}
            onChange={(e) => updateSetting('sustainLevel', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <div>
        <label>
          Release Time: {releaseTime.toFixed(4)}s
          <input
            type="range"
            min="0.001"
            max="5"
            step="0.001"
            value={releaseTime}
            onChange={(e) => updateSetting('releaseTime', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <br />
      {/* Vibrato Sliders */}
      <div>
        <label>
          Vibrato Depth: {vibratoDepth.toFixed(4)}
          <input
            type="range"
            min="0.000"
            max="100.00"
            step="0.001"
            value={vibratoDepth}
            onChange={(e) => updateSetting('vibratoDepth', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <div>
        <label>
          Vibrato Rate: {vibratoRate.toFixed(4)} Hz
          <input
            type="range"
            min="0.000"
            max="20.00"
            step="0.001"
            value={vibratoRate}
            onChange={(e) => updateSetting('vibratoRate', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      {/* Tremolo Sliders */}
      <div>
        <label>
          Tremolo Depth: {tremoloDepth.toFixed(4)}
          <input
            type="range"
            min="0.000"
            max="1.00"
            step="0.001"
            value={tremoloDepth}
            onChange={(e) => updateSetting('tremoloDepth', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <div>
        <label>
          Tremolo Rate: {tremoloRate.toFixed(4)} Hz
          <input
            type="range"
            min="0.000"
            max="20.00"
            step="0.001"
            value={tremoloRate}
            onChange={(e) => updateSetting('tremoloRate', parseFloat(e.target.value))}
            className="harmonic-slider"
          />
        </label>
      </div>
      <br />
    </div>
  );
}
