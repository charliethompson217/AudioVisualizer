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
import useMetadataExtractor from '../hooks/useMetadataExtractor';

export default function SongInfo({ currentSongName, isProcessing, bpm, scaleKey, essentiaFeatures, mp3File }) {
  const { metadata, isLoading, error } = useMetadataExtractor(mp3File);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="SongTitle" style={{ color: 'white', padding: '20px', minWidth: '300px' }}>
        {isLoading && <p>Extracting metadata...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {metadata.title && <h1>{metadata.title}</h1>}
        {!metadata.title && currentSongName && <h1>{currentSongName}</h1>}

        {(metadata.artist || metadata.album) && (
          <div className="metadata-info">
            {metadata.artist && <p>Artist: {metadata.artist}</p>}
            {metadata.album && <p>Album: {metadata.album}</p>}
          </div>
        )}

        {metadata.genre && <div className="metadata-info">{metadata.genre && <p>Genre: {metadata.genre}</p>}</div>}

        {metadata.mood && <div className="metadata-info">{metadata.mood && <p>Genre: {metadata.mood}</p>}</div>}

        {metadata.coverArt && (
          <div className="cover-art" style={{ marginTop: '10px' }}>
            <img src={metadata.coverArt} alt="Album Cover" style={{ maxWidth: '200px', borderRadius: '8px' }} />
          </div>
        )}

        {isProcessing && <p>Analyzing audio...</p>}

        {bpm && scaleKey && (
          <div className="audio-info" style={{ marginTop: '10px' }}>
            <p>BPM: {Math.round(bpm)}</p>
            <p>Key: {scaleKey}</p>
          </div>
        )}

        {!bpm && !scaleKey && essentiaFeatures && (
          <div className="audio-info" style={{ marginTop: '10px' }}>
            <p>Current BPM estimate: {essentiaFeatures ? Math.round(essentiaFeatures.bpm) : 'N/A'}</p>
            <p>Current Key prediction: {essentiaFeatures ? essentiaFeatures.scaleKey : 'N/A'}</p>
          </div>
        )}
      </div>
      {metadata.lyrics && (
        <div className="lyrics">
          <pre>{metadata.lyrics.at(-1).text}</pre>
        </div>
      )}
    </div>
  );
}
