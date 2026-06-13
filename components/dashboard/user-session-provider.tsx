"use client";

import { createContext, useContext } from "react";

interface UserSessionContextValue {
  isAdmin: boolean;
}

const UserSessionContext = createContext<UserSessionContextValue>({ isAdmin: false });

export function UserSessionProvider({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  return (
    <UserSessionContext.Provider value={{ isAdmin }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  return useContext(UserSessionContext);
}
