import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { SpectrumVisualizer } from '@audiovisualizer/spectrum/react';
import { startSpectrumRenderer, DEFAULT_NOTE_HUES, type SpectrumRendererSettings } from '../src/renderer.js';

const defaults = {
  minSemitone: 12,
  maxSemitone: 108,
  brightnessPower: 1,
  lengthPower: 1,
  noteHues: DEFAULT_NOTE_HUES,
  showNoteLabels: false,
  showFrequencyLabels: false,
  showScroll: false,
};

function fixture(t: TestContext) {
  const paths: { path: [number, number][]; color: string }[] = [];
  const labels: string[] = [];
  const labelCalls: { text: string; x: number; y: number; align: string; maxWidth?: number }[] = [];
  let path: [number, number][] = [];
  const context = {
    strokeStyle: '',
    textAlign: '',
    fillRect() {},
    setTransform() {},
    beginPath() {
      path = [];
    },
    moveTo(x: number, y: number) {
      path.push([x, y]);
    },
    lineTo(x: number, y: number) {
      path.push([x, y]);
    },
    stroke() {
      paths.push({ path, color: this.strokeStyle });
    },
    fillText(text: string, x: number, y: number, maxWidth?: number) {
      labels.push(text);
      labelCalls.push({ text, x, y, align: this.textAlign, maxWidth });
    },
  };
  const listeners = new Map();
  const windowListeners = new Map();
  const frames = new Map();
  let frameId = 0;
  let resizeCallback: () => void;
  let disconnected = false;
  const rect = { width: 600, height: 300, left: 10, top: 20 };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () => rect,
    addEventListener: (name: string, fn: (event: PointerEvent) => void) => listeners.set(name, fn),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  const previous = new Map();
  for (const [name, value] of Object.entries({
    window: {
      devicePixelRatio: 2,
      addEventListener: (name: string, fn: (event: PointerEvent) => void) => windowListeners.set(name, fn),
      removeEventListener: (name: string) => windowListeners.delete(name),
    },
    ResizeObserver: class {
      constructor(fn: () => void) {
        resizeCallback = fn;
      }
      observe() {}
      disconnect() {
        disconnected = true;
      }
    },
    requestAnimationFrame: (fn: () => void) => {
      frames.set(++frameId, fn);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  return {
    canvas,
    rect,
    paths,
    labels,
    labelCalls,
    listeners,
    windowListeners,
    frames,
    resize: () => resizeCallback(),
    disconnected: () => disconnected,
    tick: () => {
      const next = frames.entries().next();
      assert.equal(next.done, false, 'An animation frame should be scheduled');
      const [id, fn] = next.value!;
      frames.delete(id);
      fn();
    },
  };
}

function analyser() {
  return Object.seal({
    context: Object.freeze({ sampleRate: 48000 }),
    fftSize: 4096,
    frequencyBinCount: 2048,
    getByteFrequencyData(data: Uint8Array) {
      data.fill(0);
      data[38] = 255;
    },
  });
}

test('built ESM imports and server-renders without browser globals', () => {
  const html = renderToString(createElement(SpectrumVisualizer, { maxHeight: 240, maxWidth: '50rem' }));
  assert.match(html, /<div/);
  assert.match(html, /max-height:240px/);
  assert.doesNotMatch(html, /<canvas/); // DOM creation happens after mount.
  assert.match(html, /width:100%;height:100%/);
  assert.match(html, /max-width:50rem/);
  assert.throws(
    () => renderToString(createElement(SpectrumVisualizer, { minSemitone: 80, maxSemitone: 20 })),
    RangeError
  );
});

test('maps FFT data to note-colored bars, reacts to settings/FFT changes, and releases resources', (t) => {
  const f = fixture(t);
  const node = analyser();
  let settings: SpectrumRendererSettings = { ...defaults };
  const { dispose: stop } = startSpectrumRenderer(
    f.canvas as unknown as HTMLCanvasElement,
    node as unknown as AnalyserNode | null,
    () => settings,
    false
  );
  assert.equal(f.canvas.width, 1200);
  assert.equal(f.canvas.height, 600);
  const bar = f.paths[0];
  const expectedX = ((12 * Math.log2((38 * 48000) / 4096 / 8.1758) - 12) / 96) * 600;
  assert.ok(Math.abs(bar.path[0][0] - expectedX) < 0.001);
  assert.deepEqual(
    bar.path.map((point) => point[1]),
    [0, 300]
  );
  assert.equal(bar.color, 'hsla(270, 100%, 50%, 1)'); // A4
  settings = { ...settings, noteHues: Array(12).fill(123), showScroll: true };
  f.listeners.get('pointermove')({ clientX: 310, clientY: 170 });
  f.tick();
  assert.ok(f.paths.some((entry) => entry.color.startsWith('hsla(123,')));
  assert.ok(f.labels.some((text) => text.endsWith('Hz')));
  node.fftSize = 8192;
  node.frequencyBinCount = 4096;
  node.getByteFrequencyData = (data) => {
    assert.equal(data.length, 4096);
    data.fill(0);
  };
  f.tick();
  f.rect.width = 240;
  f.rect.height = 180;
  f.resize();
  assert.equal(f.canvas.width, 480);
  assert.equal(f.canvas.height, 360);
  stop();
  assert.equal(f.frames.size, 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.windowListeners.size, 0);
  assert.ok(f.disconnected());
  // This analyser has no connect/disconnect or context lifecycle methods;
  // any attempt to take ownership would have failed above.
});

test('null analyser and paused view do not schedule continuous animation; remount is clean', (t) => {
  const f = fixture(t);
  for (const node of [null, analyser(), analyser()]) {
    const { dispose: stop } = startSpectrumRenderer(
      f.canvas as unknown as HTMLCanvasElement,
      node as unknown as AnalyserNode | null,
      () => defaults,
      true
    );
    assert.equal(f.frames.size, 0);
    assert.equal(f.listeners.size, 2);
    stop();
    assert.equal(f.listeners.size, 0);
  }
});

test('note and corner frequency labels toggle independently, including while paused without audio', (t) => {
  const f = fixture(t);
  let settings = { ...defaults, showFrequencyLabels: true };
  const renderer = startSpectrumRenderer(f.canvas as unknown as HTMLCanvasElement, null, () => settings, true);
  assert.deepEqual(f.labels, ['Min: 16.35 Hz', 'Max: 4186.01 Hz']);
  assert.equal(f.labelCalls[0].align, 'left');
  assert.equal(f.labelCalls[0].x, 10);
  assert.equal(f.labelCalls[1].align, 'right');
  assert.equal(f.labelCalls[1].x, 590);
  assert.equal(f.labelCalls[1].y, 290);
  f.rect.width = 240;
  f.rect.height = 120;
  f.resize();
  assert.equal(f.labelCalls.at(-1)?.x, 230);
  assert.equal(f.labelCalls.at(-1)?.y, 110);
  assert.equal(f.labelCalls.at(-1)?.maxWidth, 100);
  f.labels.length = 0;
  settings = { ...settings, showFrequencyLabels: false, showNoteLabels: true };
  renderer.redraw();
  assert.ok(f.labels.includes('A4'));
  assert.ok(!f.labels.some((label) => label.startsWith('Min:') || label.startsWith('Max:')));
  f.labels.length = 0;
  settings = { ...settings, showNoteLabels: false };
  renderer.redraw();
  assert.equal(f.labels.length, 0);
  assert.equal(f.frames.size, 0);
  renderer.dispose();
});
