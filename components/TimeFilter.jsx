"use client";

export default function TimeFilter({ currentFilter, onFilterChange }) {
    const filters = [
        { value: "1h", label: "1 Jam" },
        { value: "6h", label: "6 Jam" },
        { value: "12h", label: "12 Jam" },
        { value: "1d", label: "1 Hari" },
        { value: "2d", label: "2 Hari" },
        { value: "7d", label: "7 Hari" },
        { value: "all", label: "Semua" },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => onFilterChange(filter.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${currentFilter === filter.value
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
