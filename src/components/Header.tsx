"use client";

import React from "react";
import { FileEdit, Sparkles, ShieldCheck } from "lucide-react";

interface HeaderProps {
  currentFileName?: string;
  isReadyForDeploy?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentFileName }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                DocMorph
              </span>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Studio
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              In-Place File Editor & Multi-Format Converter
            </p>
          </div>
        </div>

        {currentFileName ? (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium truncate max-w-xs">{currentFileName}</span>
            <span className="text-zinc-400">• Mode Siap Diedit</span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vercel Edge Ready</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>AI Translation Powered</span>
          </div>
        </div>
      </div>
    </header>
  );
};
