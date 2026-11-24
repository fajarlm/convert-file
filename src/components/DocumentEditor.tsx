"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe,
  Languages,
  Loader2,
  Check,
  X,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Table as TableIcon,
  Plus,
  Trash2,
  Heading1,
  Heading2,
  RotateCcw,
  RotateCw,
  Wand2,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Printer,
  RemoveFormatting,
  ZoomIn,
  ZoomOut,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  Eraser,
  Minus,
} from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/types";
import { useAppTheme } from "@/context/ThemeContext";
import { translateText } from "@/lib/translator";
import { formatDocumentWithAI } from "@/lib/formatter";

interface DocumentEditorProps {
  htmlContent: string;
  onChange: (newHtml: string) => void;
  onFullTranslate: (targetLang: string) => Promise<void>;
  isTranslatingFull: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  htmlContent,
  onChange,
  onFullTranslate,
  isTranslatingFull,
}) => {
  const { theme } = useAppTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);

  // Selection translation state
  const [targetLang, setTargetLang] = useState("en");
  const [fullTargetLang, setFullTargetLang] = useState("en");
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);
  const [translatedSelection, setTranslatedSelection] = useState("");
  const [isFormattingAI, setIsFormattingAI] = useState(false);

  // Insert / Edit Link state & controls
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const activeLinkElRef = useRef<HTMLAnchorElement | null>(null);
  const [hasActiveLink, setHasActiveLink] = useState(false);
  const savedLinkRangeRef = useRef<Range | null>(null);

  const handleOpenLinkModal = useCallback(() => {
    const selection = window.getSelection();
    let anchor: HTMLAnchorElement | null = null;
    if (selection && selection.anchorNode) {
      const node =
        selection.anchorNode.nodeType === Node.TEXT_NODE
          ? selection.anchorNode.parentElement
          : (selection.anchorNode as HTMLElement);
      anchor = node?.closest("a") as HTMLAnchorElement | null;
    }

    if (anchor) {
      activeLinkElRef.current = anchor;
      setHasActiveLink(true);
      setLinkText(anchor.textContent || "");
      setLinkUrl(anchor.getAttribute("href") || "");
      savedLinkRangeRef.current = null;
    } else {
      activeLinkElRef.current = null;
      setHasActiveLink(false);
      const text = selection ? selection.toString().trim() : "";
      setLinkText(text);
      setLinkUrl("");
      if (selection && selection.rangeCount > 0) {
        savedLinkRangeRef.current = selection.getRangeAt(0).cloneRange();
      } else {
        savedLinkRangeRef.current = null;
      }
    }
    setIsLinkModalOpen(true);
  }, []);

  const handleApplyLink = () => {
    let url = linkUrl.trim();
    if (!url) {
      alert("Masukkan alamat URL target (contoh: https://fajarlm.vercel.app atau mailto:...)");
      return;
    }
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("mailto:") &&
      !url.startsWith("tel:") &&
      !url.startsWith("#")
    ) {
      url = "https://" + url;
    }

    const anchor = activeLinkElRef.current;
    if (anchor) {
      anchor.setAttribute("href", url);
      if (linkText.trim()) anchor.textContent = linkText.trim();
      anchor.style.color = "inherit";
      anchor.style.textDecoration = "none";
      if (url.startsWith("http")) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
    } else if (savedLinkRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedLinkRangeRef.current);

      const selectedStr = savedLinkRangeRef.current.toString().trim();
      const textToUse = linkText.trim() || selectedStr || url;

      if (selectedStr.length > 0) {
        document.execCommand("createLink", false, url);
        const anchors = editorRef.current?.querySelectorAll(`a[href="${url}"]`);
        if (anchors && anchors.length > 0) {
          const lastAnchor = anchors[anchors.length - 1] as HTMLAnchorElement;
          if (linkText.trim()) lastAnchor.textContent = linkText.trim();
          lastAnchor.style.color = "inherit";
          lastAnchor.style.textDecoration = "none";
          if (url.startsWith("http")) {
            lastAnchor.setAttribute("target", "_blank");
            lastAnchor.setAttribute("rel", "noopener noreferrer");
          }
        }
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = textToUse;
        a.style.color = "inherit";
        a.style.textDecoration = "none";
        if (url.startsWith("http")) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        savedLinkRangeRef.current.insertNode(a);
      }
    } else if (editorRef.current) {
      const a = document.createElement("a");
      a.href = url;
      a.textContent = linkText.trim() || url;
      a.style.color = "inherit";
      a.style.textDecoration = "none";
      if (url.startsWith("http")) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      editorRef.current.appendChild(a);
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setIsLinkModalOpen(false);
    activeLinkElRef.current = null;
    setHasActiveLink(false);
    savedLinkRangeRef.current = null;
  };

  const handleRemoveLink = () => {
    const anchor = activeLinkElRef.current;
    if (anchor) {
      const parent = anchor.parentNode;
      while (anchor.firstChild) {
        parent?.insertBefore(anchor.firstChild, anchor);
      }
      anchor.remove();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
    setIsLinkModalOpen(false);
    activeLinkElRef.current = null;
    setHasActiveLink(false);
    savedLinkRangeRef.current = null;
  };

  const handleRemoveLinesAndDots = () => {
    if (!editorRef.current) return;
    const root = editorRef.current;

    // 1. Remove all <hr> tags and divider elements
    const hrs = root.querySelectorAll("hr, .doc-divider, .pdf-divider");
    hrs.forEach((hr) => hr.remove());

    // 2. Remove borderBottom, borderTop, and border styling from headings, headers, and elements
    const allEls = root.querySelectorAll("*");
    allEls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style) {
        if (htmlEl.style.borderBottom) htmlEl.style.borderBottom = "none";
        if (htmlEl.style.borderTop) htmlEl.style.borderTop = "none";
        if (htmlEl.style.border && !htmlEl.closest("table")) htmlEl.style.border = "none";
      }
    });

    // 3. Remove stray dot artifacts (⋮ or isolated dots) from text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }
    for (const node of textNodes) {
      if (node.nodeValue) {
        node.nodeValue = node.nodeValue.replace(/[\s\u200B\uFEFF]*[⋮]+[\s\u200B\uFEFF]*/g, " ");
      }
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenLinkModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenLinkModal]);

  // Selected Image Resize state & controls (using ref to satisfy React compiler immutability)
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [hasSelectedImg, setHasSelectedImg] = useState<boolean>(false);
  const [imgToolbarPos, setImgToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [imgWidth, setImgWidth] = useState<number>(80);

  const updateImgPos = (img: HTMLImageElement) => {
    const rect = img.getBoundingClientRect();
    const x = Math.max(10, Math.min(window.innerWidth - 440, rect.left + rect.width / 2 - 210));
    const y = Math.max(65, rect.top - 58);
    setImgToolbarPos({ x, y });
  };

  const handleShrink = () => {
    const img = selectedImgRef.current;
    if (!img) return;
    const cur = img.offsetWidth || 80;
    const nw = Math.max(30, Math.round(cur * 0.85));
    img.style.width = `${nw}px`;
    img.style.height = "auto";
    setImgWidth(nw);
    updateImgPos(img);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleEnlarge = () => {
    const img = selectedImgRef.current;
    if (!img) return;
    const cur = img.offsetWidth || 80;
    const nw = Math.min(800, Math.round(cur * 1.15));
    img.style.width = `${nw}px`;
    img.style.height = "auto";
    setImgWidth(nw);
    updateImgPos(img);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleSetWidth = (wPx: number | string) => {
    const img = selectedImgRef.current;
    if (!img) return;
    if (typeof wPx === "number") {
      img.style.width = `${wPx}px`;
      setImgWidth(wPx);
    } else {
      img.style.width = wPx;
      setImgWidth(img.offsetWidth || 300);
    }
    img.style.height = "auto";
    updateImgPos(img);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleSetImageAlign = (align: "left" | "center" | "right") => {
    const img = selectedImgRef.current;
    if (!img) return;
    if (align === "center") {
      img.style.display = "block";
      img.style.marginLeft = "auto";
      img.style.marginRight = "auto";
      img.style.float = "none";
    } else if (align === "left") {
      img.style.display = "inline-block";
      img.style.float = "left";
      img.style.margin = "8px 16px 8px 0";
    } else {
      img.style.display = "inline-block";
      img.style.float = "right";
      img.style.margin = "8px 0 8px 16px";
    }
    updateImgPos(img);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleDeleteImg = () => {
    const img = selectedImgRef.current;
    if (!img) return;
    img.remove();
    selectedImgRef.current = null;
    setHasSelectedImg(false);
    setImgToolbarPos(null);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if user clicked an anchor tag (link) to inspect/edit it
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (anchor && !target.closest("#link-editor-modal")) {
      e.preventDefault();
      activeLinkElRef.current = anchor;
      setHasActiveLink(true);
      setLinkText(anchor.textContent || "");
      setLinkUrl(anchor.getAttribute("href") || "");
      savedLinkRangeRef.current = null;
      setIsLinkModalOpen(true);
      return;
    }

    // Check if user clicked an hr / divider line
    if (target.tagName.toLowerCase() === "hr" || target.classList.contains("doc-divider")) {
      target.style.outline = "2px dashed #f59e0b";
      target.style.outlineOffset = "2px";
      target.title = "Garis pemisah terpilih (Tekan Backspace atau klik dua kali untuk menghapus)";
      return;
    }

    if (target.tagName.toLowerCase() === "img") {
      const img = target as HTMLImageElement;
      if (selectedImgRef.current && selectedImgRef.current !== img) {
        selectedImgRef.current.style.outline = "";
        selectedImgRef.current.style.outlineOffset = "";
      }
      img.style.outline = "2px dashed #2563eb";
      img.style.outlineOffset = "3px";
      selectedImgRef.current = img;
      setHasSelectedImg(true);
      const curW = img.offsetWidth || 106;
      setImgWidth(curW);
      updateImgPos(img);
    } else if (!target.closest("#image-floating-toolbar")) {
      if (selectedImgRef.current) {
        selectedImgRef.current.style.outline = "";
        selectedImgRef.current.style.outlineOffset = "";
        selectedImgRef.current = null;
        setHasSelectedImg(false);
        setImgToolbarPos(null);
      }
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === "hr" || target.classList.contains("doc-divider")) {
      target.remove();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  };

  const handleAIFormat = async () => {
    setIsFormattingAI(true);
    try {
      const currentContent = editorRef.current?.innerHTML || htmlContent;
      const formatted = await formatDocumentWithAI(currentContent);
      if (formatted) {
        onChange(formatted);
      }
    } catch (err) {
      console.error("Gagal merapikan format:", err);
      alert("Gagal merapikan format dokumen.");
    } finally {
      setIsFormattingAI(false);
    }
  };

  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand("insertImage", false, dataUrl);
          onChange(editorRef.current.innerHTML);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePrint = () => {
    if (typeof window === "undefined" || !editorRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Dokumen - DocMorph</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #000; margin: 0; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #333; padding: 8px 12px; }
            th { background: #f4f4f5; font-weight: bold; }
            img { max-width: 100%; height: auto; }
            @page { margin: 15mm; }
          </style>
        </head>
        <body>
          ${editorRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Sync external HTML changes to editor innerHTML (initial load or full translate)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== htmlContent) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  // Handle user input in contentEditable
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setSavedRange(null);
      setBubblePosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      setSavedRange(range.cloneRange());
      setSelectedText(text);
      setTranslatedSelection("");

      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      const x = Math.min(
        Math.max(rect.left, (editorRect?.left || 40) + 10),
        window.innerWidth - 340
      );
      const y = Math.max(rect.top - 80, 70);

      setBubblePosition({ x, y });
    } else {
      setSelectedText("");
      setSavedRange(null);
      setBubblePosition(null);
    }
  };

  const handleTranslateSelection = async () => {
    if (!selectedText.trim()) return;
    setIsTranslatingSelection(true);
    try {
      const translated = await translateText(selectedText, targetLang);
      if (translated) {
        setTranslatedSelection(translated);
      } else {
        alert("Gagal menerjemahkan teks yang dipilih. Coba lagi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat menerjemahkan.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };

  const applyTranslatedSelection = () => {
    if (!savedRange || !translatedSelection) return;

    // Restore selection range
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    // Replace selected range with translated text without destroying wrapping tags
    savedRange.deleteContents();
    const textNode = document.createTextNode(translatedSelection);
    savedRange.insertNode(textNode);

    // Update parent
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }

    // Reset bubble
    setSelectedText("");
    setSavedRange(null);
    setBubblePosition(null);
    setTranslatedSelection("");
  };

  // Close floating bubble & image toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#translation-bubble") && !target.closest("#document-editor-canvas")) {
        setBubblePosition(null);
      }
      if (!target.closest("#image-floating-toolbar") && target.tagName.toLowerCase() !== "img") {
        if (selectedImgRef.current) {
          selectedImgRef.current.style.outline = "";
          selectedImgRef.current = null;
          setHasSelectedImg(false);
          setImgToolbarPos(null);
        }
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatting commands
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleInput();
  };

  // Insert Table
  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <thead>
          <tr style="background:#f4f4f5; font-weight:bold;">
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">No</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Nama Kolom A</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Nama Kolom B</th>
            <th style="border:1px solid #71717a; padding:8px 12px; text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #71717a; padding:8px 12px;">1</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Data Baris 1</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Nilai Format</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Selesai</td>
          </tr>
          <tr>
            <td style="border:1px solid #71717a; padding:8px 12px;">2</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Data Baris 2</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Nilai Format</td>
            <td style="border:1px solid #71717a; padding:8px 12px;">Proses</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd("insertHTML", tableHtml);
  };

  // Add row to active table
  const addTableRow = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const row = cell?.closest("tr");
    if (!row) {
      alert("Letakkan kursor di dalam sel tabel terlebih dahulu.");
      return;
    }
    const colsCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colsCount; i++) {
      const td = document.createElement("td");
      td.style.border = "1px solid #71717a";
      td.style.padding = "8px 12px";
      td.innerHTML = "Baris baru";
      newRow.appendChild(td);
    }
    row.parentNode?.insertBefore(newRow, row.nextSibling);
    handleInput();
  };

  // Add column to active table
  const addTableColumn = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const table = cell?.closest("table");
    if (!table) {
      alert("Letakkan kursor di dalam tabel terlebih dahulu.");
      return;
    }
    const rows = table.querySelectorAll("tr");
    rows.forEach((r, idx) => {
      const isHeader = idx === 0 && r.querySelector("th");
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.border = "1px solid #71717a";
      newCell.style.padding = "8px 12px";
      if (isHeader) {
        newCell.style.background = "#f4f4f5";
        newCell.style.fontWeight = "bold";
        newCell.innerHTML = "Kolom Baru";
      } else {
        newCell.innerHTML = "Data";
      }
      r.appendChild(newCell);
    });
    handleInput();
  };

  // Delete current table row
  const deleteTableRow = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    const cell = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    ) as HTMLElement | null;
    const row = cell?.closest("tr");
    if (row) {
      row.remove();
      handleInput();
    }
  };

  const getContainerStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black";
      case "brutalist":
        return "rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0px_#000] text-black";
      case "minimal":
        return "rounded-xl border border-zinc-200 bg-white shadow-xs text-zinc-900";
      case "cyber":
      default:
        return "rounded-2xl border border-white/10 bg-[#0B0D16]/90 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] text-white";
    }
  };

  const getToolbarStyle = () => {
    switch (theme) {
      case "retro":
        return "bg-[#c0c0c0] border-b-2 border-b-zinc-700 px-3 py-2";
      case "brutalist":
        return "bg-[#FEF08A] border-b-3 border-black px-4 py-2.5";
      case "minimal":
        return "bg-zinc-50/50 border-b border-zinc-100 px-4 py-2 text-zinc-600";
      case "cyber":
      default:
        return "bg-white/[0.02] border-b border-white/[0.07] px-4 py-2.5 text-zinc-300";
    }
  };

  const getBtnClass = () => {
    if (theme === "retro") {
      return "h-7 w-7 flex items-center justify-center bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold cursor-pointer";
    }
    if (theme === "brutalist") {
      return "h-7 w-7 flex items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer rounded";
    }
    return "h-7 w-7 flex items-center justify-center rounded hover:bg-current/10 cursor-pointer transition-colors";
  };

  return (
    <div className={`relative flex flex-col h-full overflow-hidden ${getContainerStyle()}`}>
      {/* Visual Rich Formatting Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${getToolbarStyle()}`}>
        {/* Formatting Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => execCmd("undo")}
            title="Urungkan (Undo)"
            className={getBtnClass()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            title="Ulangi (Redo)"
            className={getBtnClass()}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          <button
            type="button"
            onClick={() => execCmd("bold")}
            title="Tebal (Bold)"
            className={getBtnClass()}
          >
            <Bold className="h-3.5 w-3.5 font-bold" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            title="Miring (Italic)"
            className={getBtnClass()}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            title="Garis Bawah (Underline)"
            className={getBtnClass()}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            title="Coret (Strikethrough)"
            className={getBtnClass()}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Text Alignment Tools */}
          <button
            type="button"
            onClick={() => execCmd("justifyLeft")}
            title="Rata Kiri"
            className={getBtnClass()}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyCenter")}
            title="Rata Tengah"
            className={getBtnClass()}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyRight")}
            title="Rata Kanan"
            className={getBtnClass()}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyFull")}
            title="Rata Kiri Kanan (Justify)"
            className={getBtnClass()}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h1>")}
            title="Judul Utama (H1)"
            className={getBtnClass()}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h2>")}
            title="Sub Judul (H2)"
            className={getBtnClass()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            title="Daftar Poin"
            className={getBtnClass()}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            title="Daftar Angka"
            className={getBtnClass()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Link Tool */}
          <button
            type="button"
            onClick={handleOpenLinkModal}
            title="Sisipkan / Edit Tautan Link (Ctrl+K)"
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "border border-current/20 hover:bg-current/10"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
            <span>+ Link</span>
          </button>

          {/* Line & Dot Management Tools */}
          <button
            type="button"
            onClick={() => execCmd("insertHorizontalRule")}
            title="Sisipkan Garis Pemisah Baru (<hr>)"
            className={getBtnClass()}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRemoveLinesAndDots}
            title="Hapus Semua Garis, Garis Titik & Dot Pemisah dari Dokumen"
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "border border-current/20 hover:bg-current/10"
            }`}
          >
            <Eraser className="h-3.5 w-3.5 text-amber-500" />
            <span>Hapus Garis/Dot</span>
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Table Tools */}
          <button
            type="button"
            onClick={insertTable}
            title="Sisipkan Tabel Baru"
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "border border-current/20 hover:bg-current/10"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>+ Tabel</span>
          </button>

          <button
            type="button"
            onClick={addTableRow}
            title="Tambah Baris pada Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-current/10 opacity-80 cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Baris
          </button>

          <button
            type="button"
            onClick={addTableColumn}
            title="Tambah Kolom pada Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-current/10 opacity-80 cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Kolom
          </button>

          <button
            type="button"
            onClick={deleteTableRow}
            title="Hapus Baris Tabel Aktif"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[11px] rounded hover:bg-rose-500/20 text-rose-400 opacity-80 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" /> Hapus
          </button>

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Photo / Image Upload Tool */}
          <button
            type="button"
            onClick={() => imageUploadRef.current?.click()}
            title="Sisipkan Foto atau Gambar ke Dokumen"
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "border border-current/20 hover:bg-current/10"
            }`}
          >
            <ImagePlus className="h-3.5 w-3.5 text-emerald-500" />
            <span>+ Foto</span>
          </button>
          <input
            type="file"
            ref={imageUploadRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <span className="h-4 w-px bg-current/20 mx-1" />

          {/* Utility Tools: Clear Format & Print */}
          <button
            type="button"
            onClick={() => execCmd("removeFormat")}
            title="Bersihkan Format Teks"
            className={getBtnClass()}
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak Dokumen Langsung (Print)"
            className={getBtnClass()}
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* AI Formatting & Translation Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* AI Auto-Format Document */}
          <button
            type="button"
            disabled={isFormattingAI}
            onClick={handleAIFormat}
            title="Rapikan format dokumen/CV otomatis: tata letak judul, kontak, poin & spasi dengan AI"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black font-mono active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "rounded-xl border-2 border-black bg-[#A7F3D0] text-black shadow-[2px_2px_0px_#000] font-black"
                : theme === "minimal"
                ? "rounded-lg bg-zinc-800 text-white hover:bg-zinc-700"
                : "rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs hover:opacity-95"
            }`}
          >
            {isFormattingAI ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Merapikan Format (AI)...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                <span>Rapikan Format (AI)</span>
              </>
            )}
          </button>

          <span className="h-4 w-px bg-current/20 mx-0.5" />

          <div
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg ${
              theme === "retro"
                ? "bg-white border-2 border-black text-black"
                : theme === "brutalist"
                ? "border-2 border-black bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-zinc-300"
            }`}
          >
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <select
              value={fullTargetLang}
              onChange={(e) => setFullTargetLang(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden text-xs cursor-pointer font-sans"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-zinc-900 text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isTranslatingFull}
            onClick={() => onFullTranslate(fullTargetLang)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black text-black font-mono active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                : theme === "brutalist"
                ? "rounded-xl border-2 border-black bg-[#C084FC] text-black shadow-[2px_2px_0px_#000] font-black"
                : theme === "minimal"
                ? "rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                : "rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-xs"
            }`}
          >
            {isTranslatingFull ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menerjemahkan Dokumen &amp; Tabel...</span>
              </>
            ) : (
              <>
                <Languages className="h-3.5 w-3.5" />
                <span>Terjemahkan Dokumen (Pertahankan Format)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Selection Translation Bubble */}
      {bubblePosition && selectedText && (
        <div
          id="translation-bubble"
          style={{
            position: "fixed",
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className={`z-50 flex flex-col gap-2 p-3 w-84 animate-in fade-in zoom-in-95 duration-100 ${
            theme === "retro"
              ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black shadow-2xl"
              : theme === "brutalist"
              ? "rounded-2xl border-3 border-black bg-[#FFE600] text-black shadow-[6px_6px_0px_#000]"
              : theme === "minimal"
              ? "rounded-xl border border-zinc-200 bg-white/95 text-zinc-900 shadow-xl backdrop-blur-md"
              : "rounded-2xl border border-indigo-500/40 bg-[#0E101C]/95 text-white backdrop-blur-2xl shadow-[0_0_35px_rgba(99,102,241,0.3)]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/15 pb-1.5">
            <span className="text-[11px] font-bold uppercase">Ganti Bahasa Kata / Kalimat Terpilih</span>
            <button onClick={() => setBubblePosition(null)} className="cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-2 rounded border border-current/10 max-h-16 overflow-y-auto">
            &ldquo;{selectedText}&rdquo;
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full text-xs rounded border border-current/20 bg-white/10 dark:bg-black/20 px-2 py-1.5 focus:outline-hidden cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isTranslatingSelection}
              onClick={handleTranslateSelection}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isTranslatingSelection ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ubah"}
            </button>
          </div>

          {translatedSelection && (
            <div className="mt-1 flex flex-col gap-1.5 p-2.5 rounded border border-current/20 bg-emerald-500/10">
              <div className="text-[10px] uppercase font-bold text-emerald-500">Hasil Terjemahan:</div>
              <p className="text-xs font-semibold">{translatedSelection}</p>
              <button
                type="button"
                onClick={applyTranslatedSelection}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Terapkan ke Dokumen (Format Tetap)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Insert / Edit Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div
            id="link-editor-modal"
            className={`w-full max-w-md flex flex-col gap-3 p-5 rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-150 ${
              theme === "retro"
                ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black"
                : theme === "brutalist"
                ? "border-4 border-black bg-white text-black shadow-[6px_6px_0px_#000]"
                : theme === "minimal"
                ? "border border-zinc-200 bg-white text-zinc-900 shadow-xl"
                : "border border-cyan-500/30 bg-[#0E101C] text-white shadow-[0_0_35px_rgba(6,182,212,0.25)]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/15 pb-2.5">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {hasActiveLink ? "Edit Tautan (Link)" : "Sisipkan Tautan Baru (Link)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded hover:bg-current/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-80">
                  Teks Tautan (Display Text):
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Misal: fajarlm.vercel.app atau LinkedIn"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-current/20 bg-black/5 dark:bg-white/5 focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-80">
                  Alamat URL Target:
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://fajarlm.vercel.app atau mailto:..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-current/20 bg-black/5 dark:bg-white/5 focus:outline-hidden focus:border-cyan-400 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    }
                  }}
                  autoFocus
                />
              </div>

              {/* Quick prefix helpers */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] opacity-60">Awalan cepat:</span>
                <button
                  type="button"
                  onClick={() =>
                    setLinkUrl((prev) =>
                      prev.startsWith("https://") ? prev : "https://" + prev.replace(/^https?:\/\//, "")
                    )
                  }
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-current/10 hover:bg-current/20 cursor-pointer"
                >
                  https://
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLinkUrl((prev) =>
                      prev.startsWith("mailto:") ? prev : "mailto:" + prev.replace(/^mailto:/, "")
                    )
                  }
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-current/10 hover:bg-current/20 cursor-pointer"
                >
                  mailto:
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLinkUrl((prev) => (prev.startsWith("tel:") ? prev : "tel:" + prev.replace(/^tel:/, "")))
                  }
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-current/10 hover:bg-current/20 cursor-pointer"
                >
                  tel:
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/15 mt-1">
              <div>
                {hasActiveLink && (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    title="Hapus Tautan (Jadikan Teks Biasa)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    <span>Hapus Link</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {linkUrl && (
                  <a
                    href={linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Uji buka link di tab baru"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-current/10 cursor-pointer opacity-80"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Tes Link</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded hover:bg-current/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Terapkan Tautan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Image Control Toolbar (Perkecil & Perbesar) */}
      {hasSelectedImg && imgToolbarPos && (
        <div
          id="image-floating-toolbar"
          style={{
            position: "fixed",
            left: `${imgToolbarPos.x}px`,
            top: `${imgToolbarPos.y}px`,
          }}
          className={`z-50 flex flex-wrap items-center gap-1.5 p-2 rounded-xl border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
            theme === "retro"
              ? "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black font-mono text-black"
              : theme === "brutalist"
              ? "border-3 border-black bg-white text-black shadow-[4px_4px_0px_#000]"
              : theme === "minimal"
              ? "border border-zinc-200 bg-white/95 text-zinc-800"
              : "border border-cyan-500/30 bg-[#0E101C]/95 text-white shadow-[0_0_25px_rgba(6,182,212,0.3)]"
          }`}
        >
          {/* Quick Step Buttons */}
          <button
            type="button"
            onClick={handleShrink}
            title="Perkecil Ukuran Foto (-15%)"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded hover:bg-current/10 active:scale-95 cursor-pointer"
          >
            <ZoomOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Perkecil</span>
          </button>

          <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-black/10 dark:bg-white/10 border border-current/20">
            {imgWidth}px
          </span>

          <button
            type="button"
            onClick={handleEnlarge}
            title="Perbesar Ukuran Foto (+15%)"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded hover:bg-current/10 active:scale-95 cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5 text-emerald-400" />
            <span>Perbesar</span>
          </button>

          <span className="h-4 w-px bg-current/20 mx-0.5" />

          {/* Quick Size Presets */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleSetWidth(50)}
              title="Ukuran Kecil (50px)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer ${
                imgWidth === 50 ? "bg-current/15 font-black text-cyan-400" : ""
              }`}
            >
              50px
            </button>
            <button
              type="button"
              onClick={() => handleSetWidth(80)}
              title="Ukuran Ringkas (80px)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer ${
                imgWidth === 80 ? "bg-current/15 font-black text-cyan-400" : ""
              }`}
            >
              80px
            </button>
            <button
              type="button"
              onClick={() => handleSetWidth(106)}
              title="Ukuran Asli PDF (106px)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer ${
                imgWidth === 106 ? "bg-current/15 font-black text-cyan-400" : ""
              }`}
            >
              106px (Asli)
            </button>
            <button
              type="button"
              onClick={() => handleSetWidth(140)}
              title="Ukuran Sedang (140px)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer ${
                imgWidth === 140 ? "bg-current/15 font-black text-cyan-400" : ""
              }`}
            >
              140px
            </button>
            <button
              type="button"
              onClick={() => handleSetWidth(180)}
              title="Ukuran Besar (180px)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer ${
                imgWidth === 180 ? "bg-current/15 font-black text-cyan-400" : ""
              }`}
            >
              180px
            </button>
            <button
              type="button"
              onClick={() => handleSetWidth("100%")}
              title="Lebar Penuh (100%)"
              className="px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-current/10 cursor-pointer"
            >
              100%
            </button>
          </div>

          <span className="h-4 w-px bg-current/20 mx-0.5" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleSetImageAlign("left")}
              title="Rata Kiri"
              className="p-1 rounded hover:bg-current/10 cursor-pointer"
            >
              <AlignLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSetImageAlign("center")}
              title="Rata Tengah"
              className="p-1 rounded hover:bg-current/10 cursor-pointer"
            >
              <AlignCenter className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSetImageAlign("right")}
              title="Rata Kanan"
              className="p-1 rounded hover:bg-current/10 cursor-pointer"
            >
              <AlignRight className="h-3 w-3" />
            </button>
          </div>

          <span className="h-4 w-px bg-current/20 mx-0.5" />

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteImg}
            title="Hapus Foto"
            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main WYSIWYG Document Canvas */}
      <div
        className={`relative flex-1 p-4 sm:p-8 overflow-y-auto max-h-[750px] ${
          theme === "retro"
            ? "bg-[#c0c0c0] text-black font-mono"
            : theme === "brutalist"
            ? "bg-[#FFE600]/10 text-black"
            : theme === "minimal"
            ? "bg-zinc-100/90 text-zinc-900"
            : "bg-[#0b141a]/95 text-white"
        }`}
      >
        <div
          id="document-editor-canvas"
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onMouseUp={handleMouseUp}
          onKeyUp={handleMouseUp}
          className={`min-h-[500px] w-full max-w-5xl mx-auto focus:outline-hidden text-sm sm:text-base leading-relaxed ${
            theme === "retro" ? "text-black" : ""
          } [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-current/30 [&_th]:border [&_th]:border-current/30 [&_th]:p-2.5 [&_th]:font-bold [&_th]:bg-current/5 [&_td]:border [&_td]:border-current/30 [&_td]:p-2.5 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block`}
        />
      </div>

      {/* Document Stats Footer */}
      <div className="flex items-center justify-between border-t border-current/10 px-4 py-2 text-[11px] opacity-70">
        <div className="flex items-center gap-2">
          <Type className="h-3.5 w-3.5" />
          <span>Editor Visual WYSIWYG • Format dokumen, tabel, tebal &amp; miring terjaga 100%</span>
        </div>
        <div>Highlight kata/kalimat apa saja untuk mengubah bahasa bagian tersebut</div>
      </div>
    </div>
  );
};
