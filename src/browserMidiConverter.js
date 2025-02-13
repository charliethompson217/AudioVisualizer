import { BasicPitch } from '@spotify/basic-pitch';

let basicPitchModel = null;

async function initializeModel() {
  if (!basicPitchModel) {
    try {
      basicPitchModel = new BasicPitch('/model/model.json');
    } catch (error) {
      throw new Error('Failed to load Basic Pitch model: ' + error.message);
    }
  }
}

function buildNotes(frames, onsets, contours, onsetThreshold, frameThreshold, minDurationSec) {
  const notes = [];
  const activeNotes = new Map();

  for (let i = 0; i < frames.length; i++) {
    for (let pitch = 0; pitch < frames[i].length; pitch++) {
      const frameValue = frames[i][pitch];
      const onsetValue = onsets[i][pitch];

      if (onsetValue > onsetThreshold && !activeNotes.has(pitch)) {
        activeNotes.set(pitch, i);
      }

      if (frameValue < frameThreshold && activeNotes.has(pitch)) {
        const startFrame = activeNotes.get(pitch);
        const startSec = startFrame * 0.01;
        const endSec = i * 0.01;
        const durationSec = endSec - startSec;

        if (durationSec >= minDurationSec) {
          notes.push({
            noteNumber: pitch + 21,
            startSec,
            durationSec,
          });
        }
        activeNotes.delete(pitch);
      }
    }
  }
  return notes;
}

async function resampleAudio(audioBuffer, targetSampleRate = 22050) {
  const sourceSampleRate = audioBuffer.sampleRate;
  const length = Math.round(audioBuffer.length * (targetSampleRate / sourceSampleRate));
  const offlineContext = new OfflineAudioContext(1, length, targetSampleRate);
  const bufferSource = offlineContext.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineContext.destination);
  bufferSource.start();
  return await offlineContext.startRendering();
}

function convertToMono(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) return audioBuffer;
  const monoBuffer = new AudioBuffer({
    length: audioBuffer.length,
    numberOfChannels: 1,
    sampleRate: audioBuffer.sampleRate,
  });
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  const monoData = monoBuffer.getChannelData(0);
  for (let i = 0; i < audioBuffer.length; i++) {
    monoData[i] = (left[i] + right[i]) / 2;
  }
  return monoBuffer;
}

export async function convertToMidiBrowser(mp3File, progressCallback, onsetThreshold, frameThreshold, minDurationSec) {
  await initializeModel();
  const arrayBuffer = await mp3File.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const monoBuffer = convertToMono(audioBuffer);
  const resampledBuffer = await resampleAudio(monoBuffer);
  
  const frames = [];
  const onsets = [];
  const contours = [];
  
  await basicPitchModel.evaluateModel(
    resampledBuffer,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (p) => progressCallback(p * 100)
  );

  return buildNotes(frames, onsets, contours, onsetThreshold, frameThreshold, minDurationSec);
}