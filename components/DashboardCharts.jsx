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
import { formatTime } from "@/lib/dateFormat";

const LINE_COLORS = { temperature: "#ef4444", humidity: "#3b82f6" };
const BAR_COLORS = ["#ef4444", "#3b82f6", "#22c55e"];

export default function DashboardCharts({ todayStr, lineData, pieData, barData }) {
  return (
    <section className="mt-6 flex flex-col gap-6">
      {/* Line Chart - Suhu & Kelembapan */}
      <div className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300 hover:border-[var(--hover-border)] hover:bg-[var(--card-bg-hover)] hover:shadow-lg hover:shadow-blue-500/10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--page-fg)]">
            Suhu & kelembapan udara (riwayat)
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs text-[var(--page-fg)] transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={todayStr}
              readOnly
              style={{ minWidth: "180px" }}
            />
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-medium text-[var(--page-fg)] transition-all hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] hover:shadow-md active:scale-95"
            >
              Filter
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--page-fg)] active:scale-95"
              aria-label="Menu"
            >
              ⋮
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--tb-chart-grid)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--tb-muted)" }}
                  stroke="var(--tb-muted)"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "var(--tb-muted)" }}
                  stroke="var(--tb-muted)"
                  domain={["auto", "auto"]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--tb-muted)" }}
                  stroke="var(--tb-muted)"
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(value) => [value, ""]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.full
                      ? formatTime(payload[0].payload.full)
                      : ""
                  }
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "12px",
                    background: "var(--tb-tooltip-bg)",
                    border: "1px solid var(--tb-tooltip-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) =>
                    value === "suhu"
                      ? "Suhu (°C)"
                      : value === "kelembapan"
                        ? "Kelembapan udara (%)"
                        : value
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="suhu"
                  name="suhu"
                  stroke={LINE_COLORS.temperature}
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="kelembapan"
                  name="kelembapan"
                  stroke={LINE_COLORS.humidity}
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "0.875rem",
              }}
            >
              Belum ada riwayat untuk ditampilkan
            </div>
          )}
        </div>
      </div>

      {/* Grid untuk Status Hujan dan Nilai Sensor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Status Hujan */}
        <div className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300 hover:border-[var(--hover-border)] hover:bg-[var(--card-bg-hover)] hover:shadow-lg hover:shadow-purple-500/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--page-fg)]">Status hujan (riwayat)</h3>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--page-fg)] active:scale-95"
              aria-label="Menu"
            >
              ⋮
            </button>
          </div>
          <div className="h-[240px] w-full">
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
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} data`, ""]}
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "12px",
                      background: "var(--tb-tooltip-bg)",
                      border: "1px solid var(--tb-tooltip-border)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: "0.875rem",
                }}
              >
                Belum ada data status hujan
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart - Nilai Sensor */}
        <div className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300 hover:border-[var(--hover-border)] hover:bg-[var(--card-bg-hover)] hover:shadow-lg hover:shadow-green-500/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--page-fg)]">Nilai sensor saat ini</h3>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--page-fg)] active:scale-95"
              aria-label="Menu"
            >
              ⋮
            </button>
          </div>
          <div className="h-[240px] w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--tb-chart-grid)"
                    opacity={0.3}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "var(--tb-muted)" }}
                    stroke="var(--tb-muted)"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={75}
                    tick={{ fontSize: 11, fill: "var(--tb-muted)" }}
                    stroke="var(--tb-muted)"
                  />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value} ${props.payload.unit}`,
                      props.payload.name,
                    ]}
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "12px",
                      background: "var(--tb-tooltip-bg)",
                      border: "1px solid var(--tb-tooltip-border)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
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
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: "0.875rem",
                }}
              >
                Tidak ada data
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
