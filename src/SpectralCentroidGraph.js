import React, { useRef, useEffect } from 'react';

export default function SpectralCentroidGraph({ spectralCentroid, isPlaying, sampleRate, bufferSize }) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const spectralCentroidRef = useRef(spectralCentroid);
  const sampleRateRef = useRef(sampleRate);
  const bufferSizeRef = useRef(bufferSize);

  useEffect(() => {
    spectralCentroidRef.current = spectralCentroid * sampleRateRef.current / bufferSizeRef.current;
  }, [spectralCentroid]);

  useEffect(() => {
    sampleRateRef.current = sampleRate;
    bufferSizeRef.current = bufferSize;
  }, [sampleRate, bufferSize]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      const baseHeight = 400;
      let history = [];

      p.setup = () => {
        width = sketchRef.current.offsetWidth;
        canvas = p.createCanvas(width, baseHeight);
        canvas.parent(sketchRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
      };

      p.windowResized = () => {
        width = sketchRef.current.offsetWidth;
        p.resizeCanvas(width, baseHeight);
      };

      p.draw = () => {
        p.background(0);

        if (isPlaying && spectralCentroidRef.current) {
          history.push(spectralCentroidRef.current);
          if (history.length > 200) {
            history.shift();
          }
        }

        p.noFill();
        p.stroke(100, 100, 100);
        p.strokeWeight(2);
        p.beginShape();
        
        const minFrequency = 20;
        const nyquist = sampleRateRef.current / 2;
        const maxFrequency = nyquist;
        const logMin = Math.log2(minFrequency);
        const logMax = Math.log2(maxFrequency);

        for (let i = 0; i < history.length; i++) {
          const centroid = history[i];
          const logCentroid = Math.log2(Math.max(centroid, minFrequency));
          const x = p.map(logCentroid, logMin, logMax, 0, width);
          const y = p.map(i, 0, history.length - 1, baseHeight, 0);
          p.vertex(x, y);
        }
        p.endShape();

        p.fill(255);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.RIGHT, p.TOP);
        if (isPlaying) {
          p.text(
            `Spectral Centroid: ${spectralCentroidRef.current?.toFixed(2)} Hz`,
            width - 20,
            20
          );
        }
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, [isPlaying]);

  return (
    <div>
      {isPlaying && <h2>Spectral Centroid Graph</h2>}
      <div ref={sketchRef} style={{ width: '100%', height: '40vh' }}></div>
    </div>
  );
}