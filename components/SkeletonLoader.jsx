"use client";

export function SkeletonCard() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-4 sm:p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 rounded-md bg-zinc-800 skeleton-shimmer" />
                    <div className="h-8 w-20 rounded-md bg-zinc-800 skeleton-shimmer" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-zinc-800 skeleton-shimmer" />
            </div>
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
            <div className="mb-4 flex items-center justify-between">
                <div className="h-6 w-32 rounded-md bg-zinc-800 skeleton-shimmer" />
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 w-16 rounded-lg bg-zinc-800/50 skeleton-shimmer" />
                    ))}
                </div>
            </div>
            <div className="h-[200px] sm:h-[320px] w-full rounded-lg bg-zinc-800/30 skeleton-shimmer flex items-end justify-around px-4 pb-4 gap-2">
                {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 70].map((h, i) => (
                    <div
                        key={i}
                        className="w-full max-w-[30px] rounded-t bg-zinc-700/30"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonDecision() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-800 skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 rounded-md bg-zinc-800 skeleton-shimmer" />
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded-md bg-zinc-800/50 skeleton-shimmer" />
                        <div className="h-4 w-3/4 rounded-md bg-zinc-800/50 skeleton-shimmer" />
                    </div>
                    <div className="flex gap-2 mt-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-6 w-20 rounded-full bg-zinc-800/50 skeleton-shimmer" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
