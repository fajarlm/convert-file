"use client";

import React, { useState } from "react";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { DropZone } from "@/components/DropZone";
import { Workspace } from "@/components/Workspace";
import { LoadedDocument } from "@/lib/types";

function MainContent() {
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument | null>(null);
  const { theme } = useAppTheme();

  const getContainerStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#008080] text-black font-mono selection:bg-[#000080] selection:text-white";
      case "brutalist":
        return "bg-[#FFFDF7] text-black font-sans selection:bg-[#FFE600] selection:text-black";
      case "minimal":
        return "bg-[#FDFDFD] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white";
      case "cyber":
      default:
        return "bg-[#08090E] text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black";
    }
  };

  const getFooterStyle = () => {
    switch (theme) {
      case "retro":
        return "border-t-2 border-t-white bg-[#c0c0c0] text-black border-b border-b-black py-2 px-3 flex items-center justify-between text-xs font-mono shadow-inner";
      case "brutalist":
        return "border-t-4 border-black bg-white py-6 text-black font-bold text-xs";
      case "minimal":
        return "border-t border-zinc-100 bg-white/50 py-6 text-zinc-400 text-xs";
      case "cyber":
      default:
        return "border-t border-white/[0.07] bg-[#07080D]/60 backdrop-blur-md py-6 text-zinc-500 text-xs font-mono";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getContainerStyle()}`}>
      <Header currentFileName={currentDoc?.name} />

      <main className="flex-1 flex flex-col">
        {!currentDoc ? (
          <DropZone onDocumentLoaded={(doc) => setCurrentDoc(doc)} />
        ) : (
          <Workspace
            document={currentDoc}
            onReset={() => setCurrentDoc(null)}
          />
        )}
      </main>

      {/* Dynamic Themed Footer */}
      <footer className={getFooterStyle()}>
        {theme === "retro" ? (
          <div className="mx-auto flex max-w-7xl w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-[#c0c0c0] px-2 py-0.5 border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black font-bold">
                Start
              </span>
              <span>DocMorph 98 • Ready.</span>
            </div>
            <div className="border-t border-l border-t-zinc-700 border-l-zinc-700 border-b border-r border-b-white border-r-white px-2 py-0.5 text-[11px] bg-[#d4d0c8]">
              💾 100% Client-Side Engine
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 w-full">
            <div>
              &copy; 2026 DocMorph Studio. In-place editor, converter &amp; content translator.
            </div>
            <div className="flex items-center gap-3">
              <span>Client WASM Engine</span>
              <span>•</span>
              <span>Vercel Edge Ready</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}
