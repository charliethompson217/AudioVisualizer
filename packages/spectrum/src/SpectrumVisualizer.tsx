'use client';

// Copyright (C) 2024 Charles Thompson. SPDX-License-Identifier: MIT
import { useEffect, useRef, type CSSProperties } from 'react';
import { createSpectrumVisualizer, type SpectrumVisualizerInstance } from './createSpectrumVisualizer.js';
import { FILL_CONTAINER_STYLE, resolveOptions, type SpectrumVisualizerOptions } from './options.js';

export interface SpectrumVisualizerProps extends Omit<SpectrumVisualizerOptions, 'ariaLabel'> {
  /** Applied to the outer sizing container. */
  className?: string;
  /** Outer-container styles; overrides the default sizing styles. */
  style?: CSSProperties;
  /** Accessible canvas description. Default: 'Audio frequency spectrum'. */
  'aria-label'?: string;
}

/** React lifecycle adapter for the framework-independent createSpectrumVisualizer API. */
export function SpectrumVisualizer({ className, style, 'aria-label': ariaLabel, ...options }: SpectrumVisualizerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<SpectrumVisualizerInstance | null>(null);
  const resolved = resolveOptions({ ...options, ariaLabel });

  useEffect(() => {
    if (!hostRef.current) return;
    const instance = createSpectrumVisualizer(hostRef.current);
    instanceRef.current = instance;
    return () => {
      instanceRef.current = null;
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    // Send a complete resolved snapshot so removing a React prop restores its default.
    // The React-owned host handles caps and style overrides; the inner view fills that host.
    instanceRef.current?.update({ ...resolved, maxWidth: null, maxHeight: null });
  });

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        ...FILL_CONTAINER_STYLE,
        maxWidth: resolved.maxWidth ?? undefined,
        maxHeight: resolved.maxHeight ?? undefined,
        ...style,
      }}
    />
  );
}
