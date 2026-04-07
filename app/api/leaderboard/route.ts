import { NextRequest, NextResponse } from "next/server";
import { redis, LEADERBOARD_KEY } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const results = await redis.zrange(LEADERBOARD_KEY, 0, limit - 1, { rev: true, withScores: true });

  const entries: { player: string; score: number; rank: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    entries.push({
      player: results[i] as string,
      score: Number(results[i + 1]),
      rank: Math.floor(i / 2) + 1,
    });
  }

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  try {
    const { player, score } = await request.json();

    if (!player || typeof score !== "number" || score <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const currentScore = await redis.zscore(LEADERBOARD_KEY, player);
    if (currentScore !== null && Number(currentScore) >= score) {
      return NextResponse.json({ updated: false, message: "Not a high score" });
    }

    await redis.zadd(LEADERBOARD_KEY, { score, member: player });

    const rank = await redis.zrevrank(LEADERBOARD_KEY, player);

    return NextResponse.json({ updated: true, rank: (rank ?? 0) + 1 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
