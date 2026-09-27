import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

interface SlideProps {
  photo: string;
  index: number;
  totalSlides: number;
  durationPerSlideFrames: number;
}

export const Slide: React.FC<SlideProps> = ({
  photo,
  index,
  totalSlides,
  durationPerSlideFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calcular cuando empieza y termina esta foto
  const startFrame = index * durationPerSlideFrames;
  const endFrame = startFrame + durationPerSlideFrames;

  // Si no estamos en el rango de esta foto, no renderizar
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  // Progreso de la foto actual (0 a 1)
  const progress = (frame - startFrame) / durationPerSlideFrames;

  // Efectos de entrada (primeros 0.3 de la duración)
  const entryProgress = Math.min(progress / 0.3, 1);

  // Efecto de salida (últimos 0.2 de la duración)
  const exitProgress = progress > 0.8 ? (progress - 0.8) / 0.2 : 0;

  // Opacidad: entra suave, sale suave
  const opacity = interpolate(
    progress,
    [0, 0.3, 0.8, 1],
    [0, 1, 1, 0],
    { easing: Easing.bezier(0.34, 1.56, 0.64, 1) }
  );

  // Zoom Ken Burns effect (zoom suave durante la foto)
  const scale = interpolate(progress, [0, 1], [1, 1.15], {
    easing: Easing.out(Easing.cubic),
  });

  // Rotación sutil
  const rotation = interpolate(progress, [0, 1], [0.5, -0.5], {
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  });

  // Posición X y Y para movimiento sutil (pan effect)
  const panX = interpolate(progress, [0, 1], [20, -20], {
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  });

  const panY = interpolate(progress, [0, 1], [30, -30], {
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
      }}
    >
      {/* Imagen con zoom y movimiento */}
      <Img
        src={photo}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${panX}px) translateY(${panY}px) rotate(${rotation}deg)`,
          transformOrigin: "center",
        }}
      />

      {/* Overlay de color para efecto cinematográfico */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Bordes redondeados sutiles */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
