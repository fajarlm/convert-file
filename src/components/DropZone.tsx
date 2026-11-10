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
  Shield,
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

  // Preset demo samples
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Editor & Converter All-in-One + AI Translation</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          Edit, Terjemahkan & Konversi{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
            Semua Format Berkas
          </span>
        </h1>
        <p className="mt-4 text-base text-zinc-600 sm:text-lg dark:text-zinc-400 max-w-2xl mx-auto">
          Unggah PDF, Excel, Word, atau teks. Edit isinya langsung di browser, ubah bahasa kata tertentu atau seluruh dokumen, lalu simpan dalam format asli atau konversi ke format lain.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 shadow-sm ${
          isDragging
            ? "border-indigo-600 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/30 scale-[1.01]"
            : "border-zinc-300 bg-white hover:border-indigo-400 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
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

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-inner mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {isLoading ? "Sedang memproses berkas..." : "Tarik & Lepaskan berkas ke sini"}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          atau klik untuk memilih dari komputer Anda
        </p>

        {/* Supported Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-400">
            <FileCheck className="h-3.5 w-3.5" /> PDF (.pdf)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-400">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel (.xlsx, .csv)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-400">
            <FileText className="h-3.5 w-3.5" /> Word (.docx)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            <FileType className="h-3.5 w-3.5" /> TXT, MD, JSON, HTML
          </span>
        </div>
      </div>

      {/* 1-Click Interactive Demo Samples */}
      <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Coba Langsung dengan Berkas Contoh (1-Klik)</span>
          </div>
          <span className="text-xs text-zinc-400">Tanpa perlu cari berkas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => loadSample("pdf")}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-red-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900 transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <FileCheck className="h-4 w-4" />
              </span>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  Contoh PDF Laporan
                </p>
                <p className="text-[11px] text-zinc-500">Edit & Konversi ke Excel</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => loadSample("xlsx")}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-emerald-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900 transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  Contoh Excel Gaji
                </p>
                <p className="text-[11px] text-zinc-500">Edit Sel & Cetak ke PDF</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => loadSample("docx")}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-blue-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900 transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </span>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  Contoh Dokumen Word
                </p>
                <p className="text-[11px] text-zinc-500">Terjemah Bahasa & Simpan</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Feature Value Props */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
            <Zap className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Dual Mode Fleksibel
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Pilih bebas antara <b>Hanya Ingin Mengedit</b> (simpan ke ekstensi asli) atau <b>Edit lalu Konversi</b> ke format dokumen lain.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 mb-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Granular & Full AI Translate
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Sorot kata tertentu untuk menerjemahkan secara instan di tempat, atau klik satu tombol untuk menerjemahkan seluruh lembar dokumen.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
            <Shield className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            100% Client & Vercel Ready
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Pemrosesan cepat langsung di browser dan serverless route yang ringan, siap langsung dideploy ke hosting Vercel.
          </p>
        </div>
      </div>
    </div>
  );
};
