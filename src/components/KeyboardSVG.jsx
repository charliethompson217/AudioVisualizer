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

import React, { useState, useEffect } from 'react';

const KeyboardSVG = ({ noteHues }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const svgWidth = 1000;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render if screen is too narrow
  if (windowWidth < svgWidth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        This app is intended to be viewed on a larger screen.
      </div>
    );
  }

  // Define the keys that need to be colored and their corresponding HSL hues
  const coloredKeys = {
    z: noteHues[0],
    s: noteHues[1],
    x: noteHues[2],
    d: noteHues[3],
    c: noteHues[4],
    v: noteHues[5],
    g: noteHues[6],
    b: noteHues[7],
    h: noteHues[8],
    n: noteHues[9],
    j: noteHues[10],
    m: noteHues[11],
  };

  // All keys you want to display
  const keysRow = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const keyWidth = 40;
  const keyHeight = 40;
  const keySpacing = 10;
  const startX = 50;
  const startY = 50;

  return (
    <svg width="1000" height="300" xmlns="http://www.w3.org/2000/svg">
      <g fontFamily="Arial" fontSize="16" textAnchor="middle" dominantBaseline="middle">
        {keysRow.map((row, rowIndex) =>
          row.map((key, keyIndex) => {
            const x = startX + keyIndex * (keyWidth + keySpacing) + (rowIndex === 1 ? 25 : rowIndex === 2 ? 50 : 0);
            const y = startY + rowIndex * (keyHeight + keySpacing);
            const hue = coloredKeys[key];
            const strokeColor = hue !== undefined ? `hsl(${hue}, 100%, 50%)` : 'white';
            const fillColor = 'transparent';
            const textColor = strokeColor;

            return (
              <g key={key}>
                <rect x={x} y={y} width={keyWidth} height={keyHeight} stroke={strokeColor} fill={fillColor} />
                <text x={x + keyWidth / 2} y={y + keyHeight / 2} fill={textColor}>
                  {key.toUpperCase()}
                </text>
              </g>
            );
          })
        )}

        {/* Arrow keys */}
        {/* + Volume (Up Arrow) */}
        <g>
          <rect x={570} y={120} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={570 + keyWidth / 2} y={120 + keyHeight / 2} fill="white">
            ↑
          </text>
        </g>

        {/* - Volume (Down Arrow) */}
        <g>
          <rect x={570} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={570 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">
            ↓
          </text>
        </g>

        {/* + Octave (Right Arrow) */}
        <g>
          <rect x={630} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={630 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">
            →
          </text>
        </g>

        {/* - Octave (Left Arrow) */}
        <g>
          <rect x={510} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={510 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">
            ←
          </text>
        </g>

        {/* Labels */}
        <text x={570 + keyWidth / 2} y={100} fill="white">
          + Volume
        </text>
        <text x={570 + keyWidth / 2} y={240} fill="white">
          - Volume
        </text>
        <text x={670 + keyWidth / 2} y={240} fill="white">
          + Octave
        </text>
        <text x={470 + keyWidth / 2} y={240} fill="white">
          - Octave
        </text>
      </g>
    </svg>
  );
};

export default KeyboardSVG;
