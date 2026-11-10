"use client";

import React from "react";
import { Sparkles, Cpu, Layers } from "lucide-react";

interface HeaderProps {
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentFileName }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07080D]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Ambient Glow */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 opacity-75 blur-xs group-hover:opacity-100 transition duration-300" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0C0E17] border border-white/10 text-white shadow-inner">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-sans">
                DocMorph
              </span>
              <span className="rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-normal">
              Autonomous File Editor &amp; Neural Converter
            </p>
          </div>
        </div>

        {/* Current Document Pill */}
        {currentFileName ? (
          <div className="hidden md:flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-medium text-white truncate max-w-xs">{currentFileName}</span>
            <span className="text-zinc-500">• Ready to Edit</span>
          </div>
        ) : null}

        {/* Engine Badges */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]">
            <Cpu className="h-3.5 w-3.5" />
            <span>Client WASM Engine</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.08] px-3 py-1 text-xs font-medium text-violet-300 shadow-[0_0_12px_-2px_rgba(168,85,247,0.3)]">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>AI Neural Translate</span>
          </div>
        </div>
      </div>
    </header>
  );
};
