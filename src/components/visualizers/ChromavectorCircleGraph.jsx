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

export default function ChromavectorCircleGraph({
  chroma,
  isPlaying,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);

  const chromaRef = useRef(chroma);

  useEffect(() => {
    chromaRef.current = chroma;
  }, [chroma]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      const baseHeight = 400;

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(width, baseHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(120);
        p.colorMode(p.HSB, 360, 100, 100);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        p.background(0);
        p.translate(width / 2, baseHeight / 2);
        const sliceAngle = p.TWO_PI / 12;
        const maxRadius = baseHeight / 2;
        chromaRef.current.forEach((value, i) => {
          const radius = maxRadius * (value * value);
          const startAngle = i * sliceAngle;
          p.fill(noteHues[i], 100, 100);
          p.noStroke();
          p.arc(0, 0, radius * 2, radius * 2, startAngle, startAngle + sliceAngle, p.PIE);
        });
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [noteHues]);

  return (
    <div>
      {isPlaying && <h2>Chroma Circle Graph</h2>}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}
