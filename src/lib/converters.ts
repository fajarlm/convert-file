import * as XLSX from "xlsx";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
        { value: "docx", label: "Word Document (.docx)", description: "Konversi ke format dokumen Word", iconName: "FileText" },
        { value: "pdf", label: "PDF Document (.pdf)", description: "Simpan perubahan kembali ke PDF", iconName: "FileCheck" },
        { value: "xlsx", label: "Excel Spreadsheet (.xlsx)", description: "Ekstrak tabel & baris data ke Excel", iconName: "Sheet" },
        { value: "html", label: "HTML Webpage (.html)", description: "Format dokumen web", iconName: "Code" },
        { value: "txt", label: "Plain Text (.txt)", description: "Ekstrak seluruh teks bersih", iconName: "File" },
      ];
    case "docx":
      return [
        { value: "pdf", label: "PDF Document (.pdf)", description: "Format dokumen siap cetak (Tabel & Format Terjaga)", iconName: "FileCheck" },
        { value: "html", label: "HTML Webpage (.html)", description: "Format halaman web dengan tabel utuh", iconName: "Code" },
        { value: "xlsx", label: "Excel Spreadsheet (.xlsx)", description: "Ekstrak tabel dokumen ke Excel", iconName: "Sheet" },
        { value: "txt", label: "Plain Text (.txt)", description: "Teks murni tanpa styling", iconName: "File" },
        { value: "docx", label: "Word Document (.docx)", description: "Simpan kembali sebagai Word", iconName: "FileText" },
      ];
    case "xlsx":
    case "csv":
      return [
        { value: "pdf", label: "PDF Document (.pdf)", description: "Cetak tabel ke dokumen PDF rapi", iconName: "FileCheck" },
        { value: "csv", label: "CSV File (.csv)", description: "Format data terpisah koma", iconName: "Table" },
        { value: "json", label: "JSON Data (.json)", description: "Struktur data objek/array", iconName: "Braces" },
        { value: "html", label: "HTML Table (.html)", description: "Tabel format web siap semat", iconName: "Code" },
        { value: "docx", label: "Word Document (.docx)", description: "Format tabel ke dokumen Word", iconName: "FileText" },
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
        { value: "xlsx", label: "Excel Spreadsheet (.xlsx)", description: "Baris teks ke tabel Excel", iconName: "Sheet" },
        { value: "html", label: "HTML Webpage (.html)", description: "Halaman web berformat", iconName: "Code" },
        { value: "txt", label: "Plain Text (.txt)", description: "Simpan teks murni", iconName: "File" },
      ];
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function extractTextFromPdf(
  buffer: ArrayBuffer
): Promise<{ text: string; html: string }> {
  // Use pdfjs-dist legacy build for universal compatibility
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const allLines: string[] = [];
  const htmlSections: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y coordinate with a tolerance bucket of 3px
    const linesByY = new Map<number, Array<{ str: string; x: number }>>();

    for (const rawItem of textContent.items) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as { str?: string; transform?: number[] };
      if (!item.str) continue;

      const transform = item.transform;
      const x = transform ? transform[4] : 0;
      const y = transform ? Math.round(transform[5] / 3) * 3 : 0;

      if (!linesByY.has(y)) {
        linesByY.set(y, []);
      }
      linesByY.get(y)!.push({ str: item.str, x });
    }

    // Sort lines descending by Y (top of page to bottom of page)
    const sortedYs = Array.from(linesByY.keys()).sort((a, b) => b - a);
    const pageLines: string[] = [];

    for (const y of sortedYs) {
      const lineItems = linesByY.get(y)!;
      // Sort items horizontally within the line (left to right)
      lineItems.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map((i) => i.str).join(" ").trim();
      if (lineText) {
        pageLines.push(lineText);
      }
    }

    if (pageLines.length > 0) {
      allLines.push(...pageLines);

      const pageHtml = pageLines
        .map((line) => {
          const escaped = escapeHtml(line);
          const isHeading =
            line.length <= 45 &&
            (line === line.toUpperCase() ||
              /^(ringkasan|summary|profil|profile|pengalaman|experience|pendidikan|education|keahlian|skills|kemampuan|proyek|projects|kontak|contact|sertifikasi|certifications)/i.test(
                line.trim()
              ));
          if (isHeading) {
            return `<h3><b>${escaped}</b></h3>`;
          }
          return `<p>${escaped}</p>`;
        })
        .join("");

      if (numPages > 1) {
        htmlSections.push(
          `<div class="pdf-page" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #d1d5db;">` +
            `<div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">— Halaman ${pageNum} dari ${numPages} —</div>` +
            `${pageHtml}</div>`
        );
      } else {
        htmlSections.push(pageHtml);
      }
    }
  }

  const rawText = allLines.join("\n");
  const fullHtml =
    htmlSections.length > 0
      ? htmlSections.join("\n")
      : "<p>Tidak ditemukan teks yang dapat diekstrak dari dokumen PDF ini (dokumen mungkin berupa hasil scan gambar). Anda dapat mengetik langsung di sini.</p>";

  return {
    text: rawText || "Dokumen PDF kosong atau berbasis gambar scan.",
    html: fullHtml,
  };
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

      // Preserve rich HTML with table, bold, italic tags
      const richHtml = htmlResult.value || "<p>Dokumen kosong</p>";

      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: richHtml,
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
    const buffer = await file.arrayBuffer();
    try {
      const { text, html } = await extractTextFromPdf(buffer);

      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: html,
        contentText: text,
        history: [],
      };
    } catch (err) {
      console.error("PDF parsing error:", err);
      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: `<p>Berhasil membaca file <b>${escapeHtml(file.name)}</b>. Silakan edit atau tambahkan isi dokumen di sini.</p>`,
        contentText: `Berhasil membaca file ${file.name}.`,
        history: [],
      };
    }
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

  // SPREADSHEET MODE EXPORTS
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

    if (targetExt === "html") {
      const rowsHtml = doc.sheetData
        .map(
          (row, idx) =>
            `<tr>${row
              .map((cell) =>
                idx === 0
                  ? `<th style="border:1.5px solid #374151;padding:8px 12px;background:#f3f4f6;font-weight:bold;">${cell ?? ""}</th>`
                  : `<td style="border:1px solid #d1d5db;padding:8px 12px;">${cell ?? ""}</td>`
              )
              .join("")}</tr>`
        )
        .join("\n");
      const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:Arial,sans-serif;margin:30px;}table{border-collapse:collapse;width:100%;}</style></head><body><h2>${baseName}</h2><table>${rowsHtml}</table></body></html>`;
      const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8;" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "docx") {
      const rowsHtml = doc.sheetData
        .map(
          (row, idx) =>
            `<tr>${row
              .map((cell) =>
                idx === 0
                  ? `<th style="border:1.5pt solid #333;padding:8px 12px;background:#eee;font-weight:bold;">${cell ?? ""}</th>`
                  : `<td style="border:1pt solid #333;padding:8px 12px;">${cell ?? ""}</td>`
              )
              .join("")}</tr>`
        )
        .join("");
      const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${baseName}</title><style>body{font-family:Calibri,sans-serif;font-size:11pt;}table{border-collapse:collapse;width:100%;}</style></head><body><h2>${baseName}</h2><table border="1">${rowsHtml}</table></body></html>`;
      const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword;charset=utf-8" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "pdf") {
      // Render spreadsheet table into formatted HTML and print to PDF via html2canvas
      if (typeof window !== "undefined") {
        const rowsHtml = doc.sheetData
          .map(
            (row, idx) =>
              `<tr>${row
                .map((cell) =>
                  idx === 0
                    ? `<th style="border:1.5px solid #1f2937;padding:8px 12px;background:#f3f4f6;font-weight:bold;text-align:left;">${cell ?? ""}</th>`
                    : `<td style="border:1px solid #4b5563;padding:8px 12px;">${cell ?? ""}</td>`
                )
                .join("")}</tr>`
          )
          .join("");

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "800px";
        container.style.padding = "32px";
        container.style.background = "#ffffff";
        container.style.color = "#000000";
        container.style.fontFamily = "Calibri, Arial, sans-serif";
        container.innerHTML = `
          <div style="margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 8px;">
            <h1 style="margin: 0; font-size: 20px; color: #000;">${baseName}</h1>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">Diekspor pada: ${new Date().toLocaleString("id-ID")}</div>
          </div>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            ${rowsHtml}
          </table>
        `;
        document.body.appendChild(container);

        try {
          const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
          document.body.removeChild(container);

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          let heightLeft = pdfHeight;
          let position = 0;
          const pageHeight = pdf.internal.pageSize.getHeight();

          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;

          while (heightLeft > 0) {
            position -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(outputFileName);
          return;
        } catch {
          if (document.body.contains(container)) document.body.removeChild(container);
        }
      }

      // Basic jsPDF fallback
      const pdf = new jsPDF();
      pdf.text(baseName, 14, 20);
      pdf.save(outputFileName);
      return;
    }
  }

  // DOCUMENT MODE EXPORTS (Preserving 100% Rich Formatting, Tables, Bold, Italic)
  const currentHtml = doc.contentHtml || doc.contentText;

  if (targetExt === "docx") {
    // Generate valid Word document compatible HTML envelope with complete CSS styles
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${baseName}</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; margin: 30px; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1.5pt solid #333333; }
          th { background-color: #f3f4f6; color: #000000; font-weight: bold; border: 1pt solid #4b5563; padding: 8px 12px; text-align: left; }
          td { border: 1pt solid #6b7280; padding: 8px 12px; color: #000000; }
          b, strong { font-weight: bold; }
          i, em { font-style: italic; }
          u { text-decoration: underline; }
          s, strike { text-decoration: line-through; }
          h1 { font-size: 18pt; font-weight: bold; margin: 14pt 0 6pt 0; color: #111827; }
          h2 { font-size: 14pt; font-weight: bold; margin: 12pt 0 4pt 0; color: #1f2937; }
          h3 { font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt 0; color: #374151; }
          p { margin: 6pt 0; line-height: 1.5; }
          ul, ol { margin: 6pt 0 6pt 24pt; }
          li { margin: 3pt 0; }
        </style>
      </head>
      <body>
        ${currentHtml}
      </body>
      </html>
    `;
    const blob = new Blob(["\ufeff", wordHtml], {
      type: "application/msword;charset=utf-8",
    });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "pdf") {
    // Render visual HTML to PDF using html2canvas to preserve all tables, bold, and italic
    if (typeof window !== "undefined") {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "800px";
      container.style.padding = "32px";
      container.style.background = "#ffffff";
      container.style.color = "#000000";
      container.style.fontFamily = "Calibri, Arial, sans-serif";
      container.innerHTML = `
        <style>
          table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1.5px solid #333; }
          th { background-color: #f3f4f6; color: #000; font-weight: bold; border: 1px solid #4b5563; padding: 8px 12px; text-align: left; }
          td { border: 1px solid #6b7280; padding: 8px 12px; color: #000; }
          b, strong { font-weight: bold; }
          i, em { font-style: italic; }
          u { text-decoration: underline; }
          s, strike { text-decoration: line-through; }
          h1 { font-size: 22px; font-weight: bold; margin: 14px 0 6px 0; color: #000; }
          h2 { font-size: 18px; font-weight: bold; margin: 12px 0 6px 0; color: #000; }
          h3 { font-size: 15px; font-weight: bold; margin: 10px 0 4px 0; color: #000; }
          p { margin: 6px 0; line-height: 1.6; color: #000; }
          ul, ol { margin: 6px 0 6px 24px; color: #000; }
          li { margin: 3px 0; }
        </style>
        <div style="margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 8px;">
          <h1 style="margin: 0; font-size: 20px; color: #000;">${baseName}</h1>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">Diekspor pada: ${new Date().toLocaleString("id-ID")}</div>
        </div>
        <div>
          ${currentHtml}
        </div>
      `;
      document.body.appendChild(container);

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        document.body.removeChild(container);

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(outputFileName);
        return;
      } catch (canvasErr) {
        console.warn("PDF render fallback:", canvasErr);
        if (document.body.contains(container)) document.body.removeChild(container);
      }
    }

    // Fallback standard text PDF
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text(baseName, 14, 20);
    pdf.save(outputFileName);
    return;
  }

  if (targetExt === "html") {
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; max-width: 850px; margin: auto; color: #111; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #ccc; }
    th { background: #f4f4f5; font-weight: bold; border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    td { border: 1px solid #ccc; padding: 8px 12px; }
    b, strong { font-weight: bold; }
    i, em { font-style: italic; }
    u { text-decoration: underline; }
  </style>
</head>
<body>
  <h2>${baseName}</h2>
  ${currentHtml}
</body>
</html>`;
    const blob = new Blob([htmlTemplate], { type: "text/html;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "xlsx") {
    // If document contains table, extract table directly into Excel
    if (typeof window !== "undefined" && currentHtml.includes("<table")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentHtml;
      const tableEl = tempDiv.querySelector("table");
      if (tableEl) {
        const ws = XLSX.utils.table_to_sheet(tableEl);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tabel_Dokumen");
        XLSX.writeFile(wb, outputFileName);
        return;
      }
    }

    // Otherwise extract lines to rows
    const lines = doc.contentText.split("\n").filter((l) => l.trim().length > 0);
    const rows = lines.map((l, index) => [index + 1, l]);
    rows.unshift(["No", "Teks / Baris"]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted");
    XLSX.writeFile(wb, outputFileName);
    return;
  }

  if (targetExt === "csv") {
    const lines = doc.contentText.split("\n").filter((l) => l.trim().length > 0);
    const csvContent = lines.map((l) => `"${l.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "json") {
    const lines = doc.contentText.split("\n").filter((l) => l.trim().length > 0);
    const jsonOutput = JSON.stringify({ filename: doc.name, lines, html: currentHtml }, null, 2);
    const blob = new Blob([jsonOutput], { type: "application/json;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  // Fallback Plain Text
  const fallbackBlob = new Blob([doc.contentText], { type: "text/plain;charset=utf-8;" });
  downloadBlob(fallbackBlob, outputFileName);
}
