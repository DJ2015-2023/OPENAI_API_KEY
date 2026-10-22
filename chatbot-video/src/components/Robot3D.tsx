import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FPS} from '../theme';

type Props = {
  size: number;
  /** 0..1 entrance scale */
  appear: number;
  /** 0..1 arm wave amount */
  wave?: number;
  /** 0..1 "level up": glowing ring + headset */
  upgrade?: number;
  /** eyes closed amount 0..1 (sleep) */
  sleepy?: number;
  /** extra yaw in radians */
  turn?: number;
  style?: React.CSSProperties;
};

const clay = (color: string, rough = 0.55) => <meshStandardMaterial color={color} roughness={rough} metalness={0.05} />;

const Bot: React.FC<Omit<Props, 'size' | 'style'>> = ({appear, wave = 0, upgrade = 0, sleepy = 0, turn = 0}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const bob = Math.sin(t * 3) * 0.08;
  // natural blink every ~2.6s, plus sleepiness
  const bl = (t % 2.6) / 2.6;
  const blink = Math.max(sleepy, bl > 0.96 ? 1 - Math.abs(bl - 0.98) / 0.02 : 0);
  const eyeH = Math.max(0.06, 1 - blink);
  const armR = -0.4 - wave * (1.6 + Math.sin(t * 10) * 0.35);
  const s = appear;
  return (
    <group scale={[s, s, s]} position={[0, bob - 0.2, 0]} rotation={[0.05, Math.sin(t * 0.8) * 0.25 + turn, 0]}>
      <hemisphereLight args={['#fff6e6', '#c9b8a0', 1.6]} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} />
      <directionalLight position={[-4, 1, 3]} intensity={0.8} color={'#9fc8ff'} />

      {/* body */}
      <mesh position={[0, -1.25, 0]}>
        <capsuleGeometry args={[0.95, 0.6, 12, 32]} />
        {clay(C.paper)}
      </mesh>
      {/* belly badge */}
      <mesh position={[0, -1.15, 0.93]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.34, 40]} />
        <meshStandardMaterial color={C.orange} roughness={0.4} emissive={C.orange} emissiveIntensity={0.25 + upgrade * 0.6} />
      </mesh>
      {/* head */}
      <group position={[0, 0.55, 0]}>
        <mesh scale={[1.35, 1.0, 1.0]}>
          <sphereGeometry args={[1.05, 48, 48]} />
          {clay(C.paper)}
        </mesh>
        {/* visor */}
        <mesh position={[0, 0, 0.62]} scale={[1.05, 0.72, 0.5]}>
          <sphereGeometry args={[0.95, 48, 48]} />
          <meshStandardMaterial color={C.ink} roughness={0.25} metalness={0.2} />
        </mesh>
        {/* eyes */}
        {[-0.38, 0.38].map((x) => (
          <mesh key={x} position={[x, 0.05, 1.08]} scale={[1, eyeH, 1]}>
            <capsuleGeometry args={[0.11, 0.18, 8, 16]} />
            <meshBasicMaterial color={upgrade > 0.5 ? C.lime : '#7ef0ff'} />
          </mesh>
        ))}
        {/* smile */}
        <mesh position={[0, -0.28, 1.06]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.2, 0.04, 8, 24, Math.PI]} />
          <meshBasicMaterial color={'#7ef0ff'} />
        </mesh>
        {/* ears */}
        {[-1.42, 1.42].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.25, 32]} />
            {clay(C.cobalt, 0.45)}
          </mesh>
        ))}
        {/* antenna */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
          {clay(C.ink, 0.5)}
        </mesh>
        <mesh position={[0, 1.45, 0]} scale={1 + Math.sin(t * 6) * 0.08}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.5 + Math.sin(t * 6) * 0.3} />
        </mesh>
        {/* headset mic (upgrade) */}
        {upgrade > 0.01 && (
          <group scale={[upgrade, upgrade, upgrade]}>
            <mesh position={[1.25, -0.35, 0.45]} rotation={[0, -0.6, 0.2]}>
              <capsuleGeometry args={[0.05, 0.6, 6, 12]} />
              {clay(C.ink, 0.5)}
            </mesh>
            <mesh position={[1.0, -0.65, 0.75]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={C.lime} emissive={C.lime} emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}
      </group>
      {/* arms */}
      <group position={[-1.05, -0.95, 0]} rotation={[0, 0, 0.4]}>
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.22, 0.6, 8, 16]} />
          {clay(C.cobalt, 0.45)}
        </mesh>
      </group>
      <group position={[1.05, -0.75, 0]} rotation={[0, 0, armR]}>
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.22, 0.6, 8, 16]} />
          {clay(C.cobalt, 0.45)}
        </mesh>
      </group>
      {/* upgrade ring */}
      {upgrade > 0.01 && (
        <mesh rotation={[Math.PI / 2.3, 0, t * 1.5]} scale={[upgrade, upgrade, upgrade]} position={[0, -0.4, 0]}>
          <torusGeometry args={[2.3, 0.07, 12, 96]} />
          <meshStandardMaterial color={C.lime} emissive={C.lime} emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export const Robot3D: React.FC<Props> = ({size, style, ...rest}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    {/* contact shadow */}
    <div
      style={{
        position: 'absolute',
        left: '28%',
        right: '28%',
        bottom: '7%',
        height: '5%',
        borderRadius: '50%',
        background: 'rgba(40,25,0,0.25)',
        filter: 'blur(14px)',
        transform: `scale(${rest.appear})`,
      }}
    />
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0, 8.5], fov: 42}} gl={{antialias: true, alpha: true}}>
      <Bot {...rest} />
    </ThreeCanvas>
  </div>
);
