// Waveform.js

import React, { useRef, useEffect, useState } from 'react';

export default function Waveform({ audioAnalysis }) {
  const sketchRef = useRef();
  const { analyser, dataArray } = audioAnalysis;
  const p5InstanceRef = useRef(null);
  
  // State for stretch factor
  const [stretchFactor, setStretchFactor] = useState(1); // Default to no stretch
  
  // Ref to hold the current stretch factor for p5 sketch
  const stretchFactorRef = useRef(stretchFactor);
  
  // Update the ref whenever stretchFactor changes
  useEffect(() => {
    stretchFactorRef.current = stretchFactor;
  }, [stretchFactor]);

  useEffect(() => {
    if (!analyser || !dataArray) return;

    const sketch = (p) => {
      let canvas;
      let width;
      const height = 400;

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(width, height);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(width, height);
      };

      p.draw = () => {
        const currentStretchFactor = stretchFactorRef.current; // Access current stretch factor
        p.background(0);

        p.push();
        p.translate(-p.width * (currentStretchFactor - 1) / 2, 0); // Center the waveform
        p.scale(currentStretchFactor, 1); // Scale x-axis

        analyser.getByteTimeDomainData(dataArray);
        const middle = p.height / 2;

        p.stroke(255, 255, 255); // Waveform color
        p.strokeWeight(1);       // Line thickness
        p.noFill();
        p.beginShape();

        for (let i = 0; i < dataArray.length; i++) {
          const x = (i / dataArray.length) * p.width;
          const y = middle + ((dataArray[i] - 128) / 128) * middle;
          p.curveVertex(x, y); // Smooth lines
        }
        p.endShape();
        p.pop();
      };
    };

    // Initialize p5 instance
    p5InstanceRef.current = new window.p5(sketch);

    // Cleanup on unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [analyser, dataArray]); // Only re-run if analyser or dataArray changes

  return (
    <div>
      {/* Slider for Stretch Factor */}
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="stretchSlider">Stretch Factor: {stretchFactor.toFixed(2)}x</label>
        <input
          id="stretchSlider"
          type="range"
          min="0.5"
          max="20"
          step="0.01"
          value={stretchFactor}
          onChange={(e) => setStretchFactor(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      
      {/* Waveform Canvas */}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}