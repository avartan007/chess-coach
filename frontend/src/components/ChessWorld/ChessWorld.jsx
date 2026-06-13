import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import CinematicBoard    from './CinematicBoard.jsx';
import ChessPieces       from './ChessPieces.jsx';
import SceneAtmosphere   from './SceneAtmosphere.jsx';
import CinematicCamera   from './CinematicCamera.jsx';
import PostProcessing    from '../PostProcessing/PostProcessing.jsx';

import { CHESS_SEQUENCE, getFrameIndex } from './CHESS_SEQUENCE.js';

/**
 * ChessWorld — the root Canvas container for the 3D chess cinematic.
 * Mounts fixed full-screen behind all scrollable page content.
 */
export default function ChessWorld({ scrollProgress = 0 }) {
  const frameIndex  = getFrameIndex(scrollProgress);
  const currentFrame = CHESS_SEQUENCE[frameIndex];

  const shake      = currentFrame.shake    ?? false;
  const glowMate   = currentFrame.glowMate ?? false;
  const dangerSqs  = currentFrame.dangerSqs ?? [];

  return (
    <Canvas
      className="fixed inset-0 pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: '#0A0805',
        pointerEvents: 'none'
      }}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      camera={{
        position: [0, 14, 18],
        fov: 55,
        near: 0.1,
        far: 200,
      }}
    >
      <CinematicCamera scrollProgress={scrollProgress} shake={shake} />
      <CinematicBoard  dangerSquares={dangerSqs} glowMate={glowMate} />
      <ChessPieces     scrollProgress={scrollProgress} />
      <SceneAtmosphere scrollProgress={scrollProgress} />
      <PostProcessing  scrollProgress={scrollProgress} />
    </Canvas>
  );
}
