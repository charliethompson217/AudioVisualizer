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

import { monomix, downsampleArray } from './audioBufferTools.js';

// Initialize Essentia WebAssembly module
export async function initializeEssentia() {
  if (!window.EssentiaWASM) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/essentia.js@latest/dist/essentia-wasm.web.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  const wasmModule = await window.EssentiaWASM();
  const essentia = new wasmModule.EssentiaJS(false);

  essentia.arrayToVector = wasmModule.arrayToVector;

  return essentia;
}

// Process audio file to extract key and BPM
export async function processAudioFileEssentia(mp3File) {
  try {
    const essentia = await initializeEssentia();
    const arrayBuffer = await mp3File.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const monoAudio = monomix(audioBuffer);

    const targetSR = 22050;
    const downsampled = downsampleArray(monoAudio, audioBuffer.sampleRate, targetSR);

    const vectorSignal = essentia.arrayToVector(downsampled);

    const keyData = essentia.KeyExtractor(
      vectorSignal,
      true,
      4096,
      4096,
      12,
      3500,
      60,
      25,
      0.2,
      'bgate',
      targetSR,
      0.0001,
      440,
      'cosine',
      'hann'
    );

    const bpmResult = essentia.PercivalBpmEstimator(
      vectorSignal,
      2048, // frameSize (larger window for 22.05kHz)
      4096, // frameSizeOSS (wider OSS analysis window)
      256, // hopSize (balance between resolution and compute)
      128, // hopSizeOSS (finer OSS resolution)
      250, // maxBPM (covers faster tempos)
      40, // minBPM (catches slower tempos)
      targetSR // match actual sample rate
    );

    const result = {
      bpm: Math.round(bpmResult.bpm),
      key: `${keyData.key} ${keyData.scale}`,
    };

    essentia.delete();
    audioContext.close();

    return result;
  } catch (error) {
    console.error('Audio processing failed:', error);
    throw new Error('Audio analysis failed. Please try another file.');
  }
}
