import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 240;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Floating dust particles drifting upward with a gentle swirl
 */
function DustParticles() {
  const pointsRef = useRef();
  const positionsRef = useRef(null);

  // Initial random positions
  const initialPositions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16; // X: -8 to 8
      positions[i * 3 + 1] = Math.random() * 12;           // Y: 0 to 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16; // Z: -8 to 8
    }
    return positions;
  }, []);

  // Keep a mutable copy for animation
  if (!positionsRef.current) {
    positionsRef.current = new Float32Array(initialPositions);
  }

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const positions = positionsRef.current;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Drift upward
      positions[idx + 1] += 0.005;

      // Wrap when above max height
      if (positions[idx + 1] > 12) {
        positions[idx + 1] = 0;
      }

      // Gentle swirl on X/Z using sin/cos of time and particle index
      const phase = i * 0.42 + t * 0.18;
      positions[idx + 0] += Math.sin(phase) * 0.002;
      positions[idx + 2] += Math.cos(phase) * 0.002;

      // Soft boundary clamping so particles stay roughly within range
      if (positions[idx + 0] > 8)  positions[idx + 0] -= 16;
      if (positions[idx + 0] < -8) positions[idx + 0] += 16;
      if (positions[idx + 2] > 8)  positions[idx + 2] -= 16;
      if (positions[idx + 2] < -8) positions[idx + 2] += 16;
    }

    pointsRef.current.geometry.attributes.position.array.set(positions);
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsRef.current, 3]}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#F0AB6C"
        size={0.04}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * SceneAtmosphere — all lights, fog, and particles for the cinematic scene.
 */
export default function SceneAtmosphere({ scrollProgress = 0 }) {
  const { scene } = useThree();

  const ambientRef       = useRef();
  const spotRef          = useRef();
  const fillRef          = useRef();
  const lowFillRef       = useRef();
  const rimRef           = useRef();

  const fogRef = useRef(null);

  // Initialise and clean up fog exp2 on mount/unmount
  React.useEffect(() => {
    const fog = new THREE.FogExp2('#0A0805', 0.008);
    scene.fog = fog;
    fogRef.current = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const t = clamp(scrollProgress, 0, 1);

    // Ambient
    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(1.8, 0.6, t);
    }

    // Main spot
    if (spotRef.current) {
      spotRef.current.intensity = lerp(12, 8, t);
    }

    // Dramatic low fill (only active above scroll 0.5)
    if (lowFillRef.current) {
      const intensity = t > 0.5 ? (t - 0.5) * 8 : 0;
      lowFillRef.current.intensity = intensity;
    }

    // Cold blue rim (active above scroll 0.45)
    if (rimRef.current) {
      const intensity = t > 0.45 ? (t - 0.45) * 1.5 : 0;
      rimRef.current.intensity = intensity;
    }

    // Fog density
    if (fogRef.current) {
      fogRef.current.density = lerp(0.008, 0.022, t);
    }
  });

  return (
    <group>
      {/* Ambient */}
      <ambientLight ref={ambientRef} color="#2c1d15" intensity={1.8} />

      {/* Main spot */}
      <spotLight
        ref={spotRef}
        position={[8, 16, 8]}
        color="#fff5e0"
        intensity={12}
        angle={Math.PI / 5}
        penumbra={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />

      {/* Fill directional */}
      <directionalLight
        ref={fillRef}
        position={[-6, 10, -6]}
        color="#e0c8a8"
        intensity={0.8}
      />

      {/* Dramatic low fill – deep red PointLight (scroll > 0.5) */}
      <pointLight
        ref={lowFillRef}
        position={[0, 2, 0]}
        color="#4a0000"
        intensity={0}
        distance={12}
        decay={2}
      />

      {/* Cold blue rim (scroll > 0.45) */}
      <directionalLight
        ref={rimRef}
        position={[0, 5, -10]}
        color="#304080"
        intensity={0}
      />

      {/* Floating dust */}
      <DustParticles />
    </group>
  );
}
