"use client";

import React, { createContext, useContext } from "react";

export interface UserInfo {
  id: number;
  email: string;
  name: string | null;
  role: string;
  roleType?: string;
  language?: string;
  darkMode?: boolean;
  image?: string | null;
  allowedScreens: string[];
  permissions: Record<string, string[]>;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  hasPermission: (screenPath: string, action: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasPermission: () => false,
  refreshUser: async () => {},
});

export function AuthProvider({
  children,
  user,
  loading,
  refreshUser,
}: {
  children: React.ReactNode;
  user: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}) {
  const hasPermission = (screenPath: string, action: string): boolean => {
    if (!user) return false;
    // superadmin gets all permissions automatically
    if (user.roleType === "superadmin") return true;
    const actions = user.permissions[screenPath];
    if (!Array.isArray(actions)) return false;
    if (action === "unarchive") {
      return actions.includes("unarchive") || actions.includes("archive");
    }
    return actions.includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
