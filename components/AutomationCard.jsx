"use client";

import { useEffect } from "react";
import { animate } from "animejs";

export default function AutomationCard({ sensorData, rules, loading, updateRule }) {
    // Entrance UI Animation
    useEffect(() => {
        if (!loading && rules) {
            animate(".automation-card", {
                translateX: [50, 0],
                opacity: [0, 1],
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                duration: 800,
                delay: 200
            });
        }
    }, [loading, rules]);

    if (loading || !rules) {
        return (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 w-full animate-pulse rounded bg-zinc-800/50" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="automation-card opacity-0 group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md p-6 shadow-xl shadow-purple-500/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h3 className="text-lg font-bold text-white">Automation Rules</h3>
                        <p className="text-xs text-zinc-500">Kontrol otomatis berdasarkan sensor</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <RuleItem
                    device="fan"
                    icon="❄️"
                    name="Kipas"
                    rule={rules.fan}
                    currentValue={sensorData?.temperature}
                    unit="°C"
                    onUpdate={(updates) => updateRule("fan", updates)}
                />
                <RuleItem
                    device="pump"
                    icon="💧"
                    name="Pompa"
                    rule={rules.pump}
                    currentValue={sensorData?.soil_moisture}
                    unit="%"
                    onUpdate={(updates) => updateRule("pump", updates)}
                    showDuration
                />
                <RuleItem
                    device="light"
                    icon="💡"
                    name="Lampu"
                    rule={rules.light}
                    currentValue={sensorData?.humidity}
                    unit="%"
                    onUpdate={(updates) => updateRule("light", updates)}
                />
            </div>

            <div className="mt-6 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex gap-3">
                    <span className="text-blue-400">ℹ️</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Dalam <span className="text-blue-400 font-bold uppercase">Auto Mode</span>, sistem akan mengontrol perangkat sesuai rules.
                        Mengubah status perangkat secara manual akan memindahkan perangkat ke <span className="text-amber-400 font-bold uppercase">Manual Mode</span> secara otomatis.
                    </p>
                </div>
            </div>
        </div>
    );
}

function RuleItem({ device, icon, name, rule, currentValue, unit, onUpdate, showDuration }) {
    const isAuto = rule.mode === "auto";

    return (
        <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isAuto ? "bg-zinc-950/40 border-zinc-800" : "bg-zinc-950/20 border-zinc-900 opacity-80"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left Side: Device Info & Mode Toggle */}
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-inner ${isAuto ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white">{name}</h4>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isAuto ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                                {rule.mode}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                            {rule.condition}: <span className={`${currentValue > rule.value ? "text-red-400" : "text-blue-400"} font-mono`}>{currentValue?.toFixed(1) ?? "--"}{unit}</span>
                        </p>
                    </div>
                </div>

                {/* Right Side: Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Mode Switcher */}
                    <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                        <button
                            onClick={() => onUpdate({ mode: "auto" })}
                            className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${isAuto ? "bg-purple-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            AUTO
                        </button>
                        <button
                            onClick={() => onUpdate({ mode: "manual" })}
                            className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${!isAuto ? "bg-amber-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            MANUAL
                        </button>
                    </div>

                    {/* Enable Toggle */}
                    <button
                        onClick={() => onUpdate({ enabled: !rule.enabled })}
                        className={`rounded-lg p-2 transition-all ${rule.enabled ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500"}`}
                        title={rule.enabled ? "Disable Automation" : "Enable Automation"}
                    >
                        {rule.enabled ? "🔔" : "🔕"}
                    </button>
                </div>
            </div>

            {/* Threshold Config (Only visible if enabled) */}
            {rule.enabled && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-800/50 pt-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">ON Threshold ({rule.operator})</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={rule.value}
                                onChange={(e) => onUpdate({ value: Number(e.target.value) })}
                                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                            />
                            <span className="text-xs text-zinc-600 font-medium">{unit}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">OFF Threshold</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={rule.autoOffValue}
                                onChange={(e) => onUpdate({ autoOffValue: Number(e.target.value) })}
                                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                            />
                            <span className="text-xs text-zinc-600 font-medium">{unit}</span>
                        </div>
                    </div>

                    {showDuration && (
                        <div className="col-span-full flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Max Duration (Seconds)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={rule.duration}
                                    onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                                />
                                <span className="text-xs text-zinc-600 font-medium">s</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
