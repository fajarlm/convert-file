import * as XLSX from "xlsx";
import { CellStyleInfo, SheetMergeRange } from "./types";

export interface XlsxExtractionResult {
  sheetData: (string | number)[][];
  sheetName: string;
  sheetStyles: Record<string, CellStyleInfo>;
  sheetMerges: SheetMergeRange[];
  sheetColWidths: number[];
  sheetRowHeights: number[];
  images: string[];
}

// Standard Office OpenXML indexed colors (first 64)
const INDEXED_COLORS: Record<number, string> = {
  0: "#000000", 1: "#FFFFFF", 2: "#FF0000", 3: "#00FF00", 4: "#0000FF",
  5: "#FFFF00", 6: "#FF00FF", 7: "#00FFFF", 8: "#000000", 9: "#FFFFFF",
  10: "#FF0000", 11: "#00FF00", 12: "#0000FF", 13: "#FFFF00", 14: "#FF00FF",
  15: "#00FFFF", 16: "#800000", 17: "#008000", 18: "#000080", 19: "#808000",
  20: "#800080", 21: "#008080", 22: "#C0C0C0", 23: "#808080", 24: "#9999FF",
  25: "#993366", 26: "#FFFFCC", 27: "#CCFFFF", 28: "#660066", 29: "#FF8080",
  30: "#0066CC", 31: "#CCCCFF", 32: "#000080", 33: "#FF00FF", 34: "#FFFF00",
  35: "#00FFFF", 36: "#800080", 37: "#800000", 38: "#008080", 39: "#0000FF",
  40: "#00CCFF", 41: "#CCFFFF", 42: "#CCFFCC", 43: "#FFFF99", 44: "#99CCFF",
  45: "#FF99CC", 46: "#CC99FF", 47: "#FFCC99", 48: "#3366FF", 49: "#33CCCC",
  50: "#99CC00", 51: "#FFCC00", 52: "#FF9900", 53: "#FF6600", 54: "#666699",
  55: "#969696", 56: "#003366", 57: "#339966", 58: "#003300", 59: "#333300",
  60: "#993300", 61: "#993366", 62: "#333399", 63: "#333333",
};

const DEFAULT_THEME_COLORS = [
  "#FFFFFF", "#000000", "#E7E6E6", "#44546A",
  "#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5", "#70AD47",
];

function applyTintToHex(hex: string, tint: number): string {
  if (!tint || Number.isNaN(tint)) return hex;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);
  if (tint < 0) {
    const f = 1 + tint;
    r = Math.round(r * f);
    g = Math.round(g * f);
    b = Math.round(b * f);
  } else {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  }
  return (
    "#" +
    [r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("")
  );
}

function resolveOpenXmlColor(
  colorEl: Element | null,
  themeColors: string[]
): string | undefined {
  if (!colorEl) return undefined;
  const rgb = colorEl.getAttribute("rgb");
  if (rgb) {
    const hex = rgb.length === 8 ? `#${rgb.slice(2)}` : `#${rgb}`;
    return hex.toUpperCase();
  }
  const themeIdxStr = colorEl.getAttribute("theme");
  if (themeIdxStr !== null) {
    const idx = parseInt(themeIdxStr, 10);
    // OOXML swaps 0/1 (lt1/dk1) vs 2/3 in some themes, standard order lt1=0, dk1=1, lt2=2, dk2=3
    const base = themeColors[idx] || DEFAULT_THEME_COLORS[idx] || "#000000";
    const tint = parseFloat(colorEl.getAttribute("tint") || "0");
    return applyTintToHex(base, tint);
  }
  const indexedStr = colorEl.getAttribute("indexed");
  if (indexedStr !== null) {
    const idx = parseInt(indexedStr, 10);
    return INDEXED_COLORS[idx];
  }
  return undefined;
}

function colRefToIndex(ref: string): { r: number; c: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { r: 0, c: 0 };
  const letters = match[1].toUpperCase();
  const rowNum = parseInt(match[2], 10) - 1;
  let colNum = 0;
  for (let i = 0; i < letters.length; i++) {
    colNum = colNum * 26 + (letters.charCodeAt(i) - 64);
  }
  return { r: rowNum, c: colNum - 1 };
}

function indexToColLetters(c: number): string {
  let label = "";
  let i = c;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

function parseBorderSide(sideEl: Element | null, themeColors: string[]): string | undefined {
  if (!sideEl) return undefined;
  const style = sideEl.getAttribute("style");
  if (!style || style === "none") return undefined;
  const colorEl = sideEl.querySelector("color");
  const color = resolveOpenXmlColor(colorEl, themeColors) || "#333333";
  if (style === "medium") return `2px solid ${color}`;
  if (style === "thick") return `3px solid ${color}`;
  if (style === "double") return `3px double ${color}`;
  if (style === "dashed" || style === "mediumDashed") return `1.5px dashed ${color}`;
  if (style === "dotted" || style === "hair") return `1px dotted ${color}`;
  return `1px solid ${color}`;
}

export async function extractFromSpreadsheet(
  buffer: ArrayBuffer,
  ext: "xlsx" | "csv"
): Promise<XlsxExtractionResult> {
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
  const sheetName = workbook.SheetNames[0] || "Sheet1";
  const worksheet = workbook.Sheets[sheetName];
  const sheetData =
    (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as (string | number)[][]) || [["", ""]];

  const sheetMerges: SheetMergeRange[] = (worksheet["!merges"] || []).map((m) => ({
    s: { r: m.s.r, c: m.s.c },
    e: { r: m.e.r, c: m.e.c },
  }));

  const sheetColWidths: number[] = (worksheet["!cols"] || []).map((col) => {
    if (col?.wpx) return Math.max(60, Math.round(col.wpx));
    if (col?.wch) return Math.max(60, Math.round(col.wch * 8 + 16));
    return 140;
  });

  const sheetRowHeights: number[] = (worksheet["!rows"] || []).map((row) =>
    row?.hpx ? Math.round(row.hpx) : row?.hpt ? Math.round(row.hpt * 1.33) : 34
  );

  const sheetStyles: Record<string, CellStyleInfo> = {};
  const excelImages: string[] = [];

  if (ext === "xlsx" && typeof DOMParser !== "undefined") {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);

      // 1. Extract images
      const mediaFiles = Object.keys(zip.files).filter(
        (p) => p.startsWith("xl/media/") && !zip.files[p].dir
      );
      for (const p of mediaFiles) {
        const fileExt = p.split(".").pop()?.toLowerCase() || "png";
        const mime =
          fileExt === "jpg" || fileExt === "jpeg"
            ? "image/jpeg"
            : fileExt === "svg"
            ? "image/svg+xml"
            : "image/png";
        const base64 = await zip.files[p].async("base64");
        excelImages.push(`data:${mime};base64,${base64}`);
      }

      // 2. Parse Theme Colors (xl/theme/theme1.xml)
      const themeColors = [...DEFAULT_THEME_COLORS];
      const themeFile = zip.file("xl/theme/theme1.xml");
      if (themeFile) {
        const themeXml = await themeFile.async("text");
        const tDoc = new DOMParser().parseFromString(themeXml, "application/xml");
        const clrScheme = tDoc.getElementsByTagNameNS("*", "clrScheme")[0];
        if (clrScheme) {
          const order = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6"];
          order.forEach((tag, idx) => {
            const node = clrScheme.getElementsByTagNameNS("*", tag)[0];
            const srgb = node?.getElementsByTagNameNS("*", "srgbClr")[0]?.getAttribute("val");
            const sys = node?.getElementsByTagNameNS("*", "sysClr")[0]?.getAttribute("lastClr");
            const hex = srgb || sys;
            if (hex) themeColors[idx] = `#${hex}`;
          });
        }
      }

      // 3. Parse xl/styles.xml
      const stylesFile = zip.file("xl/styles.xml");
      const xfStyleList: CellStyleInfo[] = [];

      if (stylesFile) {
        const stylesXml = await stylesFile.async("text");
        const sDoc = new DOMParser().parseFromString(stylesXml, "application/xml");

        // Fonts
        const fonts = Array.from(sDoc.querySelectorAll("fonts > font")).map((fEl) => {
          const b = Boolean(fEl.querySelector("b"));
          const i = Boolean(fEl.querySelector("i"));
          const u = Boolean(fEl.querySelector("u"));
          const sz = parseFloat(fEl.querySelector("sz")?.getAttribute("val") || "11");
          const name = fEl.querySelector("name")?.getAttribute("val");
          const color = resolveOpenXmlColor(fEl.querySelector("color"), themeColors);
          return {
            fontWeight: b ? "bold" : undefined,
            fontStyle: i ? "italic" : undefined,
            textDecoration: u ? "underline" : undefined,
            fontSize: Number.isNaN(sz) ? undefined : Math.round(sz * 1.25),
            fontFamily: name || undefined,
            color,
          };
        });

        // Fills
        const fills = Array.from(sDoc.querySelectorAll("fills > fill")).map((fillEl) => {
          const pat = fillEl.querySelector("patternFill");
          const patType = pat?.getAttribute("patternType");
          if (!pat || patType === "none" || patType === "gray125") return undefined;
          const fg = resolveOpenXmlColor(pat.querySelector("fgColor"), themeColors);
          return fg;
        });

        // Borders
        const borders = Array.from(sDoc.querySelectorAll("borders > border")).map((bEl) => ({
          borderTop: parseBorderSide(bEl.querySelector("top"), themeColors),
          borderRight: parseBorderSide(bEl.querySelector("right"), themeColors),
          borderBottom: parseBorderSide(bEl.querySelector("bottom"), themeColors),
          borderLeft: parseBorderSide(bEl.querySelector("left"), themeColors),
        }));

        // CellXfs
        const xfs = Array.from(sDoc.querySelectorAll("cellXfs > xf"));
        for (const xf of xfs) {
          const fontId = parseInt(xf.getAttribute("fontId") || "0", 10);
          const fillId = parseInt(xf.getAttribute("fillId") || "0", 10);
          const borderId = parseInt(xf.getAttribute("borderId") || "0", 10);
          const alignEl = xf.querySelector("alignment");
          const hAlign = alignEl?.getAttribute("horizontal") as "left" | "center" | "right" | null;
          const vAlign = alignEl?.getAttribute("vertical") as "top" | "middle" | "bottom" | null;

          const f = fonts[fontId] || {};
          const bg = fills[fillId];
          const b = borders[borderId] || {};

          xfStyleList.push({
            ...f,
            ...(bg ? { backgroundColor: bg } : {}),
            ...b,
            ...(hAlign ? { textAlign: hAlign } : {}),
            ...(vAlign ? { verticalAlign: vAlign } : {}),
          });
        }
      }

      // 4. Map cell styles from xl/worksheets/sheet1.xml
      const sheetFiles = Object.keys(zip.files)
        .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
        .sort();
      const firstSheetFile = sheetFiles[0] ? zip.file(sheetFiles[0]) : null;

      if (firstSheetFile && xfStyleList.length > 0) {
        const sheetXml = await firstSheetFile.async("text");
        const wsDoc = new DOMParser().parseFromString(sheetXml, "application/xml");
        const cells = wsDoc.querySelectorAll("sheetData > row > c");
        cells.forEach((cEl) => {
          const ref = cEl.getAttribute("r");
          const sAttr = cEl.getAttribute("s");
          if (!ref || sAttr === null) return;
          const styleIdx = parseInt(sAttr, 10);
          const styleObj = xfStyleList[styleIdx];
          if (styleObj && Object.keys(styleObj).length > 0) {
            const { r, c } = colRefToIndex(ref);
            sheetStyles[`${r}:${c}`] = styleObj;
          }
        });
      }
    } catch (xlsxErr) {
      console.warn("XLSX style/media extraction warning:", xlsxErr);
    }
  }

  return {
    sheetData:
      sheetData.length > 0 ? sheetData : [["Data A", "Data B"], ["Contoh 1", "Contoh 2"]],
    sheetName,
    sheetStyles,
    sheetMerges,
    sheetColWidths,
    sheetRowHeights,
    images: excelImages,
  };
}

/**
 * Patch cell values inside original .xlsx buffer while keeping 100% of original styles,
 * backgrounds, borders, fonts, column widths, merged cells, and embedded images.
 */
export async function exportStyledXlsx(
  sheetData: (string | number)[][],
  sheetName: string,
  outputFileName: string,
  rawBuffer?: ArrayBuffer
): Promise<void> {
  if (rawBuffer && typeof DOMParser !== "undefined") {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(rawBuffer);
      const sheetFiles = Object.keys(zip.files)
        .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
        .sort();
      const firstSheetPath = sheetFiles[0];
      const sheetFile = firstSheetPath ? zip.file(firstSheetPath) : null;

      if (sheetFile) {
        const xmlText = await sheetFile.async("text");
        const doc = new DOMParser().parseFromString(xmlText, "application/xml");
        const ns = doc.documentElement.namespaceURI || "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
        const sheetDataEl = doc.getElementsByTagNameNS("*", "sheetData")[0];

        if (sheetDataEl) {
          // Index existing <row> and <c> nodes to keep exact `s` (style index) attributes
          const rowMap = new Map<number, Element>();
          Array.from(sheetDataEl.children).forEach((rowEl) => {
            const rIdx = parseInt(rowEl.getAttribute("r") || "0", 10);
            if (rIdx > 0) rowMap.set(rIdx, rowEl);
          });

          for (let r = 0; r < sheetData.length; r++) {
            const rowNum = r + 1;
            let rowEl = rowMap.get(rowNum);
            if (!rowEl) {
              rowEl = doc.createElementNS(ns, "row");
              rowEl.setAttribute("r", String(rowNum));
              sheetDataEl.appendChild(rowEl);
              rowMap.set(rowNum, rowEl);
            }

            const cellMap = new Map<string, Element>();
            Array.from(rowEl.children).forEach((cEl) => {
              const ref = cEl.getAttribute("r");
              if (ref) cellMap.set(ref, cEl);
            });

            const rowVals = sheetData[r] || [];
            for (let c = 0; c < rowVals.length; c++) {
              const ref = `${indexToColLetters(c)}${rowNum}`;
              const rawVal = rowVals[c];
              let cellEl = cellMap.get(ref);
              if (!cellEl) {
                if (rawVal === "" || rawVal === null || rawVal === undefined) continue;
                cellEl = doc.createElementNS(ns, "c");
                cellEl.setAttribute("r", ref);
                rowEl.appendChild(cellEl);
              }

              // Preserve style attribute `s`, clear old children (`v`, `f`, `is`)
              while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);

              if (rawVal === "" || rawVal === null || rawVal === undefined) {
                cellEl.removeAttribute("t");
              } else if (typeof rawVal === "number" && !Number.isNaN(rawVal)) {
                cellEl.removeAttribute("t");
                const vEl = doc.createElementNS(ns, "v");
                vEl.textContent = String(rawVal);
                cellEl.appendChild(vEl);
              } else {
                const strVal = String(rawVal);
                if (/^-?\d+(\.\d+)?$/.test(strVal.trim()) && !strVal.startsWith("0")) {
                  cellEl.removeAttribute("t");
                  const vEl = doc.createElementNS(ns, "v");
                  vEl.textContent = strVal.trim();
                  cellEl.appendChild(vEl);
                } else {
                  cellEl.setAttribute("t", "inlineStr");
                  const isEl = doc.createElementNS(ns, "is");
                  const tEl = doc.createElementNS(ns, "t");
                  tEl.setAttribute("xml:space", "preserve");
                  tEl.textContent = strVal;
                  isEl.appendChild(tEl);
                  cellEl.appendChild(isEl);
                }
              }
            }
          }

          const updatedXml = new XMLSerializer().serializeToString(doc);
          zip.file(firstSheetPath, updatedXml);
          const outBlob = await zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = URL.createObjectURL(outBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = outputFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }
      }
    } catch (patchErr) {
      console.warn("Styled XLSX patch fallback:", patchErr);
    }
  }

  // Fallback standard SheetJS export
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  XLSX.writeFile(wb, outputFileName);
}
