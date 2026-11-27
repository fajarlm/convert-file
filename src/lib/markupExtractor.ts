export interface MarkupExtractionResult {
  html: string;
  text: string;
  images: string[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scopeCssForHtmlSheet(css: string): string {
  return css
    .replace(/:root\b/gi, ".html-page-sheet")
    .replace(/\bhtml\b(?=\s*[,{])/gi, ".html-page-sheet")
    .replace(/\bbody\b(?=\s*[,{])/gi, ".html-page-sheet");
}

function renderInlineMarkdown(line: string): string {
  // Escape HTML first, then format inline markdown
  let s = escapeHtml(line);
  // Images ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img class="resizable-doc-img" src="$2" alt="$1" style="max-width:100%;height:auto;cursor:pointer;" />'
  );
  // Links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">$1</a>'
  );
  // Inline code `code`
  s = s.replace(
    /`([^`]+)`/g,
    '<code style="background:#f4f4f5;color:#be185d;padding:2px 5px;border-radius:4px;font-family:\'Courier New\',monospace;font-size:0.9em;">$1</code>'
  );
  // Bold + Italic ***text***
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<b><i>$1</i></b>");
  // Bold **text** or __text__
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/__([^_]+)__/g, "<b>$1</b>");
  // Italic *text* or _text_
  s = s.replace(/\*([^*]+)\*/g, "<i>$1</i>").replace(/(^|\s)_([^_]+)_(\s|$)/g, "$1<i>$2</i>$3");
  // Strikethrough ~~text~~
  s = s.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  return s;
}

function markdownToRichHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block ```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++;
      out.push(
        `<pre style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;padding:12px 14px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.5;overflow-x:auto;color:#111827;margin:10px 0;"><code>${codeLines.join(
          "\n"
        )}</code></pre>`
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push(`<hr class="doc-divider" style="border:none;border-top:1px solid #d4d4d8;margin:16px 0;" />`);
      i++;
      continue;
    }

    // Headings # .. ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeMap: Record<number, string> = {
        1: "24px",
        2: "19px",
        3: "16px",
        4: "14px",
        5: "13px",
        6: "12px",
      };
      const border = level <= 2 ? "border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;" : "";
      out.push(
        `<h${level} style="font-size:${sizeMap[level]};font-weight:700;color:#111111;margin:16px 0 8px 0;${border}">${renderInlineMarkdown(
          headingMatch[2]
        )}</h${level}>`
      );
      i++;
      continue;
    }

    // GFM Table
    if (trimmed.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(line);
      i += 2; // skip separator row
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim().length > 0) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }

      const ths = headers
        .map(
          (h) =>
            `<th style="border:1px solid #d4d4d8;background:#f4f4f5;padding:8px 12px;text-align:left;font-weight:700;color:#111111;">${renderInlineMarkdown(
              h
            )}</th>`
        )
        .join("");
      const trs = bodyRows
        .map(
          (r) =>
            `<tr>${headers
              .map(
                (_, idx) =>
                  `<td style="border:1px solid #d4d4d8;padding:8px 12px;color:#111111;">${renderInlineMarkdown(
                    r[idx] || ""
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("");

      out.push(
        `<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #d4d4d8;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(renderInlineMarkdown(lines[i].trim().replace(/^>\s?/, "")));
        i++;
      }
      out.push(
        `<blockquote style="border-left:4px solid #6366f1;background:#f8fafc;padding:8px 14px;margin:10px 0;color:#334155;">${quoteLines.join(
          "<br/>"
        )}</blockquote>`
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(
          `<li style="margin:3px 0;">${renderInlineMarkdown(
            lines[i].trim().replace(/^[-*+]\s+/, "")
          )}</li>`
        );
        i++;
      }
      out.push(`<ul style="list-style-type:disc;padding-left:24px;margin:8px 0;">${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(
          `<li style="margin:3px 0;">${renderInlineMarkdown(
            lines[i].trim().replace(/^\d+\.\s+/, "")
          )}</li>`
        );
        i++;
      }
      out.push(`<ol style="list-style-type:decimal;padding-left:24px;margin:8px 0;">${items.join("")}</ol>`);
      continue;
    }

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Regular paragraph
    out.push(
      `<p style="margin:6px 0;line-height:1.6;color:#111111;">${renderInlineMarkdown(trimmed)}</p>`
    );
    i++;
  }

  return out.join("\n");
}

export function extractFromMarkupOrText(
  textContent: string,
  ext: "html" | "md" | "json" | "txt"
): MarkupExtractionResult {
  const images: string[] = [];

  if (ext === "html") {
    if (typeof DOMParser !== "undefined") {
      try {
        const parsed = new DOMParser().parseFromString(textContent, "text/html");
        const styleBlocks = Array.from(parsed.querySelectorAll("style"))
          .map((s) => `<style>${scopeCssForHtmlSheet(s.textContent || "")}</style>`)
          .join("\n");

        // Remove scripts for safety
        parsed.querySelectorAll("script").forEach((sc) => sc.remove());

        const bodyEl = parsed.body;
        const bodyStyleAttr = bodyEl.getAttribute("style") || "";
        const bodyBgAttr = bodyEl.getAttribute("bgcolor");
        const bodyTextAttr = bodyEl.getAttribute("text");

        const sheetStyles: string[] = [
          "width: 100%",
          "max-width: 850px",
          "min-height: 900px",
          "margin: 0 auto 32px auto",
          "background-color: #ffffff",
          "color: #111111",
          "padding: 40px 48px",
          "box-shadow: 0 4px 20px rgba(0,0,0,0.12)",
          "border-radius: 4px",
          "box-sizing: border-box",
          "position: relative",
        ];
        if (bodyBgAttr) sheetStyles.push(`background-color: ${bodyBgAttr}`);
        if (bodyTextAttr) sheetStyles.push(`color: ${bodyTextAttr}`);
        if (bodyStyleAttr) sheetStyles.push(bodyStyleAttr);

        bodyEl.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          img.classList.add("resizable-doc-img");
          img.style.cursor = "pointer";
          const src = img.getAttribute("src");
          if (src) images.push(src);
        });

        const wrappedHtml = `<div class="html-document-root" style="color: #111111;">\n${styleBlocks}\n<div class="doc-page-sheet html-page-sheet" style="${sheetStyles.join(
          "; "
        )}">\n${bodyEl.innerHTML}\n</div>\n</div>`;

        return {
          html: wrappedHtml,
          text: (bodyEl.innerText || bodyEl.textContent || textContent).trim(),
          images,
        };
      } catch (err) {
        console.warn("HTML parse fallback:", err);
      }
    }

    return {
      html: `<div class="doc-page-sheet html-page-sheet" style="width:100%;max-width:850px;min-height:900px;margin:0 auto 32px auto;background:#ffffff;color:#111111;padding:40px 48px;box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:4px;box-sizing:border-box;">${textContent}</div>`,
      text: textContent,
      images,
    };
  }

  if (ext === "md") {
    const richMdHtml = markdownToRichHtml(textContent);
    const wrapped = `<div class="doc-page-sheet md-page-sheet" style="width:100%;max-width:794px;min-height:1050px;margin:0 auto 32px auto;background:#ffffff;color:#111111;padding:48px 56px;box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:4px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13.5px;">${richMdHtml}</div>`;
    return { html: wrapped, text: textContent, images };
  }

  if (ext === "json") {
    let formatted = textContent;
    try {
      formatted = JSON.stringify(JSON.parse(textContent), null, 2);
    } catch {
      // keep raw
    }
    const linesHtml = formatted
      .split("\n")
      .map(
        (line) =>
          `<div style="white-space:pre-wrap;font-family:'Courier New',Courier,monospace;font-size:12.5px;line-height:1.55;color:#111827;">${
            escapeHtml(line) || "&nbsp;"
          }</div>`
      )
      .join("");
    const wrapped = `<div class="doc-page-sheet json-page-sheet" style="width:100%;max-width:794px;min-height:1050px;margin:0 auto 32px auto;background:#ffffff;color:#111827;padding:40px 48px;box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:4px;box-sizing:border-box;">${linesHtml}</div>`;
    return { html: wrapped, text: formatted, images };
  }

  // Plain Text (.txt)
  const linesHtml = textContent
    .split(/\r?\n/)
    .map(
      (line) =>
        `<p style="margin:2px 0;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#111111;">${
          escapeHtml(line) || "&nbsp;"
        }</p>`
    )
    .join("");
  const wrapped = `<div class="doc-page-sheet txt-page-sheet" style="width:100%;max-width:794px;min-height:1050px;margin:0 auto 32px auto;background:#ffffff;color:#111111;padding:48px 56px;box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:4px;box-sizing:border-box;">${linesHtml}</div>`;
  return { html: wrapped, text: textContent, images };
}
