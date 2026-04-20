import { cn } from "@/lib/utils";

interface RouteLoaderProps {
  fullscreen?: boolean;
  label?: string;
}

export function RouteLoader({
  fullscreen = false,
  label = "Loading TraderClaw Skills",
}: RouteLoaderProps) {
  return (
    <div className={cn(fullscreen ? "min-h-screen" : "min-h-[60vh]", "tc-app-shell bg-background")}>
      <div className="mx-auto flex h-full w-full max-w-[1480px] items-center px-4 py-8 md:px-6 md:py-12">
        <div className="tc-route-loader tc-card-motion tc-grid w-full overflow-hidden border border-primary/12 bg-card/70 p-5 md:p-7">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,rgba(249,55,40,0.18),transparent_60%)]" />
          <div className="relative space-y-7">
            <div className="tc-loader-stage space-y-3">
              <div className="tc-skeleton-line h-3 w-36" />
              <div className="tc-skeleton-line h-12 w-full max-w-[32rem]" />
              <div className="tc-skeleton-line h-5 w-full max-w-[40rem]" />
              <div className="tc-skeleton-line h-5 w-full max-w-[34rem]" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="tc-loader-block h-36 border border-border/80 bg-black/20 p-4"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="tc-skeleton-line h-3 w-20" />
                    <div className="tc-skeleton-line mt-5 h-8 w-2/3" />
                    <div className="tc-skeleton-line mt-3 h-4 w-full" />
                    <div className="tc-skeleton-line mt-2 h-4 w-5/6" />
                  </div>
                ))}
              </div>

              <div className="tc-loader-block border border-border/80 bg-black/20 p-4">
                <div
                  className="tc-loader-label text-[10px] uppercase tracking-[0.22em] text-primary/75"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {label}
                </div>
                <div className="tc-skeleton-line mt-5 h-4 w-28" />
                <div className="tc-skeleton-line mt-3 h-4 w-full" />
                <div className="tc-skeleton-line mt-2 h-4 w-4/5" />
                <div className="tc-skeleton-line mt-8 h-11 w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
