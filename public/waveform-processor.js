// Capture a mono waveform continuously, independently of analyser FFT settings.
class WaveformProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Float32Array(256);
    this.offset = 0;
  }

  process(inputs) {
    const channels = inputs[0];
    if (!channels.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      let sample = 0;
      for (const channel of channels) sample += channel[i];
      this.samples[this.offset++] = sample / channels.length;
      if (this.offset === this.samples.length) {
        this.port.postMessage(this.samples, [this.samples.buffer]);
        this.samples = new Float32Array(256);
        this.offset = 0;
      }
    }
    // Leave the output silent so the capture branch does not duplicate playback.
    return true;
  }
}

registerProcessor('waveform-processor', WaveformProcessor);
