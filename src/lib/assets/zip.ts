import JSZip from "jszip";
import { categoryLabel, EXPORT_CATEGORIES } from "./categories";
import { getBlob, originalKey, webpKey } from "./idb";
import { KIT_NAME_PREFIX, STUDIO_NAME } from "./store.keys";
import type { Asset, LibrarySettings } from "./types";
import { extForType } from "../utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function kitFolderName(now = new Date()) {
  return `${KIT_NAME_PREFIX}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

async function blobForBuiltin(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Missing asset ${url}`);
  return res.blob();
}

async function originalBlob(asset: Asset): Promise<Blob> {
  if (asset.source === "builtin") return blobForBuiltin(asset.originalUrl);
  const blob = await getBlob(originalKey(asset.id));
  if (!blob) throw new Error(`Original missing for ${asset.name}`);
  return blob;
}

async function webpBlob(asset: Asset): Promise<Blob> {
  if (asset.source === "builtin") return blobForBuiltin(asset.webpUrl);
  const blob = await getBlob(webpKey(asset.id));
  if (!blob) throw new Error(`WebP missing for ${asset.name}`);
  return blob;
}

function isRaster(asset: Asset) {
  return asset.kind === "image" || asset.kind === "spritesheet";
}

export async function buildKitZip(
  assets: Asset[],
  settings: LibrarySettings,
  kitName = kitFolderName(),
): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(kitName);
  if (!root) throw new Error("Could not create zip folder");

  const manifest = {
    studio: STUDIO_NAME,
    name: kitName,
    created: new Date().toISOString(),
    format: settings.exportFormat,
    assets: assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      slug: asset.slug,
      category: asset.category,
      kind: asset.kind,
      tags: asset.tags,
      width: asset.width,
      height: asset.height,
      cols: asset.cols,
      rows: asset.rows,
      transparent: asset.transparent,
      files: fileNames(asset, settings),
    })),
  };

  root.file("kit.json", JSON.stringify(manifest, null, 2));
  root.file("README.txt", kitReadme(assets.length, kitName));

  for (const asset of assets) {
    const folder = root.folder(asset.category) ?? root;
    if (!isRaster(asset)) {
      const blob = await originalBlob(asset);
      const ext = extForType(asset.originalType, asset.originalUrl);
      folder.file(`${asset.slug}.${ext}`, blob);
      if (asset.webpUrl !== asset.originalUrl) {
        const converted = await webpBlob(asset);
        const convExt = extForType("", asset.webpUrl);
        if (convExt !== ext) {
          folder.file(`${asset.slug}.${convExt}`, converted);
        }
      }
      continue;
    }
    if (settings.exportFormat === "png" || settings.exportFormat === "both") {
      const blob = await originalBlob(asset);
      const ext = extForType(asset.originalType, "png");
      folder.file(`${asset.slug}.${ext}`, blob);
    }
    if (settings.exportFormat === "webp" || settings.exportFormat === "both") {
      const blob = await webpBlob(asset);
      folder.file(`${asset.slug}.webp`, blob);
    }
  }

  return zip.generateAsync({ type: "blob" });
}

function fileNames(asset: Asset, settings: LibrarySettings) {
  const files: string[] = [];
  if (!isRaster(asset)) {
    const ext = extForType(asset.originalType, asset.originalUrl);
    files.push(`${asset.category}/${asset.slug}.${ext}`);
    if (asset.webpUrl !== asset.originalUrl) {
      const convExt = extForType("", asset.webpUrl);
      if (convExt !== ext) {
        files.push(`${asset.category}/${asset.slug}.${convExt}`);
      }
    }
    return files;
  }
  const ext = extForType(asset.originalType, "png");
  if (settings.exportFormat === "png" || settings.exportFormat === "both") {
    files.push(`${asset.category}/${asset.slug}.${ext}`);
  }
  if (settings.exportFormat === "webp" || settings.exportFormat === "both") {
    files.push(`${asset.category}/${asset.slug}.webp`);
  }
  return files;
}

function kitReadme(count: number, kitName: string) {
  return [
    `${kitName}`,
    `Packed by ${STUDIO_NAME} — ${count} web-ready assets.`,
    "",
    "PNG to WEBP · Kit builder.",
    "kit.json lists every file, kind, tag and category.",
    "",
    "Folders:",
    ...EXPORT_CATEGORIES.map((id) => `  ${id}/  — ${categoryLabel(id)}`),
    "",
    "Stills and sheets: WebP for runtime, PNG as the lossless original.",
    "Video: WebM loops, MP4 kept as source when present.",
    "Docs: Markdown notes for the next build.",
  ].join("\n");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
