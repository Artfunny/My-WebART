import { SEED_ASSETS } from "./seed";
import type { Asset, BuiltinOverride } from "./types";
import { formatBytes } from "../utils";

export function builtinAssets(
  overrides: Record<string, BuiltinOverride> = {},
  deletedIds: string[] = [],
): Asset[] {
  const deleted = new Set(deletedIds);
  return SEED_ASSETS.filter((seed) => !deleted.has(seed.id)).map((seed) => {
    const over = overrides[seed.id];
    const kind = seed.kind ?? "image";
    return {
      id: seed.id,
      name: over?.name ?? seed.name,
      slug: seed.slug,
      category: over?.category ?? seed.category,
      tags: over?.tags ?? seed.tags,
      favorite: over?.favorite ?? false,
      createdAt: 0,
      width: seed.width,
      height: seed.height,
      source: "builtin",
      originalType: seed.originalType ?? "image/png",
      originalBytes: seed.pngBytes,
      webpBytes: seed.webpBytes,
      transparent: seed.transparent,
      kind,
      previewUrl: seed.webp,
      originalUrl: seed.png,
      webpUrl: seed.webp,
      cols: seed.cols,
      rows: seed.rows,
      excerpt: seed.excerpt,
    } satisfies Asset;
  });
}

export function savingsLabel(pngBytes: number, webpBytes: number) {
  if (pngBytes <= 0 || webpBytes <= 0) return null;
  const ratio = 1 - webpBytes / pngBytes;
  if (ratio <= 0.05) return null;
  return Math.round(ratio * 100);
}

export function assetMetaLine(asset: Asset): string {
  if (asset.kind === "doc") return `${formatBytes(asset.originalBytes)}`;
  if (asset.kind === "video") {
    const size = asset.webpBytes || asset.originalBytes;
    return asset.width && asset.height
      ? `${asset.width}×${asset.height} · ${formatBytes(size)}`
      : formatBytes(size);
  }
  if (asset.kind === "spritesheet") {
    const grid =
      asset.cols && asset.rows ? `${asset.cols}×${asset.rows} · ` : "";
    return `${grid}${asset.width}×${asset.height} · ${formatBytes(asset.webpBytes)}`;
  }
  const saved = savingsLabel(asset.originalBytes, asset.webpBytes);
  return `${asset.width}×${asset.height} · ${formatBytes(asset.webpBytes)}${saved ? ` · −${saved}%` : ""}`;
}

export function kindLabel(kind: Asset["kind"]): string {
  if (kind === "spritesheet") return "Sheet";
  if (kind === "video") return "Video";
  if (kind === "doc") return "Doc";
  return "Still";
}
