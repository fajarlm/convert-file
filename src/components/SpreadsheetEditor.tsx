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
import { useAppTheme } from "@/context/ThemeContext";

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
  const { theme } = useAppTheme();
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

  const getContainerStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black";
      case "brutalist":
        return "rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0px_#000] text-black";
      case "minimal":
        return "rounded-xl border border-zinc-200 bg-white shadow-xs text-zinc-900";
      case "cyber":
      default:
        return "rounded-2xl border border-white/10 bg-[#0B0D16]/90 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] text-white";
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${getContainerStyle()}`}>
      {/* Spreadsheet Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/15 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "rounded-lg border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "rounded-lg border border-current/20 hover:bg-current/5"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Baris</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "rounded-lg border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "rounded-lg border border-current/20 hover:bg-current/5"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Kolom</span>
          </button>
          {selectedCell && (
            <button
              type="button"
              onClick={deleteCurrentRow}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-500 rounded border border-rose-500/30 bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Baris #{selectedCell.r + 1}</span>
            </button>
          )}

          {selectedCell && (
            <button
              type="button"
              onClick={translateSelectedCell}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-violet-400 rounded border border-violet-500/30 bg-violet-500/10 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ganti Bahasa Sel Ini</span>
            </button>
          )}
        </div>

        {/* Translation Controls for Whole Sheet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-current/20 px-2 py-1 text-xs rounded">
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden text-xs cursor-pointer font-sans"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-zinc-900 text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isTranslatingFull}
            onClick={() => onFullTranslate(targetLang)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "rounded-xl border-2 border-black bg-[#C084FC] text-black shadow-[2px_2px_0px_#000] font-black"
                : theme === "minimal"
                ? "rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                : "rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-xs"
            }`}
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan Lembar...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Terjemahkan Seluruh Lembar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Canvas Table */}
      <div className={`flex-1 overflow-auto max-h-[580px] ${theme === "retro" ? "bg-white text-black" : ""}`}>
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 z-10 border-b border-current/20 bg-black/5 dark:bg-white/5">
            <tr>
              <th className="w-12 border-r border-current/20 px-2 py-2 text-center opacity-60">#</th>
              {Array.from({ length: maxCols }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="min-w-[140px] border-r border-current/20 px-3 py-2 text-left font-bold opacity-80 uppercase"
                >
                  {getColLabel(colIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-current/5">
                <td className="sticky left-0 border-r border-b border-current/15 bg-black/5 dark:bg-zinc-900 text-center opacity-60 py-1.5">
                  {rIdx + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, cIdx) => {
                  const val = row[cIdx] ?? "";
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={`border-r border-b border-current/15 p-0 transition-colors ${
                        isSelected
                          ? "bg-cyan-500/20 ring-2 ring-cyan-400 ring-inset"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full h-full px-3 py-2 bg-transparent border-none text-xs focus:outline-hidden font-sans"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer */}
      <div className="flex items-center justify-between border-t border-current/15 px-4 py-2 text-xs opacity-70">
        <div className="flex items-center gap-2">
          <TableIcon className="h-3.5 w-3.5" />
          <span>{rows.length} Baris × {maxCols} Kolom</span>
        </div>
        <div>Klik sel untuk mengedit langsung</div>
      </div>
    </div>
  );
};
