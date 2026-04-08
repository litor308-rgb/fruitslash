"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Header } from "@/components/ui/Header";
import { useWallet } from "@/hooks/useWallet";

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const {
    totalPlayers,
    hasFruitNFT,
    doSlash,
    isSlashing,
    isSlashConfirmed,
    slashError,
    mintedTokenId,
    clearMintNotification,
    doCheckIn,
    isCheckingIn,
    isCheckInConfirmed,
    checkInError,
    checkedInToday,
    streak,
    refetchCheckIn,
  } = useWallet();

  // After slash confirmed → go to game
  useEffect(() => {
    if (isSlashConfirmed) {
      const timer = setTimeout(() => router.push("/game"), mintedTokenId ? 2500 : 500);
      return () => clearTimeout(timer);
    }
  }, [isSlashConfirmed, router, mintedTokenId]);

  // Refetch check-in status after confirmed
  useEffect(() => {
    if (isCheckInConfirmed) {
      refetchCheckIn();
    }
  }, [isCheckInConfirmed, refetchCheckIn]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* NFT Mint Notification */}
      {mintedTokenId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 p-8 max-w-sm mx-4 animate-pop-in">
            <div className="text-7xl animate-float">🍉</div>
            <h2 className="text-2xl font-bold text-white">Fruit NFT Minted!</h2>
            <p className="text-white/60 text-sm text-center">
              Your Fruit NFT #{mintedTokenId} has been minted. Welcome to FruitSlash!
            </p>
            <div className="text-game-gold text-xs font-medium">
              Entering game...
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col items-center px-4 pt-20 pb-10">
        <div className="flex flex-col items-center gap-8 max-w-lg w-full text-center">
          <div className="relative">
            <div className="absolute -inset-20 bg-gradient-radial from-game-accent/10 to-transparent rounded-full blur-3xl" />
            <div className="relative flex gap-2 text-5xl sm:text-6xl mb-2 animate-float">
              <span>🍎</span>
              <span>🍌</span>
              <span>🍉</span>
              <span>🍊</span>
              <span>🍓</span>
            </div>
          </div>

          <div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-none">
              <span className="text-gradient-fruit">Fruit</span>
              <span className="text-gradient-slash">Slash</span>
            </h1>
            <p className="text-white/50 mt-3 text-lg">
              Slash fruits. Dodge bombs. Score big on Base.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalPlayers}</div>
              <div className="text-white/40 text-xs mt-1">Players</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-game-gold">60s</div>
              <div className="text-white/40 text-xs mt-1">Rounds</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-game-accent">8</div>
              <div className="text-white/40 text-xs mt-1">Fruits</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            {isConnected ? (
              <>
                {/* Check-in */}
                <button
                  onClick={doCheckIn}
                  disabled={isCheckingIn || isCheckInConfirmed || checkedInToday}
                  className={`w-full py-3 px-8 rounded-2xl font-bold text-lg text-center shadow-lg
                    active:scale-95 transition-all duration-200
                    disabled:cursor-not-allowed
                    ${isCheckInConfirmed || checkedInToday
                      ? "bg-green-500/20 border border-green-500/30 text-green-400 shadow-none"
                      : "bg-gradient-to-r from-game-gold to-fruit-orange text-game-bg shadow-game-gold/30 hover:shadow-game-gold/50"
                    }
                    ${isCheckingIn ? "opacity-60" : ""}
                  `}
                >
                  {isCheckingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-game-bg/30 border-t-game-bg rounded-full animate-spin" />
                      Checking in...
                    </span>
                  ) : isCheckInConfirmed || checkedInToday ? (
                    <span className="flex items-center justify-center gap-2">
                      ✓ Checked in{streak > 1 ? ` · ${streak} day streak` : ""}
                    </span>
                  ) : (
                    "Check-in"
                  )}
                </button>

                {checkInError && (
                  <p className="text-fruit-red text-xs">Check-in failed. Try again.</p>
                )}

                {/* Slash */}
                <button
                  onClick={doSlash}
                  disabled={isSlashing}
                  className={`w-full py-4 px-8 bg-gradient-to-r from-game-accent to-fruit-purple rounded-2xl 
                    text-white font-bold text-lg text-center shadow-lg shadow-game-accent/30
                    hover:shadow-game-accent/50 active:scale-95 transition-all duration-200
                    animate-pulse-glow disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isSlashing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {!hasFruitNFT ? "Minting Fruit NFT..." : "Starting..."}
                    </span>
                  ) : (
                    "Slash"
                  )}
                </button>

                {slashError && (
                  <p className="text-fruit-red text-xs">Transaction failed. Try again.</p>
                )}

                {!hasFruitNFT && (
                  <p className="text-white/30 text-xs">
                    First slash mints your Fruit NFT (free, just gas)
                  </p>
                )}
              </>
            ) : (
              <p className="text-white/40 text-sm">
                Connect your wallet to get started
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <FeatureCard
              emoji="⚡"
              title="Fast Rounds"
              desc="60-second action-packed gameplay"
            />
            <FeatureCard
              emoji="🏆"
              title="On-Chain Scores"
              desc="High scores stored on Base"
            />
            <FeatureCard
              emoji="🔥"
              title="Combos"
              desc="Chain slices for big multipliers"
            />
            <FeatureCard
              emoji="💥"
              title="Power-Ups"
              desc="Freeze, 2x points, fruit frenzy"
            />
          </div>

          <div className="glass rounded-2xl p-6 w-full text-left">
            <h2 className="text-lg font-bold text-white mb-4">How to Play</h2>
            <div className="space-y-3">
              <Step n={1} text="Connect your wallet" />
              <Step n={2} text="Check-in daily (resets at 2 AM UTC)" />
              <Step n={3} text="Hit Slash to start a game (first time mints your Fruit NFT)" />
              <Step n={4} text="Swipe across fruits to slice them for points" />
              <Step n={5} text="Chain slices for combo multipliers" />
              <Step n={6} text="Avoid bombs — one hit ends the game" />
              <Step n={7} text="Beat your high score and save it on-chain" />
            </div>
          </div>

          <Link
            href="/leaderboard"
            className="text-game-accent hover:text-game-accent/80 text-sm font-medium transition-colors flex items-center gap-1"
          >
            View Leaderboard
            <span className="text-xs">→</span>
          </Link>

          <div className="text-white/20 text-xs pt-4 pb-8">
            Built on{" "}
            <span className="text-blue-400/60 font-medium">Base</span>{" "}
            · FruitSlash v1.0
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-xl p-4 text-left hover:bg-white/[0.07] transition-colors">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-white/40 text-xs mt-1">{desc}</div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-game-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-game-accent text-xs font-bold">{n}</span>
      </div>
      <p className="text-white/60 text-sm">{text}</p>
    </div>
  );
}
