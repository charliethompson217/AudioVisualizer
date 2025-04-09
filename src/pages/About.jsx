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
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>About Audio Visualizer</h1>
      <p></p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/" style={{ color: '#0077cc', textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
      <p>
        Source code available at:{' '}
        <a href="https://github.com/charliethompson217/audiovisualizer">
          github.com/charliethompson217/audiovisualizer
        </a>
      </p>
    </div>
  );
}
