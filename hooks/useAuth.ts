"use client";

import { createContext, useContext } from "react";

export interface AuthState {
  authenticated: boolean;
  ready: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const defaultAuth: AuthState = {
  authenticated: true,
  ready: true,
  login: () => {},
  logout: async () => {},
};

export const AuthContext = createContext<AuthState>(defaultAuth);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
