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

const S3_BASE_URL = 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com/midis';

export default function MidiSelector({
  onMidiSelect,
  selectedMidiFileName,
  setWarning,
  setCurrentSongName,
  setFetchingMidi,
}) {
  const [midis, setMidis] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/midis.json')
      .then((response) => response.json())
      .then((data) => setMidis(data))
      .catch((error) => {
        console.error('Error loading MIDI files:', error);
        setWarning(`Error loading MIDI files: ${error.message}`);
      });
  }, []);

  const handleMidiSelect = async (e) => {
    const selectedFileName = e.target.value;
    if (!selectedFileName) return;

    const selectedMidi = midis.find((midi) => midi.filename === selectedFileName);
    if (!selectedMidi) return;

    const midiName = `${selectedMidi.artist} - ${selectedMidi.title}`;
    setCurrentSongName(midiName);
    setIsLoading(true);
    setFetchingMidi(true);

    try {
      const midiUrl = `${S3_BASE_URL}/${selectedMidi.filePath}`;
      const response = await fetch(midiUrl);
      const blob = await response.blob();
      const file = new File([blob], selectedFileName, {
        type: 'audio/midi',
      });

      onMidiSelect(selectedFileName, file, midiName);
      setIsLoading(false);
      setFetchingMidi(false);
    } catch (error) {
      console.error('Error loading MIDI:', error);
      setWarning('Failed to load MIDI file. Please try again.');
      setFetchingMidi(false);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        Select MIDI:
        <select
          value={selectedMidiFileName}
          onChange={handleMidiSelect}
          style={{
            marginTop: '5px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
          className="song-select"
        >
          <option value="">Choose from library</option>
          {midis
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((midi) => (
              <option key={midi.filename} value={midi.filename}>
                {midi.title} {midi.filename.split('.')[0]} by {midi.artist} ({midi.instrument}) {midi.license}
              </option>
            ))}
        </select>
      </label>
      {isLoading && <p>Loading MIDI...</p>}
      <p style={{ maxWidth: '100%', wordWrap: 'break-word' }}>
        All MIDI files are from <a href="https://www.mutopiaproject.org">Mutopia Project</a>
      </p>
    </div>
  );
}
