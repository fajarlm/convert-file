"use client";

import React from "react";
import { Cpu, X } from "lucide-react";
import { useAppTheme } from "@/context/ThemeContext";
import { ThemeSelector } from "./ThemeSelector";
import { ApiKeyModal } from "./ApiKeyModal";
import { AppLogo } from "./AppLogo";

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
            <AppLogo showText={false} />
            <span className="truncate">DocMorph Studio 98 [File Converter &amp; AI Translator]</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold">_</button>
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold">□</button>
            <button className="h-4 w-4 bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black text-[10px] leading-none flex items-center justify-center font-bold"><X className="h-3 w-3" /></button>
          </div>
        </div>

        {/* Retro Menu Bar */}
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-3 text-xs border-b border-zinc-400">
          <div className="flex items-center gap-3 text-black font-semibold">
            <AppLogo showText={true} />
            <span className="h-4 w-px bg-zinc-400 hidden sm:inline" />
            <div className="hidden md:flex items-center gap-3 text-[11px]">
              <span className="underline decoration-1 cursor-pointer">F</span>ile
              <span className="underline decoration-1 cursor-pointer">E</span>dit
              <span className="underline decoration-1 cursor-pointer">C</span>onvert
              <span className="underline decoration-1 cursor-pointer">T</span>ranslate
              <span className="underline decoration-1 cursor-pointer">H</span>elp
            </div>
            {currentFileName && (
              <span className="ml-1 bg-white px-2 py-0.5 border border-zinc-600 text-[11px] truncate max-w-[160px] sm:max-w-xs">
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
          <AppLogo />

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
            <AppLogo />

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

  // Default Cyber: Dark Aurora Glass
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07080D]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <AppLogo />

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
