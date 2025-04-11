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
    <div style={{ display: 'block', overflow: 'visible', height: 'auto' }}>
      <div
        className="controls-row"
        style={{
          overflow: 'visible',
          height: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
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
          <div style={{ width: '100%', overflow: 'visible' }}>
            <p>Converting audio to MIDI... {progress.toFixed(2)}%</p>
            <progress value={progress} max="100" />
          </div>
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
              <div
                className="seek-slider-container"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  overflow: 'visible',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '95%',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    overflow: 'visible',
                  }}
                >
                  <span>
                    {String(Math.floor(currentTime / 60)).padStart(2, '0')}:
                    {String(Math.floor(currentTime % 60)).padStart(2, '0')}
                  </span>
                  <div className="seek-slider" style={{ flex: 1, margin: '0 15px' }}>
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
                      style={{ width: '100%' }}
                    />
                  </div>
                  <span>
                    {String(Math.floor(duration / 60)).padStart(2, '0')}:
                    {String(Math.floor(duration % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
