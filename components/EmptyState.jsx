"use client";

export default function EmptyState({ message, icon = "📊" }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="text-4xl opacity-30">{icon}</div>
            <p className="text-sm text-zinc-500">{message}</p>
            <p className="text-xs text-zinc-600">Coba pilih rentang waktu yang lebih lama</p>
        </div>
    );
}
