import { ExtractedImage } from "./formatter";

export interface PdfExtractionResult {
  text: string;
  html: string;
  images: string[];
}

interface PdfImageObject {
  width: number;
  height: number;
  data?: Uint8ClampedArray | Uint8Array;
  bitmap?: ImageBitmap;
  kind?: number;
}

interface PageImageItem extends ExtractedImage {
  pageNum: number;
  isCircular?: boolean;
}

interface PdfVisualItem {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  isBold: boolean;
  fontWeight: number;
  isItalic: boolean;
  fontFamily: string;
  color: string;
  bgColor?: string;
  fontName: string;
  url?: string;
}

interface PdfLine {
  type: "h" | "v";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  color: string;
  dashStyle: "solid" | "dashed" | "dotted";
  used?: boolean;
}

interface PdfRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  isRounded?: boolean;
  used?: boolean;
}

interface PdfVectorPath {
  d: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number;
}

interface ClusteredSvgIcon {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  svgHtml: string;
  used?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parsePdfColor(args: unknown[], kind: "rgb" | "gray" | "cmyk"): string | null {
  if (!args || args.length === 0) return null;
  if (typeof args[0] === "string") {
    const s = args[0].trim();
    if (s.startsWith("#") || s.startsWith("rgb")) return s;
  }
  if (kind === "rgb") {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    if (arr.length >= 3) {
      const nums = arr.slice(0, 3).map((v) => Number(v));
      const scale = nums.every((n) => n >= 0 && n <= 1) ? 255 : 1;
      return (
        "#" +
        nums
          .map((n) =>
            Math.min(255, Math.max(0, Math.round(n * scale)))
              .toString(16)
              .padStart(2, "0")
          )
          .join("")
      );
    }
  } else if (kind === "gray") {
    const g = Number(args[0]);
    if (!Number.isNaN(g)) {
      const val = Math.min(255, Math.max(0, Math.round((g <= 1 ? g * 255 : g))));
      const hex = val.toString(16).padStart(2, "0");
      return `#${hex}${hex}${hex}`;
    }
  } else if (kind === "cmyk" && args.length >= 4) {
    const [c, m, y, k] = args.slice(0, 4).map((v) => Number(v));
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    return (
      "#" +
      [r, g, b]
        .map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return null;
}

function isNearWhite(hex: string | undefined): boolean {
  if (!hex || hex === "transparent") return true;
  const h = hex.replace("#", "").toLowerCase();
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return r >= 250 && g >= 250 && b >= 250;
  }
  return h === "fff" || h === "ffffff";
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

export function getContactSvg(
  type: "phone" | "email" | "linkedin" | "github" | "website" | "location"
): string {
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

function applyPoint(m: number[], px: number, py: number, pageHeight: number): [number, number] {
  const x = m[0] * px + m[2] * py + m[4];
  const y = pageHeight - (m[1] * px + m[3] * py + m[5]);
  return [x, y];
}

/**
 * Convert PDF DrawOPS into SVG path string in viewport coordinates, returning bounding box and curve metadata.
 */
function buildSvgPathFromDrawOps(
  data: ArrayLike<number>,
  matrix: number[],
  pageHeight: number
): {
  d: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  hasCurves: boolean;
  isSimpleRect: boolean;
} | null {
  if (!data || data.length === 0) return null;
  let d = "";
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasCurves = false;
  let moveCount = 0;
  let lineCount = 0;

  const track = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (let i = 0; i < data.length; ) {
    const cmd = data[i++];
    if (cmd === 0) {
      // DrawOPS.moveTo
      const [x, y] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      track(x, y);
      d += `M${x.toFixed(2)} ${y.toFixed(2)} `;
      moveCount++;
    } else if (cmd === 1) {
      // DrawOPS.lineTo
      const [x, y] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      track(x, y);
      d += `L${x.toFixed(2)} ${y.toFixed(2)} `;
      lineCount++;
    } else if (cmd === 2) {
      // DrawOPS.curveTo
      const [x1, y1] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      const [x2, y2] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      const [x, y] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      track(x1, y1);
      track(x2, y2);
      track(x, y);
      d += `C${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} `;
      hasCurves = true;
    } else if (cmd === 3) {
      // DrawOPS.quadraticCurveTo
      const [x1, y1] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      const [x, y] = applyPoint(matrix, data[i++], data[i++], pageHeight);
      track(x1, y1);
      track(x, y);
      d += `Q${x1.toFixed(2)} ${y1.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} `;
      hasCurves = true;
    } else if (cmd === 4) {
      // DrawOPS.closePath
      d += "Z ";
    } else {
      break;
    }
  }

  if (!Number.isFinite(minX)) return null;
  const isSimpleRect = !hasCurves && moveCount === 1 && (lineCount === 3 || lineCount === 4);
  return {
    d: d.trim(),
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    hasCurves,
    isSimpleRect,
  };
}

/**
 * Group overlapping or adjacent vector paths into clustered crisp inline <svg> icons.
 */
function clusterVectorPathsToIcons(paths: PdfVectorPath[]): ClusteredSvgIcon[] {
  if (paths.length === 0) return [];
  const used = new Array(paths.length).fill(false);
  const clusters: ClusteredSvgIcon[] = [];

  for (let i = 0; i < paths.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const group: PdfVectorPath[] = [paths[i]];
    let left = paths[i].left;
    let top = paths[i].top;
    let right = paths[i].right;
    let bottom = paths[i].bottom;

    let expanded = true;
    while (expanded) {
      expanded = false;
      for (let j = 0; j < paths.length; j++) {
        if (used[j]) continue;
        const p = paths[j];
        const pad = 3.5;
        const overlaps =
          p.left <= right + pad &&
          p.right >= left - pad &&
          p.top <= bottom + pad &&
          p.bottom >= top - pad;
        if (overlaps) {
          used[j] = true;
          group.push(p);
          left = Math.min(left, p.left);
          top = Math.min(top, p.top);
          right = Math.max(right, p.right);
          bottom = Math.max(bottom, p.bottom);
          expanded = true;
        }
      }
    }

    const width = Math.max(4, right - left);
    const height = Math.max(4, bottom - top);
    if (width > 140 || height > 140) continue;

    const padView = 0.5;
    const vx = (left - padView).toFixed(2);
    const vy = (top - padView).toFixed(2);
    const vw = (width + padView * 2).toFixed(2);
    const vh = (height + padView * 2).toFixed(2);
    const outW = Math.round(Math.max(10, width * 1.15) * 10) / 10;
    const outH = Math.round(Math.max(10, height * 1.15) * 10) / 10;

    const pathTags = group
      .map((p) => {
        const fillAttr = p.fillColor ? `fill="${p.fillColor}"` : `fill="none"`;
        const strokeAttr = p.strokeColor
          ? `stroke="${p.strokeColor}" stroke-width="${Math.max(0.5, p.strokeWidth).toFixed(2)}"`
          : "";
        return `<path d="${p.d}" ${fillAttr} ${strokeAttr} />`;
      })
      .join("");

    const svgHtml = `<svg width="${outW}" height="${outH}" viewBox="${vx} ${vy} ${vw} ${vh}" style="display:block;margin:0 auto;width:${outW}px;height:${outH}px;flex-shrink:0;">${pathTags}</svg>`;

    clusters.push({
      left,
      top,
      right,
      bottom,
      width,
      height,
      svgHtml,
    });
  }

  return clusters;
}

function resolveFontStyle(
  rawFontName: string,
  styleEntry?: { fontFamily?: string; ascent?: number; descent?: number },
  commonFontName?: string
): {
  isBold: boolean;
  fontWeight: number;
  isItalic: boolean;
  fontFamily: string;
} {
  const combined = `${rawFontName} ${commonFontName || ""} ${styleEntry?.fontFamily || ""}`.toLowerCase();

  const isBold =
    combined.includes("bold") ||
    combined.includes("black") ||
    combined.includes("heavy") ||
    combined.includes("semibold") ||
    combined.includes("demi") ||
    combined.includes("700") ||
    combined.includes("800") ||
    combined.includes("900");

  const isMedium = !isBold && (combined.includes("medium") || combined.includes("500"));
  const fontWeight = isBold ? 700 : isMedium ? 500 : 400;

  const isItalic =
    combined.includes("italic") ||
    combined.includes("oblique") ||
    combined.includes("slanted");

  let fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  if (
    combined.includes("monospace") ||
    combined.includes("courier") ||
    combined.includes("consolas") ||
    combined.includes("mono")
  ) {
    fontFamily = "'Courier New', Courier, monospace";
  } else if (
    combined.includes("serif") && !combined.includes("sans-serif") ||
    combined.includes("times") ||
    combined.includes("georgia") ||
    combined.includes("garamond") ||
    combined.includes("cambria") ||
    combined.includes("palatino")
  ) {
    fontFamily = "Georgia, 'Times New Roman', Times, serif";
  }

  return { isBold, fontWeight, isItalic, fontFamily };
}

export async function extractFromPdf(buffer: ArrayBuffer): Promise<PdfExtractionResult> {
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
  const pageSheetsHtml: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const pageW = unscaledViewport.width;
    const pageH = unscaledViewport.height;

    const pageImages: Array<
      PageImageItem & { x: number; y: number; width: number; height: number; isHeader: boolean }
    > = [];
    const pdfLines: PdfLine[] = [];
    const pdfRects: PdfRect[] = [];
    const pdfVectorPaths: PdfVectorPath[] = [];
    const textDrawEvents: Array<{ color: string; x: number; y: number }> = [];
    let pageBgColor = "#ffffff";

    let opList: { fnArray: number[]; argsArray: unknown[] } | null = null;
    try {
      opList = await page.getOperatorList();

      interface GState {
        matrix: number[];
        fillColor: string;
        strokeColor: string;
        lineWidth: number;
        lineDash: number[];
        isCircularClip: boolean;
        textMatrix: number[];
      }

      const stateStack: GState[] = [];
      let state: GState = {
        matrix: [1, 0, 0, 1, 0, 0],
        fillColor: "#111111",
        strokeColor: "#111111",
        lineWidth: 1,
        lineDash: [],
        isCircularClip: false,
        textMatrix: [1, 0, 0, 1, 0, 0],
      };

      const cloneState = (s: GState): GState => ({
        matrix: [...s.matrix],
        fillColor: s.fillColor,
        strokeColor: s.strokeColor,
        lineWidth: s.lineWidth,
        lineDash: [...s.lineDash],
        isCircularClip: s.isCircularClip,
        textMatrix: [...s.textMatrix],
      });

      let lastPathHadCurves = false;
      let lastPathIsSquareish = false;

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i] as unknown[];

        if (fn === pdfjsLib.OPS.save) {
          stateStack.push(cloneState(state));
        } else if (fn === pdfjsLib.OPS.restore) {
          if (stateStack.length > 0) {
            state = stateStack.pop()!;
          }
        } else if (fn === pdfjsLib.OPS.transform) {
          if (args && args.length === 6) {
            state.matrix = multiplyTransforms(state.matrix, args as number[]);
          }
        } else if (fn === pdfjsLib.OPS.paintFormXObjectBegin) {
          stateStack.push(cloneState(state));
          if (Array.isArray(args?.[0]) && (args[0] as number[]).length === 6) {
            state.matrix = multiplyTransforms(state.matrix, args[0] as number[]);
          }
        } else if (fn === pdfjsLib.OPS.paintFormXObjectEnd) {
          if (stateStack.length > 0) {
            state = stateStack.pop()!;
          }
        } else if (fn === pdfjsLib.OPS.setFillRGBColor) {
          state.fillColor = parsePdfColor(args, "rgb") || state.fillColor;
        } else if (fn === pdfjsLib.OPS.setFillGray) {
          state.fillColor = parsePdfColor(args, "gray") || state.fillColor;
        } else if (fn === pdfjsLib.OPS.setFillCMYKColor) {
          state.fillColor = parsePdfColor(args, "cmyk") || state.fillColor;
        } else if (fn === pdfjsLib.OPS.setFillTransparent) {
          state.fillColor = "transparent";
        } else if (fn === pdfjsLib.OPS.setStrokeRGBColor) {
          state.strokeColor = parsePdfColor(args, "rgb") || state.strokeColor;
        } else if (fn === pdfjsLib.OPS.setStrokeGray) {
          state.strokeColor = parsePdfColor(args, "gray") || state.strokeColor;
        } else if (fn === pdfjsLib.OPS.setStrokeCMYKColor) {
          state.strokeColor = parsePdfColor(args, "cmyk") || state.strokeColor;
        } else if (fn === pdfjsLib.OPS.setStrokeTransparent) {
          state.strokeColor = "transparent";
        } else if (fn === pdfjsLib.OPS.setLineWidth) {
          const lw = Number(args?.[0]);
          if (!Number.isNaN(lw)) state.lineWidth = lw;
        } else if (fn === pdfjsLib.OPS.setDash) {
          if (Array.isArray(args?.[0])) {
            state.lineDash = (args[0] as number[]).map(Number);
          }
        } else if (fn === pdfjsLib.OPS.setTextMatrix) {
          if (args && args.length === 6) {
            state.textMatrix = args.map(Number);
          }
        } else if (fn === pdfjsLib.OPS.moveText || fn === pdfjsLib.OPS.setLeadingMoveText) {
          if (args && args.length >= 2) {
            state.textMatrix = multiplyTransforms(state.textMatrix, [
              1,
              0,
              0,
              1,
              Number(args[0]) || 0,
              Number(args[1]) || 0,
            ]);
          }
        } else if (
          fn === pdfjsLib.OPS.showText ||
          fn === pdfjsLib.OPS.showSpacedText ||
          fn === pdfjsLib.OPS.nextLineShowText ||
          fn === pdfjsLib.OPS.nextLineSetSpacingShowText
        ) {
          const combined = multiplyTransforms(state.matrix, state.textMatrix);
          textDrawEvents.push({
            color: state.fillColor !== "transparent" ? state.fillColor : "#111111",
            x: combined[4],
            y: pageH - combined[5],
          });
        } else if (fn === pdfjsLib.OPS.clip || fn === pdfjsLib.OPS.eoClip) {
          if (lastPathHadCurves && lastPathIsSquareish) {
            state.isCircularClip = true;
          }
        } else if (fn === pdfjsLib.OPS.constructPath) {
          const pathOp = Number(args?.[0]);
          const dataContainer = args?.[1] as Array<ArrayLike<number>> | undefined;
          const drawData = dataContainer?.[0];
          const built = drawData ? buildSvgPathFromDrawOps(drawData, state.matrix, pageH) : null;

          if (built) {
            const w = built.right - built.left;
            const h = built.bottom - built.top;
            lastPathHadCurves = built.hasCurves;
            lastPathIsSquareish = w > 12 && h > 12 && w / h > 0.7 && w / h < 1.4;

            if (pathOp === pdfjsLib.OPS.clip || pathOp === pdfjsLib.OPS.eoClip) {
              if (lastPathHadCurves && lastPathIsSquareish) {
                state.isCircularClip = true;
              }
            } else if (pathOp !== pdfjsLib.OPS.endPath) {
              const hasFill =
                (pathOp === pdfjsLib.OPS.fill ||
                  pathOp === pdfjsLib.OPS.eoFill ||
                  pathOp === pdfjsLib.OPS.fillStroke ||
                  pathOp === pdfjsLib.OPS.eoFillStroke ||
                  pathOp === pdfjsLib.OPS.closeFillStroke ||
                  pathOp === pdfjsLib.OPS.closeEOFillStroke) &&
                state.fillColor !== "transparent";

              const hasStroke =
                (pathOp === pdfjsLib.OPS.stroke ||
                  pathOp === pdfjsLib.OPS.closeStroke ||
                  pathOp === pdfjsLib.OPS.fillStroke ||
                  pathOp === pdfjsLib.OPS.eoFillStroke ||
                  pathOp === pdfjsLib.OPS.closeFillStroke ||
                  pathOp === pdfjsLib.OPS.closeEOFillStroke) &&
                state.strokeColor !== "transparent";

              const dashStyle: "solid" | "dashed" | "dotted" =
                state.lineDash.length > 0
                  ? state.lineDash[0] <= 2.5
                    ? "dotted"
                    : "dashed"
                  : "solid";

              const scaleStroke = Math.hypot(state.matrix[0], state.matrix[1]) || 1;
              const effStrokeW = Math.max(0.75, state.lineWidth * scaleStroke);

              // Classify geometric role
              if (w >= pageW * 0.85 && h >= pageH * 0.85 && hasFill) {
                if (!isNearWhite(state.fillColor)) {
                  pageBgColor = state.fillColor;
                }
              } else if (h <= 4 && w >= 16 && (hasStroke || hasFill)) {
                pdfLines.push({
                  type: "h",
                  x1: built.left,
                  y1: (built.top + built.bottom) / 2,
                  x2: built.right,
                  y2: (built.top + built.bottom) / 2,
                  thickness: Math.max(1, h > 0.3 ? h : effStrokeW),
                  color: hasStroke ? state.strokeColor : state.fillColor,
                  dashStyle,
                });
              } else if (w <= 4 && h >= 12 && (hasStroke || hasFill)) {
                pdfLines.push({
                  type: "v",
                  x1: (built.left + built.right) / 2,
                  y1: built.top,
                  x2: (built.left + built.right) / 2,
                  y2: built.bottom,
                  thickness: Math.max(1, w > 0.3 ? w : effStrokeW),
                  color: hasStroke ? state.strokeColor : state.fillColor,
                  dashStyle,
                });
              } else if ((built.isSimpleRect || (w >= 45 && h >= 14)) && (hasFill || hasStroke)) {
                // Skip pure white unbordered rectangles
                if ((hasFill && !isNearWhite(state.fillColor)) || hasStroke) {
                  pdfRects.push({
                    left: built.left,
                    top: built.top,
                    right: built.right,
                    bottom: built.bottom,
                    width: w,
                    height: h,
                    fillColor: hasFill && !isNearWhite(state.fillColor) ? state.fillColor : undefined,
                    strokeColor: hasStroke ? state.strokeColor : undefined,
                    strokeWidth: hasStroke ? effStrokeW : undefined,
                    isRounded: built.hasCurves,
                  });
                }
              } else if (w >= 2 && h >= 2 && w <= 140 && h <= 140 && (hasFill || hasStroke)) {
                // Vector icon / logo / ornament path
                pdfVectorPaths.push({
                  d: built.d,
                  left: built.left,
                  top: built.top,
                  right: built.right,
                  bottom: built.bottom,
                  fillColor: hasFill ? state.fillColor : undefined,
                  strokeColor: hasStroke ? state.strokeColor : undefined,
                  strokeWidth: effStrokeW,
                });
              }
            }
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
                const imgW = Math.round(Math.hypot(state.matrix[0], state.matrix[1]));
                const imgH = Math.round(Math.hypot(state.matrix[2], state.matrix[3]));
                const imgX = Math.round(state.matrix[4]);
                const imgY = Math.round(pageH - state.matrix[5] - imgH);

                if (imgW >= 24 && imgH >= 24) {
                  const item = {
                    dataUrl,
                    x: imgX,
                    y: imgY,
                    width: imgW,
                    height: imgH,
                    isHeader: imgY < 160 && imgX < 250 && pageNum === 1,
                    isCircular: state.isCircularClip,
                    pageNum,
                  };
                  pageImages.push(item);
                  allExtractedImages.push(item);
                }
              }
            }
          } catch (imgErr) {
            console.warn("Image extract warning:", imgErr);
          }
        }
      }
    } catch (opErr) {
      console.warn("Operator list error on page", pageNum, opErr);
    }

    // Cluster vector shapes into inline SVG icons
    const vectorIcons = clusterVectorPathsToIcons(pdfVectorPaths);

    // 2. Extract clickable Link Annotations
    const pageLinkAnns: Array<{ url: string; left: number; top: number; right: number; bottom: number }> = [];
    try {
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype === "Link" && (ann.url || ann.unsafeUrl)) {
          const url = ann.url || ann.unsafeUrl;
          const rect = ann.rect as number[] | undefined;
          if (rect && rect.length === 4) {
            pageLinkAnns.push({
              url,
              left: Math.min(rect[0], rect[2]),
              right: Math.max(rect[0], rect[2]),
              top: pageH - Math.max(rect[1], rect[3]),
              bottom: pageH - Math.min(rect[1], rect[3]),
            });
          }
        }
      }
    } catch (annErr) {
      console.warn("PDF annotations extraction warning:", annErr);
    }

    // 3. Structured Text Extraction with Exact Font, Color, Background, & Link matching
    const textContent = await page.getTextContent();
    const stylesMap = (textContent.styles || {}) as Record<
      string,
      { fontFamily?: string; ascent?: number; descent?: number }
    >;
    const rawItems: PdfVisualItem[] = [];
    let fallbackEventIdx = 0;

    for (const rawItem of textContent.items) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as {
        str?: string;
        transform?: number[];
        fontName?: string;
        width?: number;
      };
      if (!item.str || !item.str.trim()) continue;

      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = Math.round(transform[4] * 10) / 10;
      const y = Math.round((pageH - transform[5]) * 10) / 10;
      const fontSize = Math.max(7.5, Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10);
      const fontName = item.fontName || "";
      const width = item.width || item.str.length * fontSize * 0.5;

      // Inspect commonObjs font descriptor for real font name/weight/italic
      let commonFontName = "";
      try {
        if (fontName && page.commonObjs.has(fontName)) {
          const fObj = page.commonObjs.get(fontName) as { name?: string } | undefined;
          if (fObj?.name) commonFontName = fObj.name;
        }
      } catch {
        // ignore
      }

      const fontInfo = resolveFontStyle(fontName, stylesMap[fontName], commonFontName);

      // Match text color from draw events by closest coordinate or sequential fallback
      let color = "#111111";
      if (textDrawEvents.length > 0) {
        let bestEvent = textDrawEvents[fallbackEventIdx];
        let bestDist = Infinity;
        for (let k = Math.max(0, fallbackEventIdx - 10); k < Math.min(textDrawEvents.length, fallbackEventIdx + 25); k++) {
          const ev = textDrawEvents[k];
          const dist = Math.hypot(ev.x - x, ev.y - y);
          if (dist < bestDist) {
            bestDist = dist;
            bestEvent = ev;
          }
        }
        if (bestDist < 40 && bestEvent) {
          color = bestEvent.color;
        } else if (textDrawEvents[fallbackEventIdx]) {
          color = textDrawEvents[fallbackEventIdx].color;
        }
        fallbackEventIdx++;
      }

      // Check if text sits inside a colored background rectangle
      const enclosingRect = pdfRects.find(
        (r) =>
          r.fillColor &&
          x >= r.left - 4 &&
          x <= r.right + 4 &&
          y >= r.top - 2 &&
          y <= r.bottom + fontSize
      );

      const matchedAnn = pageLinkAnns.find(
        (ann) => x >= ann.left - 8 && x <= ann.right + 8 && y >= ann.top - 4 && y <= ann.bottom + 4
      );

      rawItems.push({
        str: item.str,
        x,
        y,
        width,
        fontSize,
        isBold: fontInfo.isBold || fontSize >= 16,
        fontWeight: fontInfo.fontWeight,
        isItalic: fontInfo.isItalic,
        fontFamily: fontInfo.fontFamily,
        color,
        bgColor: enclosingRect?.fillColor,
        fontName,
        url: matchedAnn?.url,
      });
    }

    rawItems.sort((a, b) => (Math.abs(a.y - b.y) > 3.5 ? a.y - b.y : a.x - b.x));

    // Group into horizontal line buckets (tolerance 4px)
    const lineBuckets: Array<{ y: number; items: PdfVisualItem[] }> = [];
    for (const item of rawItems) {
      const existing = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4);
      if (existing) {
        existing.items.push(item);
      } else {
        lineBuckets.push({ y: item.y, items: [item] });
      }
    }

    const pagePlainText = lineBuckets
      .map((b) =>
        b.items
          .sort((a, c) => a.x - c.x)
          .map((it) => it.str)
          .join(" ")
      )
      .join("\n");
    allPageTexts.push(pagePlainText);

    // 4. Reconstruct Visual Page Sheet
    const pageElements: string[] = [];
    const profileImg = pageImages.find((img) => img.isHeader);

    // Detect if Page 1 is a structured CV Header (photo or big title + contacts at y < 155)
    const headerRows = lineBuckets.filter((b) => b.y < 155);
    const headerItems = headerRows.flatMap((r) => r.items);
    const isCvHeader =
      pageNum === 1 &&
      (Boolean(profileImg) ||
        (headerItems.some((it) => it.fontSize >= 15) &&
          headerItems.some(
            (it) => it.x >= 280 && (it.str.includes("@") || it.str.includes("+") || !!it.url)
          )));

    if (isCvHeader) {
      const nameItem = headerItems.find((it) => it.fontSize >= 16) || headerItems[0];
      const roleItem = headerItems.find((it) => it !== nameItem && it.x < 250 && it.fontSize >= 9.5);
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

      const headerBgRect = pdfRects.find(
        (r) => r.top < 30 && r.bottom <= 185 && r.width > pageW * 0.5 && r.fillColor
      );
      if (headerBgRect) headerBgRect.used = true;

      const headerLine = pdfLines.find(
        (l) => l.type === "h" && l.y1 >= 115 && l.y1 <= 170 && l.x2 - l.x1 > pageW * 0.4
      );
      if (headerLine) headerLine.used = true;

      const photoWidthPx = profileImg?.width ? Math.round(profileImg.width * 1.333) || 106 : 106;
      const photoRadius = profileImg?.isCircular ? "border-radius: 50%; object-fit: cover;" : "object-fit: contain;";
      const photoHtml = profileImg
        ? `<div style="flex-shrink: 0;">
            <img class="resizable-doc-img" src="${profileImg.dataUrl}" alt="Foto Profil" style="width: ${photoWidthPx}px; height: ${
            profileImg.isCircular ? `${photoWidthPx}px` : "auto"
          }; ${photoRadius} display: block; cursor: pointer; border: none; box-shadow: none;" />
          </div>`
        : "";

      const contactsHtml =
        contactItems.length > 0
          ? `<div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #111111; min-width: 200px;">
              ${contactItems
                .map((c) => {
                  const parsed = parseContactItem(c);
                  // Prefer actual PDF vector icon located right next to this contact item
                  const nearbyIcon = vectorIcons.find(
                    (ic) =>
                      !ic.used &&
                      ic.right <= c.x + 6 &&
                      c.x - ic.left < 34 &&
                      Math.abs((ic.top + ic.bottom) / 2 - (c.y - c.fontSize * 0.35)) < 12
                  );
                  if (nearbyIcon) nearbyIcon.used = true;

                  const iconSvg = nearbyIcon ? nearbyIcon.svgHtml : getContactSvg(parsed.type);
                  const textStyle = `color: ${c.color || "#111111"}; font-family: ${c.fontFamily}; font-size: ${Math.max(11, Math.min(13, c.fontSize))}px; text-decoration: none; display: inline-block; vertical-align: middle; line-height: 16px;`;
                  const content = parsed.href
                    ? `<a href="${parsed.href}" ${
                        parsed.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""
                      } style="${textStyle}">${escapeHtml(parsed.label)}</a>`
                    : `<span style="${textStyle}">${escapeHtml(parsed.label)}</span>`;
                  return `
                    <table class="pdf-contact-row" style="border: none !important; border-collapse: collapse !important; margin: 0 0 3px 0 !important; padding: 0 !important; width: auto !important; background: transparent !important; line-height: 1 !important;">
                      <tbody>
                        <tr style="border: none !important; background: transparent !important; height: 16px !important;">
                          <td class="pdf-contact-cell" style="border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 16px !important; height: 16px !important; text-align: center !important; background: transparent !important; line-height: 1 !important;">
                            ${iconSvg}
                          </td>
                          <td class="pdf-contact-cell" style="border: none !important; padding: 0 !important; vertical-align: middle !important; font-size: 12px !important; line-height: 16px !important; height: 16px !important; color: ${c.color || "#111111"} !important; background: transparent !important; white-space: nowrap !important;">
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

      const headerBorderStyle = headerLine
        ? `${Math.max(1, headerLine.thickness)}px ${headerLine.dashStyle} ${headerLine.color}`
        : "1px dotted #888888";
      const headerBgStyle = headerBgRect?.fillColor
        ? `background-color: ${headerBgRect.fillColor}; padding: 18px 20px; border-radius: ${
            headerBgRect.isRounded ? "8px" : "2px"
          };`
        : "";

      pageElements.push(`
        <div class="pdf-cv-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 20px; border-bottom: ${headerBorderStyle}; margin-bottom: 20px; ${headerBgStyle}">
          <div style="display: flex; align-items: flex-start; gap: 20px;">
            ${photoHtml}
            <div>
              <h1 style="font-size: ${nameItem?.fontSize ? Math.round(nameItem.fontSize * 1.1) : 24}px; font-weight: ${
        nameItem?.fontWeight || 700
      }; font-family: ${nameItem?.fontFamily || "inherit"}; color: ${
        nameItem?.color || "#111111"
      }; margin: 0 0 4px 0; letter-spacing: -0.2px;">${escapeHtml(nameItem?.str || "")}</h1>
              ${
                roleItem
                  ? `<div style="font-size: ${Math.max(12.5, roleItem.fontSize)}px; font-weight: ${
                      roleItem.fontWeight || 500
                    }; font-style: ${roleItem.isItalic ? "italic" : "normal"}; font-family: ${
                      roleItem.fontFamily
                    }; color: ${roleItem.color || "#555555"}; margin-top: 2px;">${escapeHtml(
                      roleItem.str
                    )}</div>`
                  : ""
              }
            </div>
          </div>
          ${contactsHtml}
        </div>
      `);

      const bodyBuckets = lineBuckets.filter((b) => b.y >= 155);
      renderPageBuckets(bodyBuckets, pageElements, pageH, pdfLines, pdfRects, vectorIcons);
    } else {
      renderPageBuckets(lineBuckets, pageElements, pageH, pdfLines, pdfRects, vectorIcons);
    }

    // Append body images
    const bodyImages = pageImages.filter((img) => img !== profileImg);
    for (const bImg of bodyImages) {
      const radiusStyle = bImg.isCircular ? "border-radius: 50%; object-fit: cover;" : "object-fit: contain;";
      pageElements.push(`
        <div class="doc-body-image" style="text-align: center; margin: 16px 0;">
          <img class="resizable-doc-img" src="${bImg.dataUrl}" alt="Gambar Dokumen" style="width: ${Math.min(
        640,
        Math.max(80, Math.round(bImg.width * 1.333))
      )}px; max-width: 100%; height: auto; ${radiusStyle} display: inline-block; cursor: pointer;" />
        </div>
      `);
    }

    pageSheetsHtml.push(`
      <div class="pdf-page-sheet doc-page-sheet" style="width: 100%; max-width: 794px; min-height: 1050px; margin: 0 auto 32px auto; background-color: ${pageBgColor}; padding: 48px 56px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 4px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222; position: relative;">
        ${pageElements.join("\n")}
      </div>
    `);
  }

  return {
    text: allPageTexts.join("\n\n") || "Dokumen PDF kosong atau berbasis gambar scan.",
    html: pageSheetsHtml.join("\n"),
    images: allExtractedImages.map((img) => img.dataUrl),
  };
}

function renderRunHtml(it: PdfVisualItem): string {
  const styles: string[] = [
    `color: ${it.color || "#111111"}`,
    `font-family: ${it.fontFamily}`,
    `font-weight: ${it.fontWeight}`,
    `font-size: ${Math.max(10, Math.round(it.fontSize * 10) / 10)}px`,
  ];
  if (it.isItalic) styles.push("font-style: italic");
  if (it.bgColor) styles.push(`background-color: ${it.bgColor}; padding: 1px 4px; border-radius: 2px`);

  const inner = escapeHtml(it.str);
  if (it.url) {
    return `<a href="${it.url}" target="_blank" rel="noopener noreferrer" style="${styles.join(
      "; "
    )}; text-decoration: none;">${inner}</a>`;
  }
  return `<span style="${styles.join("; ")};">${inner}</span>`;
}

function renderPageBuckets(
  buckets: Array<{ y: number; items: PdfVisualItem[] }>,
  output: string[],
  pageHeight: number,
  pdfLines: PdfLine[],
  pdfRects: PdfRect[],
  vectorIcons: ClusteredSvgIcon[]
) {
  let i = 0;
  while (i < buckets.length) {
    const bucket = buckets[i];
    bucket.items.sort((a, b) => a.x - b.x);

    // Page number footer
    if (bucket.y > pageHeight - 45) {
      output.push(
        `<div style="text-align: right; font-size: 11px; color: #888888; margin-top: 24px;">${escapeHtml(
          bucket.items.map((it) => it.str).join(" ")
        )}</div>`
      );
      i++;
      continue;
    }

    // Check if consecutive rows belong to a bordered grid / table in PDF
    const verticalLinesPresent = pdfLines.filter((l) => l.type === "v").length >= 2;
    if (verticalLinesPresent && bucket.items.length >= 2) {
      const tableBuckets: Array<{ y: number; items: PdfVisualItem[] }> = [bucket];
      let j = i + 1;
      while (j < buckets.length) {
        const nextB = buckets[j];
        nextB.items.sort((a, b) => a.x - b.x);
        const insideTableGrid = pdfLines.some(
          (l) => l.type === "v" && nextB.y >= l.y1 - 8 && nextB.y <= l.y2 + 8
        );
        if (insideTableGrid && nextB.items.length >= 2 && nextB.y - tableBuckets[tableBuckets.length - 1].y < 55) {
          tableBuckets.push(nextB);
          j++;
        } else {
          break;
        }
      }

      if (tableBuckets.length >= 2) {
        const borderSample = pdfLines.find((l) => l.type === "h" || l.type === "v");
        const borderCss = borderSample
          ? `${Math.max(1, borderSample.thickness)}px ${borderSample.dashStyle} ${borderSample.color}`
          : "1px solid #cbd5e1";

        const maxCols = Math.max(...tableBuckets.map((tb) => tb.items.length));
        const rowsHtml = tableBuckets
          .map((tb, rIdx) => {
            const rowBg = tb.items.find((it) => it.bgColor)?.bgColor;
            const cells = Array.from({ length: maxCols }).map((_, cIdx) => {
              const cellItem = tb.items[cIdx];
              const bg = cellItem?.bgColor || rowBg || (rIdx === 0 ? "#f8fafc" : "transparent");
              const tag = rIdx === 0 && cellItem?.isBold ? "th" : "td";
              return `<${tag} style="border: ${borderCss}; padding: 6px 10px; background-color: ${bg}; text-align: left; vertical-align: middle;">${
                cellItem ? renderRunHtml(cellItem) : ""
              }</${tag}>`;
            });
            return `<tr>${cells.join("")}</tr>`;
          })
          .join("");

        output.push(
          `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: ${borderCss};"><tbody>${rowsHtml}</tbody></table>`
        );
        i = j;
        continue;
      }
    }

    const first = bucket.items[0];
    let fullLineStr = bucket.items.map((it) => it.str).join(" ").trim();
    fullLineStr = fullLineStr
      .replace(/\bSUMM\s+ARY\b/gi, "SUMMARY")
      .replace(/\bL\s+ANGUAGES\b/gi, "LANGUAGES")
      .replace(/[\s\u200B\uFEFF⋮·:;|]+$/g, "")
      .trim();

    // Check if an actual PDF horizontal line lies directly underneath this line
    const underline = pdfLines.find(
      (l) => !l.used && l.type === "h" && l.y1 >= bucket.y - 2 && l.y1 <= bucket.y + 14 && l.x2 - l.x1 > 80
    );

    // Check if an unused colored banner/card rect encloses this line
    const cardRect = pdfRects.find(
      (r) =>
        !r.used &&
        r.width > 120 &&
        r.height >= 16 &&
        r.height <= 45 &&
        bucket.y >= r.top - 2 &&
        bucket.y <= r.bottom + 6 &&
        (r.fillColor || r.strokeColor)
    );

    const isHeading =
      bucket.items.length <= 2 &&
      (first.fontSize >= 10.5 || first.isBold) &&
      (/^(ringkasan|summary|profil|profile|pengalaman|experience|proyek|projects|pendidikan|education|keahlian|skills|kemampuan|sertifikasi|certificates|bahasa|languages|awards|organisasi)/i.test(
        fullLineStr
      ) ||
        (first.str === first.str.toUpperCase() && first.str.length >= 3 && !first.str.includes("@")) ||
        Boolean(underline));

    // Find any unused vector icon located right to the left of this line
    const leftIcon = vectorIcons.find(
      (ic) =>
        !ic.used &&
        ic.right <= first.x + 6 &&
        first.x - ic.left < 28 &&
        Math.abs((ic.top + ic.bottom) / 2 - (bucket.y - first.fontSize * 0.35)) < 10
    );
    if (leftIcon) leftIcon.used = true;

    if (isHeading) {
      if (underline) underline.used = true;
      if (cardRect) cardRect.used = true;
      const borderBottomCss = underline
        ? `${Math.max(1, underline.thickness)}px ${underline.dashStyle} ${underline.color}`
        : cardRect?.fillColor
        ? "none"
        : "1px dotted #888888";
      const bgCss = cardRect?.fillColor
        ? `background-color: ${cardRect.fillColor}; padding: 6px 10px; border-radius: ${
            cardRect.isRounded ? "4px" : "2px"
          };`
        : "";
      const iconPrefix = leftIcon ? `${leftIcon.svgHtml}` : "";

      if (iconPrefix) {
        output.push(`
          <div style="display: flex; align-items: center; gap: 8px; border-bottom: ${borderBottomCss}; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; ${bgCss}">
            ${iconPrefix}
            <h2 style="font-size: ${Math.max(13, Math.round(first.fontSize * 1.05))}px; font-weight: ${
          first.fontWeight || 700
        }; font-family: ${first.fontFamily}; color: ${
          first.color || "#111111"
        }; margin: 0; letter-spacing: 0.6px;">${escapeHtml(fullLineStr)}</h2>
          </div>
        `);
      } else {
        output.push(`
          <h2 style="font-size: ${Math.max(13, Math.round(first.fontSize * 1.05))}px; font-weight: ${
          first.fontWeight || 700
        }; font-family: ${first.fontFamily}; color: ${
          first.color || "#111111"
        }; border-bottom: ${borderBottomCss}; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; letter-spacing: 0.6px; ${bgCss}">
            ${escapeHtml(fullLineStr)}
          </h2>
        `);
      }
      i++;
      continue;
    }

    // Standalone horizontal divider line above this row
    const standaloneLineAbove = pdfLines.find(
      (l) =>
        !l.used &&
        l.type === "h" &&
        l.y1 < bucket.y - 8 &&
        l.y1 >= (i > 0 ? buckets[i - 1].y + 4 : 0) &&
        l.x2 - l.x1 > 80
    );
    if (standaloneLineAbove) {
      standaloneLineAbove.used = true;
      output.push(
        `<hr class="doc-divider" style="border: none; border-top: ${Math.max(
          1,
          standaloneLineAbove.thickness
        )}px ${standaloneLineAbove.dashStyle} ${standaloneLineAbove.color}; margin: 10px 0;" />`
      );
    }

    // 2-column split (Title left, Date/Value right)
    if (bucket.items.length === 2 && bucket.items[1].x - bucket.items[0].x > 100) {
      const left = bucket.items[0];
      const right = bucket.items[1];
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; margin-bottom: 2px;">
          <div>${renderRunHtml(left)}</div>
          <div style="text-align: right;">${renderRunHtml(right)}</div>
        </div>
      `);
      i++;
      continue;
    }

    // 3-column split
    if (bucket.items.length === 3 && bucket.items[2].x - bucket.items[0].x > 160) {
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0;">
          <span style="width: 45%;">${renderRunHtml(bucket.items[0])}</span>
          <span style="width: 30%;">${renderRunHtml(bucket.items[1])}</span>
          <span style="width: 25%; text-align: right;">${renderRunHtml(bucket.items[2])}</span>
        </div>
      `);
      i++;
      continue;
    }

    // 4-column split
    if (bucket.items.length === 4 && bucket.items[3].x - bucket.items[0].x > 180) {
      output.push(`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0;">
          <span style="width: 25%;">${renderRunHtml(bucket.items[0])}</span>
          <span style="width: 25%;">${renderRunHtml(bucket.items[1])}</span>
          <span style="width: 25%;">${renderRunHtml(bucket.items[2])}</span>
          <span style="width: 25%; text-align: right;">${renderRunHtml(bucket.items[3])}</span>
        </div>
      `);
      i++;
      continue;
    }

    // Card/badge background enclosing line
    const boxStyle = cardRect
      ? (() => {
          cardRect.used = true;
          const b = cardRect.strokeColor
            ? `border: ${cardRect.strokeWidth || 1}px solid ${cardRect.strokeColor};`
            : "";
          const bg = cardRect.fillColor ? `background-color: ${cardRect.fillColor};` : "";
          return `${bg} ${b} padding: 6px 10px; border-radius: ${cardRect.isRounded ? "6px" : "2px"}; margin: 6px 0;`;
        })()
      : "";

    const lineHtml = bucket.items.map((it) => renderRunHtml(it)).join(" ");

    if (leftIcon) {
      output.push(`
        <table class="pdf-contact-row" style="border: none !important; border-collapse: collapse !important; margin: 2px 0 4px 0 !important; padding: 0 !important; width: auto !important; background: transparent !important;">
          <tbody>
            <tr style="border: none !important; background: transparent !important;">
              <td class="pdf-contact-cell" style="border: none !important; padding: 0 8px 0 0 !important; vertical-align: middle !important; width: 16px !important; text-align: center !important; background: transparent !important;">
                ${leftIcon.svgHtml}
              </td>
              <td class="pdf-contact-cell" style="border: none !important; padding: 0 !important; vertical-align: middle !important; background: transparent !important;">
                ${lineHtml}
              </td>
            </tr>
          </tbody>
        </table>
      `);
    } else {
      output.push(`
        <p style="margin: 4px 0 6px 0; line-height: 1.5; ${boxStyle}">
          ${lineHtml}
        </p>
      `);
    }

    i++;
  }
}
