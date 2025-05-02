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

export default function ChromevectorLineGraph({
  chroma,
  isPlaying,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  const [stretchFactor, setStretchFactor] = useState(1);
  const [verticalStretchFactor, setVerticalStretchFactor] = useState(1);
  const [verticleExponent, setVerticleExponent] = useState(1);

  const stretchFactorRef = useRef(stretchFactor);
  const verticalStretchFactorRef = useRef(verticalStretchFactor);
  const verticleExponentRef = useRef(1);

  useEffect(() => {
    stretchFactorRef.current = stretchFactor;
  }, [stretchFactor]);

  useEffect(() => {
    verticalStretchFactorRef.current = verticalStretchFactor;
  }, [verticalStretchFactor]);

  useEffect(() => {
    verticleExponentRef.current = verticleExponent;
  }, [verticleExponent]);

  // Sync historyRef with history state
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Update history when chroma changes
  useEffect(() => {
    if (chroma) {
      setHistory((prev) => {
        const newHistory = [...prev, [...chroma]];
        // Keep last 50 frames
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        return newHistory;
      });
    }
  }, [chroma]);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;

      let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const canvasWidth = 0.99 * vw;
      const canvasHeight = 0.95 * vh;

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(120);
        p.colorMode(p.HSB, 360, 100, 100);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      p.draw = () => {
        const currentStretchFactor = stretchFactorRef.current;
        const currentVerticalStretchFactor = verticalStretchFactorRef.current;

        p.background(0);
        const currentHistory = historyRef.current;

        p.push();
        p.translate(-p.width * (currentStretchFactor - 1), 0);
        p.scale(currentStretchFactor, currentVerticalStretchFactor);

        for (let i = 0; i < 12; i++) {
          p.stroke(noteHues[i], 100, 100);
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();

          currentHistory.forEach((entry, j) => {
            const value = entry[i] ** verticleExponentRef.current;
            let x;
            if (currentHistory.length === 1) {
              x = width;
            } else {
              x = (j / (currentHistory.length - 1)) * width;
            }
            const y = canvasHeight - value * canvasHeight;
            p.vertex(x, y);
          });

          p.endShape();
        }
        p.pop();
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [windowSize, noteHues]);

  return (
    <div>
      {isPlaying && (
        <>
          <h2>Chroma Line Graph</h2>
          <div className="has-border" style={{ width: '90%' }}>
            <div style={{ margin: '10px 10px' }}>
              <label htmlFor="horizontalStretchSlider" className="control-label">
                Horizontal Stretch coefficient: {stretchFactor.toFixed(2)}x
              </label>
              <input
                id="horizontalStretchSlider"
                type="range"
                min="0.01"
                max="20"
                step="0.01"
                value={stretchFactor}
                onChange={(e) => setStretchFactor(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ margin: '10px 10px' }}>
              <label htmlFor="verticalStretchSlider" className="control-label">
                Vertical Stretch coefficient: {verticalStretchFactor.toFixed(2)}x
              </label>
              <input
                id="verticalStretchSlider"
                type="range"
                min="0.01"
                max="20"
                step="0.01"
                value={verticalStretchFactor}
                onChange={(e) => setVerticalStretchFactor(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ margin: '10px 10px' }}>
              <label htmlFor="verticalStretchExponentSlider" className="control-label">
                Vertical Exponent: {verticleExponent.toFixed(2)}x
              </label>
              <input
                id="verticalStretchExponentSlider"
                type="range"
                min="0.01"
                max="20"
                step="0.01"
                value={verticleExponent}
                onChange={(e) => setVerticleExponent(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </>
      )}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}
