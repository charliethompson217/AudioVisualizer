function monomix(buffer) {
  if (buffer.numberOfChannels > 1) {
    const leftCh = buffer.getChannelData(0);
    const rightCh = buffer.getChannelData(1);
    return leftCh.map((sample, i) => 0.5 * (sample + rightCh[i]));
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

let audioChunks = [];
let sampleRate = 44100;
let targetSampleRate = 22050;
let essentia = null;
let sampleCount = 0;
let secondsToAccumulate = 3;

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
  audioChunks.push(audioData);
  sampleCount += audioData.length;

  const requiredSamples = secondsToAccumulate * sampleRate;

  if (sampleCount >= requiredSamples) {
    const concatenated = new Float32Array(sampleCount);
    let offset = 0;

    for (const chunk of audioChunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    audioChunks = [];
    sampleCount = 0;

    return await analyzeAudio(concatenated);
  }

  return null;
}

async function analyzeAudio(audioData) {
  try {
    const downsampled = downsampleArray(audioData, sampleRate, targetSampleRate);

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
      targetSampleRate,
      0.0001,
      440,
      'cosine',
      'hann'
    );

    const bpmResult = essentia.PercivalBpmEstimator(vectorSignal, 2048, 4096, 256, 128, 250, 40, targetSampleRate);

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
    sampleRate = event.data.sampleRate || 44100;
    try {
      await initializeEssentia();
      self.postMessage({ type: 'initialized' });
    } catch (error) {
      self.postMessage({ type: 'error', message: 'Failed to initialize Essentia' });
      console.error('Essentia initialization failed:', error);
    }
  } else if (event.data.type === 'audioChunk') {
    try {
      if (!essentia) {
        throw new Error('Essentia not initialized');
      }

      const result = await processAudioChunk(event.data.data);

      if (result) {
        self.postMessage({
          type: 'feature',
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
  }
};
