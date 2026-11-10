"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Sparkles,
  Loader2,
  Check,
  X,
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

      const rect = textareaRef.current.getBoundingClientRect();
      setBubblePosition({
        x: Math.min(Math.max(rect.left + 20, 40), window.innerWidth - 320),
        y: Math.max(rect.top - 8, 70),
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

  const applyWrapFormat = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current || !selectionRange) return;
    const before = content.substring(0, selectionRange.start);
    const selected = content.substring(selectionRange.start, selectionRange.end);
    const after = content.substring(selectionRange.end);
    onChange(before + prefix + selected + suffix + after);
  };

  return (
    <div className="relative flex flex-col h-full bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Calm Minimalist Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/40 px-4 py-2">
        <div className="flex items-center gap-1 text-zinc-500">
          <button
            type="button"
            onClick={() => applyWrapFormat("**")}
            title="Tebal"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200/60 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <Bold className="h-3.5 w-3.5 stroke-[2]" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("*")}
            title="Miring"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200/60 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <Italic className="h-3.5 w-3.5 stroke-[2]" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("\n- ")}
            title="Daftar Poin"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200/60 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <List className="h-3.5 w-3.5 stroke-[2]" />
          </button>
          <div className="h-3 w-px bg-zinc-200 mx-1" />
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Sorot kata untuk terjemah instan
          </span>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-zinc-200/80 bg-white rounded-lg px-2 py-1 text-xs">
            <Globe className="h-3 w-3 text-zinc-400" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
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
            onClick={() => onFullTranslate(fullTargetLang)}
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
                <span>Terjemahkan Dokumen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Selection Translation Bubble Minimalist */}
      {bubblePosition && selectedText && (
        <div
          id="translation-bubble"
          style={{
            position: "fixed",
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className="z-50 flex flex-col gap-2 rounded-xl border border-zinc-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md w-76 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
            <span className="text-[11px] font-medium text-zinc-500">
              Ganti Bahasa Kata Terpilih
            </span>
            <button
              type="button"
              onClick={() => setBubblePosition(null)}
              className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100 max-h-16 overflow-y-auto font-mono">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs rounded-lg border border-zinc-200 bg-white px-2 py-1 text-zinc-800 focus:outline-hidden cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isTranslatingSelection ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Ubah"
              )}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-2 rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/70">
              <p className="text-xs text-zinc-900 font-medium">
                {translatedSelection}
              </p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 cursor-pointer"
              >
                <Check className="h-3 w-3" />
                <span>Terapkan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 p-8">
        <textarea
          id="document-textarea"
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          placeholder="Mulai menulis atau menyunting dokumen di sini..."
          className="w-full h-full min-h-[500px] resize-none border-none bg-transparent font-sans text-sm sm:text-base leading-relaxed text-zinc-800 placeholder:text-zinc-300 focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Minimalist Stats Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/30 px-6 py-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} kata</span>
          <span>{content.length} karakter</span>
          <span>{content.split("\n").length} baris</span>
        </div>
        <div>
          Sorot teks dengan kursor untuk mengubah bahasa kata tertentu
        </div>
      </div>
    </div>
  );
};
