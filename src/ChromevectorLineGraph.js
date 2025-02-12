import React, { useRef, useEffect, useState } from 'react';

export default function ChromevectorLineGraph({ chroma, isPlaying }) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  // Sync historyRef with history state
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Update history when chroma changes
  useEffect(() => {
    if (chroma) {
      setHistory(prev => {
        const newHistory = [...prev, [...chroma]];
        // Keep last 100 frames
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        return newHistory;
      });
    }
  }, [chroma]);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;

      let vw = Math.min(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      let vh = Math.min(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );
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
        p.background(0);
        const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];
        const currentHistory = historyRef.current;

        for (let i = 0; i < 12; i++) {
          p.stroke(noteHues[i], 100, 100);
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();
          
          currentHistory.forEach((entry, j) => {
            const value = entry[i];
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
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [windowSize]);

  return (
    <div>
      {isPlaying && (
        <h2>Chroma Line Graph</h2>
      )}
      <div ref={sketchRef} style={{ width: '100%' }}></div>
    </div>
  );
}