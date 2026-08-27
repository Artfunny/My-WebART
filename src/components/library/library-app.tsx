import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  FolderUp,
  HelpCircle,
  Search,
  Settings2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AssetCard } from "./asset-card";
import { AssetDetail } from "./asset-detail";
import { GuideDialog } from "./guide-dialog";
import { ImportDialog } from "./import-dialog";
import { KitDock } from "./kit-dock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAV_ITEMS } from "@/lib/assets/categories";
import {
  collectDroppedFiles,
  collectInputFiles,
  filesToCandidates,
} from "@/lib/assets/ingest";
import { filterAssets, useLibrary } from "@/lib/assets/store";
import { buildKitZip, downloadBlob, kitFolderName } from "@/lib/assets/zip";
import type { Asset, ImportCandidate } from "@/lib/assets/types";
import { cn } from "@/lib/utils";

export function LibraryApp() {
  const hydrate = useLibrary((s) => s.hydrate);
  const assets = useLibrary((s) => s.assets);
  const filter = useLibrary((s) => s.filter);
  const search = useLibrary((s) => s.search);
  const setFilter = useLibrary((s) => s.setFilter);
  const setSearchValue = useLibrary((s) => s.setSearch);
  const kitIds = useLibrary((s) => s.kitIds);
  const toggleKit = useLibrary((s) => s.toggleKit);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const addToKit = useLibrary((s) => s.addToKit);
  const clearKit = useLibrary((s) => s.clearKit);
  const settings = useLibrary((s) => s.settings);
  const setSettings = useLibrary((s) => s.setSettings);
  const importCandidatesFn = useLibrary((s) => s.importCandidates);
  const importing = useLibrary((s) => s.importing);
  const importProgress = useLibrary((s) => s.importProgress);
  const markGuideSeen = useLibrary((s) => s.markGuideSeen);

  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<Asset | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dragDepth = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(
    () => filterAssets(assets, filter, search),
    [assets, filter, search],
  );

  const kitAssets = kitIds
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is Asset => Boolean(a));

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: assets.length, favorites: 0 };
    for (const asset of assets) {
      map[asset.category] = (map[asset.category] ?? 0) + 1;
      if (asset.favorite) map.favorites = (map.favorites ?? 0) + 1;
    }
    return map;
  }, [assets]);

  async function openCandidates(list: ImportCandidate[]) {
    if (!list.length) {
      toast("No supported files in that drop");
      return;
    }
    setCandidates(list);
    setImportOpen(true);
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = await collectDroppedFiles(event.dataTransfer);
    const next = await filesToCandidates(files);
    await openCandidates(next);
  }

  async function handleInput(list: FileList | null) {
    const next = await filesToCandidates(collectInputFiles(list));
    await openCandidates(next);
  }

  function closeImport(open: boolean) {
    if (!open) {
      for (const item of candidates) URL.revokeObjectURL(item.previewUrl);
      setCandidates([]);
    }
    setImportOpen(open);
  }

  async function runImport() {
    const n = await importCandidatesFn(candidates);
    toast(`Imported ${n} asset${n === 1 ? "" : "s"}`);
    closeImport(false);
  }

  async function exportKit() {
    if (!kitAssets.length) return;
    setExporting(true);
    try {
      const name = kitFolderName();
      const blob = await buildKitZip(kitAssets, settings, name);
      downloadBlob(blob, `${name}.zip`);
      toast(`Packed ${kitAssets.length} assets`);
    } catch (err) {
      console.error(err);
      toast("Could not pack the kit");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="min-h-dvh bg-bg text-fg"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => void handleDrop(e)}
    >
      <a
        href="#library"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        Skip to assets
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-2">
            <p className="font-display text-xl font-medium tracking-tight">
              My WebArt
            </p>
            <p className="text-sm text-muted">PNG to WEBP · Kit builder</p>
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search names, tags, paths"
              className="pl-10"
              aria-label="Search assets"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload />
              Files
            </Button>
            <Button
              variant="secondary"
              onClick={() => folderRef.current?.click()}
            >
              <FolderUp />
              Folder
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/how-to">How to use</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="How it works"
              onClick={() => setGuideOpen(true)}
            >
              <HelpCircle />
            </Button>
            <details className="relative">
              <summary className="flex size-11 list-none items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg [&::-webkit-details-marker]:hidden">
                <Settings2 className="size-4" />
                <span className="sr-only">Settings</span>
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-xs font-medium text-muted">WebP quality</p>
                <input
                  type="range"
                  min={0.6}
                  max={1}
                  step={0.02}
                  value={settings.webpQuality}
                  onChange={(e) =>
                    setSettings({ webpQuality: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-accent"
                />
                <p className="mt-1 font-mono text-[0.6875rem] text-subtle tabular-nums">
                  {Math.round(settings.webpQuality * 100)}%
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.autoKey}
                    onChange={(e) =>
                      setSettings({ autoKey: e.target.checked })
                    }
                    className="size-4 accent-accent"
                  />
                  Key studio backgrounds
                </label>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const count = counts[item.id] ?? 0;
              if (item.id === "unsorted" && count === 0) return null;
              const Icon = item.icon;
              const activeNav = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-md px-3 text-sm",
                    activeNav
                      ? "bg-raised text-fg"
                      : "text-muted hover:bg-raised/60 hover:text-fg",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="font-mono text-[0.6875rem] text-subtle tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          id="library"
          className={cn("min-w-0 flex-1", kitAssets.length ? "pb-44" : "pb-10")}
        >
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {NAV_ITEMS.map((item) => {
              const count = counts[item.id] ?? 0;
              if (item.id === "unsorted" && count === 0) return null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "h-11 shrink-0 rounded-full px-4 text-sm",
                    filter === item.id
                      ? "bg-accent text-accent-fg"
                      : "bg-raised text-muted",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                {NAV_ITEMS.find((i) => i.id === filter)?.label ?? "Library"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {shown.length} piece{shown.length === 1 ? "" : "s"}
                {search ? ` matching “${search}”` : ""}
              </p>
            </div>
            {shown.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToKit(shown.map((a) => a.id))}
              >
                Add view to kit
              </Button>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <p className="font-display text-xl">Nothing in this drawer</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Drop a folder of PNGs, sprite sheets, WebM clips, or Markdown
                onto the page. We sort by folder name, convert stills to WebP,
                and keep video and docs as they are.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button onClick={() => folderRef.current?.click()}>
                  <FolderUp />
                  Choose folder
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  inKit={kitIds.includes(asset.id)}
                  onOpen={() => setActive(asset)}
                  onToggleKit={() => toggleKit(asset.id)}
                  onToggleFavorite={() => toggleFavorite(asset.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <KitDock
        assets={kitAssets}
        settings={settings}
        exporting={exporting}
        onRemove={(id) => toggleKit(id)}
        onClear={clearKit}
        onExport={() => void exportKit()}
        onFormat={(exportFormat) => setSettings({ exportFormat })}
      />

      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80">
          <div className="rounded-xl border border-dashed border-accent px-10 py-12 text-center">
            <p className="font-display text-2xl">Drop to import</p>
            <p className="mt-2 text-sm text-muted">
              Folders, stills, sheets, WebM, or notes — we will sort it.
            </p>
          </div>
        </div>
      )}

      <AssetDetail
        asset={active ? (assets.find((a) => a.id === active.id) ?? active) : null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      />
      <ImportDialog
        open={importOpen}
        candidates={candidates}
        importing={importing}
        progress={importProgress}
        onOpenChange={closeImport}
        onChangeCategory={(id, category) =>
          setCandidates((list) =>
            list.map((item) => (item.id === id ? { ...item, category } : item)),
          )
        }
        onRemove={(id) =>
          setCandidates((list) => {
            const item = list.find((c) => c.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return list.filter((c) => c.id !== id);
          })
        }
        onImport={() => void runImport()}
      />
      <GuideDialog
        open={guideOpen}
        onOpenChange={(open) => {
          setGuideOpen(open);
          if (!open) markGuideSeen();
        }}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,.webm,.mp4,.md,.txt,.pdf,.json"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleInput(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        className="hidden"
        // @ts-expect-error non-standard directory input
        webkitdirectory=""
        directory=""
        onChange={(e) => {
          void handleInput(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
