import { useState, useRef } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { animate } from "animejs";

export default function DataExport({ data, currentSensor }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Anime.js hover effect
    const handleMouseEnter = (e) => {
        animate(e.currentTarget, {
            translateX: 5,
            scale: 1.02,
            backgroundColor: 'rgba(39, 39, 42, 1)', // zinc-800
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });

        // Icon animation
        const icon = e.currentTarget.querySelector('span:first-child');
        if (icon) {
            animate(icon, {
                scale: 1.2,
                rotate: '10deg',
                duration: 400,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    };

    const handleMouseLeave = (e) => {
        animate(e.currentTarget, {
            translateX: 0,
            scale: 1,
            backgroundColor: 'rgba(0, 0, 0, 0)', // transparent
            duration: 300,
            easing: 'easeOutQuad'
        });

        // Icon reset
        const icon = e.currentTarget.querySelector('span:first-child');
        if (icon) {
            animate(icon, {
                scale: 1,
                rotate: '0deg',
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
    };

    // Export ke CSV
    const exportToCSV = () => {
        // ... (kode lama) ...
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk di-export");
            return;
        }

        const headers = [
            "Timestamp",
            "Date",
            "Time",
            "Temperature (°C)",
            "Humidity (%)",
            "Soil Moisture (%)",
            "Rain Status",
        ];

        const csvContent = [
            headers.join(","),
            ...data.map((item) =>
                [
                    item.created_at.toISOString(),
                    format(item.created_at, "yyyy-MM-dd"),
                    format(item.created_at, "HH:mm:ss"),
                    item.temperature,
                    item.humidity,
                    item.soil_moisture,
                    item.rain_status ? "Hujan" : "Cerah",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `sensor-data-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowMenu(false);
    };

    // Export ke JSON
    const exportToJSON = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk di-export");
            return;
        }

        const jsonData = {
            exported_at: new Date().toISOString(),
            total_records: data.length,
            data: data.map((item) => ({
                timestamp: item.created_at.toISOString(),
                temperature: item.temperature,
                humidity: item.humidity,
                soil_moisture: item.soil_moisture,
                rain_status: item.rain_status,
            })),
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: "application/json",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `sensor-data-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowMenu(false);
    };

    // Export ke PDF Report
    const exportToPDF = async () => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Header
            pdf.setFillColor(59, 130, 246);
            pdf.rect(0, 0, pageWidth, 40, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.text("IoT Monitoring Report", 15, 20);

            pdf.setFontSize(12);
            pdf.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 15, 30);

            // Current Sensor Data
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(16);
            pdf.text("Current Sensor Reading", 15, 55);

            pdf.setFontSize(11);
            let yPos = 65;

            if (currentSensor) {
                pdf.text(`Temperature: ${currentSensor.temperature}°C`, 15, yPos);
                yPos += 7;
                pdf.text(`Humidity: ${currentSensor.humidity}%`, 15, yPos);
                yPos += 7;
                pdf.text(`Soil Moisture: ${currentSensor.soil_moisture}%`, 15, yPos);
                yPos += 7;
                pdf.text(
                    `Weather: ${currentSensor.rain_status ? "Rainy" : "Clear"}`,
                    15,
                    yPos
                );
                yPos += 7;
                pdf.text(
                    `Last Update: ${format(currentSensor.created_at, "dd MMM yyyy, HH:mm:ss")}`,
                    15,
                    yPos
                );
            }

            // Statistics
            if (data && data.length > 0) {
                yPos += 15;
                pdf.setFontSize(16);
                pdf.text("Statistics Summary", 15, yPos);

                yPos += 10;
                pdf.setFontSize(11);

                const temps = data.map((d) => d.temperature).filter((t) => t != null);
                const humidities = data.map((d) => d.humidity).filter((h) => h != null);
                const soilMoistures = data
                    .map((d) => d.soil_moisture)
                    .filter((s) => s != null);

                if (temps.length > 0) {
                    const avgTemp = (
                        temps.reduce((a, b) => a + b, 0) / temps.length
                    ).toFixed(1);
                    const minTemp = Math.min(...temps).toFixed(1);
                    const maxTemp = Math.max(...temps).toFixed(1);

                    pdf.text(`Temperature - Avg: ${avgTemp}°C, Min: ${minTemp}°C, Max: ${maxTemp}°C`, 15, yPos);
                    yPos += 7;
                }

                if (humidities.length > 0) {
                    const avgHum = (
                        humidities.reduce((a, b) => a + b, 0) / humidities.length
                    ).toFixed(1);
                    const minHum = Math.min(...humidities).toFixed(1);
                    const maxHum = Math.max(...humidities).toFixed(1);

                    pdf.text(`Humidity - Avg: ${avgHum}%, Min: ${minHum}%, Max: ${maxHum}%`, 15, yPos);
                    yPos += 7;
                }

                if (soilMoistures.length > 0) {
                    const avgSoil = (
                        soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length
                    ).toFixed(1);
                    const minSoil = Math.min(...soilMoistures).toFixed(1);
                    const maxSoil = Math.max(...soilMoistures).toFixed(1);

                    pdf.text(`Soil Moisture - Avg: ${avgSoil}%, Min: ${minSoil}%, Max: ${maxSoil}%`, 15, yPos);
                    yPos += 7;
                }

                pdf.text(`Total Data Points: ${data.length}`, 15, yPos);
            }

            // Footer
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(
                "© 2026 IoT Monitoring Dashboard",
                15,
                pageHeight - 10
            );

            // Save
            pdf.save(`report-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
            setShowMenu(false);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal generate PDF");
        } finally {
            setIsExporting(false);
        }
    };

    // Copy data ke clipboard
    const copyToClipboard = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk di-copy");
            return;
        }

        const text = data
            .map(
                (item) =>
                    `${format(item.created_at, "yyyy-MM-dd HH:mm:ss")} | Temp: ${item.temperature
                    }°C | Humidity: ${item.humidity}% | Soil: ${item.soil_moisture}%`
            )
            .join("\n");

        navigator.clipboard.writeText(text).then(
            () => {
                alert("Data berhasil di-copy ke clipboard!");
                setShowMenu(false);
            },
            () => {
                alert("Gagal copy data");
            }
        );
    };

    return (
        <div className="relative">
            {/* Export Button - More compact */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
            >
                {isExporting ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500"></div>
                ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                )}
                <span>Export</span>
            </button>

            {/* Export Menu - Minimalist */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm shadow-lg overflow-hidden">
                        <div className="py-1">
                            <button
                                onClick={exportToCSV}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300"
                            >
                                <span>📄</span>
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={exportToJSON}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300"
                            >
                                <span>📋</span>
                                <span>JSON</span>
                            </button>
                            <button
                                onClick={exportToPDF}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                disabled={isExporting}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-50"
                            >
                                <span>📑</span>
                                <span>PDF</span>
                            </button>
                            <div className="my-1 border-t border-zinc-800"></div>
                            <button
                                onClick={copyToClipboard}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300"
                            >
                                <span>�</span>
                                <span>Copy</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
