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
      {/* Hero Badge & Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-xl border-3 border-black bg-[#FFE600] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000] rotate-[-1deg] mb-5">
          <Sparkles className="h-4 w-4" />
          <span>Editor & Converter All-In-One + AI Translate</span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-black sm:text-6xl uppercase leading-tight">
          EDIT, TERJEMAHKAN &amp; <br className="hidden sm:inline" />
          <span className="inline-block bg-[#38BDF8] px-3 py-0.5 border-3 border-black shadow-[5px_5px_0px_#000] rotate-[1deg] text-black my-1">
            KONVERSI FILE
          </span>{" "}
          APA PUN!
        </h1>

        <p className="mt-5 text-base sm:text-lg font-bold text-zinc-700 max-w-2xl mx-auto">
          Bisa hanya <span className="bg-[#A7F3D0] px-1.5 py-0.5 border border-black rounded">edit saja</span> tanpa ubah format, atau <span className="bg-[#FDE047] px-1.5 py-0.5 border border-black rounded">edit lalu konversi</span> (misal PDF $\rightarrow$ Excel). Plus fitur ganti bahasa per-kata atau seluruh file!
        </p>
      </div>

      {/* Main Neo-Brutalist Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-4 border-black p-10 text-center transition-all duration-150 ${
          isDragging
            ? "bg-[#FEF08A] shadow-[12px_12px_0px_#000] scale-[1.01]"
            : "bg-white shadow-[8px_8px_0px_#000] hover:shadow-[12px_12px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
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

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-black bg-[#FFDE59] text-black shadow-[4px_4px_0px_#000] mb-5">
          <UploadCloud className="h-10 w-10 stroke-[2.5]" />
        </div>

        <h3 className="text-2xl font-black text-black uppercase tracking-tight">
          {isLoading ? "SEDANG MEMPROSES BERKAS..." : "TARIK & LEPASKAN BERKAS KE SINI"}
        </h3>
        <p className="mt-2 text-sm font-bold text-zinc-600">
          atau <span className="underline decoration-black decoration-2">klik untuk memilih berkas dari komputer</span>
        </p>

        {/* Format Badges Sticker Style */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FB7185] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <FileCheck className="h-4 w-4" /> PDF (.pdf)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#4ADE80] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx, .csv)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#38BDF8] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <FileText className="h-4 w-4" /> Word (.docx)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FBBF24] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <FileType className="h-4 w-4" /> TXT, MD, JSON, HTML
          </span>
        </div>
      </div>

      {/* 1-Click Interactive Demo Buttons */}
      <div className="mt-10 rounded-2xl border-4 border-black bg-[#FFFBEB] p-6 shadow-[6px_6px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-black">
            <Zap className="h-5 w-5 fill-amber-400 stroke-[2.5]" />
            <span>Coba Cepat Berkas Contoh (1-Klik)</span>
          </div>
          <span className="text-xs font-bold text-zinc-600">
            *Langsung buka di editor tanpa upload
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sample PDF */}
          <button
            type="button"
            onClick={() => loadSample("pdf")}
            className="flex items-center justify-between rounded-xl border-3 border-black bg-white p-4 text-left shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#FB7185] text-black shadow-[2px_2px_0px_#000]">
                <FileCheck className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div className="truncate">
                <p className="text-xs font-black text-black uppercase truncate">
                  Contoh PDF Laporan
                </p>
                <p className="text-[11px] font-bold text-zinc-500">Edit &amp; Ke Excel</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Sample Excel */}
          <button
            type="button"
            onClick={() => loadSample("xlsx")}
            className="flex items-center justify-between rounded-xl border-3 border-black bg-white p-4 text-left shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#4ADE80] text-black shadow-[2px_2px_0px_#000]">
                <FileSpreadsheet className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div className="truncate">
                <p className="text-xs font-black text-black uppercase truncate">
                  Contoh Excel Gaji
                </p>
                <p className="text-[11px] font-bold text-zinc-500">Edit Sel &amp; Ke PDF</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Sample Word */}
          <button
            type="button"
            onClick={() => loadSample("docx")}
            className="flex items-center justify-between rounded-xl border-3 border-black bg-white p-4 text-left shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#38BDF8] text-black shadow-[2px_2px_0px_#000]">
                <FileText className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div className="truncate">
                <p className="text-xs font-black text-black uppercase truncate">
                  Contoh Word Surat
                </p>
                <p className="text-[11px] font-bold text-zinc-500">Translate Kata &amp; Doc</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="rounded-2xl border-3 border-black bg-[#EDE9FE] p-5 shadow-[5px_5px_0px_#000]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] mb-3">
            <Zap className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h4 className="text-base font-black text-black uppercase">
            Dual Mode Fleksibel
          </h4>
          <p className="mt-2 text-xs font-bold text-zinc-700 leading-relaxed">
            Pilih bebas antara <b>Hanya Ingin Mengedit</b> (simpan ke ekstensi asli) atau <b>Edit lalu Konversi</b> ke format dokumen lain.
          </p>
        </div>

        <div className="rounded-2xl border-3 border-black bg-[#CFFAFE] p-5 shadow-[5px_5px_0px_#000]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] mb-3">
            <Sparkles className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h4 className="text-base font-black text-black uppercase">
            AI Translate Per-Kata &amp; Full
          </h4>
          <p className="mt-2 text-xs font-bold text-zinc-700 leading-relaxed">
            Sorot kata tertentu untuk menerjemahkan secara instan di tempat, atau klik satu tombol untuk menerjemahkan seluruh lembar dokumen.
          </p>
        </div>

        <div className="rounded-2xl border-3 border-black bg-[#DCFCE7] p-5 shadow-[5px_5px_0px_#000]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] mb-3">
            <Shield className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h4 className="text-base font-black text-black uppercase">
            100% Client &amp; Vercel Ready
          </h4>
          <p className="mt-2 text-xs font-bold text-zinc-700 leading-relaxed">
            Pemrosesan cepat langsung di browser dan serverless route yang ringan, siap langsung dideploy ke hosting Vercel.
          </p>
        </div>
      </div>
    </div>
  );
};
