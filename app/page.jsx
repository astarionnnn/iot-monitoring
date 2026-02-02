"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import DevicesPage from "@/components/DevicesPage";
import SettingsPage from "@/components/SettingsPage";
import DecisionSupportCard from "@/components/DecisionSupportCard";
import AnimatedValue from "@/components/AnimatedValue";
import { formatDate, formatTime } from "@/lib/dateFormat";
import { animate, stagger } from "animejs";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const LINE_COLORS = { temperature: "#ef4444", humidity: "#3b82f6", soil_moisture: "#22c55e" };
const PIE_COLORS = ["#3b82f6", "#22c55e"];
const BAR_COLORS = ["#ef4444", "#3b82f6", "#22c55e"];

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sensor, setSensor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasAnimatedIn = useRef(false);

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, "sensor_data"),
        orderBy("created_at", "desc"),
        limit(50)
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
      } else {
        setSensor(null);
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset entrance animation flag when leaving dashboard to allow re-animation on return
  useEffect(() => {
    if (currentPage !== "dashboard") {
      hasAnimatedIn.current = false;
    }
  }, [currentPage]);

  // Entrance Animations
  useEffect(() => {
    if (!loading && sensor && currentPage === "dashboard") {
      // Stagger cards entrance - Only run once per tab visit
      if (!hasAnimatedIn.current) {
        animate(".animate-on-load", {
          translateY: [30, 0],
          opacity: [0, 1],
          delay: stagger(100, { start: 1200 }),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          duration: 1400,
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

  const lineData = useMemo(() => {
    const reversed = [...history].reverse();
    return reversed.map((d) => ({
      time: formatTime(d.created_at),
      date: formatDate(d.created_at),
      full: d.created_at,
      suhu: d.temperature != null ? Number(d.temperature) : null,
      kelembapan: d.humidity != null ? Number(d.humidity) : null,
      kelembapan_tanah: d.soil_moisture != null ? Number(d.soil_moisture) : null,
    }));
  }, [history]);

  const pieData = useMemo(() => {
    const rain = history.filter((d) => d.rain_status === true).length;
    const noRain = history.filter((d) => d.rain_status === false).length;
    return [
      { name: "Hujan", value: rain, fill: PIE_COLORS[0] },
      { name: "Tidak Hujan", value: noRain, fill: PIE_COLORS[1] },
    ].filter((d) => d.value > 0);
  }, [history]);

  const barData = useMemo(() => {
    if (!sensor) return [];
    return [
      {
        name: "Suhu",
        value: sensor.temperature != null ? Number(sensor.temperature) : 0,
        unit: "°C",
      },
      {
        name: "Kelembapan Udara",
        value: sensor.humidity != null ? Number(sensor.humidity) : 0,
        unit: "%",
      },
      {
        name: "Kelembapan Tanah",
        value: sensor.soil_moisture != null ? Number(sensor.soil_moisture) : 0,
        unit: "%",
      },
    ];
  }, [sensor]);

  if (loading && !sensor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="mt-4 text-sm text-zinc-500">Memuat data sensor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold shadow-lg shadow-blue-500/20">
                🌡
              </div>
              <div>
                <h1 className="text-xl font-bold">IoT Monitoring</h1>
                <p className="text-xs text-zinc-500 mt-0.5">Real-time Sensor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-1.5 text-xs">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-zinc-400">Live</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:overflow-visible">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentPage === "dashboard"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage("devices")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentPage === "devices"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
            >
              Perangkat
            </button>
            <button
              onClick={() => setCurrentPage("settings")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentPage === "settings"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
            >
              Pengaturan
            </button>
          </nav>

          {/* Breadcrumb */}
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className="transition-colors hover:text-blue-400"
            >
              Dashboard
            </button>
            {currentPage !== "dashboard" && (
              <>
                <span>→</span>
                <span className="font-medium text-blue-400">
                  {currentPage === "devices" ? "Perangkat" : "Pengaturan"}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Devices Page */}
        {currentPage === "devices" && <DevicesPage />}

        {/* Settings Page */}
        {currentPage === "settings" && <SettingsPage />}

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
                <section className="animate-on-load opacity-0 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Line Chart - Full Width on Large */}
                  <div className="lg:col-span-3">
                    <ChartCard title="Riwayat Sensor">
                      <div className="h-[280px] w-full sm:h-[320px]">
                        {lineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
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
                          <EmptyState message="Belum ada riwayat untuk ditampilkan" />
                        )}
                      </div>
                    </ChartCard>
                  </div>

                  {/* Pie Chart */}
                  <div className="lg:col-span-1">
                    <ChartCard title="Status Hujan">
                      <div className="h-[280px] w-full">
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  fontSize: "12px",
                                  borderRadius: "12px",
                                  background: "#18181b",
                                  border: "1px solid #27272a",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState message="Belum ada data" />
                        )}
                      </div>
                    </ChartCard>
                  </div>

                  {/* Bar Chart */}
                  <div className="lg:col-span-2">
                    <ChartCard title="Nilai Sensor Saat Ini">
                      <div className="h-[280px] w-full">
                        {barData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 24, left: 100, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                              <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" />
                              <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" />
                              <Tooltip
                                contentStyle={{
                                  fontSize: "12px",
                                  borderRadius: "12px",
                                  background: "#18181b",
                                  border: "1px solid #27272a",
                                }}
                              />
                              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                {barData.map((_, index) => (
                                  <Cell key={index} fill={BAR_COLORS[index]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState message="Tidak ada data" />
                        )}
                      </div>
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

function StatCard({ value, unit, label, icon, trend, color }) {
  const colorClasses = {
    red: {
      gradient: "from-red-500/10 to-red-600/5",
      border: "border-red-500/20 hover:border-red-500/40",
      shadow: "hover:shadow-red-500/20",
      glow: "group-hover:shadow-red-500/30",
    },
    blue: {
      gradient: "from-blue-500/10 to-blue-600/5",
      border: "border-blue-500/20 hover:border-blue-500/40",
      shadow: "hover:shadow-blue-500/20",
      glow: "group-hover:shadow-blue-500/30",
    },
    green: {
      gradient: "from-green-500/10 to-green-600/5",
      border: "border-green-500/20 hover:border-green-500/40",
      shadow: "hover:shadow-green-500/20",
      glow: "group-hover:shadow-green-500/30",
    },
    purple: {
      gradient: "from-purple-500/10 to-purple-600/5",
      border: "border-purple-500/20 hover:border-purple-500/40",
      shadow: "hover:shadow-purple-500/20",
      glow: "group-hover:shadow-purple-500/30",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] animate-on-load opacity-0 ${colors.gradient} ${colors.border} ${colors.shadow}`}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">{label}</p>
          <div className="mt-2 flex items-baseline gap-1 transition-transform duration-300 group-hover:scale-105">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</h3>
            {unit && <span className="text-xs font-medium text-zinc-500 sm:text-sm">{unit}</span>}
          </div>
          {trend && (
            <p className="mt-2 text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400">{trend}</p>
          )}
        </div>
        <div className="text-4xl opacity-50 transition-all duration-300 group-hover:scale-125 group-hover:opacity-70 group-hover:rotate-6">
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full ${color === 'red' ? 'from-red-500 to-orange-500' : color === 'blue' ? 'from-blue-500 to-cyan-500' : color === 'green' ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-pink-500'}`} />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-zinc-700/50 hover:shadow-xl hover:shadow-blue-500/5 animate-on-load opacity-0">
      <h3 className="mb-4 text-lg font-semibold text-zinc-200 transition-colors duration-300 group-hover:text-white">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
