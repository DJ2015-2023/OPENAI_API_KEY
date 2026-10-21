import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useThree } from "@react-three/fiber";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

const W = 1080;
const H = 1920;

// ---------- Procedural pumpkin ----------
const faceShapes = () => {
  const eye = (x: number) => {
    const s = new THREE.Shape();
    s.moveTo(x - 0.16, 0.12);
    s.lineTo(x + 0.16, 0.12);
    s.lineTo(x, 0.36);
    s.closePath();
    return s;
  };
  const nose = new THREE.Shape();
  nose.moveTo(-0.07, 0.0);
  nose.lineTo(0.07, 0.0);
  nose.lineTo(0, 0.12);
  nose.closePath();
  const mouth = new THREE.Shape();
  const pts: [number, number][] = [
    [-0.42, -0.08], [-0.3, -0.16], [-0.24, -0.1], [-0.14, -0.2], [-0.05, -0.12], [0.05, -0.2],
    [0.14, -0.12], [0.24, -0.2], [0.3, -0.1], [0.42, -0.08], [0.3, -0.34], [0, -0.42], [-0.3, -0.34],
  ];
  mouth.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => mouth.lineTo(...p));
  mouth.closePath();
  return [eye(-0.24), eye(0.24), nose, mouth];
};

export const Pumpkin: React.FC<{ position: [number, number, number]; scale?: number; rot?: number; glow?: number }> = ({
  position,
  scale = 1,
  rot = 0,
  glow = 1,
}) => {
  const lobes = useMemo(() => new THREE.SphereGeometry(0.62, 40, 28), []);
  const face = useMemo(() => new THREE.ShapeGeometry(faceShapes()), []);
  return (
    <group position={position} scale={scale} rotation={[0.08, rot, 0]}>
      {new Array(9).fill(0).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} geometry={lobes} position={[Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36]} scale={[0.72, 0.86, 0.72]} rotation={[0, a, 0]}>
            <meshStandardMaterial color="#e8620f" roughness={0.45} metalness={0.05} emissive="#5a1500" emissiveIntensity={0.35} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.6, 0]} rotation={[0.25, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.1, 0.32, 10]} />
        <meshStandardMaterial color="#3d2a12" roughness={0.9} />
      </mesh>
      <mesh geometry={face} position={[0, 0.0, 0.86]} scale={[0.74, 0.74, 1]}>
        <meshBasicMaterial color={new THREE.Color(1.0, 0.75 * glow + 0.2, 0.2)} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 1.4]} color="#ffae3a" intensity={3 * glow} distance={4} />
    </group>
  );
};

// ---------- Moon with procedural craters ----------
const useMoonTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c8452e";
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 140; i++) {
      const x = random(`mx${i}`) * 512;
      const y = random(`my${i}`) * 256;
      const r = 2 + random(`mr${i}`) ** 2 * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(90,15,10,0.55)");
      grd.addColorStop(1, "rgba(90,15,10,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

const Moon: React.FC<{ position: [number, number, number]; spin: number }> = ({ position, spin }) => {
  const tex = useMoonTexture();
  return (
    <mesh position={position} rotation={[0.2, spin, 0]}>
      <sphereGeometry args={[1.6, 64, 48]} />
      <meshStandardMaterial map={tex} emissive="#ff3a1a" emissiveMap={tex} emissiveIntensity={0.85} roughness={1} />
    </mesh>
  );
};

/** Title scene: blood moon rising behind three orbiting jack-o'-lanterns. */
export const PumpkinMoon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rise = interpolate(t, [0, 1.6], [-3.2, 2.6], { extrapolateRight: "clamp", easing: (x) => 1 - (1 - x) ** 3 });
  const flicker = 0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7.3);
  const pumpkins: { r: number; y: number; s: number; ph: number }[] = [
    { r: 2.1, y: -2.6, s: 1.15, ph: 0 },
    { r: 2.1, y: -2.9, s: 0.85, ph: 2.1 },
    { r: 2.1, y: -2.4, s: 0.95, ph: 4.2 },
  ];
  const enter = interpolate(t, [0.3, 1.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <ThreeCanvas width={W} height={H} camera={{ position: [0, 0, 9], fov: 50 }} gl={{ antialias: true }}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 4, 5]} intensity={1.4} color="#ffd2a0" />
      <directionalLight position={[3, -2, -4]} intensity={2.2} color="#ff2a3a" />
      <Moon position={[0, rise, -4]} spin={t * 0.15} />
      {pumpkins.map((p, i) => {
        const a = t * 0.9 + p.ph;
        const z = Math.cos(a) * p.r;
        return (
          <Pumpkin
            key={i}
            position={[Math.sin(a) * p.r, p.y + Math.sin(t * 2 + i) * 0.15 - (1 - enter) * 4, z]}
            scale={p.s * enter}
            rot={Math.sin(t * 1.3 + i * 2) * 0.45}
            glow={flicker}
          />
        );
      })}
    </ThreeCanvas>
  );
};

// Soft studio reflections so metallic surfaces read as gold rather than brown.
const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

// ---------- 3D extruded "31" ----------
const font = new FontLoader().parse(fontJson as never);

export const Big31: React.FC<{ text?: string }> = ({ text = "31" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const geo = useMemo(() => {
    const g = new TextGeometry(text, {
      font,
      size: 2.2,
      depth: 0.7,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 5,
    });
    g.center();
    return g;
  }, [text]);
  const spinIn = interpolate(t, [0, 1.3], [Math.PI * 1.5, 0], {
    extrapolateRight: "clamp",
    easing: (x) => 1 - (1 - x) ** 4,
  });
  const z = interpolate(t, [0, 1.3], [-14, 0], { extrapolateRight: "clamp", easing: (x) => 1 - (1 - x) ** 4 });
  const sway = Math.sin(t * 1.4) * 0.22;
  return (
    <ThreeCanvas width={W} height={H} camera={{ position: [0, 0, 9], fov: 50 }} gl={{ antialias: true }}>
      <Env />
      <ambientLight intensity={0.3} />
      <pointLight position={[-4, 3, 5]} intensity={60} color="#ffd9a0" />
      <pointLight position={[4, -2, 3]} intensity={50} color="#ff2a3a" />
      <pointLight position={[Math.sin(t * 2) * 5, 4, 2]} intensity={30} color="#ff8a1a" />
      <mesh geometry={geo} position={[0, 2.1, z]} rotation={[0.12, spinIn + sway, 0]}>
        <meshStandardMaterial color="#f0c060" metalness={0.9} roughness={0.25} emissive="#4a1a00" envMapIntensity={1.3} />
      </mesh>
    </ThreeCanvas>
  );
};
