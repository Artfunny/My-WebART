import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Asset, LibrarySettings } from "@/lib/assets/types";

type Props = {
  assets: Asset[];
  settings: LibrarySettings;
  exporting: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onExport: () => void;
  onFormat: (format: LibrarySettings["exportFormat"]) => void;
};

export function KitDock({
  assets,
  settings,
  exporting,
  onRemove,
  onClear,
  onExport,
  onFormat,
}: Props) {
  if (!assets.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-12 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              title={`Remove ${asset.name}`}
              onClick={() => onRemove(asset.id)}
              className="relative size-12 shrink-0 overflow-hidden rounded-md bg-check outline outline-1 -outline-offset-1 outline-fg/10"
            >
              <img
                src={asset.previewUrl}
                alt={asset.name}
                className="size-full object-contain p-1"
              />
            </button>
          ))}
          <p className="shrink-0 px-2 text-xs text-muted tabular-nums">
            {assets.length} in kit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-11 rounded-md border border-border bg-inset px-2 text-xs text-fg"
            value={settings.exportFormat}
            onChange={(e) =>
              onFormat(e.target.value as LibrarySettings["exportFormat"])
            }
          >
            <option value="both">WebP + PNG</option>
            <option value="webp">WebP only</option>
            <option value="png">PNG only</option>
          </select>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X />
            Clear
          </Button>
          <Button onClick={onExport} disabled={exporting}>
            <Download />
            {exporting ? "Packing…" : "Download kit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
