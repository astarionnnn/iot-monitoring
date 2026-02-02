export default function MetricCard({
  value,
  label,
  icon,
  iconBgVar,
  iconFgVar,
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition-all duration-300 hover:border-[var(--hover-border)] hover:bg-[var(--card-bg-hover)] hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-3xl font-bold leading-tight text-[var(--page-fg)] transition-transform duration-300 group-hover:scale-105">
            {value}
          </div>
          <div className="mt-1.5 text-sm font-medium text-[var(--muted)] transition-colors duration-300 group-hover:text-[var(--page-fg)]">
            {label}
          </div>
        </div>
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl"
          style={{
            background: `var(${iconBgVar})`,
            color: `var(${iconFgVar})`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}
