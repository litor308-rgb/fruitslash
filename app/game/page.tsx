"use client";

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { GameCanvas } from "@/components/game/GameCanvas";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Link from "next/link";

export default function GamePage() {
  const { isConnected } = useAccount();
  const {
    address,
    highScore,
    submitScore,
    isSubmitting,
    isSubmitConfirmed,
    refetchHighScore,
  } = useWallet();
  const { submitScore: submitToRedis } = useLeaderboard();

  useEffect(() => {
    if (isSubmitConfirmed) {
      refetchHighScore();
    }
  }, [isSubmitConfirmed, refetchHighScore]);

  const handleScoreSubmit = useCallback(
    (score: number) => {
      submitScore(score);
      if (address) {
        submitToRedis(address, score);
      }
    },
    [submitScore, submitToRedis, address],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-game-bg px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="text-5xl animate-float">🍉</div>
          <h2 className="text-2xl font-bold text-white">Connect to Play</h2>
          <p className="text-white/50 text-sm">
            Connect your wallet to start slashing fruits on Base.
          </p>
          <ConnectButton />
          <Link href="/" className="text-white/30 text-xs hover:text-white/50 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-game-bg overflow-hidden">
      <GameCanvas
        highScore={highScore}
        onScoreSubmit={handleScoreSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
