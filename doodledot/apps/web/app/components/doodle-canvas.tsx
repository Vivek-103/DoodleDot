"use client";

import { useRef, useEffect } from "react";

type DoodleType = "circle" | "star" | "zigzag" | "triangle";

interface Doodle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  alpha: number;
  alphaSpeed: number;
  type: DoodleType;
  phase: number;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A06CD5", "#FF8FAB", "#FFA94D"];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDoodle(width: number, height: number): Doodle {
  const type: DoodleType[] = ["circle", "star", "zigzag", "triangle"];
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomBetween(-0.3, 0.3),
    vy: randomBetween(-0.3, 0.3),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: randomBetween(-0.008, 0.008),
    size: randomBetween(20, 80),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    alpha: randomBetween(0.15, 0.35),
    alphaSpeed: randomBetween(0.002, 0.006),
    type: type[Math.floor(Math.random() * type.length)]!,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawCircle(ctx: CanvasRenderingContext2D, size: number) {
  const r = size / 2;
  const segments = 16;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 1.5;
    const rad = r + jitter;
    const x = Math.cos(angle) * rad;
    const y = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const outerR = size / 2;
  const innerR = outerR * 0.4;
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const jitter = (Math.random() - 0.5) * 2;
    const x = Math.cos(angle) * (r + jitter);
    const y = Math.sin(angle) * (r + jitter);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}


function drawZigzag(ctx: CanvasRenderingContext2D, size: number) {
  const peaks = 5;
  const segW = size / peaks;
  ctx.beginPath();
  let x = -size / 2;
  let y = 0;
  ctx.moveTo(x, y);
  for (let i = 0; i < peaks; i++) {
    x = x + segW;
    y = i % 2 === 0 ? -size * 0.3 : size * 0.3;
    y += (Math.random() - 0.5) * 4;
    ctx.lineTo(x, y);
  }
}

function drawTriangle(ctx: CanvasRenderingContext2D, size: number) {
  const r = size / 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const jitter = (Math.random() - 0.5) * 3;
    const x = Math.cos(angle) * (r + jitter);
    const y = Math.sin(angle) * (r + jitter);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawDoodle(ctx: CanvasRenderingContext2D, doodle: Doodle) {
  ctx.save();
  ctx.translate(doodle.x, doodle.y);
  ctx.rotate(doodle.rotation);
  ctx.globalAlpha = doodle.alpha;
  ctx.strokeStyle = doodle.color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (doodle.type) {
    case "circle":
      drawCircle(ctx, doodle.size);
      break;
    case "star":
      drawStar(ctx, doodle.size);
      break;
    case "zigzag":
      drawZigzag(ctx, doodle.size);
      break;
    case "triangle":
      drawTriangle(ctx, doodle.size);
      break;
  }

  ctx.stroke();
  ctx.restore();
}

export default function DoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const c = el.getContext("2d");
    if (!c) return;

    let animId: number;
    const doodles: Doodle[] = [];

    const resize = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 12000), 40);
    for (let i = 0; i < count; i++) {
      doodles.push(createDoodle(el.width, el.height));
    }

    const animate = () => {
      c.clearRect(0, 0, el.width, el.height);

      for (const d of doodles) {
        const dx = mouseRef.current.x - d.x;
        const dy = mouseRef.current.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          d.vx -= (dx / dist) * force * 0.5;
          d.vy -= (dy / dist) * force * 0.5;
        }

        d.vx += (Math.random() - 0.5) * 0.02;
        d.vy += (Math.random() - 0.5) * 0.02;

        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        if (speed > 1) {
          d.vx = (d.vx / speed) * 1;
          d.vy = (d.vy / speed) * 1;
        }

        d.x += d.vx;
        d.y += d.vy;
        d.rotation += d.rotationSpeed;
        d.phase += d.alphaSpeed;
        d.alpha = 0.15 + 0.2 * Math.sin(d.phase);

        if (d.x < -100) d.x = el.width + 100;
        if (d.x > el.width + 100) d.x = -100;
        if (d.y < -100) d.y = el.height + 100;
        if (d.y > el.height + 100) d.y = -100;

        drawDoodle(c, d);
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
