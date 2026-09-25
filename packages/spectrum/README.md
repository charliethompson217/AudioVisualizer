# Spectrum

A framework-independent TypeScript frequency-spectrum visualizer with musical-note colors, automatic container sizing, and an optional React component. The core has **no runtime dependencies**. Supply your own Web Audio `AnalyserNode`; the library only reads frequency data and never changes audio connections, playback, or context state.

Available as [`@audiovisualizer/spectrum`](https://www.npmjs.com/package/@audiovisualizer/spectrum) and distributed under the [MIT license](LICENSE).

## Install

```sh
npm install @audiovisualizer/spectrum
```

The package has two explicit entry points:

| Import                            | Exports                                                     | Requires React? |
| --------------------------------- | ----------------------------------------------------------- | --------------- |
| `@audiovisualizer/spectrum`       | `createSpectrumVisualizer`, `DEFAULT_NOTE_HUES`, core types | No              |
| `@audiovisualizer/spectrum/react` | `SpectrumVisualizer`, `SpectrumVisualizerProps`             | React 18 or 19  |

React is an [optional peer dependency](https://docs.npmjs.com/files/package.json/); npm does not automatically install it for core-only consumers. TypeScript users of the core do not need React types either. The React adapter uses the React installation already in your app; TypeScript React apps also need `@types/react`.

## Plain JavaScript / TypeScript

Give your container a size using your app's layout:

```html
<div id="spectrum" style="height: 320px"></div>
```

Then, in your app's client code:

```ts
import { createSpectrumVisualizer } from '@audiovisualizer/spectrum';

const container = document.querySelector<HTMLElement>('#spectrum')!;
const visualizer = createSpectrumVisualizer(container, {
  analyser, // An AnalyserNode owned by your app; null is fine during initialization.
  showNoteLabels: true,
  showFrequencyLabels: true,
  showScroll: true,
});

// Change only the options you need. Everything else is retained.
visualizer.update({ brightnessPower: 1.5 });
visualizer.update({ analyser: anotherAnalyser });
visualizer.update({ maxHeight: 480 });
visualizer.update({ maxHeight: null }); // Remove the cap.

// Optional native DOM styling of the visualizer's own wrapper:
visualizer.element.className = 'my-spectrum';
visualizer.element.style.borderRadius = '12px';

// When your view is removed:
visualizer.destroy();
```

Use the same API in Vue, Svelte, Angular, or another DOM-based framework: create the instance after its container mounts, call `update()` when settings change, and call `destroy()` when the view is removed. Keep the instance out of deeply reactive state. No framework-specific wrapper is required.

`destroy()` removes only the wrapper/canvas created by that instance. It cancels animation, disconnects its resize observer, and removes its pointer/window listeners. It leaves the supplied container, its existing children, and all audio nodes alone. Repeated `destroy()` calls are safe; `update()` after destruction throws. Create a new instance to mount again. Multiple instances can share an analyser.

Updates are shallow partial merges. Omitted keys retain their values; an explicitly `undefined` key restores its default. Use `analyser: null` to clear the input. Both `null` and `undefined` clear size caps. Invalid settings throw before modifying the current view. Palettes are copied, so changing the array you passed does not silently change a running instance; pass a new palette through `update()`.

## React

```tsx
import { SpectrumVisualizer } from '@audiovisualizer/spectrum/react';

export function PlayerVisualization({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
  return (
    <div style={{ height: 320 }}>
      <SpectrumVisualizer analyser={analyser} showNoteLabels showFrequencyLabels showScroll paused={!isPlaying} />
    </div>
  );
}
```

The component is a lifecycle adapter around `createSpectrumVisualizer`: it creates an instance after mount, updates it as props change, and destroys it on unmount. It supports React StrictMode. Removing a prop restores its default. Pass an analyser through state/props so React knows when it becomes available or changes.

All core options are available as props, except `ariaLabel` is spelled `aria-label`. React additionally accepts `className` and `style` on its outer container, with inline styles overriding the default sizing styles. Type declarations are available from both entry points:

```ts
import type { SpectrumVisualizerOptions, SpectrumVisualizerInstance } from '@audiovisualizer/spectrum';
import type { SpectrumVisualizerProps } from '@audiovisualizer/spectrum/react';
```

Both entry points can be imported without browser globals. Call `createSpectrumVisualizer()` only in client code after mount. React server rendering emits an empty sizing container; the canvas is created after hydration. The `/react` entry and component preserve the `use client` directive; the core has no React directives or imports.

## Audio ownership

If your app already has an audio context and source but no analyser, add a monitoring branch when setting up your graph:

```js
const analyser = context.createAnalyser();
analyser.fftSize = 8192;
analyser.smoothingTimeConstant = 0.8;
source.connect(analyser);
// Keep the app's existing playback route to context.destination.
// Reading an analyser does not require connecting its output to the destination.

// When the app disposes its monitoring branch:
source.disconnect(analyser);
```

Your app handles playback, user gestures, microphone permissions, and audio cleanup. Configure FFT size, smoothing, and decibel range on the analyser. The visualization adapts when FFT size changes. Frequency detail is limited by the sample rate and FFT resolution.

## Sizing

The visualizer fills **both width and height** of its parent without measurement props or resize callbacks. Its canvas pixel resolution follows its displayed size, including device pixel density.

The parent must have a height supplied by your layout: a panel with an explicit height, an aspect ratio, or a sized grid/flex area. An empty parent with `height: auto` has no vertical space to fill; `maxHeight` alone does not allocate that space. This follows ordinary [CSS percentage-height behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/height).

For a responsive React card:

```tsx
<div style={{ width: '100%', aspectRatio: '16 / 9' }}>
  <SpectrumVisualizer analyser={analyser} />
</div>
```

For a viewport panel with a header:

```tsx
<div style={{ height: '100dvh', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)' }}>
  <header>Audio player</header>
  <div style={{ minWidth: 0, minHeight: 0 }}>
    <SpectrumVisualizer analyser={analyser} />
  </div>
</div>
```

Use `maxWidth` / `maxHeight` as optional upper bounds in either API. Numbers mean CSS pixels; strings allow CSS units such as `60rem` or `80vh`. A smaller parent still wins. The internal canvas cannot push its parent larger through its bitmap dimensions.

## Options and props

| Option                  | Default                    | Meaning                                                          |
| ----------------------- | -------------------------- | ---------------------------------------------------------------- |
| `analyser`              | `null`                     | Caller-owned analyser; null shows background and enabled labels  |
| `minSemitone`           | `12`                       | Low end of the logarithmic frequency axis (C0)                   |
| `maxSemitone`           | `108`                      | High end (C8); must exceed the low end                           |
| `brightnessPower`       | `1`                        | Positive brightness exponent                                     |
| `lengthPower`           | `1`                        | Positive bar-length exponent                                     |
| `noteHues`              | `DEFAULT_NOTE_HUES`        | Twelve finite hue angles, ordered C through B                    |
| `showNoteLabels`        | `false`                    | Musical note labels across the spectrum                          |
| `showFrequencyLabels`   | `false`                    | Min frequency at bottom-left; max at bottom-right                |
| `showScroll`            | `false`                    | Pointer frequency and note readout                               |
| `paused`                | `false`                    | Stop continuous animation; mount, resize, and updates still draw |
| `maxWidth`, `maxHeight` | None                       | Optional CSS size caps; numbers, strings, or null                |
| `ariaLabel`             | `Audio frequency spectrum` | Accessible canvas description (`aria-label` in React)            |

Semitones use MIDI numbering: 60 is C4, 69 is A4 (440 Hz). Bounds may be fractional. Bounds, exponents, and hues must be finite; exponents must be positive. Invalid options throw a `RangeError`. Browser support requires Canvas 2D, Web Audio, requestAnimationFrame, and ResizeObserver. No p5 or global stylesheet is required.

## Development

Development requires Node.js 18 or newer:

```sh
npm ci
npm test
npm run test:package
npm run dev
```

Run these commands from the repository root. The AudioVisualizer web application serves as the browser integration environment and consumes the package through its public `@audiovisualizer/spectrum` import.

`npm test` checks strict types, drawing logic, labels, core DOM lifecycle, analyser replacement, invalid updates, and React StrictMode cleanup. Canvas drawing is mocked in DOM tests; run `npm run dev` from the repository root for visual testing with the existing AudioVisualizer app.

`npm run test:package` builds and packs the library, installs that tarball in an isolated temporary project, and verifies core imports and TypeScript declarations with **no React or React types installed**. It uses npm's local/offline installation and removes its temporary project afterward.
