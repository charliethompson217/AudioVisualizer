import React, { useRef, useEffect } from 'react';
import { useAudioAnalysis } from './useAudioAnalysis.js';

/**
 * This component renders a real-time frequency spectrum visualization using the p5.js library.
 * It processes audio input (either from a file or microphone) and displays the frequency content 
 * along with labeled musical notes. The visualization supports a logarithmic frequency scale for better
 * musical note correspondence.
 */
export default function Visualizer({ 
    mp3File,       // URL of the MP3 file to visualize
    midiFile,
    useMic,        // Boolean: If true, use microphone input
    bins,          // FFT bin size (number of frequency bands to analyze)
    smoothing,     // Smoothing factor (0-1), controls how much FFT data is smoothed over time
    isPlaying,     // Boolean: If true, the component is actively visualizing audio
    showLabels,    // Boolean: If true, display note labels on the frequency graph
    showScroll,    // Boolean: If true, show a cursor that scrolls along the frequency range
    minDecibels,   // Minimum decibel value for the analyser node
    maxDecibels,   // Maximum decibel value for the analyser node
    pianoEnabled,   // Boolean: If true, enable piano keyboard control
    harmonicAmplitudes,
    ATTACK_TIME = 0.01,
    DECAY_TIME = 0.3,
    SUSTAIN_LEVEL = 0.2,
    RELEASE_TIME = 0.5,
    brightnessPower = 1,
}) {
    const sketchRef = useRef();  // Ref to attach the p5.js canvas
    const { analyser, dataArray, sampleRate } = useAudioAnalysis(
        mp3File, midiFile, useMic, bins, smoothing, isPlaying, minDecibels, maxDecibels, pianoEnabled, harmonicAmplitudes, ATTACK_TIME, DECAY_TIME, SUSTAIN_LEVEL, RELEASE_TIME
    );

    useEffect(() => {
        if (!analyser || !dataArray) return;

        const sketch = (p) => {
            let canvas;
            let slider;  // Variable to store the slider reference
            let brightness = brightnessPower;

            p.setup = () => {
                let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                const canvasWidth = 0.99 * vw;
                const canvasHeight = 0.95 * vh;

                p.pixelDensity(3);
                canvas = p.createCanvas(canvasWidth, canvasHeight);
                canvas.parent(sketchRef.current);

                // Create the slider for brightness power in the top right corner
                slider = p.createSlider(0, 2, brightnessPower, 0.01);  // Slider range 1 to 2 with 0.01 steps
                slider.position(canvasWidth - 150, 10);  // Place slider in the top-right corner
                slider.style('width', '140px');
                slider.input(() => {
                    brightness = slider.value();  // Update brightness power when slider changes
                });
            };

            p.draw = () => {
                p.background(0);

                analyser.getByteFrequencyData(dataArray);
                const middle = p.height / 2;

                const noteFrequencies = [
                    16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87, 
                    32.70, 34.65, 36.71, 38.89, 41.20, 43.65, 46.25, 49.00, 51.91, 55.00, 58.27, 61.74, 
                    65.41, 69.30, 73.42, 77.78, 82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47, 
                    130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 
                    261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 
                    523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880.00, 932.33, 987.77, 
                    1046.50, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760.00, 1864.66, 1975.53, 
                    2093.00, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520.00, 3729.31, 3951.07, 
                    4186.01 // C8
                ];

                const baseNotes = ["C", "C#", "D",  "D#",  "E",  "F",  "F#",  "G",  "G#",  "A", "A#", "B"];
                const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];

                const minFreq = noteFrequencies[0] * 0.97;
                const maxFreq = noteFrequencies[noteFrequencies.length - 1] * 1.03;

                const logScale = (freq) => {
                    const minLog = Math.log10(minFreq);
                    const maxLog = Math.log10(maxFreq);
                    const valueLog = Math.log10(freq);
                    return p.map(valueLog, minLog, maxLog, 0, p.width);
                };

                for (let i = 0; i < dataArray.length; i++) {
                    const freq = (i * sampleRate) / analyser.fftSize;
                    if (freq > maxFreq) break;

                    const energy = dataArray[i];

                    let closestNoteIndex = 0;
                    for (let j = 0; j < noteFrequencies.length; j++) {
                        if (Math.abs(noteFrequencies[j] - freq) < Math.abs(noteFrequencies[closestNoteIndex] - freq)) {
                            closestNoteIndex = j;
                        }
                    }

                    const hue = noteHues[closestNoteIndex % 12];
                    const lightness = p.map(energy ** brightness, 0, 255 ** brightness, 0, 50);
                    const alpha = p.map(energy ** brightness, 0, 255 ** brightness, 0, 255);

                    p.stroke(p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`));
                    p.strokeWeight(1);

                    const x = logScale(freq);
                    const normalizedEnergy = p.map(energy, 0, 255, 0, middle);

                    p.line(x, middle, x, middle - normalizedEnergy);
                    p.line(x, middle, x, middle + normalizedEnergy);
                }

                if (showLabels) {
                    for (let i = 0; i < noteFrequencies.length; i++) {
                        const x = logScale(noteFrequencies[i]);
                        const rowHeight = 20;
                        const rowOffset = i % 12;
                        const y = middle - rowHeight * (rowOffset + 1) + 6 * rowHeight;
                        const noteName = `${baseNotes[i % 12]}${Math.floor(i / 12)}`;

                        p.fill(255);
                        p.textAlign(p.CENTER, p.BOTTOM);
                        p.text(noteName, x, y);
                    }
                }

                if (showScroll) {
                    if (p.mouseX >= 0 && p.mouseX <= p.width) {
                        p.stroke(255, 255, 255);
                        p.line(p.mouseX, 0, p.mouseX, p.height);

                        const freq = Math.pow(10, p.map(p.mouseX, 0, p.width, Math.log10(minFreq), Math.log10(maxFreq)));

                        let closestNoteIndex = 0;
                        for (let i = 0; i < noteFrequencies.length; i++) {
                            if (Math.abs(noteFrequencies[i] - freq) < Math.abs(noteFrequencies[closestNoteIndex] - freq)) {
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
            };
        };

        new window.p5(sketch);

        return () => {
            if (analyser) analyser.disconnect();
        };
    }, [analyser, dataArray]);

    return <div ref={sketchRef}></div>;
}