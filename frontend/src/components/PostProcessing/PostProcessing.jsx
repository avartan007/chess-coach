import React, { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * PostProcessing — Bloom + Vignette effects driven by scrollProgress.
 * Intentionally avoids DepthOfField to prevent camera setup conflicts.
 */
export default function PostProcessing({ scrollProgress = 0 }) {
  const bloomIntensity   = lerp(0.6, 1.4, scrollProgress);
  const vignetteDarkness = lerp(0.6, 1.4, scrollProgress);

  // Memoize so effect composer doesn't remount on every render
  const effects = useMemo(() => ({
    bloomIntensity,
    vignetteDarkness,
  }), [
    // Only update when values change by a noticeable threshold
    Math.round(bloomIntensity * 20) / 20,
    Math.round(vignetteDarkness * 20) / 20,
  ]);

  try {
    return (
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.4}
          height={300}
          intensity={effects.bloomIntensity}
        />
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={effects.vignetteDarkness}
        />
      </EffectComposer>
    );
  } catch (e) {
    // Graceful degradation if postprocessing fails to initialise
    console.warn('[PostProcessing] Effect composer failed to render:', e);
    return null;
  }
}
