import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-to")({ component: HowToPage });

const STEPS = [
  {
    n: "1",
    title: "Drop files",
    body: "Drag PNG, JPEG, WebP, sprite sheets, WebM/MP4, or Markdown onto the page. Or use Files / Folder. Folder names such as characters, props, or backgrounds set the category.",
  },
  {
    n: "2",
    title: "Convert",
    body: "Confirm categories, then import. Stills and sheets convert to WebP in the browser. PNG is kept as the lossless original. Video and docs stay in their own format.",
  },
  {
    n: "3",
    title: "Pick a kit",
    body: "Tick the check on each piece you want. Use Add view to kit to grab everything on screen. The dock at the bottom is your working pack.",
  },
  {
    n: "4",
    title: "Download zip",
    body: "Choose WebP, PNG, or both, then Download kit. The zip is grouped by category and includes kit.json for the next project.",
  },
];

function HowToPage() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft />
              Library
            </Link>
          </Button>
          <div>
            <p className="font-display text-lg font-medium tracking-tight">
              My WebArt
            </p>
            <p className="text-xs text-muted">PNG to WEBP · Kit builder</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          How to use
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Convert 2D art for the web, sort it, and pack a kit. Everything stays
          in this browser — this app does not share a library with other vaults.
        </p>
        <ol className="mt-8 flex flex-col gap-4">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <p className="font-mono text-xs text-subtle">Step {step.n}</p>
              <h2 className="mt-1 font-display text-xl font-medium">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">
          Tip: press <kbd className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs">/</kbd> to
          search. Settings in the header control WebP quality and studio-matte
          keying.
        </p>
      </main>
    </div>
  );
}
