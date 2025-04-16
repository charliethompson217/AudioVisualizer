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

const S3_BASE_URL = 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com';

export default function SongSelector({
  onSongSelect,
  selectedSongFileName,
  setWarning,
  setCurrentSongName,
  setFetchingSong,
}) {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/songs.json')
      .then((response) => response.json())
      .then((data) => setSongs(data))
      .catch((error) => {
        console.error('Error loading songs:', error);
        setWarning(`Error loading songs: ${error.message}`);
      });
  }, []);

  const handleSongSelect = async (e) => {
    const selectedFileName = e.target.value;
    if (!selectedFileName) return;

    const selectedSong = songs.find((song) => song.fileName === selectedFileName);
    if (!selectedSong) return;

    const songName = `${selectedSong.artist} - ${selectedSong.title}`;
    setCurrentSongName(songName);
    setIsLoading(true);
    setFetchingSong(true);

    try {
      const songUrl = `${S3_BASE_URL}/${selectedFileName.replace(' ', '+')}`;
      const response = await fetch(songUrl);
      const blob = await response.blob();
      const file = new File([blob], selectedFileName, {
        type: 'audio/mp3',
      });

      onSongSelect(selectedFileName, file, songName);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading song:', error);
      setWarning('Failed to load song. Please try again.');
      setFetchingSong(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="song-selector-container" style={{ maxWidth: '100%' }}>
      <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        Select Song:
        <select
          value={selectedSongFileName}
          onChange={handleSongSelect}
          style={{
            marginTop: '5px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
          className="song-select"
        >
          <option value="">Choose from library</option>
          {songs.map((song) => (
            <option key={song.fileName} value={song.fileName}>
              {song.title} by {song.artist}
            </option>
          ))}
        </select>
      </label>
      {isLoading && <p>Loading song...</p>}
      <p style={{ maxWidth: '100%', wordWrap: 'break-word' }}>
        All music is from <a href="https://freemusicarchive.org">Free Music Archive</a> under the Creative Commons
        liscence Attribution-NonCommercial-ShareAlike (CC BY-NC-SA).
      </p>
    </div>
  );
}
