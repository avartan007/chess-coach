import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CHESS_SEQUENCE,
  getFrameIndex,
  interpolateCameraPos,
  interpolateCameraTarget,
} from './CHESS_SEQUENCE.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * CinematicCamera — drives camera position and look-at via scrollProgress.
 * Renders no JSX — purely a side-effect component living inside the Canvas.
 */
export default function CinematicCamera({ scrollProgress = 0, shake = false }) {
  const { camera } = useThree();

  // Smoothed camera position (persists between frames)
  const smoothedPos    = useRef(new THREE.Vector3(...CHESS_SEQUENCE[0].cameraPos));
  const lerpedTarget   = useRef(new THREE.Vector3(...CHESS_SEQUENCE[0].cameraTarget));

  useFrame(() => {
    const frameIndex  = getFrameIndex(scrollProgress);
    const currentFrame = CHESS_SEQUENCE[frameIndex];
    const nextFrame    = CHESS_SEQUENCE[Math.min(frameIndex + 1, CHESS_SEQUENCE.length - 1)];

    // Local t within this segment
    const segLen = Math.max(0.001, nextFrame.progress - currentFrame.progress);
    const localT = clamp((scrollProgress - currentFrame.progress) / segLen, 0, 1);

    // Interpolated target position and look-at
    const interpPos    = interpolateCameraPos(currentFrame, nextFrame, localT);
    const interpTarget = interpolateCameraTarget(currentFrame, nextFrame, localT);

    // Smooth lerp camera position
    smoothedPos.current.lerp(
      new THREE.Vector3(...interpPos),
      0.04
    );

    // Smooth lerp look-at target
    lerpedTarget.current.lerp(
      new THREE.Vector3(...interpTarget),
      0.04
    );

    // Apply position
    camera.position.copy(smoothedPos.current);

    // Camera shake
    if (shake) {
      camera.position.x += (Math.random() - 0.5) * 0.04;
      camera.position.y += (Math.random() - 0.5) * 0.04;
      camera.position.z += (Math.random() - 0.5) * 0.04;
    }

    // Look at smoothed target
    camera.lookAt(lerpedTarget.current);
    camera.updateProjectionMatrix();
  });

  return null;
}
