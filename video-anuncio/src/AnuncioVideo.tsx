import React from "react";
import { Composition, useVideoConfig } from "remotion";
import { Slide } from "./Slide";

// 14 fotos en orden
const PHOTOS = Array.from({ length: 14 }, (_, i) => `/images/S ${String(i + 1).padStart(2, "0")}.png`);

// Configuración profesional
const DURATION_PER_SLIDE = 2.5; // 2.5 segundos por foto
const TRANSITION_DURATION = 0.8; // 0.8s de transición
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920; // 9:16 aspect ratio
const TOTAL_DURATION = Math.ceil(PHOTOS.length * DURATION_PER_SLIDE * FPS);

export const AnuncioVideo: React.FC = () => {
  return (
    <Composition
      id="AnuncioVideo"
      component={VideoComponent}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{}}
    />
  );
};

const VideoComponent: React.FC = () => {
  const { fps } = useVideoConfig();
  const durationPerSlideFrames = Math.round(DURATION_PER_SLIDE * fps);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Fondo negro */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
        }}
      />

      {/* Slides */}
      {PHOTOS.map((photo, index) => (
        <Slide
          key={index}
          photo={photo}
          index={index}
          totalSlides={PHOTOS.length}
          durationPerSlideFrames={durationPerSlideFrames}
        />
      ))}

      {/* Vignette overlay para efecto profesional */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
