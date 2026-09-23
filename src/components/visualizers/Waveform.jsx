/*
A free online tool to visualize audio files with spectrogram, waveform, MIDI conversion and more.
Copyright (C) 2024 Charles Thompson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import { useRef, useEffect, useState } from 'react';
import { createWaveformHistory } from '../../utils/waveformHistory';

const MAX_SAMPLES = 1048576;
const modules = new WeakMap();

export default function Waveform({ audio }) {
  const sketchRef = useRef(null);
  const { analyser } = audio;
  const historyRef = useRef(null);
  if (!historyRef.current) historyRef.current = createWaveformHistory(MAX_SAMPLES);
  const [windowSamples, setWindowSamples] = useState(2048);
  const [verticalStretchFactor, setVerticalStretchFactor] = useState(1);
  const [error, setError] = useState('');
  const settingsRef = useRef(null);
  const sampleRate = analyser?.context.sampleRate || audio.sampleRate || 44100;

  useEffect(() => {
    settingsRef.current = { windowSamples, verticalStretchFactor };
  }, [windowSamples, verticalStretchFactor]);

  useEffect(() => {
    if (!analyser) return;
    const context = analyser.context;
    let cancelled = false;
    let node;
    historyRef.current = createWaveformHistory(MAX_SAMPLES);
    setError('');
    async function connect() {
      try {
        if (!context.audioWorklet) throw new Error('AudioWorklet unavailable');
        if (!modules.has(context)) {
          const loading = context.audioWorklet.addModule(`${import.meta.env.BASE_URL}waveform-processor.js`);
          modules.set(context, loading);
          loading.catch(() => modules.delete(context));
        }
        await modules.get(context);
        if (cancelled) return;
        node = new AudioWorkletNode(context, 'waveform-processor', {
          channelCount: 1,
          channelCountMode: 'explicit',
        });
        node.port.onmessage = ({ data }) => historyRef.current.append(data);
        analyser.connect(node);
        node.connect(context.destination);
      } catch {
        if (!cancelled)
          setError('Waveform capture could not start. Try reloading in a browser with AudioWorklet support.');
      }
    }
    connect();
    return () => {
      cancelled = true;
      if (node) {
        analyser.disconnect(node);
        node.disconnect();
        node.port.onmessage = null;
        node.port.close();
      }
    };
  }, [analyser]);

  useEffect(() => {
    const container = sketchRef.current;
    let resize;
    const sketch = (p) => {
      const height = 400;
      p.setup = () => {
        const canvas = p.createCanvas(Math.max(1, container.offsetWidth), height);
        canvas.parent(container);
        canvas.style('display', 'block');
        canvas.attribute('aria-hidden', 'true');
        p.pixelDensity(window.devicePixelRatio || 1);
        p.frameRate(60);
        resize = new ResizeObserver(([entry]) => {
          p.resizeCanvas(Math.max(1, entry.contentRect.width), height);
        });
        resize.observe(container);
      };
      p.draw = () => {
        const { windowSamples, verticalStretchFactor } = settingsRef.current;
        const { envelope, points } = historyRef.current.view(windowSamples, p.width);
        const middle = height / 2;
        const y = (sample) => middle - sample * middle * verticalStretchFactor;
        p.background(0);
        p.stroke(255);
        p.strokeWeight(1);
        p.noFill();
        if (envelope) {
          // Every sample contributes to its pixel's range, preserving peaks when zoomed out.
          const xAt = (i) => (points.length === 1 ? p.width / 2 : (i / (points.length - 1)) * (p.width - 1));
          for (let i = 0; i < points.length; i++) {
            const x = xAt(i);
            // Join consecutive buckets at their boundary samples. Single-sample buckets
            // have zero-height ranges, so isolated min/max bars would leave gaps.
            if (i > 0) {
              p.line(xAt(i - 1), y(points[i - 1].last), x, y(points[i].first));
            }
            p.line(x, y(points[i].min), x, y(points[i].max));
          }
        } else if (points.length === 1) {
          p.line(0, y(points[0].min), p.width, y(points[0].min));
        } else {
          p.beginShape();
          for (let i = 0; i < points.length; i++) {
            const x = (i / (points.length - 1)) * p.width;
            p.vertex(x, y(points[i].min));
          }
          p.endShape();
        }
      };
    };
    const instance = new window.p5(sketch);
    return () => {
      resize?.disconnect();
      instance.remove();
    };
  }, []);

  return (
    <div style={{ marginBottom: '200px' }}>
      <h2>Waveform</h2>
      <div className="has-border" style={{ width: '90%' }}>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="waveformWindowSlider" className="control-label">
            Visible window: {windowSamples.toLocaleString()} samples ·{' '}
            {((windowSamples / sampleRate) * 1000).toFixed(2)} ms
          </label>
          <input
            id="waveformWindowSlider"
            type="range"
            min="0"
            max="1"
            step="any"
            value={Math.sqrt((windowSamples - 1) / (MAX_SAMPLES - 1))}
            aria-valuetext={`${windowSamples.toLocaleString()} samples, ${((windowSamples / sampleRate) * 1000).toFixed(2)} milliseconds`}
            onChange={(e) => {
              // A quadratic curve gives small windows more slider travel without abrupt changes.
              const position = Number(e.target.value);
              setWindowSamples(1 + Math.round(position ** 2 * (MAX_SAMPLES - 1)));
            }}
            onKeyDown={(e) => {
              // Suppress native slider movement without stopping synthesizer key events.
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
            }}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ margin: '10px 10px' }}>
          <label htmlFor="verticalStretchSlider" className="control-label">
            Vertical scale: {verticalStretchFactor.toFixed(2)}×
          </label>
          <input
            id="verticalStretchSlider"
            type="range"
            min="0.5"
            max="20"
            step="0.01"
            value={verticalStretchFactor}
            onChange={(e) => setVerticalStretchFactor(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <div
        ref={sketchRef}
        role="img"
        aria-label="Audio waveform, oldest samples on the left and latest on the right"
        style={{ width: '100%' }}
      />
    </div>
  );
}
