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

export default function SpiralGraphSpectrograph({
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
  const [octaveSpacingFactor, setOctaveSpacingFactor] = useState(0.035);
  const [octaveLaneFill, setOctaveLaneFill] = useState(0.45);
  // Refs to hold current slider values for p5 sketch
  const brightnessRef = useRef(brightness);
  const lengthPowerRef = useRef(lengthPower);
  const minSemitoneRef = useRef(minSemitone);
  const maxSemitoneRef = useRef(maxSemitone);
  const octaveSpacingFactorRef = useRef(octaveSpacingFactor);
  const octaveLaneFillRef = useRef(octaveLaneFill);

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
    octaveSpacingFactorRef.current = octaveSpacingFactor;
  }, [octaveSpacingFactor]);
  useEffect(() => {
    octaveLaneFillRef.current = octaveLaneFill;
  }, [octaveLaneFill]);
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
      let noteSemitones = [];
      let noteFrequencies = [];

      let dataArray = null;

      const rebuildNoteCacheIfNeeded = () => {
        const minS = minSemitoneRef.current;
        const maxS = maxSemitoneRef.current;

        if (minS === cachedMinSemitone && maxS === cachedMaxSemitone) return;

        cachedMinSemitone = minS;
        cachedMaxSemitone = maxS;

        cachedMinFreq = f0 * Math.pow(2, minS / 12);
        cachedMaxFreq = f0 * Math.pow(2, maxS / 12);

        noteSemitones = [];
        noteFrequencies = [];
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
        return `${baseNotes[noteIndex]}${octave}`;
      };

      const normalizeAngle0ToTwoPi = (a) => {
        const t = p.TWO_PI;
        return ((a % t) + t) % t;
      };

      const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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

        // Spiral layout: radius is linear in semitone (like v1 x-position),
        // angle is semitone on a 360°/octave mapping (mod 2π via sin/cos).
        const innerR = minDim * 0.08;
        const maxOuterR = minDim * 0.46;

        const k = p.TWO_PI / 12; // 360° per octave
        const angleOffset = -p.HALF_PI; // put C rays at top (since semitone 0 is C-1)

        // Fix 1: pack the spiral using a pixel spacing per octave (bounded so the full range still fits)
        const octavesVisible = spanS / 12;
        const octaveSpacingWanted = minDim * octaveSpacingFactorRef.current;
        const maxAllowedSpacing = octavesVisible > 0 ? (maxOuterR - innerR) / octavesVisible : octaveSpacingWanted;
        const octaveSpacingPx = Math.max(1, Math.min(octaveSpacingWanted, maxAllowedSpacing));
        const outerR = innerR + octaveSpacingPx * octavesVisible;

        const semitoneToRadius = (s) => innerR + ((s - minS) / 12) * octaveSpacingPx;
        const semitoneToAngle = (s) => k * s + angleOffset;

        // pitch-class rays
        if (showLabelsRef.current) {
          p.stroke(60);
          p.strokeWeight(1);
          for (let pc = 0; pc < 12; pc += 1) {
            const theta = k * pc + angleOffset;
            const x1 = cx + innerR * Math.cos(theta);
            const y1 = cy + innerR * Math.sin(theta);
            const x2 = cx + (outerR + 22) * Math.cos(theta);
            const y2 = cy + (outerR + 22) * Math.sin(theta);
            p.line(x1, y1, x2, y2);
          }
        }

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

          const r = semitoneToRadius(semitone);
          const theta = semitoneToAngle(semitone);

          // radial length mapping
          const lenEnergy = Math.pow(energy, lengthPowerRef.current);
          const lenMax = Math.pow(255, lengthPowerRef.current);

          // Octave lane fill: 0.5 means bars can touch the next octave boundary.
          // >0.5 intentionally overlaps, <0.5 keeps lanes separated.
          const rDeltaMax = Math.max(1, octaveSpacingPx * octaveLaneFillRef.current);
          const rDelta = p.map(lenEnergy, 0, lenMax, 0, rDeltaMax);

          const r1 = Math.max(0, r - rDelta);
          const r2 = r + rDelta;

          const x1 = cx + r1 * Math.cos(theta);
          const y1 = cy + r1 * Math.sin(theta);
          const x2 = cx + r2 * Math.cos(theta);
          const y2 = cy + r2 * Math.sin(theta);

          p.line(x1, y1, x2, y2);
        }

        // Labels (pitch classes at outside)
        if (showLabelsRef.current) {
          p.noStroke();
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);

          for (let pc = 0; pc < 12; pc += 1) {
            const theta = k * pc + angleOffset;
            const lx = cx + (outerR + 40) * Math.cos(theta);
            const ly = cy + (outerR + 40) * Math.sin(theta);
            p.text(baseNotes[pc], lx, ly);
          }

          // Label the C's along the spiral
          p.textAlign(p.LEFT, p.CENTER);
          for (let s = Math.ceil(minS); s <= Math.floor(maxS); s += 1) {
            if (mod(s, 12) !== 0) continue;
            const r = semitoneToRadius(s);
            const theta = semitoneToAngle(s);
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            p.text(getNoteName(s), x + 6, y);
          }
        }

        if (showScrollRef.current) {
          const dx = p.mouseX - cx;
          const dy = p.mouseY - cy;
          const rm = Math.sqrt(dx * dx + dy * dy);

          if (rm >= innerR && rm <= outerR) {
            const rawAngle = Math.atan2(dy, dx);
            const angU = normalizeAngle0ToTwoPi(rawAngle - angleOffset);

            // semitone-within-octave from angle (0..12)
            const within = angU / k;

            // rough semitone from radius (inverse of semitoneToRadius)
            const sR = minS + ((rm - innerR) / octaveSpacingPx) * 12;

            // choose octave that best matches radius
            const n = Math.round((sR - within) / 12);
            const mouseSemitone = clamp(within + 12 * n, minS, maxS);

            const freq = f0 * Math.pow(2, mouseSemitone / 12);
            const closestSemitone = Math.round(mouseSemitone);
            const octave = Math.floor(closestSemitone / 12) - 1;
            const closestNote = `${baseNotes[mod(closestSemitone, 12)]}${octave}`;

            const r = semitoneToRadius(mouseSemitone);
            const theta = semitoneToAngle(mouseSemitone);
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);

            p.stroke(255);
            p.noFill();
            p.circle(x, y, 10);

            p.noStroke();
            p.fill(255);
            p.textAlign(p.LEFT, p.BOTTOM);
            const tx = p.mouseX + 10;
            const ty = p.mouseY - 10;
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
      <h2>Spiral Graph Spectrograph</h2>

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
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="octaveSpacingSlider" className="control-label">
            Octave spacing factor: {octaveSpacingFactor.toFixed(3)}
          </label>
          <input
            id="octaveSpacingSlider"
            type="range"
            min="0.005"
            max="0.08"
            step="0.001"
            value={octaveSpacingFactor}
            onChange={(e) => setOctaveSpacingFactor(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="octaveLaneFillSlider" className="control-label">
            Octave lane fill: {octaveLaneFill.toFixed(2)}
          </label>
          <input
            id="octaveLaneFillSlider"
            type="range"
            min="0.05"
            max="1.5"
            step="0.01"
            value={octaveLaneFill}
            onChange={(e) => setOctaveLaneFill(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Spectrograph Canvas */}
      <div className="spectrograph" ref={sketchRef}></div>
    </div>
  );
}
