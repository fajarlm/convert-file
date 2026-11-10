"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { DropZone } from "@/components/DropZone";
import { Workspace } from "@/components/Workspace";
import { LoadedDocument } from "@/lib/types";

export default function Home() {
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-500 selection:text-white">
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

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            &copy; 2026 DocMorph Studio. Privacy-first File Editor & Converter.
          </div>
          <div className="flex items-center gap-4">
            <span>Client-Side Native Processing</span>
            <span>•</span>
            <span>Deployable on Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
