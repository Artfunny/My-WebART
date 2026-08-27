import { useEffect, useState } from "react";
import { Download, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FILE_CATEGORIES, categoryLabel } from "@/lib/assets/categories";
import { assetMetaLine, kindLabel, savingsLabel } from "@/lib/assets/catalog";
import { useLibrary } from "@/lib/assets/store";
import type { Asset, Category } from "@/lib/assets/types";
import { extForType, formatBytes } from "@/lib/utils";

type Props = {
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
};

export function AssetDetail({ asset, onOpenChange }: Props) {
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const toggleKit = useLibrary((s) => s.toggleKit);
  const recategorize = useLibrary((s) => s.recategorize);
  const rename = useLibrary((s) => s.rename);
  const setTags = useLibrary((s) => s.setTags);
  const remove = useLibrary((s) => s.remove);
  const kitIds = useLibrary((s) => s.kitIds);
  const [tagDraft, setTagDraft] = useState("");
  const [docBody, setDocBody] = useState("");

  useEffect(() => {
    if (!asset || asset.kind !== "doc") {
      setDocBody("");
      return;
    }
    let cancelled = false;
    fetch(asset.originalUrl)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setDocBody(text);
      })
      .catch(() => {
        if (!cancelled) setDocBody(asset.excerpt ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [asset]);

  if (!asset) return null;
  const inKit = kitIds.includes(asset.id);
  const saved = savingsLabel(asset.originalBytes, asset.webpBytes);
  const raster = asset.kind === "image" || asset.kind === "spritesheet";
  const hasConverted = asset.webpUrl !== asset.originalUrl;

  function download(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(92vh,52rem)] grid-rows-[auto_1fr] overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription>
            {kindLabel(asset.kind)}
            {asset.kind === "spritesheet" && asset.cols && asset.rows
              ? ` · ${asset.cols}×${asset.rows} grid`
              : ""}
            {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
            {asset.transparent ? " · Transparent" : ""}
            {" · "}
            {asset.source === "builtin" ? "Starter pack" : "Imported"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-0 overflow-y-auto md:grid-cols-[1.15fr_0.85fr]">
          <div
            className={
              asset.kind === "doc"
                ? "min-h-64 overflow-y-auto bg-inset p-5 md:min-h-[28rem]"
                : "bg-check flex min-h-64 items-center justify-center p-6 md:min-h-[28rem]"
            }
          >
            {asset.kind === "video" ? (
              <video
                src={asset.previewUrl}
                controls
                loop
                playsInline
                className="max-h-[22rem] max-w-full"
              />
            ) : asset.kind === "doc" ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-muted">
                {docBody || asset.excerpt || "Empty note"}
              </pre>
            ) : (
              <img
                src={asset.previewUrl}
                alt={asset.name}
                className="max-h-[22rem] max-w-full object-contain outline outline-1 -outline-offset-1 outline-fg/10"
              />
            )}
          </div>
          <div className="flex flex-col gap-4 border-t border-border p-5 md:border-t-0 md:border-l">
            <label className="block text-xs font-medium text-muted">
              Name
              <Input
                className="mt-1.5"
                value={asset.name}
                onChange={(e) => rename(asset.id, e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              Category
              <select
                className="mt-1.5 flex h-11 w-full rounded-md border border-border bg-inset px-3 text-sm text-fg"
                value={asset.category}
                onChange={(e) =>
                  recategorize(asset.id, e.target.value as Category)
                }
              >
                {FILE_CATEGORIES.map((id) => (
                  <option key={id} value={id}>
                    {categoryLabel(id)}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs font-medium text-muted">Tags</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full bg-raised px-2 py-1 text-xs text-muted hover:text-fg"
                    onClick={() =>
                      setTags(
                        asset.id,
                        asset.tags.filter((t) => t !== tag),
                      )
                    }
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <Input
                className="mt-2 h-9"
                placeholder="Add tag and press Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const next = tagDraft.trim().toLowerCase();
                  if (!next || asset.tags.includes(next)) return;
                  setTags(asset.id, [...asset.tags, next]);
                  setTagDraft("");
                }}
              />
            </div>
            <p className="font-mono text-xs text-muted tabular-nums">
              {assetMetaLine(asset)}
            </p>
            {raster && saved ? (
              <dl className="grid grid-cols-2 gap-3 font-mono text-xs text-muted tabular-nums">
                <div>
                  <dt className="text-subtle">PNG</dt>
                  <dd className="mt-0.5 text-fg">
                    {formatBytes(asset.originalBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle">WebP</dt>
                  <dd className="mt-0.5 text-fg">
                    {formatBytes(asset.webpBytes)} (−{saved}%)
                  </dd>
                </div>
              </dl>
            ) : null}
            {asset.pathHint && (
              <p className="truncate text-xs text-subtle" title={asset.pathHint}>
                {asset.pathHint}
              </p>
            )}
            <div className="mt-auto flex flex-col gap-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={inKit ? "default" : "secondary"}
                  onClick={() => toggleKit(asset.id)}
                >
                  {inKit ? "In kit" : "Add to kit"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toggleFavorite(asset.id)}
                >
                  <Star
                    className={asset.favorite ? "fill-accent text-accent" : ""}
                  />
                  Favorite
                </Button>
              </div>
              {raster ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      download(asset.webpUrl, `${asset.slug}.webp`)
                    }
                  >
                    <Download />
                    WebP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      download(asset.originalUrl, `${asset.slug}.png`)
                    }
                  >
                    <Download />
                    PNG
                  </Button>
                </div>
              ) : hasConverted ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      download(
                        asset.webpUrl,
                        `${asset.slug}.${extForType("", asset.webpUrl)}`,
                      )
                    }
                  >
                    <Download />
                    WebM
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      download(
                        asset.originalUrl,
                        `${asset.slug}.${extForType(asset.originalType, asset.originalUrl)}`,
                      )
                    }
                  >
                    <Download />
                    Source
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      asset.originalUrl,
                      `${asset.slug}.${extForType(asset.originalType, asset.originalUrl)}`,
                    )
                  }
                >
                  <Download />
                  Download
                </Button>
              )}
              <Button
                variant="danger"
                onClick={async () => {
                  await remove(asset.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 />
                Remove from library
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
