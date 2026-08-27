import { guessCategoryFromPath, inferKind } from "./categories";
import type { ImportCandidate } from "./types";
import { detectCornerMatte, drawBitmap, blobToBitmap } from "./convert";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;
const VIDEO_EXT = /\.(webm|mp4|mov|m4v)$/i;
const DOC_EXT = /\.(md|txt|pdf|json)$/i;

export function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function isVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXT.test(file.name);
}

export function isDocFile(file: File) {
  if (
    file.type.startsWith("text/") ||
    file.type.includes("pdf") ||
    file.type.includes("json")
  ) {
    return true;
  }
  return DOC_EXT.test(file.name);
}

export function isVaultFile(file: File) {
  return isImageFile(file) || isVideoFile(file) || isDocFile(file);
}

type FileWithPath = { file: File; relativePath: string };

export async function collectDroppedFiles(
  dataTransfer: DataTransfer,
): Promise<FileWithPath[]> {
  const items = Array.from(dataTransfer.items ?? []);
  if (items.some((item) => typeof item.webkitGetAsEntry === "function")) {
    const collected: FileWithPath[] = [];
    const entries = items
      .map((item) => item.webkitGetAsEntry?.())
      .filter((entry): entry is FileSystemEntry => Boolean(entry));
    for (const entry of entries) {
      await walkEntry(entry, "", collected);
    }
    if (collected.length) return collected;
  }
  return Array.from(dataTransfer.files ?? []).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}

async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: FileWithPath[],
) {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    out.push({
      file,
      relativePath: prefix ? `${prefix}/${file.name}` : file.name,
    });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAll(reader);
    const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    for (const child of children) {
      await walkEntry(child, nextPrefix, out);
    }
  }
}

function readAll(reader: FileSystemDirectoryReader) {
  return new Promise<FileSystemEntry[]>((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const pump = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(all);
          return;
        }
        all.push(...batch);
        pump();
      }, reject);
    };
    pump();
  });
}

export async function filesToCandidates(
  files: FileWithPath[],
): Promise<ImportCandidate[]> {
  const accepted = files.filter(({ file }) => isVaultFile(file));
  const candidates: ImportCandidate[] = [];
  for (const { file, relativePath } of accepted) {
    const category = guessCategoryFromPath(relativePath);
    const kind = inferKind(file.name, category, file.type);
    const previewUrl = URL.createObjectURL(file);
    let matte: [number, number, number] | null = null;
    if (kind === "image" || kind === "spritesheet") {
      try {
        const bitmap = await blobToBitmap(file);
        const { canvas, ctx } = drawBitmap(bitmap);
        matte = detectCornerMatte(ctx);
        canvas.width = 0;
        canvas.height = 0;
        bitmap.close();
      } catch {
        matte = null;
      }
    }
    candidates.push({
      id: crypto.randomUUID(),
      file,
      name: file.name.replace(/\.[^.]+$/, ""),
      relativePath,
      category,
      kind,
      size: file.size,
      previewUrl,
      matte,
    });
  }
  return candidates;
}

export function collectInputFiles(list: FileList | null): FileWithPath[] {
  if (!list) return [];
  return Array.from(list).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}
