import React from "react";
import { Shield, Sparkles, BarChart3, PlusCircle, LogOut, Database, LayoutDashboard } from "lucide-react";
import { User, UserRole } from "../types";
import { Button } from "./ui/Button";

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
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF7]/95 backdrop-blur-md">
      {/* Master Content Container */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        {/* Horizontal Divider bounded to master content grid */}
        <div className="flex h-18 items-center justify-between border-b-2 border-ink py-3 gap-4">
          {/* 1. Brand Area: Icon + Title + Version + Subtitle as one coherent unit */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
            onClick={() => setCurrentView("dashboard")}
            title="DocShield AI - Back to Dashboard"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral border-2 border-ink shadow-neo-sm transition-transform group-hover:-rotate-3 group-hover:scale-105">
              <Shield className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="font-display text-base font-black tracking-tight text-ink leading-none">
                  DocShield AI
                </span>
                <span className="rounded-md bg-lavender border border-ink px-1.5 py-0.5 text-[9px] font-extrabold text-ink shadow-[1px_1px_0_#171717] tracking-wider leading-none">
                  V1.4 PROTOTYPE
                </span>
              </div>
              <span className="text-[11px] font-bold text-ink/65 leading-tight mt-0.5">
                Border & Identity Verification
              </span>
            </div>
          </div>

          {/* 2. Navigation Button Group: Uniform height, padding, gap */}
          <nav
            className="hidden md:flex items-center space-x-1.5 bg-white p-1 rounded-xl border-2 border-ink shadow-neo-sm h-10 shrink-0"
            aria-label="Main application navigation"
          >
            <Button
              size="sm"
              variant={currentView === "dashboard" ? "blue" : "ghost"}
              onClick={() => setCurrentView("dashboard")}
              icon={<LayoutDashboard className="h-3.5 w-3.5" />}
              className="h-8 px-3 text-xs font-black"
            >
              Dashboard
            </Button>
            <Button
              size="sm"
              variant={currentView === "analytics" ? "blue" : "ghost"}
              onClick={() => setCurrentView("analytics")}
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              className="h-8 px-3 text-xs font-black"
            >
              Analytics
            </Button>
            <Button
              size="sm"
              variant={currentView === "rules" ? "blue" : "ghost"}
              onClick={() => setCurrentView("rules")}
              icon={<Database className="h-3.5 w-3.5" />}
              className="h-8 px-3 text-xs font-black"
            >
              Rules Catalog
            </Button>
          </nav>

          {/* 3. Actions & User Section: Aligned to 40px common vertical center */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Quick Seed Demo Button */}
            <Button
              size="sm"
              variant="lavender"
              onClick={onSeedDemo}
              loading={isSeeding}
              icon={!isSeeding ? <Sparkles className="h-3.5 w-3.5" /> : undefined}
              title="Seeds sample authentic and tampered identity documents"
              className="hidden sm:inline-flex h-10 px-3.5 text-xs font-black"
            >
              {isSeeding ? "Seeding..." : "Load Demo Fixtures"}
            </Button>

            {/* New Screening CTA Button */}
            <Button
              size="sm"
              variant="coral"
              onClick={onNewScreening}
              icon={<PlusCircle className="h-4 w-4 stroke-[2.5]" />}
              className="h-10 px-3.5 text-xs font-black"
            >
              New Screening
            </Button>

            {/* User Profile & Role Switcher */}
            {user && (
              <div className="flex items-center pl-3 border-l-2 border-ink/20 space-x-2.5 h-10">
                <div className="text-right hidden sm:flex flex-col justify-center">
                  <div className="text-xs font-black text-ink leading-tight">
                    {user.full_name}
                  </div>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    <span className="text-[10px] font-black text-ink/60 uppercase">Role:</span>
                    <select
                      aria-label="Select officer role"
                      value={user.role}
                      onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                      className="bg-white text-[10px] font-black text-ink border border-ink rounded px-1.5 py-0.5 outline-none cursor-pointer shadow-[1px_1px_0_#171717] hover:bg-yellow-50 focus:shadow-neo"
                    >
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of workstation"
                  aria-label="Sign out"
                  className="h-10 w-10 inline-flex items-center justify-center text-ink hover:text-white hover:bg-coral border-2 border-ink rounded-xl shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all bg-white cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4 stroke-[2.2]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
