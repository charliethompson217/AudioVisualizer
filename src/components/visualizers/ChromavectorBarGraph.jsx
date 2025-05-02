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

export default function ChromavectorBarGraph({
  chroma,
  isPlaying,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const chromaRef = useRef(chroma);

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  useEffect(() => {
    chromaRef.current = chroma;
  }, [chroma]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      let baseHeight = Math.min(400, vh);
      const maxComponentWidth = 800;

      p.setup = () => {
        width = Math.min(sketchRef.current.offsetWidth, maxComponentWidth);
        canvas = p.createCanvas(width, baseHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(120);
        p.colorMode(p.HSB, 360, 100, 100);
      };

      p.windowResized = () => {
        width = Math.min(sketchRef.current.offsetWidth, maxComponentWidth);
        vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        baseHeight = Math.min(400, vh);
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        p.background(0);

        const barWidth = width / 12;
        const labelHeight = 25;

        chromaRef.current.forEach((value, i) => {
          const barHeight = (baseHeight - labelHeight) * (value * value);

          p.fill(noteHues[i], 100, value ** 3 * 100);
          p.noStroke();

          p.rect(i * barWidth, baseHeight - labelHeight - barHeight, barWidth, barHeight);

          p.fill(255);
          p.textSize(14);
          p.textAlign(p.CENTER);
          const labelX = i * barWidth + barWidth / 2;
          const labelY = baseHeight - 5;
          p.text(noteNames[i], labelX, labelY);
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
      {isPlaying && <h2>Chroma Bar Graph</h2>}
      <div
        ref={sketchRef}
        style={{ maxWidth: '800px', margin: '0 auto', alignSelf: 'center', justifySelf: 'center' }}
      ></div>
    </div>
  );
}
