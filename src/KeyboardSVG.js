import React from 'react';

const KeyboardSVG = () => {
  // Define the keys that need to be colored and their corresponding HSL hues
  const coloredKeys = {
    'z': 0,
    's': 25,
    'x': 45,
    'd': 75,
    'c': 110,
    'v': 166,
    'g': 190,
    'b': 210,
    'h': 240,
    'n': 270,
    'j': 300,
    'm': 330,
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
        {keysRow.map((row, rowIndex) => (
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
                <text x={x + keyWidth / 2} y={y + keyHeight / 2} fill={textColor}>{key.toUpperCase()}</text>
              </g>
            );
          })
        ))}

        {/* Arrow keys */}
        {/* + Volume (Up Arrow) */}
        <g>
          <rect x={720} y={120} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={720 + keyWidth / 2} y={120 + keyHeight / 2} fill="white">↑</text>
        </g>

        {/* - Volume (Down Arrow) */}
        <g>
          <rect x={720} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={720 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">↓</text>
        </g>

        {/* + Octave (Right Arrow) */}
        <g>
          <rect x={780} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={780 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">→</text>
        </g>

        {/* - Octave (Left Arrow) */}
        <g>
          <rect x={660} y={180} width={keyWidth} height={keyHeight} stroke="white" fill="transparent" />
          <text x={660 + keyWidth / 2} y={180 + keyHeight / 2} fill="white">←</text>
        </g>

        {/* Labels */}
        <text x={720 + keyWidth / 2} y={100} fill="white">+ Volume</text>
        <text x={720 + keyWidth / 2} y={240} fill="white">- Volume</text>
        <text x={820 + keyWidth / 2} y={240} fill="white">+ Octave</text>
        <text x={620 + keyWidth / 2} y={240} fill="white">- Octave</text>
      </g>
    </svg>
  );
};

export default KeyboardSVG;