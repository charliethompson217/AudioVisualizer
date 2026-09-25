// Copyright (C) 2024 Charles Thompson. SPDX-License-Identifier: MIT
export const DEFAULT_NOTE_HUES: readonly number[] = Object.freeze([
  0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330,
]);

export interface SpectrumVisualizerOptions {
  /** Caller-owned analyser. Null shows the background and enabled labels. Default: null. */
  analyser?: AnalyserNode | null;
  /** Low end of the logarithmic axis, in MIDI semitones (12 = C0). Default: 12. */
  minSemitone?: number;
  /** High end of the axis; must exceed minSemitone. Default: 108 (C8). */
  maxSemitone?: number;
  /** Positive exponent applied to normalized energy for brightness. Default: 1. */
  brightnessPower?: number;
  /** Positive exponent applied to normalized energy for bar length. Default: 1. */
  lengthPower?: number;
  /** Twelve finite hue angles in degrees, ordered C through B. */
  noteHues?: readonly number[];
  /** Show musical note labels. Default: false. */
  showNoteLabels?: boolean;
  /** Show frequency limits in the bottom corners. Default: false. */
  showFrequencyLabels?: boolean;
  /** Show the pointer's frequency and note readout. Default: false. */
  showScroll?: boolean;
  /** Stop continuous animation; mount, resize, and updates still draw. Default: false. */
  paused?: boolean;
  /** Optional CSS maximum width. Numbers are pixels; null/undefined removes the limit. */
  maxWidth?: number | string | null;
  /** Optional CSS maximum height. The parent must provide a height. */
  maxHeight?: number | string | null;
  /** Accessible canvas description. Default: 'Audio frequency spectrum'. */
  ariaLabel?: string;
}

export type ResolvedOptions = Required<SpectrumVisualizerOptions>;

export function resolveOptions({
  analyser = null,
  minSemitone = 12,
  maxSemitone = 108,
  brightnessPower = 1,
  lengthPower = 1,
  noteHues = DEFAULT_NOTE_HUES,
  showNoteLabels = false,
  showFrequencyLabels = false,
  showScroll = false,
  paused = false,
  maxWidth = null,
  maxHeight = null,
  ariaLabel = 'Audio frequency spectrum',
}: SpectrumVisualizerOptions): ResolvedOptions {
  if (!Number.isFinite(minSemitone) || !Number.isFinite(maxSemitone) || minSemitone >= maxSemitone) {
    throw new RangeError('minSemitone must be less than maxSemitone, and both must be finite.');
  }
  if (![brightnessPower, lengthPower].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError('brightnessPower and lengthPower must be positive finite numbers.');
  }
  if (!Array.isArray(noteHues) || noteHues.length !== 12 || !noteHues.every(Number.isFinite)) {
    throw new RangeError('noteHues must contain twelve finite hue values, ordered C through B.');
  }
  for (const size of [maxWidth, maxHeight]) {
    if (
      size !== null &&
      typeof size !== 'string' &&
      !(typeof size === 'number' && Number.isFinite(size) && size >= 0)
    ) {
      throw new RangeError('Maximum dimensions must be CSS strings, non-negative finite numbers, or null.');
    }
  }
  return {
    analyser,
    minSemitone,
    maxSemitone,
    brightnessPower,
    lengthPower,
    noteHues: [...noteHues],
    showNoteLabels,
    showFrequencyLabels,
    showScroll,
    paused,
    maxWidth,
    maxHeight,
    ariaLabel,
  };
}

export const FILL_CONTAINER_STYLE = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
} as const;

export function cssSize(size: number | string | null): string {
  return typeof size === 'number' ? `${size}px` : (size ?? '');
}
