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
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Spreadsheet Minimalist Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/40 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3 text-zinc-400" />
            <span>Baris</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3 text-zinc-400" />
            <span>Kolom</span>
          </button>
          {selectedCell && (
            <button
              type="button"
              onClick={deleteCurrentRow}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50/50 px-2.5 py-1 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Hapus Baris #{selectedCell.r + 1}</span>
            </button>
          )}

          {selectedCell && (
            <button
              type="button"
              onClick={translateSelectedCell}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-zinc-800 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-zinc-500" />
              <span>Ganti Bahasa Sel Ini</span>
            </button>
          )}
        </div>

        {/* Translation Controls for Whole Sheet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-zinc-200/80 bg-white rounded-lg px-2 py-1 text-xs">
            <Globe className="h-3 w-3 text-zinc-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden text-zinc-700 text-xs cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isTranslatingFull}
            onClick={() => onFullTranslate(targetLang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                <span>Menerjemahkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-zinc-500" />
                <span>Terjemahkan Lembar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Canvas Table with Clean Minimalist Hairlines */}
      <div className="flex-1 overflow-auto max-h-[580px] bg-white">
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="w-12 border-r border-zinc-200 px-2 py-2 text-center font-normal text-zinc-400">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="min-w-[130px] border-r border-zinc-200 px-3 py-2 text-left font-medium text-zinc-500 uppercase text-[11px]"
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
                    ? "bg-zinc-50/70"
                    : "hover:bg-zinc-50/40"
                }
              >
                <td className="sticky left-0 border-r border-b border-zinc-200 bg-zinc-50/80 text-center text-zinc-400 py-1.5 text-[11px]">
                  {rIdx + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, cIdx) => {
                  const val = row[cIdx] ?? "";
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={`border-r border-b border-zinc-100 p-0 transition-colors ${
                        isSelected
                          ? "bg-zinc-100/90 ring-1 ring-zinc-400 ring-inset"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full h-full px-2.5 py-1.5 bg-transparent border-none text-xs text-zinc-900 focus:outline-hidden font-sans"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Minimalist Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/30 px-4 py-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <TableIcon className="h-3 w-3" />
          <span>{rows.length} baris × {maxCols} kolom</span>
        </div>
        <div>
          Klik sel untuk mengedit langsung
        </div>
      </div>
    </div>
  );
};
