import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, FPS, rand} from '../theme';

/** Glowing AI core: wireframe icosahedron + energy sphere + gyroscope rings + particle shell. */
const CoreMesh: React.FC<{reveal: number; pulse: number; spin: number}> = ({reveal, pulse, spin}) => {
  const f = useCurrentFrame();
  const t = f / FPS;

  const shell = useMemo(() => {
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand(i * 1.7) * 2 - 1;
      const th = rand(i * 9.3) * Math.PI * 2;
      const r = 2.3 + rand(i * 4.1) * 1.4;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const s = reveal * (1 + pulse * 0.18 + Math.sin(t * 4) * 0.02);
  return (
    <group scale={[s, s, s]} rotation={[0.2, t * 0.5 * spin, 0]}>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 6]} intensity={60} color={C.cyan} />
      <pointLight position={[-5, -3, 4]} intensity={50} color={C.magenta} />
      <mesh rotation={[t * 0.6, t * 0.8, 0]}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial color={C.cyan} wireframe transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-t * 0.4, t * 0.3, t * 0.2]}>
        <icosahedronGeometry args={[1.25, 0]} />
        <meshStandardMaterial color={C.violet} emissive={C.violet} emissiveIntensity={1.2 + pulse * 2} metalness={0.6} roughness={0.25} flatShading transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshBasicMaterial color={'#e8fbff'} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.95, 48, 48]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.25 + pulse * 0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.9 + t * (0.5 + i * 0.2), i * 1.2 + t * 0.35, 0]}>
          <torusGeometry args={[2.0 + i * 0.28, 0.025, 12, 160]} />
          <meshBasicMaterial color={i === 1 ? C.magenta : C.cyan} transparent opacity={0.8} />
        </mesh>
      ))}
      <points geometry={shell} rotation={[0, -t * 0.25, 0]}>
        <pointsMaterial color={C.cyan} size={0.045} transparent opacity={0.8} sizeAttenuation />
      </points>
    </group>
  );
};

export const Core3D: React.FC<{size: number; reveal: number; pulse?: number; spin?: number; style?: React.CSSProperties}> = ({
  size,
  reveal,
  pulse = 0,
  spin = 1,
  style,
}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <div
      style={{
        position: 'absolute',
        inset: '-20%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.cyan}66 0%, ${C.violet}33 35%, transparent 65%)`,
        opacity: reveal * (0.8 + pulse * 0.6),
        filter: 'blur(20px)',
      }}
    />
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0, 7.5], fov: 50}} gl={{antialias: true, alpha: true}}>
      <CoreMesh reveal={reveal} pulse={pulse} spin={spin} />
    </ThreeCanvas>
  </div>
);
