import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GuideDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader>
          <DialogTitle>How My WebArt works</DialogTitle>
          <DialogDescription>
            PNG to WEBP · Kit builder — drop files, convert stills, pick a kit,
            download a zip.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 pb-6 text-sm text-muted">
          <section>
            <h3 className="font-medium text-fg">Drop files</h3>
            <p className="mt-1">
              A website cannot scan your PC. Drop files or whole folders onto
              the page — or use Files / Folder. Names like characters, props,
              or backgrounds set the category; the rest lands in Unsorted.
            </p>
          </section>
          <section>
            <h3 className="font-medium text-fg">Convert</h3>
            <p className="mt-1">
              Stills and sprite sheets convert to WebP in the browser. PNG is
              kept as the lossless original. Video and docs stay in their own
              format.
            </p>
          </section>
          <section>
            <h3 className="font-medium text-fg">Pick a kit · download zip</h3>
            <p className="mt-1">
              Tick pieces into the dock, choose WebP, PNG, or both, then
              Download kit. kit.json inside the zip lists every file.
            </p>
          </section>
          <Button className="self-end" onClick={() => onOpenChange(false)}>
            Open the library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
