import React from "react";
import { Shield, ShieldAlert, Sparkles, UserCheck, BarChart3, PlusCircle, LogOut, Database, RefreshCw } from "lucide-react";
import { User, UserRole } from "../types";

interface NavbarProps {
  user: User | null;
  currentView: "dashboard" | "review" | "analytics" | "rules";
  setCurrentView: (view: "dashboard" | "review" | "analytics" | "rules") => void;
  onNewScreening: () => void;
  onSeedDemo: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  isSeeding?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  setCurrentView,
  onNewScreening,
  onSeedDemo,
  onSwitchRole,
  onLogout,
  isSeeding = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView("dashboard")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-white">DocShield AI</span>
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                PROTOTYPE v1.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Border & Identity Document Screening</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === "dashboard"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView("analytics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              currentView === "analytics"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setCurrentView("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              currentView === "rules"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Rules Catalog</span>
          </button>
        </nav>

        {/* Action Controls & User */}
        <div className="flex items-center space-x-3">
          {/* Quick Seed Demo Button */}
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            title="Seeds sample authentic and tampered identity documents"
            className="hidden sm:flex items-center space-x-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Seeding..." : "Load Demo Fixtures"}</span>
          </button>

          {/* New Screening Button */}
          <button
            onClick={onNewScreening}
            className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Screening</span>
          </button>

          {/* User Profile & Role Switcher */}
          {user && (
            <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200">{user.full_name}</div>
                <div className="flex items-center justify-end space-x-1">
                  <span className="text-[10px] text-slate-400">Role:</span>
                  <select
                    value={user.role}
                    onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                    className="bg-slate-900 text-[11px] font-semibold text-blue-400 border border-slate-700 rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ANALYST">ANALYST</option>
                  </select>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
