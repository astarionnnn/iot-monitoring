"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

/**
 * CircularGauge - Animated circular progress indicator
 * @param {number} value - Current value
 * @param {number} min - Minimum value (default 0)
 * @param {number} max - Maximum value (default 100)
 * @param {string} color - Color for the gauge (red, blue, green, purple)
 * @param {number} size - Size in pixels (default 60)
 */
export default function CircularGauge({ value, min = 0, max = 100, color = "blue", size = 60 }) {
    const progressRef = useRef(null);
    const prevValueRef = useRef(value);

    const colorMap = {
        red: { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" },
        blue: { stroke: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
        green: { stroke: "#22c55e", glow: "rgba(34, 197, 94, 0.4)" },
        purple: { stroke: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
    };

    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate percentage (clamped between 0-100)
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colors = colorMap[color] || colorMap.blue;

    useEffect(() => {
        if (progressRef.current && prevValueRef.current !== value) {
            const prevPercentage = Math.max(0, Math.min(100, ((prevValueRef.current - min) / (max - min)) * 100));
            const prevOffset = circumference - (prevPercentage / 100) * circumference;

            animate(progressRef.current, {
                strokeDashoffset: [prevOffset, strokeDashoffset],
                duration: 800,
                easing: "easeOutExpo",
            });

            prevValueRef.current = value;
        }
    }, [value, strokeDashoffset, circumference, min, max]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    ref={progressRef}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        filter: `drop-shadow(0 0 6px ${colors.glow})`,
                        transition: "stroke 0.3s ease",
                    }}
                />
            </svg>
            {/* Center content placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs font-bold text-zinc-400">
                    {Math.round(percentage)}%
                </div>
            </div>
        </div>
    );
}
