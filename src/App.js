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
    const [showLabels, setShowLabels] = useState(true);
    const [showScroll, setShowScroll] = useState(true);
    const [selectedInstrument, setSelectedInstrument] = useState('Instrument');

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

    return (
        <div className="App">
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <label>
                    Instrument:
                    <select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        disabled={isPlaying}
                    >
                        <option value="piano">Piano</option>
                        <option value="violin">Violin</option>
                        <option value="guitar">Guitar</option>
                        <option value="harp">Harp</option>
                        <option value="saxophone">Saxophone</option>
                        <option value="clarinet">Clarinet</option>
                        
                    </select>
                </label>

                <select
                    onChange={handleSongSelection}
                    disabled={isPlaying}
                >
                    <option value="">Select a Song</option>
                    {filteredSongs.map((song, index) => (
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
                    disabled={isPlaying}
                >
                    Use Mic
                </button>
                <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/ogg"
                    onChange={handleFileUpload}
                    disabled={isPlaying}
                />

                <label>
                    Bins:
                    <select
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value, 10))}
                        disabled={isPlaying}
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

                <label>
                    Smoothing:
                    <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.01"
                        value={smoothing}
                        onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                        style={{ color: 'white', webkitAppearance: 'none' }}
                        disabled={isPlaying}
                    />
                </label>

                <label>
                    Labels
                    <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={() => setShowLabels(!showLabels)}
                    />
                </label>

                <label>
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
            />
        </div>
    );
}
