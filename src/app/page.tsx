"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { DropZone } from "@/components/DropZone";
import { Workspace } from "@/components/Workspace";
import { LoadedDocument } from "@/lib/types";

export default function Home() {
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
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

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-100 bg-white/50 py-6 mt-16">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-4 text-xs text-zinc-400">
          <div>
            &copy; 2026 DocMorph Studio. In-place editor &amp; multi-format converter.
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Client Native</span>
            <span>•</span>
            <span>Vercel Edge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
