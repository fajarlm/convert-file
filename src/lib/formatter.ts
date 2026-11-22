/**
 * DocMorph Smart Document Formatter & AI Layout Assistant
 * Restructures raw/messy PDF extracted text into clean, easily editable,
 * semantic HTML documents with natural flow (headings, bullets, contact chips, paragraphs).
 */

import { getUserGeminiKey } from "./translator";

export type FormatPreset = "auto" | "cv" | "formal" | "clean_lines";

export interface ExtractedImage {
  dataUrl: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isHeader?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function smartFormatLocal(
  rawTextOrHtml: string,
  extractedImages: ExtractedImage[] = []
): string {
  // Preserve any existing <img> tags from HTML before stripping
  const existingImgs: string[] = [];
  if (rawTextOrHtml.includes("<img")) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(rawTextOrHtml)) !== null) {
      if (match[1] && !existingImgs.includes(match[1])) {
        existingImgs.push(match[1]);
      }
    }
  }

  // Combine with extractedImages
  const allImages: ExtractedImage[] = [...extractedImages];
  for (const src of existingImgs) {
    if (!allImages.some((img) => img.dataUrl === src)) {
      allImages.push({ dataUrl: src, isHeader: allImages.length === 0 });
    }
  }

  // Extract plain lines first if HTML is passed
  let text = rawTextOrHtml;
  if (typeof window !== "undefined" && (text.includes("<") && text.includes(">"))) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    text = tempDiv.innerText || tempDiv.textContent || text;
  }

  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0 && allImages.length === 0) {
    return "<p>Dokumen kosong. Silakan ketik atau tambahkan teks di sini.</p>";
  }

  // Pre-process: merge broken mid-sentence lines
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i];
    const prev = lines[lines.length - 1];

    if (
      prev &&
      cur.length > 0 &&
      /^[a-z]/.test(cur) &&
      !/[.:;?!]$/.test(prev) &&
      !/^[-•*–\d]/.test(cur)
    ) {
      lines[lines.length - 1] = prev + " " + cur;
    } else {
      lines.push(cur);
    }
  }

  const html: string[] = [];
  let inList = false;

  const isHeading = (line: string): boolean => {
    if (line.length > 50) return false;
    const upper = line === line.toUpperCase() && line.length >= 3 && !line.includes("@") && !line.includes("|") && !/^\d+$/.test(line);
    const keyword = /^(ringkasan|summary|profil|profile|pengalaman|experience|pendidikan|education|keahlian|skills|kemampuan|proyek|projects|kontak|contact|sertifikasi|certifications|bahasa|languages|organisasi|awards|prestasi|riwayat|tentang saya|about me|work experience|personal information)/i.test(line);
    return upper || keyword;
  };

  const isBullet = (line: string): boolean => {
    return /^[-•*–▪▫]\s*/.test(line) || /^\d+[.)]\s+/.test(line);
  };

  const isContactLine = (line: string): boolean => {
    return line.includes("@") || line.includes("+62") || line.includes("|") || line.includes("linkedin.com") || line.includes("github.com") || /telp|phone|email/i.test(line);
  };

  const profileImg = allImages.find((img) => img.isHeader);
  const bodyImgs = allImages.filter((img) => img !== profileImg);

  // Header / Title (First line)
  const titleText = lines.length > 0 ? escapeHtml(lines[0]) : "Dokumen";

  // Check if line 1 or 2 is a contact info line
  let contactHtml = "";
  let contactLineIndex = -1;
  for (let i = 1; i <= Math.min(2, lines.length - 1); i++) {
    if (isContactLine(lines[i])) {
      contactLineIndex = i;
      const parts = lines[i].split("|").map((p) => p.trim()).filter(Boolean);
      contactHtml = parts.length > 1
        ? parts.map((p) => `<span style="display:inline-block; margin-right: 14px;">${escapeHtml(p)}</span>`).join(" • ")
        : escapeHtml(lines[i]);
      break;
    }
  }

  // Render Header section with photo if available
  if (profileImg) {
    html.push(`
      <div class="doc-header-profile" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">
        <div style="flex: 1;">
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0; letter-spacing: -0.5px; line-height: 1.2;">${titleText}</h1>
          ${contactHtml ? `<div style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-top: 8px;">${contactHtml}</div>` : ""}
        </div>
        <div style="flex-shrink: 0;">
          <img src="${profileImg.dataUrl}" alt="Foto Profil / Logo" style="max-width: 140px; max-height: 140px; width: auto; height: auto; object-fit: contain; border-radius: 8px; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block;" />
        </div>
      </div>
    `);
  } else {
    html.push(
      `<h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0; letter-spacing: -0.5px; line-height: 1.2;">${titleText}</h1>`
    );
    if (contactHtml) {
      html.push(
        `<div style="font-size: 13px; color: #4b5563; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; line-height: 1.5;">${contactHtml}</div>`
      );
    }
  }

  for (let i = 1; i < lines.length; i++) {
    if (i === contactLineIndex) continue;
    const line = lines[i];

    // Section Heading
    if (isHeading(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      const headingText = escapeHtml(line);
      html.push(
        `<h2 style="font-size: 15px; font-weight: 700; text-transform: uppercase; color: #1e40af; border-bottom: 1.5px solid #bfdbfe; padding-bottom: 5px; margin-top: 24px; margin-bottom: 10px; letter-spacing: 0.5px;">${headingText}</h2>`
      );
      continue;
    }

    // Bullet / List Item
    if (isBullet(line)) {
      if (!inList) {
        html.push('<ul style="margin: 6px 0 14px 24px; padding: 0; list-style-type: disc;">');
        inList = true;
      }
      const text = line.replace(/^[-•*–▪▫]\s*/, "").replace(/^\d+[.)]\s+/, "");
      html.push(
        `<li style="margin-bottom: 5px; font-size: 13.5px; line-height: 1.6; color: #374151;">${escapeHtml(text)}</li>`
      );
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    // Job Title / Institution with date
    if (line.includes(" - ") || line.includes(" | ") || (line.length <= 80 && (line.includes("20") || line.includes("Sekarang") || line.includes("Present")))) {
      html.push(
        `<div style="font-size: 14px; font-weight: 600; color: #111827; margin-top: 10px; margin-bottom: 3px;">${escapeHtml(line)}</div>`
      );
      continue;
    }

    // Regular paragraph
    html.push(
      `<p style="margin: 6px 0 10px 0; font-size: 13.5px; line-height: 1.6; color: #374151;">${escapeHtml(line)}</p>`
    );
  }

  if (inList) {
    html.push("</ul>");
  }

  // Append any body images (e.g. diagrams, illustrations, charts, signatures)
  for (const bImg of bodyImgs) {
    html.push(`
      <div class="doc-body-image" style="text-align: center; margin: 20px 0;">
        <img src="${bImg.dataUrl}" alt="Gambar Dokumen" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display: inline-block;" />
      </div>
    `);
  }

  return `
    <div class="pdf-document-page" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 48px 56px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 8px; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      ${html.join("\n")}
    </div>
  `;
}

export async function formatDocumentWithAI(
  content: string
): Promise<string> {
  const apiKey = getUserGeminiKey();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-gemini-key"] = apiKey;
    }

    const res = await fetch("/api/format", {
      method: "POST",
      headers,
      body: JSON.stringify({
        content,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.formattedHtml) {
        return data.formattedHtml;
      }
    }
  } catch (err) {
    console.warn("AI format endpoint error, falling back to local formatter:", err);
  }

  // Graceful fallback to local smart formatter
  return smartFormatLocal(content);
}
