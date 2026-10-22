import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, FPS} from '../theme';

/* ---------- mirror disco ball ---------- */
const Ball: React.FC<{drop: number}> = ({drop}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // faceted sphere: flat-shaded, highly metallic, catches coloured spot lights
  const geo = useMemo(() => new THREE.SphereGeometry(1.6, 28, 18), []);
  return (
    <group position={[0, 3.2 - drop * 3.0, 0]}>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff1d6', '#3a0718', 1.2]} />
      <pointLight position={[3, 2, 4]} intensity={60} color={C.gold} />
      <pointLight position={[-3, -1, 4]} intensity={50} color={C.crimson} />
      <pointLight position={[0, 4, 2]} intensity={40} color={'#ffffff'} />
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 6]} />
        <meshStandardMaterial color={'#bbb'} metalness={1} roughness={0.3} />
      </mesh>
      <mesh geometry={geo} rotation={[0.2, t * 0.6, 0]}>
        <meshStandardMaterial color={'#e9e4de'} metalness={0.55} roughness={0.22} flatShading emissive={'#2a0a10'} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

export const DiscoBall: React.FC<{size: number; drop: number; style?: React.CSSProperties}> = ({size, drop, style}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0, 7], fov: 45}} gl={{antialias: true, alpha: true}}>
      <Ball drop={drop} />
    </ThreeCanvas>
  </div>
);

/* ---------- wireframe globe with student pins ---------- */
const PINS: [number, number][] = [
  [55.75, 37.6], [40.4, -3.7], [48.85, 2.35], [-34.6, -58.4], [25.2, 55.3], [41.0, 28.9], [35.7, 139.7], [-33.9, 151.2], [40.7, -74.0], [19.4, -99.1], [59.9, 30.3], [43.2, 76.9],
];
const toVec = (lat: number, lon: number, r: number) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

const GlobeMesh: React.FC<{appear: number; pins: number}> = ({appear, pins}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const dots = useMemo(() => {
    // fibonacci sphere of dots
    const n = 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pos.set([Math.cos(th) * r * 2, y * 2, Math.sin(th) * r * 2], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <group scale={[appear, appear, appear]} rotation={[0.35, t * 0.35, 0]}>
      <ambientLight intensity={0.8} />
      <pointLight position={[4, 3, 5]} intensity={40} color={C.gold} />
      <mesh>
        <sphereGeometry args={[1.97, 48, 48]} />
        <meshStandardMaterial color={C.wine} transparent opacity={0.85} roughness={0.6} />
      </mesh>
      <points geometry={dots}>
        <pointsMaterial color={C.gold} size={0.035} transparent opacity={0.85} />
      </points>
      {PINS.slice(0, Math.floor(pins * PINS.length)).map(([la, lo], i) => {
        const v = toVec(la, lo, 2.05);
        return (
          <mesh key={i} position={v}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={i % 2 ? C.rose : C.cream} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Globe: React.FC<{size: number; appear: number; pins: number; style?: React.CSSProperties}> = ({size, appear, pins, style}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0, 6.2], fov: 45}} gl={{antialias: true, alpha: true}}>
      <GlobeMesh appear={appear} pins={pins} />
    </ThreeCanvas>
  </div>
);
