"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface HeaderProps {
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentFileName }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Wordmark Minimalist */}
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
              <div className="flex items-center gap-2 text-xs text-zinc-600 truncate max-w-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                <span className="font-medium truncate">{currentFileName}</span>
              </div>
            </>
          )}
        </div>

        {/* Minimal Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 font-normal">
            <Sparkles className="h-3 w-3 text-zinc-500" />
            <span>AI Translation</span>
          </div>
          <div className="h-3 w-px bg-zinc-200 hidden sm:block" />
          <span className="text-[11px] text-zinc-400 font-mono">v1.0</span>
        </div>
      </div>
    </header>
  );
};
