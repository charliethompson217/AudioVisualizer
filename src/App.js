import React, { useState } from 'react';
import Visualizer from './Visualizer';  // Import the frequency visualization component
import songList from './songList';  // Import the list of songs
import './App.css';  // Import CSS styles
import KeyboardSVG from './KeyboardSVG';

export default function App() {
    // React state hooks to manage various input parameters and settings for the audio visualization
    const [mp3File, setMp3File] = useState(null);  // Stores the path or URL of the MP3 file to be visualized
    const [midiFile, setMidiFile] = useState(null); // State to handle MIDI file
    const [useMic, setUseMic] = useState(false);  // Boolean: if true, the microphone is used as the audio input source
    const [bins, setBins] = useState(32768);  // FFT size, controls frequency resolution (must be a power of 2)
    const [smoothing, setSmoothing] = useState(0.8);  // Smoothing factor for FFT data (0-1 range)
    const [isPlaying, setIsPlaying] = useState(false);  // Boolean: tracks whether the visualization is running
    const [minDecibels, setMinDecibels] = useState(-100);  // Minimum decibel threshold for the analyser
    const [maxDecibels, setMaxDecibels] = useState(-30);  // Maximum decibel threshold for the analyser
    const [showLabels, setShowLabels] = useState(true);  // Boolean: controls whether musical note labels are shown
    const [showScroll, setShowScroll] = useState(true);  // Boolean: controls whether the frequency scroll bar is shown
    const [selectedInstrument, setSelectedInstrument] = useState('none');  // Tracks the currently selected instrument filter
    const [pianoEnabled, setPianoEnabled] = useState(false);  // Boolean: enables or disables piano keyboard input

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
        setHarmonicAmplitudes(prevAmplitudes => ({
            ...prevAmplitudes,
            [harmonic]: value,
        }));
    }

    // ADSR envelope state variables
    const [attackTime, setAttackTime] = useState(0.01);  // Attack time in seconds
    const [decayTime, setDecayTime] = useState(0.3);  // Decay time in seconds
    const [sustainLevel, setSustainLevel] = useState(0.2);  // Sustain level (0-1 range)
    const [releaseTime, setReleaseTime] = useState(0.5);  // Release time in seconds

    // Base URL for accessing MP3 files hosted on S3
    const S3_BASE_URL = 'https://audio-visualizer-zongs.s3.us-east-2.amazonaws.com/songs';

    /**
     * Toggles the audio playback state. If already playing, reloads the page to stop.
     * Otherwise, starts playback.
     */
    function handleStartStop() {
        if (isPlaying) {
            location.reload();  // Reload page to stop the audio playback and visualization
        } else {
            setIsPlaying(true);  // Start playing and visualizing the selected audio
        }
    }

    /**
     * Handles song selection from the dropdown, sets the selected MP3 file URL.
     */
    function handleSongSelection(e) {
        const selectedSongPath = e.target.value;  // Get the file path of the selected song
        const url = `${S3_BASE_URL}/${selectedSongPath}`
        if (url.endsWith('.mid')){
            setMidiFile(url);
        }
        else {
            setMp3File(url);  // Construct the full URL from the S3 base URL and set mp3File
        }
    }

    /**
     * Handles file uploads via file input (mp3, wav, ogg), sets the file to be visualized.
     */
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
          if (file.name.endsWith('.mid') || file.name.endsWith('.midi') || file.name.endsWith('.MID') || file.name.endsWith('.MIDI')) {
            setMidiFile(file);  // Set the MIDI file as a File object
          } else if (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg') || file.name.endsWith('.MP3') || file.name.endsWith('.WAV') || file.name.endsWith('.OGG')) {
            setMp3File(file);  // Set the MP3 file as a File object
          }
        }
      }

    /**
     * Filters the song list based on the selected instrument category.
     * Returns all songs if 'all' or none is selected, otherwise filters by instrument.
     */
    const filteredSongs = selectedInstrument === 'all' || selectedInstrument === ''
        ? songList  // If "all" is selected, return the full song list
        : songList.filter(song => song.instrument === selectedInstrument);  // Otherwise, filter songs by selected instrument

    /**
     * Sorts songs either numerically by title (for 'test' files) or alphabetically by title for other instruments.
     */
    const sortedSongs = selectedInstrument === 'test' 
        ? filteredSongs.sort((a, b) => parseFloat(a.title) - parseFloat(b.title))  // Sort test files numerically by title
        : filteredSongs.sort((a, b) => a.title.localeCompare(b.title));  // Sort alphabetically by title for other categories

    // Render the main UI for the app
    return (
        <div className="App">  {/* Root container for the app */}
            <div className="main-container">  {/* Main container for controls */}
                
                {/* Only show controls when not playing */}
                {!isPlaying && (
                    <div>
                        <div className="controls-row">  {/* Controls row */}
                            
                            {/* Select input for FFT bin size */}
                            <label className="control-label">
                                Bins:
                                <select
                                    className="control-select"
                                    value={bins}
                                    onChange={(e) => setBins(parseInt(e.target.value, 10))}  // Update FFT bin size when changed
                                >
                                    {[16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].map(
                                        (power) => (
                                            <option key={power} value={power}>
                                                {power}
                                            </option>
                                        )
                                    )}
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
                                    max="0"
                                    step="1"
                                    value={minDecibels}
                                    onChange={(e) => setMinDecibels(parseFloat(e.target.value))}  // Update min decibels on change
                                />
                            </label>

                            {/* Slider input for maximum decibel threshold */}
                            <label className="control-label">
                                Max Decibels:
                                <span>{maxDecibels} dB</span>
                                <input
                                    className="control-slider"
                                    type="range"
                                    min="-120"
                                    max="0"
                                    step="1"
                                    value={maxDecibels}
                                    onChange={(e) => setMaxDecibels(parseFloat(e.target.value))}  // Update max decibels on change
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
                                    onChange={(e) => setSmoothing(parseFloat(e.target.value))}  // Update smoothing factor on change
                                />
                            </label>

                            {/* Checkbox input to toggle showing note labels */}
                            <label className="control-label">
                                Labels
                                <input
                                    className="control-checkbox"
                                    type="checkbox"
                                    checked={showLabels}  // Show or hide note labels
                                    onChange={() => setShowLabels(!showLabels)}  // Toggle showLabels on change
                                />
                            </label>

                            {/* Checkbox input to toggle showing the scroll bar */}
                            <label className="control-label">
                                Bar
                                <input
                                    className="control-checkbox"
                                    type="checkbox"
                                    checked={showScroll}  // Show or hide the frequency scroll bar
                                    onChange={() => setShowScroll(!showScroll)}  // Toggle showScroll on change
                                />
                            </label>

                            {/* Checkbox input to enable piano keyboard input */}
                            <label className="control-label">
                                Piano
                                <input
                                    className="control-checkbox"
                                    type="checkbox"
                                    checked={pianoEnabled}  // Enable or disable piano input
                                    onChange={() => { setPianoEnabled(!pianoEnabled) }}  // Toggle piano input on change
                                />
                            </label>

                            {/* Harmonic amplitude sliders, visible only if piano is enabled and not playing*/}
                            {(pianoEnabled || midiFile)&& (
                                <div className="harmonic-sliders-container">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((harmonic) => (
                                        <div key={harmonic}>
                                            <label>
                                                Harmonic {harmonic}: {harmonicAmplitudes[harmonic].toFixed(2)}
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
                                    {/* ADSR sliders*/}
                                    <div>
                                        <label>
                                            Attack Time: {attackTime.toFixed(2)}s
                                            <input
                                                type="range"
                                                min="0"
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
                                                min="0"
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
                                                min="0"
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
                                                min="0"
                                                max="2"
                                                step="0.01"
                                                value={releaseTime}
                                                onChange={(e) => setReleaseTime(parseFloat(e.target.value))}
                                                className="harmonic-slider"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}  
                        </div>

                        <div className="song-selection-row">
                            {/* Dropdown to select an instrument category for filtering songs */}
                            <label className="instrument-label">
                                <select
                                    className="control-select"
                                    value={selectedInstrument}  // Current selected instrument
                                    onChange={(e) => setSelectedInstrument(e.target.value)}  // Update selected instrument on change
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
                                    <option value="test">Test Files</option>
                                    <option value="midi">MIDI</option>
                                </select>
                            </label>

                            {/* Dropdown to select a specific song from the filtered list */}
                            <select className="control-select" onChange={handleSongSelection}>
                                <option value="">Select a Song</option>
                                {sortedSongs.map((song, index) => (
                                    <option key={index} value={encodeURIComponent(`${song.instrument}/${song.file}`)}>
                                        {song.title}  {/* Display the song title */}
                                    </option>
                                ))}
                            </select>
                            {/* File input for uploading local audio files (mp3, wav, ogg) */}
                            <label>
                                mp3, wav, ogg, midi  -
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="audio/mp3,audio/wav,audio/ogg,audio/midi"
                                    onChange={handleFileUpload}  // Handle file upload
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* Button to use microphone input */}
                <button
                    className="control-button"
                    onClick={() => {
                        setUseMic(true);  // Enable microphone input
                        handleStartStop();  // Start playback
                    }}
                    hidden={isPlaying}  // Hide this button when playback is active
                >
                    Use Mic
                </button>
                <div className="controls-row">
                    {/* Button to toggle between play and stop states */}
                    <button className="control-button" onClick={handleStartStop}>
                        {isPlaying ? 'Stop' : 'Play'}  {/* Button text toggles based on playback state */}
                    </button>
                </div>
                
                {/* Only show keyboard when piano is enabled and not playing */}
                {!isPlaying && pianoEnabled && (
                    <div className="keyboard-container">
                        <KeyboardSVG />
                    </div>
                )}
            </div>
             
            {/* Render the frequency visualization component when audio is playing */}
            {isPlaying ? (
                <Visualizer
                    mp3File={mp3File}  // Path or URL to the MP3 file
                    midiFile={midiFile} // Pass the MIDI file state here
                    useMic={useMic}  // Use microphone input if true
                    bins={bins}  // FFT bin size
                    smoothing={smoothing}  // Smoothing factor
                    isPlaying={isPlaying}  // Whether playback is active
                    showLabels={showLabels}  // Show musical note labels
                    showScroll={showScroll}  // Show frequency scroll bar
                    minDecibels={minDecibels}  // Minimum decibel threshold
                    maxDecibels={maxDecibels}  // Maximum decibel threshold
                    pianoEnabled={pianoEnabled}  // Enable piano input if true
                    harmonicAmplitudes={harmonicAmplitudes} // Pass harmonic amplitudes to the hook
                    ATTACK_TIME={attackTime}  // Pass ADSR attack time
                    DECAY_TIME={decayTime}  // Pass ADSR decay time
                    SUSTAIN_LEVEL={sustainLevel}  // Pass ADSR sustain level
                    RELEASE_TIME={releaseTime}  // Pass ADSR release time
                />
            ) : null}
        </div>
    );
}
