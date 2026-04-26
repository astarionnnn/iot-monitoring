import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { animate } from "animejs";

// ─── Helper ──────────────────────────────────────────────────────────────────

function avg(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Map timeFilter key → label Indonesia
const FILTER_LABELS = {
    "1h":  "1 Jam Terakhir",
    "6h":  "6 Jam Terakhir",
    "12h": "12 Jam Terakhir",
    "1d":  "1 Hari Terakhir",
    "2d":  "2 Hari Terakhir",
    "7d":  "7 Hari Terakhir",
    "all": "Semua Data",
};

// Map timeFilter key → milliseconds
const FILTER_MS = {
    "1h":  1 * 60 * 60 * 1000,
    "6h":  6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d":  24 * 60 * 60 * 1000,
    "2d":  48 * 60 * 60 * 1000,
    "7d":  7 * 24 * 60 * 60 * 1000,
};

export default function DataExport({ data, currentSensor, timeFilter = "all" }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Anime.js hover effect
    const handleMouseEnter = (e) => {
        animate(e.currentTarget, {
            translateX: 5,
            scale: 1.02,
            backgroundColor: "rgba(39, 39, 42, 1)",
            duration: 400,
            easing: "easeOutElastic(1, .8)",
        });
        const icon = e.currentTarget.querySelector("span:first-child");
        if (icon) {
            animate(icon, {
                scale: 1.2,
                rotate: "10deg",
                duration: 400,
                easing: "easeOutElastic(1, .8)",
            });
        }
    };

    const handleMouseLeave = (e) => {
        animate(e.currentTarget, {
            translateX: 0,
            scale: 1,
            backgroundColor: "rgba(0, 0, 0, 0)",
            duration: 300,
            easing: "easeOutQuad",
        });
        const icon = e.currentTarget.querySelector("span:first-child");
        if (icon) {
            animate(icon, {
                scale: 1,
                rotate: "0deg",
                duration: 300,
                easing: "easeOutQuad",
            });
        }
    };

    // ── Export CSV ──────────────────────────────────────────────────────────
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk di-export");
            return;
        }

        const headers = [
            "Timestamp",
            "Tanggal",
            "Jam",
            "Suhu (°C)",
            "Kelembapan Udara (%)",
            "Kelembapan Tanah (%)",
            "Status Hujan",
        ];

        const csvContent = [
            headers.join(","),
            ...data.map((item) =>
                [
                    item.created_at.toISOString(),
                    format(item.created_at, "yyyy-MM-dd"),
                    format(item.created_at, "HH:mm:ss"),
                    item.temperature ?? "",
                    item.humidity ?? "",
                    item.soil_moisture ?? "",
                    item.rain_status ? "Hujan" : "Cerah",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
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

    // ── Export JSON ─────────────────────────────────────────────────────────
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
        link.setAttribute("href", URL.createObjectURL(blob));
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

    // ── Export PDF ──────────────────────────────────────────────────────────
    const exportToPDF = async () => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF("p", "mm", "a4");
            const pW = pdf.internal.pageSize.getWidth();   // 210
            const pH = pdf.internal.pageSize.getHeight();  // 297
            const margin = 15;
            const now = new Date();

            // ── Filter data berdasarkan timeFilter ────────────────────────
            // data dari Firestore sudah urut terbaru → terlama (desc)
            let filteredData = [...(data || [])];
            if (timeFilter !== "all" && FILTER_MS[timeFilter]) {
                const cutoff = now.getTime() - FILTER_MS[timeFilter];
                filteredData = filteredData.filter(
                    (d) => d.created_at.getTime() >= cutoff
                );
            }

            const filterLabel = FILTER_LABELS[timeFilter] || "Semua Data";

            // ── Compute stats dari data yang sudah difilter ───────────────
            const temps = filteredData.map((d) => d.temperature).filter((v) => v != null);
            const hums  = filteredData.map((d) => d.humidity).filter((v) => v != null);
            const soils = filteredData.map((d) => d.soil_moisture).filter((v) => v != null);
            const rainCount = filteredData.filter((d) => d.rain_status).length;

            // filteredData[0] = terbaru, filteredData[last] = terlama
            const dateRange = filteredData.length > 0
                ? {
                      from: filteredData[filteredData.length - 1].created_at, // terlama
                      to:   filteredData[0].created_at,                       // terbaru
                  }
                : null;

            // ── Helper: draw header on every new page ─────────────────────
            const drawPageHeader = (pageNum, totalPages) => {
                // Background gradient strip (simulated with two rects)
                pdf.setFillColor(30, 64, 175);   // blue-800
                pdf.rect(0, 0, pW, 28, "F");
                pdf.setFillColor(79, 70, 229);   // indigo-600
                pdf.rect(pW / 2, 0, pW / 2, 28, "F");

                // Accent bar
                pdf.setFillColor(99, 102, 241);  // indigo-500
                pdf.rect(0, 26, pW, 2, "F");

                // Title
                pdf.setTextColor(255, 255, 255);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(14);
                pdf.text("IoT Monitoring Dashboard", margin, 11);

                // Subtitle
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.text("Laporan Data Sensor Lingkungan", margin, 17);

                // Generated timestamp (right-aligned)
                const genText = `Dicetak: ${format(now, "dd MMM yyyy, HH:mm", { locale: localeId })}`;
                pdf.text(genText, pW - margin, 11, { align: "right" });

                // Page number
                pdf.setFontSize(7);
                pdf.text(`Halaman ${pageNum} / ${totalPages}`, pW - margin, 17, { align: "right" });

                pdf.setTextColor(0, 0, 0);
            };

            // ── Helper: draw footer ───────────────────────────────────────
            const drawPageFooter = () => {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(0, pH - 12, pW, 12, "F");
                pdf.setFontSize(7);
                pdf.setTextColor(120, 120, 120);
                pdf.text(
                    "© 2026 IoT Monitoring Dashboard — Sistem Monitoring Sensor Lingkungan Otomatis",
                    pW / 2,
                    pH - 5,
                    { align: "center" }
                );
                pdf.setTextColor(0, 0, 0);
            };

            // ── Helper: rounded box ───────────────────────────────────────
            const drawBox = (x, y, w, h, fillR, fillG, fillB, strokeR, strokeG, strokeB) => {
                pdf.setFillColor(fillR, fillG, fillB);
                pdf.setDrawColor(strokeR, strokeG, strokeB);
                pdf.roundedRect(x, y, w, h, 3, 3, "FD");
            };

            // ─────────────────────────────────────────────────────────────
            // PAGE 1 — Ringkasan & Data Terkini
            // ─────────────────────────────────────────────────────────────
            drawPageHeader(1, 2);
            let y = 36;

            // ── Section: Informasi Laporan ────────────────────────────────
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 64, 175);
            pdf.text("Informasi Laporan", margin, y);
            y += 2;

            // Divider
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pW - margin, y);
            y += 6;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);

            const infoRows = [
                ["Tanggal Generate", format(now, "EEEE, dd MMMM yyyy", { locale: localeId })],
                ["Waktu Generate",   format(now, "HH:mm:ss 'WIB'")],
                ["Filter Waktu",     filterLabel],
                ["Total Data Diexport", `${filteredData.length.toLocaleString("id-ID")} rekaman`],
                [
                    "Rentang Waktu Data",
                    dateRange
                        ? `${format(dateRange.from, "dd MMM yyyy HH:mm", { locale: localeId })} — ${format(dateRange.to, "dd MMM yyyy HH:mm", { locale: localeId })}`
                        : "—",
                ],
                ["Sumber Data", "Firebase Firestore — Koleksi sensor_data"],
                ["Sistem", "IoT Monitoring Dashboard v1.0"],
            ];

            infoRows.forEach(([label, value], i) => {
                const rowY = y + i * 7;
                if (i % 2 === 0) {
                    pdf.setFillColor(248, 250, 252);
                    pdf.rect(margin, rowY - 4, pW - margin * 2, 7, "F");
                }
                pdf.setFont("helvetica", "bold");
                pdf.text(label + ":", margin + 2, rowY);
                pdf.setFont("helvetica", "normal");
                pdf.text(value, margin + 55, rowY);
            });
            y += infoRows.length * 7 + 10;

            // ── Section: Data Sensor Terkini ──────────────────────────────
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 64, 175);
            pdf.text("Data Sensor Terkini", margin, y);
            y += 2;
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pW - margin, y);
            y += 8;

            if (currentSensor) {
                // 4 metric cards in a row
                const cardW = (pW - margin * 2 - 9) / 4;
                const cardH = 28;
                const cards = [
                    {
                        label: "Suhu",
                        value: `${Number(currentSensor.temperature).toFixed(1)} °C`,
                        icon: "🌡",
                        r: 239, g: 68, b: 68,   // red
                        lr: 254, lg: 242, lb: 242,
                    },
                    {
                        label: "Kelembapan Udara",
                        value: `${Number(currentSensor.humidity).toFixed(1)} %`,
                        icon: "💧",
                        r: 59, g: 130, b: 246,   // blue
                        lr: 239, lg: 246, lb: 255,
                    },
                    {
                        label: "Kelembapan Tanah",
                        value: `${Number(currentSensor.soil_moisture).toFixed(1)} %`,
                        icon: "🌱",
                        r: 34, g: 197, b: 94,    // green
                        lr: 240, lg: 253, lb: 244,
                    },
                    {
                        label: "Status Cuaca",
                        value: currentSensor.rain_status ? "Hujan 🌧" : "Cerah ☀",
                        icon: currentSensor.rain_status ? "🌧" : "☀",
                        r: 168, g: 85, b: 247,   // purple
                        lr: 250, lg: 245, lb: 255,
                    },
                ];

                cards.forEach((card, i) => {
                    const cx = margin + i * (cardW + 3);
                    // Card background
                    pdf.setFillColor(card.lr, card.lg, card.lb);
                    pdf.setDrawColor(card.r, card.g, card.b);
                    pdf.setLineWidth(0.3);
                    pdf.roundedRect(cx, y, cardW, cardH, 2, 2, "FD");

                    // Top accent line
                    pdf.setFillColor(card.r, card.g, card.b);
                    pdf.rect(cx, y, cardW, 2, "F");

                    // Label
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(7);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(card.label, cx + cardW / 2, y + 9, { align: "center" });

                    // Value
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(13);
                    pdf.setTextColor(card.r, card.g, card.b);
                    pdf.text(card.value, cx + cardW / 2, y + 20, { align: "center" });
                });

                y += cardH + 6;

                // Last update timestamp
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(8);
                pdf.setTextColor(120, 120, 120);
                pdf.text(
                    `Terakhir diperbarui: ${format(currentSensor.created_at, "EEEE, dd MMMM yyyy — HH:mm:ss", { locale: localeId })}`,
                    margin,
                    y
                );
                y += 10;
            } else {
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text("Data sensor terkini tidak tersedia.", margin, y);
                y += 10;
            }

            // ── Section: Ringkasan Statistik ─────────────────────────────
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 64, 175);
            pdf.text("Ringkasan Statistik", margin, y);
            y += 2;
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pW - margin, y);
            y += 6;

            if (filteredData.length > 0) {
                autoTable(pdf, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [["Parameter", "Rata-rata", "Minimum", "Maksimum", "Jumlah Data"]],
                    body: [
                        temps.length > 0
                            ? [
                                  "Suhu (°C)",
                                  avg(temps).toFixed(2),
                                  Math.min(...temps).toFixed(2),
                                  Math.max(...temps).toFixed(2),
                                  temps.length.toLocaleString("id-ID"),
                              ]
                            : ["Suhu (°C)", "—", "—", "—", "0"],
                        hums.length > 0
                            ? [
                                  "Kelembapan Udara (%)",
                                  avg(hums).toFixed(2),
                                  Math.min(...hums).toFixed(2),
                                  Math.max(...hums).toFixed(2),
                                  hums.length.toLocaleString("id-ID"),
                              ]
                            : ["Kelembapan Udara (%)", "—", "—", "—", "0"],
                        soils.length > 0
                            ? [
                                  "Kelembapan Tanah (%)",
                                  avg(soils).toFixed(2),
                                  Math.min(...soils).toFixed(2),
                                  Math.max(...soils).toFixed(2),
                                  soils.length.toLocaleString("id-ID"),
                              ]
                            : ["Kelembapan Tanah (%)", "—", "—", "—", "0"],
                        [
                            "Status Hujan",
                            `${((rainCount / (filteredData.length || 1)) * 100).toFixed(1)}% Hujan`,
                            "—",
                            "—",
                            `${rainCount} hujan / ${filteredData.length - rainCount} cerah`,
                        ],
                    ],
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
                        lineColor: [220, 220, 220],
                        lineWidth: 0.3,
                    },
                    headStyles: {
                        fillColor: [30, 64, 175],
                        textColor: 255,
                        fontStyle: "bold",
                        fontSize: 9,
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    columnStyles: {
                        0: { fontStyle: "bold", fillColor: [239, 246, 255] },
                        1: { halign: "center" },
                        2: { halign: "center" },
                        3: { halign: "center" },
                        4: { halign: "center" },
                    },
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            // Footer page 1
            drawPageFooter();

            // ─────────────────────────────────────────────────────────────
            // PAGE 2 — Tabel Data Historis
            // ─────────────────────────────────────────────────────────────
            pdf.addPage();
            drawPageHeader(2, 2);
            y = 36;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 64, 175);
            pdf.text("Tabel Data Historis Sensor", margin, y);
            y += 2;
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pW - margin, y);
            y += 4;

            // Subtitle info
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            // filteredData sudah urut terbaru → terlama (dari Firestore desc)
            const maxRows = 500;
            const displayedData = filteredData.slice(0, maxRows);
            const truncated = filteredData.length > maxRows;
            pdf.text(
                `Filter: ${filterLabel}  |  Menampilkan ${displayedData.length.toLocaleString("id-ID")}${truncated ? ` dari ${filteredData.length.toLocaleString("id-ID")}` : ""} rekaman  |  Urut: Terbaru → Terlama`,
                margin,
                y + 4
            );
            y += 10;

            if (displayedData.length > 0) {
                autoTable(pdf, {
                    startY: y,
                    margin: { left: margin, right: margin, bottom: 18 },
                    head: [
                        [
                            "No.",
                            "Tanggal",
                            "Jam",
                            "Suhu (°C)",
                            "Kelembapan Udara (%)",
                            "Kelembapan Tanah (%)",
                            "Status",
                        ],
                    ],
                    body: displayedData.map((item, i) => [
                        i + 1,
                        format(item.created_at, "dd/MM/yyyy"),
                        format(item.created_at, "HH:mm:ss"),
                        item.temperature != null ? Number(item.temperature).toFixed(1) : "—",
                        item.humidity != null ? Number(item.humidity).toFixed(1) : "—",
                        item.soil_moisture != null ? Number(item.soil_moisture).toFixed(1) : "—",
                        item.rain_status ? "Hujan" : "Cerah",
                    ]),
                    styles: {
                        fontSize: 7.5,
                        cellPadding: 2.5,
                        lineColor: [220, 220, 220],
                        lineWidth: 0.2,
                        overflow: "linebreak",
                    },
                    headStyles: {
                        fillColor: [30, 64, 175],
                        textColor: 255,
                        fontStyle: "bold",
                        fontSize: 8,
                        halign: "center",
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    columnStyles: {
                        0: { halign: "center", cellWidth: 10 },
                        1: { halign: "center", cellWidth: 26 },
                        2: { halign: "center", cellWidth: 22 },
                        3: { halign: "center", cellWidth: 28 },
                        4: { halign: "center", cellWidth: 34 },
                        5: { halign: "center", cellWidth: 34 },
                        6: { halign: "center", cellWidth: 20 },
                    },
                    // Color "Hujan" rows and footer per page
                    didParseCell: (hookData) => {
                        if (
                            hookData.section === "body" &&
                            hookData.column.index === 6 &&
                            hookData.cell.raw === "Hujan"
                        ) {
                            hookData.cell.styles.textColor = [59, 130, 246];
                            hookData.cell.styles.fontStyle = "bold";
                        }
                        if (
                            hookData.section === "body" &&
                            hookData.column.index === 6 &&
                            hookData.cell.raw === "Cerah"
                        ) {
                            hookData.cell.styles.textColor = [34, 197, 94];
                            hookData.cell.styles.fontStyle = "bold";
                        }
                    },
                    didDrawPage: () => {
                        drawPageFooter();
                    },
                });
            } else {
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text("Tidak ada data historis tersedia.", margin, y + 10);
                drawPageFooter();
            }

            // ── Save ──────────────────────────────────────────────────────
            pdf.save(`laporan-sensor-${format(now, "yyyy-MM-dd-HHmm")}.pdf`);
            setShowMenu(false);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal generate PDF: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Copy to Clipboard ───────────────────────────────────────────────────
    const copyToClipboard = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk di-copy");
            return;
        }

        const text = data
            .map(
                (item) =>
                    `${format(item.created_at, "yyyy-MM-dd HH:mm:ss")} | Suhu: ${item.temperature}°C | Udara: ${item.humidity}% | Tanah: ${item.soil_moisture}%`
            )
            .join("\n");

        navigator.clipboard.writeText(text).then(
            () => {
                alert("Data berhasil di-copy ke clipboard!");
                setShowMenu(false);
            },
            () => alert("Gagal copy data")
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
            >
                {isExporting ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
                ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                )}
                <span>Export</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
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
                                <span>PDF Report</span>
                            </button>
                            <div className="my-1 border-t border-zinc-800" />
                            <button
                                onClick={copyToClipboard}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300"
                            >
                                <span>📎</span>
                                <span>Copy</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
