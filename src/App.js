import React, { useState, useEffect } from 'react';
import SpectrographVisualizer from './SpectrographVisualizer';
import './App.css';
import KeyboardSVG from './KeyboardSVG';
import Waveform from './WaveformVisualizer.js';
import { useAudioAnalysis } from './useAudioAnalysis.js';
import songList from './songList.js';
import PianoRoll from './PianoRoll.js';

import { Amplify } from 'aws-amplify';
import { get, post } from 'aws-amplify/api';
import awsExports from './aws-exports';
Amplify.configure(awsExports);

import { parseMidi } from 'midi-file';
import CryptoJS from 'crypto-js'; // replace crypto with crypto-js

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

  const [showWaveform, setShowWaveform] = useState(true);
  const [showSpectrograph, setShowSpectrograph] = useState(true);

  const [currentSongName, setCurrentSongName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [midiNotes, setMidiNotes] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(true);
  const [warning, setWarning] = useState(null);

  function buildNotes(parsedMidi) {
    console.log("buildNotes");
    console.log(parsedMidi);
    const notesResult = [];
    const ticksPerBeat = parsedMidi.header.ticksPerBeat || 480;
    let microsecondsPerBeat = 500000;
    parsedMidi.tracks.forEach((track) => {
      let currentTime = 0;
      const activeMap = {};
      track.forEach((event) => {
        currentTime += event.deltaTime;
        if (event.meta && event.type === 'setTempo') {
          microsecondsPerBeat = event.microsecondsPerBeat;
        }
        const secondsPerTick = microsecondsPerBeat / 1_000_000 / ticksPerBeat;
        const eventTimeSec = currentTime * secondsPerTick;
        if (event.type === 'noteOn' && event.velocity > 0) {
          activeMap[event.noteNumber] = eventTimeSec;
        } else if (
          event.type === 'noteOff' ||
          (event.type === 'noteOn' && event.velocity === 0)
        ) {
          const startTime = activeMap[event.noteNumber];
          if (startTime !== undefined) {
            notesResult.push({
              noteNumber: event.noteNumber,
              startSec: startTime,
              durationSec: eventTimeSec - startTime,
            });
            delete activeMap[event.noteNumber];
          }
        }
      });
    });
    return notesResult;
  }

  // State for harmonic amplitudes (1-8 harmonics)
  const [harmonicAmplitudes, setHarmonicAmplitudes] = useState({
    1: 1.0,
    2: 0.5,
    3: 0.2,
    4: 0.1,
    5: 0.05,
    6: 0.01,
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
    harmonicAmplitudes,
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
    vibratoDepth,
    vibratoRate,
    tremoloDepth,
    tremoloRate,
  );

  useEffect(() => {
    let interval;
    if (isPlaying && !isPaused && audioAnalysis.duration) {
      interval = setInterval(() => {
        setCurrentTime(audioAnalysis.getCurrentTime());
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused, audioAnalysis]);

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

  /**
   * Handles file uploads via file input (mp3, wav, ogg, midi), sets the file to be visualized.
   */
  async function handleConvertMp3(mp3File, hash) {
    console.log("handleConvertMp3");
    setIsConverting(true);
    setConversionComplete(false);
    try {
      let initialResponse = await fetch(
        'https://song-upload-bucket.s3.amazonaws.com/converted/'
          + hash + '.mid'
      );

      if (!initialResponse.ok) {
        console.log("Requesting upload URL");
        const restOperation = post({
          apiName: 'basicPitchApi',
          path: `/convert/song`,
          options: {
            body: {
              objectName: hash + '.mp3',
              contentType: mp3File.type,
            },
          },
        });
        const { body } = await restOperation.response;
        const response = await body.json();
        if (response.error) {
            console.error('Error Requesting Upload URL: ', response.error);
            setWarning(response.error);
            return;
        }
        const presignedUrl = response.url;
  
        console.log("Uploading MP3 to S3");
        // upload to s3
        await fetch(presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mp3File.type,
          },
          body: mp3File,
        });
  
        console.log("Waiting 60 seconds for file conversion");
        // wait 60 seconds
        await new Promise((resolve) => setTimeout(resolve, 60000));
  
        // fetch the converted .mid file
        let convertedFileResponse;
        let attempts = 0;
        const maxAttempts = 10;
        const delay = 10000; // 10 seconds
  
        while (attempts < maxAttempts) {
          convertedFileResponse = await fetch(
            'https://song-upload-bucket.s3.amazonaws.com/converted/'
              + hash + '.mid'
          );
  
          if (convertedFileResponse.ok) {
            console.log("Attempt Succeded");
            break;
          }
          console.log("Attempt Failed Trying again in 10 seconds");
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
  
        if (!convertedFileResponse.ok) {
          throw new Error('Failed to fetch the converted MIDI file.');
        }
  
        const blob = await convertedFileResponse.blob();
        const arrayBuffer = await blob.arrayBuffer();
        console.log("Parsing MIDI");
        const parsedMidi = parseMidi(new Uint8Array(arrayBuffer));
        console.log("Building Notes");
        const notes = buildNotes(parsedMidi);
        console.log("Finished Conversion");
        setMidiNotes(notes);
        setIsConverting(false);
        setConversionComplete(true);
      } else {
        const blob = await initialResponse.blob();
        const arrayBuffer = await blob.arrayBuffer();
        console.log("Parsing MIDI");
        const parsedMidi = parseMidi(new Uint8Array(arrayBuffer));
        console.log("Building Notes");
        const notes = buildNotes(parsedMidi);
        console.log("Finished Conversion");
        setMidiNotes(notes);
        setIsConverting(false);
        setConversionComplete(true);
      }
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setWarning('Conversion failed. Please try again.');
    }
  }

  async function computeFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return hash;
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setCurrentSongName(file.name.split('.')[0]);
      const fileName = file.name.toLowerCase();
      computeFileHash(file).then((hash) => {
        if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
          setMidiFile(file);
          setMp3File(null);
          setPianoEnabled(true);
        } else if (
          fileName.endsWith('.mp3') ||
          fileName.endsWith('.wav') ||
          fileName.endsWith('.ogg')
        ) {
          setMp3File(file);
          setMidiFile(null);
          handleConvertMp3(file, hash);
        }
      });
    }
  }

  // Render the main UI for the app
  return (
    <div className="App">
      <div className="main-container">
      <div className='SongTitle'>{isPlaying && <h1>{currentSongName}</h1>}</div>
        {/* Controls adjustable in real-time */}
        <div className="controls-row">
          {/* Select input for FFT bin size */}
          { !isPlaying && (
            <label className="control-label">
              FFT Size:
              <select
                className="control-select"
                value={bins}
                onChange={(e) => setBins(parseInt(e.target.value, 10))}
              >
                {[16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].map((power) => (
                  <option key={power} value={power}>
                    {power}
                  </option>
                ))}
              </select>
            </label>
          )}

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
                min="0.0"
                max="1.0"
                step="0.01"
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

          {/* Checkbox input to enable piano keyboard input */}
          {(!isPlaying) && (
            <label className="control-label">
              Piano
              <input
                className="control-checkbox"
                type="checkbox"
                checked={pianoEnabled}
                onChange={() => setPianoEnabled(!pianoEnabled)}
              />
            </label>
          )}
        </div>
        {/* Controls that cannot be adjusted during playback */}
        {!isPlaying && (
          <div>
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
              {/* visualization toggles */}
              {!isPlaying && (
                <>
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
                    Spectrograph
                    <input
                      className="control-checkbox"
                      type="checkbox"
                      checked={showSpectrograph}
                      onChange={() => setShowSpectrograph(!showSpectrograph)}
                    />
                  </label>
                </>
              )}
            </div>
        )}
        {/* Harmonic amplitude sliders */}
        {(pianoEnabled || midiFile) && (
            <div className="harmonic-sliders-container">
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((harmonic) => (
                <div key={harmonic}>
                  <label>
                    Harmonic {harmonic}:{' '}
                    {harmonicAmplitudes[harmonic].toFixed(2)}
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      value={harmonicAmplitudes[harmonic]}
                      onChange={(e) =>
                        handleHarmonicChange(harmonic, parseFloat(e.target.value))
                      }
                      className="harmonic-slider"
                    />
                  </label>
                </div>
              ))}
              <br />
              {/* ADSR sliders */}
              <div>
                <label>
                  Attack Time: {attackTime.toFixed(2)}s
                  <input
                    type="range"
                    min="0.01"
                    max="2"
                    step="0.01"
                    value={attackTime}
                    onChange={(e) => setAttackTime(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Decay Time: {decayTime.toFixed(2)}s
                  <input
                    type="range"
                    min="0.01"
                    max="2"
                    step="0.01"
                    value={decayTime}
                    onChange={(e) => setDecayTime(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Sustain Level: {sustainLevel.toFixed(2)}
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={sustainLevel}
                    onChange={(e) => setSustainLevel(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Release Time: {releaseTime.toFixed(2)}s
                  <input
                    type="range"
                    min="0.01"
                    max="2"
                    step="0.01"
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
                  Vibrato Depth: {vibratoDepth.toFixed(2)}
                  <input
                    type="range"
                    min="0.0"
                    max="100.0"
                    step="0.1"
                    value={vibratoDepth}
                    onChange={(e) => setVibratoDepth(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Vibrato Rate: {vibratoRate.toFixed(2)} Hz
                  <input
                    type="range"
                    min="0.0"
                    max="20.0"
                    step="0.1"
                    value={vibratoRate}
                    onChange={(e) => setVibratoRate(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              {/* Tremolo Sliders */}
              <div>
                <label>
                  Tremolo Depth: {tremoloDepth.toFixed(2)}
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.01"
                    value={tremoloDepth}
                    onChange={(e) => setTremoloDepth(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
              <div>
                <label>
                  Tremolo Rate: {tremoloRate.toFixed(2)} Hz
                  <input
                    type="range"
                    min="0.0"
                    max="20.0"
                    step="0.1"
                    value={tremoloRate}
                    onChange={(e) => setTremoloRate(parseFloat(e.target.value))}
                    className="harmonic-slider"
                  />
                </label>
              </div>
            </div>
          )}

        {/* Start/Stop and Use Mic buttons */}
        <div className="controls-row">
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
          {isConverting && <div>Loading...</div>}
          {warning && <div>{warning}</div>}
          <button
            className="control-button"
            onClick={handleStartStop}
            disabled={!conversionComplete && mp3File}
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
                      step="0.01"
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

      {/* Render the visualization component when audio is playing */}
      {(isPlaying) && (
        <div className='Visualizers-Container'>
          {showWaveform && <Waveform audioAnalysis={audioAnalysis} />}
          {showSpectrograph && (
            <SpectrographVisualizer
              showLabels={showLabels}
              showScroll={showScroll}
              audioAnalysis={audioAnalysis}
            />
          )}
          {audioAnalysis.midiNotes && !midiNotes && (
            <PianoRoll
              notes={audioAnalysis.midiNotes}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          )}
          {midiNotes && (
            <PianoRoll
              notes={midiNotes}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          )}
        </div>
      )}
    </div>
  );
}