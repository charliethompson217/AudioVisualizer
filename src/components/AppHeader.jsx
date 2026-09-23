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

import { NavLink } from 'react-router-dom';

export default function AppHeader() {
  return (
    <header className="app-header">
      <NavLink to="/" className="app-brand" aria-label="Audio Visualizer home">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>Audio Visualizer</span>
      </NavLink>
      <nav aria-label="Main navigation">
        <NavLink to="/" end>
          Workspace
        </NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
    </header>
  );
}
