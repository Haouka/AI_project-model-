import { useState, useEffect, useCallback } from "react";
import { User, UserRole } from "../types";
import { api } from "../api/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          api.setToken(null);
          setIsLoginOpen(true);
        });
    } else {
      // Auto login as default Reviewer Diaz for demo convenience
      api.login("reviewer", "Review@123")
        .then((res) => setUser(res.user))
        .catch(() => setIsLoginOpen(true));
    }
  }, []);

  const handleSwitchRole = useCallback((role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const handleLogout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setIsLoginOpen(true);
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
  }, []);

  return {
    user,
    setUser,
    isLoginOpen,
    setIsLoginOpen,
    handleSwitchRole,
    handleLogout,
    handleLoginSuccess,
  };
}
