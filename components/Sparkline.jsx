"use client";

import { useMemo } from "react";

/**
 * Sparkline - Lightweight SVG mini chart for trends
 * @param {Array<number>} data - Array of numeric values
 * @param {string} color - Stroke color (hex or tailwind color)
 * @param {number} width - Width in pixels (default 80)
 * @param {number} height - Height in pixels (default 30)
 */
export default function Sparkline({ data = [], color = "#3b82f6", width = 80, height = 30 }) {
    const pathData = useMemo(() => {
        if (!data || data.length < 2) return "";

        const validData = data.filter(d => d != null && !isNaN(d));
        if (validData.length < 2) return "";

        const min = Math.min(...validData);
        const max = Math.max(...validData);
        const range = max - min || 1;

        const padding = 2;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const points = validData.map((value, index) => {
            const x = padding + (index / (validData.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - min) / range) * chartHeight;
            return { x, y };
        });

        // Create smooth curve path
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` Q ${prev.x + (cpx - prev.x) * 0.5} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
            path += ` Q ${cpx + (curr.x - cpx) * 0.5} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        return path;
    }, [data, width, height]);

    // Determine trend
    const trend = useMemo(() => {
        if (!data || data.length < 2) return "neutral";
        const validData = data.filter(d => d != null && !isNaN(d));
        if (validData.length < 2) return "neutral";
        const first = validData[0];
        const last = validData[validData.length - 1];
        if (last > first * 1.02) return "up";
        if (last < first * 0.98) return "down";
        return "neutral";
    }, [data]);

    const trendColors = {
        up: "#22c55e",
        down: "#ef4444",
        neutral: color,
    };

    if (!pathData) {
        return (
            <div
                className="flex items-center justify-center text-xs text-zinc-600"
                style={{ width, height }}
            >
                --
            </div>
        );
    }

    return (
        <div className="relative" style={{ width, height }}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={trendColors[trend]} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={trendColors[trend]} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={trendColors[trend]}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        filter: `drop-shadow(0 0 3px ${trendColors[trend]}40)`,
                    }}
                />
            </svg>
            {/* Trend indicator */}
            <div className="absolute -right-1 -top-1">
                {trend === "up" && <span className="text-[8px] text-green-500">▲</span>}
                {trend === "down" && <span className="text-[8px] text-red-500">▼</span>}
            </div>
        </div>
    );
}
