"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { animate } from "animejs";

/**
 * Helper function to get local date string (YYYY-MM-DD) in user's timezone
 */
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * CalendarHeatmap - Monthly calendar view showing daily sensor averages
 * @param {Array} data - Array of sensor readings with created_at dates
 * @param {string} dataKey - Which sensor to show (temperature, humidity, soil_moisture)
 */
export default function CalendarHeatmap({ data = [], dataKey = "temperature" }) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedDay, setSelectedDay] = useState(null);
    const [hoveredDay, setHoveredDay] = useState(null);
    const containerRef = useRef(null);

    // Config for different data types
    const config = {
        temperature: {
            label: "Suhu",
            icon: "🌡️",
            unit: "°C",
            ranges: [
                { min: 0, max: 22, color: "#3b82f6", label: "Dingin" },
                { min: 22, max: 27, color: "#22c55e", label: "Normal" },
                { min: 27, max: 32, color: "#f59e0b", label: "Hangat" },
                { min: 32, max: 100, color: "#ef4444", label: "Panas" },
            ],
        },
        humidity: {
            label: "Kelembapan",
            icon: "💧",
            unit: "%",
            ranges: [
                { min: 0, max: 40, color: "#f59e0b", label: "Kering" },
                { min: 40, max: 70, color: "#22c55e", label: "Normal" },
                { min: 70, max: 85, color: "#3b82f6", label: "Lembap" },
                { min: 85, max: 100, color: "#8b5cf6", label: "Sangat Lembap" },
            ],
        },
        soil_moisture: {
            label: "Tanah",
            icon: "🌱",
            unit: "%",
            ranges: [
                { min: 0, max: 30, color: "#ef4444", label: "Kering" },
                { min: 30, max: 60, color: "#f59e0b", label: "Kurang" },
                { min: 60, max: 80, color: "#22c55e", label: "Optimal" },
                { min: 80, max: 100, color: "#3b82f6", label: "Basah" },
            ],
        },
    };

    const currentConfig = config[dataKey] || config.temperature;

    // Process data into daily aggregates - FIXED: Use local timezone
    const dailyData = useMemo(() => {
        const dailyMap = new Map();

        data.forEach((reading) => {
            const date = new Date(reading.created_at);
            // FIX: Use local date instead of UTC
            const dateKey = getLocalDateKey(date);

            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, {
                    date: dateKey,
                    readings: [],
                    temperature: [],
                    humidity: [],
                    soil_moisture: [],
                    rain_count: 0,
                });
            }

            const day = dailyMap.get(dateKey);
            day.readings.push(reading);
            if (reading.temperature != null) day.temperature.push(reading.temperature);
            if (reading.humidity != null) day.humidity.push(reading.humidity);
            if (reading.soil_moisture != null) day.soil_moisture.push(reading.soil_moisture);
            if (reading.rain_status) day.rain_count++;
        });

        // Calculate averages
        dailyMap.forEach((day) => {
            day.avgTemperature = day.temperature.length > 0
                ? day.temperature.reduce((a, b) => a + b, 0) / day.temperature.length
                : null;
            day.avgHumidity = day.humidity.length > 0
                ? day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length
                : null;
            day.avgSoilMoisture = day.soil_moisture.length > 0
                ? day.soil_moisture.reduce((a, b) => a + b, 0) / day.soil_moisture.length
                : null;
            day.dataPoints = day.readings.length;

            // Store min/max for display
            day.minTemperature = day.temperature.length > 0 ? Math.min(...day.temperature) : null;
            day.maxTemperature = day.temperature.length > 0 ? Math.max(...day.temperature) : null;
            day.minHumidity = day.humidity.length > 0 ? Math.min(...day.humidity) : null;
            day.maxHumidity = day.humidity.length > 0 ? Math.max(...day.humidity) : null;
            day.minSoilMoisture = day.soil_moisture.length > 0 ? Math.min(...day.soil_moisture) : null;
            day.maxSoilMoisture = day.soil_moisture.length > 0 ? Math.max(...day.soil_moisture) : null;
        });

        return dailyMap;
    }, [data]);

    // Generate calendar days for selected month
    const calendarDays = useMemo(() => {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        const days = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ empty: true, dayIndex: `empty-${i}` });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth, day);
            // FIX: Use local date key
            const dateKey = getLocalDateKey(date);
            const dayData = dailyData.get(dateKey);

            days.push({
                date,
                dateKey,
                dayNumber: day,
                dayData,
                empty: false,
            });
        }

        return days;
    }, [selectedYear, selectedMonth, dailyData]);

    // Get color for a value
    const getColor = (value) => {
        if (value == null) return null;
        for (const range of currentConfig.ranges) {
            if (value >= range.min && value < range.max) {
                return range.color;
            }
        }
        return currentConfig.ranges[currentConfig.ranges.length - 1].color;
    };

    // Get value for display
    const getValue = (dayData) => {
        if (!dayData) return null;
        switch (dataKey) {
            case "temperature": return dayData.avgTemperature;
            case "humidity": return dayData.avgHumidity;
            case "soil_moisture": return dayData.avgSoilMoisture;
            default: return null;
        }
    };

    // Day names
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    // Month names
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Navigate months
    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const goToNextMonth = () => {
        const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
        if (isCurrentMonth) return;

        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

    // Animation on month change
    useEffect(() => {
        if (containerRef.current) {
            animate(".calendar-cell", {
                scale: [0.8, 1],
                opacity: [0, 1],
                delay: (el, i) => i * 15,
                duration: 300,
                easing: "easeOutCubic",
            });
        }
    }, [selectedMonth, selectedYear, dataKey]);

    const activeDay = hoveredDay || selectedDay;

    // Stats for selected month - FIXED VERSION
    const monthStats = useMemo(() => {
        const dailyAverages = [];
        let totalDataPoints = 0;

        // Arrays to collect ALL raw values (not just averages)
        const allTemperatures = [];
        const allHumidities = [];
        const allSoilMoistures = [];

        calendarDays.forEach(day => {
            if (!day.empty && day.dayData) {
                const v = getValue(day.dayData);
                if (v != null) dailyAverages.push(v);
                totalDataPoints += day.dayData.dataPoints;

                // Collect all raw readings for accurate min/max
                if (day.dayData.temperature && day.dayData.temperature.length > 0) {
                    allTemperatures.push(...day.dayData.temperature);
                }
                if (day.dayData.humidity && day.dayData.humidity.length > 0) {
                    allHumidities.push(...day.dayData.humidity);
                }
                if (day.dayData.soil_moisture && day.dayData.soil_moisture.length > 0) {
                    allSoilMoistures.push(...day.dayData.soil_moisture);
                }
            }
        });

        if (dailyAverages.length === 0) return null;

        // Get min/max based on current metric from ALL readings (not averages)
        let minValue, maxValue;

        switch (dataKey) {
            case "temperature":
                minValue = allTemperatures.length > 0 ? Math.min(...allTemperatures) : null;
                maxValue = allTemperatures.length > 0 ? Math.max(...allTemperatures) : null;
                break;
            case "humidity":
                minValue = allHumidities.length > 0 ? Math.min(...allHumidities) : null;
                maxValue = allHumidities.length > 0 ? Math.max(...allHumidities) : null;
                break;
            case "soil_moisture":
                minValue = allSoilMoistures.length > 0 ? Math.min(...allSoilMoistures) : null;
                maxValue = allSoilMoistures.length > 0 ? Math.max(...allSoilMoistures) : null;
                break;
            default:
                minValue = Math.min(...dailyAverages);
                maxValue = Math.max(...dailyAverages);
        }

        return {
            min: minValue ?? 0,
            max: maxValue ?? 0,
            avg: dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length,
            daysWithData: dailyAverages.length,
            totalDataPoints,
        };
    }, [calendarDays, dataKey]);

    return (
        <div ref={containerRef} className="space-y-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={goToPrevMonth}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                        {monthNames[selectedMonth]} {selectedYear}
                    </h3>
                    {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                            Bulan ini
                        </span>
                    )}
                </div>

                <button
                    onClick={goToNextMonth}
                    disabled={isCurrentMonth}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${isCurrentMonth
                        ? "bg-zinc-800/30 border-zinc-800/30 text-zinc-600 cursor-not-allowed"
                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600"
                        }`}
                >
                    <span className="text-sm hidden sm:inline">Selanjutnya</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Month Stats */}
            {monthStats && (
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                        <span className="text-zinc-500">Rata-rata:</span>
                        <span className="font-semibold text-white">{monthStats.avg.toFixed(1)}{currentConfig.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                        <span className="text-zinc-500">Min:</span>
                        <span className="font-medium text-blue-400">{monthStats.min.toFixed(1)}{currentConfig.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                        <span className="text-zinc-500">Max:</span>
                        <span className="font-medium text-red-400">{monthStats.max.toFixed(1)}{currentConfig.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                        <span className="text-zinc-500">📊</span>
                        <span className="font-medium text-zinc-300">{monthStats.daysWithData} hari ada data</span>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="flex justify-center">
                <div className="w-full max-w-md rounded-xl bg-zinc-900/50 border border-zinc-800/50 p-3 sm:p-4 overflow-hidden">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day, i) => (
                            <div
                                key={i}
                                className={`text-center text-[10px] sm:text-xs font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-red-400" : "text-zinc-400"
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (day.empty) {
                                return <div key={day.dayIndex} className="aspect-square" />;
                            }

                            const value = getValue(day.dayData);
                            const color = getColor(value);
                            // FIX: Compare with local date
                            const isToday = day.dateKey === getLocalDateKey(new Date());
                            const hasData = day.dayData && day.dayData.dataPoints > 0;
                            const isSelected = activeDay?.dateKey === day.dateKey;
                            const isSunday = day.date.getDay() === 0;
                            const isSaturday = day.date.getDay() === 6;

                            return (
                                <div
                                    key={day.dateKey}
                                    onClick={() => setSelectedDay(selectedDay?.dateKey === day.dateKey ? null : day)}
                                    onMouseEnter={() => setHoveredDay(day)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    className={`calendar-cell aspect-square rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden
                                    ${isToday ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900" : ""}
                                    ${isSelected ? "ring-2 ring-white scale-105 z-10" : "hover:scale-105"}
                                    ${hasData ? "shadow-lg" : "bg-zinc-800/30"}`}
                                    style={{
                                        backgroundColor: hasData ? color : undefined,
                                        boxShadow: hasData ? `0 4px 20px ${color}40` : undefined,
                                    }}
                                >
                                    {/* Day Number */}
                                    <div className={`absolute top-1 left-1.5 sm:top-2 sm:left-2 text-xs sm:text-sm font-bold ${hasData
                                        ? "text-white/90"
                                        : isSunday || isSaturday
                                            ? "text-red-400/60"
                                            : "text-zinc-500"
                                        }`}>
                                        {day.dayNumber}
                                    </div>

                                    {/* Value Display */}
                                    {hasData && (
                                        <div className="absolute bottom-1 right-1.5 sm:bottom-2 sm:right-2 text-[10px] sm:text-xs font-semibold text-white/80">
                                            {value?.toFixed(0)}{currentConfig.unit}
                                        </div>
                                    )}

                                    {/* Data Points Indicator */}
                                    {hasData && (
                                        <div className="absolute bottom-1 left-1.5 sm:bottom-2 sm:left-2">
                                            <div className="flex gap-0.5">
                                                {[...Array(Math.min(day.dayData.dataPoints > 100 ? 5 : Math.ceil(day.dayData.dataPoints / 20), 5))].map((_, i) => (
                                                    <div key={i} className="w-1 h-1 rounded-full bg-white/50" />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Today Indicator */}
                                    {isToday && (
                                        <div className="absolute top-1 right-1.5 sm:top-2 sm:right-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-zinc-800/50">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-zinc-800/80" />
                            <span className="text-[10px] sm:text-xs text-zinc-500">Kosong</span>
                        </div>
                        {currentConfig.ranges.map((range, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div
                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg"
                                    style={{ backgroundColor: range.color }}
                                    title={range.label}
                                />
                                <span className="text-[10px] sm:text-xs text-zinc-400 hidden sm:inline">{range.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Card */}
            {activeDay && activeDay.dayData && (
                <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900 to-zinc-900/50 backdrop-blur-xl p-3 sm:p-5 shadow-2xl">
                    <div className="space-y-3 sm:space-y-4">
                        {/* Date Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl font-bold text-white"
                                    style={{ backgroundColor: getColor(getValue(activeDay.dayData)) }}
                                >
                                    {activeDay.dayNumber}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">
                                        {activeDay.date.toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {activeDay.dayData.dataPoints} pengukuran
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${dataKey === 'temperature'
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-zinc-800/50 border-zinc-700/30'
                                }`}>
                                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                    <span className="text-sm sm:text-base">🌡️</span>
                                    <span className="text-[10px] sm:text-xs text-zinc-400">Suhu</span>
                                </div>
                                <p className="text-base sm:text-xl font-bold text-white">
                                    {activeDay.dayData.avgTemperature?.toFixed(1) ?? "-"}
                                    <span className="text-[10px] sm:text-sm font-normal text-zinc-500">°C</span>
                                </p>
                                {activeDay.dayData.minTemperature != null && (
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        {activeDay.dayData.minTemperature.toFixed(1)} - {activeDay.dayData.maxTemperature.toFixed(1)}°C
                                    </p>
                                )}
                            </div>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${dataKey === 'humidity'
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-zinc-800/50 border-zinc-700/30'
                                }`}>
                                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                    <span className="text-sm sm:text-base">💧</span>
                                    <span className="text-[10px] sm:text-xs text-zinc-400">Udara</span>
                                </div>
                                <p className="text-base sm:text-xl font-bold text-white">
                                    {activeDay.dayData.avgHumidity?.toFixed(1) ?? "-"}
                                    <span className="text-[10px] sm:text-sm font-normal text-zinc-500">%</span>
                                </p>
                                {activeDay.dayData.minHumidity != null && (
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        {activeDay.dayData.minHumidity.toFixed(1)} - {activeDay.dayData.maxHumidity.toFixed(1)}%
                                    </p>
                                )}
                            </div>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${dataKey === 'soil_moisture'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-zinc-800/50 border-zinc-700/30'
                                }`}>
                                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                    <span className="text-sm sm:text-base">🌱</span>
                                    <span className="text-[10px] sm:text-xs text-zinc-400">Tanah</span>
                                </div>
                                <p className="text-base sm:text-xl font-bold text-white">
                                    {activeDay.dayData.avgSoilMoisture?.toFixed(1) ?? "-"}
                                    <span className="text-[10px] sm:text-sm font-normal text-zinc-500">%</span>
                                </p>
                                {activeDay.dayData.minSoilMoisture != null && (
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        {activeDay.dayData.minSoilMoisture.toFixed(1)} - {activeDay.dayData.maxSoilMoisture.toFixed(1)}%
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
