import { Check, FileText, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { assetMetaLine, kindLabel } from "@/lib/assets/catalog";
import type { Asset } from "@/lib/assets/types";

type Props = {
  asset: Asset;
  inKit: boolean;
  onOpen: () => void;
  onToggleKit: () => void;
  onToggleFavorite: () => void;
};

export function AssetCard({
  asset,
  inKit,
  onOpen,
  onToggleKit,
  onToggleFavorite,
}: Props) {
  const ratio = asset.height > 0 ? asset.width / asset.height : 1;
  const wide = ratio > 1.25;
  const frame =
    asset.kind === "doc"
      ? "aspect-[4/5]"
      : asset.kind === "spritesheet"
        ? "aspect-square"
        : wide
          ? "aspect-video"
          : "aspect-[4/5]";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 ease-[var(--ease-smooth)]",
        "hover:shadow-[var(--shadow-border-hover)]",
        inKit && "shadow-[0_0_0_1px_var(--color-accent)]",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "relative w-full overflow-hidden rounded-t-xl",
          asset.kind === "doc" ? "bg-raised" : "bg-check",
          frame,
        )}
      >
        {asset.kind === "video" ? (
          <video
            src={asset.previewUrl}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            className="size-full object-contain"
          />
        ) : asset.kind === "doc" ? (
          <div className="flex size-full min-h-0 flex-col gap-2 overflow-hidden p-4 text-left">
            <FileText className="size-5 shrink-0 text-muted" />
            <p className="line-clamp-5 text-xs leading-5 text-muted">
              {asset.excerpt || "Markdown note"}
            </p>
          </div>
        ) : (
          <img
            src={asset.previewUrl}
            alt={asset.name}
            className="size-full object-contain p-3 outline outline-1 -outline-offset-1 outline-fg/10"
            draggable={false}
          />
        )}
        {asset.kind !== "image" && (
          <Badge className="absolute top-2 left-2">{kindLabel(asset.kind)}</Badge>
        )}
        {asset.source === "upload" && (
          <Badge className="absolute bottom-2 left-2">Yours</Badge>
        )}
      </button>

      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-fg">{asset.name}</h3>
          <p className="mt-0.5 font-mono text-[0.6875rem] text-subtle tabular-nums">
            {assetMetaLine(asset)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={asset.favorite ? "Unfavorite" : "Favorite"}
            onClick={onToggleFavorite}
            className="relative inline-flex size-9 items-center justify-center rounded-sm text-subtle hover:bg-raised hover:text-fg after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2"
          >
            <Star
              className={cn("size-4", asset.favorite && "fill-accent text-accent")}
            />
          </button>
          <button
            type="button"
            aria-label={inKit ? "Remove from kit" : "Add to kit"}
            onClick={onToggleKit}
            className={cn(
              "relative inline-flex size-9 items-center justify-center rounded-sm hover:bg-raised after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2",
              inKit ? "bg-accent text-accent-fg" : "text-subtle hover:text-fg",
            )}
          >
            <Check className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
