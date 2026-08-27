import { cn } from "@/lib/utils";

function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-raised",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-200 ease-[var(--ease-smooth)]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
