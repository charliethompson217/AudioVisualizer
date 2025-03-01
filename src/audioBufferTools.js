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

export function monomix(buffer) {
    if (buffer.numberOfChannels > 1) {
      const leftCh = buffer.getChannelData(0);
      const rightCh = buffer.getChannelData(1);
      return leftCh.map((sample, i) => 0.5 * (sample + rightCh[i]));
    }
    return buffer.getChannelData(0);
  }
  
  export function downsampleArray(audioIn, sampleRateIn, sampleRateOut) {
    if (sampleRateOut === sampleRateIn) return audioIn;
    
    const sampleRateRatio = sampleRateIn / sampleRateOut;
    const newLength = Math.round(audioIn.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    
    let offsetResult = 0;
    let offsetAudioIn = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetAudioIn = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      
      for (let i = offsetAudioIn; i < nextOffsetAudioIn && i < audioIn.length; i++) {
        accum += audioIn[i];
        count++;
      }
      
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetAudioIn = nextOffsetAudioIn;
    }
    
    return result;
  }