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

import { useRef, useEffect } from 'react';

export function useKeyboardInput(synthesizer, isPlaying, pianoEnabled) {
  const octaveRef = useRef(4);
  const volumeRef = useRef(0.1);
  const activeKeysRef = useRef(new Set());

  const getExponentialVolume = (linearVolume) => {
    if (linearVolume <= 0) return 0;
    const e = Math.E;
    return (Math.pow(e, linearVolume) - 1) / (e - 1);
  };

  useEffect(() => {
    if (!pianoEnabled || !synthesizer || !isPlaying) return;

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      event.preventDefault();

      if (event.key === 'ArrowLeft') {
        octaveRef.current = Math.max(-1, octaveRef.current - 1);
      } else if (event.key === 'ArrowRight') {
        octaveRef.current = Math.min(9, octaveRef.current + 1);
      } else if (event.key === 'ArrowUp') {
        volumeRef.current = Math.min(1, volumeRef.current + 0.02); // Increase volume
      } else if (event.key === 'ArrowDown') {
        volumeRef.current = Math.max(0.0, volumeRef.current - 0.02); // Decrease volume
      } else if (event.key === ' ') {
        synthesizer.stopAllNotes();
        return;
      } else {
        const noteNumber = mapKeyToNoteNumber(event.key, octaveRef.current);
        if (noteNumber !== null) {
          synthesizer.noteOn(noteNumber);
          activeKeysRef.current.add(event.key);
        }
      }
    };

    const handleKeyUp = (event) => {
      const noteNumber = mapKeyToNoteNumber(event.key, octaveRef.current);
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
  }, [pianoEnabled, isPlaying, synthesizer]);

  return {
    currentOctave: octaveRef.current,
    currentVolume: getExponentialVolume(volumeRef.current),
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
