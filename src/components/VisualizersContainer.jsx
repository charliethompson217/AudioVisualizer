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

import React from 'react';
import BarGraphSpectrograph from './visualizers/BarGraphSpectrograph';
import WaterfallSpectrograph from './visualizers/WaterfallSpectrograph';
import Waveform from './visualizers/Waveform';
import PianoRoll from './visualizers/PianoRoll';
import SpectrographControls from './SpectrographControls';
import SynthesizerSettings from './SynthesizerSettings';
import ChromavectorCircleGraph from './visualizers/ChromavectorCircleGraph';
import ChromevectorLineGraph from './visualizers/ChromevectorLineGraph';
import SpectralSpreadGraph from './visualizers/SpectralSpreadGraph';
import RMS from './visualizers/RMS';
import Loudness from './visualizers/Loudness';
import ChromavectorBarGraph from './visualizers/ChromavectorBarGraph';
import Posteriorgram from './visualizers/Posteriorgram';
import CircleGraphSpectrograph from './visualizers/CircleGraphSpectrograph';
import SpiralSpectrograph from './visualizers/SpiralSpectrograph';

export default function VisualizersContainer({
  isPlaying,
  showBarSpectrograph,
  showCircleSpectrograph,
  showSpiralSpectrograph,
  showWaterfallSpectrograph,
  showWaveform,
  bins,
  setBins,
  minDecibels,
  setMinDecibels,
  maxDecibels,
  setMaxDecibels,
  smoothing,
  setSmoothing,
  showLabels,
  setShowLabels,
  showScroll,
  setShowScroll,
  audio,
  noteHues,
  pianoEnabled,
  midiFile,
  midiNotes,
  synthesizerSettings,
  setSynthesizerSettings,
  selectedPreset,
  setSelectedPreset,
  presets,
  chromaCircle,
  spectralSpreadGraph,
  chromaLine,
  chromaBar,
  rms,
  loudness,
  meydaBufferSize,
  generateBrowserMIDI,
  onsetThreshold,
  setOnsetThreshold,
  frameThreshold,
  setFrameThreshold,
  minDurationSec,
  setMinDurationSec,
  showPosteriorgram,
  basicPitchData,
}) {
  return (
    <div className="Visualizers-Container">
      {isPlaying && (
        <>
          {chromaCircle && <ChromavectorCircleGraph chroma={audio.chroma} isPlaying={isPlaying} noteHues={noteHues} />}

          {spectralSpreadGraph && (
            <SpectralSpreadGraph
              spectralCentroid={audio.spectralCentroid}
              spectralSpread={audio.spectralSpread}
              isPlaying={isPlaying}
              sampleRate={audio.sampleRate}
              bufferSize={meydaBufferSize}
            />
          )}

          {chromaLine && <ChromevectorLineGraph chroma={audio.chroma} isPlaying={isPlaying} noteHues={noteHues} />}

          {chromaBar && <ChromavectorBarGraph chroma={audio.chroma} isPlaying={isPlaying} noteHues={noteHues} />}

          {rms && <RMS rms={audio.rms} isPlaying={isPlaying} />}

          {loudness && <Loudness loudness={audio.loudness} isPlaying={isPlaying} />}

          {(showBarSpectrograph || showWaterfallSpectrograph || showCircleSpectrograph || showSpiralSpectrograph) && (
            <>
              <SpectrographControls
                bins={bins}
                setBins={setBins}
                minDecibels={minDecibels}
                setMinDecibels={setMinDecibels}
                maxDecibels={maxDecibels}
                setMaxDecibels={setMaxDecibels}
                smoothing={smoothing}
                setSmoothing={setSmoothing}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                showScroll={showScroll}
                setShowScroll={setShowScroll}
              />

              {showBarSpectrograph && (
                <BarGraphSpectrograph
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audio={audio}
                  noteHues={noteHues}
                />
              )}

              {showCircleSpectrograph && (
                <CircleGraphSpectrograph
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audio={audio}
                  noteHues={noteHues}
                />
              )}

              {showSpiralSpectrograph && (
                <SpiralSpectrograph
                  isSpiral={true}
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audio={audio}
                  noteHues={noteHues}
                />
              )}

              {showWaterfallSpectrograph && (
                <WaterfallSpectrograph
                  showLabels={showLabels}
                  showScroll={showScroll}
                  audio={audio}
                  noteHues={noteHues}
                />
              )}
            </>
          )}

          {showWaveform && <Waveform audio={audio} />}
        </>
      )}

      {(pianoEnabled || midiFile) && (
        <SynthesizerSettings
          synthesizerSettings={synthesizerSettings}
          setSynthesizerSettings={setSynthesizerSettings}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          presets={presets}
        />
      )}
      {generateBrowserMIDI && showPosteriorgram && isPlaying && (
        <Posteriorgram isPlaying={isPlaying} basicPitchData={basicPitchData} noteHues={noteHues} />
      )}
      {isPlaying && (midiNotes || generateBrowserMIDI) && (
        <PianoRoll
          notes={midiNotes}
          isPlaying={isPlaying}
          noteHues={noteHues}
          generateBrowserMIDI={generateBrowserMIDI}
          onsetThreshold={onsetThreshold}
          setOnsetThreshold={setOnsetThreshold}
          frameThreshold={frameThreshold}
          setFrameThreshold={setFrameThreshold}
          minDurationSec={minDurationSec}
          setMinDurationSec={setMinDurationSec}
        />
      )}
    </div>
  );
}
