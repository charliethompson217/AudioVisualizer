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
  const [showNoteLabels, setShowNoteLabels] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const svgWidth = 800;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render if screen is too narrow
  if (windowWidth < svgWidth) {
    return <></>;
  }

  const keyboardData = {
    layout: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ],
    keyInfo: {
      // First row
      q: { hue: undefined, note: null },
      w: { hue: undefined, note: null },
      e: { hue: undefined, note: null },
      r: { hue: undefined, note: null },
      t: { hue: undefined, note: null },
      y: { hue: undefined, note: null },
      u: { hue: undefined, note: null },
      i: { hue: undefined, note: null },
      o: { hue: undefined, note: null },
      p: { hue: undefined, note: null },
      // Second row
      a: { hue: undefined, note: null },
      s: { hue: noteHues[1], note: 'C#' },
      d: { hue: noteHues[3], note: 'D#' },
      f: { hue: undefined, note: null },
      g: { hue: noteHues[6], note: 'F#' },
      h: { hue: noteHues[8], note: 'G#' },
      j: { hue: noteHues[10], note: 'A#' },
      k: { hue: undefined, note: null },
      l: { hue: undefined, note: null },
      // Third row
      z: { hue: noteHues[0], note: 'C' },
      x: { hue: noteHues[2], note: 'D' },
      c: { hue: noteHues[4], note: 'E' },
      v: { hue: noteHues[5], note: 'F' },
      b: { hue: noteHues[7], note: 'G' },
      n: { hue: noteHues[9], note: 'A' },
      m: { hue: noteHues[11], note: 'B' },
    },
  };

  const keyWidth = 45;
  const keyHeight = 45;
  const keySpacing = 10;
  const startX = 50;
  const startY = 50;

  return (
    <div className="keyboard-svg">
      <label>
        <input type="checkbox" checked={showNoteLabels} onChange={() => setShowNoteLabels(!showNoteLabels)} />
        Show Synthesizer controls
      </label>
      {showNoteLabels && (
        <div>
          <svg width={svgWidth} height="270" xmlns="http://www.w3.org/2000/svg">
            <g fontFamily="Arial" fontSize="16" textAnchor="middle" dominantBaseline="middle">
              {keyboardData.layout.map((row, rowIndex) =>
                row.map((key, keyIndex) => {
                  const x =
                    startX + keyIndex * (keyWidth + keySpacing) + (rowIndex === 1 ? 25 : rowIndex === 2 ? 50 : 0);
                  const y = startY + rowIndex * (keyHeight + keySpacing);
                  const keyInfo = keyboardData.keyInfo[key];
                  const hue = keyInfo.hue;
                  const note = keyInfo.note;
                  const strokeColor = hue !== undefined ? `hsl(${hue}, 100%, 50%)` : 'white';
                  const fillColor = 'transparent';
                  const textColor = strokeColor;

                  return (
                    <g key={key}>
                      <rect x={x} y={y} width={keyWidth} height={keyHeight} stroke={strokeColor} fill={fillColor} />
                      <text x={x + keyWidth / 2} y={y + keyHeight / 2 - (note ? 5 : 0)} fill={textColor}>
                        {key.toUpperCase()}
                      </text>
                      {note && (
                        <text x={x + keyWidth / 2} y={y + keyHeight / 2 + 13} fill="white" fontSize="12">
                          {note}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* Arrow keys */}
              {/* + Volume (Up Arrow) */}
              <g>
                <rect x={620} y={140} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
                <text x={620 + keyWidth / 2} y={140 + keyHeight / 2} fill="white">
                  ↑
                </text>
              </g>

              {/* - Volume (Down Arrow) */}
              <g>
                <rect x={620} y={200} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
                <text x={620 + keyWidth / 2} y={200 + keyHeight / 2} fill="white">
                  ↓
                </text>
              </g>

              {/* + Octave (Right Arrow) */}
              <g>
                <rect x={680} y={200} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
                <text x={680 + keyWidth / 2} y={200 + keyHeight / 2} fill="white">
                  →
                </text>
              </g>

              {/* - Octave (Left Arrow) */}
              <g>
                <rect x={560} y={200} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
                <text x={560 + keyWidth / 2} y={200 + keyHeight / 2} fill="white">
                  ←
                </text>
              </g>

              {/* Labels */}
              <text x={620 + keyWidth / 2} y={130} fill="white">
                + Volume
              </text>
              <text x={620 + keyWidth / 2} y={262} fill="white">
                - Volume
              </text>
              <text x={720 + keyWidth / 2} y={262} fill="white">
                + Octave
              </text>
              <text x={520 + keyWidth / 2} y={262} fill="white">
                - Octave
              </text>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export default KeyboardSVG;
