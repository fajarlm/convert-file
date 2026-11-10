import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = "en", sourceLang = "auto" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Parameter 'text' is required and must be a string." },
        { status: 400 }
      );
    }

    // Check if Gemini API Key is configured in environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const prompt = `Translate the following document text from ${sourceLang === "auto" ? "detected language" : sourceLang} into ${targetLang}. 
Maintain original formatting, numbers, bullet points, and capitalization as closely as possible. 
Return ONLY the translated text without commentary or wrapper quotes:

${text}`;

        const aiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const translated =
            aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            return NextResponse.json({
              translatedText: translated,
              provider: "gemini-1.5-flash",
              targetLang,
            });
          }
        }
      } catch (geminiError) {
        console.warn("Gemini translation error, falling back to Google Translate API:", geminiError);
      }
    }

    // Fallback: Free Google Translate Client API endpoint (Zero-config, works everywhere on Vercel)
    const encodedText = encodeURIComponent(text);
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

    const res = await fetch(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Translation API returned status ${res.status}`);
    }

    const data = await res.json();
    // data[0] contains array of translated sentences: [[translatedPart, originalPart], ...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedParts = data[0].map((item: unknown) => {
        if (Array.isArray(item) && typeof item[0] === "string") {
          return item[0];
        }
        return "";
      });
      const translatedText = translatedParts.join("");
      return NextResponse.json({
        translatedText,
        provider: "google-translate-direct",
        targetLang,
      });
    }

    return NextResponse.json(
      { error: "Failed to parse translation response" },
      { status: 500 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation failed";
    console.error("Translation route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
