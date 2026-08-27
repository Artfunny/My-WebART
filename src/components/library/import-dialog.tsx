import { FileText, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FILE_CATEGORIES, categoryLabel } from "@/lib/assets/categories";
import { formatBytes } from "@/lib/utils";
import type { Category, ImportCandidate } from "@/lib/assets/types";

type Props = {
  open: boolean;
  candidates: ImportCandidate[];
  importing: boolean;
  progress: { done: number; total: number };
  onOpenChange: (open: boolean) => void;
  onChangeCategory: (id: string, category: Category) => void;
  onRemove: (id: string) => void;
  onImport: () => void;
};

export function ImportDialog({
  open,
  candidates,
  importing,
  progress,
  onOpenChange,
  onChangeCategory,
  onRemove,
  onImport,
}: Props) {
  const keyed = candidates.filter((c) => c.matte).length;
  const pct =
    progress.total === 0 ? 0 : (progress.done / progress.total) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,44rem)] flex-col p-0">
        <DialogHeader>
          <DialogTitle>Bring into the library</DialogTitle>
          <DialogDescription>
            {candidates.length} file{candidates.length === 1 ? "" : "s"} ready.
            Folder names map to categories. Stills convert to WebP; video and
            docs keep their format.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-3">
          <ul className="flex flex-col gap-2">
            {candidates.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-raised p-2"
              >
                <Thumb candidate={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate font-mono text-[0.6875rem] text-subtle">
                    {item.relativePath} · {formatBytes(item.size)}
                    {item.matte ? " · matte" : ""}
                  </p>
                </div>
                <select
                  className="h-9 max-w-36 rounded-sm border border-border bg-inset px-2 text-xs text-fg"
                  value={item.category}
                  disabled={importing}
                  onChange={(e) =>
                    onChangeCategory(item.id, e.target.value as Category)
                  }
                >
                  {FILE_CATEGORIES.map((id) => (
                    <option key={id} value={id}>
                      {categoryLabel(id)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={importing}
                  onClick={() => onRemove(item.id)}
                >
                  Skip
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-6 py-4">
          {importing && <Progress value={pct} />}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {keyed
                ? `${keyed} with a keyed background`
                : "Studio mattes, if present, are keyed on stills and sheets"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={importing}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button disabled={importing || candidates.length === 0} onClick={onImport}>
                {importing
                  ? `Importing ${progress.done}/${progress.total}`
                  : `Import ${candidates.length}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Thumb({ candidate }: { candidate: ImportCandidate }) {
  if (candidate.kind === "video") {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-inset text-muted">
        <Film className="size-4" />
      </div>
    );
  }
  if (candidate.kind === "doc") {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-inset text-muted">
        <FileText className="size-4" />
      </div>
    );
  }
  return (
    <img
      src={candidate.previewUrl}
      alt=""
      className="size-12 shrink-0 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-fg/10"
    />
  );
}
