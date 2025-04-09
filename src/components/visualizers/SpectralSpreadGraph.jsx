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

import React, { useRef, useEffect } from 'react';

export default function SpectralSpreadGraph({
  spectralCentroid,
  spectralSpread,
  isPlaying,
  sampleRate,
  bufferSize,
}) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const spectralCentroidRef = useRef(spectralCentroid);
  const spectralSpreadRef = useRef(spectralSpread);
  const sampleRateRef = useRef(sampleRate);
  const bufferSizeRef = useRef(bufferSize);

  useEffect(() => {
    spectralCentroidRef.current =
      (spectralCentroid * sampleRateRef.current) / bufferSizeRef.current;
  }, [spectralCentroid]);

  useEffect(() => {
    spectralSpreadRef.current =
      (spectralSpread * sampleRateRef.current) / bufferSizeRef.current;
  }, [spectralSpread]);

  useEffect(() => {
    sampleRateRef.current = sampleRate;
    bufferSizeRef.current = bufferSize;
  }, [sampleRate, bufferSize]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      const baseHeight = 400;
      let history = [];

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(width, baseHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        p.background(0);

        if (
          isPlaying &&
          spectralCentroidRef.current !== undefined &&
          spectralSpreadRef.current !== undefined
        ) {
          history.push({
            centroid: spectralCentroidRef.current,
            spread: spectralSpreadRef.current,
          });
          if (history.length > 200) {
            history.shift();
          }
        }

        const minFrequency = 20;
        const nyquist = sampleRateRef.current / 2;
        const maxFrequency = nyquist;
        const logMin = Math.log2(minFrequency);
        const logMax = Math.log2(maxFrequency);

        p.noFill();
        p.stroke(100, 100, 100);
        p.strokeWeight(2);
        p.beginShape();
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const value = entry.centroid;
          const cappedValue = Math.min(
            Math.max(value, minFrequency),
            maxFrequency
          );
          const logValue = Math.log2(cappedValue);
          const x = p.map(logValue, logMin, logMax, 0, width);
          const y = p.map(i, 0, history.length - 1, baseHeight, 0);
          p.vertex(x, y);
        }
        p.endShape();

        p.stroke(0, 0, 255);
        p.beginShape();
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const value = entry.centroid + entry.spread / 2;
          const cappedValue = Math.min(
            Math.max(value, minFrequency),
            maxFrequency
          );
          const logValue = Math.log2(cappedValue);
          const x = p.map(logValue, logMin, logMax, 0, width);
          const y = p.map(i, 0, history.length - 1, baseHeight, 0);
          p.vertex(x, y);
        }
        p.endShape();

        p.stroke(255, 0, 0);
        p.beginShape();
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const value = entry.centroid - entry.spread / 2;
          const cappedValue = Math.min(
            Math.max(value, minFrequency),
            maxFrequency
          );
          const logValue = Math.log2(cappedValue);
          const x = p.map(logValue, logMin, logMax, 0, width);
          const y = p.map(i, 0, history.length - 1, baseHeight, 0);
          p.vertex(x, y);
        }
        p.endShape();

        p.fill(255);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.RIGHT, p.TOP);
        if (isPlaying) {
          p.text(
            `Spectral Centroid: ${spectralCentroidRef.current?.toFixed(2)} Hz`,
            width - 20,
            20
          );
        }
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, [isPlaying]);

  return (
    <div>
      {isPlaying && <h2>Spectral Centroid + Spread Graph</h2>}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}
