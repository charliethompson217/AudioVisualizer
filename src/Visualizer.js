import React, { useRef, useEffect } from 'react';
import { useAudioAnalysis } from './useAudioAnalysis.js';

/**
 * This component renders a real-time frequency spectrum visualization using the p5.js library.
 * It processes audio input (either from a file or microphone) and displays the frequency content 
 * along with labeled musical notes. The visualization supports a logarithmic frequency scale for better
 * musical note correspondence.
 */
export default function Visualizer({ 
    showLabels,
    showScroll,
    brightnessPower = 1,
    audioAnalysis,
}) {
    const sketchRef = useRef();  // Ref to attach the p5.js canvas
    const { analyser, dataArray, sampleRate } = audioAnalysis;

    useEffect(() => {
        if (!analyser || !dataArray) return;

        const sketch = (p) => {
            let canvas;
            let brightnessSlider, minFreqSlider, maxFreqSlider;
            let brightness = brightnessPower;
            let minFreq, maxFreq;
            const maxSemitone = 123; // Approximately covers up to 20 kHz from C0
            const f0 = 16.35; // Frequency of C0 in Hz

            p.setup = () => {
                let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                const canvasWidth = 0.99 * vw;
                const canvasHeight = 0.95 * vh;

                p.pixelDensity(3);
                canvas = p.createCanvas(canvasWidth, canvasHeight);
                canvas.parent(sketchRef.current);

                // Create the brightness slider
                brightnessSlider = p.createSlider(0.1, 3, brightnessPower, 0.01);
                brightnessSlider.position(canvasWidth - 150, 10);
                brightnessSlider.style('width', '140px');
                brightnessSlider.input(() => {
                    brightness = brightnessSlider.value();
                });

                // Create the minimum frequency slider (in semitones)
                minFreqSlider = p.createSlider(0, maxSemitone, 0, 1);
                minFreqSlider.position(10, canvasHeight - 40);
                minFreqSlider.style('width', `${canvasWidth / 2 - 20}px`);
                minFreqSlider.input(() => {
                    minFreq = f0 * Math.pow(2, minFreqSlider.value() / 12);
                    if (minFreq >= maxFreq) {
                        minFreq = maxFreq - 1;
                        minFreqSlider.value(Math.round(12 * Math.log2(minFreq / f0)));
                    }
                });

                // Create the maximum frequency slider (in semitones)
                maxFreqSlider = p.createSlider(0, maxSemitone, maxSemitone, 1);
                maxFreqSlider.position(canvasWidth / 2 + 10, canvasHeight - 40);
                maxFreqSlider.style('width', `${canvasWidth / 2 - 20}px`);
                maxFreqSlider.input(() => {
                    maxFreq = f0 * Math.pow(2, maxFreqSlider.value() / 12);
                    if (maxFreq <= minFreq) {
                        maxFreq = minFreq + 1;
                        maxFreqSlider.value(Math.round(12 * Math.log2(maxFreq / f0)));
                    }
                });

                // Initialize minFreq and maxFreq
                minFreq = f0 * Math.pow(2, minFreqSlider.value() / 12);
                maxFreq = f0 * Math.pow(2, maxFreqSlider.value() / 12);
            };

            p.draw = () => {
                p.background(0);

                analyser.getByteFrequencyData(dataArray);
                const middle = p.height / 2;

                const noteFrequencies = [];
                const baseNotes = ["C", "C#", "D",  "D#",  "E",  "F",  "F#",  "G",  "G#",  "A", "A#", "B"];
                const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];

                // Generate note frequencies up to maxSemitone
                for (let n = 0; n <= maxSemitone; n++) {
                    const freq = f0 * Math.pow(2, n / 12);
                    noteFrequencies.push(freq);
                }

                const logScale = (freq) => {
                    const minSemitone = Math.log2(minFreq / f0) * 12;
                    const maxSemitone = Math.log2(maxFreq / f0) * 12;
                    const freqSemitone = Math.log2(freq / f0) * 12;
                    return p.map(freqSemitone, minSemitone, maxSemitone, 0, p.width);
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
                    const lightness = p.map(Math.pow(energy, brightness), 0, Math.pow(255, brightness), 0, 50);
                    const alpha = p.map(Math.pow(energy, brightness), 0, Math.pow(255, brightness), 0, 255);

                    p.stroke(p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`));
                    p.strokeWeight(1);

                    const x = logScale(freq);
                    const normalizedEnergy = p.map(energy, 0, 255, 0, middle);

                    p.line(x, middle, x, middle - normalizedEnergy);
                    p.line(x, middle, x, middle + normalizedEnergy);
                }

                // Draw note labels
                if (showLabels) {
                    for (let i = 0; i < noteFrequencies.length; i++) {
                        const freq = noteFrequencies[i];
                        if (freq < minFreq || freq > maxFreq) continue;

                        const x = logScale(freq);
                        const rowHeight = 20;
                        const rowOffset = i % 12;
                        const y = middle - rowHeight * (rowOffset + 1) + 6 * rowHeight;
                        const octave = Math.floor(i / 12);
                        const noteName = `${baseNotes[i % 12]}${octave}`;

                        p.fill(255);
                        p.textAlign(p.CENTER, p.BOTTOM);
                        p.text(noteName, x, y);
                    }
                }

                // Draw scrolling cursor and frequency info
                if (showScroll) {
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
                        const closestNote = `${baseNotes[closestNoteIndex % 12]}${Math.floor(closestNoteIndex / 12)}`;

                        p.fill(255);
                        p.noStroke();
                        p.textAlign(p.LEFT, p.BOTTOM);
                        p.text(`${freq.toFixed(2)} Hz`, p.mouseX + 10, p.mouseY - 20);
                        p.text(`${closestNote}`, p.mouseX + 10, p.mouseY - 5);
                    }
                }

                // Display slider labels
                p.noStroke();
                p.fill(255);
                p.textAlign(p.LEFT, p.BOTTOM);
                p.text(`Min Freq: ${minFreq.toFixed(2)} Hz (Semitone: ${minFreqSlider.value()})`, minFreqSlider.x * 1.5, minFreqSlider.y - 10);
                p.text(`Max Freq: ${maxFreq.toFixed(2)} Hz (Semitone: ${maxFreqSlider.value()})`, maxFreqSlider.x * 1.1, maxFreqSlider.y - 10);
                p.text(`Brightness`, brightnessSlider.x, brightnessSlider.y - 10);
            };
        };

        new window.p5(sketch);

        return () => {
            if (analyser) analyser.disconnect();
        };
    }, [analyser, dataArray]);

    return <div ref={sketchRef}></div>;
}