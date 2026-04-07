"use client";

import { type GameState } from "@/hooks/useGame";
import { formatScore } from "@/lib/gameUtils";

interface GameOverlayProps {
  gameState: GameState;
  score: number;
  fruitsSliced: number;
  maxCombo: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onSubmitScore: () => void;
  isSubmitting: boolean;
}

export function GameOverlay({
  gameState,
  score,
  fruitsSliced,
  maxCombo,
  highScore,
  isNewHighScore,
  onRestart,
  onSubmitScore,
  isSubmitting,
}: GameOverlayProps) {
  if (gameState !== "gameover") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          {isNewHighScore && score > 0 ? (
            <>
              <div className="text-game-gold text-sm font-bold tracking-widest uppercase mb-1 animate-pop-in">
                New High Score!
              </div>
              <div className="text-5xl font-bold text-game-gold animate-pop-in drop-shadow-lg">
                {formatScore(score)}
              </div>
            </>
          ) : (
            <>
              <div className="text-white/60 text-sm font-semibold tracking-widest uppercase mb-1">
                Game Over
              </div>
              <div className="text-4xl font-bold text-white drop-shadow-lg">
                {formatScore(score)}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="text-2xl mb-1">🍉</div>
            <div className="text-white font-bold">{fruitsSliced}</div>
            <div className="text-white/40 text-xs">Sliced</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-white font-bold">x{maxCombo}</div>
            <div className="text-white/40 text-xs">Max Combo</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {isNewHighScore && score > 0 && (
            <button
              onClick={onSubmitScore}
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-gradient-to-r from-game-gold to-fruit-orange rounded-xl 
                text-game-bg font-bold shadow-lg shadow-game-gold/30
                hover:shadow-game-gold/50 active:scale-95 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-game-bg/30 border-t-game-bg rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Score On-Chain"
              )}
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-3 px-6 bg-gradient-to-r from-game-accent to-fruit-purple rounded-xl 
              text-white font-bold shadow-lg shadow-game-accent/30
              hover:shadow-game-accent/50 active:scale-95 transition-all duration-200"
          >
            Play Again
          </button>
        </div>

        {highScore > 0 && !isNewHighScore && (
          <div className="text-white/40 text-xs">
            Your best: {formatScore(highScore)}
          </div>
        )}
      </div>
    </div>
  );
}
