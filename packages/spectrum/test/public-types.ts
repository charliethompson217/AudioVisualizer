import { createElement } from 'react';
import { SpectrumVisualizer, type SpectrumVisualizerProps } from '@audiovisualizer/spectrum/react';

const props: SpectrumVisualizerProps = {
  analyser: null,
  maxHeight: 320,
  maxWidth: '60rem',
  showNoteLabels: true,
  showFrequencyLabels: false,
  noteHues: [0, 25, 45, 75, 110, 166, 190, 210, 240, 270, 300, 330] as const,
};
createElement(SpectrumVisualizer, props);
// @ts-expect-error The visualizer requires an AnalyserNode, not an AudioContext.
const invalidAnalyser: SpectrumVisualizerProps = { analyser: {} as AudioContext };
// @ts-expect-error Dimensions belong to the container, not a height prop.
const invalidHeight: SpectrumVisualizerProps = { height: 320 };
void invalidAnalyser;
void invalidHeight;

import {
  createSpectrumVisualizer,
  type SpectrumVisualizerOptions,
  type SpectrumVisualizerInstance,
} from '@audiovisualizer/spectrum';
function coreTypes(container: HTMLElement, analyser: AnalyserNode) {
  const options: SpectrumVisualizerOptions = {
    analyser,
    maxWidth: '60rem',
    maxHeight: null,
    ariaLabel: 'Core spectrum',
  };
  const instance: SpectrumVisualizerInstance = createSpectrumVisualizer(container, options);
  instance.update({ brightnessPower: 2, maxWidth: undefined });
  instance.element.style.borderRadius = '8px';
  // @ts-expect-error The core accepts a DOM container, not a CSS selector string.
  createSpectrumVisualizer('#chart');
  // @ts-expect-error React styling props do not belong in core options.
  instance.update({ className: 'chart' });
  instance.destroy();
}
void coreTypes;
