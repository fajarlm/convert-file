"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppTheme } from "@/context/ThemeContext";
import { THEME_OPTIONS } from "@/lib/types";
import { Palette, Check, ChevronDown } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme-aware button style
  const getButtonClass = () => {
    switch (theme) {
      case "brutalist":
        return "border-2 border-black bg-[#FFE600] text-black font-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5";
      case "minimal":
        return "border border-zinc-200 bg-white text-zinc-800 font-medium hover:bg-zinc-50 shadow-2xs";
      case "retro":
        return "border-t-2 border-l-2 border-b-2 border-r-2 border-t-white border-l-white border-b-zinc-800 border-r-zinc-800 bg-[#c0c0c0] text-black font-bold active:border-t-zinc-800 active:border-l-zinc-800 active:border-b-white active:border-r-white font-mono";
      case "cyber":
      default:
        return "border border-white/10 bg-white/[0.04] text-zinc-200 font-medium hover:bg-white/[0.08] hover:border-cyan-400/40 shadow-xs";
    }
  };

  const getDropdownClass = () => {
    switch (theme) {
      case "brutalist":
        return "border-3 border-black bg-[#FFFBEB] text-black shadow-[6px_6px_0px_#000]";
      case "minimal":
        return "border border-zinc-200 bg-white text-zinc-900 shadow-xl";
      case "retro":
        return "border-t-2 border-l-2 border-b-2 border-r-2 border-t-white border-l-white border-b-zinc-900 border-r-zinc-900 bg-[#c0c0c0] text-black font-mono shadow-2xl";
      case "cyber":
      default:
        return "border border-white/10 bg-[#0E101C]/95 text-zinc-200 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all cursor-pointer ${getButtonClass()}`}
      >
        <Palette className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tema:</span>
        <span className="flex items-center gap-1 font-semibold">
          <span>{currentTheme.icon}</span>
          <span>{currentTheme.name}</span>
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 mt-2 w-72 rounded-2xl p-2 animate-in fade-in zoom-in-95 duration-100 ${getDropdownClass()}`}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider opacity-60 border-b border-current/10 mb-1">
            Pilih Tampilan Desain
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? theme === "cyber"
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                        : theme === "brutalist"
                        ? "bg-[#FFE600] border-2 border-black font-black text-black"
                        : theme === "retro"
                        ? "bg-[#000080] text-white font-bold"
                        : "bg-zinc-100 border border-zinc-300 text-zinc-900"
                      : "hover:bg-white/5 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold leading-tight">
                          {opt.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                            opt.id === "cyber"
                              ? "bg-cyan-500/20 text-cyan-300"
                              : opt.id === "brutalist"
                              ? "bg-black text-white"
                              : opt.id === "retro"
                              ? "bg-yellow-300 text-black"
                              : "bg-zinc-200 text-zinc-700"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-70 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 mt-0.5 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
