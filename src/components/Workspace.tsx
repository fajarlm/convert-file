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
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
      {/* Top Workspace Bar Neo-Brutalist */}
      <div className="border-b-4 border-black bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* File summary & switch back */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#F4F4F5] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:bg-zinc-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 stroke-[2.5]" />
              <span>GANTI BERKAS</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border-2 border-black bg-[#FEF08A] px-2.5 py-1 text-xs font-mono font-black uppercase text-black shadow-[2px_2px_0px_#000]">
                .{doc.originalExtension}
              </span>
              <span className="text-sm font-black text-black truncate max-w-xs sm:max-w-md">
                {doc.name}
              </span>
              <span className="text-xs font-bold text-zinc-500">
                ({(doc.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>

          {/* Mode Switcher & Export CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dual Mode Switch */}
            <div className="inline-flex rounded-xl border-2 border-black bg-[#E2E8F0] p-1 shadow-[3px_3px_0px_#000]">
              <button
                type="button"
                onClick={() => setIsEditOnly(false)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  !isEditOnly
                    ? "bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000]"
                    : "text-zinc-700 hover:text-black border-2 border-transparent"
                }`}
              >
                EDIT &amp; KONVERSI
              </button>
              <button
                type="button"
                onClick={() => setIsEditOnly(true)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  isEditOnly
                    ? "bg-[#4ADE80] text-black border-2 border-black shadow-[2px_2px_0px_#000]"
                    : "text-zinc-700 hover:text-black border-2 border-transparent"
                }`}
              >
                HANYA EDIT (SIMPAN ASLI)
              </button>
            </div>

            {/* Target Extension Selector if converting */}
            {!isEditOnly && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-black">Target:</span>
                <select
                  value={doc.targetExtension}
                  onChange={(e) =>
                    handleTargetChange(e.target.value as SupportedFormat)
                  }
                  className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] focus:outline-hidden cursor-pointer"
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
              className={`inline-flex items-center gap-2 rounded-xl border-3 border-black px-4 py-2 text-xs font-black uppercase text-black shadow-[4px_4px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
                isEditOnly
                  ? "bg-[#4ADE80]"
                  : "bg-[#38BDF8]"
              }`}
            >
              {isExporting ? (
                <span>MEMPROSES...</span>
              ) : isEditOnly ? (
                <>
                  <Download className="h-4 w-4 stroke-[3]" />
                  <span>SIMPAN .{doc.originalExtension.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 stroke-[3]" />
                  <span>KONVERSI &amp; UNDUH .{targetExt.toUpperCase()}</span>
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
              <span className="text-xs font-black uppercase text-black">Tampilan:</span>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "document" }))}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1 text-xs font-black transition-all cursor-pointer ${
                  doc.mode === "document"
                    ? "bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Editor Teks &amp; Translate</span>
              </button>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "spreadsheet" }))}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1 text-xs font-black transition-all cursor-pointer ${
                  doc.mode === "spreadsheet"
                    ? "bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 stroke-[2.5]" />
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

        {/* Right Inspector & Help Panel Neo-Brutalist */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
          {/* Card: Export Inspector */}
          <div className="rounded-2xl border-3 border-black bg-white p-5 shadow-[6px_6px_0px_#000]">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Settings2 className="h-4 w-4 stroke-[2.5] text-black" />
              <h3 className="text-xs font-black uppercase tracking-wider text-black">
                STATUS OUTPUT
              </h3>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="font-bold text-zinc-600 uppercase text-[11px]">Mode Ekspor:</span>
                <p className="font-black text-black text-sm mt-0.5">
                  {isEditOnly
                    ? "Hanya Menyunting (Ekstensi Asli)"
                    : `Konversi ( .${doc.originalExtension} ➔ .${targetExt} )`}
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-600 uppercase text-[11px]">Nama Berkas Tujuan:</span>
                <p className="font-mono font-bold text-black break-all mt-1 bg-[#F4F4F5] p-2 rounded-lg border-2 border-black shadow-inner">
                  {doc.name.replace(/\.[^/.]+$/, "")}_edited.{targetExt}
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-600 uppercase text-[11px]">Format &amp; Engine:</span>
                <p className="font-bold text-black mt-0.5">
                  Client-side WebAssembly Native
                </p>
              </div>
            </div>
          </div>

          {/* Card: Translation Guide */}
          <div className="rounded-2xl border-3 border-black bg-[#EDE9FE] p-5 shadow-[6px_6px_0px_#000]">
            <div className="flex items-center gap-2 text-black font-black text-xs uppercase mb-3 border-b-2 border-black pb-2">
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
              <span>PANDUAN TERJEMAHAN</span>
            </div>
            <ul className="space-y-3 text-xs text-black font-semibold">
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span>
                  <b>Ubah Beberapa Kata:</b> Sorot teks di dokumen dengan mouse, lalu bubble ganti bahasa akan muncul otomatis.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span>
                  <b>Ubah Seluruh Dokumen:</b> Klik tombol &quot;Terjemahkan Seluruh Dokumen&quot; di atas editor.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
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
