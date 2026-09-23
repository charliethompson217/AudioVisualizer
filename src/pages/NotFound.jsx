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
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="information-page not-found">
        <p className="eyebrow">404 / Out of range</p>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <div style={{ marginTop: '30px' }}>
          <Link to="/" className="control-button back-link">
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
