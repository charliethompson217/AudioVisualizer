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