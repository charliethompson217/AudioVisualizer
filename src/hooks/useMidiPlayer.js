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

export function useMidiPlayer(midiFile, synthesizer, isPlaying, setWarning) {
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
        setWarning(`Error fetching or processing MIDI file: ${error.message}`);
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
      const tempoChanges = []; // Store all tempo changes with their absolute tick time
      let currentMicrosecondsPerBeat = 500000; // Default tempo (120 BPM)

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;
        track.forEach((event) => {
          trackTime += event.deltaTime;
          if (event.meta && event.type === 'setTempo') {
            tempoChanges.push({
              tickTime: trackTime,
              microsecondsPerBeat: event.microsecondsPerBeat,
            });
          }
        });
      });

      tempoChanges.sort((a, b) => a.tickTime - b.tickTime);

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;
        let currentTempoIndex = 0;
        let absoluteTimeSec = 0;
        const activeMap = {};

        track.forEach((event) => {
          trackTime += event.deltaTime;

          while (currentTempoIndex < tempoChanges.length && trackTime >= tempoChanges[currentTempoIndex].tickTime) {
            const ticksSinceLastTempo =
              tempoChanges[currentTempoIndex].tickTime -
              (currentTempoIndex > 0 ? tempoChanges[currentTempoIndex - 1].tickTime : 0);
            const secondsPerTick = currentMicrosecondsPerBeat / 1_000_000 / ticksPerBeat;
            absoluteTimeSec += ticksSinceLastTempo * secondsPerTick;

            currentMicrosecondsPerBeat = tempoChanges[currentTempoIndex].microsecondsPerBeat;
            currentTempoIndex++;
          }

          const secondsPerTick = currentMicrosecondsPerBeat / 1_000_000 / ticksPerBeat;
          const eventTimeSec =
            absoluteTimeSec +
            (trackTime - (currentTempoIndex > 0 ? tempoChanges[currentTempoIndex - 1]?.tickTime : 0)) * secondsPerTick;

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
      const ticksPerBeat = parsedMidi.header.ticksPerBeat || 480;
      const tempoChanges = [];
      let currentMicrosecondsPerBeat = 500000;

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;
        track.forEach((event) => {
          trackTime += event.deltaTime;
          if (event.meta && event.type === 'setTempo') {
            tempoChanges.push({
              tickTime: trackTime,
              microsecondsPerBeat: event.microsecondsPerBeat,
            });
          }
        });
      });

      tempoChanges.sort((a, b) => a.tickTime - b.tickTime);

      parsedMidi.tracks.forEach((track) => {
        let trackTime = 0;
        let currentTempoIndex = 0;
        let absoluteTimeSec = 0;

        track.forEach((event) => {
          trackTime += event.deltaTime;

          while (currentTempoIndex < tempoChanges.length && trackTime >= tempoChanges[currentTempoIndex].tickTime) {
            const ticksSinceLastTempo =
              tempoChanges[currentTempoIndex].tickTime -
              (currentTempoIndex > 0 ? tempoChanges[currentTempoIndex - 1].tickTime : 0);
            const secondsPerTick = currentMicrosecondsPerBeat / 1_000_000 / ticksPerBeat;
            absoluteTimeSec += ticksSinceLastTempo * secondsPerTick;

            currentMicrosecondsPerBeat = tempoChanges[currentTempoIndex].microsecondsPerBeat;
            currentTempoIndex++;
          }

          const secondsPerTick = currentMicrosecondsPerBeat / 1_000_000 / ticksPerBeat;
          const eventTimeSec =
            absoluteTimeSec +
            (trackTime - (currentTempoIndex > 0 ? tempoChanges[currentTempoIndex - 1]?.tickTime : 0)) * secondsPerTick;

          if (event.type === 'noteOn' && event.velocity > 0) {
            const timeoutId = setTimeout(() => {
              synthesizer?.noteOn(event.noteNumber, event.velocity);
            }, eventTimeSec * 1000);
            timeoutsRef.current.push(timeoutId);
          } else if (event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0)) {
            const timeoutId = setTimeout(() => {
              synthesizer?.noteOff(event.noteNumber);
            }, eventTimeSec * 1000);
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
  }, [midiFile, synthesizer, isPlaying, setWarning]);

  return {
    midiNotes,
  };
}
