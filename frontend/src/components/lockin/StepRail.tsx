import { cn } from "@/lib/utils";

export type Step = {
  key: string;
  label: string;
  sublabel?: string;
};

export function StepRail({
  steps,
  currentKey,
  className,
}: {
  steps: Step[];
  currentKey: string;
  className?: string;
}) {
  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey),
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/35 backdrop-blur px-5 py-4",
        className,
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3",
        )}
      >
        {steps.map((s, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;

          return (
            <div key={s.key} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid size-7 place-items-center rounded-full border text-xs font-mono",
                  done
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : active
                      ? "border-primary bg-primary/25 text-foreground"
                      : "border-border/70 bg-background/30 text-muted-foreground",
                )}
              >
                {idx + 1}
              </div>

              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate text-sm",
                    active || done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </div>
                {s.sublabel ? (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {s.sublabel}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full rounded-full bg-primary/70 transition-[width] duration-300"
          style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
