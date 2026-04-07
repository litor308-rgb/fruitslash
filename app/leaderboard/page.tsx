"use client";

import { Header } from "@/components/ui/Header";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@/hooks/useWallet";
import { formatScore, truncateAddress } from "@/lib/gameUtils";

export default function LeaderboardPage() {
  const { entries, isLoading, refetch } = useLeaderboard(50);
  const { address, highScore } = useWallet();

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="flex flex-col items-center px-4 pt-20 pb-10">
        <div className="max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
              <p className="text-white/40 text-sm mt-1">Top slashers on Base</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-2 glass rounded-lg text-white/60 hover:text-white text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Player's score card */}
          {address && highScore > 0 && (
            <div className="glass-strong glow-accent rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-game-accent/20 flex items-center justify-center text-lg">
                    🎮
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Your Best</div>
                    <div className="text-white/40 text-xs">{truncateAddress(address)}</div>
                  </div>
                </div>
                <div className="text-game-gold font-bold text-xl">
                  {formatScore(highScore)}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard list */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[50px_1fr_100px] px-4 py-3 border-b border-white/5 text-white/30 text-xs font-semibold uppercase tracking-wider">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Score</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-game-accent/30 border-t-game-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/30 text-sm">Loading scores...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🍉</div>
                <p className="text-white/40 text-sm">No scores yet. Be the first!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const isPlayer =
                    address?.toLowerCase() === entry.player.toLowerCase();

                  return (
                    <div
                      key={entry.rank}
                      className={`grid grid-cols-[50px_1fr_100px] items-center px-4 py-3 transition-colors ${
                        isPlayer
                          ? "bg-game-accent/5"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <span className="text-lg">
                        {entry.rank <= 3 ? (
                          medals[entry.rank - 1]
                        ) : (
                          <span className="text-white/30 text-sm font-medium">
                            #{entry.rank}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-sm font-medium truncate ${
                            isPlayer ? "text-game-accent" : "text-white/70"
                          }`}
                        >
                          {truncateAddress(entry.player)}
                        </span>
                        {isPlayer && (
                          <span className="text-game-accent/60 text-xs flex-shrink-0">
                            (you)
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-right font-bold text-sm ${
                          entry.rank === 1
                            ? "text-game-gold"
                            : entry.rank <= 3
                              ? "text-white"
                              : "text-white/60"
                        }`}
                      >
                        {formatScore(entry.score)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-center text-white/15 text-xs mt-8 pb-4">
            Scores verified on-chain · Base Network
          </div>
        </div>
      </main>
    </div>
  );
}
