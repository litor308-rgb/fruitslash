"use client";

import { useRef, useEffect, useCallback } from "react";
import { useGame } from "@/hooks/useGame";
import {
  drawSlashTrail,
  drawFruit,
  drawBomb,
  drawPowerUp,
  drawParticles,
  drawScorePopups,
} from "@/lib/gameUtils";
import { ScoreDisplay } from "./ScoreDisplay";
import { GameOverlay } from "./GameOverlay";

interface GameCanvasProps {
  highScore: number;
  onScoreSubmit: (score: number) => void;
  isSubmitting: boolean;
}

export function GameCanvas({
  highScore,
  onScoreSubmit,
  isSubmitting,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSlashingRef = useRef(false);
  const dprRef = useRef(1);
  const rafRef = useRef<number>(0);
  const autoStartedRef = useRef(false);

  const {
    gameState,
    score,
    combo,
    timeLeft,
    fruitsSliced,
    maxCombo,
    finalScore,
    startGame,
    resetGame,
    update,
    addSlashPoint,
    getGameData,
    setCanvasSize,
  } = useGame();

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    setCanvasSize(rect.width, rect.height);
  }, [setCanvasSize]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Auto-start game on mount
  useEffect(() => {
    if (!autoStartedRef.current && canvasRef.current) {
      autoStartedRef.current = true;
      const timer = setTimeout(() => startGame(), 100);
      return () => clearTimeout(timer);
    }
  }, [startGame]);

  const starsRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([]);

  const initStars = useCallback((w: number, h: number) => {
    if (starsRef.current.length > 0) return;
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        r: 0.5 + Math.random() * 1.5,
        speed: 0.3 + Math.random() * 0.7,
      });
    }
    starsRef.current = stars;
  }, []);

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#0E0620");
      gradient.addColorStop(0.25, "#1A0A2E");
      gradient.addColorStop(0.5, "#3D1545");
      gradient.addColorStop(0.7, "#6B2040");
      gradient.addColorStop(0.85, "#8B3A2A");
      gradient.addColorStop(1, "#2A1030");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      initStars(w, h);
      for (const star of starsRef.current) {
        const twinkle = 0.4 + 0.6 * Math.sin(time * 0.002 * star.speed + star.x);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
        ctx.fill();
      }

      // Subtle glow at horizon
      const glowGrad = ctx.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, w * 0.7);
      glowGrad.addColorStop(0, "rgba(255, 100, 50, 0.08)");
      glowGrad.addColorStop(0.5, "rgba(200, 50, 80, 0.04)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
    },
    [initStars],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const dpr = dprRef.current;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    update(now);
    const data = getGameData();

    ctx.save();
    ctx.scale(dpr, dpr);

    drawBackground(ctx, w, h, now);

    if (data.state === "playing") {
      drawSlashTrail(ctx, data.slashPoints, now);

      for (const fruit of data.fruits) {
        drawFruit(ctx, fruit, dpr);
      }
      for (const bomb of data.bombs) {
        drawBomb(ctx, bomb);
      }
      for (const pu of data.powerUps) {
        drawPowerUp(ctx, pu, now);
      }

      drawParticles(ctx, data.particles);
      drawScorePopups(ctx, data.scorePopups);

      const activePUs = data.activePowerUps;
      if (activePUs.length > 0) {
        for (let i = 0; i < activePUs.length; i++) {
          const pu = activePUs[i];
          const remaining = Math.max(0, pu.expiresAt - now);
          const fraction = remaining / 5000;

          ctx.save();

          const barW = 100;
          const barH = 6;
          const barX = w / 2 - barW / 2;
          const barY = 70 + i * 16;

          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle =
            pu.type === "freeze"
              ? "#00D4FF"
              : pu.type === "doublePoints"
                ? "#FFD700"
                : "#FF3B3B";
          ctx.fillRect(barX, barY, barW * fraction, barH);

          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.fillText(
            pu.type === "freeze"
              ? "❄️ FREEZE"
              : pu.type === "doublePoints"
                ? "✨ 2X POINTS"
                : "🔥 FRENZY",
            w / 2,
            barY - 3,
          );
          ctx.restore();
        }
      }

      if (data.activePowerUps.some((p) => p.type === "freeze" && p.expiresAt > now)) {
        ctx.fillStyle = "rgba(0, 180, 255, 0.06)";
        ctx.fillRect(0, 0, w, h);
      }
    }

    ctx.restore();

    if (data.state === "playing" || data.particles.length > 0) {
      rafRef.current = requestAnimationFrame(render);
    }
  }, [update, getGameData, drawBackground]);

  useEffect(() => {
    if (gameState === "playing") {
      rafRef.current = requestAnimationFrame(render);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, render]);

  const getCanvasCoords = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (gameState !== "playing") return;
      e.preventDefault();
      isSlashingRef.current = true;
      const coords = getCanvasCoords(e);
      if (coords) addSlashPoint(coords.x, coords.y);
    },
    [gameState, getCanvasCoords, addSlashPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isSlashingRef.current || gameState !== "playing") return;
      e.preventDefault();
      const coords = getCanvasCoords(e);
      if (coords) addSlashPoint(coords.x, coords.y);
    },
    [gameState, getCanvasCoords, addSlashPoint],
  );

  const handlePointerUp = useCallback(() => {
    isSlashingRef.current = false;
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const preventScroll = (e: TouchEvent) => e.preventDefault();

    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("touchstart", preventZoom, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("touchstart", preventZoom);
    };
  }, [gameState]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      />

      {gameState === "playing" && (
        <ScoreDisplay score={score} combo={combo} timeLeft={timeLeft} />
      )}

      {gameState === "gameover" && (
        <GameOverlay
          gameState={gameState}
          score={finalScore}
          fruitsSliced={fruitsSliced}
          maxCombo={maxCombo}
          highScore={highScore}
          isNewHighScore={finalScore > highScore}
          onRestart={() => {
            resetGame();
            startGame();
          }}
          onSubmitScore={() => onScoreSubmit(finalScore)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
