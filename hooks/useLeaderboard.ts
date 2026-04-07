"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI } from "@/lib/constants";

export interface LeaderboardEntry {
  player: string;
  score: number;
  timestamp: number;
  rank: number;
}

export function useLeaderboard(limit = 20) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FRUIT_SLASH_ABI,
    functionName: "getTopScores",
    args: [BigInt(limit)],
  });

  const entries: LeaderboardEntry[] = data
    ? (data as Array<{ player: string; score: bigint; timestamp: bigint }>).map(
        (entry, idx) => ({
          player: entry.player,
          score: Number(entry.score),
          timestamp: Number(entry.timestamp),
          rank: idx + 1,
        }),
      )
    : [];

  return {
    entries,
    isLoading,
    error,
    refetch,
  };
}
