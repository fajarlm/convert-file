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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Top Workspace Bar Minimalist */}
      <div className="border-b border-zinc-200/70 bg-white/70 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          {/* File info & Back action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Ganti berkas</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-600">
                .{doc.originalExtension}
              </span>
              <span className="font-medium text-zinc-900 truncate max-w-xs sm:max-w-md">
                {doc.name}
              </span>
              <span className="text-zinc-400">
                ({(doc.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>

          {/* Mode Switcher & Export CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented Mode Switch */}
            <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/60 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIsEditOnly(false)}
                className={`rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
                  !isEditOnly
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Edit &amp; Konversi
              </button>
              <button
                type="button"
                onClick={() => setIsEditOnly(true)}
                className={`rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
                  isEditOnly
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Hanya Edit
              </button>
            </div>

            {/* Target Extension Selector if converting */}
            {!isEditOnly && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-zinc-400">ke:</span>
                <select
                  value={doc.targetExtension}
                  onChange={(e) =>
                    handleTargetChange(e.target.value as SupportedFormat)
                  }
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-800 text-xs focus:outline-hidden cursor-pointer"
                >
                  {availableTargets.map((target) => (
                    <option key={target.value} value={target.value}>
                      .{target.value.toUpperCase()} ({target.label})
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isExporting ? (
                <span>Memproses...</span>
              ) : isEditOnly ? (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Simpan .{doc.originalExtension}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Unduh .{targetExt}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Editor Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* View Tab Selector for PDF */}
          {doc.originalExtension === "pdf" && (
            <div className="flex items-center gap-1 mb-3 text-xs">
              <span className="text-zinc-400 mr-1">Tampilan:</span>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "document" }))}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  doc.mode === "document"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Teks</span>
              </button>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "spreadsheet" }))}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  doc.mode === "spreadsheet"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>Tabel Excel</span>
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

        {/* Right Inspector & Guide Panel Minimalist */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 text-xs">
          {/* Card: Export Inspector */}
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 text-zinc-700 font-medium">
              <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Detail Ekspor</span>
            </div>

            <div className="mt-3 space-y-3 text-[12px]">
              <div>
                <span className="text-zinc-400 block">Mode</span>
                <span className="text-zinc-800 font-medium">
                  {isEditOnly
                    ? "Hanya Sunting (Format Asli)"
                    : `Konversi (.${doc.originalExtension} → .${targetExt})`}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block">Nama Berkas</span>
                <p className="font-mono text-[11px] text-zinc-600 break-all mt-0.5 bg-zinc-50 p-1.5 rounded border border-zinc-100">
                  {doc.name.replace(/\.[^/.]+$/, "")}_edited.{targetExt}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 block">Pemrosesan</span>
                <span className="text-zinc-600">Client-Side WebAssembly</span>
              </div>
            </div>
          </div>

          {/* Card: Translation Guide */}
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-1.5 text-zinc-700 font-medium mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
              <span>Panduan Bahasa</span>
            </div>
            <ul className="space-y-2 text-zinc-500 leading-relaxed text-[11px]">
              <li>
                <b>Pilih Kata Tertentu:</b> Sorot teks di editor untuk membuka menu terjemahan kata secara instan.
              </li>
              <li>
                <b>Seluruh Dokumen:</b> Gunakan tombol &quot;Terjemahkan Dokumen&quot; di atas untuk seluruh halaman.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
