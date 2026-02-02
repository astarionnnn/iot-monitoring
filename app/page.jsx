"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import DevicesPage from "@/components/DevicesPage";
import SettingsPage from "@/components/SettingsPage";
import { formatDate, formatTime } from "@/lib/dateFormat";
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

const LINE_COLORS = { temperature: "#ef4444", humidity: "#3b82f6" };
const PIE_COLORS = ["#3b82f6", "#22c55e"];
const BAR_COLORS = ["#ef4444", "#3b82f6", "#22c55e"];

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sensor, setSensor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const lineData = useMemo(() => {
    const reversed = [...history].reverse();
    return reversed.map((d) => ({
      time: formatTime(d.created_at),
      full: d.created_at,
      suhu: d.temperature != null ? Number(d.temperature) : null,
      kelembapan: d.humidity != null ? Number(d.humidity) : null,
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
      <header className="border-b border-zinc-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold shadow-lg shadow-blue-500/20">
                🌡
              </div>
              <div>
                <h1 className="text-xl font-bold">IoT Monitoring</h1>
                <p className="text-xs text-zinc-500">Real-time Sensor Dashboard</p>
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
          <nav className="mt-4 flex gap-2">
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

      <main className="mx-auto max-w-7xl px-6 py-8">
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
                      value={sensor.temperature != null ? `${sensor.temperature}°C` : "—"}
                      label="Suhu"
                      icon="🌡️"
                      trend="+2.5°"
                      color="red"
                    />
                    <StatCard
                      value={sensor.humidity != null ? `${sensor.humidity}%` : "—"}
                      label="Kelembapan Udara"
                      icon="💧"
                      trend="+5%"
                      color="blue"
                    />
                    <StatCard
                      value={sensor.soil_moisture != null ? `${sensor.soil_moisture}%` : "—"}
                      label="Kelembapan Tanah"
                      icon="🌱"
                      trend="-3%"
                      color="green"
                    />
                    <StatCard
                      value={sensor.rain_status ? "Hujan" : "Cerah"}
                      label="Status Cuaca"
                      icon="🌧️"
                      trend={sensor.rain_status ? "Hujan" : "Cerah"}
                      color="purple"
                    />
                  </div>
                </section>

                {/* Charts Section */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Line Chart - Full Width on Large */}
                  <div className="lg:col-span-3">
                    <ChartCard title="Riwayat Suhu & Kelembapan">
                      <div className="h-[320px] w-full">
                        {lineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" />
                              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" domain={["auto", "auto"]} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#71717a" }} stroke="#3f3f46" domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{
                                  fontSize: "12px",
                                  borderRadius: "12px",
                                  background: "#18181b",
                                  border: "1px solid #27272a",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "12px" }} />
                              <Line yAxisId="left" type="monotone" dataKey="suhu" name="Suhu (°C)" stroke="#ef4444" strokeWidth={3} dot={false} connectNulls />
                              <Line yAxisId="right" type="monotone" dataKey="kelembapan" name="Kelembapan (%)" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
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
      <footer className="mt-20 border-t border-zinc-800/50 bg-zinc-950/50 py-8">
        <div className="mx-auto max-w-7xl px-6">
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

function StatCard({ value, label, icon, trend, color }) {
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
    <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] ${colors.gradient} ${colors.border} ${colors.shadow}`}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105">{value}</h3>
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
    <div className="group overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-zinc-700/50 hover:shadow-xl hover:shadow-blue-500/5">
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
