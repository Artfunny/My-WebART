export const CATEGORIES = [
  "characters",
  "props",
  "backgrounds",
  "buildings",
  "vehicles",
  "spritesheets",
  "video",
  "docs",
  "other",
  "unsorted",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type AssetKind = "image" | "spritesheet" | "video" | "doc";
export type AssetSource = "builtin" | "upload";

export type SeedAsset = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  tags: string[];
  width: number;
  height: number;
  png: string;
  webp: string;
  pngBytes: number;
  webpBytes: number;
  transparent: boolean;
  kind?: AssetKind;
  originalType?: string;
  cols?: number;
  rows?: number;
  excerpt?: string;
};

export type Asset = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  width: number;
  height: number;
  source: AssetSource;
  originalType: string;
  originalBytes: number;
  webpBytes: number;
  transparent: boolean;
  kind: AssetKind;
  pathHint?: string;
  previewUrl: string;
  originalUrl: string;
  webpUrl: string;
  cols?: number;
  rows?: number;
  excerpt?: string;
};

export type PersistedUpload = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  width: number;
  height: number;
  originalType: string;
  originalBytes: number;
  webpBytes: number;
  transparent: boolean;
  kind: AssetKind;
  pathHint?: string;
  cols?: number;
  rows?: number;
  excerpt?: string;
};

export type BuiltinOverride = {
  name?: string;
  category?: Category;
  tags?: string[];
  favorite?: boolean;
};

export type LibrarySettings = {
  webpQuality: number;
  keepOriginal: boolean;
  autoKey: boolean;
  exportFormat: "webp" | "png" | "both";
};

export type ImportCandidate = {
  id: string;
  file: File;
  name: string;
  relativePath: string;
  category: Category;
  kind: AssetKind;
  size: number;
  previewUrl: string;
  matte: [number, number, number] | null;
};

export const DEFAULT_SETTINGS: LibrarySettings = {
  webpQuality: 0.88,
  keepOriginal: true,
  autoKey: true,
  exportFormat: "both",
};
