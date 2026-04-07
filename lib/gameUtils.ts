import {
  GAME_CONFIG,
  FRUITS,
  POWERUPS,
  type FruitConfig,
  type PowerUpType,
} from "./constants";

export interface Vec2 {
  x: number;
  y: number;
}

export interface GameFruit {
  id: number;
  config: FruitConfig;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  sliced: boolean;
  sliceTime: number;
  opacity: number;
}

export interface GameBomb {
  id: number;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  hit: boolean;
}

export interface GamePowerUp {
  id: number;
  type: PowerUpType;
  emoji: string;
  color: string;
  duration: number;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  radius: number;
  collected: boolean;
}

export interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

let nextId = 0;
export function getNextId(): number {
  return ++nextId;
}

export function spawnFruit(canvasWidth: number, canvasHeight: number): GameFruit {
  const config = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const x = GAME_CONFIG.CANVAS_PADDING + Math.random() * (canvasWidth - GAME_CONFIG.CANVAS_PADDING * 2);

  const vx = (Math.random() - 0.5) * 4;
  const vy = -(canvasHeight * 0.014 + Math.random() * canvasHeight * 0.012);

  return {
    id: getNextId(),
    config,
    pos: { x, y: canvasHeight + config.radius },
    vel: { x: vx, y: vy },
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    radius: config.radius,
    sliced: false,
    sliceTime: 0,
    opacity: 1,
  };
}

export function spawnBomb(canvasWidth: number, canvasHeight: number): GameBomb {
  const x = GAME_CONFIG.CANVAS_PADDING + Math.random() * (canvasWidth - GAME_CONFIG.CANVAS_PADDING * 2);

  return {
    id: getNextId(),
    pos: { x, y: canvasHeight + 30 },
    vel: {
      x: (Math.random() - 0.5) * 3,
      y: -(canvasHeight * 0.013 + Math.random() * canvasHeight * 0.011),
    },
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.1,
    radius: 30,
    hit: false,
  };
}

export function spawnPowerUp(canvasWidth: number, canvasHeight: number): GamePowerUp {
  const pu = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
  const x = GAME_CONFIG.CANVAS_PADDING + Math.random() * (canvasWidth - GAME_CONFIG.CANVAS_PADDING * 2);

  return {
    id: getNextId(),
    type: pu.type,
    emoji: pu.emoji,
    color: pu.color,
    duration: pu.duration,
    pos: { x, y: canvasHeight + 30 },
    vel: {
      x: (Math.random() - 0.5) * 3,
      y: -(canvasHeight * 0.014 + Math.random() * canvasHeight * 0.011),
    },
    rotation: 0,
    radius: 30,
    collected: false,
  };
}

export function updatePhysics<T extends { pos: Vec2; vel: Vec2; rotation: number; rotationSpeed?: number }>(
  obj: T,
  gravity: number,
  frozen: boolean,
): T {
  if (frozen) return obj;
  return {
    ...obj,
    pos: {
      x: obj.pos.x + obj.vel.x,
      y: obj.pos.y + obj.vel.y,
    },
    vel: {
      x: obj.vel.x,
      y: obj.vel.y + gravity,
    },
    rotation: obj.rotation + (obj.rotationSpeed ?? 0),
  };
}

export function isOffScreen(pos: Vec2, radius: number, canvasHeight: number): boolean {
  return pos.y > canvasHeight + radius * 2;
}

export function checkSlashCollision(
  slashPoints: SlashPoint[],
  objPos: Vec2,
  objRadius: number,
): boolean {
  if (slashPoints.length < 2) return false;

  for (let i = slashPoints.length - 1; i >= Math.max(0, slashPoints.length - 6); i--) {
    const p = slashPoints[i];
    const dx = p.x - objPos.x;
    const dy = p.y - objPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < objRadius + 10) return true;
  }

  return false;
}

export function createParticles(
  x: number,
  y: number,
  color: string,
  count: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color,
      size: 3 + Math.random() * 6,
      life: 1,
      maxLife: 1,
    });
  }
  return particles;
}

export function updateParticle(p: Particle): Particle {
  return {
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vy: p.vy + 0.15,
    life: p.life - 0.025,
    size: p.size * 0.97,
  };
}

export function createScorePopup(
  x: number,
  y: number,
  points: number,
  combo: number,
): ScorePopup {
  const text = combo > 1 ? `+${points} x${combo}` : `+${points}`;
  const color =
    combo >= 5
      ? "#FFD700"
      : combo >= 3
        ? "#FF8C42"
        : "#FFFFFF";

  return { x, y, text, color, life: 1, vy: -2 };
}

export function updateScorePopup(p: ScorePopup): ScorePopup {
  return {
    ...p,
    y: p.y + p.vy,
    life: p.life - 0.02,
  };
}

export function drawSlashTrail(
  ctx: CanvasRenderingContext2D,
  points: SlashPoint[],
  now: number,
): void {
  if (points.length < 2) return;

  const recentPoints = points.filter((p) => now - p.time < 150);
  if (recentPoints.length < 2) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < recentPoints.length; i++) {
    const age = (now - recentPoints[i].time) / 150;
    const alpha = Math.max(0, 1 - age);
    const width = Math.max(1, (1 - age) * 8);

    ctx.beginPath();
    ctx.moveTo(recentPoints[i - 1].x, recentPoints[i - 1].y);
    ctx.lineTo(recentPoints[i].x, recentPoints[i].y);

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = width + 2;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(
      recentPoints[i - 1].x,
      recentPoints[i - 1].y,
      recentPoints[i].x,
      recentPoints[i].y,
    );
    gradient.addColorStop(0, `rgba(0, 212, 255, ${alpha})`);
    gradient.addColorStop(1, `rgba(138, 43, 226, ${alpha})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  fruit: GameFruit,
  dpr: number,
): void {
  ctx.save();
  ctx.translate(fruit.pos.x, fruit.pos.y);
  ctx.rotate(fruit.rotation);
  ctx.globalAlpha = fruit.opacity;

  if (fruit.sliced) {
    ctx.globalAlpha = fruit.opacity * 0.6;
  }

  ctx.font = `${fruit.radius * 1.6}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fruit.config.emoji, 0, 0);

  if (!fruit.sliced) {
    ctx.shadowColor = fruit.config.color;
    ctx.shadowBlur = 15;
    ctx.fillText(fruit.config.emoji, 0, 0);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function drawBomb(
  ctx: CanvasRenderingContext2D,
  bomb: GameBomb,
): void {
  ctx.save();
  ctx.translate(bomb.pos.x, bomb.pos.y);
  ctx.rotate(bomb.rotation);

  ctx.font = `${bomb.radius * 1.8}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💣", 0, 0);

  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 20;
  ctx.fillText("💣", 0, 0);
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  pu: GamePowerUp,
  time: number,
): void {
  ctx.save();
  ctx.translate(pu.pos.x, pu.pos.y);

  const pulse = 1 + Math.sin(time * 0.008) * 0.15;
  ctx.scale(pulse, pulse);

  ctx.shadowColor = pu.color;
  ctx.shadowBlur = 25;

  ctx.font = `${pu.radius * 1.6}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pu.emoji, 0, 0);

  ctx.restore();
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): void {
  for (const p of particles) {
    if (p.life <= 0) continue;
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawScorePopups(
  ctx: CanvasRenderingContext2D,
  popups: ScorePopup[],
): void {
  for (const p of popups) {
    if (p.life <= 0) continue;
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${18 + (1 - p.life) * 8}px 'Fredoka One', sans-serif`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
