"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { DropZone } from "@/components/DropZone";
import { Workspace } from "@/components/Workspace";
import { LoadedDocument } from "@/lib/types";

export default function Home() {
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#FFE600] selection:text-black">
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

      {/* Neo-Brutalist Chunky Footer */}
      <footer className="border-t-4 border-black bg-white py-6 mt-12">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs font-bold text-black">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFE600] px-2 py-0.5 border-2 border-black rounded shadow-[2px_2px_0px_#000]">
              DocMorph Studio
            </span>
            <span>&copy; 2026. File Editor, Converter &amp; Content Translator.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#A7F3D0] px-2 py-0.5 border border-black rounded">Client-Side Native</span>
            <span>•</span>
            <span className="bg-[#BAE6FD] px-2 py-0.5 border border-black rounded">Vercel Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
