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


import React, { useState, useEffect } from 'react';
import SpectrographVisualizer from './SpectrographVisualizer.jsx';
import './App.css';
import KeyboardSVG from './KeyboardSVG.jsx';
import Waveform from './WaveformVisualizer.jsx';
import { useAudioAnalysis } from './useAudioAnalysis.js';
import PianoRoll from './PianoRoll.jsx';
import RMS from './RMS.jsx';
import ChromavectorCircleGraph from './ChromavectorCircleGraph.jsx';
import ChromevectorLineGraph from './ChromevectorLineGraph.jsx';
import { convertToMidiBrowser } from './browserMidiConverter.js';
import SpectralSpreadGraph from './SpectralSpreadGraph.jsx';
import { monomix, downsampleArray } from './audioBufferTools.js';
import WaterfallSpectrograph from './WaterfallSpectrograph';

export default function App() {
  // React state hooks to manage various input parameters and settings for the audio visualization
  const [mp3File, setMp3File] = useState(null);
  const [midiFile, setMidiFile] = useState(null);
  const [useMic, setUseMic] = useState(false);
  const [bins, setBins] = useState(32768);
  const [smoothing, setSmoothing] = useState(0.01);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minDecibels, setMinDecibels] = useState(-120);
  const [maxDecibels, setMaxDecibels] = useState(-30);
  const [showLabels, setShowLabels] = useState(true);
  const [showScroll, setShowScroll] = useState(true);
  const [pianoEnabled, setPianoEnabled] = useState(true);
  const [bpmAndKey, setBpmAndKey] = useState(true);
  const [showWaveform, setShowWaveform] = useState(true);
  const [showSpectrograph, setShowSpectrograph] = useState(true);
  const [showWaterfallSpectrograph, setShowWaterfallSpectrograph] = useState(false);
  const [chromaCircle, setChromaCircle] = useState(true);
  const [chromaLine, setChromaLine] = useState(false);
  const [rms, setRms] = useState(true);

  const [currentSongName, setCurrentSongName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [midiNotes, setMidiNotes] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(true);
  const [warning, setWarning] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generateBrowserMIDI, setGenerateBrowserMIDI] = useState(true);
  const [onsetThreshold, setOnsetThreshold] = useState(0.3);
  const [frameThreshold, setFrameThreshold] = useState(0.3);
  const [minDurationSec, setMinDurationSec] = useState(0.1);
  const [oscillatorType, setOscillatorType] = useState('custom');
  const [meydaBufferSize, setMeydaBufferSize] = useState(4096);
  const [spectralSpreadGraph, setSpectralSpreadGraph] = useState(true);

  const [bpm, setBpm] = useState(null);
  const [key, setKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [songs, setSongs] = useState([]);
  const [selectedSongFileName, setSelectedSongFileName] = useState('');
  const [fetchingSong, setFetchingSong] = useState(false);

  const S3_BASE_URL = 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com';

  useEffect(() => {
    fetch('/songs.json')
      .then(response => response.json())
      .then(data => setSongs(data))
      .catch(error => console.error('Error loading songs:', error));
  }, []);

  const handleSongSelect = async (e) => {
    const selectedFileName = e.target.value;
    const selectedSong = songs.find(song => song.fileName === selectedFileName);
    if (!selectedSong) return;
  
    try {
      setCurrentSongName(`${selectedSong.artist} - ${selectedSong.title}`);
      setSelectedSongFileName(selectedFileName);
      setFetchingSong(true);
      const songUrl = `${S3_BASE_URL}/${(selectedSong.fileName.replace(' ', '+'))}`;
      const response = await fetch(songUrl);
      const blob = await response.blob();
      const file = new File([blob], selectedSong.fileName, { type: 'audio/mp3' });
      setFetchingSong(false);
      
      setMp3File(file);
      setMidiFile(null);
    } catch (error) {
      console.error('Error loading song:', error);
      setWarning('Failed to load song. Please try again.');
    }
  };

  async function initializeEssentia() {
    if (!window.EssentiaWASM) {
      await new Promise(resolve => {
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

  useEffect(() => {
    if (!mp3File || !bpmAndKey) return;

    const processAudio = async () => {
      try {
        setIsProcessing(true);
        const essentia = await initializeEssentia();
        const arrayBuffer = await mp3File.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const monoAudio = monomix(audioBuffer);
        
        const targetSR = 22050;
        const downsampled = downsampleArray(monoAudio, audioBuffer.sampleRate, targetSR);
        
        const vectorSignal = essentia.arrayToVector(downsampled);
        
        const keyData = essentia.KeyExtractor(
          vectorSignal, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 
          'bgate', targetSR, 0.0001, 440, 'cosine', 'hann'
        );

        const bpmResult = essentia.PercivalBpmEstimator(
          vectorSignal, 
          2048,    // frameSize (larger window for 22.05kHz)
          4096,    // frameSizeOSS (wider OSS analysis window)
          256,     // hopSize (balance between resolution and compute)
          128,     // hopSizeOSS (finer OSS resolution)
          250,     // maxBPM (covers faster tempos)
          40,      // minBPM (catches slower tempos)
          targetSR // match actual sample rate
        );

        setBpm(Math.round(bpmResult.bpm));
        setKey(`${keyData.key} ${keyData.scale}`);
        
        essentia.delete();
        audioContext.close();
      } catch (error) {
        console.error('Audio processing failed:', error);
        setWarning('Audio analysis failed. Please try another file.');
      } finally {
        setIsProcessing(false);
      }
    };

    processAudio();
}, [mp3File]);

useEffect(() => {
  const convertMidi = async () => {
    if (!mp3File || (!generateBrowserMIDI)) return;

    setIsConverting(true);
    setConversionComplete(false);
    setWarning(null);

    try {
      let notes;
      if (generateBrowserMIDI) {
        notes = await convertToMidiBrowser(
          mp3File,
          setProgress,
          onsetThreshold,
          frameThreshold,
          minDurationSec
        );
      }
      
      setMidiNotes(notes);
      setConversionComplete(true);
    } catch (error) {
      console.error('Conversion failed:', error);
      setWarning(error.message);
      setConversionComplete(false);
    } finally {
      setIsConverting(false);
    }
  };

  convertMidi();
}, [mp3File, generateBrowserMIDI, 
   onsetThreshold, frameThreshold, minDurationSec]);



  // State for harmonic amplitudes (1-8 harmonics)
  const [harmonicAmplitudes, setHarmonicAmplitudes] = useState({
    1: 1.000,
    2: 0.500,
    3: 0.200,
    4: 0.100,
    5: 0.050,
    6: 0.010,
    7: 0.005,
    8: 0.001,
  });

  function handleHarmonicChange(harmonic, value) {
    setHarmonicAmplitudes((prevAmplitudes) => ({
      ...prevAmplitudes,
      [harmonic]: value,
    }));
  }

  // ADSR envelope state variables
  const [attackTime, setAttackTime] = useState(0.01);
  const [decayTime, setDecayTime] = useState(0.3);
  const [sustainLevel, setSustainLevel] = useState(0.2);
  const [releaseTime, setReleaseTime] = useState(0.5);

  // Add vibrato and tremolo state variables
  const [vibratoDepth, setVibratoDepth] = useState(0);
  const [vibratoRate, setVibratoRate] = useState(0);
  const [tremoloDepth, setTremoloDepth] = useState(0);
  const [tremoloRate, setTremoloRate] = useState(0);

  // Add preset definitions
  const presets = {
    None: {
      oscillatorType: 'custom',
      harmonicAmplitudes: {
        1: 1.0,
        2: 0.0,
        3: 0.0,
        4: 0.0,
        5: 0.0,
        6: 0.0,
        7: 0.0,
        8: 0.0,
      },
      attackTime: 0.01,
      decayTime: 0.3,
      sustainLevel: 0.2,
      releaseTime: 0.5,
      vibratoDepth: 0,
      vibratoRate: 0,
      tremoloDepth: 0,
      tremoloRate: 0,
    },
    Piano: {
      oscillatorType: 'custom',
      harmonicAmplitudes: {
        1: 1.0,
        2: 0.5,
        3: 0.2,
        4: 0.1,
        5: 0.05,
        6: 0.01,
        7: 0.005,
        8: 0.001,
      },
      attackTime: 0.01,
      decayTime: 0.3,
      sustainLevel: 0.2,
      releaseTime: 0.5,
      vibratoDepth: 0,
      vibratoRate: 0,
      tremoloDepth: 0,
      tremoloRate: 0,
    },
    Violin: {
      oscillatorType: 'custom',
      harmonicAmplitudes: {
        1: 1.0,
        2: 0.7,
        3: 0.4,
        4: 0.3,
        5: 0.15,
        6: 0.07,
        7: 0.03,
        8: 0.01,
      },
      attackTime: 1.30,
      decayTime: 1.0,
      sustainLevel: 0.6,
      releaseTime: 0.5,
      vibratoDepth: 0,
      vibratoRate: 0,
      tremoloDepth: 0,
      tremoloRate: 0,
    },
    // Add more presets as needed
  };

  // Add state for selected preset
  const [selectedPreset, setSelectedPreset] = useState('None');

  // Add useEffect to apply preset settings
  useEffect(() => {
    if (presets[selectedPreset]) {
      const preset = presets[selectedPreset];
      setHarmonicAmplitudes(preset.harmonicAmplitudes);
      setAttackTime(preset.attackTime);
      setDecayTime(preset.decayTime);
      setSustainLevel(preset.sustainLevel);
      setReleaseTime(preset.releaseTime);
      setVibratoDepth(preset.vibratoDepth);
      setVibratoRate(preset.vibratoRate);
      setTremoloDepth(preset.tremoloDepth);
      setTremoloRate(preset.tremoloRate);
      setOscillatorType(preset.oscillatorType);
    }
  }, [selectedPreset]);

  // Instantiate the audio analysis using the custom hook
  const audioAnalysis = useAudioAnalysis(
    mp3File,
    midiFile,
    useMic,
    bins,
    smoothing,
    isPlaying,
    minDecibels,
    maxDecibels,
    pianoEnabled,
    harmonicAmplitudes, // Ensure this is never empty
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
    vibratoDepth,
    vibratoRate,
    tremoloDepth,
    tremoloRate,
    oscillatorType,
    meydaBufferSize
  );

  useEffect(() => {
    let interval;
    if (isPlaying && !isPaused && audioAnalysis.duration) {
      interval = setInterval(() => {
        setCurrentTime(audioAnalysis.getCurrentTime());
      }, 500); // Update every 500ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused, audioAnalysis.duration, audioAnalysis.getCurrentTime]);

  /**
   * Toggles the audio playback state.
   */
  function handleStartStop() {
    if (isPlaying) {
        location.reload();
    } else {
      setIsPlaying(true);
    }
  }

  function handlePauseResume() {
    if (isPaused) {
      setIsPaused(false);
      audioAnalysis.play();
    } else {
      setIsPaused(true);
      audioAnalysis.pause();
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setCurrentSongName(file.name.split('.')[0]);
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
        setMidiFile(file);
        setMp3File(null);
        setPianoEnabled(true);
        setSelectedSongFileName('');
      } else if (
        fileName.endsWith('.mp3') ||
        fileName.endsWith('.wav') ||
        fileName.endsWith('.ogg')
      ) {
        setMp3File(file);
        setMidiFile(null);
      }
    }
  }

  // Render the main UI for the app
  return (
    <div className="App">
      <div className="main-container">
      <div className="SongTitle">
        {currentSongName && <h1 style={{color: 'white'}}>{currentSongName}</h1>}
        {isProcessing && <p>Analyzing audio...</p>}
        {!isProcessing && bpm && key && (
          <div className="audio-info">
            <p>BPM: {Math.round(bpm)}</p>
            <p>Key: {key}</p>
          </div>
        )}
      </div>
        {/* Controls that cannot be adjusted during playback */}
        {!isPlaying && (
          <div>
            {/* Song selection dropdown */}
            <label>
              Select Song:
              <select 
                value={selectedSongFileName}
                onChange={handleSongSelect}
                style={{ marginLeft: '10px' }}
                className="song-select"
              >
                <option value="">Choose from library</option>
                {songs.map(song => (
                  <option key={song.fileName} value={song.fileName}>
                    {song.title} by {song.artist}
                  </option>
                ))}
              </select>
            </label>
              {/* File input for uploading local audio files (mp3, wav, ogg, midi) */}
              <label>
                mp3, wav, ogg, midi -
                <input
                  className="file-input"
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/midi"
                  onChange={handleFileUpload}
                />
              </label>
              {fetchingSong && <p>Loading song...</p>}
              <p>
                All music is from <a href='https://freemusicarchive.org'>Free Music Archive</a> under the Creative Commons liscence Attribution-NonCommercial-ShareAlike (CC BY-NC-SA).
              </p>
              {/* visualization toggles */}
              {!isPlaying && (
                <>
                  <label className="control-label">
                    BPM and Key
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={bpmAndKey}
                      onChange={() => setBpmAndKey(!bpmAndKey)}
                    />
                  </label>
                  <label className="control-label">
                    Waveform
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={showWaveform}
                      onChange={() => setShowWaveform(!showWaveform)}
                    />
                  </label>
                  <label className="control-label">
                    Bar graph Spectrograph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={showSpectrograph}
                      onChange={() => setShowSpectrograph(!showSpectrograph)}
                    />
                  </label>
                  <label className="control-label">
                    Waterfall Spectrograph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={showWaterfallSpectrograph}
                      onChange={() => setShowWaterfallSpectrograph(!showWaterfallSpectrograph)}
                    />
                  </label>
                  {/* Checkbox input to enable piano keyboard input */}
                  {(!isPlaying) && (
                    <label className="control-label">
                      Synthesizer
                      <input
                        className="control-checkbox"
                        type="checkbox"
                        checked={pianoEnabled}
                        onChange={() => setPianoEnabled(!pianoEnabled)}
                      />
                    </label>
                  )}
                  <label className="control-label">
                    Generate MIDI
                    <input
                      type="checkbox"
                      checked={generateBrowserMIDI}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setGenerateBrowserMIDI(checked);
                      }}
                    />
                  </label>
                  {generateBrowserMIDI && (
                    <>
                      <label> Onset Threshold
                        <input type="range" min="0" max="1" step="0.01" 
                          value={onsetThreshold} 
                          onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
                        />
                      </label>
                      <label>
                        Frame Threshold
                        <input type="range" min="0" max="1" step="0.01"
                          value={frameThreshold}
                          onChange={(e) => setFrameThreshold(parseFloat(e.target.value))}
                        />
                      </label>
                      <label>
                        Min Duration (sec)
                        <input type="range" min="0" max="1" step="0.01"
                          value={minDurationSec}
                          onChange={(e) => setMinDurationSec(parseFloat(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                  <label className="control-label">
                    Chroma Circle Graph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={chromaCircle}
                      onChange={() => setChromaCircle(!chromaCircle)}
                    />
                  </label>
                  <label className="control-label">
                    Chroma Line Graph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={chromaLine}
                      onChange={() => setChromaLine(!chromaLine)}
                    />
                  </label>
                  <label className="control-label">
                    RMS
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={rms}
                      onChange={() => setRms(!rms)}
                    />
                  </label>
                  <label className="control-label">
                    Spectral Centroid + Spread Graph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={spectralSpreadGraph}
                      onChange={() => setSpectralSpreadGraph(!spectralSpreadGraph)}
                    />
                  </label>
                </>
              )}
            </div>
        )}

        {/* Start/Stop and Use Mic buttons */}
        <div className="controls-row">
          {isPlaying && (
            <label className="control-label">
              Meyda Buffer Size
              <select
                value={meydaBufferSize}
                onChange={(e) => setMeydaBufferSize(parseInt(e.target.value, 10))}
                style={{paddingLeft: '5px', paddingRight: '5px'}}
              >
                {[512, 1024, 2048, 4096, 8192, 16384].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!isPlaying && (
            <button
              className="control-button"
              onClick={() => {
                setUseMic(true);
                setMp3File(null);
                setMidiFile(null);
                handleStartStop();
              }}
            >
              Use Mic
            </button>
          )}
          {progress <100 && isConverting && (
            <>
              <p>Converting audio to MIDI... {progress.toFixed(2)}%</p>
              <progress value={progress} max="100" />
            </>
          )}
          {warning && <div>{warning}</div>}
          <button
            className="control-button"
            onClick={handleStartStop}
            disabled={(!conversionComplete && mp3File) || fetchingSong}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          {isPlaying && (
            <>
              <button className="control-button" onClick={handlePauseResume}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              {audioAnalysis.duration > 0 && (
                <div className="seek-slider">
                  <label>
                    {String(Math.floor(currentTime / 60)).padStart(2, '0')}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                    <input
                      type="range"
                      min="0"
                      max={audioAnalysis.duration}
                      step="0.001"
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        audioAnalysis.seek(time);
                        setCurrentTime(time);
                        audioAnalysis.pause();
                        audioAnalysis.play();
                        setIsPaused(false);
                      }}
                      style={{paddingLeft: "10px", paddingRight: "10px"}}
                    />
                    {String(Math.floor(audioAnalysis.duration / 60)).padStart(2, '0')}:{String(Math.floor(audioAnalysis.duration % 60)).padStart(2, '0')}
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Only show keyboard when piano is enabled */}
        {pianoEnabled && (
          <div className="keyboard-container">
            <KeyboardSVG />
          </div>
        )}
      </div>
        
        { chromaCircle && (<ChromavectorCircleGraph chroma={audioAnalysis.chroma} isPlaying={isPlaying}/>)}
        { spectralSpreadGraph && (
          <SpectralSpreadGraph 
            spectralCentroid={audioAnalysis.spectralCentroid} 
            spectralSpread={audioAnalysis.spectralSpread}
            isPlaying={isPlaying}
            sampleRate={audioAnalysis.sampleRate}
            bufferSize={meydaBufferSize}
          />
        )}
        { chromaLine && (<ChromevectorLineGraph chroma={audioAnalysis.chroma} isPlaying={isPlaying}/>)}
        { rms && (<RMS rms={audioAnalysis.rms} isPlaying={isPlaying}/>)}

      {/* Render the visualization component when audio is playing */}
      {isPlaying && (
        <div className='Visualizers-Container'>
          {(showSpectrograph || showWaterfallSpectrograph) && (
            <>
              <>
                <div className="controls-row has-border">
                  {/* Select input for FFT bin size */}
                    <label className="control-label">
                      FFT Size:
                      <select
                        className="control-select"
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value, 10))}
                      >
                        {[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].map((power) => (
                          <option key={power} value={power}>
                            {power}
                          </option>
                        ))}
                      </select>
                    </label>

                  {/* Slider input for minimum decibel threshold */}
                    <label className="control-label">
                      Min Decibels:
                      <span>{minDecibels} dB</span>
                      <input
                        className="control-slider"
                        type="range"
                        min="-120"
                        max={0}
                        step="1"
                        value={minDecibels}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value < maxDecibels) {
                            setMinDecibels(value);
                          }
                        }}
                      />
                    </label>

                  {/* Slider input for maximum decibel threshold */}
                    <label className="control-label">
                      Max Decibels:
                      <span>{maxDecibels} dB</span>
                      <input
                        className="control-slider"
                        type="range"
                        min={-120}
                        max="0"
                        step="1"
                        value={maxDecibels}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > minDecibels) {
                            setMaxDecibels(value);
                          }
                        }}
                      />
                    </label>

                  {/* Slider input for FFT smoothing factor */}
                    <label className="control-label">
                      Smoothing:
                      <input
                        className="control-slider"
                        type="range"
                        min="0.000"
                        max="1.00"
                        step="0.001"
                        value={smoothing}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > 0) {
                            setSmoothing(parseFloat(value))}
                          }
                        }
                      />
                    </label>

                  {/* Checkbox input to toggle showing note labels */}
                    <label className="control-label">
                      Labels
                      <input
                        className="control-checkbox"
                        type="checkbox"
                        checked={showLabels}
                        onChange={() => setShowLabels(!showLabels)}
                      />
                    </label>

                  {/* Checkbox input to toggle showing the scroll bar */}
                    <label className="control-label">
                      Bar
                      <input
                        className="control-checkbox"
                        type="checkbox"
                        checked={showScroll}
                        onChange={() => setShowScroll(!showScroll)}
                      />
                    </label>
                </div>
              </>
              {showSpectrograph && (
                <SpectrographVisualizer
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audioAnalysis={audioAnalysis}
                />
              )}
              {showWaterfallSpectrograph && (
                <WaterfallSpectrograph
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audioAnalysis={audioAnalysis}
                />
              )}
            </>
          )}
          {/* Harmonic amplitude sliders */}
          {showWaveform && <Waveform audioAnalysis={audioAnalysis} />}
        {(pianoEnabled || midiFile) && (
            <div className="synthesizer-settings">
              <h2>Synthesizer Settings</h2>
              {/* Add radio menu in the UI */}
                  <div className="preset-options">
                    <label>
                      <input
                        type="radio"
                        name="preset"
                        value="None"
                        checked={selectedPreset === 'None'}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                      />
                      None
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="preset"
                        value="Piano"
                        checked={selectedPreset === 'Piano'}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                      />
                      Piano
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="preset"
                        value="Violin"
                        checked={selectedPreset === 'Violin'}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                      />
                      Violin
                    </label>
                  </div>
                  
              <div>
                <div className="oscillator-type">
                  <label>
                    Oscillator Type:
                    <select 
                      value={oscillatorType}
                      onChange={(e) => setOscillatorType(e.target.value)}
                    >
                      <option value="custom">Custom harmonics</option>
                      <option value="sine">Sine</option>
                      <option value="square">Square</option>
                      <option value="sawtooth">Sawtooth</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </label>
                </div>

                {oscillatorType === 'custom' && (
                  <div className="harmonic-controls">
                    {/* harmonic sliders */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((harmonic) => (
                      <div key={harmonic}>
                        <label>
                          Harmonic {harmonic}:{' '}
                          {harmonicAmplitudes[harmonic].toFixed(4)}
                          <input
                            type="range"
                            min="0.000"
                            max="1.00"
                            step="0.001"
                            value={harmonicAmplitudes[harmonic]}
                            onChange={(e) =>
                              handleHarmonicChange(harmonic, parseFloat(e.target.value))
                            }
                            className="harmonic-slider"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <br />                
              {/* ADSR sliders */}
              <div>
                <label>
                  Attack Time: {attackTime.toFixed(4)}s
                  <input
                    type="range"
                    min="0.001"
                    max="2"
                    step="0.001"
                    value={attackTime}
                    onChange={(e) => setAttackTime(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Decay Time: {decayTime.toFixed(4)}s
                  <input
                    type="range"
                    min="0.001"
                    max="2"
                    step="0.001"
                    value={decayTime}
                    onChange={(e) => setDecayTime(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Sustain Level: {sustainLevel.toFixed(4)}
                  <input
                    type="range"
                    min="0.001"
                    max="1"
                    step="0.001"
                    value={sustainLevel}
                    onChange={(e) => setSustainLevel(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Release Time: {releaseTime.toFixed(4)}s
                  <input
                    type="range"
                    min="0.001"
                    max="5"
                    step="0.001"
                    value={releaseTime}
                    onChange={(e) => setReleaseTime(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <br />
              {/* Vibrato Sliders */}
              <div>
                <label>
                  Vibrato Depth: {vibratoDepth.toFixed(4)}
                  <input
                    type="range"
                    min="0.000"
                    max="100.00"
                    step="0.001"
                    value={vibratoDepth}
                    onChange={(e) => setVibratoDepth(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Vibrato Rate: {vibratoRate.toFixed(4)} Hz
                  <input
                    type="range"
                    min="0.000"
                    max="20.00"
                    step="0.001"
                    value={vibratoRate}
                    onChange={(e) => setVibratoRate(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              {/* Tremolo Sliders */}
              <div>
                <label>
                  Tremolo Depth: {tremoloDepth.toFixed(4)}
                  <input
                    type="range"
                    min="0.000"
                    max="1.00"
                    step="0.001"
                    value={tremoloDepth}
                    onChange={(e) => setTremoloDepth(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Tremolo Rate: {tremoloRate.toFixed(4)} Hz
                  <input
                    type="range"
                    min="0.000"
                    max="20.00"
                    step="0.001"
                    value={tremoloRate}
                    onChange={(e) => setTremoloRate(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <br />
            </div>
          )}
          {audioAnalysis.midiNotes.length > 0 && (
            <PianoRoll
              notes={audioAnalysis.midiNotes}
              isPlaying={isPlaying}
            />
          )}
          {midiNotes && (
            <PianoRoll
              notes={midiNotes}
              isPlaying={isPlaying}
            />
          )}
        </div>
      )}
    </div>
  );
}