"use client";

import React from "react";
import { Cpu, Layers, FileEdit, X } from "lucide-react";
import { useAppTheme } from "@/context/ThemeContext";
import { ThemeSelector } from "./ThemeSelector";
import { ApiKeyModal } from "./ApiKeyModal";

interface HeaderProps {
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentFileName }) => {
  const { theme } = useAppTheme();

  if (theme === "retro") {
    return (
      <header className="sticky top-0 z-40 w-full bg-[#c0c0c0] border-b-2 border-b-zinc-800 shadow-md font-mono select-none">
        {/* Retro Win98 Titlebar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-3 py-1 flex items-center justify-between text-xs font-bold shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-sm">📁</span>
            <span>DocMorph Studio v1.0 [Windows 98 Special Edition]</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold">_</button>
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold">□</button>
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold"><X className="h-3 w-3" /></button>
          </div>
        </div>

        {/* Retro Menu Bar */}
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-3 text-xs border-b border-zinc-400">
          <div className="flex items-center gap-4 text-black font-semibold">
            <span className="underline decoration-1">F</span>ile
            <span className="underline decoration-1">E</span>dit
            <span className="underline decoration-1">C</span>onvert
            <span className="underline decoration-1">T</span>ranslate
            <span className="underline decoration-1">H</span>elp
            {currentFileName && (
              <span className="ml-2 bg-white px-2 py-0.5 border border-zinc-600 text-[11px]">
                {currentFileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ApiKeyModal />
            <ThemeSelector />
          </div>
        </div>
      </header>
    );
  }

  if (theme === "brutalist") {
    return (
      <header className="sticky top-0 z-40 w-full border-b-4 border-black bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-3 border-black bg-[#FFE600] text-black shadow-[3px_3px_0px_#000] rotate-[-2deg]">
              <FileEdit className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-black">
                  DocMorph
                </span>
                <span className="rounded-md border-2 border-black bg-[#FF6B6B] px-2 py-0.5 text-xs font-black text-white shadow-[2px_2px_0px_#000]">
                  STUDIO
                </span>
              </div>
            </div>
          </div>

          {currentFileName && (
            <div className="hidden md:flex items-center gap-2 rounded-xl border-2 border-black bg-[#E0E7FF] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] border border-black animate-pulse" />
              <span className="truncate max-w-xs">{currentFileName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <ApiKeyModal />
            <ThemeSelector />
          </div>
        </div>
      </header>
    );
  }

  if (theme === "minimal") {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-zinc-900">
                DocMorph
              </span>
              <span className="text-[11px] font-normal text-zinc-400">
                / studio
              </span>
            </div>

            {currentFileName && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-xs text-zinc-600 font-medium truncate max-w-xs">
                  {currentFileName}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ApiKeyModal />
            <ThemeSelector />
          </div>
        </div>
      </header>
    );
  }

  // Default: Cyber / Dark Aurora Glass
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07080D]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        {currentFileName ? (
          <div className="hidden md:flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-medium text-white truncate max-w-xs">{currentFileName}</span>
            <span className="text-zinc-500">• Ready</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-medium text-emerald-400">
            <Cpu className="h-3.5 w-3.5" />
            <span>WASM Engine</span>
          </div>

          <ApiKeyModal />
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
};
