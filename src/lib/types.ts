export type SupportedFormat =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "txt"
  | "html"
  | "json"
  | "md";

export type EditorMode = "document" | "spreadsheet";

export interface LoadedDocument {
  id: string;
  name: string;
  size: number;
  originalExtension: SupportedFormat;
  targetExtension: SupportedFormat;
  mode: EditorMode;
  // For document mode (rich text or text)
  contentHtml: string;
  contentText: string;
  // For spreadsheet mode (2D array of rows/cells)
  sheetData: (string | number)[][];
  sheetName: string;
  // History
  history: string[];
}

export interface TargetOption {
  value: SupportedFormat;
  label: string;
  description: string;
  iconName: string;
}

export type AppTheme = "cyber" | "brutalist" | "minimal" | "retro";

export interface ThemeOption {
  id: AppTheme;
  name: string;
  icon: string;
  badge: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "cyber",
    name: "Dark Aurora Glass",
    icon: "🌌",
    badge: "Futuristic",
    description: "Obsidian space, neon glow & frosted glass",
  },
  {
    id: "brutalist",
    name: "Neo-Brutalism",
    icon: "⚡",
    badge: "Pop-Art",
    description: "Border hitam 3D, bayangan solid & warna pop",
  },
  {
    id: "minimal",
    name: "Pure Minimalist",
    icon: "🕊️",
    badge: "Zen",
    description: "Putih susu, tenang tanpa distraksi visual",
  },
  {
    id: "retro",
    name: "Retro Windows 98",
    icon: "💾",
    badge: "Nostalgia 90s",
    description: "Teal desktop, 3D bevels & classic window chrome",
  },
];

export const LANGUAGE_OPTIONS = [
  { code: "id", name: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "zh-CN", name: "Chinese Simplified (简体中文)", flag: "🇨🇳" },
  { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "fr", name: "French (Français)", flag: "🇫🇷" },
  { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ko", name: "Korean (한국어)", flag: "🇰🇷" },
  { code: "ru", name: "Russian (Русский)", flag: "🇷🇺" },
];
