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
import Cookies from 'js-cookie';

const COOKIE_NAME = 'note-hues-settings';
const COOKIE_EXPIRY = 365; // Days

export default function ColorSettingsModal({
  noteHues,
  setNoteHues,
  setShowColorSettings,
  defaultNoteHues,
}) {
  const [localHues, setLocalHues] = useState([...noteHues]);
  const noteNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];

  useEffect(() => {
    const savedHues = Cookies.get(COOKIE_NAME);
    if (savedHues) {
      try {
        const parsedHues = JSON.parse(savedHues);
        if (Array.isArray(parsedHues) && parsedHues.length === 12) {
          setLocalHues(parsedHues);
          setNoteHues(parsedHues);
        }
      } catch (error) {
        console.error('Error parsing saved color settings:', error);
      }
    }
  }, []);

  const handleHueChange = (index, value) => {
    const newHues = [...localHues];
    newHues[index] = value;
    setLocalHues(newHues);
  };

  const handleClose = () => {
    setNoteHues([...localHues]);
    // Save settings to cookie
    Cookies.set(COOKIE_NAME, JSON.stringify(localHues), {
      expires: COOKIE_EXPIRY,
    });
    setShowColorSettings(false);
  };

  const handleReset = () => {
    setLocalHues([...defaultNoteHues]);
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [localHues]);

  return (
    <div className="color-settings-modal">
      <div className="color-settings-content">
        <h2>Note Color Settings</h2>
        <div
          className="color-sliders"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {noteNames.map((note, index) => (
            <div
              key={index}
              className="color-slider-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span style={{ width: '30px', minWidth: '30px' }}>{note}:</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={localHues[index]}
                  onChange={(e) =>
                    handleHueChange(index, parseInt(e.target.value))
                  }
                  style={{ flex: '1', margin: '0 15px' }}
                />
                <span
                  className="color-preview"
                  style={{
                    backgroundColor: `hsl(${localHues[index]}, 100%, 50%)`,
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    marginLeft: '10px',
                    border: '1px solid white',
                  }}
                ></span>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={localHues[index]}
                  onChange={(e) =>
                    handleHueChange(
                      index,
                      Math.min(360, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  style={{
                    width: '50px',
                    marginLeft: '10px',
                  }}
                />
                <span
                  style={{
                    fontSize: '18px',
                    marginLeft: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  °
                </span>
              </label>
            </div>
          ))}
        </div>
        <div className="modal-buttons">
          <button className="reset-button" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="close-button" onClick={handleClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
