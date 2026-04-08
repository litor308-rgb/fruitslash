"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { truncateAddress } from "@/lib/gameUtils";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isPending) {
    return (
      <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-sm font-medium">
            {truncateAddress(address)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="px-6 py-2.5 bg-gradient-to-r from-game-accent to-fruit-purple rounded-xl 
        text-white font-semibold text-sm shadow-lg shadow-game-accent/20
        hover:shadow-game-accent/40 active:scale-95 transition-all duration-200"
    >
      Connect Wallet
    </button>
  );
}
