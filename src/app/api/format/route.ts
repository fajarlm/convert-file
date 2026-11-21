import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, preset: _preset } = body;

    const apiKey =
      req.headers.get("x-gemini-key") ||
      body.apiKey ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 400 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert document, resume, and layout formatter.
Take the following raw document/CV text and organize it into clean, semantic, professional HTML suitable for a WYSIWYG rich text editor.

Formatting Rules:
1. Wrap the entire document inside a single container: <div class="pdf-document-page" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 48px 56px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 8px; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;"> ... </div>
2. Use <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0; letter-spacing: -0.5px;"> for the person's name / main document title.
3. Use a styled contact div with bottom border for contact details.
4. Use <h2 style="font-size: 15px; font-weight: 700; text-transform: uppercase; color: #1e40af; border-bottom: 1.5px solid #bfdbfe; padding-bottom: 5px; margin-top: 24px; margin-bottom: 10px; letter-spacing: 0.5px;"> for section headers (e.g. Ringkasan, Pengalaman, Pendidikan, Keahlian).
5. Convert bullet points and lists into semantic <ul style="margin: 6px 0 14px 24px; padding: 0; list-style-type: disc;"><li style="margin-bottom: 5px; font-size: 13.5px; line-height: 1.6; color: #374151;">...</li></ul>.
6. Fix any mid-sentence line breaks caused by PDF extraction into smooth, natural paragraphs.
7. Return ONLY the HTML code. Do NOT wrap in markdown code blocks (\`\`\`html) or include conversational text.

Document Text to Format:
${content}`;

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: "Gemini error" }, { status: 502 });
    }

    const aiData = await aiRes.json();
    let rawOutput = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    rawOutput = rawOutput.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    return NextResponse.json({ formattedHtml: rawOutput });
  } catch (err) {
    console.error("Format API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
