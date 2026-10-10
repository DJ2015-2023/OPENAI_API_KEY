import * as THREE from "three";

const make = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

export const stripeTexture = () =>
  make(1024, 160, (ctx) => {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 1024, 160);
    ctx.fillStyle = "#f5f5f5";
    for (let x = -200; x < 1200; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, 160);
      ctx.lineTo(x + 70, 160);
      ctx.lineTo(x + 150, 0);
      ctx.lineTo(x + 80, 0);
      ctx.closePath();
      ctx.fill();
    }
  });

export const slateTexture = () =>
  make(1024, 720, (ctx) => {
    ctx.fillStyle = "#16141c";
    ctx.fillRect(0, 0, 1024, 720);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 964, 660);
    ctx.beginPath();
    ctx.moveTo(30, 260);
    ctx.lineTo(994, 260);
    ctx.moveTo(30, 480);
    ctx.lineTo(994, 480);
    ctx.moveTo(512, 480);
    ctx.lineTo(512, 690);
    ctx.stroke();
    ctx.fillStyle = "#ff2e88";
    ctx.font = "900 120px 'Unbounded', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VIDEO CLIP", 512, 190);
    ctx.fillStyle = "#fff8f2";
    ctx.font = "800 70px 'Montserrat', sans-serif";
    ctx.fillText("ТВОЯ ИСТОРИЯ", 512, 400);
    ctx.font = "700 46px 'Montserrat', sans-serif";
    ctx.fillStyle = "#ffc94d";
    ctx.fillText("СЦЕНА 1", 271, 610);
    ctx.fillText("ДУБЛЬ 1", 753, 610);
  });

export const vinylLabelTexture = () =>
  make(512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
    g.addColorStop(0, "#ffc94d");
    g.addColorStop(1, "#ff2e88");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0b2e";
    ctx.font = "900 64px 'Unbounded', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ТВОЯ", 256, 190);
    ctx.fillText("ПЕСНЯ", 256, 370);
    ctx.beginPath();
    ctx.arc(256, 256, 20, 0, Math.PI * 2);
    ctx.fill();
  });

export const grooveTexture = () =>
  make(1024, 1024, (ctx) => {
    ctx.fillStyle = "#0c0c10";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let r = 200; r < 510; r += 3) {
      ctx.strokeStyle = r % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // light sheen wedges
    const g = ctx.createConicGradient(0, 512, 512);
    g.addColorStop(0, "rgba(255,255,255,0.18)");
    g.addColorStop(0.08, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.14)");
    g.addColorStop(0.58, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0.18)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(512, 512, 510, 0, Math.PI * 2);
    ctx.fill();
  });
