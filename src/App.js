import React, { useState } from 'react';
import FinerResolution2 from './FinerResolution2';
import songList from './songList';
import './App.css';

export default function App() {
    const [mp3File, setMp3File] = useState(null);
    const [useMic, setUseMic] = useState(false);
    const [bins, setBins] = useState(32768);
    const [smoothing, setSmoothing] = useState(0.8);
    const [isPlaying, setIsPlaying] = useState(false);
    const [minDecibels, setMinDecibels] = useState(-100);
    const [maxDecibels, setMaxDecibels] = useState(-30);
    const [showLabels, setShowLabels] = useState(true);
    const [showScroll, setShowScroll] = useState(true);
    const [selectedInstrument, setSelectedInstrument] = useState('none');

    function handleStartStop() {
        if (isPlaying) {
            location.reload();
        } else {
            setIsPlaying(true);
        }
    }

    function handleSongSelection(e) {
        const selectedSong = e.target.value;
        setMp3File(`/songs/${selectedInstrument}/${selectedSong}`);
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            setMp3File(URL.createObjectURL(file));
        }
    }

    const filteredSongs = selectedInstrument === 'all'
        ? songList
        : songList.filter(song => song.instrument === selectedInstrument);
    
    const sortedSongs = filteredSongs.sort((a, b) => a.title.localeCompare(b.title));

    return (
        <div className="App">
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <label hidden={isPlaying}>
                    <select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        hidden={isPlaying}
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
                        
                    </select>
                </label>

                <select
                    onChange={handleSongSelection}
                    hidden={isPlaying}
                >
                    <option value="">Select a Song</option>
                    {sortedSongs.map((song, index) => (
                        <option key={index} value={song.file}>
                            {song.title}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => {
                        setUseMic(true);
                        handleStartStop();
                    }}
                    hidden={isPlaying}
                >
                    Use Mic
                </button>
                <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/ogg"
                    onChange={handleFileUpload}
                    hidden={isPlaying}
                />

                <label hidden={isPlaying}>
                    Bins:
                    <select
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value, 10))}
                        hidden={isPlaying}
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

                <label hidden={isPlaying}>
                    Min Decibels:
                    {minDecibels} dB
                    <input
                        type="range"
                        min="-120"
                        max="0"
                        step="1"
                        value={minDecibels}
                        onChange={(e) => setMinDecibels(parseFloat(e.target.value))}
                        style={{ color: 'white', WebkitAppearance: 'none' }}
                    />
                </label>

                <label hidden={isPlaying}>
                    Max Decibels:
                    {maxDecibels} dB
                    <input
                        type="range"
                        min="-120"
                        max="0"
                        step="1"
                        value={maxDecibels}
                        onChange={(e) => setMaxDecibels(parseFloat(e.target.value))}
                        style={{ color: 'white', WebkitAppearance: 'none' }}
                        hidden={isPlaying}
                    />
                </label>

                <label hidden={isPlaying}>
                    Smoothing:
                    <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.01"
                        value={smoothing}
                        onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                        style={{ color: 'white', WebkitAppearance: 'none' }}
                        hidden={isPlaying}
                    />
                </label>

                <label hidden={isPlaying}>
                    Labels
                    <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={() => setShowLabels(!showLabels)}
                    />
                </label>

                <label hidden={isPlaying}>
                    Bar
                    <input
                        type="checkbox"
                        checked={showScroll}
                        onChange={() => setShowScroll(!showScroll)}
                    />
                </label>

                <button onClick={handleStartStop}>
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
            </div>

            <FinerResolution2
                mp3File={mp3File}
                useMic={useMic}
                bins={bins}
                smoothing={smoothing}
                isPlaying={isPlaying}
                showLabels={showLabels}
                showScroll={showScroll}
                minDecibels={minDecibels}
                maxDecibels={maxDecibels}
            />
        </div>
    );
}
