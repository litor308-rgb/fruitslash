"use client";

import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-game-bg/70 backdrop-blur-lg border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:animate-shake">🍉</span>
          <span className="font-bold text-lg">
            <span className="bg-gradient-to-r from-fruit-red to-fruit-orange bg-clip-text text-transparent">
              Fruit
            </span>
            <span className="bg-gradient-to-r from-game-accent to-fruit-purple bg-clip-text text-transparent">
              Slash
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-white/60 hover:text-white text-sm font-medium transition-colors hidden sm:block"
          >
            Leaderboard
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
