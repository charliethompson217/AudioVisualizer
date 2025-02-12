import React, { useRef, useEffect, useState } from 'react';

export default function Waveform({ audioAnalysis }) {
  const sketchRef = useRef();
  const { analyser, dataArray } = audioAnalysis;
  const p5InstanceRef = useRef(null);
  
  const [stretchFactor, setStretchFactor] = useState(1);
  
  const [verticalStretchFactor, setVerticalStretchFactor] = useState(1);
  
  const stretchFactorRef = useRef(stretchFactor);
  const verticalStretchFactorRef = useRef(verticalStretchFactor);
  
  useEffect(() => {
    stretchFactorRef.current = stretchFactor;
  }, [stretchFactor]);
  
  useEffect(() => {
    verticalStretchFactorRef.current = verticalStretchFactor;
  }, [verticalStretchFactor]);

  useEffect(() => {
    if (!analyser || !dataArray) return;

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
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        const currentStretchFactor = stretchFactorRef.current;
        const currentVerticalStretchFactor = verticalStretchFactorRef.current;
        p.background(0);

        p.push();
        p.translate(
          -p.width * (currentStretchFactor - 1),
          -baseHeight * (currentVerticalStretchFactor - 1) / 2
        );
        p.scale(currentStretchFactor, currentVerticalStretchFactor);

        analyser.getByteTimeDomainData(dataArray);
        const middle = p.height / 2;

        p.stroke(255, 255, 255);
        p.strokeWeight(1);
        p.noFill();
        p.beginShape();

        for (let i = 0; i < dataArray.length; i++) {
          const x = (i / dataArray.length) * p.width;
          const y = middle + ((dataArray[i] - 128) / 128) * middle;
          p.curveVertex(x, y);
        }
        p.endShape();
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
  }, [analyser, dataArray]);

  return (
    <div style={{ marginBottom: '200px' }}>
      {/* Waveform Canvas */}
      <h2>Waveform</h2>
     

      {/* Slider for Horizontal Stretch Factor */}
      <div className='has-border' style={{width: '90%'}}>
        <div style={{ margin: '20px 40px' }}>
          <label htmlFor="horizontalStretchSlider">
            Horizontal Stretch coefficient: {stretchFactor.toFixed(2)}x
          </label>
          <input
            id="horizontalStretchSlider"
            type="range"
            min="0.5"
            max="20"
            step="0.01"
            value={stretchFactor}
            onChange={(e) => setStretchFactor(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Slider for Vertical Stretch Factor */}
        <div style={{ margin: '20px 40px' }}>
          <label htmlFor="verticalStretchSlider">
            Vertical Stretch coefficient: {verticalStretchFactor.toFixed(2)}x
          </label>
          <input
            id="verticalStretchSlider"
            type="range"
            min="0.5"
            max="20"
            step="0.01"
            value={verticalStretchFactor}
            onChange={(e) => setVerticalStretchFactor(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}