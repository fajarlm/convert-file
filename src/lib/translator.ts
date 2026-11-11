/**
 * DocMorph Translation Engine Helper
 * Provides resilient, dual-layer translation:
 * 1. Server-side /api/translate route (multi-provider with Gemini, Google Clients5, Google GTX, MyMemory)
 * 2. Client-side browser direct fallback (bypasses any server network/IP blocks)
 */

export function getUserGeminiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("docmorph_gemini_key") || "";
  } catch {
    return "";
  }
}

export function setUserGeminiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) {
      localStorage.setItem("docmorph_gemini_key", key.trim());
    } else {
      localStorage.removeItem("docmorph_gemini_key");
    }
  } catch {
    // Ignore storage errors
  }
}

// Client-side direct fallback using browser residential IP
async function clientSideDirectTranslate(
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string> {
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${encodeURIComponent(text)}`,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === "string") {
        return data[0][0];
      }
    }
  } catch (err) {
    console.warn("Client-side direct translate error:", err);
  }

  // MyMemory client fallback
  try {
    const sl = sourceLang === "auto" ? (targetLang === "id" ? "en" : "id") : sourceLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${targetLang}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.warn("MyMemory client error:", err);
  }

  return text;
}

// Single text translator
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string> {
  if (!text || text.trim() === "") return text;

  const apiKey = getUserGeminiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-gemini-key"] = apiKey;
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText) {
        return data.translatedText;
      }
    }
  } catch (err) {
    console.warn("/api/translate failed, falling back to client-side direct:", err);
  }

  // Automatic client-side fallback
  return await clientSideDirectTranslate(text, targetLang, sourceLang);
}

// Batch translator for multiple texts (e.g. spreadsheet cells or lists)
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  // Filter non-empty texts to translate and preserve indices
  const itemsToTranslate: { index: number; text: string }[] = [];
  texts.forEach((text, index) => {
    const trimmed = String(text ?? "").trim();
    if (trimmed && isNaN(Number(trimmed))) {
      itemsToTranslate.push({ index, text: trimmed });
    }
  });

  if (itemsToTranslate.length === 0) {
    return [...texts];
  }

  const results = [...texts];
  const apiKey = getUserGeminiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-gemini-key"] = apiKey;
  }

  // Process in reasonable chunks of 40 items to prevent request payload limits
  const CHUNK_SIZE = 40;
  for (let i = 0; i < itemsToTranslate.length; i += CHUNK_SIZE) {
    const slice = itemsToTranslate.slice(i, i + CHUNK_SIZE);
    const sliceTexts = slice.map((item) => item.text);

    let translatedChunk: string[] | null = null;

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          texts: sliceTexts,
          targetLang,
          sourceLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.translatedTexts) && data.translatedTexts.length === slice.length) {
          translatedChunk = data.translatedTexts;
        }
      }
    } catch (err) {
      console.warn("Batch API failed for chunk, falling back:", err);
    }

    if (!translatedChunk) {
      // Client-side fallback for this chunk
      try {
        const body = sliceTexts.map((t) => "q=" + encodeURIComponent(t)).join("&");
        const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            translatedChunk = data.map((item) =>
              Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""
            );
          }
        }
      } catch (err) {
        console.warn("Client batch fallback failed:", err);
      }
    }

    // Apply translations back
    slice.forEach((item, sliceIdx) => {
      if (translatedChunk && translatedChunk[sliceIdx]) {
        results[item.index] = translatedChunk[sliceIdx];
      }
    });
  }

  return results;
}

// Long plain text document translator
export async function translateDocument(
  fullText: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string> {
  if (!fullText || fullText.trim() === "") return fullText;

  if (fullText.length <= 2500) {
    return await translateText(fullText, targetLang, sourceLang);
  }

  const paragraphs = fullText.split(/\n\n+/);
  const translatedParagraphs: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      translatedParagraphs.push(para);
      continue;
    }
    const translated = await translateText(para, targetLang, sourceLang);
    translatedParagraphs.push(translated);
  }

  return translatedParagraphs.join("\n\n");
}

/**
 * Rich HTML Document Translator
 * Traverses DOM text nodes and translates them in batch while keeping 100% of HTML tags,
 * tables (table, tr, td, th), bold, italic, underline, lists, and headings intact.
 */
export async function translateRichHtml(
  html: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string> {
  if (typeof window === "undefined" || !html || !html.trim()) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Collect all leaf text nodes
    const textNodes: Text[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue || "";
        if (val.trim().length > 0) {
          textNodes.push(node as Text);
        }
      } else {
        if (node.nodeName !== "SCRIPT" && node.nodeName !== "STYLE") {
          for (let i = 0; i < node.childNodes.length; i++) {
            walk(node.childNodes[i]);
          }
        }
      }
    };
    walk(doc.body);

    if (textNodes.length === 0) return html;

    const rawTexts = textNodes.map((n) => n.nodeValue || "");
    const translatedTexts = await translateBatch(rawTexts, targetLang, sourceLang);

    textNodes.forEach((node, i) => {
      if (translatedTexts[i] !== undefined) {
        const orig = node.nodeValue || "";
        const leading = orig.match(/^\s*/)?.[0] || "";
        const trailing = orig.match(/\s*$/)?.[0] || "";
        node.nodeValue = leading + translatedTexts[i].trim() + trailing;
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.error("translateRichHtml error:", err);
    return html;
  }
}
