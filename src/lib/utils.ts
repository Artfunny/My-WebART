import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|$)/g, "");
  return slug || "asset";
}

export function extForType(type: string, name = ""): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("gif")) return "gif";
  if (type.includes("webm")) return "webm";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("quicktime") || type.includes("mov")) return "mov";
  if (type.includes("markdown") || /\.md$/i.test(name)) return "md";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("json")) return "json";
  if (type.includes("text") || /\.txt$/i.test(name)) return "txt";
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "bin";
}
