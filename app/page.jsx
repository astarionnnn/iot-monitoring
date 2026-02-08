"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import DevicesPage from "@/components/DevicesPage";
import DecisionSupportCard from "@/components/DecisionSupportCard";
import AnimatedValue from "@/components/AnimatedValue";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import ExportMenu from "@/components/ExportMenu";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import TimeFilter from "@/components/TimeFilter";
import EmptyState from "@/components/EmptyState";
import { ToastProvider, useToast } from "@/components/ToastNotification";
import { SkeletonCard, SkeletonChart, SkeletonDecision } from "@/components/SkeletonLoader";
import { formatDate, formatTime } from "@/lib/dateFormat";
import { analyzeEnvironmentalConditions } from "@/lib/dssEngine";
import { animate, stagger } from "animejs";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LINE_COLORS = { temperature: "#ef4444", humidity: "#3b82f6", soil_moisture: "#22c55e" };

// Thresholds for alerts
const THRESHOLDS = {
  temperature: { critical: 35, warning: 30, low: 15 },
  humidity: { critical: 95, warning: 90, low: 40 },
  soil_moisture: { critical_low: 25, warning_low: 40, critical_high: 90 },
};

function DashboardContent() {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sensor, setSensor] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [heatmapDataKey, setHeatmapDataKey] = useState("temperature");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const hasAnimatedIn = useRef(false);
  const lastAlertRef = useRef({ temperature: null, humidity: null, soil_moisture: null });

  // Check sensor values and trigger toasts
  const checkAndAlert = useCallback((sensorData) => {
    if (!sensorData) return;

    const { temperature, humidity, soil_moisture } = sensorData;

    // Temperature alerts
    if (temperature != null) {
      if (temperature >= THRESHOLDS.temperature.critical && lastAlertRef.current.temperature !== "critical") {
        toast.critical(`🔥 Suhu Kritis: ${temperature.toFixed(1)}°C! Tanaman dalam bahaya.`);
        lastAlertRef.current.temperature = "critical";
      } else if (temperature >= THRESHOLDS.temperature.warning && temperature < THRESHOLDS.temperature.critical && lastAlertRef.current.temperature !== "warning") {
        toast.warning(`🌡️ Suhu Tinggi: ${temperature.toFixed(1)}°C`);
        lastAlertRef.current.temperature = "warning";
      } else if (temperature < THRESHOLDS.temperature.low && lastAlertRef.current.temperature !== "low") {
        toast.warning(`❄️ Suhu Rendah: ${temperature.toFixed(1)}°C`);
        lastAlertRef.current.temperature = "low";
      } else if (temperature >= THRESHOLDS.temperature.low && temperature < THRESHOLDS.temperature.warning) {
        lastAlertRef.current.temperature = null;
      }
    }

    // Humidity alerts
    if (humidity != null) {
      if (humidity >= THRESHOLDS.humidity.critical && lastAlertRef.current.humidity !== "critical") {
        toast.critical(`💦 Kelembapan Kritis: ${humidity.toFixed(1)}%! Risiko jamur tinggi.`);
        lastAlertRef.current.humidity = "critical";
      } else if (humidity >= THRESHOLDS.humidity.warning && humidity < THRESHOLDS.humidity.critical && lastAlertRef.current.humidity !== "warning") {
        toast.warning(`🌫️ Kelembapan Tinggi: ${humidity.toFixed(1)}%`);
        lastAlertRef.current.humidity = "warning";
      } else if (humidity < THRESHOLDS.humidity.low && lastAlertRef.current.humidity !== "low") {
        toast.warning(`🏜️ Kelembapan Rendah: ${humidity.toFixed(1)}%`);
        lastAlertRef.current.humidity = "low";
      } else if (humidity >= THRESHOLDS.humidity.low && humidity < THRESHOLDS.humidity.warning) {
        lastAlertRef.current.humidity = null;
      }
    }

    // Soil moisture alerts
    if (soil_moisture != null) {
      if (soil_moisture <= THRESHOLDS.soil_moisture.critical_low && lastAlertRef.current.soil_moisture !== "critical_low") {
        toast.critical(`🚨 Tanah Sangat Kering: ${soil_moisture.toFixed(1)}%! Siram segera.`);
        lastAlertRef.current.soil_moisture = "critical_low";
      } else if (soil_moisture <= THRESHOLDS.soil_moisture.warning_low && soil_moisture > THRESHOLDS.soil_moisture.critical_low && lastAlertRef.current.soil_moisture !== "warning_low") {
        toast.warning(`⚠️ Tanah Kering: ${soil_moisture.toFixed(1)}%`);
        lastAlertRef.current.soil_moisture = "warning_low";
      } else if (soil_moisture >= THRESHOLDS.soil_moisture.critical_high && lastAlertRef.current.soil_moisture !== "critical_high") {
        toast.warning(`💧 Tanah Terlalu Basah: ${soil_moisture.toFixed(1)}%`);
        lastAlertRef.current.soil_moisture = "critical_high";
      } else if (soil_moisture > THRESHOLDS.soil_moisture.warning_low && soil_moisture < THRESHOLDS.soil_moisture.critical_high) {
        lastAlertRef.current.soil_moisture = null;
      }
    }
  }, [toast]);

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, "sensor_data"),
        orderBy("created_at", "desc"),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const docs = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const created = d.created_at?.toDate?.() ?? new Date();
        docs.push({ id: doc.id, ...d, created_at: created });
      });

      if (docs.length > 0) {
        setSensor(docs[0]);
        setHistory(docs);
        setLastUpdated(new Date());
        setConnectionStatus("connected");
        checkAndAlert(docs[0]);
      } else {
        setSensor(null);
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on timeFilter
  useEffect(() => {
    if (history.length === 0) {
      setFilteredHistory([]);
      return;
    }

    if (timeFilter === "all") {
      setFilteredHistory(history);
      return;
    }

    const now = new Date();
    let hoursAgo;

    switch (timeFilter) {
      case "1h":
        hoursAgo = 1;
        break;
      case "6h":
        hoursAgo = 6;
        break;
      case "12h":
        hoursAgo = 12;
        break;
      case "1d":
        hoursAgo = 24;
        break;
      case "2d":
        hoursAgo = 48;
        break;
      case "7d":
        hoursAgo = 168;
        break;
      default:
        hoursAgo = 24;
    }

    const startTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

    const filtered = history.filter(item => {
      return item.created_at >= startTime;
    });

    setFilteredHistory(filtered);
  }, [history, timeFilter]);

  // Reset entrance animation flag when leaving dashboard to allow re-animation on return
  useEffect(() => {
    if (currentPage !== "dashboard") {
      hasAnimatedIn.current = false;
    }
  }, [currentPage]);

  // Entrance Animations
  useEffect(() => {
    if (!loading && sensor && currentPage === "dashboard") {
      if (!hasAnimatedIn.current) {
        animate(".animate-on-load", {
          translateY: [30, 0],
          opacity: [0, 1],
          delay: stagger(100, { start: 200 }),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          duration: 1000,
        });
        hasAnimatedIn.current = true;
      }
    }
  }, [loading, sensor !== null, currentPage]);

  // Persistent Animations (Breathing Icons)
  useEffect(() => {
    if (!loading && sensor && currentPage === "dashboard") {
      animate(".breathing-icon", {
        scale: [1, 1.08],
        direction: "alternate",
        loop: true,
        easing: "easeInOutQuad",
        duration: 2500,
      });
    }
  }, [loading, sensor !== null, currentPage]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update connection status based on time since last update
  useEffect(() => {
    if (!lastUpdated) return;

    const checkConnection = () => {
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      if (diff > 15000) {
        setConnectionStatus("stale");
      } else if (diff > 30000) {
        setConnectionStatus("disconnected");
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const lineData = useMemo(() => {
    const reversed = [...filteredHistory].reverse();
    return reversed.map((d) => ({
      time: formatTime(d.created_at),
      date: formatDate(d.created_at),
      full: d.created_at,
      suhu: d.temperature != null ? Number(d.temperature) : null,
      kelembapan: d.humidity != null ? Number(d.humidity) : null,
      kelembapan_tanah: d.soil_moisture != null ? Number(d.soil_moisture) : null,
    }));
  }, [filteredHistory]);

  // Generate sparkline data for each sensor (last 15 points)
  const sparklineData = useMemo(() => {
    const reversed = [...history].reverse().slice(-15);
    return {
      temperature: reversed.map(d => d.temperature).filter(v => v != null),
      humidity: reversed.map(d => d.humidity).filter(v => v != null),
      soil_moisture: reversed.map(d => d.soil_moisture).filter(v => v != null),
    };
  }, [history]);

  // Get filter label for display
  const getFilterLabel = () => {
    switch (timeFilter) {
      case "1h": return "1 jam terakhir";
      case "6h": return "6 jam terakhir";
      case "12h": return "12 jam terakhir";
      case "1d": return "1 hari terakhir";
      case "2d": return "2 hari terakhir";
      case "7d": return "7 hari terakhir";
      case "all": return "semua waktu";
      default: return "";
    }
  };

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "Menunggu data...";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 5) return "Baru saja";
    if (diff < 60) return `${diff} detik yang lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    return formatTime(lastUpdated);
  };


  if (loading && !sensor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0a]/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-2 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                <div className="h-5 w-24 rounded bg-zinc-800 skeleton-shimmer hidden sm:block" />
              </div>
              <div className="h-6 w-16 rounded bg-zinc-800 skeleton-shimmer" />
            </div>
          </div>
        </header>

        {/* Skeleton Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6 h-8 w-48 rounded bg-zinc-800 skeleton-shimmer" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="mb-6"><SkeletonDecision /></div>
          <SkeletonChart />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header/Navigation - Compact */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-2 md:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Title + Nav */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm shadow-md shadow-blue-500/20">
                  🌡
                </div>
                <h1 className="text-base font-bold hidden sm:block">IoT Monitoring</h1>
              </div>

              {/* Navigation Tabs - Inline */}
              <nav className="flex gap-1">
                <button
                  onClick={() => setCurrentPage("dashboard")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${currentPage === "dashboard"
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage("devices")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${currentPage === "devices"
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                >
                  Perangkat
                </button>
              </nav>
            </div>

            {/* Connection Status + Theme Toggle - Compact */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all ${connectionStatus === "connected"
                ? "bg-green-500/10 text-green-400"
                : connectionStatus === "stale"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : connectionStatus === "error"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "stale"
                    ? "bg-yellow-500"
                    : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-zinc-500 animate-pulse"
                  }`} />
                <span className="hidden sm:inline">
                  {connectionStatus === "connected" ? "Live" :
                    connectionStatus === "stale" ? "Stale" :
                      connectionStatus === "error" ? "Error" : "..."}
                </span>
              </div>
              <span className="hidden md:block text-xs text-zinc-500">{getLastUpdatedText()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Devices Page */}
        {currentPage === "devices" && <DevicesPage />}

        {/* Dashboard Page */}
        {currentPage === "dashboard" && (
          <>
            {!sensor ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <div className="text-6xl opacity-30">📡</div>
                <h2 className="text-xl font-semibold text-zinc-300">Belum ada data sensor</h2>
                <p className="text-sm text-zinc-500">
                  Kirim data untuk melihat monitoring
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Hero Stats - 4 Metric Cards */}
                <section>
                  <h2 className="mb-6 text-2xl font-bold">Monitoring Sensor</h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      value={<AnimatedValue value={Number(sensor.temperature)} decimals={1} />}
                      unit="°C"
                      label="Suhu"
                      icon={
                        <svg className="h-6 w-6 breathing-icon text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      }
                      color="red"
                      gauge={{ value: sensor.temperature, min: 10, max: 45 }}
                      sparkline={sparklineData.temperature}
                    />
                    <StatCard
                      value={<AnimatedValue value={Number(sensor.humidity)} decimals={1} />}
                      unit="%"
                      label="Kelembapan Udara"
                      icon={
                        <svg className="h-6 w-6 breathing-icon text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      }
                      color="blue"
                      gauge={{ value: sensor.humidity, min: 0, max: 100 }}
                      sparkline={sparklineData.humidity}
                    />
                    <StatCard
                      value={<AnimatedValue value={Number(sensor.soil_moisture)} decimals={1} />}
                      unit="%"
                      label="Kelembapan Tanah"
                      icon={
                        <svg className="h-6 w-6 breathing-icon text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      }
                      color="green"
                      gauge={{ value: sensor.soil_moisture, min: 0, max: 100 }}
                      sparkline={sparklineData.soil_moisture}
                    />
                    <StatCard
                      value={sensor.rain_status ? "Hujan" : "Cerah"}
                      label="Status Cuaca"
                      icon={
                        <div className="breathing-icon">
                          {sensor.rain_status ? "🌧️" : "☀️"}
                        </div>
                      }
                      color="purple"
                    />
                  </div>
                </section>

                {/* AI Decision Support Module */}
                <section className="animate-on-load opacity-0">
                  <DecisionSupportCard sensorData={sensor} />
                </section>

                {/* Charts Section */}
                <section className="animate-on-load opacity-0 grid grid-cols-1 gap-6">
                  {/* Line Chart - Full Width */}
                  <div>
                    <ChartCard
                      title="Riwayat Sensor"
                      filter={
                        <div className="flex flex-wrap items-center gap-2">
                          <TimeFilter currentFilter={timeFilter} onFilterChange={setTimeFilter} />
                          <ExportMenu data={filteredHistory} toast={toast} />
                        </div>
                      }
                    >
                      <div className="h-[200px] w-full sm:h-[320px]">
                        {lineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" />
                              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" domain={["auto", "auto"]} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" domain={[0, 100]} />
                              <Tooltip
                                labelFormatter={(_, payload) => {
                                  if (payload?.[0]?.payload) {
                                    return `${payload[0].payload.date} ${payload[0].payload.time}`;
                                  }
                                  return "";
                                }}
                                contentStyle={{
                                  fontSize: "12px",
                                  borderRadius: "12px",
                                  background: "#18181b",
                                  border: "1px solid #27272a",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                                }}
                              />
                              <Legend
                                wrapperStyle={{ fontSize: "12px" }}
                                formatter={(value) => {
                                  if (value === "suhu") return "Suhu (°C)";
                                  if (value === "kelembapan") return "Kelembapan Udara (%)";
                                  if (value === "kelembapan_tanah") return "Kelembapan Tanah (%)";
                                  return value;
                                }}
                              />
                              <Line yAxisId="left" type="monotone" dataKey="suhu" name="suhu" stroke={LINE_COLORS.temperature} strokeWidth={3} dot={false} connectNulls />
                              <Line yAxisId="right" type="monotone" dataKey="kelembapan" name="kelembapan" stroke={LINE_COLORS.humidity} strokeWidth={3} dot={false} connectNulls />
                              <Line yAxisId="right" type="monotone" dataKey="kelembapan_tanah" name="kelembapan_tanah" stroke={LINE_COLORS.soil_moisture} strokeWidth={3} dot={false} connectNulls />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState
                            message={`Tidak ada data sensor untuk ${getFilterLabel()}`}
                            icon="📊"
                          />
                        )}
                      </div>
                    </ChartCard>
                  </div>

                  {/* Calendar Heatmap */}
                  <div>
                    <ChartCard
                      title="📅 Aktivitas Sensor Harian"
                      filter={
                        <div className="flex gap-1 sm:gap-2">
                          {[
                            { key: "temperature", icon: "🌡️", label: "Suhu" },
                            { key: "humidity", icon: "💧", label: "Udara" },
                            { key: "soil_moisture", icon: "🌱", label: "Tanah" },
                          ].map(({ key, icon, label }) => (
                            <button
                              key={key}
                              onClick={() => setHeatmapDataKey(key)}
                              className={`rounded-lg px-2 sm:px-3 py-1.5 text-xs font-medium transition-all ${heatmapDataKey === key
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10"
                                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                              <span className="hidden sm:inline">{icon} </span>{label}
                            </button>
                          ))}
                        </div>
                      }
                    >
                      <CalendarHeatmap
                        data={history}
                        dataKey={heatmapDataKey}
                      />
                    </ChartCard>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-800/50 bg-zinc-950/50 py-8 md:mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-zinc-500">© 2026 IoT Monitoring Dashboard. All rights reserved.</p>
            <div className="flex gap-4 text-xs text-zinc-500">
              <span>Realtime Updates</span>
              <span>•</span>
              <span>Firebase Powered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
