import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Material helpers ────────────────────────────────────────────────────────

function useChessMaterial(isWhite) {
  return useMemo(() => {
    if (isWhite) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#DEDBC8'),
        roughness: 0.3,
        metalness: 0.15,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
      });
    } else {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#0E0C0A'),
        roughness: 0.2,
        metalness: 0.45,
        emissive: new THREE.Color('#1a0800'),
        emissiveIntensity: 0.06,
      });
    }
  }, [isWhite]);
}

// ─── Piece mesh definitions ──────────────────────────────────────────────────

function PawnMeshes({ mat }) {
  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.28, 0.48, 14]} />
      </mesh>
      <mesh material={mat} position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
      </mesh>
    </group>
  );
}

function RookMeshes({ mat }) {
  const crenelPositions = [
    [0, 0, -0.22],
    [0, 0,  0.22],
    [-0.22, 0, 0],
    [ 0.22, 0, 0],
  ];
  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.49, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 0.7, 16]} />
      </mesh>
      <mesh material={mat} position={[0, 0.89, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.1, 16]} />
      </mesh>
      {crenelPositions.map((pos, i) => (
        <mesh key={i} material={mat} position={[pos[0], 1.0, pos[2]]} castShadow>
          <boxGeometry args={[0.1, 0.18, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

function KnightMeshes({ mat }) {
  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 0.42, 14]} />
      </mesh>
      <mesh material={mat} position={[0, 0.72, 0]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.38, 0.36]} />
      </mesh>
      <mesh material={mat} position={[0, 0.62, 0.2]} rotation={[0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.2, 0.22]} />
      </mesh>
      <mesh material={mat} position={[-0.07, 0.98, 0]} castShadow>
        <coneGeometry args={[0.05, 0.16, 6]} />
      </mesh>
      <mesh material={mat} position={[0.07, 0.98, 0]} castShadow>
        <coneGeometry args={[0.05, 0.16, 6]} />
      </mesh>
    </group>
  );
}

function BishopMeshes({ mat }) {
  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.3, 0.72, 14]} />
      </mesh>
      <mesh material={mat} position={[0, 1.0, 0]} scale={[1, 1.6, 1]} castShadow>
        <sphereGeometry args={[0.19, 14, 14]} />
      </mesh>
      <mesh material={mat} position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.055, 8, 8]} />
      </mesh>
    </group>
  );
}

function QueenMeshes({ mat }) {
  const crownPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      pts.push([Math.cos(angle) * 0.2, 1.22, Math.sin(angle) * 0.2]);
    }
    return pts;
  }, []);

  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.34, 0.88, 16]} />
      </mesh>
      <mesh material={mat} position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>
      {crownPoints.map((pos, i) => (
        <mesh key={i} material={mat} position={pos} castShadow>
          <coneGeometry args={[0.045, 0.2, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function KingMeshes({ mat }) {
  return (
    <group>
      <mesh material={mat} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.08, 20]} />
      </mesh>
      <mesh material={mat} position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.34, 0.92, 16]} />
      </mesh>
      {/* Cross horizontal bar */}
      <mesh material={mat} position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.38, 0.07, 0.07]} />
      </mesh>
      {/* Cross vertical bar */}
      <mesh material={mat} position={[0, 1.24, 0]} castShadow>
        <boxGeometry args={[0.07, 0.3, 0.07]} />
      </mesh>
    </group>
  );
}

function PieceMeshes({ type, mat }) {
  switch (type?.toUpperCase()) {
    case 'P': return <PawnMeshes mat={mat} />;
    case 'R': return <RookMeshes mat={mat} />;
    case 'N': return <KnightMeshes mat={mat} />;
    case 'B': return <BishopMeshes mat={mat} />;
    case 'Q': return <QueenMeshes mat={mat} />;
    case 'K': return <KingMeshes mat={mat} />;
    default:  return <PawnMeshes mat={mat} />;
  }
}

// ─── Main Piece3D component ──────────────────────────────────────────────────

export default function Piece3D({
  type = 'P',
  isWhite = true,
  position = [0, 0, 0],
  visible = true,
  opacity = 1,
  glowing = false,
}) {
  const groupRef = useRef();

  // Current interpolated position
  const currentPosRef = useRef(new THREE.Vector3(position[0], position[1] + 4, position[2]));
  const targetPosRef  = useRef(new THREE.Vector3(...position));
  const prevVisibleRef = useRef(visible);
  const rotYRef = useRef(0);

  const mat = useChessMaterial(isWhite);

  // Clone material so each piece can pulse independently
  const pieceMat = useMemo(() => mat.clone(), [mat]);

  // Clean up cloned material on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      pieceMat.dispose();
    };
  }, [pieceMat]);

  // When position prop changes, update the target
  useEffect(() => {
    targetPosRef.current.set(position[0], position[1], position[2]);
  }, [position[0], position[1], position[2]]);

  // Handle visibility changes (appear from above, disappear below)
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Piece becoming visible → start from above
      currentPosRef.current.set(position[0], position[1] + 4, position[2]);
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Determine Y target: if invisible, fall through board
    const yTarget = visible ? targetPosRef.current.y : targetPosRef.current.y - 3;
    targetPosRef.current.y = visible ? position[1] : position[1] - 3;

    // Lerp position
    currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * 0.06;
    currentPosRef.current.y += (yTarget - currentPosRef.current.y) * 0.06;
    currentPosRef.current.z += (targetPosRef.current.z - currentPosRef.current.z) * 0.06;

    groupRef.current.position.copy(currentPosRef.current);

    // Subtle Y rotation when not in danger/glowing
    if (!glowing) {
      rotYRef.current += 0.001;
      groupRef.current.rotation.y = rotYRef.current;
    }

    // Update material emissive for glow
    if (glowing) {
      const pulse = Math.sin(clock.getElapsedTime() * 3.5) * 0.5 + 0.5;
      if (isWhite) {
        pieceMat.emissive.set('#ffffff');
        pieceMat.emissiveIntensity = 0.4 + pulse * 0.35;
      } else {
        pieceMat.emissive.set('#ff4400');
        pieceMat.emissiveIntensity = 0.4 + pulse * 0.35;
      }
    } else {
      if (isWhite) {
        pieceMat.emissive.set('#000000');
        pieceMat.emissiveIntensity = 0;
      } else {
        pieceMat.emissive.set('#1a0800');
        pieceMat.emissiveIntensity = 0.06;
      }
    }

    // Opacity
    pieceMat.transparent = opacity < 1;
    pieceMat.opacity = opacity;

    // Visibility: hide when far below board
    groupRef.current.visible = currentPosRef.current.y > -2.5;
  });

  return (
    <group ref={groupRef}>
      <PieceMeshes type={type} mat={pieceMat} />
    </group>
  );
}
