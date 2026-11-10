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

      const rect = textareaRef.current.getBoundingClientRect();
      setBubblePosition({
        x: Math.min(Math.max(rect.left + 30, 40), window.innerWidth - 340),
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
    <div className="relative flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0B0D16]/90 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Editor Dark Frosted Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            type="button"
            onClick={() => applyWrapFormat("**")}
            title="Tebal (Bold)"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("*")}
            title="Miring (Italic)"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("\n- ")}
            title="Daftar Poin"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <List className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1.5" />
          <span className="text-xs text-zinc-500 hidden sm:inline">
            <Type className="inline h-3.5 w-3.5 mr-1 text-cyan-400" />
            Sorot teks untuk terjemahan kata instan
          </span>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
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
            onClick={() => onFullTranslate(fullTargetLang)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_-2px_rgba(99,102,241,0.7)] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>Terjemahkan Dokumen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Selection Translation Bubble (Glowing Glass) */}
      {bubblePosition && selectedText && (
        <div
          id="translation-bubble"
          style={{
            position: "fixed",
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className="z-50 flex flex-col gap-2.5 rounded-2xl border border-indigo-500/40 bg-[#0E101C]/95 p-4 shadow-[0_0_35px_rgba(99,102,241,0.3)] backdrop-blur-2xl w-80 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ganti Bahasa Teks Terpilih</span>
            </div>
            <button
              type="button"
              onClick={() => setBubblePosition(null)}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-xs font-mono text-zinc-300 bg-white/[0.04] p-2 rounded-lg border border-white/5 max-h-18 overflow-y-auto">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs rounded-lg border border-white/10 bg-[#161928] px-2.5 py-1.5 text-zinc-200 focus:outline-hidden cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#121422] text-white">
                  {l.flag} Ke {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isTranslatingSelection ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Ubah"
              )}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-2 rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <p className="text-xs text-emerald-300 font-medium">
                {translatedSelection}
              </p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Ganti Teks Sekarang</span>
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
          className="w-full h-full min-h-[500px] resize-none border-none bg-transparent font-sans text-sm sm:text-base leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Futuristic Document Stats Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-6 py-2.5 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-4">
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} WORDS</span>
          <span>•</span>
          <span>{content.length} CHARS</span>
          <span>•</span>
          <span>{content.split("\n").length} LINES</span>
        </div>
        <div className="text-zinc-400 hidden sm:inline">
          Highlight any text to trigger the neural translator
        </div>
      </div>
    </div>
  );
};
