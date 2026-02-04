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

export default function CircleGraphSpectrograph({
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
        const vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = window.innerHeight || 0;
        const canvasWidth = vw;
        const canvasHeight = Math.min((vw / 16) * 10, vh);
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      p.setup = () => {
        p.pixelDensity(3);
        const vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = window.innerHeight || 0;
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

      const normalizeAngle0ToTwoPi = (a) => {
        const t = p.TWO_PI;
        return ((a % t) + t) % t;
      };

      p.draw = () => {
        p.background(0);
        rebuildNoteCacheIfNeeded();

        if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        analyser.getByteFrequencyData(dataArray);
        const sampleRate = analyser.context.sampleRate;

        const minFreq = cachedMinFreq;
        const maxFreq = cachedMaxFreq;

        const minS = cachedMinSemitone;
        const maxS = cachedMaxSemitone;
        const spanS = maxS - minS;
        if (spanS <= 0) return;

        const cx = p.width / 2;
        const cy = p.height / 2;

        const minDim = Math.min(p.width, p.height);

        // Ring geometry
        const baseRadius = minDim * 0.22; // center ring radius
        const energySpan = minDim * 0.22; // how far energy expands inward/outward
        const outerRadius = baseRadius + energySpan + minDim * 0.18;

        // Rotate so the start is at the top
        const angleOffset = -p.HALF_PI;

        // Map semitone -> angle around circle
        const semitoneToAngle = (s) => p.map(s, minS, maxS, 0, p.TWO_PI) + angleOffset;

        // Inverse: angle -> semitone
        const angleToSemitone = (angleNorm) => p.map(angleNorm, 0, p.TWO_PI, minS, maxS);

        // Draw the circular spectrum
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

          // radial length mapping
          const lenEnergy = Math.pow(energy, lengthPowerRef.current);
          const lenMax = Math.pow(255, lengthPowerRef.current);
          const rDelta = p.map(lenEnergy, 0, lenMax, 0, energySpan);

          const theta = semitoneToAngle(semitone);

          // symmetric around baseRadius
          const r1 = Math.max(0, baseRadius - rDelta);
          const r2 = baseRadius + rDelta;

          const x1 = cx + r1 * Math.cos(theta);
          const y1 = cy + r1 * Math.sin(theta);
          const x2 = cx + r2 * Math.cos(theta);
          const y2 = cy + r2 * Math.sin(theta);

          p.line(x1, y1, x2, y2);
        }

        // Draw note labels around the ring
        if (showLabelsRef.current) {
          p.noStroke();
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);

          for (let k = 0; k < noteSemitones.length; k++) {
            const s = noteSemitones[k];

            const theta = semitoneToAngle(s);

            // stagger labels so they don't overlap
            const pitchClass = mod(s, 12);
            const stagger = pitchClass % 3; // 0,1,2
            const labelRadius = baseRadius + energySpan + 22 + stagger * 14;

            const x = cx + labelRadius * Math.cos(theta);
            const y = cy + labelRadius * Math.sin(theta);

            const octave = Math.floor(s / 12) - 1;
            const noteName = `${baseNotes[pitchClass]}${octave}`;

            p.text(noteName, x, y);
          }
        }

        if (showScrollRef.current) {
          const dx = p.mouseX - cx;
          const dy = p.mouseY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > minDim * 0.05 && dist < outerRadius) {
            const rawAngle = Math.atan2(dy, dx);
            const angleNorm = normalizeAngle0ToTwoPi(rawAngle - angleOffset); // normalize in [0..2π] in the *unrotated* space

            const mouseSemitone = angleToSemitone(angleNorm);
            const freq = f0 * Math.pow(2, mouseSemitone / 12);

            const closestSemitone = Math.round(mouseSemitone);
            const octave = Math.floor(closestSemitone / 12) - 1;
            const closestNote = `${baseNotes[mod(closestSemitone, 12)]}${octave}`;

            // cursor ray
            const theta = rawAngle;
            p.stroke(255, 255, 255);
            p.strokeWeight(1);
            p.line(cx, cy, cx + outerRadius * Math.cos(theta), cy + outerRadius * Math.sin(theta));

            // info box near mouse
            p.noStroke();
            p.fill(255);
            p.textAlign(p.LEFT, p.BOTTOM);

            const tx = p.mouseX + 10;
            const ty = p.mouseY - 20;
            p.text(`${freq.toFixed(2)} Hz`, tx, ty);
            p.text(`${closestNote}`, tx, ty + 15);
            p.text(`${mouseSemitone.toFixed(1)} st`, tx, ty + 30);
          }
        }

        if (showLabelsRef.current) {
          p.noStroke();
          p.fill(255);
          p.textAlign(p.LEFT, p.BOTTOM);

          p.text(
            `Min Freq: ${minFreq.toFixed(2)} Hz (Semitone: ${minSemitoneRef.current} - ${getNoteName(
              minSemitoneRef.current
            )})`,
            10,
            p.height - 60
          );

          p.text(
            `Max Freq: ${maxFreq.toFixed(2)} Hz (Semitone: ${maxSemitoneRef.current} - ${getNoteName(
              maxSemitoneRef.current
            )})`,
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
      <h2>Circle Graph Spectrograph</h2>

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
