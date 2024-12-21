import React, { useRef, useEffect, useState } from 'react';

export default function SpectrographVisualizer({
  showLabels,
  showScroll,
  brightnessPower = 1,
  audioAnalysis,
}) {
  const sketchRef = useRef();
  const { analyser } = audioAnalysis;
  const p5InstanceRef = useRef(null);

  // State hooks for slider values
  const [brightness, setBrightness] = useState(brightnessPower);
  const [lengthPower, setLengthPower] = useState(1);
  const [minSemitone, setMinSemitone] = useState(12);
  const [maxSemitone, setMaxSemitone] = useState(108);
  // Refs to hold current slider values for p5 sketch
  const brightnessRef = useRef(brightness);
  const lengthPowerRef = useRef(lengthPower);
  const minSemitoneRef = useRef(minSemitone);
  const maxSemitoneRef = useRef(maxSemitone);

  const showLabelsRef = useRef(showLabels);
  const showScrollRef = useRef(showScroll);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update refs when slider values change
  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);
  useEffect(() => {
    lengthPowerRef.current = lengthPower;
  }, [lengthPower]);
  useEffect(() => {
    minSemitoneRef.current = minSemitone;
  }, [minSemitone]);
  useEffect(() => {
    maxSemitoneRef.current = maxSemitone;
  }, [maxSemitone]);
  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);
  useEffect(() => {
    showScrollRef.current = showScroll;
  }, [showScroll]);

  useEffect(() => {
    if (!analyser) return;

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

    const sketch = (p) => {
      let canvas;
      const f0 = 8.1758; // Frequency of C-1 in Hz

      p.setup = () => {
        p.pixelDensity(3);
        canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(sketchRef.current);
      };

      const getNoteName = (semitone) => {
        const baseNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const octave = Math.floor(semitone / 12) - 1;
        const noteIndex = Math.floor(semitone % 12);
        const noteName = baseNotes[noteIndex];
        const halfSemitone = semitone % 1 === 0.5 ? " plus half a semitone" : "";
        return `${noteName}${octave}${halfSemitone}`;
      };

      p.draw = () => {
        p.background(0);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const sampleRate = analyser.context.sampleRate;

        // Recalculate minFreq and maxFreq using current slider values
        const minFreq = f0 * Math.pow(2, minSemitoneRef.current / 12);
        const maxFreq = f0 * Math.pow(2, maxSemitoneRef.current / 12);

        // Update computations that depend on minFreq and maxFreq
        const middle = p.height / 2;

        const noteFrequencies = [];
        const baseNotes = ["C", "C#", "D",  "D#",  "E",  "F",  "F#",  "G",  "G#",  "A", "A#", "B"];
        const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];

        // Generate note frequencies up to maxSemitone
        const maxSemitoneValue = Math.log2(maxFreq / f0) * 12;
        for (let n = 0; n <= maxSemitoneValue; n++) {
          const freq = f0 * Math.pow(2, n / 12);
          noteFrequencies.push(freq);
        }

        const logScale = (freq) => {
          const minSemitoneValue = Math.log2(minFreq / f0) * 12;
          const maxSemitoneValue = Math.log2(maxFreq / f0) * 12;
          const freqSemitone = Math.log2(freq / f0) * 12;
          return p.map(freqSemitone, minSemitoneValue, maxSemitoneValue, 0, p.width);
        };

        // Draw frequency spectrum
        for (let i = 0; i < dataArray.length; i++) {
          const freq = (i * sampleRate) / analyser.fftSize;
          if (freq < minFreq || freq > maxFreq) continue;

          const energy = dataArray[i];

          // Find the closest note
          let closestNoteIndex = 0;
          let minDiff = Infinity;
          for (let j = 0; j < noteFrequencies.length; j++) {
            const diff = Math.abs(noteFrequencies[j] - freq);
            if (diff < minDiff) {
              minDiff = diff;
              closestNoteIndex = j;
            }
          }

          const hue = noteHues[closestNoteIndex % 12];
          const lightness = p.map(Math.pow(energy, brightnessRef.current), 0, Math.pow(255, brightnessRef.current), 0, 50);
          const alpha = p.map(Math.pow(energy, brightnessRef.current), 0, Math.pow(255, brightnessRef.current), 0, 255);

          p.stroke(p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`));
          p.strokeWeight(1);

          const x = logScale(freq);
          const normalizedEnergy = p.map(Math.pow(energy, lengthPowerRef.current), 0, Math.pow(255, lengthPowerRef.current), 0, middle);

          p.line(x, middle, x, middle - normalizedEnergy);
          p.line(x, middle, x, middle + normalizedEnergy);
        }

        // Draw note labels
        if (showLabelsRef.current) {
          for (let i = 0; i < noteFrequencies.length; i++) {
            const freq = noteFrequencies[i];
            if (freq < minFreq || freq > maxFreq) continue;

            const x = logScale(freq);
            const rowHeight = 20;
            const rowOffset = i % 12;
            const y = middle - rowHeight * (rowOffset + 1) + 6 * rowHeight;
            const octave = Math.floor(i / 12) - 1;
            const noteName = `${baseNotes[i % 12]}${octave}`;

            p.fill(255);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(noteName, x, y);
          }
        }

        // Draw scrolling cursor and frequency info
        if (showScrollRef.current) {
          if (p.mouseX >= 0 && p.mouseX <= p.width) {
            p.stroke(255, 255, 255);
            p.line(p.mouseX, 0, p.mouseX, p.height);

            const minSemitone = Math.log2(minFreq / f0) * 12;
            const maxSemitone = Math.log2(maxFreq / f0) * 12;
            const mouseSemitone = p.map(p.mouseX, 0, p.width, minSemitone, maxSemitone);
            const freq = f0 * Math.pow(2, mouseSemitone / 12);

            // Find the closest note
            let closestNoteIndex = 0;
            let minDiff = Infinity;
            for (let i = 0; i < noteFrequencies.length; i++) {
              const diff = Math.abs(noteFrequencies[i] - freq);
              if (diff < minDiff) {
                minDiff = diff;
                closestNoteIndex = i;
              }
            }
            const octave = Math.floor(closestNoteIndex / 12) - 1;
            const closestNote = `${baseNotes[closestNoteIndex % 12]}${octave}`;

            p.fill(255);
            p.noStroke();
            p.textAlign(p.LEFT, p.BOTTOM);

            p.text(`${freq.toFixed(2)} Hz`, p.mouseX + 10, p.mouseY - 20);
            p.text(`${closestNote}`, p.mouseX + 10, p.mouseY - 5);
            p.text(`${mouseSemitone.toFixed(0)}`, p.mouseX + 10, p.mouseY + 10);
          }
        }

        // Display slider labels
        p.noStroke();
        p.fill(255);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text(`Min Freq: ${minFreq.toFixed(2)} Hz (Semitone: ${minSemitoneRef.current} - ${getNoteName(minSemitoneRef.current)})`, 10, p.height - 60);
        p.text(`Max Freq: ${maxFreq.toFixed(2)} Hz (Semitone: ${maxSemitoneRef.current} - ${getNoteName(maxSemitoneRef.current)})`, p.width / 2 + 10, p.height - 60);
        p.text(`Brightness: ${brightnessRef.current.toFixed(2)}`, canvasWidth - 150, 1500);
        p.text(`Length Power: ${lengthPowerRef.current.toFixed(2)}`, canvasWidth - 150, 1530);
      };
    };

    p5InstanceRef.current = new window.p5(sketch);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [analyser, windowSize]);

  return (
    <div>
      {/* Sliders */}
      <div style={{ margin: '20px 40px' }}>
        <label htmlFor="minFreqSlider">
          Min Frequency Semitone: {minSemitone}
        </label>
        <input
          id="minFreqSlider"
          type="range"
          min="-36"
          max="140"
          step="0.5"
          value={minSemitone}
          onChange={(e) => setMinSemitone(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ margin: '20px 40px' }}>
        <label htmlFor="maxFreqSlider">
          Max Frequency Semitone: {maxSemitone}
        </label>
        <input
          id="maxFreqSlider"
          type="range"
          min="-36"
          max="140"
          step="0.5"
          value={maxSemitone}
          onChange={(e) => setMaxSemitone(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ margin: '20px 40px' }}>
        <label htmlFor="brightnessSlider">
          Brightness exponent: {brightness.toFixed(2)}
        </label>
        <input
          id="brightnessSlider"
          type="range"
          min="0.1"
          max="3"
          step="0.01"
          value={brightness}
          onChange={(e) => setBrightness(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ margin: '20px 40px' }}>
        <label htmlFor="lengthPowerSlider">
          Length exponent: {lengthPower.toFixed(2)}
        </label>
        <input
          id="lengthPowerSlider"
          type="range"
          min="0.1"
          max="10"
          step="0.01"
          value={lengthPower}
          onChange={(e) => setLengthPower(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      {/* Spectrograph Canvas */}
      <div className="spectrograph" ref={sketchRef}></div>
    </div>
  );
}