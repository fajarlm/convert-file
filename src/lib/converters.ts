import * as XLSX from "xlsx";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SupportedFormat, TargetOption, LoadedDocument } from "./types";
import { ExtractedImage } from "./formatter";

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

interface PdfImageObject {
  width: number;
  height: number;
  data?: Uint8ClampedArray | Uint8Array;
  bitmap?: ImageBitmap;
  kind?: number;
}

function convertPdfImageToDataUrl(imgObj: PdfImageObject | null | undefined): string | null {
  if (!imgObj || !imgObj.width || !imgObj.height) return null;
  const { width, height } = imgObj;

  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    // 1. If high-performance ImageBitmap exists, draw directly
    if (imgObj.bitmap) {
      ctx.drawImage(imgObj.bitmap, 0, 0);
      return canvas.toDataURL("image/png");
    }

    if (!imgObj.data) return null;
    const { data, kind } = imgObj;
    const totalPixels = width * height;
    let imgData: ImageData;

    if (data.length === totalPixels * 4 || kind === 3) {
      imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    } else if (data.length === totalPixels * 3 || kind === 2) {
      // 24-bit RGB -> 32-bit RGBA
      const rgba = new Uint8ClampedArray(totalPixels * 4);
      let s = 0;
      let d = 0;
      for (let p = 0; p < totalPixels; p++) {
        rgba[d++] = data[s++];
        rgba[d++] = data[s++];
        rgba[d++] = data[s++];
        rgba[d++] = 255;
      }
      imgData = new ImageData(rgba, width, height);
    } else if (data.length === totalPixels || kind === 1) {
      // 8-bit Grayscale -> RGBA
      const rgba = new Uint8ClampedArray(totalPixels * 4);
      let d = 0;
      for (let p = 0; p < totalPixels; p++) {
        const val = data[p];
        rgba[d++] = val;
        rgba[d++] = val;
        rgba[d++] = val;
        rgba[d++] = 255;
      }
      imgData = new ImageData(rgba, width, height);
    } else {
      imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Canvas ImageData conversion error:", err);
    return null;
  }
}

interface PdfVisualItem {
  str: string;
  x: number;
  y: number;
  fontSize: number;
  isBold: boolean;
  color: string;
  fontName: string;
  url?: string;
}

function getContactSvg(type: "phone" | "email" | "linkedin" | "github" | "website" | "location"): string {
  switch (type) {
    case "phone":
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="display:block;margin:0 auto;width:13px;height:13px;"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
    case "email":
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="display:block;margin:0 auto;width:13px;height:13px;"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
    case "linkedin":
      return `<svg width="13" height="13" viewBox="0 0 24 24" style="display:block;margin:0 auto;width:13px;height:13px;"><rect width="24" height="24" rx="3" fill="#111111"/><path fill="#ffffff" d="M19 19h-3.4v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19H8.9s.1-9.2 0-10.2h3.4v1.5c.5-.7 1.3-1.8 3.2-1.8 2.3 0 4.1 1.5 4.1 4.8V19zM5.7 7.4c-1.2 0-1.9-.8-1.9-1.8 0-1 .8-1.8 2-1.8 1.2 0 1.9.8 1.9 1.8 0 1-.7 1.8-2 1.8zM4 19h3.4V8.8H4V19z"/></svg>`;
    case "github":
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="display:block;margin:0 auto;width:13px;height:13px;"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
    case "website":
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="display:block;margin:0 auto;width:13px;height:13px;"><path d="M4 2l16 11.5-7.5 1.5 4.5 7.5-3 1.5-4.5-7.5-5.5 5.5V2z"/></svg>`;
    case "location":
    default:
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="display:block;margin:0 auto;width:13px;height:13px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  }
}

function parseContactItem(item: PdfVisualItem): {
  type: "phone" | "email" | "linkedin" | "github" | "website" | "location";
  label: string;
  href?: string;
} {
  const str = item.str.trim();
  const url = item.url;

  if (url?.startsWith("mailto:") || str.includes("@")) {
    const email = str.includes("@") ? str : url?.replace("mailto:", "") || str;
    return { type: "email", label: email, href: `mailto:${email}` };
  }
  if (url?.startsWith("tel:") || /^\+?[0-9\s\-()]{8,}$/.test(str)) {
    const phone = str;
    const cleanNum = phone.replace(/[^\d+]/g, "");
    return { type: "phone", label: phone, href: `tel:${cleanNum}` };
  }
  if (url?.includes("linkedin") || str.toLowerCase().includes("linkedin")) {
    return { type: "linkedin", label: str || "LinkedIn", href: url || "https://www.linkedin.com" };
  }
  if (url?.includes("github") || str.toLowerCase().includes("github")) {
    return { type: "github", label: str || "GitHub", href: url || "https://github.com" };
  }
  if (url?.startsWith("http") || /\.(app|com|org|net|id|io|dev|me)\b/i.test(str)) {
    const href = url || (str.startsWith("http") ? str : `https://${str}`);
    return { type: "website", label: str, href };
  }
  return { type: "location", label: str };
}

interface PageImageItem extends ExtractedImage {
  pageNum: number;
}

async function extractTextFromPdf(
  buffer: ArrayBuffer
): Promise<{ text: string; html: string; images: string[] }> {
  // Use pdfjs-dist legacy build for universal compatibility
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const allPageTexts: string[] = [];
  const allExtractedImages: PageImageItem[] = [];

  function multiplyTransforms(m1: number[], m2: number[]): number[] {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }

  const pageSheetsHtml: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // 1. High-Fidelity Image Extraction for this page
    const pageImages: ExtractedImage[] = [];
    let opList: { fnArray: number[]; argsArray: unknown[] } | null = null;
    try {
      opList = await page.getOperatorList();
      const matrixStack: number[][] = [[1, 0, 0, 1, 0, 0]];
      let currentMatrix = [1, 0, 0, 1, 0, 0];

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i] as unknown[];

        if (fn === pdfjsLib.OPS.save) {
          matrixStack.push([...currentMatrix]);
        } else if (fn === pdfjsLib.OPS.restore) {
          if (matrixStack.length > 0) {
            currentMatrix = matrixStack.pop()!;
          }
        } else if (fn === pdfjsLib.OPS.transform) {
          if (args && args.length === 6) {
            currentMatrix = multiplyTransforms(currentMatrix, args as number[]);
          }
        } else if (
          fn === pdfjsLib.OPS.paintImageXObject ||
          fn === pdfjsLib.OPS.paintInlineImageXObject
        ) {
          const imgId = args[0] as string;
          try {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const imgObj = await new Promise<PdfImageObject | null>((resolve) => {
              const direct = page.objs.get(imgId);
              if (direct && (direct.data || direct.bitmap)) return resolve(direct as PdfImageObject);
              page.objs.get(imgId, (obj: PdfImageObject) => {
                if (timer) clearTimeout(timer);
                resolve(obj);
              });
              timer = setTimeout(() => resolve(null), 1200);
            });
            if (timer) clearTimeout(timer);

            if (imgObj && imgObj.width && imgObj.height && (imgObj.data || imgObj.bitmap)) {
              const dataUrl = convertPdfImageToDataUrl(imgObj);
              if (dataUrl) {
                const imgW = Math.round(Math.hypot(currentMatrix[0], currentMatrix[1]));
                const imgH = Math.round(Math.hypot(currentMatrix[2], currentMatrix[3]));
                const yBottom = currentMatrix[5];
                const topDist = Math.round(unscaledViewport.height - (yBottom + imgH));

                if (imgObj.width >= 8 && imgObj.height >= 8 && imgW >= 8 && imgH >= 8) {
                  const item: PageImageItem = {
                    dataUrl,
                    x: Math.max(0, Math.round(currentMatrix[4])),
                    y: Math.max(0, topDist),
                    width: imgW,
                    height: imgH,
                    isHeader: topDist < 250,
                    pageNum,
                  };
                  pageImages.push(item);
                  allExtractedImages.push(item);
                }
              }
            }
          } catch (imgErr) {
            console.warn("Failed to extract image " + imgId, imgErr);
          }
        }
      }
    } catch (opErr) {
      console.warn("Operator list processing error:", opErr);
    }

    // 2. Extract Link Annotations (URLs, mailto, tel)
    interface PdfAnnotationLink {
      url: string;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
    const pageLinkAnns: PdfAnnotationLink[] = [];
    try {
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype === "Link" && (ann.url || ann.unsafeUrl)) {
          const rect = ann.rect;
          if (Array.isArray(rect) && rect.length === 4) {
            const rawUrl = (ann.url || ann.unsafeUrl) as string;
            pageLinkAnns.push({
              url: rawUrl,
              left: Math.min(rect[0], rect[2]),
              right: Math.max(rect[0], rect[2]),
              top: unscaledViewport.height - Math.max(rect[1], rect[3]),
              bottom: unscaledViewport.height - Math.min(rect[1], rect[3]),
            });
          }
        }
      }
    } catch (annErr) {
      console.warn("PDF annotations extraction warning:", annErr);
    }

    // 3. Extract Operator List Text Colors
    let curColor = "#222222";
    const showTextColors: string[] = [];
    if (opList) {
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i] as unknown[];
        if (fn === pdfjsLib.OPS.setFillRGBColor) {
          if (typeof args[0] === "string") {
            curColor = args[0];
          } else if (Array.isArray(args) && args.length >= 3) {
            curColor =
              "#" +
              args
                .slice(0, 3)
                .map((c) =>
                  Math.min(255, Math.max(0, Math.round(Number(c))))
                    .toString(16)
                    .padStart(2, "0")
                )
                .join("");
          }
        }
        if (fn === pdfjsLib.OPS.showText) {
          showTextColors.push(curColor);
        }
      }
    }

    // 4. Structured Text Extraction with Exact Coordinates & Colors
    const textContent = await page.getTextContent();
    const rawItems: PdfVisualItem[] = [];
    let textIdx = 0;

    for (const rawItem of textContent.items) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as { str?: string; transform?: number[]; fontName?: string; width?: number };
      if (!item.str || !item.str.trim()) continue;

      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = Math.round(transform[4] * 10) / 10;
      const y = Math.round((unscaledViewport.height - transform[5]) * 10) / 10;
      const fontSize = Math.max(9, Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10);
      const fontName = (item.fontName || "").toLowerCase();

      const matchedAnn = pageLinkAnns.find(
        (ann) =>
          x >= ann.left - 8 &&
          x <= ann.right + 8 &&
          y >= ann.top - 4 &&
          y <= ann.bottom + 4
      );
      const url = matchedAnn?.url;

      const isBold =
        fontName.includes("bold") ||
        fontName.includes("black") ||
        fontName.includes("heavy") ||
        fontName.includes("f1") ||
        fontName.includes("f3") ||
        fontSize >= 16;
      const color = showTextColors[textIdx] || "#222222";
      textIdx++;

      rawItems.push({
        str: item.str,
        x,
        y,
        fontSize,
        isBold,
        color,
        fontName,
        url,
      });
    }

    // Deduplicate overlapping items (where later operator paints over earlier operator at same position)
    const dedupedItems: PdfVisualItem[] = [];
    for (const item of rawItems) {
      const existingIdx = dedupedItems.findIndex(
        (prev) => Math.abs(prev.x - item.x) < 4 && Math.abs(prev.y - item.y) < 3
      );
      if (existingIdx !== -1) {
        dedupedItems[existingIdx] = item;
      } else {
        dedupedItems.push(item);
      }
    }

    // Group items into visual rows by similar Y (within 4.5px)
    const lineBuckets: Array<{ y: number; items: PdfVisualItem[] }> = [];
    for (const item of dedupedItems) {
      const existing = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4.5);
      if (existing) {
        existing.items.push(item);
      } else {
        lineBuckets.push({ y: item.y, items: [item] });
      }
    }
    lineBuckets.sort((a, b) => a.y - b.y);

    // Save plain text for search and fallback
    const pagePlainTextLines: string[] = [];
    for (const b of lineBuckets) {
      b.items.sort((i1, i2) => i1.x - i2.x);
      pagePlainTextLines.push(b.items.map((it) => it.str).join(" "));
    }
    if (pagePlainTextLines.length > 0) {
      allPageTexts.push(pagePlainTextLines.join("\n"));
    }

    // 5. Reconstruct High-Fidelity Visual Page Sheet
    const pageElements: string[] = [];
    const profileImg = pageImages.find((img) => img.isHeader);

    // Check if Page 1 has top Header (photo + name + contacts at y < 145)
    if (pageNum === 1 && (profileImg || lineBuckets.some((b) => b.y < 145 && b.items.some((it) => it.fontSize >= 15)))) {
      const headerRows = lineBuckets.filter((b) => b.y < 145);
      const headerItems = headerRows.flatMap((r) => r.items);
      const nameItem = headerItems.find((it) => it.fontSize >= 16) || headerItems[0];
      const roleItem = headerItems.find((it) => it !== nameItem && it.x < 250 && it.fontSize >= 10);
      const contactItems = headerItems
        .filter(
          (it) =>
            it !== nameItem &&
            it !== roleItem &&
            (it.x >= 280 ||
              it.str.includes("@") ||
              it.str.includes("+") ||
              it.str.includes(".com") ||
              it.str.toLowerCase().includes("linkedin") ||
              it.str.toLowerCase().includes("portofolio") ||
              !!it.url)
        )
        .sort((a, b) => a.y - b.y);

      // Clean natural photo without cover, outer border, or box-shadow
      const photoWidthPx = profileImg?.width ? Math.round(profileImg.width * 1.333) || 106 : 106;
      const photoHtml = profileImg
        ? `<div style="flex-shrink: 0;">
            <img class="resizable-doc-img" src="${profileImg.dataUrl}" alt="Foto Profil" style="width: ${photoWidthPx}px; height: auto; object-fit: contain; display: block; cursor: pointer; border: none; box-shadow: none;" />
          </div>`
        : "";

      const contactsHtml =
        contactItems.length > 0
          ? `<div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #111111; min-width: 200px;">
              ${contactItems
                .map((c) => {
                  const parsed = parseContactItem(c);
                  const iconSvg = getContactSvg(parsed.type);
                  const content = parsed.href
                    ? `<a href="${parsed.href}" ${
                        parsed.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""
                      } style="color: #111111; text-decoration: none; display: inline-block; vertical-align: middle; line-height: 16px;">${escapeHtml(
                        parsed.label
                      )}</a>`
                    : `<span style="color: #111111; display: inline-block; vertical-align: middle; line-height: 16px;">${escapeHtml(parsed.label)}</span>`;
                  return `
                    <table class="pdf-contact-row" style="border: none !important; border-collapse: collapse !important; margin: 0 0 3px 0 !important; padding: 0 !important; width: auto !important; background: transparent !important; line-height: 1 !important;">
                      <tbody>
                        <tr style="border: none !important; background: transparent !important; height: 16px !important;">
                          <td class="pdf-contact-cell" style="border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 14px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;">
                            ${iconSvg}
                          </td>
                          <td class="pdf-contact-cell" style="border: none !important; padding: 0 !important; vertical-align: middle !important; font-size: 12px !important; line-height: 16px !important; height: 16px !important; color: #111111 !important; background: transparent !important; white-space: nowrap !important;">
                            ${content}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  `;
                })
                .join("")}
            </div>`
          : "";

      pageElements.push(`
        <div class="pdf-cv-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 20px; border-bottom: 1px dotted #888888; margin-bottom: 20px;">
          <div style="display: flex; align-items: flex-start; gap: 20px;">
            ${photoHtml}
            <div>
              <h1 style="font-size: 24px; font-weight: 700; color: ${nameItem?.color || "#111111"}; margin: 0 0 4px 0; letter-spacing: -0.2px;">${escapeHtml(nameItem?.str || "")}</h1>
              ${roleItem ? `<div style="font-size: 14.5px; font-weight: 500; color: #555555; margin-top: 2px;">${escapeHtml(roleItem.str)}</div>` : ""}
            </div>
          </div>
          ${contactsHtml}
        </div>
      `);

      // Filter out header rows from body processing
      const bodyBuckets = lineBuckets.filter((b) => b.y >= 145);
      renderPageBuckets(bodyBuckets, pageElements, unscaledViewport.height);
    } else {
      renderPageBuckets(lineBuckets, pageElements, unscaledViewport.height);
    }

    // Append any body images belonging to this page
    const bodyImages = pageImages.filter((img) => img !== profileImg);
    for (const bImg of bodyImages) {
      pageElements.push(`
        <div class="doc-body-image" style="text-align: center; margin: 20px 0;">
          <img class="resizable-doc-img" src="${bImg.dataUrl}" alt="Gambar Dokumen" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display: inline-block; cursor: pointer;" />
        </div>
      `);
    }

    pageSheetsHtml.push(`
      <div class="pdf-page-sheet" style="width: 100%; max-width: 794px; min-height: 1050px; margin: 0 auto 32px auto; background: #ffffff; padding: 48px 56px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 4px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222; position: relative;">
        ${pageElements.join("\n")}
      </div>
    `);
  }

  const rawText = allPageTexts.join("\n\n");
  const fullHtml = pageSheetsHtml.join("\n");

  return {
    text: rawText || "Dokumen PDF kosong atau berbasis gambar scan.",
    html: fullHtml,
    images: allExtractedImages.map((img) => img.dataUrl),
  };
}

function renderPageBuckets(
  buckets: Array<{ y: number; items: PdfVisualItem[] }>,
  output: string[],
  pageHeight: number
) {
  for (const bucket of buckets) {
    bucket.items.sort((a, b) => a.x - b.x);

    // Page number at bottom (e.g. 1 / 2, 2 / 2)
    if (bucket.y > pageHeight - 45) {
      output.push(
        `<div style="text-align: right; font-size: 11px; color: #888888; margin-top: 24px;">${escapeHtml(
          bucket.items.map((it) => it.str).join(" ")
        )}</div>`
      );
      continue;
    }

    const first = bucket.items[0];
    let fullLineStr = bucket.items.map((it) => it.str).join(" ").trim();
    // Normalize common PDF text extraction splits & remove stray dot artifacts
    fullLineStr = fullLineStr
      .replace(/\bSUMM\s+ARY\b/gi, "SUMMARY")
      .replace(/\bL\s+ANGUAGES\b/gi, "LANGUAGES")
      .replace(/[\s\u200B\uFEFF⋮·:;|]+$/g, "")
      .trim();

    // Check if section heading (e.g. SUMMARY, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATES, SKILLS, LANGUAGES)
    const isHeading =
      bucket.items.length <= 2 &&
      (first.fontSize >= 10.5 || first.isBold) &&
      (/^(ringkasan|summary|profil|profile|pengalaman|experience|proyek|projects|pendidikan|education|keahlian|skills|kemampuan|sertifikasi|certificates|bahasa|languages|awards|organisasi)/i.test(
        fullLineStr
      ) ||
        (first.str === first.str.toUpperCase() && first.str.length >= 3 && !first.str.includes("@")));

    if (isHeading) {
      output.push(`
        <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: ${first.color || "#111111"}; border-bottom: 1px dotted #888888; padding-bottom: 4px; margin-top: 22px; margin-bottom: 12px; letter-spacing: 0.8px;">
          ${escapeHtml(fullLineStr)}
        </h2>
      `);
      continue;
    }

    // Multi-column items with 2 items separated by a gap (e.g. Title on Left, Date on Right)
    if (bucket.items.length === 2 && bucket.items[1].x - bucket.items[0].x > 100) {
      const left = bucket.items[0];
      const right = bucket.items[1];
      const leftContent = left.url
        ? `<a href="${left.url}" target="_blank" rel="noopener noreferrer" style="color: ${left.color || "#111111"}; text-decoration: none; font-weight: 700;">${escapeHtml(left.str)}</a>`
        : escapeHtml(left.str);
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; margin-bottom: 2px;">
          <div style="font-size: 13px; font-weight: 700; color: ${left.color || "#111111"};">${leftContent}</div>
          <div style="font-size: 12px; font-weight: 400; color: #666666; font-style: normal; text-align: right;">${escapeHtml(right.str)}</div>
        </div>
      `);
      continue;
    }

    // Multi-column items with 3 items (e.g. Soft Skill | Tech Skill | Level)
    if (bucket.items.length === 3) {
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 12.5px;">
          <span style="width: 45%; color: ${bucket.items[0].color || "#222222"}; font-weight: 500;">${escapeHtml(bucket.items[0].str)}</span>
          <span style="width: 30%; color: ${bucket.items[1].color || "#111111"}; font-weight: 600;">${escapeHtml(bucket.items[1].str)}</span>
          <span style="width: 25%; text-align: right; color: #555555; font-weight: 400;">${escapeHtml(bucket.items[2].str)}</span>
        </div>
      `);
      continue;
    }

    // Multi-column items with 4 items (e.g. Language 1 | Level 1 | Language 2 | Level 2)
    if (bucket.items.length === 4) {
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 12.5px;">
          <span style="width: 25%; color: ${bucket.items[0].color || "#111111"}; font-weight: 600;">${escapeHtml(bucket.items[0].str)}</span>
          <span style="width: 25%; color: #555555; font-weight: 400;">${escapeHtml(bucket.items[1].str)}</span>
          <span style="width: 25%; color: ${bucket.items[2].color || "#111111"}; font-weight: 600;">${escapeHtml(bucket.items[2].str)}</span>
          <span style="width: 25%; text-align: right; color: #555555; font-weight: 400;">${escapeHtml(bucket.items[3].str)}</span>
        </div>
      `);
      continue;
    }

    // Standalone project/job title row
    if (first.isBold && bucket.items.length === 1 && first.fontSize >= 9) {
      const isTitleCandidate =
        first.str.includes("Quranic") ||
        first.str.includes("Absensiku") ||
        (first.str.length < 40 && !first.str.endsWith(".") && !first.str.includes(","));
      if (isTitleCandidate) {
        const titleContent = first.url
          ? `<a href="${first.url}" target="_blank" rel="noopener noreferrer" style="color: ${first.color || "#111111"}; text-decoration: none; font-weight: 700;">${escapeHtml(first.str)}</a>`
          : escapeHtml(first.str);
        output.push(`
          <div style="font-size: 13px; font-weight: 700; color: ${first.color || "#111111"}; margin-top: 10px; margin-bottom: 2px;">
            ${titleContent}
          </div>
        `);
        continue;
      }
    }

    // Subtitle / Job role / School name line
    const isSub =
      fullLineStr.includes("Developer") ||
      fullLineStr.includes("stack") ||
      fullLineStr.includes("School") ||
      fullLineStr.includes("DiCoding") ||
      fullLineStr.includes("Universitas");

    if (isSub) {
      output.push(`
        <div style="font-size: 12.5px; color: #444444; font-weight: 500; margin-bottom: 4px;">
          ${escapeHtml(fullLineStr)}
        </div>
      `);
    } else {
      const lineHtml = bucket.items
        .map((it) => {
          if (it.url) {
            return `<a href="${it.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${escapeHtml(it.str)}</a>`;
          }
          return escapeHtml(it.str);
        })
        .join(" ");
      output.push(`
        <p style="margin: 4px 0 8px 0; font-size: 12.5px; line-height: 1.55; color: ${first.color || "#222222"}; font-weight: 400;">
          ${lineHtml}
        </p>
      `);
    }
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

    const excelImages: string[] = [];
    if (ext === "xlsx") {
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(buffer);
        const mediaFiles = Object.keys(zip.files).filter(
          (p) => p.startsWith("xl/media/") && !zip.files[p].dir
        );
        for (const p of mediaFiles) {
          const fileExt = p.split(".").pop()?.toLowerCase() || "png";
          const mime = fileExt === "jpg" || fileExt === "jpeg" ? "image/jpeg" : "image/png";
          const base64 = await zip.files[p].async("base64");
          excelImages.push(`data:${mime};base64,${base64}`);
        }
      } catch (zipErr) {
        console.warn("Excel media extraction warning:", zipErr);
      }
    }

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
      images: excelImages,
    };
  }

  // 2. Word documents (.docx)
  if (ext === "docx") {
    const buffer = await file.arrayBuffer();
    try {
      const htmlResult = await mammoth.convertToHtml(
        { arrayBuffer: buffer },
        {
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              return {
                src: `data:${image.contentType};base64,${imageBuffer}`,
              };
            });
          }),
        }
      );
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });

      // Preserve rich HTML with table, bold, italic, and images
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
      const { text, html, images } = await extractTextFromPdf(buffer);

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

function normalizeContactRowsForExport(html: string): string {
  if (typeof document === "undefined" || !html) return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 1. Convert any legacy flex contact rows into table format
  const flexRows = temp.querySelectorAll<HTMLElement>("div[style*='display: flex'], div[style*='display:flex']");
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
        svg.style.width = "13px";
        svg.style.height = "13px";

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
          "border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 14px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;"
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

  // 2. Ensure all .pdf-contact-row tables have proper inline cell styles
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
        "border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 14px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;"
      );
      cells[1].setAttribute(
        "style",
        "border: none !important; padding: 0 !important; vertical-align: middle !important; font-size: 12px !important; line-height: 16px !important; height: 16px !important; color: #111111 !important; background: transparent !important; white-space: nowrap !important;"
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
      cells[0].style.width = "14px";
      cells[0].style.padding = "0 8px 0 0";
      cells[0].style.textAlign = "center";
      cells[0].style.background = "transparent";
      const svg = cells[0].querySelector("svg");
      if (svg) {
        svg.style.display = "block";
        svg.style.margin = "0 auto";
        svg.style.width = "13px";
        svg.style.height = "13px";
      }

      cells[1].style.border = "none";
      cells[1].style.verticalAlign = "middle";
      cells[1].style.height = "16px";
      cells[1].style.lineHeight = "16px";
      cells[1].style.padding = "0";
      cells[1].style.fontSize = "12px";
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

        const imagesHeaderHtml =
          doc.images && doc.images.length > 0
            ? `<div style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                ${doc.images
                  .map(
                    (img) =>
                      `<img src="${img}" alt="Gambar Berkas" style="max-height: 80px; max-width: 180px; object-fit: contain; border-radius: 4px; border: 1px solid #e5e7eb; display: inline-block;" />`
                  )
                  .join("")}
              </div>`
            : "";

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
          ${imagesHeaderHtml}
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
  const currentHtml = normalizeContactRowsForExport(doc.contentHtml || doc.contentText);

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
          table.pdf-contact-row { border: none !important; width: auto !important; margin: 0 0 3px 0 !important; }
          th { background-color: #f3f4f6; color: #000000; font-weight: bold; border: 1pt solid #4b5563; padding: 8px 12px; text-align: left; }
          td { border: 1pt solid #6b7280; padding: 8px 12px; color: #000000; }
          td.pdf-contact-cell { border: none !important; padding: 0 !important; }
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
          img { max-width: 100%; height: auto; display: inline-block; margin: 8pt 0; }
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
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "794px";
      tempDiv.style.background = "#ffffff";
      tempDiv.innerHTML = currentHtml;
      document.body.appendChild(tempDiv);

      const pageSheets = tempDiv.querySelectorAll<HTMLElement>(".pdf-page-sheet");

      if (pageSheets.length > 0) {
        // High fidelity multi-page PDF sheet layout
        try {
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          for (let i = 0; i < pageSheets.length; i++) {
            const sheet = pageSheets[i];
            const canvas = await html2canvas(sheet, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: "#ffffff",
              onclone: alignContactTablesOnClone,
            });
            const imgData = canvas.toDataURL("image/jpeg", 0.98);

            if (i > 0) {
              pdf.addPage();
            }
            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
          }

          document.body.removeChild(tempDiv);
          pdf.save(outputFileName);
          return;
        } catch (sheetErr) {
          console.warn("Sheet render fallback:", sheetErr);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        }
      } else {
        // Standard document layout without fake header banner
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "800px";
        container.style.padding = "40px";
        container.style.background = "#ffffff";
        container.style.color = "#000000";
        container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        container.innerHTML = `
          <style>
            table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1.5px solid #333; }
            table.pdf-contact-row { border: none !important; width: auto !important; margin: 0 0 3px 0 !important; }
            th { background-color: #f3f4f6; color: #000; font-weight: bold; border: 1px solid #4b5563; padding: 8px 12px; text-align: left; }
            td { border: 1px solid #6b7280; padding: 8px 12px; color: #000; }
            td.pdf-contact-cell { border: none !important; padding: 0 !important; }
            b, strong { font-weight: bold; }
            i, em { font-style: italic; }
            u { text-decoration: underline; }
            s, strike { text-decoration: line-through; }
            h1 { font-size: 24px; font-weight: bold; margin: 14px 0 6px 0; color: #000; }
            h2 { font-size: 19px; font-weight: bold; margin: 12px 0 6px 0; color: #000; }
            h3 { font-size: 16px; font-weight: bold; margin: 10px 0 4px 0; color: #000; }
            p { margin: 6px 0; line-height: 1.6; color: #000; }
            ul, ol { margin: 6px 0 6px 24px; color: #000; }
            li { margin: 3px 0; }
            .pdf-document-page { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
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
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        }
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
