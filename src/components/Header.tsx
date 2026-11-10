"use client";

import React from "react";
import { FileEdit, Sparkles, Zap } from "lucide-react";

interface HeaderProps {
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentFileName }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-black bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border-3 border-black bg-[#FFE600] text-black shadow-[3px_3px_0px_#000] rotate-[-2deg]">
            <FileEdit className="h-6 w-6 stroke-[2.5]" />
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
            <p className="text-xs font-semibold text-zinc-600">
              In-Place File Editor & Multi-Format Converter
            </p>
          </div>
        </div>

        {/* Current File Pill */}
        {currentFileName ? (
          <div className="hidden md:flex items-center gap-2 rounded-xl border-2 border-black bg-[#E0E7FF] px-3.5 py-1.5 text-xs font-bold text-black shadow-[3px_3px_0px_#000]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] border border-black animate-pulse" />
            <span className="truncate max-w-xs">{currentFileName}</span>
            <span className="text-zinc-600 font-medium">• Siap Diedit</span>
          </div>
        ) : null}

        {/* Badges / CTAs */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#6EE7B7] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <Zap className="h-3.5 w-3.5 fill-black" />
            <span>VERCEL EDGE</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#C4B5FD] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI TRANSLATE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
