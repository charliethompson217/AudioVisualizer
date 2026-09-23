export function createWaveformHistory(capacity) {
  const samples = new Float32Array(capacity);
  let count = 0;
  let cacheKey;
  let cache;

  return {
    append(chunk) {
      for (const sample of chunk) samples[count++ % capacity] = sample;
    },
    view(windowSamples, pixelWidth) {
      const length = Math.max(1, Math.min(capacity, Math.round(windowSamples)));
      const columns = Math.max(1, Math.floor(pixelWidth));
      const key = `${count}:${length}:${columns}`;
      if (key === cacheKey) return cache;
      const start = count - length;
      const oldest = Math.max(0, count - capacity);
      // Before history fills, represent the unavailable portion as silence without stretching time.
      const sampleAt = (index) => (index < oldest ? 0 : samples[index % capacity]);
      const envelope = length > columns;
      const points = [];
      const pointCount = Math.min(length, columns);
      for (let i = 0; i < pointCount; i++) {
        const from = envelope ? Math.floor((i * length) / pointCount) : i;
        const to = envelope ? Math.floor(((i + 1) * length) / pointCount) : i + 1;
        let min = Infinity;
        let max = -Infinity;
        for (let offset = from; offset < to; offset++) {
          const sample = sampleAt(start + offset);
          min = Math.min(min, sample);
          max = Math.max(max, sample);
        }
        points.push({
          min,
          max,
          first: sampleAt(start + from),
          last: sampleAt(start + to - 1),
        });
      }
      cacheKey = key;
      cache = { envelope, points };
      return cache;
    },
  };
}
