"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { animate, stagger } from "animejs";

export default function DevicesPage() {
    const [devices, setDevices] = useState({
        fan: false,
        pump: false,
        light: false,
    });
    const [loading, setLoading] = useState(true);

    // Fetch device status from Firebase
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const docRef = doc(db, "devices", "controls");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setDevices(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching devices:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDevices();
    }, []);

    // Animations
    useEffect(() => {
        if (!loading) {
            animate(".device-card", {
                translateY: [30, 0],
                opacity: [0, 1],
                delay: stagger(130, { start: 150 }),
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                duration: 1300,
            });

            animate(".breathing-icon", {
                scale: [1, 1.15],
                direction: "alternate",
                loop: true,
                easing: "easeInOutQuad",
                duration: 2500,
            });
        }
    }, [loading]);

    // Toggle device status
    const toggleDevice = async (deviceName) => {
        const newStatus = !devices[deviceName];
        const updatedDevices = { ...devices, [deviceName]: newStatus };

        setDevices(updatedDevices);

        try {
            const docRef = doc(db, "devices", "controls");
            await setDoc(docRef, updatedDevices);
        } catch (error) {
            console.error("Error updating device:", error);
            // Revert on error
            setDevices(devices);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
                    <p className="mt-4 text-sm text-zinc-500">Memuat perangkat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="device-card opacity-0">
                <h2 className="text-2xl font-bold">Kontrol Perangkat</h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Kelola dan kontrol perangkat IoT Anda secara real-time
                </p>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DeviceCard
                    name="Kipas Pendingin"
                    description="Kontrol kipas ruangan"
                    icon={
                        <svg className="h-10 w-10 text-blue-500 breathing-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                    isOn={devices.fan}
                    onToggle={() => toggleDevice("fan")}
                    stats="Kecepatan: Auto"
                />

                <DeviceCard
                    name="Pompa Air"
                    description="Sistem irigasi otomatis"
                    icon={
                        <svg className="h-10 w-10 text-cyan-500 breathing-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    }
                    isOn={devices.pump}
                    onToggle={() => toggleDevice("pump")}
                    stats="Mode: Manual"
                />

                <DeviceCard
                    name="Lampu Area"
                    description="Pencahayaan sensor"
                    icon={
                        <svg className="h-10 w-10 text-yellow-500 breathing-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    }
                    isOn={devices.light}
                    onToggle={() => toggleDevice("light")}
                    stats="Brightness: 100%"
                />
            </div>

            {/* Info */}
            <div className="device-card opacity-0 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-lg shadow-blue-500/10">
                <div className="flex items-start gap-3">
                    <div className="text-2xl breathing-icon">ℹ️</div>
                    <div>
                        <h3 className="font-semibold text-blue-400">Informasi</h3>
                        <p className="mt-1 text-sm text-zinc-400">
                            Status perangkat tersimpan di Firebase dan dapat diakses oleh ESP32/Arduino secara real-time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeviceCard({ name, description, icon, isOn, onToggle, stats }) {
    const toggleRef = useRef(null);

    const handleToggle = () => {
        onToggle();
        // Micro-interaction: Spring bounce on click
        animate(toggleRef.current, {
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0],
            duration: 800,
            easing: "easeOutElastic(1, .5)",
        });
    };

    // Define color schemes for different devices
    const getColorScheme = (deviceName) => {
        if (deviceName.includes("Kipas")) {
            return {
                border: "border-blue-500/20 hover:border-blue-500/40",
                shadow: "hover:shadow-xl hover:shadow-blue-500/20",
                gradient: "from-blue-500/10 to-blue-600/5",
                accentLine: "from-blue-500 to-cyan-500",
            };
        } else if (deviceName.includes("Pompa")) {
            return {
                border: "border-cyan-500/20 hover:border-cyan-500/40",
                shadow: "hover:shadow-xl hover:shadow-cyan-500/20",
                gradient: "from-cyan-500/10 to-cyan-600/5",
                accentLine: "from-cyan-500 to-blue-400",
            };
        } else {
            return {
                border: "border-yellow-500/20 hover:border-yellow-500/40",
                shadow: "hover:shadow-xl hover:shadow-yellow-500/20",
                gradient: "from-yellow-500/10 to-yellow-600/5",
                accentLine: "from-yellow-500 to-orange-500",
            };
        }
    };

    const colors = getColorScheme(name);

    return (
        <div className={`device-card opacity-0 group relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-4 sm:p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98] ${colors.border} ${colors.shadow} ${colors.gradient}`}>
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content wrapper */}
            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="transition-all duration-300 group-hover:scale-125 group-hover:rotate-6">
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white transition-colors duration-300 group-hover:text-zinc-50">{name}</h3>
                            <p className="text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400">{description}</p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center gap-2">
                    <div
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${isOn ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-zinc-600 shadow-[0_0_5px_rgba(0,0,0,0.5)]"
                            }`}
                    />
                    <span className="text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                        {isOn ? "Aktif" : "Nonaktif"}
                    </span>
                </div>

                {/* Stats */}
                <p className="mt-2 text-xs text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500 tracking-wider uppercase font-bold">{stats}</p>

                {/* Toggle */}
                <div
                    ref={toggleRef}
                    className="mt-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-900/50 shadow-inner"
                >
                    <span className="text-sm font-medium text-zinc-300 transition-colors duration-300 group-hover:text-white">Kontrol</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isOn}
                            onChange={handleToggle}
                        />
                        <div className="peer h-7 w-14 rounded-full bg-zinc-700 transition-all duration-300 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-600 after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-7 peer-checked:after:border-blue-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 hover:shadow-lg" />
                    </label>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full ${colors.accentLine}`} />
        </div>
    );
}

