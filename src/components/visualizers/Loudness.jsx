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

export default function Loudness({ loudness, isPlaying }) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    const loudnessValue = loudness.total;
    setHistory((prev) => {
      let newHistory = [...prev, loudnessValue];
      if (newHistory.length > 100) {
        newHistory.shift();
      }
      if (loudnessValue === 0) {
        newHistory = new Array(100).fill(0);
      }
      return newHistory;
    });
  }, [loudness]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      let baseHeight = Math.min(400, vh);

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(width, baseHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(240);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        baseHeight = Math.min(400, vh);
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        p.background(0);
        const currentHistory = historyRef.current;

        p.stroke(50);
        p.strokeWeight(1);
        for (let i = 0; i <= 1; i += 0.1) {
          const y = baseHeight - i * baseHeight;
          p.line(0, y, width, y);
          p.fill(150);
          p.textSize(12);
          p.text(i.toFixed(1), 5, y - 5);
        }

        if (currentHistory.length === 0) return;

        const maxValue = Math.max(...currentHistory, 0.01);

        p.stroke(100, 100, 100);
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();

        currentHistory.forEach((value, i) => {
          const normalizedValue = value / maxValue;

          let x;
          if (currentHistory.length === 1) {
            x = width;
          } else {
            x = (i / (currentHistory.length - 1)) * width;
          }
          const y = baseHeight - normalizedValue * baseHeight;
          p.vertex(x, y);
        });

        p.endShape();
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      {isPlaying && <h2>Perceptual Loudness (Normalized)</h2>}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}
