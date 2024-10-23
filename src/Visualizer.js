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
    // constants for the note generator
    harmonicAmplitudes,
    // Constants for the ADSR (Attack, Decay, Sustain, Release) envelope applied to each note
    ATTACK_TIME = 0.01,   // Time taken to reach the peak amplitude after a note is pressed
    DECAY_TIME = 0.3,     // Time taken to fall from the peak amplitude to the sustain level
    SUSTAIN_LEVEL = 0.2,  // Level at which the note will be sustained as long as the key is held
    RELEASE_TIME = 0.5,   // Time taken to drop to zero after the key is released
}) {
    const sketchRef = useRef();  // Ref to attach the p5.js canvas
    const { analyser, dataArray, sampleRate } = useAudioAnalysis(
        mp3File, midiFile, useMic, bins, smoothing, isPlaying, minDecibels, maxDecibels, pianoEnabled, harmonicAmplitudes, ATTACK_TIME, DECAY_TIME, SUSTAIN_LEVEL, RELEASE_TIME
    );

    useEffect(() => {
        if (!analyser || !dataArray) return;  // Wait for analyser and frequency data to be ready

        // The sketch function defines the p5.js sketch (draws visuals on the canvas)
        const sketch = (p) => {
            let canvas;  // Stores the p5.js canvas reference
            let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const canvasWidth = 0.99 * vw;  // Set canvas width as 99% of viewport width
            const canvasHeight = 0.95 * vh;  // Set canvas height as 95% of viewport height

            // p5.js setup function: initializes the canvas
            p.setup = () => {
                canvas = p.createCanvas(canvasWidth, canvasHeight);  // Create a p5.js canvas
                canvas.parent(sketchRef.current);  // Attach the canvas to the provided DOM element
            };

            // p5.js draw function: called repeatedly to render the visualization
            p.draw = () => {
                p.background(0);  // Set the background color to black

                // Get frequency data from the analyser and fill dataArray with FFT data
                analyser.getByteFrequencyData(dataArray);
                
                const middle = p.height / 2;  // Midpoint of the canvas height (used for drawing lines)
                
                // Predefined note frequencies (C0 to C8, musical scale)
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

                // Corresponding hues (color) for each note in the musical scale (C, C#, D, D#, etc.)
                const baseNotes = ["C", "C#", "D",  "D#",  "E",  "F",  "F#",  "G",  "G#",  "A", "A#", "B"];
                const noteHues = [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330];  // HSL color values

                // Define frequency range for visualization with slight margin (±3%)
                const minFreq = noteFrequencies[0] * 0.97;
                const maxFreq = noteFrequencies[noteFrequencies.length - 1] * 1.03;

                // Logarithmic scale function: maps a frequency to an x-coordinate on the canvas
                const logScale = (freq) => {
                    const minLog = Math.log10(minFreq);
                    const maxLog = Math.log10(maxFreq);
                    const valueLog = Math.log10(freq);  // Calculate log10 of the frequency
                    return p.map(valueLog, minLog, maxLog, 0, p.width);  // Map log value to canvas width
                };

                // Iterate through the frequency data and draw the corresponding visualizations
                for (let i = 0; i < dataArray.length; i++) {
                    const freq = (i * sampleRate) / analyser.fftSize;  // Calculate frequency for each FFT bin
                    if (freq > maxFreq) break;  // Stop if the frequency exceeds the visualized range

                    const energy = dataArray[i];  // Get the energy (amplitude) for this frequency bin

                    // Find the closest musical note frequency to the current frequency
                    let closestNoteIndex = 0;
                    for (let j = 0; j < noteFrequencies.length; j++) {
                        if (Math.abs(noteFrequencies[j] - freq) < Math.abs(noteFrequencies[closestNoteIndex] - freq)) {
                            closestNoteIndex = j;  // Update the closest note index
                        }
                    }

                    const hue = noteHues[closestNoteIndex % 12];  // Determine the color (hue) based on note

                    // Calculate brightness based on squared energy (stronger energy = brighter color)
                    const lightness = p.map(energy * energy, 0, 255 * 255, 0, 50);
                    const alpha = p.map(energy * energy, 0, 255 * 255, 0, 255);  // Alpha transparency based on energy
                    
                    // Set stroke color (HSLA: Hue, Saturation, Lightness, Alpha)
                    p.stroke(p.color(`hsla(${hue}, 100%, ${lightness}%, ${alpha / 255})`));
                    p.strokeWeight(1);  // Set the line weight (thickness)

                    // Map frequency to an x-coordinate using a logarithmic scale for even spacing of notes
                    const x = logScale(freq);

                    // Map energy to the length of the line (drawn from the center of the canvas)
                    const normalizedEnergy = p.map(energy, 0, 255, 0, middle);

                    // Draw lines extending from the middle of the canvas, representing the frequency amplitude
                    p.line(x, middle, x, middle - normalizedEnergy);  // Line extending upwards
                    p.line(x, middle, x, middle + normalizedEnergy);  // Line extending downwards
                }

                // Optionally show labels for musical notes on the x-axis
                if (showLabels) {
                    for (let i = 0; i < noteFrequencies.length; i++) {
                        const x = logScale(noteFrequencies[i]);  // Map note frequency to x-coordinate
                        const rowHeight = 20;  // Set height for each row of note labels
                        const rowOffset = i % 12;  // Calculate offset based on note (C, C#, D, etc.)
                        const y = middle - rowHeight * (rowOffset + 1) + 6 * rowHeight;  // Position labels vertically
                        const noteName = `${baseNotes[i % 12]}${Math.floor(i / 12)}`;  // Generate note name (e.g., C4)

                        p.fill(255);  // Set text color to white
                        p.textAlign(p.CENTER, p.BOTTOM);  // Align text to the center
                        p.text(noteName, x, y);  // Draw the note label
                    }
                }

                // If the user enables scrolling, draw a cursor along the frequency spectrum
                if (showScroll) {
                    if (p.mouseX >= 0 && p.mouseX <= p.width) {
                        p.stroke(255, 255, 255);  // Set cursor color to white
                        p.line(p.mouseX, 0, p.mouseX, p.height);  // Draw a vertical line at the mouse position

                        // Convert the x-coordinate to a frequency using the inverse of the logarithmic scale
                        const freq = Math.pow(10, p.map(p.mouseX, 0, p.width, Math.log10(minFreq), Math.log10(maxFreq)));

                        // Find the closest musical note to the current frequency
                        let closestNoteIndex = 0;
                        for (let i = 0; i < noteFrequencies.length; i++) {
                            if (Math.abs(noteFrequencies[i] - freq) < Math.abs(noteFrequencies[closestNoteIndex] - freq)) {
                                closestNoteIndex = i;
                            }
                        }
                        const closestNote = `${baseNotes[closestNoteIndex % 12]}${Math.floor(closestNoteIndex / 12)}`;

                        // Display the frequency and note information near the cursor
                        p.fill(255);  // Set text color to white
                        p.noStroke();  // Disable stroke for the text
                        p.textAlign(p.LEFT, p.BOTTOM);  // Align text to the left
                        p.text(`${freq.toFixed(2)} Hz`, p.mouseX + 10, p.mouseY - 20);  // Display frequency
                        p.text(`${closestNote}`, p.mouseX + 10, p.mouseY - 5);  // Display the closest note
                    }
                }
            };
        };

        // Initialize the p5.js sketch
        new window.p5(sketch);

        // Clean-up function to disconnect the analyser when the component is unmounted
        return () => {
            if (analyser) analyser.disconnect();
        };
    }, [analyser, dataArray]);  // Effect runs when analyser or dataArray changes

    return <div ref={sketchRef}></div>;  // Render the canvas container
}
