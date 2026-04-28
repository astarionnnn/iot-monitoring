export function analyzeEnvironmentalConditions(sensorData) {
    // Input validation
    if (!sensorData || typeof sensorData !== 'object') {
        return {
            error: true,
            riskLevel: "Unknown",
            riskColor: "gray",
            riskScore: 0,
            recommendations: ["⚠️ Data sensor tidak valid. Periksa koneksi ESP32/sensor."],
            timestamp: new Date()
        };
    }

    const { temperature, humidity, soil_moisture, rain_status } = sensorData;
    const recommendations = [];
    let riskScore = 0; // 0-10 scale
    let criticalActions = []; // For automated actions

    // ========================================
    // 1. SOIL MOISTURE ANALYSIS (Optimal: 60-80%)
    // ========================================
    if (soil_moisture != null) {
        if (soil_moisture < 30) {
            riskScore += 6;
            recommendations.push({
                message: "🚨 Tanah sangat kering (<30%)! Tanaman berisiko layu.",
                priority: "critical",
                action: "Aktifkan pompa air segera"
            });
            criticalActions.push("PUMP_ON");
        } else if (soil_moisture < 60) {
            riskScore += 3;
            recommendations.push({
                message: "⚠️ Kelembapan tanah di bawah optimal (30-60%). Penyiraman diperlukan.",
                priority: "warning",
                action: "Siram tanaman dalam 1-2 jam"
            });
        } else if (soil_moisture > 85) {
            riskScore += 4;
            recommendations.push({
                message: "💧 Tanah terlalu basah (>85%)! Risiko busuk akar.",
                priority: "warning",
                action: "Hentikan penyiraman, cek sistem drainase"
            });
            criticalActions.push("PUMP_OFF");
        } else if (soil_moisture > 80) {
            riskScore += 3;
            recommendations.push({
                message: "💧 Tanah mulai basah (>80%). Perlu perhatian.",
                priority: "warning",
                action: "Kurangi penyiraman"
            });
        } else {
            recommendations.push({
                message: "✅ Kelembapan tanah optimal (60-80%).",
                priority: "info",
                action: null
            });
        }
    }

    // ========================================
    // 2. TEMPERATURE ANALYSIS (Optimal: 18-27°C)
    // ========================================
    if (temperature != null) {
        if (temperature > 32) {
            riskScore += 5;
            recommendations.push({
                message: "🔥 Suhu kritis (>32°C)! Tanaman stress panas.",
                priority: "critical",
                action: "Nyalakan kipas & buka ventilasi maksimal"
            });
            criticalActions.push("FAN_ON");
        } else if (temperature > 27) {
            riskScore += 3;
            recommendations.push({
                message: "🌡️ Suhu tinggi (27-32°C). Kurang ideal untuk pertumbuhan.",
                priority: "warning",
                action: "Tingkatkan sirkulasi udara, tutup plastic mulsa"
            });
        } else if (temperature < 15) {
            riskScore += 4;
            recommendations.push({
                message: "❄️ Suhu terlalu dingin (<15°C). Pertumbuhan terhambat.",
                priority: "warning",
                action: "Tutup ventilasi, gunakan heater jika tersedia"
            });
        } else if (temperature < 18) {
            riskScore += 2;
            recommendations.push({
                message: "🌤️ Suhu agak dingin (15-18°C). Kurangi ventilasi malam hari.",
                priority: "info",
                action: null
            });
        } else {
            recommendations.push({
                message: "✅ Suhu optimal (18-27°C).",
                priority: "info",
                action: null
            });
        }
    }

    // ========================================
    // 3. HUMIDITY ANALYSIS (Optimal: 50-85%)
    // ========================================
    if (humidity != null) {
        if (humidity < 40) {
            riskScore += 3;
            recommendations.push({
                message: "🏜️ Kelembapan udara rendah (<40%). Tanaman bisa dehidrasi.",
                priority: "warning",
                action: "Nyalakan misting system/sprayer"
            });
        } else if (humidity > 90) {
            riskScore += 4;
            recommendations.push({
                message: "💦 Kelembapan sangat tinggi (>90%)! Risiko jamur & penyakit.",
                priority: "warning",
                action: "Nyalakan kipas untuk sirkulasi udara"
            });
            criticalActions.push("FAN_ON");
        } else if (humidity > 85) {
            riskScore += 2;
            recommendations.push({
                message: "🌫️ Kelembapan tinggi. Waspada jamur daun.",
                priority: "warning",
                action: "Pantau kesehatan tanaman"
            });
        }
    }

    // ========================================
    // 4. COMPOSITE RULES (Synergistic Effects)
    // ========================================

    // Rain + High Humidity
    if (rain_status && humidity > 80) {
        riskScore += 2;
        recommendations.push({
            message: "🌧️ Hujan & kelembapan tinggi. Risiko genangan air.",
            priority: "warning",
            action: "Pastikan drainase berfungsi, tutup atap greenhouse"
        });
    }

    // High Temperature + Low Humidity (Heat stress)
    if (temperature > 28 && humidity < 50) {
        riskScore += 3;
        recommendations.push({
            message: "☀️ Panas & kering. Kondisi stress untuk tanaman.",
            priority: "warning",
            action: "Kombinasi: kipas ON + misting ON"
        });
    }

    // Cold + Wet Soil (Root rot risk)
    if (temperature < 18 && soil_moisture > 80) {
        riskScore += 2;
        recommendations.push({
            message: "🧊 Dingin & tanah basah. Risiko busuk akar meningkat.",
            priority: "warning",
            action: "Kurangi frekuensi penyiraman"
        });
    }

    // ========================================
    // 5. RISK CLASSIFICATION
    // ========================================
    let riskLevel = "Rendah";
    let riskColor = "green";

    if (riskScore >= 8) {
        riskLevel = "Kritis";
        riskColor = "red";
    } else if (riskScore >= 5) {
        riskLevel = "Tinggi";
        riskColor = "orange";
    } else if (riskScore >= 2) {
        riskLevel = "Sedang";
        riskColor = "yellow";
    }

    // ========================================
    // 6. FALLBACK MESSAGE
    // ========================================
    const hasWarnings = recommendations.some(r => r.priority !== "info");
    if (!hasWarnings) {
        recommendations.push({
            message: "🌱 Semua parameter dalam kondisi baik. Lanjutkan perawatan rutin.",
            priority: "info",
            action: "Monitoring berkala setiap 30 menit"
        });
    }

    return {
        riskLevel,
        riskColor,
        riskScore,
        recommendations,
        criticalActions, // Array of automation triggers
        sensorReadings: {
            temperature,
            humidity,
            soil_moisture,
            rain_status
        },
        timestamp: new Date()
    };
}

// ========================================
// HELPER FUNCTION: Get Optimal Ranges
// ========================================
export function getOptimalRanges() {
    return {
        temperature: {
            min: 18,
            max: 27,
            unit: "°C",
            description: "Suhu ideal untuk pertumbuhan sayuran greenhouse"
        },
        humidity: {
            min: 50,
            max: 85,
            unit: "%",
            description: "Kelembapan udara optimal"
        },
        soil_moisture: {
            min: 60,
            max: 80,
            unit: "%",
            description: "Kelembapan tanah ideal"
        }
    };
}
