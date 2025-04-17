import React from 'react';

export default function BasicPitchSettings({
  generateBrowserMIDI,
  setGenerateBrowserMIDI,
  onsetThreshold,
  setOnsetThreshold,
  frameThreshold,
  setFrameThreshold,
  minDurationSec,
  setMinDurationSec,
}) {
  return (
    <div>
      <div className="control-label">
        <input
          className="control-checkbox"
          type="checkbox"
          checked={generateBrowserMIDI}
          onChange={() => setGenerateBrowserMIDI(!generateBrowserMIDI)}
        />
        <label style={{ pointerEvents: 'none', cursor: 'default' }}>Generate MIDI</label>
      </div>
      {generateBrowserMIDI && (
        <>
          <label className="control-label">
            Onset Threshold
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={onsetThreshold}
              onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
          <label className="control-label">
            Frame Threshold
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={frameThreshold}
              onChange={(e) => setFrameThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
          <label className="control-label">
            Min Duration (sec)
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={minDurationSec}
              onChange={(e) => setMinDurationSec(parseFloat(e.target.value))}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </label>
        </>
      )}
    </div>
  );
}
