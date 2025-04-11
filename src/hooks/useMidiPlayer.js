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

import { useRef, useState, useEffect } from 'react';
import { parseMidi } from 'midi-file';

export function useMidiPlayer(midiFile, synthesizer, isPlaying) {
  const [midiNotes, setMidiNotes] = useState([]);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    if (!midiFile || !synthesizer || !isPlaying) {
      return;
    }

    const fetchMidiFile = async () => {
      try {
        let fileBlob;
        if (typeof midiFile === 'string') {
          const response = await fetch(midiFile);
          if (!response.ok) throw new Error('Failed to fetch MIDI file');
          fileBlob = await response.blob();
        } else if (midiFile instanceof Blob || midiFile instanceof File) {
          fileBlob = midiFile;
        }
        readMidiFile(fileBlob);
      } catch (error) {
        console.error('Error fetching or processing MIDI file:', error);
      }
    };

    const readMidiFile = (fileBlob) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const parsedMidi = parseMidi(new Uint8Array(arrayBuffer));
        setMidiNotes(buildNotes(parsedMidi));
        playMidi(parsedMidi);
      };
      reader.readAsArrayBuffer(fileBlob);
    };

    function buildNotes(parsedMidi) {
      const notesResult = [];
      const ticksPerBeat = parsedMidi.header.ticksPerBeat || 480;
      let microsecondsPerBeat = 500000;
      parsedMidi.tracks.forEach((track) => {
        let currentTime = 0;
        const activeMap = {};
        track.forEach((event) => {
          currentTime += event.deltaTime;
          if (event.meta && event.type === 'setTempo') {
            microsecondsPerBeat = event.microsecondsPerBeat;
          }
          const secondsPerTick = microsecondsPerBeat / 1_000_000 / ticksPerBeat;
          const eventTimeSec = currentTime * secondsPerTick;
          if (event.type === 'noteOn' && event.velocity > 0) {
            activeMap[event.noteNumber] = {
              startTime: eventTimeSec,
              velocity: event.velocity,
            };
          } else if (event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0)) {
            const note = activeMap[event.noteNumber];
            if (note) {
              notesResult.push({
                noteNumber: event.noteNumber,
                startSec: note.startTime,
                durationSec: eventTimeSec - note.startTime,
                velocity: note.velocity,
              });
              delete activeMap[event.noteNumber];
            }
          }
        });
      });
      return notesResult;
    }

    function playMidi(parsedMidi) {
      const ticksPerBeat = parsedMidi.header.ticksPerBeat;
      let microsecondsPerBeat = 500000;

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;

        track.forEach((event) => {
          if (event.meta && event.type === 'setTempo') {
            microsecondsPerBeat = event.microsecondsPerBeat;
          }

          trackTime += event.deltaTime;
          const delay = (trackTime / ticksPerBeat) * (microsecondsPerBeat / 1000000);

          if (event.type === 'noteOn' && event.velocity > 0) {
            const timeoutId = setTimeout(() => {
              synthesizer?.noteOn(event.noteNumber, event.velocity, true);
            }, delay * 1000);
            timeoutsRef.current.push(timeoutId);
          } else if (event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0)) {
            const timeoutId = setTimeout(() => {
              synthesizer?.noteOff(event.noteNumber);
            }, delay * 1000);
            timeoutsRef.current.push(timeoutId);
          }
        });
      });
    }

    fetchMidiFile();

    return () => {
      // Clear all scheduled timeouts when unmounting or changing midi file
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [midiFile, synthesizer, isPlaying]);

  return {
    midiNotes,
  };
}
