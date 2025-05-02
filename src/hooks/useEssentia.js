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

import { useState, useEffect } from 'react';

export function useEssentia(audioContext, isPlaying, mp3File, bpmAndKey = true, source, setWarning) {
  const [bpm, setBpm] = useState(null);
  const [scaleKey, setScaleKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [essentiaFeatures, setEssentiaFeatures] = useState(null);

  useEffect(() => {
    if (!mp3File || !bpmAndKey) return;
    let worker;

    const analyzeAudio = async () => {
      try {
        setIsProcessing(true);
        worker = new Worker('/essentiaWorker.js');
        const arrayBuffer = await mp3File.arrayBuffer();
        const tempAudioContext = new AudioContext();
        let audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);
        worker.postMessage({ type: 'init', sampleRate: tempAudioContext.sampleRate });
        tempAudioContext.close();

        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const extractedData = [];

        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          extractedData.push(new Float32Array(channelData));
        }

        worker.postMessage({
          type: 'audioFile',
          data: {
            extractedData,
            numberOfChannels,
            length,
          },
        });

        worker.onmessage = (event) => {
          if (event.data.type === 'fileFeatures') {
            setBpm(event.data.data.bpm);
            setScaleKey(event.data.data.scaleKey);
            setIsProcessing(false);
          }
        };
      } catch (error) {
        if (error.message.includes('Decoding')) {
          setWarning('Failed to decode audio. File size may be too large.');
        } else {
          setWarning(`Failed to analyze audio: ${error.message}`);
        }
        setIsProcessing(false);
        if (worker) worker.terminate();
      }
    };

    analyzeAudio();

    return () => {
      worker.terminate();
    };
  }, [mp3File, bpmAndKey]);

  useEffect(() => {
    if (!isPlaying || !audioContext || !source || mp3File) return;

    const worker = new Worker('/essentiaWorker.js');
    worker.postMessage({ type: 'init', sampleRate: audioContext.sampleRate });

    let workletNode = null;
    let gainNode = null;

    const setupWorklet = async () => {
      try {
        if (!audioContext.audioWorklet) {
          setWarning('AudioWorklet is not supported in this browser.');
          return;
        }
        await audioContext.audioWorklet.addModule('/audio-processor.js');

        workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
        workletNode.port.onmessage = (event) => {
          if (event.data.type === 'audioChunk') {
            worker.postMessage({
              type: 'audioChunk',
              data: event.data.data,
            });
          }
        };

        gainNode = audioContext.createGain();
        gainNode.gain.value = 0;

        source.connect(workletNode);
        workletNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
      } catch (error) {
        console.error('Failed to set up AudioWorklet:', error);
        setWarning(`Failed to set up AudioWorklet:  ${error.message}`);
        worker.terminate();
        throw error;
      }
    };

    setupWorklet().catch();

    worker.onmessage = (event) => {
      if (event.data.type === 'chunkFeature') {
        setEssentiaFeatures(event.data.data);
      }
    };

    return () => {
      worker.terminate();
      workletNode.disconnect();
      gainNode.disconnect();
    };
  }, [audioContext, source, isPlaying, setEssentiaFeatures]);

  return {
    bpm,
    scaleKey,
    isProcessing,
    essentiaFeatures,
  };
}
