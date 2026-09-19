import React, { useState } from "react";
import { Shield, Lock, User, KeyRound, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { User as UserType } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState("reviewer");
  const [password, setPassword] = useState("Review@123");
  const [mfaCode, setMfaCode] = useState("482910");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6 relative">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">ID SCREENING PLATFORM</h2>
          <p className="text-xs text-slate-400">
            Authorized Personnel Authentication & Access Control
          </p>
        </div>

        {/* Quick Role Selectors for Testing */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Quick 1-Click Role Logins (Demo Mode):
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("reviewer", "Review@123")}
              className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-blue-500 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-blue-400 text-[11px]">REVIEWER</div>
              <div className="text-[10px] text-slate-500">Officer Diaz</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("supervisor", "Super@123")}
              className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-blue-500 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-amber-400 text-[11px]">SUPERVISOR</div>
              <div className="text-[10px] text-slate-500">Supervisor Evans</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin", "Admin@123")}
              className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-blue-500 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-purple-400 text-[11px]">ADMIN</div>
              <div className="text-[10px] text-slate-500">Chief Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("analyst", "Analyst@123")}
              className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-blue-500 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-emerald-400 text-[11px]">ANALYST</div>
              <div className="text-[10px] text-slate-500">Analyst Kim</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email / Employee ID:
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                MFA Hardware Key / Authenticator Code:
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating Session..." : "SIGN IN TO WORKSTATION"}
          </button>
        </form>
      </div>
    </div>
  );
};
