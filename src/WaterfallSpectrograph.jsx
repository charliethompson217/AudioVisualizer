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

export default function WaterfallSpectrograph({
  audioAnalysis, noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330]
}) {
  const sketchRef = useRef();
  const { analyser } = audioAnalysis;
  const p5InstanceRef = useRef(null);

  const [cutoff, setCutoff] = useState(100);
  const cutoffRef = useRef(cutoff);

  const [brightness, setBrightness] = useState(3);
  const brightnessRef = useRef(brightness);

  useEffect(() => {
    cutoffRef.current = cutoff;
  }, [cutoff]);

  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!analyser) return;

    let vw = Math.min(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    let vh = Math.min(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
    const canvasWidth = Math.floor(0.99 * vw);
    const canvasHeight = Math.floor(Math.min((vw / 16) * 10, vh));

    const sketch = (p) => {
      let canvas;
      let buffer;
      const f0 = 8.1758; // Frequency of C-1 in Hz

      p.setup = () => {
        p.pixelDensity(1);
        canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(sketchRef.current);
        buffer = p.createGraphics(canvasWidth, canvasHeight);
        buffer.noSmooth();
        buffer.background(0);
        p.frameRate(120);
      };

      p.draw = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const sampleRate = analyser.context.sampleRate;
        const minSemitoneValue = 12;
        const maxSemitoneValue = 108;
        
        buffer.loadPixels();
        const pixels = buffer.pixels;

        // Shift pixels down by one row
        for (let y = buffer.height - 1; y > 0; y--) {
          for (let x = 0; x < buffer.width; x++) {
            const destIndex = (x + y * buffer.width) * 4;
            const srcIndex = (x + (y - 1) * buffer.width) * 4;
            pixels[destIndex] = pixels[srcIndex];
            pixels[destIndex + 1] = pixels[srcIndex + 1];
            pixels[destIndex + 2] = pixels[srcIndex + 2];
            pixels[destIndex + 3] = pixels[srcIndex + 3];
          }
        }

        // Draw new spectrum at top row
        for (let x = 0; x < buffer.width; x++) {
          const semitone = p.map(x, 0, buffer.width, minSemitoneValue, maxSemitoneValue);
          const freq = f0 * Math.pow(2, semitone / 12);
          const i = Math.floor((freq * analyser.fftSize) / sampleRate);
          let energy = 0;
          if (i >= 0 && i < analyser.frequencyBinCount) {
            energy = dataArray[i];
          }
          const n_closest = Math.round(semitone) % 12;
          const hue = noteHues[n_closest];
          const lightness = p.map(Math.pow(energy, brightnessRef.current), 0, Math.pow(255, brightnessRef.current), 0, 50);
          const alpha = p.map(Math.pow(energy, brightnessRef.current), 0, Math.pow(255, brightnessRef.current), 0, 255);
          const color = p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`);
          const index = x * 4;
          if(energy > cutoffRef.current){
            pixels[index] = p.red(color);
            pixels[index + 1] = p.green(color);
            pixels[index + 2] = p.blue(color);
            pixels[index + 3] = p.alpha(color);
          } else {
            pixels[index] = p.red(0);
            pixels[index + 1] = p.green(0);
            pixels[index + 2] = p.blue(0);
            pixels[index + 3] = p.alpha(0);
          }
        }
        buffer.updatePixels();

        // Draw buffer to canvas
        p.image(buffer, 0, 0);
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [analyser, windowSize, noteHues]);

  return (
    <div>
      <h2>Waterfall Spectrograph</h2>
      <div className="has-border" style={{ width: '90%' }}>
        <div style={{ margin: '20px 40px' }}>
          <label htmlFor="brightnessSlider">
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
        <div style={{ margin: '20px 40px' }}>
          <label htmlFor="cutoffSlider">
            Minimum energey threshold: {cutoff}
          </label>
          <input
            id="cutoffSlider"
            type="range"
            min="2"
            max="255"
            step="1"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className="spectrograph" ref={sketchRef}></div>
    </div>
  );
}