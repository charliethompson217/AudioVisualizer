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

import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioContext(mp3File, useMic, isPlaying, synthesizer) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioElementRef = useRef(null);
  const sourceRef = useRef(null);
  const mixerNodeRef = useRef(null);

  const [sampleRate, setSampleRate] = useState(44100);
  const [duration, setDuration] = useState(0);

  const connectSynthesizer = useCallback(() => {
    if (synthesizer && mixerNodeRef.current) {
      try {
        const synthOutput = synthesizer.getOutputNode();
        if (synthOutput) {
          // First disconnect to prevent multiple connections
          try {
            synthOutput.disconnect(mixerNodeRef.current);
          } catch (e) {
            // It's okay if it wasn't previously connected
          }
          synthOutput.connect(mixerNodeRef.current);
          console.log('Synthesizer connected to mixer');
        }
      } catch (e) {
        console.error('Failed to connect synthesizer:', e);
      }
    }
  }, [synthesizer]);

  useEffect(() => {
    if (!isPlaying) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (mixerNodeRef.current) {
        mixerNodeRef.current.disconnect();
        mixerNodeRef.current = null;
      }
      return;
    }

    if (!audioContextRef.current) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
      });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      setSampleRate(audioContext.sampleRate);

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      const mixerNode = audioContext.createGain();
      mixerNode.gain.value = 1.0;
      mixerNodeRef.current = mixerNode;

      mixerNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContext.destination);
    }

    let fileURL = null;

    if (useMic) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(mixerNodeRef.current);
        sourceRef.current = source;

        // Mute output when using microphone to prevent feedback
        gainNodeRef.current.gain.value = 0;
      });
    } else if (mp3File) {
      gainNodeRef.current.gain.value = 1.0;

      let audioElement;
      if (typeof mp3File === 'string') {
        audioElement = new Audio(mp3File);
      } else if (mp3File instanceof File) {
        fileURL = URL.createObjectURL(mp3File);
        audioElement = new Audio(fileURL);
      }
      audioElement.crossOrigin = 'anonymous';
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(mixerNodeRef.current);
      sourceRef.current = source;
      audioElement.play();
      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration);
      });
      // Store audioElement in ref
      audioElementRef.current = audioElement;
    }

    connectSynthesizer();

    return () => {
      if (sourceRef.current && sourceRef.current instanceof MediaStreamAudioSourceNode) {
        const tracks = sourceRef.current.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [isPlaying, mp3File, useMic, connectSynthesizer]);

  useEffect(() => {
    connectSynthesizer();
  }, [synthesizer, connectSynthesizer]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = useMic ? 0 : 1.0;
    }
  }, [useMic]);

  const play = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioElementRef.current ? audioElementRef.current.currentTime : 0;
  }, []);

  return {
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    gainNode: gainNodeRef.current,
    audioElement: audioElementRef.current,
    sampleRate,
    duration,
    play,
    pause,
    seek,
    getCurrentTime,
    source: mixerNodeRef.current,
  };
}
