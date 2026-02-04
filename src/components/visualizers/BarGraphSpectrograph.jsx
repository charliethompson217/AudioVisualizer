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

import React, { useRef, useEffect, useState } from 'react';

export default function BarGraphSpectrograph({
  showLabels,
  showScroll,
  brightnessPower = 1,
  audio,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  const sketchRef = useRef();
  const { analyser } = audio;
  const p5InstanceRef = useRef(null);

  // State hooks for slider values
  const [brightness, setBrightness] = useState(brightnessPower);
  const [lengthPower, setLengthPower] = useState(1);
  const [minSemitone, setMinSemitone] = useState(12);
  const [maxSemitone, setMaxSemitone] = useState(108);
  // Refs to hold current slider values for p5 sketch
  const brightnessRef = useRef(brightness);
  const lengthPowerRef = useRef(lengthPower);
  const minSemitoneRef = useRef(minSemitone);
  const maxSemitoneRef = useRef(maxSemitone);

  const showLabelsRef = useRef(showLabels);
  const showScrollRef = useRef(showScroll);

  // Update refs when slider values change
  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);
  useEffect(() => {
    lengthPowerRef.current = lengthPower;
  }, [lengthPower]);
  useEffect(() => {
    minSemitoneRef.current = minSemitone;
  }, [minSemitone]);
  useEffect(() => {
    maxSemitoneRef.current = maxSemitone;
  }, [maxSemitone]);
  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);
  useEffect(() => {
    showScrollRef.current = showScroll;
  }, [showScroll]);

  useEffect(() => {
    if (!analyser) return;

    const sketch = (p) => {
      let canvas;
      const f0 = 8.1758; // Frequency of C-1 in Hz
      const baseNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

      const mod = (n, m) => ((n % m) + m) % m;

      let cachedMinSemitone = NaN;
      let cachedMaxSemitone = NaN;
      let cachedMinFreq = 0;
      let cachedMaxFreq = 0;
      let noteFrequencies = [];
      let noteSemitones = [];

      let dataArray = null;

      const rebuildNoteCacheIfNeeded = () => {
        const minS = minSemitoneRef.current;
        const maxS = maxSemitoneRef.current;

        if (minS === cachedMinSemitone && maxS === cachedMaxSemitone) return;

        cachedMinSemitone = minS;
        cachedMaxSemitone = maxS;

        cachedMinFreq = f0 * Math.pow(2, minS / 12);
        cachedMaxFreq = f0 * Math.pow(2, maxS / 12);

        noteFrequencies = [];
        noteSemitones = [];
        const start = Math.ceil(minS);
        const end = Math.floor(maxS);

        for (let s = start; s <= end; s += 1) {
          noteSemitones.push(s);
          noteFrequencies.push(f0 * Math.pow(2, s / 12));
        }
      };

      const updateCanvasSize = () => {
        let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        let vh = window.innerHeight || 0;
        const canvasWidth = vw;
        const canvasHeight = Math.min((vw / 16) * 10, vh);
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      p.setup = () => {
        p.pixelDensity(3);
        let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        let vh = window.innerHeight || 0;
        const canvasWidth = vw;
        const canvasHeight = Math.min((vw / 16) * 10, vh);
        canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(sketchRef.current);

        dataArray = new Uint8Array(analyser.frequencyBinCount);

        p.windowResized = updateCanvasSize;
      };

      const getNoteName = (semitone) => {
        const octave = Math.floor(semitone / 12) - 1;
        const noteIndex = Math.floor(mod(semitone, 12));
        const noteName = baseNotes[noteIndex];
        const halfSemitone = semitone % 1 === 0.5 ? ' plus half a semitone' : '';
        return `${noteName}${octave}${halfSemitone}`;
      };

      p.draw = () => {
        p.background(0);

        // Ensure cache is up to date (only does work when sliders changed)
        rebuildNoteCacheIfNeeded();

        // Resize dataArray if analyser config changes
        if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(dataArray);
        const sampleRate = analyser.context.sampleRate;

        const minFreq = cachedMinFreq;
        const maxFreq = cachedMaxFreq;

        const middle = p.height / 2;
        const minS = cachedMinSemitone;
        const maxS = cachedMaxSemitone;

        // Draw frequency spectrum
        for (let i = 0; i < dataArray.length; i++) {
          const freq = (i * sampleRate) / analyser.fftSize;
          if (freq < minFreq || freq > maxFreq) continue;

          const energy = dataArray[i];

          // O(1) closest note:
          // semitone ≈ 12 * log2(freq / f0)
          const semitone = Math.log2(freq / f0) * 12;
          const closestSemitone = Math.round(semitone);
          const noteIndex = mod(closestSemitone, 12);

          const hue = noteHues[noteIndex];
          const brightEnergy = Math.pow(energy, brightnessRef.current);
          const brightMax = Math.pow(255, brightnessRef.current);
          const lightness = p.map(brightEnergy, 0, brightMax, 0, 50);
          const alpha = p.map(brightEnergy, 0, brightMax, 0, 255);

          p.stroke(p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`));
          p.strokeWeight(1);

          // Use semitone directly for log-x mapping (no extra log calls)
          const x = p.map(semitone, minS, maxS, 0, p.width);
          const lenEnergy = Math.pow(energy, lengthPowerRef.current);
          const lenMax = Math.pow(255, lengthPowerRef.current);
          const normalizedEnergy = p.map(lenEnergy, 0, lenMax, 0, middle);
          p.line(x, middle - normalizedEnergy, x, middle + normalizedEnergy);
        }

        // Draw note labels (uses cached noteFrequencies / semitones)
        if (showLabelsRef.current) {
          const rowHeight = 20;

          for (let k = 0; k < noteFrequencies.length; k++) {
            const freq = noteFrequencies[k];
            const s = noteSemitones[k];

            if (freq < minFreq || freq > maxFreq) continue;

            const x = p.map(s, minS, maxS, 0, p.width);
            const rowOffset = mod(s, 12);
            const y = middle - rowHeight * (rowOffset + 1) + 6 * rowHeight;
            const octave = Math.floor(s / 12) - 1;
            const noteName = `${baseNotes[mod(s, 12)]}${octave}`;

            p.fill(255);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(noteName, x, y);
          }
        }

        // Draw scrolling cursor and frequency info
        if (showScrollRef.current) {
          if (p.mouseX >= 0 && p.mouseX <= p.width) {
            p.stroke(255, 255, 255);
            p.line(p.mouseX, 0, p.mouseX, p.height);

            const mouseSemitone = p.map(p.mouseX, 0, p.width, minS, maxS);
            const freq = f0 * Math.pow(2, mouseSemitone / 12);

            const closestSemitone = Math.round(mouseSemitone);
            const octave = Math.floor(closestSemitone / 12) - 1;
            const closestNote = `${baseNotes[mod(closestSemitone, 12)]}${octave}`;

            p.fill(255);
            p.noStroke();
            p.textAlign(p.LEFT, p.BOTTOM);

            p.text(`${freq.toFixed(2)} Hz`, p.mouseX + 10, p.mouseY - 20);
            p.text(`${closestNote}`, p.mouseX + 10, p.mouseY - 5);
            p.text(`${mouseSemitone.toFixed(0)}`, p.mouseX + 10, p.mouseY + 10);
          }
        }

        // Display slider labels
        if (showLabelsRef.current) {
          p.noStroke();
          p.fill(255);
          p.textAlign(p.LEFT, p.BOTTOM);
          p.text(
            `Min Freq: ${minFreq.toFixed(2)} Hz (Semitone: ${minSemitoneRef.current} - ${getNoteName(minSemitoneRef.current)})`,
            10,
            p.height - 60
          );
          p.text(
            `Max Freq: ${maxFreq.toFixed(2)} Hz (Semitone: ${maxSemitoneRef.current} - ${getNoteName(maxSemitoneRef.current)})`,
            p.width / 2 + 10,
            p.height - 60
          );
        }
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [analyser, noteHues]);

  return (
    <div>
      <h2>Bar Graph Spectrograph</h2>
      {/* Sliders */}
      <div className="has-border" style={{ width: '90%' }}>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="minFreqSlider" className="control-label">
            Min Frequency Semitone: {minSemitone}
          </label>
          <input
            id="minFreqSlider"
            type="range"
            min="-36"
            max="140"
            step="0.5"
            value={minSemitone}
            onChange={(e) => setMinSemitone(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="maxFreqSlider" className="control-label">
            Max Frequency Semitone: {maxSemitone}
          </label>
          <input
            id="maxFreqSlider"
            type="range"
            min="-36"
            max="140"
            step="0.5"
            value={maxSemitone}
            onChange={(e) => setMaxSemitone(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="brightnessSlider" className="control-label">
            Brightness exponent: {brightness.toFixed(2)}
          </label>
          <input
            id="brightnessSlider"
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="lengthPowerSlider" className="control-label">
            Length exponent: {lengthPower.toFixed(2)}
          </label>
          <input
            id="lengthPowerSlider"
            type="range"
            min="0.1"
            max="10"
            step="0.01"
            value={lengthPower}
            onChange={(e) => setLengthPower(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Spectrograph Canvas */}
      <div className="spectrograph" ref={sketchRef}></div>
    </div>
  );
}
