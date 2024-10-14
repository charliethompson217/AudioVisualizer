import { useRef, useState, useEffect } from 'react';

export function useSharedAudioAnalysis(mp3File, useMic, bins, smoothing, isPlaying) {
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const [dataArray, setDataArray] = useState(null);
    const [sampleRate, setSampleRate] = useState(44100);

    useEffect(() => {
        if ((!mp3File && !useMic) || !isPlaying) return;
    
        let audioContext, analyser, source;
    
        const setupAudio = async () => {
            audioContext = new (window.AudioContext || window.AudioContext)({ latencyHint: 'interactive' });
            analyser = audioContext.createAnalyser();
            analyser.fftSize = bins;
            analyser.smoothingTimeConstant = smoothing;
    
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);
            dataArrayRef.current = data;
            setDataArray(data);
    
            setSampleRate(audioContext.sampleRate);
    
            if (useMic) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                source = audioContext.createMediaStreamSource(stream);
            } else {
                const audioElement = new Audio(mp3File);
                audioElement.crossOrigin = "anonymous";
                source = audioContext.createMediaElementSource(audioElement);
                
                audioElement.addEventListener('canplaythrough', () => {
                    audioElement.play();
                });
                analyser.connect(audioContext.destination);
            }
    
            source.connect(analyser);
        };
    
        setupAudio();
    
        return () => {
            if (audioContext) {
                audioContext.close();
            }
            if (source && source instanceof MediaStreamAudioSourceNode) {
                const tracks = source.mediaStream.getTracks();
                tracks.forEach(track => track.stop()); 
            }
        };
    }, [mp3File, useMic, bins, smoothing, isPlaying]);
    

    return { analyser: analyserRef.current, dataArray, sampleRate };
}
