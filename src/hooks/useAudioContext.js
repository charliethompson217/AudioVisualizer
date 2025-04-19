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

  // Pre-initialize AudioContext and nodes
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
      });
      audioContextRef.current.suspend();
      const analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      setSampleRate(audioContextRef.current.sampleRate);

      const mixerNode = audioContextRef.current.createGain();
      mixerNode.gain.value = 1.0;
      mixerNodeRef.current = mixerNode;

      mixerNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      console.log('AudioContext initialized, nodes connected');
    }
  }, []);

  // Handle playback
  useEffect(() => {
    if (!isPlaying) {
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
      return;
    }

    let fileURL = null;
    audioContextRef.current
      .resume()
      .then(() => {
        console.log('AudioContext state:', audioContextRef.current.state);
        if (useMic) {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              source.connect(mixerNodeRef.current);
              sourceRef.current = source;

              // Mute output when using microphone to prevent feedback
              mixerNodeRef.current.gain.value = 0;
              console.log('Microphone source connected');
            })
            .catch((e) => console.error('Microphone access failed:', e));
        } else if (mp3File) {
          mixerNodeRef.current.gain.value = 1.0;
          let audioElement;
          if (typeof mp3File === 'string') {
            audioElement = new Audio();
            audioElement.src = mp3File;
          } else if (mp3File instanceof File) {
            fileURL = URL.createObjectURL(mp3File);
            audioElement = new Audio();
            audioElement.src = fileURL;
          }
          audioElement.crossOrigin = 'anonymous';
          // Do not append to DOM to prevent direct playback
          audioElementRef.current = audioElement;
          const source = audioContextRef.current.createMediaElementSource(audioElement);
          source.connect(mixerNodeRef.current);
          sourceRef.current = source;
          audioElement.play().catch((e) => console.error('Audio playback failed:', e));
          audioElement.addEventListener('loadedmetadata', () => {
            setDuration(audioElement.duration);
            console.log('Audio duration:', audioElement.duration);
          });
        }

        connectSynthesizer();
      })
      .catch((e) => console.error('AudioContext resume failed:', e));

    return () => {
      if (sourceRef.current && sourceRef.current instanceof MediaStreamAudioSourceNode) {
        sourceRef.current.mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      console.log('Cleanup completed');
    };
  }, [isPlaying, mp3File, useMic, connectSynthesizer]);

  useEffect(() => {
    connectSynthesizer();
  }, [synthesizer, connectSynthesizer]);

  useEffect(() => {
    if (mixerNodeRef.current) {
      mixerNodeRef.current.gain.value = useMic ? 0 : 1.0;
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
