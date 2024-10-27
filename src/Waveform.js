import React, { useRef, useEffect } from 'react';

export default function WaveformVisualizer({
    audioAnalysis
}) {
    const sketchRef = useRef();
    const { analyser, dataArray } = audioAnalysis;
    useEffect(() => {
        if (!analyser || !dataArray) return;

        const sketch = (p) => {
            let canvas;

            p.setup = () => {
                const width = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const height = 100;
                canvas = p.createCanvas(width, height);
                canvas.parent(sketchRef.current);
                p.pixelDensity(3);
            };

            p.draw = () => {
                p.background(0);

                analyser.getByteTimeDomainData(dataArray); // Get waveform data
                const middle = p.height / 2;

                p.stroke(255);
                p.noFill();
                p.beginShape();
                for (let i = 0; i < dataArray.length; i++) {
                    const x = (i / dataArray.length) * p.width;
                    const y = middle + ((dataArray[i] - 128) / 128) * middle;
                    p.vertex(x, y);
                }
                p.endShape();
            };
        };

        new window.p5(sketch);

        return () => {
            if (analyser) analyser.disconnect();
        };
    }, [analyser, dataArray]);

    return <div ref={sketchRef}></div>;
}