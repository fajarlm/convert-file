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
import { useAppTheme } from "@/context/ThemeContext";

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
  const { theme } = useAppTheme();
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

  return (
    <div className={`relative flex flex-col h-full overflow-hidden ${getContainerStyle()}`}>
      {/* Editor Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${getToolbarStyle()}`}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyWrapFormat("**")}
            title="Tebal"
            className={`flex h-7 w-7 items-center justify-center rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("*")}
            title="Miring"
            className={`flex h-7 w-7 items-center justify-center rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyWrapFormat("\n- ")}
            title="Daftar Poin"
            className={`flex h-7 w-7 items-center justify-center rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] opacity-60 hidden sm:inline ml-2">
            <Type className="inline h-3 w-3 mr-1" />
            Sorot teks untuk terjemah instan
          </span>
        </div>

        {/* Full Document Translation Controls */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg ${
            theme === "retro"
              ? "bg-white border-2 border-black text-black"
              : theme === "brutalist"
              ? "border-2 border-black bg-white text-black"
              : "border border-white/10 bg-white/[0.04] text-zinc-300"
          }`}>
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
                <span>Menerjemahkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Terjemahkan Dokumen</span>
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
          className={`z-50 flex flex-col gap-2 p-3 w-76 animate-in fade-in zoom-in-95 duration-100 ${
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
            <span className="text-[11px] font-bold uppercase">Ganti Bahasa Teks Terpilih</span>
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
              className="w-full text-xs rounded border border-current/20 bg-white/10 dark:bg-black/20 px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                  {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 px-3 py-1 text-xs font-bold rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isTranslatingSelection ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ubah"}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-1.5 p-2 rounded border border-current/20 bg-emerald-500/10">
              <p className="text-xs font-semibold">{translatedSelection}</p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1 py-1 px-2 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Terapkan Teks</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className={`relative flex-1 p-6 ${theme === "retro" ? "bg-white text-black" : ""}`}>
        <textarea
          id="document-textarea"
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          placeholder="Mulai menulis atau menyunting berkas di sini..."
          className="w-full h-full min-h-[500px] resize-none border-none bg-transparent font-sans text-sm sm:text-base leading-relaxed focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Document Stats Footer */}
      <div className="flex items-center justify-between border-t border-current/10 px-4 py-2 text-[11px] opacity-70">
        <div>
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} kata</span> •{" "}
          <span>{content.length} karakter</span>
        </div>
        <div>Highlight teks untuk membuka opsi ubah bahasa</div>
      </div>
    </div>
  );
};
