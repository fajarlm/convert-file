"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  ArrowRight,
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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Title & Introduction */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-zinc-900 leading-snug">
          Edit berkas, terjemahkan bahasa, <br className="hidden sm:inline" />
          dan konversi format tanpa batasan.
        </h1>
        <p className="mt-3 text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
          Penyunting dokumen dan spreadsheet di browser. Bekerja fleksibel: simpan langsung dalam format asli atau ekspor ke format baru.
        </p>
      </div>

      {/* Minimalist Drag & Drop Surface */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-2xl border transition-all duration-200 p-12 text-center ${
          isDragging
            ? "border-zinc-900 bg-zinc-50/80 scale-[1.005]"
            : "border-zinc-200/90 bg-white hover:border-zinc-400 hover:bg-zinc-50/40 shadow-xs"
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

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 group-hover:text-zinc-900 group-hover:bg-zinc-200/60 transition-colors mb-4">
          <UploadCloud className="h-5 w-5 stroke-[1.75]" />
        </div>

        <p className="text-sm font-medium text-zinc-900">
          {isLoading ? "Sedang memproses dokumen..." : "Tarik berkas ke sini atau klik untuk memilih"}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Mendukung PDF, Word (.docx), Excel (.xlsx, .csv), TXT, Markdown, HTML, JSON
        </p>

        {/* Minimal format list */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <span className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono">PDF</span>
          <span className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono">DOCX</span>
          <span className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono">XLSX</span>
          <span className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono">CSV</span>
          <span className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono">TXT</span>
        </div>
      </div>

      {/* Minimal Preset Samples (1-Click) */}
      <div className="mt-10 pt-8 border-t border-zinc-100">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
          <span>Atau coba dengan contoh dokumen:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => loadSample("pdf")}
            className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3.5 py-3 text-left hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer group"
          >
            <div>
              <p className="text-xs font-medium text-zinc-900">Laporan Keuangan</p>
              <p className="text-[11px] text-zinc-400">PDF • Siap konversi ke Excel</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-700 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => loadSample("xlsx")}
            className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3.5 py-3 text-left hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer group"
          >
            <div>
              <p className="text-xs font-medium text-zinc-900">Data Gaji &amp; Bonus</p>
              <p className="text-[11px] text-zinc-400">Excel • Siap cetak ke PDF</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-700 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => loadSample("docx")}
            className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3.5 py-3 text-left hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer group"
          >
            <div>
              <p className="text-xs font-medium text-zinc-900">Surat Perjanjian</p>
              <p className="text-[11px] text-zinc-400">Word • Terjemah per-kata</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-700 transition-colors" />
          </button>
        </div>
      </div>

      {/* Editorial Value Highlights */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-zinc-100 pt-8">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            01 / Fleksibel
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
            Pilih antara <b>Hanya Mengedit</b> (simpan format asli) atau <b>Edit lalu Konversi</b> ke format baru.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            02 / Terjemahan Selektif
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
            Sorot kata tertentu untuk menerjemahkan secara instan, atau terjemahkan seluruh lembar dokumen dalam satu klik.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            03 / Privasi &amp; Cepat
          </h4>
          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
            Pemrosesan berjalan di browser klien dan serverless edge, menjaga kerahasiaan berkas Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
