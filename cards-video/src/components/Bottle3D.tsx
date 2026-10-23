import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FPS} from '../theme';

/** 3D perfume bottle on a rotating studio turntable. */
const Scene: React.FC<{appear: number; spin: number}> = ({appear, spin}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const rot = t * 0.7 * spin;
  return (
    <group scale={[appear, appear, appear]} position={[0, -0.6, 0]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 5]} intensity={2.6} />
      <directionalLight position={[-4, 2, 2]} intensity={1.2} color={C.violetSoft} />
      <pointLight position={[0, 1, -3]} intensity={30} color={C.violet} />
      {/* turntable */}
      <mesh position={[0, -1.55, 0]} rotation={[0, rot, 0]}>
        <cylinderGeometry args={[2.4, 2.5, 0.25, 64]} />
        <meshStandardMaterial color={'#f4f2ef'} roughness={0.5} />
      </mesh>
      <group rotation={[0, rot, 0]}>
        {/* glass body (rounded box approximated by a slightly squashed cylinder) */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[1.05, 1.05, 2.4, 6]} />
          <meshPhysicalMaterial color={'#d9c6ff'} roughness={0.05} metalness={0} transparent opacity={0.55} clearcoat={1} clearcoatRoughness={0.05} flatShading />
        </mesh>
        {/* liquid */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.88, 0.88, 1.75, 6]} />
          <meshStandardMaterial color={C.violet} emissive={C.violet} emissiveIntensity={0.25} roughness={0.2} transparent opacity={0.85} flatShading />
        </mesh>
        {/* neck + cap */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.35, 32]} />
          <meshStandardMaterial color={'#cfcfcf'} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[0.9, 0.75, 0.9]} />
          <meshPhysicalMaterial color={'#141414'} roughness={0.25} clearcoat={1} />
        </mesh>
        {/* label */}
        <mesh position={[0, -0.25, 0.92]}>
          <planeGeometry args={[0.9, 0.5]} />
          <meshStandardMaterial color={C.lemon} />
        </mesh>
      </group>
    </group>
  );
};

export const Bottle3D: React.FC<{size: number; appear: number; spin?: number; style?: React.CSSProperties}> = ({size, appear, spin = 1, style}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0.6, 7.5], fov: 40}} gl={{antialias: true, alpha: true}}>
      <Scene appear={appear} spin={spin} />
    </ThreeCanvas>
  </div>
);
