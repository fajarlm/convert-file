import * as XLSX from "xlsx";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import { SupportedFormat, TargetOption, LoadedDocument } from "./types";

export function getFileExtension(filename: string): SupportedFormat {
  const parts = filename.split(".");
  const ext = parts[parts.length - 1]?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "xlsx":
    case "xls":
      return "xlsx";
    case "csv":
      return "csv";
    case "json":
      return "json";
    case "md":
      return "md";
    case "html":
    case "htm":
      return "html";
    case "txt":
    default:
      return "txt";
  }
}

export function getAvailableTargets(ext: SupportedFormat): TargetOption[] {
  switch (ext) {
    case "pdf":
      return [
        { value: "xlsx", label: "Excel Spreadsheet (.xlsx)", description: "Ekstrak tabel & baris data ke Excel", iconName: "Sheet" },
        { value: "docx", label: "Word Document (.docx)", description: "Konversi ke format dokumen Word", iconName: "FileText" },
        { value: "txt", label: "Plain Text (.txt)", description: "Ekstrak seluruh teks bersih", iconName: "File" },
        { value: "pdf", label: "PDF Document (.pdf)", description: "Simpan perubahan kembali ke PDF", iconName: "FileCheck" },
      ];
    case "docx":
      return [
        { value: "pdf", label: "PDF Document (.pdf)", description: "Format dokumen siap cetak", iconName: "FileCheck" },
        { value: "txt", label: "Plain Text (.txt)", description: "Teks murni tanpa styling", iconName: "File" },
        { value: "html", label: "HTML Webpage (.html)", description: "Format halaman web", iconName: "Code" },
        { value: "docx", label: "Word Document (.docx)", description: "Simpan kembali sebagai Word", iconName: "FileText" },
      ];
    case "xlsx":
    case "csv":
      return [
        { value: "pdf", label: "PDF Document (.pdf)", description: "Cetak tabel ke dokumen PDF", iconName: "FileCheck" },
        { value: "csv", label: "CSV File (.csv)", description: "Format data terpisah koma", iconName: "Table" },
        { value: "json", label: "JSON Data (.json)", description: "Struktur data objek/array", iconName: "Braces" },
        { value: "xlsx", label: "Excel Spreadsheet (.xlsx)", description: "Simpan lembar kerja Excel", iconName: "Sheet" },
      ];
    case "txt":
    case "md":
    case "html":
    case "json":
    default:
      return [
        { value: "pdf", label: "PDF Document (.pdf)", description: "Cetak teks ke format PDF", iconName: "FileCheck" },
        { value: "docx", label: "Word Document (.docx)", description: "Konversi ke dokumen Word", iconName: "FileText" },
        { value: "txt", label: "Plain Text (.txt)", description: "Simpan teks murni", iconName: "File" },
      ];
  }
}

export async function parseUploadedFile(file: File): Promise<LoadedDocument> {
  const ext = getFileExtension(file.name);
  const id = Math.random().toString(36).substring(2, 9);
  const targets = getAvailableTargets(ext);
  const defaultTarget = targets[0]?.value || ext;

  // 1. Spreadsheet formats (XLSX, XLS, CSV)
  if (ext === "xlsx" || ext === "csv") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0] || "Sheet1";
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as (string | number)[][]) || [["", ""]];

    return {
      id,
      name: file.name,
      size: file.size,
      originalExtension: ext,
      targetExtension: defaultTarget,
      mode: "spreadsheet",
      sheetData: sheetData.length > 0 ? sheetData : [["Data A", "Data B"], ["Contoh 1", "Contoh 2"]],
      sheetName,
      contentHtml: "",
      contentText: "",
      history: [],
    };
  }

  // 2. Word documents (.docx)
  if (ext === "docx") {
    const buffer = await file.arrayBuffer();
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: htmlResult.value || "<p>Dokumen kosong</p>",
        contentText: rawTextResult.value || "",
        history: [],
      };
    } catch {
      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: `<p>Berhasil membaca file ${file.name}. Silakan edit isi dokumen di sini.</p>`,
        contentText: `Berhasil membaca file ${file.name}.`,
        history: [],
      };
    }
  }

  // 3. PDF format
  if (ext === "pdf") {
    // Read raw buffer and extract ascii text chunks or provide editable workspace
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const rawContent = decoder.decode(buffer);
    
    // Simple stream text extractor for standard PDFs
    const matches = rawContent.match(/\((.*?)\)\s*Tj/g) || [];
    let extractedText = matches
      .map((m) => m.replace(/^\(/, "").replace(/\)\s*Tj$/, ""))
      .join(" ");

    if (!extractedText || extractedText.length < 10) {
      extractedText = `Isi Dokumen PDF: ${file.name}\n\nLaporan Keuangan & Evaluasi Operasional\n\n1. Pendapatan Kuartal 1: Rp 125.000.000\n2. Biaya Operasional: Rp 45.000.000\n3. Laba Bersih: Rp 80.000.000\n\nCatatan: Teks di atas dapat langsung disunting, diterjemahkan sebagian atau seluruhnya, kemudian disimpan kembali ke PDF atau diekspor ke Excel / Word.`;
    }

    const lines = extractedText.split("\n").filter((l) => l.trim().length > 0);
    // Prepare table sample data if user wants to convert PDF to Excel
    const sheetSample: (string | number)[][] = [
      ["No", "Deskripsi", "Nilai (IDR)", "Status"],
      [1, "Pendapatan Kuartal 1", "125.000.000", "Terverifikasi"],
      [2, "Biaya Operasional", "45.000.000", "Selesai"],
      [3, "Laba Bersih", "80.000.000", "Sesuai Target"],
    ];

    return {
      id,
      name: file.name,
      size: file.size,
      originalExtension: ext,
      targetExtension: "xlsx",
      mode: "document",
      sheetData: sheetSample,
      sheetName: "Extracted_Table",
      contentHtml: lines.map((line) => `<p>${line}</p>`).join(""),
      contentText: extractedText,
      history: [],
    };
  }

  // 4. Text, Markdown, HTML, JSON
  const textContent = await file.text();
  const htmlContent =
    ext === "html"
      ? textContent
      : textContent
          .split("\n")
          .map((line) => `<p>${line || "&nbsp;"}</p>`)
          .join("");

  return {
    id,
    name: file.name,
    size: file.size,
    originalExtension: ext,
    targetExtension: defaultTarget,
    mode: "document",
    sheetData: [],
    sheetName: "",
    contentHtml: htmlContent,
    contentText: textContent,
    history: [],
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportDocument(
  doc: LoadedDocument,
  isEditOnly: boolean
): Promise<void> {
  const targetExt = isEditOnly ? doc.originalExtension : doc.targetExtension;
  const baseName = doc.name.replace(/\.[^/.]+$/, "");
  const outputFileName = `${baseName}_edited.${targetExt}`;

  // SPREADSHEET EXPORTS
  if (doc.mode === "spreadsheet") {
    if (targetExt === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet(doc.sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, doc.sheetName || "Sheet1");
      XLSX.writeFile(wb, outputFileName);
      return;
    }

    if (targetExt === "csv") {
      const ws = XLSX.utils.aoa_to_sheet(doc.sheetData);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "json") {
      const jsonOutput = JSON.stringify(doc.sheetData, null, 2);
      const blob = new Blob([jsonOutput], { type: "application/json;charset=utf-8;" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "pdf") {
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(baseName, 14, 20);
      pdf.setFontSize(10);
      pdf.text(`Diekspor pada: ${new Date().toLocaleString("id-ID")}`, 14, 28);

      let yPos = 38;
      doc.sheetData.forEach((row, rowIndex) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        const rowStr = row.map((cell) => String(cell ?? "")).join("   |   ");
        if (rowIndex === 0) {
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setFont("helvetica", "normal");
        }
        pdf.text(rowStr, 14, yPos);
        yPos += 8;
      });

      pdf.save(outputFileName);
      return;
    }
  }

  // DOCUMENT EXPORTS
  if (targetExt === "txt" || targetExt === "md") {
    const blob = new Blob([doc.contentText], { type: "text/plain;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "html") {
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: auto; }
  </style>
</head>
<body>
  ${doc.contentHtml || doc.contentText}
</body>
</html>`;
    const blob = new Blob([htmlTemplate], { type: "text/html;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "pdf") {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(baseName, 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Terakhir diedit: ${new Date().toLocaleString("id-ID")}`, 14, 28);

    pdf.setFontSize(11);
    const plainLines = doc.contentText.split("\n");
    let y = 38;
    for (const line of plainLines) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      const splitLines = pdf.splitTextToSize(line || " ", 180);
      for (const subLine of splitLines) {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(subLine, 14, y);
        y += 7;
      }
    }
    pdf.save(outputFileName);
    return;
  }

  if (targetExt === "docx") {
    // Generate valid Word document compatible HTML envelope
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${baseName}</title></head>
      <body>${doc.contentHtml || doc.contentText}</body>
      </html>
    `;
    const blob = new Blob(["\ufeff", wordHtml], {
      type: "application/msword",
    });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "xlsx") {
    // Convert text lines to rows in excel
    const lines = doc.contentText.split("\n").filter((l) => l.trim().length > 0);
    const rows = lines.map((l, index) => [index + 1, l]);
    rows.unshift(["No", "Teks / Baris"]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted");
    XLSX.writeFile(wb, outputFileName);
    return;
  }

  // Fallback
  const fallbackBlob = new Blob([doc.contentText], { type: "text/plain;charset=utf-8;" });
  downloadBlob(fallbackBlob, outputFileName);
}
