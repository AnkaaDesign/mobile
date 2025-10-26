import type { ReactNode } from "react";
import type { PasswordResetRequestFormData } from '@/schemas';
import type { User } from '../user';

// Re-export User type for convenience
export type { User };

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
  refreshUserData: () => Promise<void>;
  isAuthReady: boolean;
  register: (data: { name: string; contact: string; password: string }) => Promise<{ requiresVerification: boolean; phone?: string; email?: string; userId?: string }>;
  recoverPassword: (data: PasswordResetRequestFormData) => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

// Theme Context Types (imported from theme types)
import type { ThemeMode, ThemeColors, ThemeSpacing, ThemeConfig } from "../theme";

// Re-export theme types for external use
export type { ThemeMode, ThemeColors, ThemeSpacing, ThemeConfig };

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

export interface ThemeProviderState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  isDark: boolean;
}

// Query Keys
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
};
