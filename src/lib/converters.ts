import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SupportedFormat, TargetOption, LoadedDocument } from "./types";
import { extractFromPdf } from "./pdfExtractor";
import { extractFromDocx } from "./docxExtractor";
import { extractFromSpreadsheet, exportStyledXlsx } from "./xlsxExtractor";
import { extractFromMarkupOrText } from "./markupExtractor";

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

export async function parseUploadedFile(file: File): Promise<LoadedDocument> {
  const ext = getFileExtension(file.name);
  const id = Math.random().toString(36).substring(2, 9);
  const targets = getAvailableTargets(ext);
  const defaultTarget = targets[0]?.value || ext;

  // 1. Spreadsheet formats (XLSX, XLS, CSV)
  if (ext === "xlsx" || ext === "csv") {
    const buffer = await file.arrayBuffer();
    const extracted = await extractFromSpreadsheet(buffer, ext);

    return {
      id,
      name: file.name,
      size: file.size,
      originalExtension: ext,
      targetExtension: defaultTarget,
      mode: "spreadsheet",
      sheetData: extracted.sheetData,
      sheetName: extracted.sheetName,
      sheetStyles: extracted.sheetStyles,
      sheetMerges: extracted.sheetMerges,
      sheetColWidths: extracted.sheetColWidths,
      sheetRowHeights: extracted.sheetRowHeights,
      rawBuffer: ext === "xlsx" ? buffer : undefined,
      contentHtml: "",
      contentText: "",
      history: [],
      images: extracted.images,
    };
  }

  // 2. Word documents (.docx / .doc)
  if (ext === "docx") {
    const buffer = await file.arrayBuffer();
    try {
      const { html, text, images } = await extractFromDocx(buffer);
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
        images,
      };
    } catch (err) {
      console.error("DOCX parsing error:", err);
      return {
        id,
        name: file.name,
        size: file.size,
        originalExtension: ext,
        targetExtension: defaultTarget,
        mode: "document",
        sheetData: [],
        sheetName: "",
        contentHtml: `<p>Berhasil membaca file ${escapeHtml(file.name)}. Silakan edit isi dokumen di sini.</p>`,
        contentText: `Berhasil membaca file ${file.name}.`,
        history: [],
      };
    }
  }

  // 3. PDF format
  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    try {
      const { text, html, images } = await extractFromPdf(buffer);
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
        images,
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

  // 4. HTML, Markdown, JSON, Plain Text
  const textContent = await file.text();
  const markupType = ext === "html" || ext === "md" || ext === "json" ? ext : "txt";
  const { html, text, images } = extractFromMarkupOrText(textContent, markupType);

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
    images,
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

function normalizeContactRowsForExport(html: string): string {
  if (typeof document === "undefined" || !html) return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 1. Convert any legacy flex contact rows into table format
  const flexRows = temp.querySelectorAll<HTMLElement>(
    "div[style*='display: flex'], div[style*='display:flex']"
  );
  flexRows.forEach((row) => {
    const svg = row.querySelector("svg");
    const linkOrSpan = row.querySelector("a, span");
    if (svg && linkOrSpan && row.children.length === 2 && !row.closest("table")) {
      const isHeaderOrContact =
        row.closest(".pdf-cv-header") ||
        row.closest("div[style*='min-width: 200px']") ||
        svg.getAttribute("width") === "13" ||
        svg.getAttribute("height") === "13" ||
        linkOrSpan.textContent?.includes("@") ||
        linkOrSpan.textContent?.includes("+") ||
        linkOrSpan.textContent?.toLowerCase().includes("linkedin") ||
        linkOrSpan.textContent?.toLowerCase().includes("portofolio");

      if (isHeaderOrContact) {
        svg.style.display = "block";
        svg.style.margin = "0 auto";

        const table = document.createElement("table");
        table.className = "pdf-contact-row";
        table.setAttribute(
          "style",
          "border: none !important; border-collapse: collapse !important; margin: 0 0 3px 0 !important; padding: 0 !important; width: auto !important; background: transparent !important; line-height: 1 !important;"
        );

        const tbody = document.createElement("tbody");
        tbody.setAttribute("style", "border: none !important; background: transparent !important;");

        const tr = document.createElement("tr");
        tr.setAttribute(
          "style",
          "border: none !important; background: transparent !important; height: 16px !important;"
        );

        const tdIcon = document.createElement("td");
        tdIcon.className = "pdf-contact-cell";
        tdIcon.setAttribute(
          "style",
          "border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 16px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;"
        );
        tdIcon.appendChild(svg.cloneNode(true));

        const tdText = document.createElement("td");
        tdText.className = "pdf-contact-cell";
        tdText.setAttribute(
          "style",
          "border: none !important; padding: 0 !important; vertical-align: middle !important; font-size: 12px !important; line-height: 16px !important; height: 16px !important; color: #111111 !important; background: transparent !important; white-space: nowrap !important;"
        );
        const textClone = linkOrSpan.cloneNode(true) as HTMLElement;
        textClone.style.display = "inline-block";
        textClone.style.verticalAlign = "middle";
        textClone.style.lineHeight = "16px";
        tdText.appendChild(textClone);

        tr.appendChild(tdIcon);
        tr.appendChild(tdText);
        tbody.appendChild(tr);
        table.appendChild(tbody);

        row.parentNode?.replaceChild(table, row);
      }
    }
  });

  // 2. Ensure all .pdf-contact-row tables have exact alignment styles
  const contactTables = temp.querySelectorAll<HTMLTableElement>("table.pdf-contact-row");
  contactTables.forEach((table) => {
    table.setAttribute(
      "style",
      "border: none !important; border-collapse: collapse !important; margin: 0 0 3px 0 !important; padding: 0 !important; width: auto !important; background: transparent !important; line-height: 1 !important;"
    );
    const cells = table.querySelectorAll<HTMLTableCellElement>("td");
    if (cells.length >= 2) {
      cells[0].setAttribute(
        "style",
        "border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 16px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;"
      );
      cells[1].setAttribute(
        "style",
        "border: none !important; padding: 0 !important; vertical-align: middle !important; font-size: 12px !important; line-height: 16px !important; height: 16px !important; background: transparent !important; white-space: nowrap !important;"
      );
      const linkOrSpan = cells[1].querySelector<HTMLElement>("a, span");
      if (linkOrSpan) {
        linkOrSpan.style.display = "inline-block";
        linkOrSpan.style.verticalAlign = "middle";
        linkOrSpan.style.lineHeight = "16px";
      }
    }
  });

  return temp.innerHTML;
}

const alignContactTablesOnClone = (clonedDoc: Document) => {
  const contactTables = clonedDoc.querySelectorAll<HTMLTableElement>("table.pdf-contact-row");
  contactTables.forEach((table) => {
    table.style.border = "none";
    table.style.borderCollapse = "collapse";
    table.style.width = "auto";
    table.style.margin = "0 0 3px 0";
    table.style.padding = "0";
    table.style.background = "transparent";
    const cells = table.querySelectorAll<HTMLTableCellElement>("td");
    if (cells.length >= 2) {
      cells[0].style.border = "none";
      cells[0].style.verticalAlign = "middle";
      cells[0].style.height = "16px";
      cells[0].style.lineHeight = "16px";
      cells[0].style.width = "16px";
      cells[0].style.padding = "0 8px 0 0";
      cells[0].style.textAlign = "center";
      cells[0].style.background = "transparent";
      const svg = cells[0].querySelector("svg");
      if (svg) {
        svg.style.display = "block";
        svg.style.margin = "0 auto";
      }

      cells[1].style.border = "none";
      cells[1].style.verticalAlign = "middle";
      cells[1].style.height = "16px";
      cells[1].style.lineHeight = "16px";
      cells[1].style.padding = "0";
      cells[1].style.whiteSpace = "nowrap";
      cells[1].style.background = "transparent";
      const linkOrSpan = cells[1].querySelector<HTMLElement>("a, span");
      if (linkOrSpan) {
        linkOrSpan.style.display = "inline-block";
        linkOrSpan.style.verticalAlign = "middle";
        linkOrSpan.style.lineHeight = "16px";
      }
    }
  });
};

/**
 * Convert inline SVGs to crisp high-DPI PNG <img> elements and flex horizontal rows
 * to borderless layout tables so Microsoft Word renders icons & columns identically.
 */
async function prepareHtmlForWordExport(html: string): Promise<string> {
  if (typeof document === "undefined" || !html) return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 1. Rasterize inline <svg> icons into crisp 3x PNG images for MS Word compatibility
  const svgs = Array.from(temp.querySelectorAll("svg"));
  for (const svg of svgs) {
    try {
      const clone = svg.cloneNode(true) as SVGElement;
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      const w = parseFloat(clone.getAttribute("width") || clone.style.width || "14") || 14;
      const h = parseFloat(clone.getAttribute("height") || clone.style.height || "14") || 14;
      clone.setAttribute("width", String(w));
      clone.setAttribute("height", String(h));

      const serialized = new XMLSerializer().serializeToString(clone);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

      const pngDataUrl = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const scale = 3;
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = svgDataUrl;
      });

      if (pngDataUrl) {
        const imgEl = document.createElement("img");
        imgEl.src = pngDataUrl;
        imgEl.setAttribute("width", String(Math.round(w)));
        imgEl.setAttribute("height", String(Math.round(h)));
        imgEl.setAttribute(
          "style",
          `width:${Math.round(w)}px;height:${Math.round(h)}px;display:inline-block;vertical-align:middle;`
        );
        svg.parentNode?.replaceChild(imgEl, svg);
      }
    } catch {
      // Keep original SVG if rasterization fails
    }
  }

  // 2. Convert horizontal flex containers (e.g. header, 2-col/3-col/4-col split rows) into borderless tables
  const flexContainers = Array.from(
    temp.querySelectorAll<HTMLElement>("div[style*='display: flex'], div[style*='display:flex']")
  );
  // Process innermost first
  flexContainers.reverse().forEach((flex) => {
    const dir = flex.style.flexDirection;
    if (dir === "column") return;
    const children = Array.from(flex.children) as HTMLElement[];
    if (children.length < 2 || children.length > 5) return;

    const table = document.createElement("table");
    const extraBorder = flex.style.borderBottom ? `border-bottom:${flex.style.borderBottom};` : "";
    const extraBg = flex.style.backgroundColor ? `background-color:${flex.style.backgroundColor};` : "";
    table.setAttribute(
      "style",
      `width:100%;border-collapse:collapse;border:none;${extraBorder}${extraBg}margin:${
        flex.style.margin || "0 0 6px 0"
      };`
    );
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");

    children.forEach((child, idx) => {
      const td = document.createElement("td");
      const isLast = idx === children.length - 1;
      const align =
        child.style.textAlign ||
        (flex.style.justifyContent === "space-between" && isLast && children.length >= 2
          ? "right"
          : "left");
      const wStyle = child.style.width ? `width:${child.style.width};` : "";
      td.setAttribute(
        "style",
        `border:none;padding:2px 6px 2px 0;vertical-align:top;text-align:${align};${wStyle}`
      );
      td.appendChild(child.cloneNode(true));
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
    table.appendChild(tbody);
    flex.parentNode?.replaceChild(table, flex);
  });

  return temp.innerHTML;
}

function buildStyledSpreadsheetTableHtml(doc: LoadedDocument, forWord = false): string {
  const styles = doc.sheetStyles || {};
  const merges = doc.sheetMerges || [];
  const colWidths = doc.sheetColWidths || [];
  const rows = doc.sheetData;

  const skipSet = new Set<string>();
  const spanMap = new Map<string, { colSpan: number; rowSpan: number }>();

  for (const m of merges) {
    const rowSpan = m.e.r - m.s.r + 1;
    const colSpan = m.e.c - m.s.c + 1;
    if (rowSpan > 1 || colSpan > 1) {
      spanMap.set(`${m.s.r}:${m.s.c}`, { colSpan, rowSpan });
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          if (r !== m.s.r || c !== m.s.c) skipSet.add(`${r}:${c}`);
        }
      }
    }
  }

  const hasCustomStyles = Object.keys(styles).length > 0;
  const maxCols = Math.max(...rows.map((r) => r.length), 1);

  return rows
    .map((row, rIdx) => {
      const cellsHtml = Array.from({ length: maxCols })
        .map((_, cIdx) => {
          const key = `${rIdx}:${cIdx}`;
          if (skipSet.has(key)) return "";
          const span = spanMap.get(key);
          const spanAttrs = span
            ? `${span.colSpan > 1 ? ` colspan="${span.colSpan}"` : ""}${
                span.rowSpan > 1 ? ` rowspan="${span.rowSpan}"` : ""
              }`
            : "";

          const st = styles[key];
          const val = row[cIdx] ?? "";
          const cellCss: string[] = [];

          if (hasCustomStyles && st) {
            if (st.backgroundColor) cellCss.push(`background-color:${st.backgroundColor}`);
            if (st.color) cellCss.push(`color:${st.color}`);
            if (st.fontWeight) cellCss.push(`font-weight:${st.fontWeight}`);
            if (st.fontStyle) cellCss.push(`font-style:${st.fontStyle}`);
            if (st.textDecoration) cellCss.push(`text-decoration:${st.textDecoration}`);
            if (st.fontSize) cellCss.push(`font-size:${st.fontSize}px`);
            if (st.fontFamily) cellCss.push(`font-family:${st.fontFamily}`);
            if (st.textAlign) cellCss.push(`text-align:${st.textAlign}`);
            if (st.verticalAlign) cellCss.push(`vertical-align:${st.verticalAlign}`);
            cellCss.push(`border-top:${st.borderTop || "1px solid #d1d5db"}`);
            cellCss.push(`border-right:${st.borderRight || "1px solid #d1d5db"}`);
            cellCss.push(`border-bottom:${st.borderBottom || "1px solid #d1d5db"}`);
            cellCss.push(`border-left:${st.borderLeft || "1px solid #d1d5db"}`);
            cellCss.push("padding:6px 10px");
          } else {
            const borderColor = forWord ? "#333333" : rIdx === 0 ? "#1f2937" : "#4b5563";
            const borderW = rIdx === 0 ? "1.5px" : "1px";
            cellCss.push(`border:${borderW} solid ${borderColor}`);
            cellCss.push("padding:8px 12px");
            if (rIdx === 0) {
              cellCss.push("background-color:#f3f4f6");
              cellCss.push("font-weight:bold");
              cellCss.push("text-align:left");
            }
          }

          if (colWidths[cIdx] && !span?.colSpan) {
            cellCss.push(`min-width:${colWidths[cIdx]}px`);
          }

          const tag = rIdx === 0 && !hasCustomStyles ? "th" : "td";
          return `<${tag}${spanAttrs} style="${cellCss.join(";")}">${escapeHtml(
            String(val)
          )}</${tag}>`;
        })
        .join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .join("\n");
}

async function renderCanvasToMultiPagePdf(
  canvas: HTMLCanvasElement,
  pdf: jsPDF,
  addPageFirst: boolean
) {
  const imgData = canvas.toDataURL("image/jpeg", 0.96);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  if (addPageFirst) {
    pdf.addPage();
  }

  // If fits cleanly on 1 A4 page (with small 2% tolerance)
  if (pdfHeight <= pageHeight * 1.03) {
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pageHeight, pdfHeight));
    return;
  }

  let heightLeft = pdfHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 2) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }
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
      await exportStyledXlsx(doc.sheetData, doc.sheetName, outputFileName, doc.rawBuffer);
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
      const rowsHtml = buildStyledSpreadsheetTableHtml(doc);
      const imagesHtml =
        doc.images && doc.images.length > 0
          ? `<div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;">${doc.images
              .map(
                (src) =>
                  `<img src="${src}" alt="Gambar" style="max-height:120px;max-width:240px;object-fit:contain;" />`
              )
              .join("")}</div>`
          : "";
      const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
        baseName
      )}</title><style>body{font-family:Arial,sans-serif;margin:30px;background:#fff;color:#111;}table{border-collapse:collapse;width:100%;}</style></head><body>${imagesHtml}<table>${rowsHtml}</table></body></html>`;
      const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8;" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "docx") {
      const rowsHtml = buildStyledSpreadsheetTableHtml(doc, true);
      const imagesHtml =
        doc.images && doc.images.length > 0
          ? `<div style="margin-bottom:12px;">${doc.images
              .map((src) => `<img src="${src}" alt="Gambar" style="max-height:100px;margin-right:8px;" />`)
              .join("")}</div>`
          : "";
      const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${escapeHtml(
        baseName
      )}</title><style>body{font-family:Calibri,sans-serif;font-size:11pt;}table{border-collapse:collapse;width:100%;}</style></head><body>${imagesHtml}<table>${rowsHtml}</table></body></html>`;
      const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword;charset=utf-8" });
      downloadBlob(blob, outputFileName);
      return;
    }

    if (targetExt === "pdf") {
      if (typeof window !== "undefined") {
        const rowsHtml = buildStyledSpreadsheetTableHtml(doc);
        const imagesHeaderHtml =
          doc.images && doc.images.length > 0
            ? `<div style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                ${doc.images
                  .map(
                    (img) =>
                      `<img src="${img}" alt="Gambar Berkas" style="max-height: 100px; max-width: 220px; object-fit: contain; display: inline-block;" />`
                  )
                  .join("")}
              </div>`
            : "";

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "820px";
        container.style.padding = "32px";
        container.style.background = "#ffffff";
        container.style.color = "#111111";
        container.style.fontFamily = "Calibri, Arial, sans-serif";
        container.innerHTML = `
          ${imagesHeaderHtml}
          <table style="width: 100%; border-collapse: collapse;">
            ${rowsHtml}
          </table>
        `;
        document.body.appendChild(container);

        try {
          const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
          document.body.removeChild(container);
          const pdf = new jsPDF("p", "mm", "a4");
          await renderCanvasToMultiPagePdf(canvas, pdf, false);
          pdf.save(outputFileName);
          return;
        } catch {
          if (document.body.contains(container)) document.body.removeChild(container);
        }
      }

      const pdf = new jsPDF();
      pdf.text(baseName, 14, 20);
      pdf.save(outputFileName);
      return;
    }
  }

  // DOCUMENT MODE EXPORTS (Preserving 100% Rich Formatting, Colors, Backgrounds, Icons, Tables, Fonts)
  const currentHtml = normalizeContactRowsForExport(doc.contentHtml || doc.contentText);

  if (targetExt === "docx") {
    const wordReadyHtml = await prepareHtmlForWordExport(currentHtml);
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${escapeHtml(baseName)}</title>
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
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111111; margin: 24px; background: #ffffff; }
          table { border-collapse: collapse; }
          table.pdf-contact-row { border: none !important; width: auto !important; margin: 0 0 3px 0 !important; }
          td.pdf-contact-cell { border: none !important; padding: 0 !important; }
          b, strong { font-weight: bold; }
          i, em { font-style: italic; }
          u { text-decoration: underline; }
          s, strike { text-decoration: line-through; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${wordReadyHtml}
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
    if (typeof window !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "860px";
      tempDiv.style.background = "#ffffff";
      tempDiv.style.color = "#111111";
      tempDiv.innerHTML = currentHtml;
      document.body.appendChild(tempDiv);

      const pageSheets = tempDiv.querySelectorAll<HTMLElement>(".pdf-page-sheet, .doc-page-sheet");

      if (pageSheets.length > 0) {
        try {
          const pdf = new jsPDF("p", "mm", "a4");
          for (let i = 0; i < pageSheets.length; i++) {
            const sheet = pageSheets[i];
            // Strip editor preview shadow/radius so exported PDF paper edge is clean
            sheet.style.boxShadow = "none";
            sheet.style.borderRadius = "0";
            sheet.style.margin = "0 auto";
            const bg = window.getComputedStyle(sheet).backgroundColor;
            const captureBg =
              bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" ? bg : "#ffffff";

            const canvas = await html2canvas(sheet, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: captureBg,
              onclone: alignContactTablesOnClone,
            });
            await renderCanvasToMultiPagePdf(canvas, pdf, i > 0);
          }

          document.body.removeChild(tempDiv);
          pdf.save(outputFileName);
          return;
        } catch (sheetErr) {
          console.warn("Sheet render fallback:", sheetErr);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        }
      } else {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "800px";
        container.style.padding = "40px";
        container.style.background = "#ffffff";
        container.style.color = "#111111";
        container.style.fontFamily =
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        container.innerHTML = `
          <style>
            table { border-collapse: collapse; }
            table.pdf-contact-row { border: none !important; width: auto !important; margin: 0 0 3px 0 !important; }
            td.pdf-contact-cell { border: none !important; padding: 0 !important; }
            b, strong { font-weight: bold; }
            i, em { font-style: italic; }
            u { text-decoration: underline; }
            s, strike { text-decoration: line-through; }
          </style>
          <div>
            ${currentHtml}
          </div>
        `;
        document.body.appendChild(container);

        try {
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: alignContactTablesOnClone,
          });
          document.body.removeChild(container);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);

          const pdf = new jsPDF("p", "mm", "a4");
          await renderCanvasToMultiPagePdf(canvas, pdf, false);
          pdf.save(outputFileName);
          return;
        } catch (canvasErr) {
          console.warn("PDF render fallback:", canvasErr);
          if (document.body.contains(container)) document.body.removeChild(container);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        }
      }
    }

    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text(baseName, 14, 20);
    pdf.save(outputFileName);
    return;
  }

  if (targetExt === "html") {
    const isRichWrapped =
      currentHtml.includes("doc-page-sheet") ||
      currentHtml.includes("pdf-page-sheet") ||
      currentHtml.includes("docx-sheet");
    const htmlTemplate = isRichWrapped
      ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(baseName)}</title>
  <style>
    body { margin: 0; padding: 24px; background: #f4f4f5; color: #111111; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>
  ${currentHtml}
</body>
</html>`
      : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(baseName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; max-width: 850px; margin: auto; color: #111; background: #fff; }
    table { border-collapse: collapse; }
    b, strong { font-weight: bold; }
    i, em { font-style: italic; }
    u { text-decoration: underline; }
  </style>
</head>
<body>
  ${currentHtml}
</body>
</html>`;
    const blob = new Blob([htmlTemplate], { type: "text/html;charset=utf-8;" });
    downloadBlob(blob, outputFileName);
    return;
  }

  if (targetExt === "xlsx") {
    if (typeof window !== "undefined" && currentHtml.includes("<table")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentHtml;
      const dataTable = Array.from(tempDiv.querySelectorAll("table")).find(
        (t) => !t.classList.contains("pdf-contact-row")
      );
      if (dataTable) {
        const ws = XLSX.utils.table_to_sheet(dataTable);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tabel_Dokumen");
        XLSX.writeFile(wb, outputFileName);
        return;
      }
    }

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
    if (doc.originalExtension === "json") {
      const blob = new Blob([doc.contentText], { type: "application/json;charset=utf-8;" });
      downloadBlob(blob, outputFileName);
      return;
    }
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
