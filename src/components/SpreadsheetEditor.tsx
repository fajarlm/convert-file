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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
      {/* Spreadsheet Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Baris</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Kolom</span>
          </button>
          {selectedCell && (
            <button
              type="button"
              onClick={deleteCurrentRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Baris #{selectedCell.r + 1}</span>
            </button>
          )}

          {selectedCell && (
            <button
              type="button"
              onClick={translateSelectedCell}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Terjemahkan Sel Ini</span>
            </button>
          )}
        </div>

        {/* Translation Controls for Whole Sheet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 shadow-2xs">
            <Globe className="h-3.5 w-3.5 text-indigo-500" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-hidden text-zinc-700 dark:text-zinc-300"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isTranslatingFull}
            onClick={() => onFullTranslate(targetLang)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition-all"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan Sheet...</span>
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
      <div className="flex-1 overflow-auto max-h-[560px]">
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
            <tr>
              <th className="w-12 border-r border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 px-2 py-2 text-center text-zinc-500">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="min-w-[140px] border-r border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300"
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
                    ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                    : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
                }
              >
                <td className="sticky left-0 border-r border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/90 text-center font-medium text-zinc-500 py-1.5">
                  {rIdx + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, cIdx) => {
                  const val = row[cIdx] ?? "";
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={`border-r border-b border-zinc-200 dark:border-zinc-800 p-0 transition-colors ${
                        isSelected
                          ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/60 dark:bg-indigo-950/40"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full h-full px-2.5 py-1.5 bg-transparent border-none text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden font-sans"
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
      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <TableIcon className="h-3.5 w-3.5 text-zinc-400" />
          <span>{rows.length} Baris × {maxCols} Kolom</span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Klik sel untuk mengedit langsung atau klik &apos;Terjemahkan Sel Ini&apos;
        </div>
      </div>
    </div>
  );
};
