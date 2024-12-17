import React, { useState, useEffect } from 'react';
import SpectrographVisualizer from './SpectrographVisualizer';
import './App.css';
import KeyboardSVG from './KeyboardSVG';
import Waveform from './WaveformVisualizer.js';
import { useAudioAnalysis } from './useAudioAnalysis.js';
import songList from './songList';


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
  const [selectedInstrument, setSelectedInstrument] = useState('none');
  const [pianoEnabled, setPianoEnabled] = useState(true);
  const [brightnessPower, setBrightnessPower] = useState(1);

  const [showWaveform, setShowWaveform] = useState(true);
  const [showSpectrograph, setShowSpectrograph] = useState(true);

  const [currentSongName, setCurrentSongName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Base URL for accessing MP3 files hosted on S3
  const S3_BASE_URL = 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com/songs';

  function handleSongSelection(e) {
    const selectedSongPath = e.target.value;
    const url = `${S3_BASE_URL}/${selectedSongPath}`;
    const songName = e.target.options[e.target.selectedIndex].text;
    setCurrentSongName( selectedSongPath.split('%')[0].charAt(0).toUpperCase() + selectedSongPath.split('%')[0].slice(1)+ " - " + songName);
    if (url.endsWith('.mid')) {
      setMidiFile(url);
      setMp3File(null);
      setPianoEnabled(true);
    } else {
      setMp3File(url);
      setMidiFile(null);
    }
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
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setCurrentSongName(file.name.split('.')[0]);
      const fileName = file.name.toLowerCase();
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
      }
    }
  }

  /**
   * Filters the song list based on the selected instrument category.
   */
  const filteredSongs =
    selectedInstrument === 'all' || selectedInstrument === ''
      ? songList
      : songList.filter((song) => song.instrument === selectedInstrument);

  /**
   * Sorts songs either numerically by title (for 'test' files) or alphabetically by title for other instruments.
   */
  const sortedSongs =
    selectedInstrument === 'test'
      ? filteredSongs.sort((a, b) => parseFloat(a.title) - parseFloat(b.title))
      : filteredSongs.sort((a, b) => a.title.localeCompare(b.title));

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
          {/* Harmonic amplitude sliders */}
          {(pianoEnabled || midiFile) && (
            <div className="harmonic-sliders-container">
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
        </div>

        {/* Controls that cannot be adjusted during playback */}
        {!isPlaying && (
          <div>
            <div className="song-selection-row">
              {/* Dropdown to select an instrument category for filtering songs */}
              <label className="instrument-label">
                <select
                  className="control-select"
                  value={selectedInstrument}
                  onChange={(e) => setSelectedInstrument(e.target.value)}
                >
                  <option value="">Select an Instrument</option>
                  <option value="piano">Piano</option>
                  <option value="violin">Violin</option>
                  <option value="guitar">Guitar</option>
                  <option value="harp">Harp</option>
                  <option value="saxophone">Saxophone</option>
                  <option value="clarinet">Clarinet</option>
                  <option value="drums">Drums</option>
                  <option value="cello">Cello</option>
                  <option value="flute">Flute</option>
                  <option value="trumpet">Trumpet</option>
                  <option value="test">Test Files</option>
                  <option value="midi">MIDI</option>
                </select>
              </label>

              {/* Dropdown to select a specific song from the filtered list */}
              <select className="control-select" onChange={handleSongSelection}>
                <option value="">Select a Song</option>
                {sortedSongs.map((song, index) => (
                  <option
                    key={index}
                    value={encodeURIComponent(`${song.instrument}/${song.file}`)}
                  >
                    {song.title}
                  </option>
                ))}
              </select>
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
          <button className="control-button" onClick={handleStartStop}>
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
              brightnessPower={brightnessPower}
              audioAnalysis={audioAnalysis}
            />
          )}
        </div>
      )}
    </div>
  );
}