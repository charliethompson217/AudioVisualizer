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

export default function PlaybackControls({
  isPlaying,
  isPaused,
  handleStartStop,
  handlePauseResume,
  currentTime,
  duration,
  seek,
  meydaBufferSize,
  setMeydaBufferSize,
  conversionComplete,
  fetchingSong,
  progress,
  isConverting,
  warning,
  useMic,
  setUseMic,
  setMp3File,
  setMidiFile,
  handleStartStopWithMic,
}) {
  return (
    <div className="controls-row">
      {isPlaying && (
        <label className="control-label">
          Meyda Buffer Size
          <select
            value={meydaBufferSize}
            onChange={(e) => setMeydaBufferSize(parseInt(e.target.value, 10))}
            style={{ paddingLeft: '5px', paddingRight: '5px' }}
          >
            {[512, 1024, 2048, 4096, 8192, 16384].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}

      {!isPlaying && (
        <button
          className="control-button"
          onClick={() => {
            setUseMic(true);
            setMp3File(null);
            setMidiFile(null);
            handleStartStopWithMic();
          }}
        >
          Use Mic
        </button>
      )}

      {progress < 100 && isConverting && (
        <>
          <p>Converting audio to MIDI... {progress.toFixed(2)}%</p>
          <progress value={progress} max="100" />
        </>
      )}

      {warning && <div>{warning}</div>}

      <button
        className="control-button"
        onClick={handleStartStop}
        disabled={(!conversionComplete && !useMic) || fetchingSong}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      {isPlaying && (
        <>
          <button className="control-button" onClick={handlePauseResume}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {duration > 0 && (
            <div className="seek-slider">
              <label>
                {String(Math.floor(currentTime / 60)).padStart(2, '0')}:
                {String(Math.floor(currentTime % 60)).padStart(2, '0')}
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.001"
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    seek(time);
                  }}
                  style={{ paddingLeft: '10px', paddingRight: '10px' }}
                />
                {String(Math.floor(duration / 60)).padStart(2, '0')}:
                {String(Math.floor(duration % 60)).padStart(2, '0')}
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
