import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SQUARE_SIZE = 1.2;

// Parse square string to file/rank indices
function squareToIndices(sq) {
  const file = sq.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(sq[1]) - 1;   // 1=0, 8=7
  return { file, rank };
}

// Compute world position for a square given fileIdx and rankIdx
function squareWorldPos(fileIdx, rankIdx) {
  const x = (fileIdx - 3.5) * SQUARE_SIZE;
  const z = (7 - rankIdx - 3.5) * SQUARE_SIZE;
  return [x, 0, z];
}

// Individual board square
function BoardSquare({ fileIdx, rankIdx, isDanger, isGlowMate }) {
  const meshRef = useRef();
  const isLight = (fileIdx + rankIdx) % 2 === 0;

  const baseColor = isLight ? '#DEDBC8' : '#8B6250';

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    if (isDanger) {
      const pulse = Math.sin(clock.getElapsedTime() * 3.0) * 0.5 + 0.5;
      mat.emissive.set('#ff1500');
      mat.emissiveIntensity = 0.05 + pulse * 0.25;
    } else if (isGlowMate) {
      const pulse = Math.sin(clock.getElapsedTime() * 2.5) * 0.5 + 0.5;
      mat.emissive.set('#ffffff');
      mat.emissiveIntensity = 0.4 + pulse * 0.3;
    } else {
      mat.emissive.set('#000000');
      mat.emissiveIntensity = 0;
    }
  });

  const [x, , z] = squareWorldPos(fileIdx, rankIdx);

  return (
    <mesh
      ref={meshRef}
      position={[x, 0.0, z]}
      receiveShadow
      castShadow={false}
    >
      <boxGeometry args={[SQUARE_SIZE, 0.12, SQUARE_SIZE]} />
      <meshStandardMaterial
        color={baseColor}
        roughness={isLight ? 0.4 : 0.35}
        metalness={isLight ? 0.05 : 0.1}
        emissive="#000000"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

export default function CinematicBoard({ dangerSquares = [], glowMate = false }) {
  // Build a set of danger squares for O(1) lookup
  const dangerSet = useMemo(() => new Set(dangerSquares), [dangerSquares]);

  // Build all 64 squares
  const squares = useMemo(() => {
    const result = [];
    for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        const file = String.fromCharCode(97 + fileIdx);
        const rank = rankIdx + 1;
        const sqName = `${file}${rank}`;
        result.push({ fileIdx, rankIdx, sqName });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {/* Board frame base */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[10.2, 0.08, 10.2]} />
        <meshStandardMaterial
          color="#1a0e08"
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* 64 squares */}
      {squares.map(({ fileIdx, rankIdx, sqName }) => (
        <BoardSquare
          key={sqName}
          fileIdx={fileIdx}
          rankIdx={rankIdx}
          isDanger={dangerSet.has(sqName)}
          isGlowMate={glowMate && sqName === 'f7'}
        />
      ))}

      {/* Reflective floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <MeshReflectorMaterial
          mirror={0.4}
          blur={[400, 100]}
          mixBlur={6}
          mixStrength={0.8}
          roughness={1}
          depthScale={1.2}
          color="#0A0805"
          metalness={0}
        />
      </mesh>
    </group>
  );
}
