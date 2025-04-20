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
import { Link } from 'react-router-dom';

export default function About() {
  const [songs, setSongs] = useState([]);
  const [midis, setMidis] = useState([]);

  useEffect(() => {
    fetch('/songs.json')
      .then((response) => response.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error('Error loading songs:', error));
    fetch('/midis.json')
      .then((response) => response.json())
      .then((data) => setMidis(data))
      .catch((error) => console.error('Error loading MIDI files:', error));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>About Audio Visualizer</h1>
      <p>
        This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero
        General Public License as published by the Free Software Foundation, either version 3 of the License, or (at
        your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY
        WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
        Affero General Public License for more details. <a href="https://www.gnu.org/licenses">www.gnu.org/licenses</a>.
      </p>

      <p>
        Source code available at:{' '}
        <a href="https://github.com/charliethompson217/audiovisualizer">
          github.com/charliethompson217/audiovisualizer
        </a>
      </p>

      <h1>Credits</h1>

      <h2>Libraries</h2>
      <ul style={{ lineHeight: '25px' }}>
        <li>
          <a href="https://github.com/meyda/meyda">Meyda</a> - (
          <a href="https://opensource.org/licenses/MIT">MIT License</a>) - For real-time audio analysis
        </li>
        <li>
          <a href="https://github.com/Tonejs/Tone.js">Tone.js</a> - (
          <a href="https://opensource.org/licenses/MIT">MIT License</a>) - For the synthesizer functionality
        </li>
        <li>
          <a href="https://github.com/spotify/basic-pitch">Basic Pitch</a> - (
          <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache License</a>) - For audio-to-MIDI conversion
        </li>
        <li>
          <a href="https://github.com/MTG/essentia.js">essentia.js</a> - (
          <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL3 License</a>) - For BPM and key detection
        </li>
        <li>
          <a href="https://github.com/Borewit/music-metadata">music-metadata</a> - (
          <a href="https://opensource.org/licenses/MIT">MIT License</a>) - For audio metadata parsing
        </li>
        <li>
          <a href="https://github.com/carter-thaxton/midi-file">midi-file</a> - (
          <a href="https://opensource.org/licenses/MIT">MIT License</a>) - For MIDI file parsing
        </li>
        <li>
          <a href="https://github.com/processing/p5.js">p5.js</a> - (
          <a href="https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html">LGPL-2.1 License</a>) - For rendering the
          visualizations
        </li>
        <li>
          <a href="https://github.com/facebook/react">React</a> - (
          <a href="https://opensource.org/licenses/MIT">MIT License</a>) - For building the user interface
        </li>
      </ul>

      <h2>Synthesizer Samples</h2>
      <p style={{ marginLeft: '20px' }}>
        All samples used by the synthesizer are released under{' '}
        <a href="https://creativecommons.org/licenses/by/3.0/">Creative Commons Attribution (CC-BY 3.0)</a>
      </p>
      <p style={{ marginLeft: '20px' }}>
        The sample library is from <a href="https://github.com/nbrosowsky/tonejs-instruments">tonejs-instruments</a>.
        The sources listed below are the original sources from which those samples were aggregated and edited.
      </p>
      <ul>
        <li>
          <a href="https://www.karoryfer.com/karoryfer-samples">Karoryfer</a> - Bass, Electric Guitar, Saxophone
        </li>
        <li>
          <a href="http://vis.versilstudios.net/vsco-community.html">VSO2</a> - Bassoon, Contrabass, Flute, French Horn,
          Harp, Organ, Piano, Trombone, Trumpet, Tuba, Violin, Xylophone
        </li>
        <li>
          <a href="https://freesound.org">Freesound</a> - Cello, Nylon Guitar, Harmonium
        </li>
        <li>
          <a href="http://theremin.music.uiowa.edu/">University of Iowa</a> - Acoustic Guitar
        </li>
      </ul>

      <h2>Songs</h2>
      <p style={{ marginLeft: '20px' }}>
        All music in the song library is from <a href="https://freemusicarchive.org">Free Music Archive</a>
      </p>

      {songs.length > 0 && (
        <ul style={{ marginLeft: '20px', lineHeight: '25px' }}>
          {songs
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((song, index) => (
              <li key={index}>
                {song.title} By {song.artist} {song.license}
              </li>
            ))}
        </ul>
      )}

      <h2>MIDI Files</h2>
      <p style={{ marginLeft: '20px' }}>
        All MIDI files in the MIDI library are from <a href="https://www.mutopiaproject.org">Mutopia Project</a>
      </p>

      {midis.length > 0 && (
        <ul style={{ marginLeft: '20px', lineHeight: '25px' }}>
          {midis
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((midi, index) => (
              <li key={index}>
                {midi.title} By {midi.artist} {midi.license}
              </li>
            ))}
        </ul>
      )}

      <div style={{ marginTop: '20px' }}>
        <Link to="/" style={{ color: '#0077cc', textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
