// Copyright (C) 2024 Charles Thompson. SPDX-License-Identifier: MIT
export { DEFAULT_NOTE_HUES } from './options.js';
const BASE_FREQUENCY = 8.1758;
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const mod = (n: number, m: number) => ((n % m) + m) % m;
const frequencyAt = (semitone: number) => BASE_FREQUENCY * 2 ** (semitone / 12);
const noteAt = (semitone: number) =>
  `${NOTES[mod(Math.round(semitone), 12)]}${Math.floor(Math.round(semitone) / 12) - 1}`;

export interface SpectrumRendererSettings {
  minSemitone: number;
  maxSemitone: number;
  brightnessPower: number;
  lengthPower: number;
  noteHues: readonly number[];
  showNoteLabels: boolean;
  showFrequencyLabels: boolean;
  showScroll: boolean;
}

// No audio graph mutations: the caller owns connections, FFT settings, and playback.
export function startSpectrumRenderer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode | null,
  getSettings: () => SpectrumRendererSettings,
  paused: boolean
): { redraw: () => void; dispose: () => void } {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('SpectrumVisualizer requires Canvas 2D support.');
  let width = 1;
  let height = 1;
  let data = new Uint8Array(0);
  let frame: number | undefined;
  let pointer: { x: number; y: number } | null = null;

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  };

  const draw = () => {
    const {
      minSemitone,
      maxSemitone,
      brightnessPower,
      lengthPower,
      noteHues,
      showNoteLabels,
      showFrequencyLabels,
      showScroll,
    } = getSettings();
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const middle = height / 2;
    const xAt = (semitone: number) => ((semitone - minSemitone) / (maxSemitone - minSemitone)) * width;
    const minFrequency = frequencyAt(minSemitone);
    const maxFrequency = frequencyAt(maxSemitone);
    context.lineWidth = 1;

    if (analyser) {
      if (data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      for (let i = 1; i < data.length; i++) {
        const frequency = (i * analyser.context.sampleRate) / analyser.fftSize;
        if (frequency < minFrequency || frequency > maxFrequency || data[i] === 0) continue;
        const semitone = 12 * Math.log2(frequency / BASE_FREQUENCY);
        const energy = data[i] / 255;
        const brightness = energy ** brightnessPower;
        const hue = noteHues[mod(Math.round(semitone), 12)];
        context.strokeStyle = `hsla(${hue}, 100%, ${brightness * 50}%, ${brightness})`;
        const length = energy ** lengthPower * middle;
        const x = xAt(semitone);
        line(x, middle - length, x, middle + length);
      }
    }

    context.fillStyle = '#fff';
    context.font = '12px sans-serif';
    context.textBaseline = 'bottom';
    if (showNoteLabels) {
      const rowHeight = Math.min(20, Math.max(1, (height - 56) / 12));
      context.textAlign = 'center';
      // Limit work to the audible/MIDI-adjacent range for extreme user-provided bounds.
      for (let s = Math.max(-128, Math.ceil(minSemitone)); s <= Math.min(256, Math.floor(maxSemitone)); s++) {
        context.fillText(noteAt(s), xAt(s), middle + rowHeight * (5.5 - mod(s, 12)));
      }
    }
    if (showFrequencyLabels && width >= 48 && height >= 28) {
      const maxTextWidth = Math.max(1, width / 2 - 20);
      context.textAlign = 'left';
      context.fillText(`Min: ${minFrequency.toFixed(2)} Hz`, 10, height - 10, maxTextWidth);
      context.textAlign = 'right';
      context.fillText(`Max: ${maxFrequency.toFixed(2)} Hz`, width - 10, height - 10, maxTextWidth);
    }

    if (showScroll && pointer) {
      const { x, y } = pointer;
      const semitone = minSemitone + (x / width) * (maxSemitone - minSemitone);
      context.strokeStyle = '#fff';
      line(x, 0, x, height);
      context.textAlign = x > width - 110 ? 'right' : 'left';
      const textX = x > width - 110 ? x - 10 : x + 10;
      const textY = Math.max(35, y);
      context.fillText(`${frequencyAt(semitone).toFixed(2)} Hz`, textX, textY - 20);
      context.fillText(noteAt(semitone), textX, textY - 5);
      context.fillText(semitone.toFixed(0), textX, textY + 10);
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const density = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    draw();
  };
  const move = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const leave = () => {
    pointer = null;
  };
  const tick = () => {
    draw();
    frame = requestAnimationFrame(tick);
  };

  const observer = new ResizeObserver(resize);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
  };
  try {
    observer.observe(canvas);
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    resize();
    if (analyser && !paused) frame = requestAnimationFrame(tick);
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    redraw: () => {
      if (!disposed) resize();
    },
    dispose,
  };
}
