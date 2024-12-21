import React, { useEffect, useRef } from 'react';

const baseNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];

function getColor(noteNumber) {
  const index = noteNumber % 12;
  return `hsl(${noteHues[index]}, 100%, 50%)`;
}

export default function PianoRoll({ notes, isPlaying }) {
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rollHeight = screenHeight * 2;
  const noteRange = 108 - 12;
  const noteHeight = rollHeight / noteRange;
  const timeScale = 50;
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      let canvas;
      let width;
      let startTime = null;

      p.setup = () => {
        width = containerRef.current.offsetWidth;
        canvas = p.createCanvas(width, rollHeight);
        canvas.parent(containerRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(30);
      };

      p.draw = () => {
        p.background(0);
        p.noStroke();

        if (isPlaying && startTime === null) {
          startTime = p.millis();
        }

        const elapsedTime = isPlaying ? (p.millis() - startTime) / 1000 : 0;
        const scrollX = elapsedTime * timeScale;

        notes.forEach(note => {
          const yPos = rollHeight - (note.noteNumber - 12 + 1) * noteHeight;
          const xPos = note.startSec * timeScale - scrollX + p.width / 2;
          const rectWidth = note.durationSec * timeScale;
          p.fill(getColor(note.noteNumber));
          p.rect(xPos, yPos, rectWidth, noteHeight);
        });

        if (isPlaying) {
          const currentX = p.width / 2;
          p.stroke(255, 0, 0);
          p.line(currentX, 0, currentX, rollHeight);
        }
      };

      p.windowResized = () => {
        width = containerRef.current.offsetWidth;
        p.resizeCanvas(width, rollHeight);
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [notes, isPlaying]);

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }}></div>
  );
}
