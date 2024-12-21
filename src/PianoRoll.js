import React, { useEffect, useRef, useState } from 'react';

const baseNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];

export default function PianoRoll({ notes, isPlaying }) {
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rollHeight = screenHeight * 2;
  const noteRange = 108 - 12;
  const noteHeight = rollHeight / noteRange;
  const [timeScale, setTimeScale] = useState(50);
  const [showLabels, setShowLabels] = useState(true);
  const showLabelsRef = useRef(showLabels);
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const timeScaleRef = useRef(timeScale);

  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

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
        p.frameRate(240);
      };

      p.draw = () => {
        const scale = timeScaleRef.current;
        p.background(0);
        p.noStroke();

        if (isPlaying && startTime === null) {
          startTime = p.millis();
        }

        const elapsedTime = isPlaying ? (p.millis() - startTime) / 1000 : 0;
        const scrollX = elapsedTime * scale;

        notes.forEach(note => {
          const yPos = rollHeight - (note.noteNumber - 12 + 1) * noteHeight;
          const xPos = note.startSec * scale - scrollX + p.width / 2;
          const rectWidth = note.durationSec * scale;
          const noteIsActive = isPlaying && elapsedTime >= note.startSec && elapsedTime <= note.startSec + note.durationSec;
          const index = note.noteNumber % 12;
          let  color = `hsl(${noteHues[index]}, 100%, 35%)`;
          if (noteIsActive) {
            const index = note.noteNumber % 12;
            color = `hsl(${noteHues[index]}, 100%, 60%)`;
          }
          p.fill(color);
          p.rect(xPos, yPos, rectWidth, noteHeight);
        });
        
        notes.forEach(note => {
          const yPos = rollHeight - (note.noteNumber - 12 + 1) * noteHeight;
          const xPos = note.startSec * scale - scrollX + p.width / 2;
          if (showLabelsRef.current) {
            p.fill(255);
            p.text(`${baseNotes[note.noteNumber%12]} ${Math.floor(note.noteNumber/12)-1} `, xPos, yPos + noteHeight / 2 + p.textSize() / 3);
          }
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
    <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }}>
      <div>
        <label>Time Scale</label>
        <input
          className='Piano-Roll-Time-Scale'
          type="range"
          min="1"
          max="3000"
          value={timeScale}
          onChange={(e) => {
            const newScale = Number(e.target.value);
            setTimeScale(newScale);
            timeScaleRef.current = newScale;
          }}
        />
        <label>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
          />
          Show Labels
        </label>
      </div>
    </div>
  );
}
