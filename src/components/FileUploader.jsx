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

import React, { useRef } from 'react';

export default function FileUploader({
  onFileUpload,
  setCurrentSongName,
  setMidiFile,
  setMp3File,
  setPianoEnabled,
  setSelectedSongFileName,
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentSongName(file.name.split('.')[0]);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
        setMidiFile(file);
        setMp3File(null);
        setPianoEnabled(true);
        setSelectedSongFileName('');
      } else if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.ogg')) {
        setMp3File(file);
        setMidiFile(null);
      }

      if (onFileUpload) {
        onFileUpload(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      style={{
        maxWidth: '30vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <button
        style={{
          backgroundColor: '#1e1e1e',
          color: 'rgb(170, 170, 170)',
          padding: '10px',
          border: '1px solid #444',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'background-color 0.3s ease',
        }}
        onClick={triggerFileInput}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#444')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#1e1e1e')}
      >
        Upload Audio or MIDI
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/ogg,audio/midi"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
