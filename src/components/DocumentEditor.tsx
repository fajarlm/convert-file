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
        x: Math.min(Math.max(rect.left + 40, 60), window.innerWidth - 360),
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
    <div className="relative flex flex-col h-full bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] overflow-hidden">
      {/* Editor Toolbar Neo-Brutalist */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black bg-[#FEF08A] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyWrapFormat("**")}
            title="Tebal (Bold)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-zinc-50 cursor-pointer"
          >
            <Bold className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("*")}
            title="Miring (Italic)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-zinc-50 cursor-pointer"
          >
            <Italic className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("\n- ")}
            title="Daftar Poin (Bullet List)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-zinc-50 cursor-pointer"
          >
            <List className="h-4 w-4 stroke-[2.5]" />
          </button>
          <div className="h-6 w-0.5 bg-black mx-1" />
          <span className="text-xs font-bold text-black hidden sm:inline">
            <Type className="inline h-3.5 w-3.5 mr-1 stroke-[2.5]" />
            Sorot teks untuk terjemahkan kata tertentu
          </span>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 py-1.5 shadow-[2px_2px_0px_#000]">
            <Globe className="h-4 w-4 stroke-[2.5] text-black" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
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
            onClick={() => onFullTranslate(fullTargetLang)}
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
                <span>Terjemahkan Seluruh Dokumen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Selection Translation Bubble Neo-Brutalist */}
      {bubblePosition && selectedText && (
        <div
          id="translation-bubble"
          style={{
            position: "fixed",
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className="z-50 flex flex-col gap-2.5 rounded-2xl border-3 border-black bg-[#FFE600] p-4 shadow-[8px_8px_0px_#000] w-84 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black">
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
              <span>Ganti Bahasa Teks Terpilih</span>
            </div>
            <button
              type="button"
              onClick={() => setBubblePosition(null)}
              className="h-6 w-6 flex items-center justify-center rounded border-2 border-black bg-white text-black hover:bg-red-200 cursor-pointer shadow-[1px_1px_0px_#000]"
            >
              <X className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>

          <div className="text-xs font-bold font-mono text-black bg-white border-2 border-black p-2 rounded-lg max-h-20 overflow-y-auto shadow-inner">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs font-bold rounded-lg border-2 border-black bg-white px-2.5 py-1.5 text-black focus:outline-hidden shadow-[2px_2px_0px_#000]"
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
              className="shrink-0 rounded-lg border-2 border-black bg-[#38BDF8] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-50"
            >
              {isTranslatingSelection ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Ubah"
              )}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-2 rounded-xl bg-[#DCFCE7] p-3 border-2 border-black shadow-[2px_2px_0px_#000]">
              <p className="text-xs font-bold text-black">
                {translatedSelection}
              </p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-[#22C55E] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Ganti Teks Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 p-6 bg-white">
        <textarea
          id="document-textarea"
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          placeholder="Ketik atau edit isi dokumen di sini..."
          className="w-full h-full min-h-[480px] resize-none border-none bg-transparent font-sans text-base leading-relaxed text-black font-medium focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Document Stats Footer */}
      <div className="flex items-center justify-between border-t-3 border-black bg-[#F4F4F5] px-4 py-2.5 text-xs font-bold text-black">
        <div className="flex items-center gap-4">
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} Kata</span>
          <span>•</span>
          <span>{content.length} Karakter</span>
          <span>•</span>
          <span>{content.split("\n").length} Baris</span>
        </div>
        <div className="text-xs font-semibold text-zinc-600 hidden sm:inline">
          Tip: Tekan Ctrl+A atau sorot teks untuk membuka bubble ganti bahasa
        </div>
      </div>
    </div>
  );
};
