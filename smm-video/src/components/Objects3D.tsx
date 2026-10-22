import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, FPS} from '../theme';

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight position={[4, 6, 6]} intensity={3} />
    <pointLight position={[-5, -2, 4]} intensity={40} color={C.cyan} />
    <pointLight position={[5, -3, 3]} intensity={40} color={C.orange} />
  </>
);

/* ---------- glossy 3D "like" heart ---------- */
const HeartMesh: React.FC<{appear: number; beat: number}> = ({appear, beat}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -1.4);
    s.bezierCurveTo(-0.4, -1.0, -1.9, -0.2, -1.9, 0.75);
    s.bezierCurveTo(-1.9, 1.6, -1.0, 2.0, -0.45, 1.75);
    s.bezierCurveTo(-0.2, 1.62, -0.05, 1.45, 0, 1.3);
    s.bezierCurveTo(0.05, 1.45, 0.2, 1.62, 0.45, 1.75);
    s.bezierCurveTo(1.0, 2.0, 1.9, 1.6, 1.9, 0.75);
    s.bezierCurveTo(1.9, -0.2, 0.4, -1.0, 0, -1.4);
    const g = new THREE.ExtrudeGeometry(s, {depth: 0.7, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 10, curveSegments: 32});
    g.center();
    return g;
  }, []);
  const sc = appear * (1 + beat * 0.12);
  return (
    <group scale={[sc, sc, sc]} rotation={[0.15 + Math.sin(t * 1.2) * 0.1, Math.sin(t * 0.9) * 0.6, 0]}>
      <Lights />
      <mesh geometry={geo}>
        <meshPhysicalMaterial color={C.pink} roughness={0.15} metalness={0.1} clearcoat={1} clearcoatRoughness={0.05} emissive={'#7a0038'} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

export const Heart3D: React.FC<{size: number; appear: number; beat?: number; style?: React.CSSProperties}> = ({size, appear, beat = 0, style}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0, 7], fov: 45}} gl={{antialias: true, alpha: true}}>
      <HeartMesh appear={appear} beat={beat} />
    </ThreeCanvas>
  </div>
);

/* ---------- 3D rocket with flame ---------- */
const RocketMesh: React.FC<{lift: number; shake: number}> = ({lift, shake}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const jitter = Math.sin(t * 90) * 0.03 * shake;
  const flame = 0.7 + Math.abs(Math.sin(t * 40)) * 0.5 * (0.4 + shake);
  return (
    <group position={[jitter, -1.2 + lift * 9, 0]} rotation={[0.25, t * 0.8, 0.12]}>
      <Lights />
      {/* body */}
      <mesh>
        <cylinderGeometry args={[0.75, 0.85, 2.6, 48]} />
        <meshPhysicalMaterial color={'#f5f2ff'} roughness={0.25} clearcoat={1} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.75, 1.3, 48]} />
        <meshPhysicalMaterial color={C.pink} roughness={0.2} clearcoat={1} />
      </mesh>
      {/* window */}
      <mesh position={[0, 0.45, 0.72]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.32, 0.08, 16, 40]} />
        <meshStandardMaterial color={C.violet} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 0.7]}>
        <circleGeometry args={[0.3, 40]} />
        <meshStandardMaterial color={C.cyan} emissive={C.cyan} emissiveIntensity={0.6} />
      </mesh>
      {/* fins */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.sin((k * 2 * Math.PI) / 3) * 0.85, -1.15, Math.cos((k * 2 * Math.PI) / 3) * 0.85]} rotation={[0, (k * 2 * Math.PI) / 3, 0]}>
          <boxGeometry args={[0.12, 1.0, 0.75]} />
          <meshPhysicalMaterial color={C.violet} roughness={0.25} clearcoat={1} />
        </mesh>
      ))}
      {/* flame */}
      <mesh position={[0, -1.3 - flame * 0.9, 0]} rotation={[Math.PI, 0, 0]} scale={[1, flame, 1]}>
        <coneGeometry args={[0.55, 1.8, 32]} />
        <meshBasicMaterial color={C.orange} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -1.3 - flame * 0.6, 0]} rotation={[Math.PI, 0, 0]} scale={[1, flame, 1]}>
        <coneGeometry args={[0.3, 1.1, 32]} />
        <meshBasicMaterial color={C.yellow} />
      </mesh>
    </group>
  );
};

export const Rocket3D: React.FC<{size: number; lift: number; shake?: number; style?: React.CSSProperties}> = ({size, lift, shake = 0, style}) => (
  <div style={{position: 'absolute', width: size, height: size * 1.4, ...style}}>
    <ThreeCanvas width={size} height={size * 1.4} camera={{position: [0, 0, 11], fov: 45}} gl={{antialias: true, alpha: true}}>
      <RocketMesh lift={lift} shake={shake} />
    </ThreeCanvas>
  </div>
);
