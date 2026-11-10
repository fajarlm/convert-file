"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Loader2,
  Table as TableIcon,
} from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/types";

interface SpreadsheetEditorProps {
  data: (string | number)[][];
  onChange: (newData: (string | number)[][]) => void;
  onFullTranslate: (targetLang: string) => Promise<void>;
  isTranslatingFull: boolean;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  data,
  onChange,
  onFullTranslate,
  isTranslatingFull,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [targetLang, setTargetLang] = useState("en");

  const rows = data.length > 0 ? data : [[""]];
  const maxCols = Math.max(...rows.map((r) => r.length), 1);

  const getColLabel = (index: number) => {
    let label = "";
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = rows.map((row) => [...row]);
    while (newData[r].length <= c) {
      newData[r].push("");
    }
    newData[r][c] = value;
    onChange(newData);
  };

  const addRow = () => {
    const newRow = new Array(maxCols).fill("");
    onChange([...rows, newRow]);
  };

  const addColumn = () => {
    const newData = rows.map((row) => [...row, ""]);
    onChange(newData);
  };

  const deleteCurrentRow = () => {
    if (selectedCell && rows.length > 1) {
      const newData = rows.filter((_, idx) => idx !== selectedCell.r);
      onChange(newData);
      setSelectedCell(null);
    }
  };

  const translateSelectedCell = async () => {
    if (!selectedCell) return;
    const currentVal = String(rows[selectedCell.r]?.[selectedCell.c] ?? "");
    if (!currentVal.trim()) return;

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentVal, targetLang }),
      });
      const resData = await res.json();
      if (resData.translatedText) {
        handleCellChange(selectedCell.r, selectedCell.c, resData.translatedText);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menerjemahkan sel.");
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0B0D16]/90 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Spreadsheet Dark Frosted Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tambah Baris</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tambah Kolom</span>
          </button>
          {selectedCell && (
            <button
              type="button"
              onClick={deleteCurrentRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Baris #{selectedCell.r + 1}</span>
            </button>
          )}

          {selectedCell && (
            <button
              type="button"
              onClick={translateSelectedCell}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Ganti Bahasa Sel Ini</span>
            </button>
          )}
        </div>

        {/* Translation Controls for Whole Sheet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden text-zinc-200 text-xs cursor-pointer font-sans"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#0C0E17] text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isTranslatingFull}
            onClick={() => onFullTranslate(targetLang)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_-2px_rgba(99,102,241,0.7)] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan Lembar...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>Terjemahkan Seluruh Lembar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cyber Grid Canvas Table */}
      <div className="flex-1 overflow-auto max-h-[580px] bg-[#070911]">
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0F111D]">
            <tr>
              <th className="w-12 border-r border-white/10 px-2 py-2 text-center text-zinc-500 font-medium">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="min-w-[140px] border-r border-white/10 px-3 py-2 text-left font-semibold text-cyan-300 uppercase tracking-wider text-[11px]"
                >
                  {getColLabel(colIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={
                  selectedCell?.r === rIdx
                    ? "bg-indigo-950/20"
                    : "hover:bg-white/[0.02]"
                }
              >
                <td className="sticky left-0 border-r border-b border-white/10 bg-[#0C0E18] text-center text-zinc-500 font-mono py-1.5 text-[11px]">
                  {rIdx + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, cIdx) => {
                  const val = row[cIdx] ?? "";
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={`border-r border-b border-white/[0.06] p-0 transition-colors ${
                        isSelected
                          ? "bg-cyan-500/10 ring-2 ring-cyan-400/80 ring-inset shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full h-full px-3 py-2 bg-transparent border-none text-xs text-zinc-200 focus:outline-hidden font-sans"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Futuristic Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <TableIcon className="h-3.5 w-3.5 text-cyan-400" />
          <span>{rows.length} ROWS × {maxCols} COLS</span>
        </div>
        <div>
          Click any cell to edit • Select cell to translate
        </div>
      </div>
    </div>
  );
};
