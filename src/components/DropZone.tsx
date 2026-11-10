"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  FileType,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { LoadedDocument } from "@/lib/types";
import { parseUploadedFile } from "@/lib/converters";

interface DropZoneProps {
  onDocumentLoaded: (doc: LoadedDocument) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDocumentLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    try {
      const doc = await parseUploadedFile(file);
      onDocumentLoaded(doc);
    } catch (err) {
      console.error("Gagal membaca file:", err);
      alert("Gagal membaca file. Pastikan format didukung.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (type: "pdf" | "xlsx" | "docx") => {
    if (type === "pdf") {
      const sampleText = `LAPORAN EVALUASI & PENJUALAN PERUSAHAAN KUARTAL III\n\nPT Digital Nusantara Perkasa\nTanggal: 10 November 2026\n\nRingkasan Eksekutif:\nKinerja penjualan kuartal ini mencatatkan pertumbuhan signifikan sebesar 24% dibandingkan kuartal sebelumnya. Ekspansi ke pasar regional Asia Tenggara telah membuahkan hasil positif.\n\nRincian Metrik:\n- Total Pendapatan Operasional: Rp 450.000.000\n- Beban Pokok Penjualan: Rp 180.000.000\n- Laba Bersih Operasional: Rp 270.000.000\n- Kepuasan Pelanggan: 94.8%\n\nRekomendasi Strategis:\n1. Mengoptimalkan saluran pemasaran digital untuk meningkatkan konversi pengguna baru.\n2. Mempercepat otomatisasi proses konversi dan penerjemahan dokumen internal.\n3. Mempertahankan margin laba bersih di atas 20% pada kuartal mendatang.`;

      const doc: LoadedDocument = {
        id: "sample-pdf",
        name: "Laporan_Penjualan_Q3.pdf",
        size: 142000,
        originalExtension: "pdf",
        targetExtension: "xlsx",
        mode: "document",
        sheetData: [
          ["No", "Metrik Keuangan", "Nilai (IDR)", "Pertumbuhan"],
          [1, "Total Pendapatan Operasional", "450.000.000", "+24%"],
          [2, "Beban Pokok Penjualan", "180.000.000", "+5%"],
          [3, "Laba Bersih Operasional", "270.000.000", "+38%"],
        ],
        sheetName: "Financial_Report",
        contentHtml: sampleText
          .split("\n")
          .map((line) => `<p>${line || "&nbsp;"}</p>`)
          .join(""),
        contentText: sampleText,
        history: [],
      };
      onDocumentLoaded(doc);
    } else if (type === "xlsx") {
      const doc: LoadedDocument = {
        id: "sample-xlsx",
        name: "Daftar_Gaji_dan_Bonus_2026.xlsx",
        size: 89000,
        originalExtension: "xlsx",
        targetExtension: "pdf",
        mode: "spreadsheet",
        sheetData: [
          ["ID Karyawan", "Nama Lengkap", "Divisi", "Gaji Pokok (IDR)", "Bonus Performa", "Status"],
          ["EMP-001", "Ahmad Fauzan", "Software Engineering", 22000000, 5000000, "Aktif"],
          ["EMP-002", "Siti Rahmawati", "Product Management", 20000000, 4500000, "Aktif"],
          ["EMP-003", "Budi Santoso", "UI/UX Design", 18000000, 3500000, "Aktif"],
          ["EMP-004", "Dewi Lestari", "Data Analytics", 19500000, 4000000, "Aktif"],
          ["EMP-005", "Rian Pratama", "DevOps & Cloud", 21000000, 4800000, "Aktif"],
        ],
        sheetName: "Karyawan_Q3",
        contentHtml: "",
        contentText: "",
        history: [],
      };
      onDocumentLoaded(doc);
    } else {
      const docText = `PERJANJIAN KERJASAMA PENGEMBANGAN TEKNOLOGI\n\nNomor: 089/PKS/DN/XI/2026\n\nPada hari ini, Selasa tanggal 10 November 2026, telah disepakati perjanjian kerjasama antara:\n1. PIHAK PERTAMA: PT Inovasi Solusi Digital\n2. PIHAK KEDUA: Mitra Teknologi Rekayasa\n\nPasal 1: Ruang Lingkup Pekerjaan\nPIHAK PERTAMA menunjuk PIHAK KEDUA untuk membangun sistem otomatisasi konversi dokumen, penyuntingan langsung di browser, dan penerjemahan multi-bahasa berbasis AI.\n\nPasal 2: Jangka Waktu & Kerahasiaan Data\nSeluruh proses pengolahan dokumen dilakukan dengan standar keamanan data tinggi tanpa membocorkan isi berkas kepada pihak ketiga yang tidak berwenang.`;

      const doc: LoadedDocument = {
        id: "sample-docx",
        name: "Perjanjian_Kerjasama_Vendor.docx",
        size: 98000,
        originalExtension: "docx",
        targetExtension: "pdf",
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: docText
          .split("\n")
          .map((line) => `<p>${line || "&nbsp;"}</p>`)
          .join(""),
        contentText: docText,
        history: [],
      };
      onDocumentLoaded(doc);
    }
  };

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Aurora Ambient Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-4xl bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/15 blur-3xl rounded-full" />

      {/* Hero Badge & Headline */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 shadow-[0_0_18px_-2px_rgba(168,85,247,0.35)] backdrop-blur-md mb-6">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Next-Generation Neural Document Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Sunting, Terjemahkan &amp; <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Konversi Format Dokumen
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Penyuntingan berkas tanpa upload server. Sunting langsung di browser, ubah bahasa kata tertentu via AI, lalu simpan dalam format asli atau konversi ke format lain (PDF $\rightarrow$ Excel, Word $\rightarrow$ PDF, dll).
        </p>
      </div>

      {/* Futuristic Cyber-Portal Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-3xl border transition-all duration-300 p-12 text-center backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.3)] scale-[1.01]"
            : "border-white/[0.08] bg-zinc-950/60 hover:border-indigo-500/50 hover:bg-zinc-900/40 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.25)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.html"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Floating Halo Icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-white/10 text-cyan-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-5 group-hover:scale-105 group-hover:border-cyan-400/50 transition-all duration-300">
          <UploadCloud className="h-9 w-9 stroke-[1.8]" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {isLoading ? "Sedang memproses berkas..." : "Tarik & Lepaskan Berkas ke Sini"}
        </h3>
        <p className="mt-1.5 text-xs text-zinc-400">
          atau <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-4 group-hover:text-cyan-300">klik untuk menelusuri penyimpanan Anda</span>
        </p>

        {/* Glowing Neon Format Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <FileCheck className="h-3.5 w-3.5 text-rose-400" /> PDF (.pdf)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel (.xlsx, .csv)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <FileText className="h-3.5 w-3.5 text-cyan-400" /> Word (.docx)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <FileType className="h-3.5 w-3.5 text-amber-400" /> TXT, MD, JSON, HTML
          </span>
        </div>
      </div>

      {/* 1-Click Interactive Demo Bento Cards */}
      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>Coba Cepat Berkas Contoh (1-Klik)</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Direct Instant Workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sample PDF */}
          <button
            type="button"
            onClick={() => loadSample("pdf")}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-rose-500/40 hover:bg-rose-500/[0.04] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <FileCheck className="h-5 w-5" />
              </span>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  Contoh PDF Laporan
                </p>
                <p className="text-[11px] text-zinc-400">Edit &amp; Ke Excel</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Sample Excel */}
          <button
            type="button"
            onClick={() => loadSample("xlsx")}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  Contoh Excel Gaji
                </p>
                <p className="text-[11px] text-zinc-400">Edit Sel &amp; Ke PDF</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Sample Word */}
          <button
            type="button"
            onClick={() => loadSample("docx")}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-cyan-500/40 hover:bg-cyan-500/[0.04] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <FileText className="h-5 w-5" />
              </span>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  Contoh Word Kontrak
                </p>
                <p className="text-[11px] text-zinc-400">Translate Kata &amp; Doc</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Holographic Bento Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-xl shadow-xs hover:border-white/15 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Zap className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Dual Mode Fleksibel
          </h4>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Pilih bebas antara <b>Hanya Ingin Mengedit</b> (simpan format asli) atau <b>Edit lalu Konversi</b> ke format dokumen baru.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-xl shadow-xs hover:border-white/15 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Neural AI Translation
          </h4>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Sorot kata tertentu untuk terjemah instan di tempat, atau klik satu tombol untuk menerjemahkan seluruh halaman dokumen secara utuh.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-xl shadow-xs hover:border-white/15 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            100% Client-Side Privacy
          </h4>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Dokumen Anda diproses langsung di mesin WebAssembly browser Anda tanpa diunggah ke pihak ketiga yang tidak berwenang.
          </p>
        </div>
      </div>
    </div>
  );
};
