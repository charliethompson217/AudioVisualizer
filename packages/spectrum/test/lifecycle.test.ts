import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSpectrumVisualizer } from '@audiovisualizer/spectrum';
import { SpectrumVisualizer } from '@audiovisualizer/spectrum/react';

function browser(t: TestContext) {
  const dom = new JSDOM('<div id="host" style="height:300px;color:red"><span>Keep me</span></div>');
  const { window } = dom;
  const frames = new Map<number, FrameRequestCallback>();
  const observers = new Set<MockResizeObserver>();
  const labels: string[] = [];
  let frameId = 0;
  let supported = true;
  const context = {
    fillRect() {},
    setTransform() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText(text: string) {
      labels.push(text);
    },
  };
  class MockResizeObserver {
    constructor(readonly callback: () => void) {}
    observe() {
      observers.add(this);
    }
    disconnect() {
      observers.delete(this);
    }
  }
  window.HTMLCanvasElement.prototype.getContext = (() =>
    supported ? context : null) as unknown as typeof window.HTMLCanvasElement.prototype.getContext;
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () =>
    ({ width: 600, height: 300, left: 0, top: 0 }) as DOMRect;
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries({
    window,
    document: window.document,
    ResizeObserver: MockResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => {
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  return {
    host: window.document.querySelector<HTMLDivElement>('#host')!,
    document: window.document,
    frames,
    observers,
    labels,
    unsupported: () => {
      supported = false;
    },
  };
}

function analyser() {
  let reads = 0;
  return {
    node: {
      context: Object.freeze({ sampleRate: 48000 }),
      fftSize: 4096,
      frequencyBinCount: 2048,
      getByteFrequencyData(data: Uint8Array) {
        reads++;
        data.fill(0);
        data[38] = 255;
      },
    } as unknown as AnalyserNode,
    reads: () => reads,
  };
}

test('core merges updates, resets explicit undefined, replaces analysers, and destroys only its own DOM', (t) => {
  const f = browser(t);
  const first = analyser();
  const second = analyser();
  const originalStyle = f.host.getAttribute('style');
  const view = createSpectrumVisualizer(f.host, {
    analyser: first.node,
    minSemitone: 60,
    maxSemitone: 72,
    showFrequencyLabels: true,
    maxWidth: 480,
    maxHeight: '20rem',
    ariaLabel: 'My spectrum',
  });
  const canvas = view.element.querySelector('canvas')!;
  assert.equal(f.host.children.length, 2);
  assert.equal(canvas.getAttribute('aria-label'), 'My spectrum');
  assert.equal(view.element.style.maxWidth, '480px');
  assert.equal(view.element.style.maxHeight, '20rem');
  assert.equal(f.frames.size, 1);
  assert.equal(f.observers.size, 1);
  f.labels.length = 0;
  view.update({ brightnessPower: 2 });
  assert.deepEqual(f.labels, ['Min: 261.63 Hz', 'Max: 523.25 Hz']);
  assert.throws(() => view.update({ minSemitone: 100, maxWidth: 120 }), RangeError);
  assert.equal(view.element.style.maxWidth, '480px');
  view.update({ analyser: second.node, maxWidth: null, maxHeight: undefined, ariaLabel: 'Updated' });
  assert.ok(second.reads() > 0);
  assert.equal(view.element.querySelector('canvas'), canvas);
  assert.equal(f.frames.size, 1);
  assert.equal(f.observers.size, 1);
  assert.equal(view.element.style.maxWidth, '');
  assert.equal(view.element.style.maxHeight, '');
  assert.equal(canvas.getAttribute('aria-label'), 'Updated');
  view.update({ paused: true });
  assert.equal(f.frames.size, 0);
  f.labels.length = 0;
  view.update({ minSemitone: undefined, maxSemitone: undefined });
  assert.deepEqual(f.labels, ['Min: 16.35 Hz', 'Max: 4186.01 Hz']);
  view.update({ paused: false, analyser: null });
  assert.equal(f.frames.size, 0);
  view.update({ analyser: first.node });
  assert.equal(f.frames.size, 1);
  view.destroy();
  view.destroy();
  assert.equal(f.frames.size, 0);
  assert.equal(f.observers.size, 0);
  assert.equal(f.host.innerHTML, '<span>Keep me</span>');
  assert.equal(f.host.getAttribute('style'), originalStyle);
  assert.throws(() => view.update({ paused: true }), /destroyed/);
});

test('multiple core views can share an analyser and dispose independently', (t) => {
  const f = browser(t);
  const node = analyser().node;
  const one = createSpectrumVisualizer(f.host, { analyser: node });
  const two = createSpectrumVisualizer(f.host, { analyser: node });
  assert.equal(f.frames.size, 2);
  assert.equal(f.observers.size, 2);
  one.destroy();
  assert.equal(f.frames.size, 1);
  assert.equal(f.observers.size, 1);
  assert.ok(two.element.isConnected);
  two.update({ showNoteLabels: true });
  two.destroy();
  assert.equal(f.frames.size, 0);
});

test('failed mounting leaves the caller DOM and renderer resources intact', (t) => {
  const f = browser(t);
  assert.throws(() => createSpectrumVisualizer(f.host, { lengthPower: 0 }), RangeError);
  const broken = analyser().node;
  broken.getByteFrequencyData = () => {
    throw new Error('Failed read');
  };
  assert.throws(() => createSpectrumVisualizer(f.host, { analyser: broken }), /Failed read/);
  assert.equal(f.observers.size, 0);
  assert.equal(f.frames.size, 0);
  f.unsupported();
  assert.throws(() => createSpectrumVisualizer(f.host), /Canvas 2D/);
  assert.equal(f.host.innerHTML, '<span>Keep me</span>');
});

test('React StrictMode owns one core instance, updates props, resets removed props, and cleans up', async (t) => {
  const f = browser(t);
  const first = analyser().node;
  const second = analyser().node;
  const root = createRoot(f.host);
  await act(async () => {
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(SpectrumVisualizer, {
          analyser: first,
          showNoteLabels: true,
          maxWidth: 400,
          className: 'first',
          'aria-label': 'React spectrum',
        })
      )
    );
  });
  assert.equal(f.host.querySelectorAll('canvas').length, 1);
  assert.equal(f.observers.size, 1);
  assert.equal(f.frames.size, 1);
  const canvas = f.host.querySelector('canvas');
  assert.equal(canvas?.getAttribute('aria-label'), 'React spectrum');
  assert.equal((f.host.firstElementChild as HTMLElement).style.maxWidth, '400px');
  f.labels.length = 0;
  await act(async () => {
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(SpectrumVisualizer, {
          analyser: second,
          paused: true,
          className: 'second',
        })
      )
    );
  });
  assert.equal(f.host.querySelector('canvas'), canvas);
  assert.equal(f.host.firstElementChild?.className, 'second');
  assert.equal((f.host.firstElementChild as HTMLElement).style.maxWidth, '');
  assert.equal(canvas?.getAttribute('aria-label'), 'Audio frequency spectrum');
  assert.equal(f.labels.length, 0);
  assert.equal(f.frames.size, 0);
  await act(async () => {
    root.unmount();
  });
  assert.equal(f.observers.size, 0);
  assert.equal(f.frames.size, 0);
  assert.equal(f.host.querySelectorAll('canvas').length, 0);
});
