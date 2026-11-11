"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe,
  Sparkles,
  Loader2,
  Check,
  X,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Table as TableIcon,
  Plus,
  Trash2,
  Heading1,
  Heading2,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/types";
import { useAppTheme } from "@/context/ThemeContext";
import { translateText } from "@/lib/translator";

interface DocumentEditorProps {
  htmlContent: string;
  onChange: (newHtml: string) => void;
  onFullTranslate: (targetLang: string) => Promise<void>;
  isTranslatingFull: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  htmlContent,
  onChange,
  onFullTranslate,
  isTranslatingFull,
}) => {
  const { theme } = useAppTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);

  // Selection translation state
  const [targetLang, setTargetLang] = useState("en");
  const [fullTargetLang, setFullTargetLang] = useState("en");
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);
  const [translatedSelection, setTranslatedSelection] = useState("");

  // Sync external HTML changes to editor innerHTML (initial load or full translate)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== htmlContent) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  // Handle user input in contentEditable
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setSavedRange(null);
      setBubblePosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      setSavedRange(range.cloneRange());
      setSelectedText(text);
      setTranslatedSelection("");

      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      const x = Math.min(
        Math.max(rect.left, (editorRect?.left || 40) + 10),
        window.innerWidth - 340
      );
      const y = Math.max(rect.top - 80, 70);

      setBubblePosition({ x, y });
    } else {
      setSelectedText("");
      setSavedRange(null);
      setBubblePosition(null);
    }
  };

  const handleTranslateSelection = async () => {
    if (!selectedText.trim()) return;
    setIsTranslatingSelection(true);
    try {
      const translated = await translateText(selectedText, targetLang);
      if (translated) {
        setTranslatedSelection(translated);
      } else {
        alert("Gagal menerjemahkan teks yang dipilih. Coba lagi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat menerjemahkan.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };

  const applyTranslatedSelection = () => {
    if (!savedRange || !translatedSelection) return;

    // Restore selection range
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    // Replace selected range with translated text without destroying wrapping tags
    savedRange.deleteContents();
    const textNode = document.createTextNode(translatedSelection);
    savedRange.insertNode(textNode);

    // Update parent
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }

    // Reset bubble
    setSelectedText("");
    setSavedRange(null);
    setBubblePosition(null);
    setTranslatedSelection("");
  };

  // Close floating bubble when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#translation-bubble") && !target.closest("#document-editor-canvas")) {
        setBubblePosition(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatting commands
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleInput();
  };

  // Insert Table
  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <thead>
          <tr style="background:#f4f4f5; font-weight:bold;">
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">No</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Nama Kolom A</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Nama Kolom B</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #71717a; padding:8px 12px;">1</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Data Baris 1</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Nilai Format</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Selesai</td>
          </tr>
          <tr>
            <td style="border:1px solid #71717a; padding:8px 12px;">2</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Data Baris 2</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Nilai Format</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Proses</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd("insertHTML", tableHtml);
  };

  // Add row to active table
  const addTableRow = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const row = cell?.closest("tr");
    if (!row) {
      alert("Letakkan kursor di dalam sel tabel terlebih dahulu.");
      return;
    }
    const colsCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colsCount; i++) {
      const td = document.createElement("td");
      td.style.border = "1px solid #71717a";
      td.style.padding = "8px 12px";
      td.innerHTML = "Baris baru";
      newRow.appendChild(td);
    }
    row.parentNode?.insertBefore(newRow, row.nextSibling);
    handleInput();
  };

  // Add column to active table
  const addTableColumn = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const table = cell?.closest("table");
    if (!table) {
      alert("Letakkan kursor di dalam tabel terlebih dahulu.");
      return;
    }
    const rows = table.querySelectorAll("tr");
    rows.forEach((r, idx) => {
      const isHeader = idx === 0 && r.querySelector("th");
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.border = "1px solid #71717a";
      newCell.style.padding = "8px 12px";
      if (isHeader) {
        newCell.style.background = "#f4f4f5";
        newCell.style.fontWeight = "bold";
        newCell.innerHTML = "Kolom Baru";
      } else {
        newCell.innerHTML = "Data";
      }
      r.appendChild(newCell);
    });
    handleInput();
  };

  // Delete current table row
  const deleteTableRow = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const row = cell?.closest("tr");
    if (row) {
      row.remove();
      handleInput();
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

  const getToolbarStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#c0c0c0] border-b-2 border-b-zinc-700 px-3 py-2";
      case "brutalist":
        return "bg-[#FEF08A] border-b-3 border-black px-4 py-2.5";
      case "minimal":
        return "bg-zinc-50/50 border-b border-zinc-100 px-4 py-2 text-zinc-600";
      case "cyber":
      default:
        return "bg-white/[0.02] border-b border-white/[0.07] px-4 py-2.5 text-zinc-300";
    }
  };

  const getBtnClass = () => {
    if (theme === "retro") {
      return "h-7 w-7 flex items-center justify-center bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold cursor-pointer";
    }
    if (theme === "brutalist") {
      return "h-7 w-7 flex items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer rounded";
    }
    return "h-7 w-7 flex items-center justify-center rounded hover:bg-current/10 cursor-pointer transition-colors";
  };

  return (
    <div className={`relative flex flex-col h-full overflow-hidden ${getContainerStyle()}`}>
      {/* Visual Rich Formatting Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${getToolbarStyle()}`}>
        {/* Formatting Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => execCmd("undo")}
            title="Urungkan (Undo)"
            className={getBtnClass()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            title="Ulangi (Redo)"
            className={getBtnClass()}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          <button
            type="button"
            onClick={() => execCmd("bold")}
            title="Tebal (Bold)"
            className={getBtnClass()}
          >
            <Bold className="h-3.5 w-3.5 font-bold" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            title="Miring (Italic)"
            className={getBtnClass()}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            title="Garis Bawah (Underline)"
            className={getBtnClass()}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            title="Coret (Strikethrough)"
            className={getBtnClass()}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h1>")}
            title="Judul Utama (H1)"
            className={getBtnClass()}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h2>")}
            title="Sub Judul (H2)"
            className={getBtnClass()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            title="Daftar Poin"
            className={getBtnClass()}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            title="Daftar Angka"
            className={getBtnClass()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Table Tools */}
          <button
            type="button"
            onClick={insertTable}
            title="Sisipkan Tabel Baru"
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "border border-current/20 hover:bg-current/10"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>+ Tabel</span>
          </button>

          <button
            type="button"
            onClick={addTableRow}
            title="Tambah Baris pada Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-current/10 opacity-80 cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Baris
          </button>

          <button
            type="button"
            onClick={addTableColumn}
            title="Tambah Kolom pada Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-current/10 opacity-80 cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Kolom
          </button>

          <button
            type="button"
            onClick={deleteTableRow}
            title="Hapus Baris Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-rose-500/20 text-rose-400 opacity-80 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" /> Hapus
          </button>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg ${
              theme === "retro"
                ? "bg-white border-2 border-black text-black"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-zinc-300"
            }`}
          >
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
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
            onClick={() => onFullTranslate(fullTargetLang)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black font-mono active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
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
                <span>Menerjemahkan Dokumen &amp; Tabel...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Terjemahkan Dokumen (Pertahankan Format)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Selection Translation Bubble */}
      {bubblePosition && selectedText && (
        <div
          id="translation-bubble"
          style={{
            position: "fixed",
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className={`z-50 flex flex-col gap-2 p-3 w-84 animate-in fade-in zoom-in-95 duration-100 ${
            theme === "retro"
              ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black shadow-2xl"
              : theme === "brutalist"
              ? "rounded-2xl border-3 border-black bg-[#FFE600] text-black shadow-[6px_6px_0px_#000]"
              : theme === "minimal"
              ? "rounded-xl border border-zinc-200 bg-white/95 text-zinc-900 shadow-xl backdrop-blur-md"
              : "rounded-2xl border border-indigo-500/40 bg-[#0E101C]/95 text-white backdrop-blur-2xl shadow-[0_0_35px_rgba(99,102,241,0.3)]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/15 pb-1.5">
            <span className="text-[11px] font-bold uppercase">Ganti Bahasa Kata / Kalimat Terpilih</span>
            <button onClick={() => setBubblePosition(null)} className="cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-2 rounded border border-current/10 max-h-16 overflow-y-auto">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs rounded border border-current/20 bg-white/10 dark:bg-black/20 px-2 py-1.5 focus:outline-hidden cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isTranslatingSelection ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ubah"}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-1.5 p-2.5 rounded border border-current/20 bg-emerald-500/10">
              <div className="text-[10px] uppercase font-bold text-emerald-500">Hasil Terjemahan:</div>
              <p className="text-xs font-semibold">{translatedSelection}</p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Terapkan ke Dokumen (Format Tetap)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main WYSIWYG Document Canvas */}
      <div
        className={`relative flex-1 p-6 sm:p-10 overflow-y-auto max-h-[680px] ${
          theme === "retro" ? "bg-white text-black font-mono" : ""
        }`}
      >
        <div
          id="document-editor-canvas"
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onMouseUp={handleMouseUp}
          onKeyUp={handleMouseUp}
          className={`min-h-[500px] w-full max-w-4xl mx-auto focus:outline-hidden text-sm sm:text-base leading-relaxed ${
            theme === "retro" ? "text-black" : ""
          } [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-current/30 [&_th]:border [&_th]:border-current/30 [&_th]:p-2.5 [&_th]:font-bold [&_th]:bg-current/5 [&_td]:border [&_td]:border-current/30 [&_td]:p-2.5 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline`}
        />
      </div>

      {/* Document Stats Footer */}
      <div className="flex items-center justify-between border-t border-current/10 px-4 py-2 text-[11px] opacity-70">
        <div className="flex items-center gap-2">
          <Type className="h-3.5 w-3.5" />
          <span>Editor Visual WYSIWYG • Format dokumen, tabel, tebal &amp; miring terjaga 100%</span>
        </div>
        <div>Highlight kata/kalimat apa saja untuk mengubah bahasa bagian tersebut</div>
      </div>
    </div>
  );
};
