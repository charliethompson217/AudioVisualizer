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

function monomix(buffer) {
  if (buffer.numberOfChannels > 1) {
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    return channels[0].map((_, sampleIndex) => {
      let sum = 0;
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        sum += channels[channelIndex][sampleIndex];
      }
      return sum / buffer.numberOfChannels;
    });
  }
  return buffer.getChannelData(0);
}

function downsampleArray(audioIn, sampleRateIn, sampleRateOut) {
  if (sampleRateOut === sampleRateIn) return audioIn;

  const sampleRateRatio = sampleRateIn / sampleRateOut;
  const newLength = Math.round(audioIn.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetAudioIn = 0;

  while (offsetResult < result.length) {
    const nextOffsetAudioIn = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;

    for (let i = offsetAudioIn; i < nextOffsetAudioIn && i < audioIn.length; i++) {
      accum += audioIn[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetAudioIn = nextOffsetAudioIn;
  }

  return result;
}

function concatenateChunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

let minSecondsToAccumulate = 3;
let maxSecondsToAccumulate = 30; 
let processingIntervalSeconds = 3;

let minWindowSamples;
let maxWindowSamples;
let processingIntervalSamples;

let inputBuffer = [];
let windowBuffer = [];
let inputSampleCount = 0;
let windowSampleCount = 0;

let sampleRate = 44100;
let targetSampleRate = 22050;
let essentia = null;
let exports = {};

async function initializeEssentia() {
  try {
    importScripts(
      'https://cdn.jsdelivr.net/npm/essentia.js@latest/dist/essentia-wasm.umd.js',
      'https://cdn.jsdelivr.net/npm/essentia.js@latest/dist/essentia.js-core.js'
    );
  } catch (e) {
    console.error(e.message);
  }
  essentia = new Essentia(exports.EssentiaWASM, false);
  return essentia;
}

async function processAudioChunk(audioData) {
  inputBuffer.push(audioData);
  inputSampleCount += audioData.length;

  if (inputSampleCount >= processingIntervalSamples) {
    windowBuffer = windowBuffer.concat(inputBuffer);
    windowSampleCount += inputSampleCount;

    inputBuffer = [];
    inputSampleCount = 0;

    while (windowSampleCount > maxWindowSamples && windowBuffer.length > 0) {
      let oldestChunk = windowBuffer[0];
      if (oldestChunk.length <= windowSampleCount - maxWindowSamples) {
        windowBuffer.shift();
        windowSampleCount -= oldestChunk.length;
      } else {
        let samplesToRemove = windowSampleCount - maxWindowSamples;
        oldestChunk = oldestChunk.subarray(samplesToRemove);
        windowBuffer[0] = oldestChunk;
        windowSampleCount -= samplesToRemove;
      }
    }

    if (windowSampleCount >= minWindowSamples) {
      const concatenated = concatenateChunks(windowBuffer);
      return await analyzeAudio(concatenated);
    }
  }
  return null;
}

async function analyzeAudio(audioData) {
  try {
    let data;
    let analysisSampleRate = sampleRate;
    if (sampleRate > targetSampleRate) {
      data = downsampleArray(audioData, sampleRate, targetSampleRate);
      analysisSampleRate = targetSampleRate;
    } else {
      data = audioData;
    }

    const vectorSignal = essentia.arrayToVector(data);

    // https://essentia.upf.edu/reference/std_KeyExtractor.html
    const keyData = essentia.KeyExtractor(
      vectorSignal, // audio - (vector_real): the audio input signal
      true, // averageDetuningCorrection - (bool ∈ {true, false}, default = true): shifts a pcp to the nearest tempered bin
      4096, // frameSize - (integer ∈ (0, ∞), default = 4096): the framesize for computing tonal features
      4096, // hopSize - (integer ∈ (0, ∞), default = 4096): the hopsize for computing tonal features
      12, // hpcpSize - (integer ∈ [12, ∞), default = 12): the size of the output HPCP (must be a positive nonzero multiple of 12)
      3500, // maxFrequency - (real ∈ (0, ∞), default = 3500): max frequency to apply whitening to [Hz]
      60, // maximumSpectralPeaks - (integer ∈ (0, ∞), default = 60): the maximum number of spectral peaks
      25, // minFrequency - (real ∈ (0, ∞), default = 25): min frequency to apply whitening to [Hz]
      0.2, // pcpThreshold - (real ∈ [0, 1], default = 0.2): pcp bins below this value are set to 0
      'bgate', // profileType - (string ∈ {diatonic, krumhansl, temperley, weichai, tonictriad, temperley2005, thpcp, shaath, gomez, noland, faraldo, pentatonic, edmm, edma, bgate, braw}, default = bgate): the type of polyphic profile to use for correlation calculation
      analysisSampleRate, // sampleRate - (real ∈ (0, ∞), default = 44100): the sampling rate of the audio signal [Hz]
      0.0001, // spectralPeaksThreshold - (real ∈ (0, ∞), default = 0.0001): the threshold for the spectral peaks
      440, // tuningFrequency - (real ∈ (0, ∞), default = 440): the tuning frequency of the input signal
      'cosine', // weightType - (string ∈ {none, cosine, squaredCosine}, default = cosine): type of weighting function for determining frequency contribution
      'hann' // windowType - string ∈ {hamming, hann, hannnsgcq, triangular, square, blackmanharris62, blackmanharris70, blackmanharris74, blackmanharris92}, default = hann): the window type
    );

    // https://essentia.upf.edu/reference/std_PercivalBpmEstimator.html
    const bpmResult = essentia.PercivalBpmEstimator(
      vectorSignal, // signal - (vector_real): input signal
      2048, // frameSize - (integer ∈ (0, ∞), default = 1024): frame size for the analysis of the input signal
      4096, // frameSizeOSS - (integer ∈ (0, ∞), default = 2048): frame size for the analysis of the Onset Strength Signal
      256, // hopSize - (integer ∈ (0, ∞), default = 128): hop size for the analysis of the input signal
      128, // hopSizeOSS - (integer ∈ (0, ∞), default = 128): hop size for the analysis of the Onset Strength Signal
      250, // maxBPM - (integer ∈ (0, ∞), default = 210): maximum BPM to detect
      40, // minBPM - (integer ∈ (0, ∞), default = 50): minimum BPM to detect
      analysisSampleRate // sampleRate - (integer ∈ (0, ∞), default = 44100): the sampling rate of the audio signal [Hz]
    );

    return {
      bpm: Math.round(bpmResult.bpm),
      key: `${keyData.key} ${keyData.scale}`,
    };
  } catch (error) {
    console.error('Audio processing failed in worker:', error);
    return { error: 'Audio analysis failed' };
  }
}

self.onmessage = async (event) => {
  if (event.data.type === 'init') {
    sampleRate = event.data.sampleRate;
    minWindowSamples = minSecondsToAccumulate * sampleRate;
    maxWindowSamples = maxSecondsToAccumulate * sampleRate;
    processingIntervalSamples = processingIntervalSeconds * sampleRate;
    if (!essentia) {
      try {
        await initializeEssentia();
        self.postMessage({ type: 'initialized' });
      } catch (error) {
        self.postMessage({ type: 'error', message: 'Failed to initialize Essentia' });
        console.error('Essentia initialization failed:', error);
      }
    }
  } else if (event.data.type === 'audioChunk') {
    try {
      if (!essentia) {
        throw new Error('Essentia not initialized');
      }

      let data = event.data.data;
      let audioData;
      const buffer = {
        numberOfChannels: data.numberOfChannels,
        getChannelData: (channel) => data.extractedData[channel],
      };
      audioData = monomix(buffer);

      const result = await processAudioChunk(audioData);

      if (result) {
        self.postMessage({
          type: 'chunkFeature',
          data: {
            bpm: result.bpm,
            scaleKey: result.key,
          },
        });
      }
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
      console.error('Audio chunk processing failed:', error);
    }
  } else if (event.data.type === 'audioFile') {
    let data = event.data.data;
    try {
      if (!essentia) {
        throw new Error('Essentia not initialized');
      }

      let audioData;
      const buffer = {
        numberOfChannels: data.numberOfChannels,
        getChannelData: (channel) => data.extractedData[channel],
      };
      audioData = monomix(buffer);

      const result = await analyzeAudio(audioData);

      if (result) {
        self.postMessage({
          type: 'fileFeatures',
          data: {
            bpm: result.bpm,
            scaleKey: result.key,
          },
        });
      }
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
      console.error('Audio file processing failed:', error);
    }
  }
};
