"use client";

import React, { useState } from "react";
import { KeyRound, Check, X, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { getUserGeminiKey, setUserGeminiKey } from "@/lib/translator";
import { useAppTheme } from "@/context/ThemeContext";

export const ApiKeyModal: React.FC = () => {
  const { theme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(() =>
    typeof window !== "undefined" ? getUserGeminiKey() : ""
  );
  const [hasSavedKey, setHasSavedKey] = useState(() =>
    typeof window !== "undefined" ? !!getUserGeminiKey() : false
  );
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const openModal = () => {
    setKeyInput(getUserGeminiKey());
    setIsOpen(true);
  };

  const handleSave = () => {
    setUserGeminiKey(keyInput);
    setHasSavedKey(!!keyInput.trim());
    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
      setIsOpen(false);
    }, 1000);
  };

  const handleClear = () => {
    setKeyInput("");
    setUserGeminiKey("");
    setHasSavedKey(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title="Pengaturan Kunci AI (Opsional)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-all cursor-pointer ${
          theme === "retro"
            ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-mono"
            : theme === "brutalist"
            ? "rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] font-bold"
            : theme === "minimal"
            ? "rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            : "rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
        }`}
      >
        <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
        <span className="hidden sm:inline">AI Key</span>
        {hasSavedKey && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black shadow-2xl"
                : theme === "brutalist"
                ? "rounded-2xl border-4 border-black bg-white text-black shadow-[8px_8px_0px_#000]"
                : theme === "minimal"
                ? "rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl"
                : "rounded-2xl border border-white/15 bg-[#0D0F1B] text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/15 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm sm:text-base">Pengaturan AI Gemini (Opsional)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed opacity-90">
              <p>
                Secara bawaan, DocMorph sudah menggunakan mesin penerjemah multi-provider (Google Neural &amp; MyMemory) berkecepatan tinggi yang <b>aktif otomatis tanpa perlu konfigurasi</b>.
              </p>
              <p>
                Jika Anda memiliki <b>Gemini API Key</b> gratis dari Google AI Studio, Anda dapat menempelkannya di bawah ini untuk mengaktifkan pemahaman konteks mendalam Gemini 1.5 Flash:
              </p>

              <div>
                <label className="block font-semibold mb-1">Google Gemini API Key:</label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                    theme === "retro"
                      ? "bg-white border-2 border-black text-black"
                      : "bg-black/10 dark:bg-white/5 border-current/20 focus:border-cyan-400 focus:outline-hidden"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] opacity-70 pt-1">
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Tersimpan aman di peramban lokal Anda</span>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <span>Dapatkan API Key Gratis</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-current/15 pt-4">
              {hasSavedKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  Hapus Kunci
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-current/20 hover:bg-current/5 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  theme === "retro"
                    ? "bg-[#000080] text-white"
                    : theme === "brutalist"
                    ? "border-2 border-black bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]"
                    : "bg-cyan-500 text-black hover:bg-cyan-400"
                }`}
              >
                {isSavedAlert ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan Kunci</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
