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
  useMic,
  setUseMic,
  setMp3File,
  setMidiFile,
  handleStartStopWithMic,
}) {
  const formatTime = (time) =>
    `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

  return (
    <section className="playback-panel" aria-label="Playback controls">
      <div className="transport-actions">
        <button
          className="control-button play-button"
          onClick={handleStartStop}
          disabled={(!conversionComplete && !useMic) || fetchingSong}
        >
          <span aria-hidden="true">{isPlaying ? '□' : '▷'}</span>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        {isPlaying && (
          <button className="control-button" onClick={handlePauseResume}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
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
            Use mic
          </button>
        )}
      </div>
      {isPlaying && duration > 0 ? (
        <div className="seek-slider-container">
          <span className="timecode">{formatTime(currentTime)}</span>
          <div className="seek-slider">
            <input
              aria-label="Playback position"
              type="range"
              min="0"
              max={duration}
              step="0.001"
              value={currentTime}
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                seek(time);
              }}
            />
          </div>
          <span className="timecode">{formatTime(duration)}</span>
        </div>
      ) : (
        <p className="transport-hint">
          {fetchingSong
            ? 'Loading your sound…'
            : isPlaying
              ? useMic
                ? 'Listening to your microphone'
                : 'Live session'
              : 'Press play to begin your session.'}
        </p>
      )}
      {progress < 100 && isConverting && (
        <div className="conversion-progress" role="status">
          <p>Converting audio to MIDI… {progress.toFixed(2)}%</p>
          <progress aria-label="Audio to MIDI conversion" value={progress} max="100" />
        </div>
      )}
    </section>
  );
}
