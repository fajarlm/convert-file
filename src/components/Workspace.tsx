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
import { useAppTheme } from "@/context/ThemeContext";
import { translateRichHtml, translateBatch } from "@/lib/translator";

interface WorkspaceProps {
  document: LoadedDocument;
  onReset: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  document: initialDoc,
  onReset,
}) => {
  const { theme } = useAppTheme();
  const [doc, setDoc] = useState<LoadedDocument>(initialDoc);
  const [isEditOnly, setIsEditOnly] = useState<boolean>(false);
  const [isTranslatingFull, setIsTranslatingFull] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const availableTargets = getAvailableTargets(doc.originalExtension);

  const handleTargetChange = (newTarget: SupportedFormat) => {
    setDoc((prev) => ({ ...prev, targetExtension: newTarget }));
  };

  const handleDocumentHtmlChange = (newHtml: string) => {
    let plain = "";
    if (typeof window !== "undefined") {
      const el = document.createElement("div");
      el.innerHTML = newHtml;
      plain = el.innerText || el.textContent || "";
    }
    setDoc((prev) => ({
      ...prev,
      contentHtml: newHtml,
      contentText: plain,
    }));
  };

  const handleSpreadsheetChange = (newData: (string | number)[][]) => {
    setDoc((prev) => ({ ...prev, sheetData: newData }));
  };

  const handleFullTranslate = async (targetLang: string) => {
    setIsTranslatingFull(true);
    try {
      if (doc.mode === "document") {
        // Use translateRichHtml to keep 100% of tables, bold, italic, and tags!
        const htmlToTranslate = doc.contentHtml || doc.contentText;
        const translatedHtml = await translateRichHtml(htmlToTranslate, targetLang);
        if (translatedHtml) {
          handleDocumentHtmlChange(translatedHtml);
        } else {
          alert("Gagal menerjemahkan dokumen.");
        }
      } else {
        // Flatten non-empty text cells, batch translate in chunks
        const flatIndices: { r: number; c: number; text: string }[] = [];
        const flatTexts: string[] = [];

        doc.sheetData.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            const str = String(cell ?? "").trim();
            if (str && isNaN(Number(str))) {
              flatIndices.push({ r: rIdx, c: cIdx, text: str });
              flatTexts.push(str);
            }
          });
        });

        if (flatTexts.length > 0) {
          const translatedList = await translateBatch(flatTexts, targetLang);
          const newData = doc.sheetData.map((row) => [...row]);
          flatIndices.forEach((pos, idx) => {
            if (translatedList[idx]) {
              newData[pos.r][pos.c] = translatedList[idx];
            }
          });
          handleSpreadsheetChange(newData);
        }
      }
    } catch (err) {
      console.error("Translation error in workspace:", err);
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

  // Header styles per theme
  const getTopBarStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#c0c0c0] border-b-2 border-b-black text-black font-mono";
      case "brutalist":
        return "bg-white border-b-4 border-black text-black";
      case "minimal":
        return "bg-white border-b border-zinc-200 text-zinc-900";
      case "cyber":
      default:
        return "bg-[#07080D]/80 border-b border-white/[0.07] backdrop-blur-xl text-white";
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Workspace Action Bar */}
      <div className={`px-4 py-3 ${getTopBarStyle()}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* File summary & switch back */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                theme === "retro"
                  ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-mono"
                  : theme === "brutalist"
                  ? "rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] hover:bg-zinc-100"
                  : theme === "minimal"
                  ? "rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  : "rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Ganti File</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-xs truncate max-w-[200px] sm:max-w-xs">
                {doc.name}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  theme === "retro"
                    ? "bg-black text-white"
                    : theme === "brutalist"
                    ? "border border-black bg-[#FFE600] text-black font-black"
                    : theme === "minimal"
                    ? "bg-zinc-100 text-zinc-700"
                    : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                }`}
              >
                .{doc.originalExtension}
              </span>
            </div>
          </div>

          {/* Mode Switch & Export Target Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode switch: Edit Only vs Convert */}
            <div
              className={`flex items-center p-0.5 text-xs rounded-xl ${
                theme === "retro"
                  ? "bg-white border-2 border-black"
                  : theme === "brutalist"
                  ? "border-2 border-black bg-white shadow-[2px_2px_0px_#000]"
                  : theme === "minimal"
                  ? "bg-zinc-100 p-1 rounded-lg"
                  : "bg-white/[0.04] border border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsEditOnly(false)}
                className={`px-3 py-1 font-semibold transition-all cursor-pointer ${
                  !isEditOnly
                    ? theme === "retro"
                      ? "bg-[#000080] text-white"
                      : theme === "brutalist"
                      ? "rounded-lg bg-[#FFE600] text-black border-2 border-black"
                      : theme === "minimal"
                      ? "rounded-md bg-white text-zinc-900 shadow-2xs"
                      : "rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                Edit &amp; Konversi
              </button>
              <button
                type="button"
                onClick={() => setIsEditOnly(true)}
                className={`px-3 py-1 font-semibold transition-all cursor-pointer ${
                  isEditOnly
                    ? theme === "retro"
                      ? "bg-[#000080] text-white"
                      : theme === "brutalist"
                      ? "rounded-lg bg-[#4ADE80] text-black border-2 border-black"
                      : theme === "minimal"
                      ? "rounded-md bg-white text-zinc-900 shadow-2xs"
                      : "rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                Hanya Edit
              </button>
            </div>

            {/* Target Extension Selector if converting */}
            {!isEditOnly && (
              <div className="flex items-center gap-1.5 text-xs">
                <span>Target:</span>
                <select
                  value={doc.targetExtension}
                  onChange={(e) =>
                    handleTargetChange(e.target.value as SupportedFormat)
                  }
                  className={`px-2.5 py-1 text-xs font-semibold focus:outline-hidden cursor-pointer ${
                    theme === "retro"
                      ? "bg-white border-2 border-black text-black"
                      : theme === "brutalist"
                      ? "rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000]"
                      : theme === "minimal"
                      ? "rounded-lg border border-zinc-200 bg-white text-zinc-800"
                      : "rounded-xl border border-white/10 bg-[#121524] text-cyan-300"
                  }`}
                >
                  {availableTargets.map((target) => (
                    <option key={target.value} value={target.value} className="bg-zinc-900 text-white">
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
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                theme === "retro"
                  ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-mono"
                  : theme === "brutalist"
                  ? "rounded-xl border-3 border-black bg-[#FFE600] text-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
                  : theme === "minimal"
                  ? "rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                  : "rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)]"
              }`}
            >
              {isExporting ? (
                <span>Memproses...</span>
              ) : isEditOnly ? (
                <>
                  <Download className="h-4 w-4" />
                  <span>Simpan .{doc.originalExtension.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Unduh .{targetExt.toUpperCase()}</span>
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
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="opacity-60">Tampilan:</span>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "document" }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded cursor-pointer ${
                  doc.mode === "document"
                    ? theme === "retro"
                      ? "bg-[#000080] text-white"
                      : "bg-white/10 border border-current"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Dokumen &amp; Tabel Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setDoc((p) => ({ ...p, mode: "spreadsheet" }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded cursor-pointer ${
                  doc.mode === "spreadsheet"
                    ? theme === "retro"
                      ? "bg-[#000080] text-white"
                      : "bg-white/10 border border-current"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Grid Lembar Kerja</span>
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
              htmlContent={doc.contentHtml || doc.contentText}
              onChange={handleDocumentHtmlChange}
              onFullTranslate={handleFullTranslate}
              isTranslatingFull={isTranslatingFull}
            />
          )}
        </div>

        {/* Right Inspector & Guide Panel */}
        <div className="w-full lg:w-76 shrink-0 flex flex-col gap-4 text-xs">
          <div
            className={`p-4 ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black font-mono"
                : theme === "brutalist"
                ? "rounded-2xl border-3 border-black bg-white text-black shadow-[4px_4px_0px_#000]"
                : theme === "minimal"
                ? "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs"
                : "rounded-2xl border border-white/10 bg-[#0C0E17]/90 text-white backdrop-blur-xl"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-current/15 pb-2 font-bold uppercase text-[11px]">
              <Settings2 className="h-3.5 w-3.5" />
              <span>Detail Ekspor</span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <span className="opacity-60 block text-[10px] uppercase">Mode</span>
                <p className="font-semibold mt-0.5">
                  {isEditOnly
                    ? "Hanya Sunting (Format Asli)"
                    : `Konversi (.${doc.originalExtension} ➔ .${targetExt})`}
                </p>
              </div>

              <div>
                <span className="opacity-60 block text-[10px] uppercase">Nama Berkas Hasil</span>
                <p className="font-mono text-[11px] break-all mt-1 p-1.5 border border-current/15 rounded bg-black/5">
                  {doc.name.replace(/\.[^/.]+$/, "")}_edited.{targetExt}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black font-mono"
                : theme === "brutalist"
                ? "rounded-2xl border-3 border-black bg-[#EDE9FE] text-black shadow-[4px_4px_0px_#000]"
                : theme === "minimal"
                ? "rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800"
                : "rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-indigo-950/20 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Format &amp; Terjemahan</span>
            </div>
            <ul className="space-y-2 text-[11px] opacity-80 leading-relaxed">
              <li>• <b>Tabel, Bold, &amp; Italic:</b> Format visual (tabel, tebal, miring, judul, garis bawah) tetap dipertahankan 100% saat diedit maupun dikonversi.</li>
              <li>• <b>Pilih Kata / Kalimat:</b> Sorot teks pada dokumen, popup terjemah akan muncul otomatis untuk mengubah kata atau kalimat yang disorot saja.</li>
              <li>• <b>Semua Dokumen:</b> Klik tombol &ldquo;Terjemahkan Dokumen&rdquo; di atas untuk menerjemahkan seluruh isi berkas tanpa merusak tabel dan tag HTML.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
