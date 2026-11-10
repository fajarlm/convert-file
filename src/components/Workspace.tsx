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

  // Full translation handler
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
        // Translate non-numeric cells in spreadsheet
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
      {/* Top Workspace Bar */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* File summary & switch back */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Ganti Berkas</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-mono font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                .{doc.originalExtension}
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {doc.name}
              </span>
              <span className="text-xs text-zinc-400">
                ({(doc.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>

          {/* Mode Switcher & Export CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dual Mode Switch */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setIsEditOnly(false)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  !isEditOnly
                    ? "bg-white text-indigo-700 shadow-2xs dark:bg-zinc-800 dark:text-indigo-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Edit & Konversi
              </button>
              <button
                type="button"
                onClick={() => setIsEditOnly(true)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  isEditOnly
                    ? "bg-white text-emerald-700 shadow-2xs dark:bg-zinc-800 dark:text-emerald-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Hanya Edit (Simpan Asli)
              </button>
            </div>

            {/* Target Extension Selector if converting */}
            {!isEditOnly && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Konversi ke:</span>
                <select
                  value={doc.targetExtension}
                  onChange={(e) =>
                    handleTargetChange(e.target.value as SupportedFormat)
                  }
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-hidden"
                >
                  {availableTargets.map((target) => (
                    <option key={target.value} value={target.value}>
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
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all ${
                isEditOnly
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
              }`}
            >
              {isExporting ? (
                <span>Sedang Memproses...</span>
              ) : isEditOnly ? (
                <>
                  <Download className="h-4 w-4" />
                  <span>Simpan .{doc.originalExtension.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Konversi & Unduh .{targetExt.toUpperCase()}</span>
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
          {/* View Tab Selector for PDF (Allows switching between text view and extracted table grid view) */}
          {doc.originalExtension === "pdf" && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-zinc-500">Tampilan Editor:</span>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "document" }))}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                  doc.mode === "document"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Editor Teks & Terjemahan</span>
              </button>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "spreadsheet" }))}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                  doc.mode === "spreadsheet"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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

        {/* Right Inspector & Help Panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          {/* Card: Export Inspector */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <Settings2 className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Pengaturan Output
              </h3>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-zinc-500">Mode Ekspor:</span>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {isEditOnly
                    ? "Hanya Menyunting (Ekstensi Tetap)"
                    : `Konversi Berkas (.${doc.originalExtension} -> .${targetExt})`}
                </p>
              </div>

              <div>
                <span className="text-zinc-500">Nama Berkas Tujuan:</span>
                <p className="font-mono text-zinc-700 dark:text-zinc-300 break-all mt-0.5 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {doc.name.replace(/\.[^/.]+$/, "")}_edited.{targetExt}
                </p>
              </div>

              <div>
                <span className="text-zinc-500">Format & Engine:</span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                  Client-side WebAssembly + High Fidelity Engine
                </p>
              </div>
            </div>
          </div>

          {/* Card: Translation Guide */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Fitur Terjemahan Cerdas</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600">•</span>
                <span>
                  <b>Ubah Beberapa Kata:</b> Cukup sorot (highlight) kata atau kalimat di dokumen, bubble translate akan muncul otomatis.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600">•</span>
                <span>
                  <b>Ubah Seluruhnya:</b> Klik tombol &quot;Terjemahkan Seluruh Dokumen&quot; di bagian atas editor.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600">•</span>
                <span>
                  <b>Multi-Bahasa:</b> Mendukung Indonesia, Inggris, Jepang, Mandarin, Arab, Spanyol, dan lainnya.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
