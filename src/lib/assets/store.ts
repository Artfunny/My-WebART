import { create } from "zustand";
import { builtinAssets } from "./catalog";
import {
  chromaKey,
  cropToAlpha,
  detectCornerMatte,
  drawBitmap,
  encodePng,
  encodeWebp,
  blobToBitmap,
} from "./convert";
import { deleteBlobs, getBlob, originalKey, putBlob, webpKey } from "./idb";
import { LIBRARY_STORAGE_KEY as STORAGE_KEY } from "./store.keys";
import { slugify } from "../utils";
import type {
  Asset,
  BuiltinOverride,
  Category,
  ImportCandidate,
  LibrarySettings,
  PersistedUpload,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

type PersistShape = {
  uploads: PersistedUpload[];
  overrides: Record<string, BuiltinOverride>;
  deletedBuiltinIds: string[];
  kitIds: string[];
  settings: LibrarySettings;
  seenGuide: boolean;
};

export type FilterId = Category | "all" | "favorites";

type LibraryState = {
  ready: boolean;
  assets: Asset[];
  kitIds: string[];
  settings: LibrarySettings;
  filter: FilterId;
  search: string;
  seenGuide: boolean;
  importing: boolean;
  importProgress: { done: number; total: number };
  hydrate: () => Promise<void>;
  setFilter: (filter: FilterId) => void;
  setSearch: (search: string) => void;
  setSettings: (patch: Partial<LibrarySettings>) => void;
  markGuideSeen: () => void;
  toggleFavorite: (id: string) => void;
  toggleKit: (id: string) => void;
  addToKit: (ids: string[]) => void;
  clearKit: () => void;
  recategorize: (id: string, category: Category) => void;
  rename: (id: string, name: string) => void;
  setTags: (id: string, tags: string[]) => void;
  remove: (id: string) => Promise<void>;
  importCandidates: (candidates: ImportCandidate[]) => Promise<number>;
};

const objectUrls = new Map<string, string>();

function rememberUrl(key: string, blob: Blob) {
  const prev = objectUrls.get(key);
  if (prev) URL.revokeObjectURL(prev);
  const url = URL.createObjectURL(blob);
  objectUrls.set(key, url);
  return url;
}

function emptyPersist(): PersistShape {
  return {
    uploads: [],
    overrides: {},
    deletedBuiltinIds: [],
    kitIds: [],
    settings: DEFAULT_SETTINGS,
    seenGuide: false,
  };
}

function loadPersist(): PersistShape {
  if (typeof window === "undefined") return emptyPersist();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersist();
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    return {
      uploads: parsed.uploads ?? [],
      overrides: parsed.overrides ?? {},
      deletedBuiltinIds: parsed.deletedBuiltinIds ?? [],
      kitIds: parsed.kitIds ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      seenGuide: parsed.seenGuide ?? false,
    };
  } catch {
    return emptyPersist();
  }
}

let persistCache: PersistShape = loadPersist();

function savePersist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistCache));
}

function composeAssets(uploads: Asset[]): Asset[] {
  return [
    ...builtinAssets(persistCache.overrides, persistCache.deletedBuiltinIds),
    ...uploads,
  ];
}

export const useLibrary = create<LibraryState>((set, get) => ({
  ready: false,
  assets: builtinAssets(),
  kitIds: persistCache.kitIds,
  settings: persistCache.settings,
  filter: "all",
  search: "",
  seenGuide: persistCache.seenGuide,
  importing: false,
  importProgress: { done: 0, total: 0 },

  hydrate: async () => {
    persistCache = loadPersist();
    const uploads: Asset[] = [];
    for (const rec of persistCache.uploads) {
      const original = await getBlob(originalKey(rec.id));
      if (!original) continue;
      const webp = await getBlob(webpKey(rec.id));
      const preview = webp ?? original;
      uploads.push({
        ...rec,
        kind: rec.kind ?? "image",
        source: "upload",
        previewUrl: rememberUrl(`${rec.id}:preview`, preview),
        originalUrl: rememberUrl(`${rec.id}:original`, original),
        webpUrl: rememberUrl(`${rec.id}:webp`, preview),
      });
    }
    set({
      ready: true,
      assets: composeAssets(uploads),
      kitIds: persistCache.kitIds,
      settings: persistCache.settings,
      seenGuide: persistCache.seenGuide,
    });
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setSettings: (patch) => {
    persistCache.settings = { ...persistCache.settings, ...patch };
    savePersist();
    set({ settings: persistCache.settings });
  },
  markGuideSeen: () => {
    persistCache.seenGuide = true;
    savePersist();
    set({ seenGuide: true });
  },

  toggleFavorite: (id) => {
    const asset = get().assets.find((item) => item.id === id);
    if (!asset) return;
    const next = !asset.favorite;
    if (asset.source === "builtin") {
      persistCache.overrides[id] = {
        ...persistCache.overrides[id],
        favorite: next,
      };
    } else {
      persistCache.uploads = persistCache.uploads.map((item) =>
        item.id === id ? { ...item, favorite: next } : item,
      );
    }
    savePersist();
    set({
      assets: get().assets.map((item) =>
        item.id === id ? { ...item, favorite: next } : item,
      ),
    });
  },

  toggleKit: (id) => {
    const has = get().kitIds.includes(id);
    const kitIds = has
      ? get().kitIds.filter((item) => item !== id)
      : [...get().kitIds, id];
    persistCache.kitIds = kitIds;
    savePersist();
    set({ kitIds });
  },

  addToKit: (ids) => {
    const kitIds = Array.from(new Set([...get().kitIds, ...ids]));
    persistCache.kitIds = kitIds;
    savePersist();
    set({ kitIds });
  },

  clearKit: () => {
    persistCache.kitIds = [];
    savePersist();
    set({ kitIds: [] });
  },

  recategorize: (id, category) => {
    const asset = get().assets.find((item) => item.id === id);
    if (!asset) return;
    if (asset.source === "builtin") {
      persistCache.overrides[id] = { ...persistCache.overrides[id], category };
    } else {
      persistCache.uploads = persistCache.uploads.map((item) =>
        item.id === id ? { ...item, category } : item,
      );
    }
    savePersist();
    set({
      assets: get().assets.map((item) =>
        item.id === id ? { ...item, category } : item,
      ),
    });
  },

  rename: (id, name) => {
    const asset = get().assets.find((item) => item.id === id);
    if (!asset) return;
    if (asset.source === "builtin") {
      persistCache.overrides[id] = { ...persistCache.overrides[id], name };
    } else {
      persistCache.uploads = persistCache.uploads.map((item) =>
        item.id === id ? { ...item, name, slug: slugify(name) } : item,
      );
    }
    savePersist();
    set({
      assets: get().assets.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              slug: asset.source === "upload" ? slugify(name) : item.slug,
            }
          : item,
      ),
    });
  },

  setTags: (id, tags) => {
    const asset = get().assets.find((item) => item.id === id);
    if (!asset) return;
    if (asset.source === "builtin") {
      persistCache.overrides[id] = { ...persistCache.overrides[id], tags };
    } else {
      persistCache.uploads = persistCache.uploads.map((item) =>
        item.id === id ? { ...item, tags } : item,
      );
    }
    savePersist();
    set({
      assets: get().assets.map((item) =>
        item.id === id ? { ...item, tags } : item,
      ),
    });
  },

  remove: async (id) => {
    const asset = get().assets.find((item) => item.id === id);
    if (!asset) return;
    if (asset.source === "builtin") {
      persistCache.deletedBuiltinIds.push(id);
    } else {
      persistCache.uploads = persistCache.uploads.filter((item) => item.id !== id);
      await deleteBlobs([originalKey(id), webpKey(id)]);
    }
    persistCache.kitIds = persistCache.kitIds.filter((item) => item !== id);
    savePersist();
    set({
      assets: get().assets.filter((item) => item.id !== id),
      kitIds: persistCache.kitIds,
    });
  },

  importCandidates: async (candidates) => {
    set({
      importing: true,
      importProgress: { done: 0, total: candidates.length },
    });
    const quality = get().settings.webpQuality;
    const autoKey = get().settings.autoKey;
    let imported = 0;
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate) continue;
      try {
        const asset = await processCandidate(candidate, quality, autoKey);
        persistCache.uploads.push({
          id: asset.id,
          name: asset.name,
          slug: asset.slug,
          category: asset.category,
          tags: asset.tags,
          favorite: false,
          createdAt: asset.createdAt,
          width: asset.width,
          height: asset.height,
          originalType: asset.originalType,
          originalBytes: asset.originalBytes,
          webpBytes: asset.webpBytes,
          transparent: asset.transparent,
          kind: asset.kind,
          pathHint: asset.pathHint,
          cols: asset.cols,
          rows: asset.rows,
          excerpt: asset.excerpt,
        });
        set({
          assets: [...get().assets, asset],
          importProgress: { done: i + 1, total: candidates.length },
        });
        imported += 1;
      } catch (err) {
        console.warn("import failed", candidate.name, err);
        set({ importProgress: { done: i + 1, total: candidates.length } });
      }
      await yieldFrame();
    }
    savePersist();
    set({ importing: false });
    return imported;
  },
}));

function yieldFrame() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function processCandidate(
  candidate: ImportCandidate,
  quality: number,
  autoKey: boolean,
): Promise<Asset> {
  const id = candidate.id;
  const slug = uniqueSlug(slugify(candidate.name));
  const base = {
    id,
    name: candidate.name,
    slug,
    category: candidate.category,
    tags: [] as string[],
    favorite: false,
    createdAt: Date.now(),
    source: "upload" as const,
    pathHint: candidate.relativePath,
    kind: candidate.kind,
  };

  if (candidate.kind === "video" || candidate.kind === "doc") {
    await putBlob(originalKey(id), candidate.file);
    await putBlob(webpKey(id), candidate.file);
    let excerpt: string | undefined;
    if (candidate.kind === "doc" && !candidate.file.type.includes("pdf")) {
      try {
        excerpt = (await candidate.file.text()).slice(0, 280);
      } catch {
        excerpt = undefined;
      }
    }
    const url = rememberUrl(`${id}:preview`, candidate.file);
    return {
      ...base,
      width: 0,
      height: 0,
      originalType: candidate.file.type || "application/octet-stream",
      originalBytes: candidate.file.size,
      webpBytes: candidate.file.size,
      transparent: false,
      excerpt,
      previewUrl: url,
      originalUrl: rememberUrl(`${id}:original`, candidate.file),
      webpUrl: url,
    };
  }

  const bitmap = await blobToBitmap(candidate.file);
  const { canvas, ctx } = drawBitmap(bitmap);
  let transparent = false;
  if (autoKey) {
    const matte = candidate.matte ?? detectCornerMatte(ctx);
    if (matte) {
      chromaKey(ctx, matte);
      if (candidate.kind !== "spritesheet") cropToAlpha(ctx);
      transparent = true;
    }
  }
  const pngBlob = await encodePng(canvas);
  const webpBlob = await encodeWebp(canvas, quality);
  await putBlob(originalKey(id), pngBlob);
  await putBlob(webpKey(id), webpBlob);
  bitmap.close();
  return {
    ...base,
    width: canvas.width,
    height: canvas.height,
    originalType: "image/png",
    originalBytes: pngBlob.size,
    webpBytes: webpBlob.size,
    transparent,
    cols: candidate.kind === "spritesheet" ? 2 : undefined,
    rows: candidate.kind === "spritesheet" ? 2 : undefined,
    previewUrl: rememberUrl(`${id}:preview`, webpBlob),
    originalUrl: rememberUrl(`${id}:original`, pngBlob),
    webpUrl: rememberUrl(`${id}:webp`, webpBlob),
  };
}

function uniqueSlug(base: string) {
  const used = new Set(useLibrary.getState().assets.map((a) => a.slug));
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function filterAssets(
  assets: Asset[],
  filter: FilterId,
  search: string,
): Asset[] {
  const q = search.trim().toLowerCase();
  return assets
    .filter((asset) => {
      if (filter === "favorites") return asset.favorite;
      if (filter !== "all" && asset.category !== filter) return false;
      if (!q) return true;
      const hay =
        `${asset.name} ${asset.tags.join(" ")} ${asset.slug} ${asset.pathHint ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (a.source !== b.source) return a.source === "upload" ? -1 : 1;
      if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
      return a.name.localeCompare(b.name);
    });
}
