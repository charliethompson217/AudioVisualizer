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

import React, { useState } from 'react';

export default function SynthesizerSettings({
  synthesizerSettings,
  setSynthesizerSettings,
  selectedPreset,
  setSelectedPreset,
  presets,
}) {
  const [showSettings, setShowSettings] = useState(true);

  const {
    synthesisMode = 'additive',
    instrument = 'piano',
    oscillatorType,
    harmonicAmplitudes,
    attackTime,
    attackCurve,
    decayTime,
    decayCurve,
    sustainLevel,
    releaseTime,
    releaseCurve,
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

  const sampleInstruments = [
    'bass-electric',
    'contrabass',
    'guitar-electric',
    'organ',
    'trumpet',
    'bassoon',
    'flute',
    'guitar-nylon',
    'piano',
    'tuba',
    'cello',
    'french-horn',
    'harmonium',
    'saxophone',
    'violin',
    'clarinet',
    'guitar-acoustic',
    'harp',
    'trombone',
    'xylophone',
  ];

  if (!showSettings) {
    return (
      <label>
        <input type="checkbox" checked={showSettings} onChange={() => setShowSettings(!showSettings)} />
        Show Synthesizer Settings
      </label>
    );
  }

  return (
    <div className="synthesizer-settings">
      <h2>
        Synthesizer Settings
        <input type="checkbox" checked={showSettings} onChange={() => setShowSettings(!showSettings)} />
      </h2>

      {/* Synthesis Mode Selection */}
      <div className="synthesis-mode">
        <label>
          <input
            type="radio"
            name="synthesisMode"
            value="additive"
            checked={synthesisMode === 'additive'}
            onChange={() => updateSetting('synthesisMode', 'additive')}
          />
          Additive Synthesis
        </label>
        <label>
          <input
            type="radio"
            name="synthesisMode"
            value="sample"
            checked={synthesisMode === 'sample'}
            onChange={() => {
              setSynthesizerSettings((prevSettings) => ({
                ...prevSettings,
                synthesisMode: 'sample',
                instrument: prevSettings.instrument || 'piano',
                attackTime: 0.001
              }));
            }}
          />
          Sample-based Synthesis
        </label>
      </div>

      {/* Sample-based Synthesis Settings */}
      {synthesisMode === 'sample' ? (
        <>
          <div className="sample-instrument-selection">
            <h3>Choose Instrument</h3>
            <div className="instrument-options">
              {sampleInstruments.map((instrumentOption) => (
                <label key={instrumentOption}>
                  <input
                    type="radio"
                    name="instrument"
                    value={instrumentOption}
                    checked={instrument === instrumentOption}
                    onChange={(e) => {
                      updateSetting('instrument', e.target.value);
                      updateSetting('attackTime', 0.001);
                    }}
                  />
                  {instrumentOption.charAt(0).toUpperCase() + instrumentOption.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <h3>ADSR Envelopes</h3>
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
            <div className="curve-selection">
              <label>
                <input
                  type="radio"
                  name="attackCurve"
                  value="linear"
                  checked={attackCurve === 'linear'}
                  onChange={() => updateSetting('attackCurve', 'linear')}
                />
                Linear
              </label>
              <label>
                <input
                  type="radio"
                  name="attackCurve"
                  value="exponential"
                  checked={attackCurve === 'exponential'}
                  onChange={() => updateSetting('attackCurve', 'exponential')}
                />
                Exponential
              </label>
            </div>
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
            <div className="curve-selection">
              <label>
                <input
                  type="radio"
                  name="releaseCurve"
                  value="linear"
                  checked={releaseCurve === 'linear'}
                  onChange={() => updateSetting('releaseCurve', 'linear')}
                />
                Linear
              </label>
              <label>
                <input
                  type="radio"
                  name="releaseCurve"
                  value="exponential"
                  checked={releaseCurve === 'exponential'}
                  onChange={() => updateSetting('releaseCurve', 'exponential')}
                />
                Exponential
              </label>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Presets for Additive Synthesis */}
          <div className="preset-options">
            <h3>Choose Preset</h3>
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

          <h3>ADSR Envelopes</h3>
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
            <div className="curve-selection">
              <label>
                <input
                  type="radio"
                  name="attackCurve"
                  value="linear"
                  checked={attackCurve === 'linear'}
                  onChange={() => updateSetting('attackCurve', 'linear')}
                />
                Linear
              </label>
              <label>
                <input
                  type="radio"
                  name="attackCurve"
                  value="exponential"
                  checked={attackCurve === 'exponential'}
                  onChange={() => updateSetting('attackCurve', 'exponential')}
                />
                Exponential
              </label>
            </div>
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
            <div className="curve-selection">
              <label>
                <input
                  type="radio"
                  name="decayCurve"
                  value="linear"
                  checked={decayCurve === 'linear'}
                  onChange={() => updateSetting('decayCurve', 'linear')}
                />
                Linear
              </label>
              <label>
                <input
                  type="radio"
                  name="decayCurve"
                  value="exponential"
                  checked={decayCurve === 'exponential'}
                  onChange={() => updateSetting('decayCurve', 'exponential')}
                />
                Exponential
              </label>
            </div>
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
            <div className="curve-selection">
              <label>
                <input
                  type="radio"
                  name="releaseCurve"
                  value="linear"
                  checked={releaseCurve === 'linear'}
                  onChange={() => updateSetting('releaseCurve', 'linear')}
                />
                Linear
              </label>
              <label>
                <input
                  type="radio"
                  name="releaseCurve"
                  value="exponential"
                  checked={releaseCurve === 'exponential'}
                  onChange={() => updateSetting('releaseCurve', 'exponential')}
                />
                Exponential
              </label>
            </div>
          </div>
          <h3>Modulation</h3>
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
        </>
      )}
      <br />
    </div>
  );
}
