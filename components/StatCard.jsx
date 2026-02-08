"use client";

import CircularGauge from "@/components/CircularGauge";
import Sparkline from "@/components/Sparkline";

export default function StatCard({ value, unit, label, icon, trend, color, gauge, sparkline }) {
    const colorClasses = {
        red: {
            gradient: "from-red-500/10 to-red-600/5",
            border: "border-red-500/20 hover:border-red-500/40",
            shadow: "hover:shadow-red-500/20",
            glow: "group-hover:shadow-red-500/30",
        },
        blue: {
            gradient: "from-blue-500/10 to-blue-600/5",
            border: "border-blue-500/20 hover:border-blue-500/40",
            shadow: "hover:shadow-blue-500/20",
            glow: "group-hover:shadow-blue-500/30",
        },
        green: {
            gradient: "from-green-500/10 to-green-600/5",
            border: "border-green-500/20 hover:border-green-500/40",
            shadow: "hover:shadow-green-500/20",
            glow: "group-hover:shadow-green-500/30",
        },
        purple: {
            gradient: "from-purple-500/10 to-purple-600/5",
            border: "border-purple-500/20 hover:border-purple-500/40",
            shadow: "hover:shadow-purple-500/20",
            glow: "group-hover:shadow-purple-500/30",
        },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] animate-on-load opacity-0 ${colors.gradient} ${colors.border} ${colors.shadow}`}>
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content */}
            <div className="relative flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">{label}</p>
                    <div className="mt-2 flex items-baseline gap-1 transition-transform duration-300 group-hover:scale-105">
                        <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</h3>
                        {unit && <span className="text-xs font-medium text-zinc-500 sm:text-sm">{unit}</span>}
                    </div>
                    {trend && (
                        <p className="mt-2 text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400">{trend}</p>
                    )}
                    {/* Sparkline */}
                    {sparkline && sparkline.length > 1 && (
                        <div className="mt-3">
                            <Sparkline data={sparkline} color={color === "red" ? "#ef4444" : color === "blue" ? "#3b82f6" : "#22c55e"} width={100} height={28} />
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl opacity-50 transition-all duration-300 group-hover:scale-125 group-hover:opacity-70 group-hover:rotate-6 sm:text-4xl">
                        {icon}
                    </div>
                    {/* Circular Gauge */}
                    {gauge && (
                        <CircularGauge value={gauge.value} min={gauge.min} max={gauge.max} color={color} size={50} />
                    )}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full ${color === 'red' ? 'from-red-500 to-orange-500' : color === 'blue' ? 'from-blue-500 to-cyan-500' : color === 'green' ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-pink-500'}`} />
        </div>
    );
}
