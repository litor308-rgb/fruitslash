"use client";

import { type ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { PRIVY_APP_ID } from "@/lib/constants";
import { AuthContext, type AuthState } from "@/hooks/useAuth";

const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const DEMO_AUTH: AuthState = {
  authenticated: true,
  ready: true,
  login: () => {},
  logout: async () => {},
};

function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return (
      <AuthContext.Provider value={DEMO_AUTH}>
        {children}
      </AuthContext.Provider>
    );
  }

  return <PrivyLiveProvider>{children}</PrivyLiveProvider>;
}

function PrivyLiveProvider({ children }: { children: ReactNode }) {
  const { PrivyProvider, usePrivy } = require("@privy-io/react-auth");

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00D4FF",
          logo: "/icon-512.png",
        },
        loginMethods: ["wallet", "email", "google"],
        defaultChain: base,
        supportedChains: [base, baseSepolia],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const { usePrivy } = require("@privy-io/react-auth");
  const privy = usePrivy();

  const auth = useMemo<AuthState>(
    () => ({
      authenticated: privy.authenticated,
      ready: privy.ready,
      login: privy.login,
      logout: privy.logout,
    }),
    [privy.authenticated, privy.ready, privy.login, privy.logout],
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
