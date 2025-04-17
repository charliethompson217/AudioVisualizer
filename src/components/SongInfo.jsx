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

export default function SongInfo({ currentSongName, isProcessing, bpm, scaleKey, essentiaFeatures }) {
  return (
    <div className="SongTitle">
      {currentSongName && <h1 style={{ color: 'white' }}>{currentSongName}</h1>}
      {isProcessing && <p>Analyzing audio...</p>}
      <div className="audio-info" style={{ visibility: scaleKey && bpm ? 'visible' : 'hidden' }}>
        <p>BPM: {Math.round(bpm)}</p>
        <p>Key: {scaleKey}</p>
      </div>
      <div className="audio-info" style={{ visibility: essentiaFeatures ? 'visible' : 'hidden' }}>
        <p>Current BPM estimate: {essentiaFeatures ? Math.round(essentiaFeatures.bpm) : 'N/A'}</p>
        <p>Current Key prediction: {essentiaFeatures ? essentiaFeatures.scaleKey : 'N/A'}</p>
      </div>
    </div>
  );
}
