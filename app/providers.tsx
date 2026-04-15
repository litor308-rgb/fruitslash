"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { Hex } from "ox";

const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || "";

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  ...(BUILDER_CODE
    ? { dataSuffix: Hex.fromString(BUILDER_CODE) as `0x${string}` }
    : {}),
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
