export type Rgb = [number, number, number];

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  return { canvas, ctx };
}

export async function blobToBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
  if (!blob) throw new Error(`Could not encode ${type}`);
  return blob;
}

export function drawBitmap(bitmap: ImageBitmap) {
  const { canvas, ctx } = canvasOf(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, 0, 0);
  return { canvas, ctx };
}

export function detectCornerMatte(ctx: CanvasRenderingContext2D): Rgb | null {
  const { width, height } = ctx.canvas;
  if (width < 16 || height < 16) return null;
  const size = Math.min(14, Math.floor(Math.min(width, height) / 8));
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - size, 0],
    [0, height - size],
    [width - size, height - size],
  ];
  const means: Rgb[] = [];
  for (const [x, y] of corners) {
    const data = ctx.getImageData(x, y, size, size).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      n += 1;
    }
    means.push([r / n, g / n, b / n]);
  }
  const avg: Rgb = [
    means.reduce((s, m) => s + m[0], 0) / 4,
    means.reduce((s, m) => s + m[1], 0) / 4,
    means.reduce((s, m) => s + m[2], 0) / 4,
  ];
  const spread = means.reduce((s, m) => {
    const d = (m[0] - avg[0]) ** 2 + (m[1] - avg[1]) ** 2 + (m[2] - avg[2]) ** 2;
    return s + Math.sqrt(d);
  }, 0) / 4;
  if (spread > 18) return null;
  const isMagenta = avg[0] > 170 && avg[2] > 170 && avg[1] < 90;
  const isGreen = avg[1] > 180 && avg[0] < 90 && avg[2] < 90;
  const isBlue = avg[2] > 190 && avg[0] < 80 && avg[1] < 80;
  const isWhite = avg[0] > 245 && avg[1] > 245 && avg[2] > 245;
  const isBlack = avg[0] < 8 && avg[1] < 8 && avg[2] < 8;
  if (isMagenta || isGreen || isBlue || isWhite || isBlack) {
    return [avg[0], avg[1], avg[2]];
  }
  return null;
}

export function chromaKey(
  ctx: CanvasRenderingContext2D,
  key: Rgb,
  tolerance = 52,
  softness = 36,
) {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const [kr, kg, kb] = key;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] ?? 0;
    const g = d[i + 1] ?? 0;
    const b = d[i + 2] ?? 0;
    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
    const alpha = Math.min(1, Math.max(0, (dist - tolerance) / softness));
    const spill = Math.min(1, Math.max(0, 1 - dist / (tolerance + softness * 2.2)));
    d[i] = r * (1 - spill * 0.72) + g * spill * 0.72;
    d[i + 1] = g;
    d[i + 2] = b * (1 - spill * 0.72) + g * spill * 0.72;
    d[i + 3] = Math.round((d[i + 3] ?? 255) * alpha);
  }
  ctx.putImageData(img, 0, 0);
}

export function cropToAlpha(ctx: CanvasRenderingContext2D, padRatio = 0.06) {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = d[(y * width + x) * 4 + 3] ?? 0;
      if (a > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return;
  const bw = maxX - minX;
  const bh = maxY - minY;
  const pad = Math.round(Math.max(bw, bh) * padRatio);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const cropped = ctx.getImageData(minX, minY, w, h);
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.putImageData(cropped, 0, 0);
}

export async function encodeWebp(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  try {
    return await canvasToBlob(canvas, "image/webp", quality);
  } catch {
    return canvasToBlob(canvas, "image/png");
  }
}

export async function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return canvasToBlob(canvas, "image/png");
}

export function looksLikePixelArt(width: number, height: number, bytes: number) {
  const maxSide = Math.max(width, height);
  return maxSide <= 256 && bytes / Math.max(width * height, 1) < 4;
}
