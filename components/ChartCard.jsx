"use client";

export default function ChartCard({ title, filter, children }) {
    return (
        <div className="group overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-zinc-700/50 hover:shadow-xl hover:shadow-blue-500/5 animate-on-load opacity-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-zinc-200 transition-colors duration-300 group-hover:text-white">{title}</h3>
                {filter && <div>{filter}</div>}
            </div>
            {children}
        </div>
    );
}
