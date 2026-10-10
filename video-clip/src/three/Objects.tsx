import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, C } from "../theme";
import { grooveTexture, slateTexture, stripeTexture, vinylLabelTexture } from "./textures";

const Lights: React.FC<{ tint?: string }> = ({ tint = C.pink }) => (
  <>
    <ambientLight intensity={0.55} />
    <directionalLight position={[3, 5, 6]} intensity={2.2} />
    <pointLight position={[-4, -2, 3]} intensity={30} color={tint} />
    <pointLight position={[4, 2, -2]} intensity={25} color={C.cyan} />
  </>
);

const Canvas: React.FC<{ children: React.ReactNode; tint?: string }> = ({ children, tint }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Lights tint={tint} />
      {children}
    </ThreeCanvas>
  );
};

/** Film slate that flies in, opens and snaps shut at `snapAt`. */
export const Clapperboard3D: React.FC<{ snapAt: number; y?: number }> = ({ snapAt, y = 2.2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stripes = useMemo(() => stripeTexture(), []);
  const slate = useMemo(() => slateTexture(), []);
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 70 } });
  const open = interpolate(frame, [8, snapAt - 14], [0, 0.62], { ...clamp, easing: Easing.out(Easing.cubic) });
  const close = interpolate(frame, [snapAt - 5, snapAt], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const armAngle = open * (1 - close);
  const shake = frame >= snapAt && frame < snapAt + 10 ? Math.sin(frame * 3) * 0.05 * (snapAt + 10 - frame) / 10 : 0;
  const stripeMat = <meshStandardMaterial map={stripes} roughness={0.45} metalness={0.1} />;
  return (
    <Canvas>
      <group
        position={[shake, y + (1 - enter) * -6 + Math.sin(frame / 30) * 0.08, (1 - enter) * -10]}
        rotation={[0.12 + (1 - enter) * 1.2, -0.35 + (1 - enter) * -2 + Math.sin(frame / 45) * 0.15, 0.04]}
        scale={0.78}
      >
        {/* board */}
        <mesh position={[0, -0.95, 0]}>
          <boxGeometry args={[3.6, 2.5, 0.16]} />
          <meshStandardMaterial attach="material-0" color="#222" />
          <meshStandardMaterial attach="material-1" color="#222" />
          <meshStandardMaterial attach="material-2" color="#222" />
          <meshStandardMaterial attach="material-3" color="#222" />
          <meshStandardMaterial attach="material-4" map={slate} roughness={0.6} />
          <meshStandardMaterial attach="material-5" color="#222" />
        </mesh>
        {/* lower fixed stripe bar */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[3.6, 0.42, 0.18]} />
          {stripeMat}
        </mesh>
        {/* hinged clapper arm (pivot at left edge) */}
        <group position={[-1.8, 0.74, 0]} rotation={[0, 0, armAngle]}>
          <mesh position={[1.8, 0.22, 0]}>
            <boxGeometry args={[3.6, 0.42, 0.18]} />
            {stripeMat}
          </mesh>
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.1, 24]} />
            <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </Canvas>
  );
};

/** Spinning vinyl record. */
export const Vinyl3D: React.FC<{ y?: number; scale?: number }> = ({ y = 1.6, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const label = useMemo(() => vinylLabelTexture(), []);
  const groove = useMemo(() => grooveTexture(), []);
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  return (
    <Canvas tint={C.gold}>
      <group
        position={[0, y + (1 - enter) * 4, 0]}
        rotation={[1.05 + Math.sin(frame / 40) * 0.08, 0, 0.18]}
        scale={scale * (0.3 + 0.7 * enter)}
      >
        <group rotation={[0, -frame * 0.09, 0]}>
          <mesh>
            <cylinderGeometry args={[2.1, 2.1, 0.06, 96]} />
            <meshStandardMaterial attach="material-0" color="#050507" />
            <meshStandardMaterial attach="material-1" map={groove} roughness={0.25} metalness={0.6} />
            <meshStandardMaterial attach="material-2" map={groove} roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.78, 0.78, 0.01, 64]} />
            <meshStandardMaterial attach="material-0" color="#ff2e88" />
            <meshStandardMaterial attach="material-1" map={label} />
            <meshStandardMaterial attach="material-2" map={label} />
          </mesh>
        </group>
      </group>
    </Canvas>
  );
};

/** Vintage film camera with spinning reels. */
export const FilmCamera3D: React.FC<{ y?: number }> = ({ y = 1.2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 70 } });
  const body = { color: "#4a4466", metalness: 0.5, roughness: 0.35 };
  const reel = (x: number, r: number) => (
    <group position={[x, 1.25, 0]} rotation={[0, 0, -frame * 0.12]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.22, 48]} />
        <meshStandardMaterial color="#5a5478" metalness={0.7} roughness={0.25} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.cos((k * Math.PI * 2) / 3) * r * 0.5, Math.sin((k * Math.PI * 2) / 3) * r * 0.5, 0.12]}>
          <circleGeometry args={[r * 0.24, 24]} />
          <meshStandardMaterial color={C.pink} emissive={C.pink} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
  return (
    <Canvas tint={C.pink}>
      <group
        position={[0.55 + (1 - enter) * 7, y, 0]}
        rotation={[0.15, -0.55 + Math.sin(frame / 50) * 0.25 + (1 - enter) * 1.5, 0]}
        scale={0.62}
      >
        <mesh>
          <boxGeometry args={[2.6, 1.5, 1.1]} />
          <meshStandardMaterial {...body} />
        </mesh>
        {reel(-0.75, 0.62)}
        {reel(0.65, 0.55)}
        {/* lens */}
        <mesh position={[1.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.45, 0.6, 48]} />
          <meshStandardMaterial color="#2b2838" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.86, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.04, 48]} />
          <meshStandardMaterial color="#4de8ff" emissive="#4de8ff" emissiveIntensity={0.6} metalness={1} roughness={0.05} />
        </mesh>
        {/* matte box */}
        <mesh position={[2.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.7, 0.42, 0.5, 4, 1, true]} />
          <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
        {/* REC light */}
        <mesh position={[-1.0, 0.45, 0.56]}>
          <sphereGeometry args={[0.09, 24, 24]} />
          <meshStandardMaterial
            color="#ff2a2a"
            emissive="#ff2a2a"
            emissiveIntensity={Math.floor(frame / 15) % 2 === 0 ? 3 : 0.2}
          />
        </mesh>
        {/* tripod */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x * 0.9, -1.55, x > 0 ? 0.3 : -0.3]} rotation={[0, 0, x * 0.35]}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 12]} />
            <meshStandardMaterial color="#333" metalness={0.8} />
          </mesh>
        ))}
      </group>
    </Canvas>
  );
};

const heartShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -1.0);
  s.bezierCurveTo(-0.2, -0.75, -1.2, -0.3, -1.2, 0.35);
  s.bezierCurveTo(-1.2, 0.9, -0.75, 1.15, -0.45, 1.15);
  s.bezierCurveTo(-0.2, 1.15, 0, 0.95, 0, 0.75);
  s.bezierCurveTo(0, 0.95, 0.2, 1.15, 0.45, 1.15);
  s.bezierCurveTo(0.75, 1.15, 1.2, 0.9, 1.2, 0.35);
  s.bezierCurveTo(1.2, -0.3, 0.2, -0.75, 0, -1.0);
  return s;
};

/** Glossy extruded heart that beats on `beats` frames. */
export const Heart3D: React.FC<{ y?: number; beats: number[] }> = ({ y = 1.8, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const geom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(), {
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.22,
      bevelSize: 0.2,
      bevelSegments: 12,
      curveSegments: 48,
    });
    g.center();
    return g;
  }, []);
  const enter = spring({ frame, fps, config: { damping: 11, stiffness: 90 } });
  const pulse = beats.reduce((acc, b) => {
    const d = frame - b;
    return acc + (d >= 0 && d < 20 ? Math.sin((d / 20) * Math.PI) * 0.14 : 0);
  }, 0);
  return (
    <Canvas tint={C.pink}>
      <mesh
        geometry={geom}
        position={[0, y, 0]}
        rotation={[0.1, Math.sin(frame / 28) * 0.55 + (1 - enter) * 6.28, 0]}
        scale={0.8 * enter * (1 + pulse)}
      >
        <meshPhysicalMaterial color="#ff1f6d" roughness={0.18} metalness={0.15} clearcoat={1} clearcoatRoughness={0.1} emissive="#7a0030" emissiveIntensity={0.35} />
      </mesh>
    </Canvas>
  );
};
