"use client";

import { useCallback, useEffect, useState } from "react";

export interface LeaderboardEntry {
  player: string;
  score: number;
  rank: number;
}

export function useLeaderboard(limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      setEntries(data.entries);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const submitScore = useCallback(async (player: string, score: number) => {
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, score }),
      });
      const data = await res.json();
      if (data.updated) {
        await fetchLeaderboard();
      }
      return data;
    } catch {
      return { updated: false };
    }
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    error,
    refetch: fetchLeaderboard,
    submitScore,
  };
}
