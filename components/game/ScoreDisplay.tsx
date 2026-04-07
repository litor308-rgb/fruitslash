"use client";

import { formatTime, formatScore } from "@/lib/gameUtils";

interface ScoreDisplayProps {
  score: number;
  combo: number;
  timeLeft: number;
}

export function ScoreDisplay({ score, combo, timeLeft }: ScoreDisplayProps) {
  const isLowTime = timeLeft <= 10;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-3">
      <div className="flex items-start justify-between">
        {/* Score */}
        <div className="flex flex-col items-start">
          <div className="text-xs text-game-accent/70 font-semibold tracking-widest uppercase">
            Score
          </div>
          <div className="text-2xl font-bold text-white tabular-nums drop-shadow-lg">
            {formatScore(score)}
          </div>
          {combo > 1 && (
            <div
              className={`text-sm font-bold animate-pop-in ${
                combo >= 5
                  ? "text-game-gold"
                  : combo >= 3
                    ? "text-fruit-orange"
                    : "text-game-accent"
              }`}
            >
              x{combo} COMBO!
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-game-accent/70 font-semibold tracking-widest uppercase">
            Time
          </div>
          <div
            className={`text-2xl font-bold tabular-nums drop-shadow-lg ${
              isLowTime ? "text-fruit-red animate-pulse" : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}
