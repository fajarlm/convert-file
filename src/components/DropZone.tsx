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
} from "lucide-react";
import { LoadedDocument } from "@/lib/types";
import { parseUploadedFile } from "@/lib/converters";
import { useAppTheme } from "@/context/ThemeContext";

interface DropZoneProps {
  onDocumentLoaded: (doc: LoadedDocument) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDocumentLoaded }) => {
  const { theme } = useAppTheme();
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
      const pdfHtml = `
        <h2>LAPORAN EVALUASI &amp; PENJUALAN KUARTAL III</h2>
        <p><b>PT Digital Nusantara Perkasa</b> • <i>Tanggal: 11 November 2026</i></p>
        <p><b>Ringkasan Eksekutif:</b> Kinerja penjualan kuartal ini mencatatkan pertumbuhan signifikan sebesar <b>+24%</b> dibandingkan kuartal sebelumnya.</p>
        <table border="1" style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <thead>
            <tr style="background:#f4f4f5; font-weight:bold;">
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">No</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Metrik Keuangan</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Nilai (IDR)</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Pertumbuhan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">1</td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Total Pendapatan Operasional</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>450.000.000</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><i>+24%</i></td>
            </tr>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">2</td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Beban Pokok Penjualan</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>180.000.000</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><i>+5%</i></td>
            </tr>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">3</td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Laba Bersih Operasional</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>270.000.000</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><i>+38%</i></td>
            </tr>
          </tbody>
        </table>
        <p><b>Rekomendasi Strategis:</b></p>
        <ul>
          <li>Mengoptimalkan saluran pemasaran digital untuk meningkatkan konversi pengguna baru.</li>
          <li>Mempertahankan margin laba bersih di atas 20% pada kuartal mendatang.</li>
        </ul>
      `;

      const sampleText = `LAPORAN EVALUASI & PENJUALAN PERUSAHAAN KUARTAL III\n\nPT Digital Nusantara Perkasa\nTanggal: 11 November 2026\n\nRingkasan Eksekutif:\nKinerja penjualan kuartal ini mencatatkan pertumbuhan signifikan sebesar 24% dibandingkan kuartal sebelumnya.\n\nRincian Metrik:\n1. Total Pendapatan Operasional: Rp 450.000.000\n2. Beban Pokok Penjualan: Rp 180.000.000\n3. Laba Bersih Operasional: Rp 270.000.000`;

      const doc: LoadedDocument = {
        id: "sample-pdf",
        name: "Laporan_Penjualan_Q3.pdf",
        size: 142000,
        originalExtension: "pdf",
        targetExtension: "docx",
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: pdfHtml,
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
      const docHtml = `
        <h2>PERJANJIAN KERJASAMA PENGEMBANGAN TEKNOLOGI</h2>
        <p><b>Nomor:</b> 089/PKS/DN/XI/2026</p>
        <p>Pada hari ini, telah disepakati perjanjian kerjasama antara <b>PIHAK PERTAMA</b> (<i>PT Inovasi Solusi Digital</i>) dan <b>PIHAK KEDUA</b> (<i>Mitra Rekayasa Teknologi</i>).</p>
        
        <h3><u>Rincian Komponen dan Spesifikasi Proyek</u></h3>
        <table border="1" style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <thead>
            <tr style="background:#f4f4f5; font-weight:bold;">
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">No</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Modul Sistem</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Spesifikasi Format</th>
              <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Status Pengerjaan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">1</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>Visual Rich Editor &amp; Tables</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><i>Mempertahankan tabel, tebal, miring, judul</i></td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Terverifikasi</td>
            </tr>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">2</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>Multi-Format Converter</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Konversi silang DOCX, PDF, Excel, HTML</td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Selesai</td>
            </tr>
            <tr>
              <td style="border:1px solid #71717a; padding:8px 12px;">3</td>
              <td style="border:1px solid #71717a; padding:8px 12px;"><b>Neural Content Translator</b></td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Terjemah kata dan dokumen penuh</td>
              <td style="border:1px solid #71717a; padding:8px 12px;">Aktif</td>
            </tr>
          </tbody>
        </table>
        
        <p><b>Pasal 1: Ruang Lingkup Pekerjaan</b></p>
        <p>PIHAK PERTAMA menunjuk PIHAK KEDUA untuk membangun sistem otomatisasi konversi dokumen, penyuntingan langsung di browser, dan penerjemahan multi-bahasa berbasis AI tanpa merusak format berkas asli.</p>
        
        <p><b>Pasal 2: Kerahasiaan Data &amp; Legalitas</b></p>
        <p>Seluruh proses pengolahan dokumen dilakukan dengan standar keamanan tinggi tanpa membocorkan isi berkas kepada pihak ketiga.</p>
      `;

      const plainText = `PERJANJIAN KERJASAMA PENGEMBANGAN TEKNOLOGI\nNomor: 089/PKS/DN/XI/2026\n\nPada hari ini, telah disepakati perjanjian kerjasama antara PIHAK PERTAMA (PT Inovasi Solusi Digital) dan PIHAK KEDUA (Mitra Rekayasa Teknologi).\n\nModul Sistem:\n1. Visual Rich Editor & Tables - Mempertahankan tabel, tebal, miring, judul\n2. Multi-Format Converter - Konversi silang DOCX, PDF, Excel, HTML\n3. Neural Content Translator - Terjemah kata dan dokumen penuh`;

      const doc: LoadedDocument = {
        id: "sample-docx",
        name: "Perjanjian_Kerjasama_Vendor.docx",
        size: 98000,
        originalExtension: "docx",
        targetExtension: "pdf",
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: docHtml,
        contentText: plainText,
        history: [],
      };
      onDocumentLoaded(doc);
    }
  };

  // 1. RETRO WINDOWS 98 THEME
  if (theme === "retro") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 font-mono">
        <div className="bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black p-1 shadow-2xl">
          {/* Window Title Bar */}
          <div className="bg-[#000080] text-white px-3 py-1 flex items-center justify-between text-xs font-bold mb-3">
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>C:\DOCMORPH\FILE_CONVERTER.EXE</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="h-4 w-4 bg-[#c0c0c0] text-black font-bold flex items-center justify-center border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-[10px]">_</button>
              <button className="h-4 w-4 bg-[#c0c0c0] text-black font-bold flex items-center justify-center border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-[10px]">X</button>
            </div>
          </div>

          <div className="p-4 sm:p-6 text-black">
            <div className="border border-zinc-600 p-2 mb-6 bg-[#d4d0c8]">
              <p className="text-sm font-bold uppercase">
                &gt;&gt; Omni-Format Document &amp; Spreadsheet Processor &lt;&lt;
              </p>
              <p className="text-xs text-zinc-700 mt-1">
                Edit berkas langsung di browser, ganti bahasa teks parsial/full dengan AI, lalu ekspor ke format tujuan.
              </p>
            </div>

            {/* Retro Bevel Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-t-2 border-l-2 border-t-zinc-800 border-l-zinc-800 border-b-2 border-r-2 border-b-white border-r-white bg-white p-8 text-center cursor-pointer hover:bg-zinc-100 transition-colors"
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
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm font-bold uppercase">
                {isLoading ? "Sedang memproses..." : "Klik atau Tarik Berkas ke Sini"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                [ PDF | DOCX | XLSX | CSV | TXT | MD | JSON ]
              </p>
            </div>

            {/* Retro 1-Click Samples */}
            <div className="mt-6 border-t border-zinc-400 pt-4">
              <span className="text-xs font-bold uppercase block mb-2">
                Pilih Berkas Contoh (Direct Launch):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loadSample("pdf")}
                  className="bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black px-3 py-2 text-xs font-bold text-left active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer"
                >
                  📄 LAPORAN_Q3.PDF
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("xlsx")}
                  className="bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black px-3 py-2 text-xs font-bold text-left active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer"
                >
                  📊 DATA_GAJI.XLSX
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("docx")}
                  className="bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black px-3 py-2 text-xs font-bold text-left active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer"
                >
                  📝 PERJANJIAN.DOCX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. NEO-BRUTALISM THEME
  if (theme === "brutalist") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-xl border-3 border-black bg-[#FFE600] px-4 py-1.5 text-xs font-black uppercase text-black shadow-[4px_4px_0px_#000] rotate-[-1deg] mb-5">
            <Sparkles className="h-4 w-4" />
            <span>Editor &amp; Converter All-In-One + AI Translate</span>
          </div>
          <h1 className="text-4xl font-black text-black sm:text-6xl uppercase leading-tight">
            EDIT, TERJEMAHKAN &amp; <br />
            <span className="inline-block bg-[#38BDF8] px-3 py-0.5 border-3 border-black shadow-[5px_5px_0px_#000] rotate-[1deg] text-black my-1">
              KONVERSI FILE
            </span>{" "}
            APA PUN!
          </h1>
          <p className="mt-4 text-base font-bold text-zinc-700 max-w-2xl mx-auto">
            Bisa edit saja tanpa ubah format, atau edit lalu konversi ke ekstensi lain. Dilengkapi pengganti bahasa kata tertentu dan seluruh dokumen!
          </p>
        </div>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-4 border-black p-10 text-center transition-all ${
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
            onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
          />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-black bg-[#FFDE59] text-black shadow-[4px_4px_0px_#000] mb-4">
            <UploadCloud className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-black text-black uppercase">
            {isLoading ? "SEDANG MEMPROSES..." : "TARIK & LEPASKAN BERKAS KE SINI"}
          </h3>
          <p className="mt-2 text-xs font-bold text-zinc-600">atau klik untuk memilih dari komputer</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-lg border-2 border-black bg-[#FB7185] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#000]">PDF</span>
            <span className="rounded-lg border-2 border-black bg-[#4ADE80] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#000]">Excel</span>
            <span className="rounded-lg border-2 border-black bg-[#38BDF8] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#000]">Word</span>
            <span className="rounded-lg border-2 border-black bg-[#FBBF24] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#000]">Text</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-4 border-black bg-[#FFFBEB] p-5 shadow-[6px_6px_0px_#000]">
          <span className="text-xs font-black uppercase block mb-3">Coba Cepat Berkas Contoh:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => loadSample("pdf")} className="rounded-xl border-3 border-black bg-white p-3 text-left font-black text-xs shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer">
              📄 Contoh PDF Laporan
            </button>
            <button onClick={() => loadSample("xlsx")} className="rounded-xl border-3 border-black bg-white p-3 text-left font-black text-xs shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer">
              📊 Contoh Excel Gaji
            </button>
            <button onClick={() => loadSample("docx")} className="rounded-xl border-3 border-black bg-white p-3 text-left font-black text-xs shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer">
              📝 Contoh Word Surat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. PURE MINIMALIST THEME
  if (theme === "minimal") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-zinc-900 leading-snug">
            Edit berkas, terjemahkan bahasa, <br className="hidden sm:inline" />
            dan konversi format tanpa batasan.
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
            Penyunting dokumen dan spreadsheet di browser. Bekerja fleksibel: simpan langsung dalam format asli atau ekspor ke format baru.
          </p>
        </div>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-400 p-12 text-center shadow-xs transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.html"
            onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
          />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 mb-4">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-900">
            {isLoading ? "Sedang memproses..." : "Tarik berkas ke sini atau klik untuk memilih"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">PDF, Word, Excel, CSV, TXT, Markdown, JSON</p>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100">
          <span className="text-xs text-zinc-400 block mb-3">Atau coba dengan contoh dokumen:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => loadSample("pdf")} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-left text-xs font-medium text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer">
              Laporan Keuangan (PDF)
            </button>
            <button onClick={() => loadSample("xlsx")} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-left text-xs font-medium text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer">
              Data Gaji (Excel)
            </button>
            <button onClick={() => loadSample("docx")} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-left text-xs font-medium text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer">
              Surat Perjanjian (Word)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. DEFAULT: CYBER / DARK AURORA GLASS
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-4xl bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/15 blur-3xl rounded-full" />

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
          Penyuntingan berkas tanpa upload server. Sunting langsung di browser, ubah bahasa kata tertentu via AI, lalu simpan dalam format asli atau konversi ke format lain.
        </p>
      </div>

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
          onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
        />

        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-white/10 text-cyan-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-5 group-hover:scale-105 transition-all">
          <UploadCloud className="h-9 w-9 stroke-[1.8]" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {isLoading ? "Sedang memproses berkas..." : "Tarik & Lepaskan Berkas ke Sini"}
        </h3>
        <p className="mt-1.5 text-xs text-zinc-400">
          atau <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-4">klik untuk memilih dari komputer</span>
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
            <FileCheck className="h-3.5 w-3.5" /> PDF (.pdf)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel (.xlsx, .csv)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <FileText className="h-3.5 w-3.5" /> Word (.docx)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <FileType className="h-3.5 w-3.5" /> TXT, MD, JSON
          </span>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Coba Cepat Berkas Contoh:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => loadSample("pdf")} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-rose-500/40 transition-all cursor-pointer">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">Contoh PDF Laporan</p>
              <p className="text-[11px] text-zinc-400">Edit &amp; Ke Excel</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </button>
          <button onClick={() => loadSample("xlsx")} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-emerald-500/40 transition-all cursor-pointer">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">Contoh Excel Gaji</p>
              <p className="text-[11px] text-zinc-400">Edit Sel &amp; Ke PDF</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </button>
          <button onClick={() => loadSample("docx")} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-cyan-500/40 transition-all cursor-pointer">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">Contoh Word Kontrak</p>
              <p className="text-[11px] text-zinc-400">Translate Kata &amp; Doc</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
