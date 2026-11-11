"use client";

import React from "react";
import { useAppTheme } from "@/context/ThemeContext";

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "", showText = true }) => {
  const { theme } = useAppTheme();

  if (theme === "retro") {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {/* Pixel-art 3D Windows 98 Floppy & Document Icon */}
        <div className="relative flex h-8 w-8 items-center justify-center bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black p-0.5 shadow-sm">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
          >
            {/* Floppy Body (Navy/Blue) */}
            <path
              d="M4 4h20l4 4v20H4V4z"
              fill="#000080"
              stroke="#000000"
              strokeWidth="1.5"
            />
            {/* Metal Shutter (Silver/White) */}
            <rect x="8" y="4" width="12" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
            <rect x="15" y="6" width="3" height="6" fill="#000000" />
            {/* Paper Label (White) */}
            <rect x="7" y="16" width="18" height="11" fill="#ffffff" stroke="#000" strokeWidth="1" />
            {/* Label Lines (Red & Blue lines) */}
            <line x1="9" y1="19" x2="23" y2="19" stroke="#ff0000" strokeWidth="1.5" />
            <line x1="9" y1="22" x2="20" y2="22" stroke="#000080" strokeWidth="1" />
            <line x1="9" y1="24" x2="17" y2="24" stroke="#000080" strokeWidth="1" />
          </svg>
        </div>

        {showText && (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-black tracking-tight font-mono">
                DocMorph
              </span>
              <span className="bg-[#000080] text-white text-[9px] font-bold px-1.5 py-0.2 border border-black shadow-xs font-mono">
                98 SE
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono">Document Converter &amp; Editor</p>
          </div>
        )}
      </div>
    );
  }

  if (theme === "brutalist") {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {/* Bold Neo-Brutalist Pop Emblem */}
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_#000] rotate-[-2deg] transition-transform hover:rotate-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-black"
          >
            {/* Dual Morphing File Sheets */}
            <path
              d="M4 4v16h11V8l-4-4H4z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M10 20h10V10l-4-4h-2"
              fill="#FF6B6B"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Lightning bolt inside */}
            <path
              d="M9 13l3-4v3h2l-3 4v-3H9z"
              fill="#FFE600"
              stroke="#000"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {showText && (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-black">
                DocMorph
              </span>
              <span className="rounded-md border-2 border-black bg-[#FF6B6B] px-1.5 py-0.2 text-[10px] font-black text-white shadow-[2px_2px_0px_#000]">
                STUDIO
              </span>
            </div>
            <p className="text-[10px] text-black font-bold">In-Place Convert &amp; Translate</p>
          </div>
        )}
      </div>
    );
  }

  if (theme === "minimal") {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {/* Sleek Minimalist Geometric Monogram */}
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 bg-white shadow-2xs">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-zinc-900"
          >
            <path
              d="M6 3h8l5 5v13H6V3z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
            <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {showText && (
          <div className="leading-none">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              DocMorph
            </span>
            <span className="text-xs text-zinc-400 font-light ml-1">/ studio</span>
          </div>
        )}
      </div>
    );
  }

  // Default Cyber: Dark Obsidian Aurora Glass Logo
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Aurora Holographic Morphing Badge */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 via-cyan-400 to-indigo-500 opacity-75 blur-xs group-hover:opacity-100 transition duration-300 animate-pulse" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0C0E17] border border-white/15 text-white shadow-inner">
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
          >
            {/* Background Sheet */}
            <path
              d="M5 4h12l5 5v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
              fill="url(#cyber-grad-bg)"
              stroke="#6366F1"
              strokeWidth="1.5"
            />
            {/* Folded Corner */}
            <path d="M17 4v5h5" fill="#4F46E5" stroke="#818CF8" strokeWidth="1.5" />
            {/* Morphing Exchange Arrows */}
            <path
              d="M9 13h7m0 0l-2.5-2.5M16 13l-2.5 2.5M15 18H8m0 0l2.5-2.5M8 18l2.5 2.5"
              stroke="#22D3EE"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="cyber-grad-bg" x1="4" y1="4" x2="22" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E1B4B" />
                <stop offset="1" stopColor="#0F172A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white font-sans">
              DocMorph
            </span>
            <span className="rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
              PRO STUDIO
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-normal">
            Neural File Converter &amp; Editor
          </p>
        </div>
      )}
    </div>
  );
};
