"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
            <div>
                <h2 className="text-2xl font-bold">Kontrol Perangkat</h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Kelola dan kontrol perangkat IoT Anda secara real-time
                </p>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DeviceCard
                    name="Kipas Pendingin"
                    description="Kontrol kipas ruangan"
                    icon="🌀"
                    isOn={devices.fan}
                    onToggle={() => toggleDevice("fan")}
                    stats="Kecepatan: Auto"
                />

                <DeviceCard
                    name="Pompa Air"
                    description="Sistem irigasi otomatis"
                    icon="💧"
                    isOn={devices.pump}
                    onToggle={() => toggleDevice("pump")}
                    stats="Mode: Manual"
                />

                <DeviceCard
                    name="Lampu Area"
                    description="Pencahayaan sensor"
                    icon="💡"
                    isOn={devices.light}
                    onToggle={() => toggleDevice("light")}
                    stats="Brightness: 100%"
                />
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
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
        <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-2 active:scale-[0.98] ${colors.border} ${colors.shadow} ${colors.gradient}`}>
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content wrapper */}
            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-6">
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
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${isOn ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-zinc-600"
                            }`}
                    />
                    <span className="text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                        {isOn ? "Aktif" : "Nonaktif"}
                    </span>
                </div>

                {/* Stats */}
                <p className="mt-2 text-xs text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500">{stats}</p>

                {/* Toggle */}
                <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-900/50">
                    <span className="text-sm font-medium text-zinc-300 transition-colors duration-300 group-hover:text-white">Kontrol</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isOn}
                            onChange={onToggle}
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
