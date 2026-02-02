export default function DashboardHeader({ currentPage, onNavigate }) {
  const pages = [
    { id: "dashboard", label: "Beranda" },
    { id: "devices", label: "Perangkat" },
    { id: "settings", label: "Pengaturan" },
  ];

  return (
    <>
      <header className="bg-[var(--header-bg)] text-[var(--header-fg)] shadow-lg shadow-blue-900/20">
        <div className="mx-auto flex min-h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-base shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/30 hover:shadow-xl">
              ◇
            </div>
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              IoT Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/30 hover:shadow-xl">
              👤
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-medium">admin@iot-dashboard.local</span>
              <span className="text-xs text-white/60">Administrator</span>
            </div>
          </div>
        </div>
        <nav className="mx-auto max-w-[1400px] px-6 pb-3">
          <ul className="flex gap-2">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  onClick={() => onNavigate(page.id)}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-95 ${currentPage === page.id
                      ? "bg-white/20 text-white shadow-md backdrop-blur-sm hover:bg-white/30 hover:shadow-lg hover:-translate-y-0.5"
                      : "text-white/80 hover:bg-white/15 hover:text-white hover:shadow-md"
                    }`}
                >
                  {page.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="border-b border-[var(--border)] bg-[var(--page-bg)] px-6 py-4">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <a className="transition-colors hover:text-blue-500 cursor-pointer" onClick={() => onNavigate("dashboard")}>
              Dashboard
            </a>
            <span className="text-zinc-600">→</span>
            {currentPage === "devices" && (
              <>
                <span className="font-medium text-blue-500">Perangkat</span>
              </>
            )}
            {currentPage === "settings" && (
              <>
                <span className="font-medium text-blue-500">Pengaturan</span>
              </>
            )}
            {currentPage === "dashboard" && (
              <>
                <a className="transition-colors hover:text-blue-500" href="#">
                  Monitoring Sensor
                </a>
                <span className="text-zinc-600">→</span>
                <span className="font-medium text-blue-500">
                  Kantor / Sensor IoT
                </span>
              </>
            )}
          </div>
          <h2 className="mt-2 text-2xl font-bold text-[var(--page-fg)]">
            {currentPage === "devices" && "Kontrol Perangkat"}
            {currentPage === "settings" && "Pengaturan"}
            {currentPage === "dashboard" && "Kantor / Sensor IoT"}
          </h2>
        </div>
      </div>
    </>
  );
}
