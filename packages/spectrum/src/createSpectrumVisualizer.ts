// Copyright (C) 2024 Charles Thompson. SPDX-License-Identifier: MIT
import { startSpectrumRenderer } from './renderer.js';
import { cssSize, FILL_CONTAINER_STYLE, resolveOptions, type SpectrumVisualizerOptions } from './options.js';

export interface SpectrumVisualizerInstance {
  /** The visualizer's own wrapper. Use native DOM APIs to style it or assign a class. */
  readonly element: HTMLDivElement;
  /** Merge a partial update. An explicitly undefined value resets that option to its default. */
  update(options: SpectrumVisualizerOptions): void;
  /** Remove only this visualizer and release its animation/listeners/observer. Safe to call repeatedly. */
  destroy(): void;
}

/** Mount a visualizer into a sized HTML container. Call only after the container exists in a browser. */
export function createSpectrumVisualizer(
  container: HTMLElement,
  options: SpectrumVisualizerOptions = {}
): SpectrumVisualizerInstance {
  if (!container || typeof container.appendChild !== 'function' || !container.ownerDocument) {
    throw new TypeError('createSpectrumVisualizer requires an HTML container element.');
  }
  let settings = resolveOptions(options);
  const element = container.ownerDocument.createElement('div');
  const canvas = container.ownerDocument.createElement('canvas');
  Object.assign(element.style, FILL_CONTAINER_STYLE);
  Object.assign(canvas.style, { position: 'absolute', inset: '0', display: 'block', width: '100%', height: '100%' });
  canvas.setAttribute('role', 'img');
  element.appendChild(canvas);

  const applyOptions = () => {
    element.style.maxWidth = cssSize(settings.maxWidth);
    element.style.maxHeight = cssSize(settings.maxHeight);
    canvas.setAttribute('aria-label', settings.ariaLabel);
  };
  applyOptions();
  container.appendChild(element);
  let renderer: ReturnType<typeof startSpectrumRenderer>;
  try {
    renderer = startSpectrumRenderer(canvas, settings.analyser, () => settings, settings.paused);
  } catch (error) {
    element.remove();
    throw error;
  }
  let destroyed = false;

  return {
    element,
    update(patch) {
      if (destroyed)
        throw new Error('Cannot update a destroyed SpectrumVisualizer instance. Create a new one instead.');
      // Validate before changing settings or the DOM; invalid updates leave the working view intact.
      const next = resolveOptions({ ...settings, ...patch });
      const restart = next.analyser !== settings.analyser || next.paused !== settings.paused;
      settings = next;
      applyOptions();
      if (restart) {
        renderer.dispose();
        renderer = startSpectrumRenderer(canvas, settings.analyser, () => settings, settings.paused);
      } else {
        renderer.redraw();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderer.dispose();
      element.remove();
    },
  };
}
