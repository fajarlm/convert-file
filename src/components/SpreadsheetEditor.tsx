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
    <div className="flex flex-col h-full bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] overflow-hidden">
      {/* Spreadsheet Toolbar Neo-Brutalist */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black bg-[#FEF08A] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Tambah Baris</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Tambah Kolom</span>
          </button>
          {selectedCell && (
            <button
              type="button"
              onClick={deleteCurrentRow}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FDA4AF] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <Trash2 className="h-4 w-4 stroke-[2.5]" />
              <span>Hapus Baris #{selectedCell.r + 1}</span>
            </button>
          )}

          {selectedCell && (
            <button
              type="button"
              onClick={translateSelectedCell}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#C4B5FD] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
              <span>Ganti Bahasa Sel Ini</span>
            </button>
          )}
        </div>

        {/* Translation Controls for Whole Sheet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 py-1.5 shadow-[2px_2px_0px_#000]">
            <Globe className="h-4 w-4 stroke-[2.5] text-black" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-xs font-bold bg-transparent border-none focus:outline-hidden text-black cursor-pointer"
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
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#C084FC] px-3.5 py-1.5 text-xs font-black text-black shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 transition-all cursor-pointer"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menerjemahkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 stroke-[2.5]" />
                <span>Terjemahkan Seluruh Lembar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Canvas Table with Solid Neo-Brutalist Grid */}
      <div className="flex-1 overflow-auto max-h-[560px] bg-white">
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 z-10 border-b-2 border-black bg-[#E0E7FF]">
            <tr>
              <th className="w-14 border-r-2 border-black bg-[#CBD5E1] px-2 py-2.5 text-center font-black text-black">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="min-w-[140px] border-r-2 border-black px-3 py-2.5 text-left font-black text-black uppercase"
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
                    ? "bg-[#FEF08A]/40"
                    : "hover:bg-zinc-100"
                }
              >
                <td className="sticky left-0 border-r-2 border-b-2 border-black bg-[#E2E8F0] text-center font-black text-black py-2">
                  {rIdx + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, cIdx) => {
                  const val = row[cIdx] ?? "";
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={`border-r-2 border-b-2 border-black p-0 transition-colors ${
                        isSelected
                          ? "bg-[#FFE600] ring-3 ring-black ring-inset"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full h-full px-3 py-2 bg-transparent border-none text-xs text-black font-semibold focus:outline-hidden font-sans"
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
      <div className="flex items-center justify-between border-t-3 border-black bg-[#F4F4F5] px-4 py-2.5 text-xs font-bold text-black">
        <div className="flex items-center gap-3">
          <TableIcon className="h-4 w-4 stroke-[2.5]" />
          <span>{rows.length} Baris × {maxCols} Kolom</span>
        </div>
        <div className="text-xs font-semibold text-zinc-600 hidden sm:inline">
          Klik sel untuk mengedit langsung atau klik &apos;Ganti Bahasa Sel Ini&apos;
        </div>
      </div>
    </div>
  );
};
