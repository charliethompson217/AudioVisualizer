import React, { useRef, useEffect, useState } from 'react';

export default function ChromavectorCircleGraph({chroma, isPlaying}) {
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
        const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];
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
  }, []);

  return (
    <div >
       {isPlaying && (
        <h2>Chroma Circle Graph</h2>
      )}
      <div ref={sketchRef} style={{ width: '100%', height: '40vh' }}></div>
    </div>
  );
}