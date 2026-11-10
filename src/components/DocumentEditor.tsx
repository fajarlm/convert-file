"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Sparkles,
  Loader2,
  Check,
  X,
  Type,
  Bold,
  Italic,
  List,
} from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/types";

interface DocumentEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onFullTranslate: (targetLang: string) => Promise<void>;
  isTranslatingFull: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  onChange,
  onFullTranslate,
  isTranslatingFull,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Selection translation state
  const [targetLang, setTargetLang] = useState("en");
  const [fullTargetLang, setFullTargetLang] = useState("en");
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);
  const [translatedSelection, setTranslatedSelection] = useState("");

  const handleSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value.substring(start, end);

    if (text.trim().length > 0) {
      setSelectedText(text);
      setSelectionRange({ start, end });
      setTranslatedSelection("");

      // Calculate approximate position for bubble popup
      const rect = textareaRef.current.getBoundingClientRect();
      setBubblePosition({
        x: Math.min(Math.max(rect.left + 40, 60), window.innerWidth - 340),
        y: Math.max(rect.top - 8, 80),
      });
    } else {
      setSelectedText("");
      setSelectionRange(null);
      setBubblePosition(null);
    }
  };

  const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
          targetLang,
        }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedSelection(data.translatedText);
      } else {
        alert("Gagal menerjemahkan teks yang dipilih.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat menerjemahkan.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };

  const applyTranslatedSelection = () => {
    if (!selectionRange || !translatedSelection) return;
    const before = content.substring(0, selectionRange.start);
    const after = content.substring(selectionRange.end);
    const newContent = before + translatedSelection + after;
    onChange(newContent);
    // Reset selection bubble
    setSelectedText("");
    setSelectionRange(null);
    setBubblePosition(null);
    setTranslatedSelection("");
  };

  // Close bubble on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#translation-bubble") && !target.closest("#document-textarea")) {
        setBubblePosition(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick formatting helpers
  const applyWrapFormat = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current || !selectionRange) return;
    const before = content.substring(0, selectionRange.start);
    const selected = content.substring(selectionRange.start, selectionRange.end);
    const after = content.substring(selectionRange.end);
    onChange(before + prefix + selected + suffix + after);
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyWrapFormat("**")}
            title="Tebal (Bold)"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("*")}
            title="Miring (Italic)"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("\n- ")}
            title="Daftar Poin (Bullet List)"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <List className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
          <span className="text-xs text-zinc-500 hidden sm:inline">
            <Type className="inline h-3.5 w-3.5 mr-1" />
            Sorot teks untuk terjemahkan kata/kalimat tertentu
          </span>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 shadow-2xs">
            <Globe className="h-3.5 w-3.5 text-indigo-500" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
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
            onClick={() => onFullTranslate(fullTargetLang)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition-all"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan Dokumen...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Terjemahkan Seluruh Dokumen</span>
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
          className="z-50 flex flex-col gap-2 rounded-xl border border-indigo-200 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-indigo-900 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150 w-80"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Terjemahkan Teks Terpilih</span>
            </div>
            <button
              type="button"
              onClick={() => setBubblePosition(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded max-h-16 overflow-y-auto">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} Ke {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isTranslatingSelection ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Proses"
              )}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-2 rounded-lg bg-emerald-50/80 p-2 border border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                {translatedSelection}
              </p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
              >
                <Check className="h-3 w-3" />
                <span>Ganti Teks Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 p-6">
        <textarea
          id="document-textarea"
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          placeholder="Ketik atau edit isi dokumen di sini..."
          className="w-full h-full min-h-[480px] resize-none border-none bg-transparent font-sans text-sm md:text-base leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Document Stats Footer */}
      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} Kata</span>
          <span>{content.length} Karakter</span>
          <span>{content.split("\n").length} Baris</span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Tip: Tekan Ctrl+A atau pilih teks untuk aksi terjemahan kata
        </div>
      </div>
    </div>
  );
};
