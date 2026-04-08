"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { AuthContext, type AuthState } from "@/hooks/useAuth";

const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
  ],
  transports: {
    [base.id]: http(PAYMASTER_URL || "https://mainnet.base.org"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

const AUTO_AUTH: AuthState = {
  authenticated: true,
  ready: true,
  login: () => {},
  logout: async () => {},
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={AUTO_AUTH}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
