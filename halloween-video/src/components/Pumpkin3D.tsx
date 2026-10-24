import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {FPS, rand} from '../theme';

/** Canvas textures for the carved face: colour (rind + dark cut-outs) and emissive (candle glow through the cuts). */
const makeFace = () => {
  const w = 1024;
  const h = 512;
  const col = document.createElement('canvas');
  col.width = w;
  col.height = h;
  const em = document.createElement('canvas');
  em.width = w;
  em.height = h;
  const c = col.getContext('2d')!;
  const e = em.getContext('2d')!;
  // rind: orange with darker grooves every 1/10 of the circumference
  const g = c.createLinearGradient(0, 0, w, 0);
  for (let k = 0; k <= 10; k++) {
    g.addColorStop(Math.min(1, k / 10), '#B33A00');
    g.addColorStop(Math.min(1, k / 10 + 0.05), '#FF7A1A');
  }
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const vg = c.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, 'rgba(60,20,0,0.55)');
  vg.addColorStop(0.25, 'rgba(0,0,0,0)');
  vg.addColorStop(0.8, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(60,20,0,0.6)');
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) {
    c.fillStyle = `rgba(90,30,0,${rand(k) * 0.12})`;
    c.fillRect(rand(k + 1) * w, rand(k + 2) * h, 2 + rand(k + 3) * 6, 1 + rand(k + 4) * 2);
  }
  e.fillStyle = '#000';
  e.fillRect(0, 0, w, h);
  // the face is centred on u = 0.25 (the side of the sphere facing the camera)
  const cx = w * 0.25;
  const shapes = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    // eyes (slanted triangles)
    for (const s of [-1, 1]) {
      ctx.moveTo(cx + s * 40, h * 0.42);
      ctx.lineTo(cx + s * 120, h * 0.44);
      ctx.lineTo(cx + s * 70, h * 0.3);
      ctx.closePath();
    }
    // nose
    ctx.moveTo(cx - 18, h * 0.53);
    ctx.lineTo(cx + 18, h * 0.53);
    ctx.lineTo(cx, h * 0.47);
    ctx.closePath();
    // jagged grin
    const top = (x: number) => h * 0.6 - Math.cos(((x - cx) / 170) * 1.3) * 18;
    ctx.moveTo(cx - 170, h * 0.58);
    const teeth = [-110, -55, 0, 55, 110];
    for (let x = -170; x <= 170; x += 10) {
      const tooth = teeth.some((t) => Math.abs(x - t) < 14);
      ctx.lineTo(cx + x, top(cx + x) + (tooth ? 22 : 0));
    }
    for (let x = 170; x >= -170; x -= 10) {
      const tooth = [-80, -25, 30, 85].some((t) => Math.abs(x - t) < 14);
      ctx.lineTo(cx + x, top(cx + x) + 60 - Math.abs(x) * 0.2 - (tooth ? 22 : 0));
    }
    ctx.closePath();
  };
  c.fillStyle = '#1a0600';
  shapes(c);
  c.fill();
  e.fillStyle = '#FFB020';
  e.shadowColor = '#FF8000';
  e.shadowBlur = 18;
  shapes(e);
  e.fill();
  const tc = new THREE.CanvasTexture(col);
  tc.colorSpace = THREE.SRGBColorSpace;
  const te = new THREE.CanvasTexture(em);
  te.colorSpace = THREE.SRGBColorSpace;
  return {tc, te};
};

const makeGeo = () => {
  const geo = new THREE.SphereGeometry(1, 128, 64);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const lon = Math.atan2(v.z, -v.x);
    const rib = 1 - 0.06 * (1 - Math.pow(Math.abs(Math.sin(lon * 5)), 0.5));
    const lat = v.y;
    const squash = 0.8 - 0.12 * Math.pow(Math.abs(lat), 6);
    v.set(v.x * rib, v.y * squash - (Math.abs(lat) > 0.9 ? (Math.abs(lat) - 0.9) * Math.sign(lat) * 0.6 : 0), v.z * rib);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
};

const Scene: React.FC<{appear: number; turn: number; glow: number}> = ({appear, turn, glow}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {tc, te} = useMemo(makeFace, []);
  const geo = useMemo(makeGeo, []);
  const flick = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1) + 0.1 * Math.sin(t * 31);
  const s = appear;
  return (
    <group scale={[s, s, s]} rotation={[0.08 + Math.sin(t * 0.8) * 0.04, turn + Math.sin(t * 0.6) * 0.18, Math.sin(t * 0.9) * 0.03]}>
      <ambientLight intensity={0.25} color={'#6a3d8f'} />
      <directionalLight position={[-3, 4, 3]} intensity={1.4} color={'#b9a8ff'} />
      <directionalLight position={[3, -1, 2]} intensity={1.1} color={'#ff4020'} />
      <pointLight position={[0, -0.2, 2.2]} intensity={6 * glow * flick} color={'#ff8a00'} distance={6} />
      <mesh geometry={geo}>
        <meshStandardMaterial map={tc} emissiveMap={te} emissive={'#ffffff'} emissiveIntensity={1.6 * glow * flick} roughness={0.62} metalness={0.02} />
      </mesh>
      {/* stem */}
      <mesh position={[0.04, 0.86, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.07, 0.12, 0.38, 10]} />
        <meshStandardMaterial color={'#3d4a1c'} roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Pumpkin3D: React.FC<{size: number; appear: number; turn?: number; glow?: number; style?: React.CSSProperties}> = ({size, appear, turn = 0, glow = 1, style}) => (
  <div style={{position: 'absolute', width: size, height: size, ...style}}>
    <ThreeCanvas width={size} height={size} camera={{position: [0, 0.25, 4.2], fov: 38}} gl={{antialias: true, alpha: true}}>
      <Scene appear={appear} turn={turn} glow={glow} />
    </ThreeCanvas>
  </div>
);
