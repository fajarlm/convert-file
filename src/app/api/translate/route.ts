import { NextRequest, NextResponse } from "next/server";

interface TranslateRequestBody {
  text?: string;
  texts?: string[];
  targetLang?: string;
  sourceLang?: string;
  apiKey?: string;
}

// Helper: Translate using Gemini API
async function translateWithGemini(
  content: string | string[],
  targetLang: string,
  sourceLang: string,
  apiKey: string
): Promise<{ textResult?: string; batchResult?: string[] } | null> {
  try {
    const isBatch = Array.isArray(content);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = isBatch
      ? `Translate the following JSON array of strings from ${
          sourceLang === "auto" ? "detected language" : sourceLang
        } into target language code "${targetLang}".
Return ONLY a valid JSON array of translated strings with the exact same number of elements and ordering. Do not wrap in markdown or explanation.
Input: ${JSON.stringify(content)}`
      : `Translate the following document text from ${
          sourceLang === "auto" ? "detected language" : sourceLang
        } into target language code "${targetLang}".
Maintain original formatting, numbers, bullet points, line breaks, and casing as closely as possible.
Return ONLY the translated text without commentary or wrapper quotes:

${content}`;

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!aiRes.ok) return null;
    const aiData = await aiRes.json();
    const rawOutput = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawOutput) return null;

    if (isBatch) {
      try {
        const cleaned = rawOutput.replace(/^```json/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return { batchResult: parsed.map(String) };
        }
      } catch {
        // Fallback
      }
    } else {
      return { textResult: rawOutput };
    }
  } catch (err) {
    console.warn("Gemini translate error:", err);
  }
  return null;
}

// Helper: Translate using Google Chrome Extension Client endpoint (High reliability, accepts POST & batch)
async function translateWithGoogleClients5(
  items: string[],
  targetLang: string,
  sourceLang: string = "auto"
): Promise<{ results: string[]; detectedLang?: string } | null> {
  try {
    const body = items.map((t) => "q=" + encodeURIComponent(t)).join("&");
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body,
    });

    if (!res.ok) {
      console.warn("Google clients5 returned status:", res.status);
      return null;
    }

    const data = await res.json();
    // Format: [ [ "translatedText", "detectedSource" ], ... ]
    if (Array.isArray(data)) {
      const results: string[] = [];
      let detectedLang: string | undefined;

      for (const item of data) {
        if (Array.isArray(item)) {
          results.push(typeof item[0] === "string" ? item[0] : "");
          if (!detectedLang && typeof item[1] === "string") {
            detectedLang = item[1];
          }
        } else if (typeof item === "string") {
          results.push(item);
        } else {
          results.push("");
        }
      }

      if (results.length > 0) {
        return { results, detectedLang };
      }
    }
  } catch (err) {
    console.warn("Google clients5 fetch error:", err);
  }
  return null;
}

// Helper: Translate using Google Translate gtx POST
async function translateWithGoogleGtx(
  items: string[],
  targetLang: string,
  sourceLang: string = "auto"
): Promise<{ results: string[] } | null> {
  try {
    // Process single or join with unique delimiter
    const combined = items.join("\n___SPLIT___\n");
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: `q=${encodeURIComponent(combined)}`,
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const parts = data[0].map((item: unknown) => {
        if (Array.isArray(item) && typeof item[0] === "string") {
          return item[0];
        }
        return "";
      });
      const fullText = parts.join("");
      const splitResults = fullText.split(/\n?___SPLIT___\n?/);
      return { results: splitResults };
    }
  } catch (err) {
    console.warn("Google gtx fetch error:", err);
  }
  return null;
}

// Helper: Translate using MyMemory API as fallback
async function translateWithMyMemory(
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string | null> {
  try {
    const sl = sourceLang === "auto" ? (targetLang === "id" ? "en" : "id") : sourceLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${sl}|${targetLang}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn("MyMemory error:", err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateRequestBody;
    const { text, texts, targetLang = "en", sourceLang = "auto" } = body;

    // Check for API key from header or body or process.env
    const apiKey =
      req.headers.get("x-gemini-key") ||
      body.apiKey ||
      process.env.GEMINI_API_KEY ||
      "";

    // 1. Handle Batch Translation (`texts` array)
    if (Array.isArray(texts) && texts.length > 0) {
      // If Gemini Key is available
      if (apiKey) {
        const geminiRes = await translateWithGemini(texts, targetLang, sourceLang, apiKey);
        if (geminiRes?.batchResult && geminiRes.batchResult.length === texts.length) {
          return NextResponse.json({
            translatedTexts: geminiRes.batchResult,
            provider: "gemini-1.5-flash",
            targetLang,
          });
        }
      }

      // Try Google clients5 (batch mode)
      const clients5Res = await translateWithGoogleClients5(texts, targetLang, sourceLang);
      if (clients5Res && clients5Res.results.length === texts.length) {
        return NextResponse.json({
          translatedTexts: clients5Res.results,
          provider: "google-clients5-batch",
          targetLang,
          detectedSourceLang: clients5Res.detectedLang,
        });
      }

      // Try Google gtx combined fallback
      const gtxRes = await translateWithGoogleGtx(texts, targetLang, sourceLang);
      if (gtxRes && gtxRes.results.length === texts.length) {
        return NextResponse.json({
          translatedTexts: gtxRes.results,
          provider: "google-gtx-batch",
          targetLang,
        });
      }

      // Individual fallback with MyMemory
      const myMemoryResults = await Promise.all(
        texts.map(async (t) => {
          if (!t.trim()) return t;
          const translated = await translateWithMyMemory(t, targetLang, sourceLang);
          return translated || t;
        })
      );

      return NextResponse.json({
        translatedTexts: myMemoryResults,
        provider: "mymemory-batch-fallback",
        targetLang,
      });
    }

    // 2. Handle Single Text Translation (`text` string)
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Parameter 'text' or 'texts' is required." },
        { status: 400 }
      );
    }

    if (text.trim() === "") {
      return NextResponse.json({
        translatedText: "",
        provider: "none",
        targetLang,
      });
    }

    // Try Gemini if key exists
    if (apiKey) {
      const geminiRes = await translateWithGemini(text, targetLang, sourceLang, apiKey);
      if (geminiRes?.textResult) {
        return NextResponse.json({
          translatedText: geminiRes.textResult,
          provider: "gemini-1.5-flash",
          targetLang,
        });
      }
    }

    // Try Google clients5
    const clients5Res = await translateWithGoogleClients5([text], targetLang, sourceLang);
    if (clients5Res?.results?.[0]) {
      return NextResponse.json({
        translatedText: clients5Res.results[0],
        provider: "google-clients5",
        targetLang,
        detectedSourceLang: clients5Res.detectedLang,
      });
    }

    // Try Google gtx
    const gtxRes = await translateWithGoogleGtx([text], targetLang, sourceLang);
    if (gtxRes?.results?.[0]) {
      return NextResponse.json({
        translatedText: gtxRes.results[0],
        provider: "google-gtx",
        targetLang,
      });
    }

    // Try MyMemory
    const myMemoryRes = await translateWithMyMemory(text, targetLang, sourceLang);
    if (myMemoryRes) {
      return NextResponse.json({
        translatedText: myMemoryRes,
        provider: "mymemory",
        targetLang,
      });
    }

    return NextResponse.json(
      { error: "Semua mesin penerjemah gagal. Coba lagi beberapa saat." },
      { status: 502 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation server error";
    console.error("Translation route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
