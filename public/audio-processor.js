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

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; channel++) {
      if (input[channel]) {
        output[channel].set(input[channel]);
      }
    }

    if (input.length > 0) {
      const extractedData = [];
      for (let channel = 0; channel < input.length; channel++) {
        extractedData.push(new Float32Array(input[channel]));
      }

      this.port.postMessage({
        type: 'audioChunk',
        data: {
          extractedData,
          numberOfChannels: input.length,
        },
      });
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
