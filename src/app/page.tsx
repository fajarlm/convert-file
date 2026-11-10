"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { DropZone } from "@/components/DropZone";
import { Workspace } from "@/components/Workspace";
import { LoadedDocument } from "@/lib/types";

export default function Home() {
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
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

      {/* Cyber Glass Footer */}
      <footer className="border-t border-white/[0.07] bg-[#07080D]/60 backdrop-blur-md py-6 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-tight">DocMorph Studio</span>
            <span>•</span>
            <span>Autonomous Document Processing Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">Client-Side Native</span>
            <span>•</span>
            <span className="text-cyan-400">Vercel Edge Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
