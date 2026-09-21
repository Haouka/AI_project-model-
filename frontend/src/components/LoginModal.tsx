import React, { useState } from "react";
import { Shield, Lock, User, KeyRound } from "lucide-react";
import { api } from "../api/client";
import { User as UserType } from "../types";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";

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
    <Modal
      isOpen={isOpen}
      preventClose={true}
      showCloseButton={false}
      title="DOCSHIELD WORKSTATION"
      description="Authorized Personnel Authentication & Credential Sign-in"
      maxWidth="md"
      headerIcon={<Shield className="h-6 w-6 text-coral stroke-[2.5]" />}
    >
      <div className="space-y-5">
        {/* Quick Role Selectors for Testing */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink block">
            1-Click Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("reviewer", "Review@123")}
              className="p-2.5 rounded-xl border-2 border-ink bg-blue hover:bg-blue-300 text-ink shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all text-left cursor-pointer"
            >
              <div className="font-black text-[11px]">REVIEWER</div>
              <div className="text-[10px] font-bold text-ink/70">Officer Diaz</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("supervisor", "Super@123")}
              className="p-2.5 rounded-xl border-2 border-ink bg-orange hover:bg-orange-300 text-ink shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all text-left cursor-pointer"
            >
              <div className="font-black text-[11px]">SUPERVISOR</div>
              <div className="text-[10px] font-bold text-ink/70">Supervisor Evans</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin", "Admin@123")}
              className="p-2.5 rounded-xl border-2 border-ink bg-lavender hover:bg-lavender-300 text-ink shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all text-left cursor-pointer"
            >
              <div className="font-black text-[11px]">ADMIN</div>
              <div className="text-[10px] font-bold text-ink/70">Chief Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("analyst", "Analyst@123")}
              className="p-2.5 rounded-xl border-2 border-ink bg-mint hover:bg-mint-300 text-ink shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all text-left cursor-pointer"
            >
              <div className="font-black text-[11px]">ANALYST</div>
              <div className="text-[10px] font-bold text-ink/70">Analyst Kim</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-xl border-2 border-ink bg-coral-50 p-3 text-xs font-bold text-coral-700 shadow-neo-sm" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Username / ID:"
            leftIcon={<User className="h-4 w-4" />}
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Password:"
            leftIcon={<Lock className="h-4 w-4" />}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase tracking-wider text-ink">
                Hardware Key / MFA Code:
              </label>
              <Badge variant="mint">Verified</Badge>
            </div>
            <Input
              leftIcon={<KeyRound className="h-4 w-4" />}
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="font-mono font-black"
            />
          </div>

          <Button
            type="submit"
            variant="coral"
            size="lg"
            className="w-full justify-center"
            loading={loading}
          >
            {loading ? "Authenticating Session..." : "SIGN IN TO WORKSTATION"}
          </Button>
        </form>
      </div>
    </Modal>
  );
};
