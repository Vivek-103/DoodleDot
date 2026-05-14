"use client";

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

const COLORS = [
  "#2D2D3A", "#FF6B6B", "#FF8FAB", "#FFA94D", "#FFE66D",
  "#4ECDC4", "#A06CD5", "#45B7D1", "#6BCB77", "#FFFFFF",
];

export interface DrawPayload {
  action: "begin" | "stroke" | "clear";
  lx: number;
  ly: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface GameCanvasHandle {
  handleRemoteDraw: (msg: DrawPayload) => void;
}

interface Props {
  send: (msg: Record<string, unknown>) => void;
  isDrawer: boolean;
}

export default forwardRef<GameCanvasHandle, Props>(function GameCanvas({ send, isDrawer }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState("#2D2D3A");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const throttleRef = useRef(0);

  const currentColor = isEraser ? "#FFF8F0" : color;
  const currentSize = isEraser ? brushSize * 3 : brushSize;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const c = el.getContext("2d");
    if (!c) return;
    ctxRef.current = c;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      el.width = rect.width * dpr;
      el.height = rect.height * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.lineCap = "round";
      c.lineJoin = "round";
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const el = canvasRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e) {
        const touch = e.touches[0] || (e as TouchEvent).changedTouches[0];
        if (touch) {
          clientX = touch.clientX;
          clientY = touch.clientY;
        }
      } else {
        clientX = (e as React.MouseEvent | MouseEvent).clientX;
        clientY = (e as React.MouseEvent | MouseEvent).clientY;
      }
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [],
  );

  function drawLine(
    ctx: CanvasRenderingContext2D,
    fromX: number, fromY: number,
    toX: number, toY: number,
    col: string, size: number,
  ) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();
  }

  function drawDot(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    col: string, size: number,
  ) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawer) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawingRef.current = true;
    lastRef.current = pos;
    setCursorPos(pos);

    drawDot(ctx, pos.x, pos.y, currentColor, currentSize);
    send({
      type: "draw",
      action: "begin",
      lx: pos.x, ly: pos.y,
      x: pos.x, y: pos.y,
      color: currentColor,
      size: currentSize,
    });
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    if (isDrawer) setCursorPos(pos);
    if (!drawingRef.current || !isDrawer) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;

    const now = Date.now();
    if (now - throttleRef.current < 33) return;
    throttleRef.current = now;

    drawLine(ctx, lastRef.current.x, lastRef.current.y, pos.x, pos.y, currentColor, currentSize);
    send({
      type: "draw",
      action: "stroke",
      lx: lastRef.current.x, ly: lastRef.current.y,
      x: pos.x, y: pos.y,
      color: currentColor,
      size: currentSize,
    });
    lastRef.current = pos;
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function handlePointerLeave() {
    drawingRef.current = false;
    setCursorPos(null);
  }

  function handleClear() {
    const c = ctxRef.current;
    if (!c) return;
    const el = canvasRef.current;
    if (!el) return;
    c.clearRect(0, 0, el.width, el.height);
    send({ type: "draw", action: "clear" });
  }

  const handleRemoteDraw = useCallback((msg: DrawPayload) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (msg.action === "clear") {
      const canvas = canvasRef.current;
      if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (msg.action === "begin") {
      drawDot(ctx, msg.x, msg.y, msg.color, msg.size);
    } else if (msg.action === "stroke") {
      drawLine(ctx, msg.lx, msg.ly, msg.x, msg.y, msg.color, msg.size);
    }
  }, []);

  useImperativeHandle(ref, () => ({ handleRemoteDraw }), [handleRemoteDraw]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
      <div
        style={{
          flex: 1,
          background: "#FFF8F0",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: isDrawer ? "none" : "default",
            touchAction: "none",
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerLeave}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {isDrawer && cursorPos && (
          <div
            style={{
              position: "absolute",
              left: cursorPos.x - currentSize / 2,
              top: cursorPos.y - currentSize / 2,
              width: currentSize,
              height: currentSize,
              borderRadius: "50%",
              background: isEraser ? "transparent" : currentColor,
              border: isEraser ? `2px solid var(--charcoal)` : `1px solid rgba(0,0,0,0.3)`,
              pointerEvents: "none",
              zIndex: 10,
              transition: "width 0.1s, height 0.1s, background 0.1s",
            }}
          />
        )}
        {!isDrawer && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              color: "var(--text-soft)",
              fontFamily: "var(--font-fredoka)",
              fontSize: "1.2rem",
              opacity: 0.5,
            }}
          >
            Waiting for the drawer...
          </div>
        )}
      </div>

      {isDrawer && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                style={{
                  width: 28, height: 28,
                  borderRadius: "50%",
                  border: color === c && !isEraser ? "3px solid var(--charcoal)" : "2px solid transparent",
                  background: c,
                  cursor: "pointer",
                  transition: "transform 0.15s",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <input
              type="range"
              min={2}
              max={20}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ width: 80, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-soft)", minWidth: 20 }}>
              {brushSize}
            </span>
          </div>

          <button
            onClick={() => setIsEraser(!isEraser)}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: isEraser ? "2px solid var(--coral)" : "2px solid var(--cream-dark)",
              background: isEraser ? "rgba(255,107,107,0.1)" : "transparent",
              fontFamily: "var(--font-outfit)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              color: isEraser ? "var(--coral)" : "var(--text-soft)",
            }}
          >
            Eraser
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: "2px solid var(--cream-dark)",
              background: "transparent",
              fontFamily: "var(--font-outfit)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--text-soft)",
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
});
