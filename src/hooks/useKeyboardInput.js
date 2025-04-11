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

import { useState, useRef, useEffect } from 'react';

export function useKeyboardInput(synthesizer, isPlaying, pianoEnabled) {
  const [octave, setOctave] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const activeKeysRef = useRef(new Set());

  useEffect(() => {
    if (!pianoEnabled || !synthesizer || !isPlaying) return;

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      event.preventDefault();

      if (event.key === 'ArrowLeft') {
        setOctave((prev) => Math.max(-1, prev - 1));
      } else if (event.key === 'ArrowRight') {
        setOctave((prev) => Math.min(9, prev + 1));
      } else if (event.key === 'ArrowUp') {
        setVolume((prev) => Math.min(2, prev + 0.1)); // Increase volume
      } else if (event.key === 'ArrowDown') {
        setVolume((prev) => Math.max(0.0, prev - 0.1)); // Decrease volume
      } else if (event.key === ' ') {
        synthesizer.stopAllNotes();
        return;
      } else {
        const noteNumber = mapKeyToNoteNumber(event.key, octave);
        if (noteNumber !== null) {
          synthesizer.noteOn(noteNumber);
          activeKeysRef.current.add(event.key);
        }
      }
    };

    const handleKeyUp = (event) => {
      const noteNumber = mapKeyToNoteNumber(event.key, octave);
      if (noteNumber !== null) {
        synthesizer.noteOff(noteNumber);
        activeKeysRef.current.delete(event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (synthesizer) {
        synthesizer.stopAllNotes();
      }
    };
  }, [pianoEnabled, isPlaying, synthesizer, octave, volume]);

  return {
    currentOctave: octave,
    currentVolume: volume,
  };
}

// Helper function for key-to-note mapping
function mapKeyToNoteNumber(key, octave) {
  const keyNoteMapping = {
    z: 0,
    s: 1,
    x: 2,
    d: 3,
    c: 4,
    v: 5,
    g: 6,
    b: 7,
    h: 8,
    n: 9,
    j: 10,
    m: 11,
  };

  if (key in keyNoteMapping) {
    // Calculate the MIDI note number based on the current octave
    return 60 + keyNoteMapping[key] + 12 * (octave - 4);
  }
  return null;
}
