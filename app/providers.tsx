"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { Attribution } from "ox/erc8021";

const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || "bc_svo26rsq";

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
  ],
  transports: {
    [base.id]: http(PAYMASTER_URL || "https://mainnet.base.org"),
  },
  ssr: true,
  ...(BUILDER_CODE
    ? { dataSuffix: Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) }
    : {}),
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
