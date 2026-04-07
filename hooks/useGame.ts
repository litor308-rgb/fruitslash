"use client";

import { useCallback, useRef, useState } from "react";
import {
  GAME_CONFIG,
  type PowerUpType,
} from "@/lib/constants";
import { soundManager } from "@/lib/sounds";
import {
  type GameFruit,
  type GameBomb,
  type GamePowerUp,
  type SlashPoint,
  type Particle,
  type ScorePopup,
  spawnFruit,
  spawnBomb,
  spawnPowerUp,
  updatePhysics,
  isOffScreen,
  checkSlashCollision,
  createParticles,
  updateParticle,
  createScorePopup,
  updateScorePopup,
} from "@/lib/gameUtils";

export type GameState = "idle" | "playing" | "paused" | "gameover";

interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number;
}

export interface GameData {
  state: GameState;
  score: number;
  combo: number;
  timeLeft: number;
  fruits: GameFruit[];
  bombs: GameBomb[];
  powerUps: GamePowerUp[];
  particles: Particle[];
  scorePopups: ScorePopup[];
  slashPoints: SlashPoint[];
  activePowerUps: ActivePowerUp[];
  fruitsSliced: number;
  maxCombo: number;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.ROUND_DURATION);
  const [fruitsSliced, setFruitsSliced] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const fruitsRef = useRef<GameFruit[]>([]);
  const bombsRef = useRef<GameBomb[]>([]);
  const powerUpsRef = useRef<GamePowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const slashPointsRef = useRef<SlashPoint[]>([]);
  const activePowerUpsRef = useRef<ActivePowerUp[]>([]);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const lastComboTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const timeLeftRef = useRef(GAME_CONFIG.ROUND_DURATION);
  const gameStartRef = useRef(0);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const gameStateRef = useRef<GameState>("idle");
  const fruitsSlicedRef = useRef(0);
  const maxComboRef = useRef(0);

  const setCanvasSize = useCallback((width: number, height: number) => {
    canvasSizeRef.current = { width, height };
  }, []);

  const isFrozen = useCallback((): boolean => {
    const now = performance.now();
    return activePowerUpsRef.current.some(
      (p) => p.type === "freeze" && p.expiresAt > now,
    );
  }, []);

  const isDoublePoints = useCallback((): boolean => {
    const now = performance.now();
    return activePowerUpsRef.current.some(
      (p) => p.type === "doublePoints" && p.expiresAt > now,
    );
  }, []);

  const endGameFn = useCallback(() => {
    gameStateRef.current = "gameover";
    setGameState("gameover");
    setFinalScore(scoreRef.current);
    soundManager.gameOver();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  const addSlashPoint = useCallback((x: number, y: number) => {
    const now = performance.now();
    slashPointsRef.current.push({ x, y, time: now });
    if (slashPointsRef.current.length > 30) {
      slashPointsRef.current = slashPointsRef.current.slice(-30);
    }

    // Check collisions with fruits
    for (const fruit of fruitsRef.current) {
      if (fruit.sliced) continue;
      if (checkSlashCollision(slashPointsRef.current, fruit.pos, fruit.radius)) {
        fruit.sliced = true;
        fruit.sliceTime = now;

        const timeSinceLastCombo = now - lastComboTimeRef.current;
        if (timeSinceLastCombo < GAME_CONFIG.COMBO_WINDOW_MS) {
          comboRef.current = Math.min(comboRef.current + 1, GAME_CONFIG.COMBO_MULTIPLIER_MAX);
        } else {
          comboRef.current = 1;
        }
        lastComboTimeRef.current = now;

        const multiplier = isDoublePoints() ? 2 : 1;
        const points = fruit.config.points * comboRef.current * multiplier;
        scoreRef.current += points;
        fruitsSlicedRef.current++;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);

        setScore(scoreRef.current);
        setCombo(comboRef.current);
        setFruitsSliced(fruitsSlicedRef.current);
        setMaxCombo(maxComboRef.current);

        particlesRef.current.push(
          ...createParticles(fruit.pos.x, fruit.pos.y, fruit.config.splashColor, 6),
        );
        scorePopupsRef.current.push(
          createScorePopup(fruit.pos.x, fruit.pos.y, points, comboRef.current),
        );

        triggerHaptic();
        soundManager.slice();
        if (comboRef.current > 1) {
          soundManager.combo(comboRef.current);
        }
      }
    }

    // Check collisions with bombs
    for (const bomb of bombsRef.current) {
      if (bomb.hit) continue;
      if (checkSlashCollision(slashPointsRef.current, bomb.pos, bomb.radius)) {
        bomb.hit = true;
        particlesRef.current.push(
          ...createParticles(bomb.pos.x, bomb.pos.y, "#FF4444", 10),
        );
        soundManager.bomb();
        endGameFn();
        return;
      }
    }

    // Check collisions with power-ups
    for (const pu of powerUpsRef.current) {
      if (pu.collected) continue;
      if (checkSlashCollision(slashPointsRef.current, pu.pos, pu.radius)) {
        pu.collected = true;
        soundManager.powerUp();
        activePowerUpsRef.current.push({
          type: pu.type,
          expiresAt: now + pu.duration,
        });
        particlesRef.current.push(
          ...createParticles(pu.pos.x, pu.pos.y, pu.color, 8),
        );

        if (pu.type === "frenzy") {
          const { width, height } = canvasSizeRef.current;
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              if (fruitsRef.current.length < GAME_CONFIG.MAX_FRUITS_ON_SCREEN) {
                fruitsRef.current.push(spawnFruit(width, height));
              }
            }, i * 200);
          }
        }
      }
    }
  }, [isDoublePoints, endGameFn]);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
  }, []);

  const spawnObjects = useCallback((now: number) => {
    const { width, height } = canvasSizeRef.current;
    if (width === 0) return;

    const elapsed = (now - gameStartRef.current) / 1000;
    const difficultyScale = Math.min(elapsed / GAME_CONFIG.ROUND_DURATION, 1);
    const interval =
      GAME_CONFIG.SPAWN_INTERVAL_MS -
      difficultyScale * (GAME_CONFIG.SPAWN_INTERVAL_MS - GAME_CONFIG.SPAWN_INTERVAL_MIN_MS);

    if (now - lastSpawnRef.current > interval) {
      lastSpawnRef.current = now;

      const fruitCount = 1 + Math.floor(Math.random() * (1 + difficultyScale));
      for (let i = 0; i < fruitCount; i++) {
        if (fruitsRef.current.length < GAME_CONFIG.MAX_FRUITS_ON_SCREEN) {
          fruitsRef.current.push(spawnFruit(width, height));
        }
      }

      if (Math.random() < GAME_CONFIG.BOMB_CHANCE + difficultyScale * 0.08) {
        bombsRef.current.push(spawnBomb(width, height));
      }

      if (Math.random() < GAME_CONFIG.POWERUP_CHANCE) {
        powerUpsRef.current.push(spawnPowerUp(width, height));
      }
    }
  }, []);

  const update = useCallback(
    (now: number) => {
      if (gameStateRef.current !== "playing") return;

      const { height } = canvasSizeRef.current;
      const frozen = isFrozen();

      // Update time
      const elapsed = (now - gameStartRef.current) / 1000;
      const newTimeLeft = Math.max(0, GAME_CONFIG.ROUND_DURATION - elapsed);
      timeLeftRef.current = newTimeLeft;
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        endGameFn();
        return;
      }

      spawnObjects(now);

      // Update fruits
      fruitsRef.current = fruitsRef.current
        .map((f) => {
          if (f.sliced) {
            return { ...f, opacity: f.opacity - 0.04 };
          }
          return updatePhysics(f, GAME_CONFIG.GRAVITY, frozen);
        })
        .filter((f) => {
          if (f.sliced && f.opacity <= 0) return false;
          if (!f.sliced && isOffScreen(f.pos, f.radius, height)) return false;
          return true;
        });

      // Update bombs
      bombsRef.current = bombsRef.current
        .map((b) => updatePhysics(b, GAME_CONFIG.GRAVITY, frozen))
        .filter((b) => !b.hit && !isOffScreen(b.pos, b.radius, height));

      // Update power-ups
      powerUpsRef.current = powerUpsRef.current
        .map((p) => updatePhysics(p, GAME_CONFIG.GRAVITY, frozen))
        .filter((p) => !p.collected && !isOffScreen(p.pos, p.radius, height));

      // Update particles
      particlesRef.current = particlesRef.current
        .map(updateParticle)
        .filter((p) => p.life > 0);

      // Update score popups
      scorePopupsRef.current = scorePopupsRef.current
        .map(updateScorePopup)
        .filter((p) => p.life > 0);

      // Clean expired power-ups
      activePowerUpsRef.current = activePowerUpsRef.current.filter(
        (p) => p.expiresAt > now,
      );

      // Clean old slash points
      slashPointsRef.current = slashPointsRef.current.filter(
        (p) => now - p.time < 200,
      );

      // Decay combo
      if (now - lastComboTimeRef.current > GAME_CONFIG.COMBO_WINDOW_MS * 2) {
        comboRef.current = 0;
        setCombo(0);
      }
    },
    [isFrozen, spawnObjects, endGameFn],
  );

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    bombsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    scorePopupsRef.current = [];
    slashPointsRef.current = [];
    activePowerUpsRef.current = [];
    comboRef.current = 0;
    scoreRef.current = 0;
    lastComboTimeRef.current = 0;
    lastSpawnRef.current = 0;
    timeLeftRef.current = GAME_CONFIG.ROUND_DURATION;
    gameStartRef.current = performance.now();
    fruitsSlicedRef.current = 0;
    maxComboRef.current = 0;

    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_CONFIG.ROUND_DURATION);
    setFruitsSliced(0);
    setMaxCombo(0);

    gameStateRef.current = "playing";
    setGameState("playing");
    soundManager.gameStart();
  }, []);

  const resetGame = useCallback(() => {
    gameStateRef.current = "idle";
    setGameState("idle");
    fruitsRef.current = [];
    bombsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    scorePopupsRef.current = [];
    slashPointsRef.current = [];
    activePowerUpsRef.current = [];
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_CONFIG.ROUND_DURATION);
    setFinalScore(0);
  }, []);

  const getGameData = useCallback((): GameData => {
    return {
      state: gameStateRef.current,
      score: scoreRef.current,
      combo: comboRef.current,
      timeLeft: timeLeftRef.current,
      fruits: fruitsRef.current,
      bombs: bombsRef.current,
      powerUps: powerUpsRef.current,
      particles: particlesRef.current,
      scorePopups: scorePopupsRef.current,
      slashPoints: slashPointsRef.current,
      activePowerUps: activePowerUpsRef.current,
      fruitsSliced: fruitsSlicedRef.current,
      maxCombo: maxComboRef.current,
    };
  }, []);

  return {
    gameState,
    score,
    combo,
    timeLeft,
    fruitsSliced,
    maxCombo,
    finalScore,
    startGame,
    endGame: endGameFn,
    resetGame,
    update,
    addSlashPoint,
    getGameData,
    setCanvasSize,
  };
}
