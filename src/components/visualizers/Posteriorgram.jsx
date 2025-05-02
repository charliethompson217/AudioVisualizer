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

import React, { useEffect, useRef, useState } from 'react';

const baseNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function Posteriorgram({
  isPlaying,
  basicPitchData,
  noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330],
}) {
  function isSafari() {
    let isSafariBrowser =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
      navigator.vendor === 'Apple Computer, Inc.' &&
      !window.chrome;
    return isSafariBrowser;
  }

  const { frames } = basicPitchData;
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  const rollHeight = Math.min(screenHeight * 2, screenWidth * 2);
  const noteRange = 108 - 12;
  const noteHeight = rollHeight / noteRange;
  const [showLabels, setShowLabels] = useState(true);
  const [timeOffset, setTimeOffset] = isSafari ? useState(-0.5) : useState(0);
  const showLabelsRef = useRef(showLabels);
  const timeOffsetRef = useRef(timeOffset);
  const noteHuesRef = useRef(noteHues);
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const framesRef = useRef(frames);
  const HOP_LENGTH = 256;
  const SAMPLE_RATE = 22050;
  const FRAME_DURATION = HOP_LENGTH / SAMPLE_RATE;
  const BUFFER_DURATION = 80;
  const RERENDER_THRESHOLD = 40;
  const TIME_SCALE = 50;

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  useEffect(() => {
    timeOffsetRef.current = timeOffset;
  }, [timeOffset]);

  useEffect(() => {
    noteHuesRef.current = noteHues;
  }, [noteHues]);

  useEffect(() => {
    const sketch = (p) => {
      let canvas, frameBuffer, labelBuffer;
      let width;
      let startTime = null;
      let bufferStartTime = 0;
      let bufferEndTime = BUFFER_DURATION;

      p.setup = () => {
        width = containerRef.current.offsetWidth;
        const bufferWidth = Math.ceil(BUFFER_DURATION * TIME_SCALE) + width;
        canvas = p.createCanvas(width, rollHeight);
        frameBuffer = p.createGraphics(bufferWidth, rollHeight);
        labelBuffer = p.createGraphics(width, rollHeight);
        canvas.parent(containerRef.current);
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(30);
        renderFrameBuffer();
        renderLabelBuffer();
      };

      const renderFrameBuffer = () => {
        frameBuffer.background(0);
        frameBuffer.noStroke();
        const startFrameIndex = Math.floor(bufferStartTime / FRAME_DURATION);
        const endFrameIndex = Math.min(Math.ceil((bufferStartTime + BUFFER_DURATION) / FRAME_DURATION), frames.length);

        for (let frameIndex = startFrameIndex; frameIndex < endFrameIndex; frameIndex++) {
          if (frameIndex >= frames.length) continue;

          const frame = frames[frameIndex];
          frame.forEach((strength, pitchIndex) => {
            const noteNumber = pitchIndex + 21;
            if (noteNumber < 12 || noteNumber > 108) return;
            const yPos = rollHeight - (noteNumber - 12 + 1) * noteHeight;
            const xPos = (frameIndex * FRAME_DURATION - bufferStartTime) * TIME_SCALE;
            const rectWidth = FRAME_DURATION * TIME_SCALE;
            frameBuffer.fill(`hsl(${noteHuesRef.current[noteNumber % 12]}, 100%, ${strength * 50}%)`);
            frameBuffer.rect(xPos, yPos, rectWidth, noteHeight);
          });
        }
      };

      const renderLabelBuffer = () => {
        labelBuffer.background(0, 0, 0, 0);
        labelBuffer.fill(255);
        for (let noteNumber = 12; noteNumber <= 108; noteNumber++) {
          const yPos = rollHeight - (noteNumber - 12 + 1) * noteHeight;
          labelBuffer.text(
            `${baseNotes[noteNumber % 12]} ${Math.floor(noteNumber / 12) - 1}`,
            0,
            yPos + noteHeight / 2 + labelBuffer.textSize() / 3
          );
        }
      };

      p.draw = () => {
        p.background(0);

        if (isPlaying && startTime === null) {
          startTime = p.millis();
        }

        const elapsedTime = isPlaying ? (p.millis() - startTime) / 1000 + timeOffsetRef.current : 0;
        const scrollX = elapsedTime * TIME_SCALE;

        if (isPlaying && elapsedTime > bufferEndTime - RERENDER_THRESHOLD) {
          bufferStartTime = Math.max(0, elapsedTime - RERENDER_THRESHOLD / 2);
          bufferEndTime = bufferStartTime + BUFFER_DURATION;
          renderFrameBuffer();
        }

        const bufferX = -scrollX + p.width / 2 + bufferStartTime * TIME_SCALE;
        p.image(frameBuffer, bufferX, 0);

        if (showLabelsRef.current) {
          p.image(labelBuffer, p.width / 2, 0);
        }

        if (isPlaying) {
          p.stroke(255, 0, 0);
          p.line(p.width / 2, 0, p.width / 2, rollHeight);
        }
      };

      p.windowResized = () => {
        width = containerRef.current.offsetWidth;
        p.resizeCanvas(width, rollHeight);
        const bufferWidth = Math.ceil(BUFFER_DURATION * TIME_SCALE) + width;
        frameBuffer = p.createGraphics(bufferWidth, rollHeight);
        labelBuffer = p.createGraphics(width, rollHeight);
        renderFrameBuffer();
        renderLabelBuffer();
      };

      p.renderFrameBuffer = renderFrameBuffer;
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [isPlaying, frames]);

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
      <h2>Posteriorgram</h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '95%',
          maxWidth: '1200px',
          margin: '0 auto 20px',
        }}
      >
        <label style={{ marginBottom: '8px' }}>Time Offset (seconds)</label>
        <input
          className="Posteriorgram-Time-Offset"
          type="range"
          min="-2"
          max="2"
          step="0.01"
          value={timeOffset}
          onChange={(e) => {
            const newOffset = Number(e.target.value);
            setTimeOffset(newOffset);
            timeOffsetRef.current = newOffset;
          }}
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: '10px' }}>
          <label>
            <input type="checkbox" checked={showLabels} onChange={() => setShowLabels(!showLabels)} />
            Show Labels
          </label>
        </div>
      </div>
    </div>
  );
}
