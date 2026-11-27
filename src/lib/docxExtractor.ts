import mammoth from "mammoth";

export interface DocxExtractionResult {
  html: string;
  text: string;
  images: string[];
}

/**
 * Resolve CSS custom properties (var(--name)) inside a CSS string or inline style
 * against computed styles of a root element.
 */
function resolveCssVars(cssText: string, varMap: Record<string, string>): string {
  if (!cssText || !cssText.includes("var(")) return cssText;
  return cssText.replace(/var\((--[^,)]+)(?:,\s*([^)]+))?\)/g, (_m, varName, fallback) => {
    const key = varName.trim();
    return varMap[key] || (fallback ? fallback.trim() : "inherit");
  });
}

/**
 * Extract high-fidelity HTML, text, and images from a .docx buffer using docx-preview,
 * preserving backgrounds, font colors, typography/fonts, icons, images, lines/borders, and tables.
 */
export async function extractFromDocx(buffer: ArrayBuffer): Promise<DocxExtractionResult> {
  if (typeof document !== "undefined") {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-99999px";
    host.style.top = "0";
    host.style.width = "900px";
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    document.body.appendChild(host);

    try {
      const { renderAsync } = await import("docx-preview");
      await renderAsync(buffer, host, host, {
        className: "docx-sheet",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        useBase64URL: true,
        experimental: true,
      });

      // Allow tab-stop post-render adjustments & base64 image metadata to settle
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Extract CSS variables from generated <style> tags (e.g. --docx-accent1-color)
      const varMap: Record<string, string> = {};
      const styleEls = Array.from(host.querySelectorAll("style"));
      const cleanedStyles: string[] = [];

      for (const styleEl of styleEls) {
        let css = styleEl.textContent || "";
        // Collect --docx-* custom property definitions
        const varRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+);/g;
        let match: RegExpExecArray | null;
        while ((match = varRegex.exec(css)) !== null) {
          varMap[match[1].trim()] = match[2].trim();
        }
        // Scope :root to .docx-sheet so variables don't pollute global app styles
        css = css.replace(/:root\b/g, ".docx-sheet");
        cleanedStyles.push(css);
      }

      // Resolve var(--...) inside collected <style> rules
      const resolvedStyleBlock = cleanedStyles
        .map((css) => `<style>${resolveCssVars(css, varMap)}</style>`)
        .join("\n");

      // Collect extracted images & tag them as resizable in the editor
      const images: string[] = [];
      const seenImages = new Set<string>();
      const imgEls = host.querySelectorAll<HTMLImageElement>("img");
      imgEls.forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src && !seenImages.has(src)) {
          seenImages.add(src);
          images.push(src);
        }
        img.classList.add("resizable-doc-img");
        img.style.cursor = "pointer";
        if (!img.style.maxWidth) {
          img.style.maxWidth = "100%";
        }
      });

      // Resolve CSS variables in inline styles and normalize page sections for editor & PDF export
      const sections = host.querySelectorAll<HTMLElement>("section.docx-sheet");
      sections.forEach((sec) => {
        sec.classList.add("doc-page-sheet");
        const computed = window.getComputedStyle(sec);
        const bg = computed.backgroundColor;
        const hasBgColor = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
        if (!hasBgColor && !sec.style.background && !sec.style.backgroundColor) {
          sec.style.backgroundColor = "#ffffff";
        }
        if (!sec.style.color) {
          sec.style.color = "#111111";
        }
        sec.style.boxSizing = "border-box";
        sec.style.margin = "0 auto 28px auto";
        sec.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)";
        sec.style.borderRadius = "4px";
        sec.style.position = "relative";
        sec.style.maxWidth = "100%";
      });

      // Resolve var(--...) inside inline styles of all child elements
      const styledChildren = host.querySelectorAll<HTMLElement>("[style*='var(']");
      styledChildren.forEach((el) => {
        const rawStyle = el.getAttribute("style") || "";
        el.setAttribute("style", resolveCssVars(rawStyle, varMap));
      });

      // Remove original <style> nodes from host so we emit them cleanly at top
      styleEls.forEach((s) => s.remove());

      const bodyHtml = host.innerHTML.trim();
      const plainText = (host.innerText || host.textContent || "").trim();

      if (bodyHtml) {
        const fullHtml = `<div class="docx-document-root" style="color: #111111;">\n${resolvedStyleBlock}\n${bodyHtml}\n</div>`;
        let rawTextFallback = plainText;
        try {
          const mammothText = await mammoth.extractRawText({ arrayBuffer: buffer });
          if (mammothText.value?.trim()) {
            rawTextFallback = mammothText.value.trim();
          }
        } catch {
          // Use innerText from rendered DOM
        }
        return {
          html: fullHtml,
          text: rawTextFallback,
          images,
        };
      }
    } catch (docxErr) {
      console.warn("docx-preview failed, falling back to mammoth:", docxErr);
    } finally {
      if (document.body.contains(host)) {
        document.body.removeChild(host);
      }
    }
  }

  // Fallback for legacy .doc or SSR environments
  const images: string[] = [];
  const htmlResult = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      convertImage: mammoth.images.imgElement((image) => {
        return image.read("base64").then((imageBuffer) => {
          const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
          images.push(dataUrl);
          return {
            src: dataUrl,
            class: "resizable-doc-img",
            style: "max-width: 100%; height: auto; cursor: pointer;",
          };
        });
      }),
    }
  );
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
  const wrappedHtml = `<div class="doc-page-sheet" style="width: 100%; max-width: 794px; min-height: 1050px; margin: 0 auto 32px auto; background: #ffffff; padding: 48px 56px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 4px; box-sizing: border-box; font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; color: #111111;">${
    htmlResult.value || "<p>Dokumen kosong</p>"
  }</div>`;

  return {
    html: wrappedHtml,
    text: rawTextResult.value || "",
    images,
  };
}
