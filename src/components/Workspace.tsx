"use client";

import React, { useState } from "react";
import {
  LoadedDocument,
  SupportedFormat,
} from "@/lib/types";
import {
  getAvailableTargets,
  exportDocument,
} from "@/lib/converters";
import { DocumentEditor } from "./DocumentEditor";
import { SpreadsheetEditor } from "./SpreadsheetEditor";
import {
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Settings2,
  FileDown,
} from "lucide-react";

interface WorkspaceProps {
  document: LoadedDocument;
  onReset: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  document: initialDoc,
  onReset,
}) => {
  const [doc, setDoc] = useState<LoadedDocument>(initialDoc);
  const [isEditOnly, setIsEditOnly] = useState<boolean>(false);
  const [isTranslatingFull, setIsTranslatingFull] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const availableTargets = getAvailableTargets(doc.originalExtension);

  const handleTargetChange = (newTarget: SupportedFormat) => {
    setDoc((prev) => ({ ...prev, targetExtension: newTarget }));
  };

  const handleDocumentTextChange = (newText: string) => {
    setDoc((prev) => ({
      ...prev,
      contentText: newText,
      contentHtml: newText
        .split("\n")
        .map((l) => `<p>${l || "&nbsp;"}</p>`)
        .join(""),
    }));
  };

  const handleSpreadsheetChange = (newData: (string | number)[][]) => {
    setDoc((prev) => ({ ...prev, sheetData: newData }));
  };

  const handleFullTranslate = async (targetLang: string) => {
    setIsTranslatingFull(true);
    try {
      if (doc.mode === "document") {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: doc.contentText,
            targetLang,
          }),
        });
        const data = await res.json();
        if (data.translatedText) {
          handleDocumentTextChange(data.translatedText);
        } else {
          alert("Gagal menerjemahkan dokumen.");
        }
      } else {
        const newData = await Promise.all(
          doc.sheetData.map(async (row) => {
            return Promise.all(
              row.map(async (cell) => {
                const str = String(cell ?? "").trim();
                if (!str || !isNaN(Number(str))) return cell;
                try {
                  const res = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: str, targetLang }),
                  });
                  const d = await res.json();
                  return d.translatedText || cell;
                } catch {
                  return cell;
                }
              })
            );
          })
        );
        handleSpreadsheetChange(newData);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat menerjemahkan.");
    } finally {
      setIsTranslatingFull(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDocument(doc, isEditOnly);
    } catch (err) {
      console.error("Gagal mengekspor:", err);
      alert("Terjadi kesalahan saat mengekspor file.");
    } finally {
      setIsExporting(false);
    }
  };

  const targetExt = isEditOnly ? doc.originalExtension : doc.targetExtension;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Workspace Bar (Obsidian Glass) */}
      <div className="border-b border-white/[0.07] bg-[#07080D]/80 backdrop-blur-xl px-4 py-3.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* File summary & switch back */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Ganti Berkas</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-mono font-semibold uppercase text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                .{doc.originalExtension}
              </span>
              <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                {doc.name}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                ({(doc.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>

          {/* Mode Switcher & Export CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dual Mode Switch */}
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
              <button
                type="button"
                onClick={() => setIsEditOnly(false)}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer ${
                  !isEditOnly
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Edit &amp; Konversi
              </button>
              <button
                type="button"
                onClick={() => setIsEditOnly(true)}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer ${
                  isEditOnly
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Hanya Edit (Simpan Asli)
              </button>
            </div>

            {/* Target Extension Selector if converting */}
            {!isEditOnly && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">Target:</span>
                <select
                  value={doc.targetExtension}
                  onChange={(e) =>
                    handleTargetChange(e.target.value as SupportedFormat)
                  }
                  className="rounded-xl border border-white/10 bg-[#121524] px-3 py-1.5 text-xs font-semibold text-cyan-300 focus:outline-hidden cursor-pointer shadow-inner"
                >
                  {availableTargets.map((target) => (
                    <option key={target.value} value={target.value} className="bg-[#0C0E17] text-white">
                      .{target.value.toUpperCase()} - {target.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isEditOnly
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                  : "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_25px_-3px_rgba(99,102,241,0.6)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)]"
              }`}
            >
              {isExporting ? (
                <span>Sedang Memproses...</span>
              ) : isEditOnly ? (
                <>
                  <Download className="h-4 w-4 stroke-[2.5]" />
                  <span>Simpan .{doc.originalExtension.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 stroke-[2.5]" />
                  <span>Konversi &amp; Unduh .{targetExt.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8">
        {/* Editor Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* View Tab Selector for PDF */}
          {doc.originalExtension === "pdf" && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-zinc-400">Tampilan Editor:</span>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "document" }))}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  doc.mode === "document"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Editor Teks &amp; Terjemahan</span>
              </button>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "spreadsheet" }))}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  doc.mode === "spreadsheet"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ekstraksi Tabel Excel</span>
              </button>
            </div>
          )}

          {doc.mode === "spreadsheet" ? (
            <SpreadsheetEditor
              data={doc.sheetData}
              onChange={handleSpreadsheetChange}
              onFullTranslate={handleFullTranslate}
              isTranslatingFull={isTranslatingFull}
            />
          ) : (
            <DocumentEditor
              content={doc.contentText}
              onChange={handleDocumentTextChange}
              onFullTranslate={handleFullTranslate}
              isTranslatingFull={isTranslatingFull}
            />
          )}
        </div>

        {/* Right Inspector & Guide Panel (Dark Bento) */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
          {/* Card: Export Inspector */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E17]/90 p-5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Settings2 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Status Output
              </h3>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px] uppercase font-mono">Mode Ekspor</span>
                <p className="font-semibold text-white mt-0.5">
                  {isEditOnly
                    ? "Sunting Langsung (Format Asli)"
                    : `Konversi ( .${doc.originalExtension} ➔ .${targetExt} )`}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px] uppercase font-mono">Nama Berkas Tujuan</span>
                <p className="font-mono text-zinc-300 break-all mt-1 bg-white/[0.03] p-2 rounded-lg border border-white/5 text-[11px]">
                  {doc.name.replace(/\.[^/.]+$/, "")}_edited.{targetExt}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px] uppercase font-mono">Engine Komputasi</span>
                <p className="text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Client WASM + High Fidelity
                </p>
              </div>
            </div>
          </div>

          {/* Card: Translation Guide */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-indigo-950/20 p-5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase mb-3 border-b border-violet-500/20 pb-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Panduan Terjemahan AI</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-violet-500/30 text-violet-300 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span>
                  <b>Ubah Beberapa Kata:</b> Cukup sorot teks dokumen dengan kursor mouse, bubble translasi neural akan muncul seketika.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-violet-500/30 text-violet-300 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span>
                  <b>Ubah Seluruh Dokumen:</b> Klik tombol &quot;Terjemahkan Dokumen&quot; di atas untuk menerjemahkan seluruh halaman.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-violet-500/30 text-violet-300 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span>
                  <b>Multi-Bahasa:</b> Mendukung Indonesia, Inggris, Jepang, Mandarin, Arab, Jerman, dan lainnya.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
