export default function SettingsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Pengaturan</h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Konfigurasi dan informasi sistem IoT Dashboard
                </p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Firebase */}
                <SettingCard
                    icon="🔥"
                    title="Firebase"
                    description="Database real-time"
                    status="Terhubung"
                    statusColor="green"
                />

                {/* Auto Refresh */}
                <SettingCard
                    icon="🔄"
                    title="Update Data"
                    description="Auto-refresh setiap 5 detik"
                    status="Aktif"
                    statusColor="blue"
                />

                {/* Sensors */}
                <SettingCard
                    icon="📊"
                    title="Sensor Aktif"
                    description="4 sensor terpantau"
                    status="Online"
                    statusColor="green"
                />

                {/* Devices */}
                <SettingCard
                    icon="⚡"
                    title="Perangkat"
                    description="3 perangkat terdaftar"
                    status="Siap"
                    statusColor="blue"
                />

                {/* Version */}
                <SettingCard
                    icon="📦"
                    title="Versi"
                    description="Dashboard v1.0.0"
                    status="Latest"
                    statusColor="purple"
                />

                {/* Framework */}
                <SettingCard
                    icon="⚛️"
                    title="Framework"
                    description="Next.js 16"
                    status="Modern"
                    statusColor="green"
                />
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Sensor List */}
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <span>🔍</span> Sensor Details
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm">
                        <ListItem icon="🌡️" text="Sensor Suhu (DHT22)" />
                        <ListItem icon="💧" text="Sensor Kelembapan Udara (DHT22)" />
                        <ListItem icon="🌱" text="Sensor Kelembapan Tanah (Soil Moisture)" />
                        <ListItem icon="🌧️" text="Sensor Hujan (Rain Detector)" />
                    </ul>
                </div>

                {/* Device List */}
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <span>🎛️</span> Device Controls
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm">
                        <ListItem icon="🌀" text="Kipas Pendingin Ruangan" />
                        <ListItem icon="💧" text="Pompa Air Irigasi" />
                        <ListItem icon="💡" text="Lampu Area Sensor" />
                    </ul>
                </div>
            </div>

            {/* System Info */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold">Informasi Sistem</h3>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <InfoItem label="Database" value="Firebase Firestore" />
                    <InfoItem label="Hosting" value="Vercel" />
                    <InfoItem label="Real-time" value="WebSocket" />
                    <InfoItem label="UI Framework" value="Tailwind CSS" />
                    <InfoItem label="Charts" value="Recharts" />
                    <InfoItem label="Language" value="JavaScript" />
                </div>
            </div>
        </div>
    );
}

function SettingCard({ icon, title, description, status, statusColor }) {
    const colorClasses = {
        green: "text-green-400",
        blue: "text-blue-400",
        purple: "text-purple-400",
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-zinc-700/50 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]">
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content */}
            <div className="relative">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">{icon}</div>
                        <div>
                            <h3 className="font-semibold text-white transition-colors duration-300 group-hover:text-zinc-50">{title}</h3>
                            <p className="text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400">{description}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-current shadow-lg" style={{ color: statusColor === 'green' ? '#22c55e' : statusColor === 'blue' ? '#3b82f6' : '#a855f7' }} />
                    <span className={`text-sm font-medium ${colorClasses[statusColor]} transition-all duration-300 group-hover:brightness-125`}>
                        {status}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ListItem({ icon, text }) {
    return (
        <li className="flex items-center gap-3 text-zinc-400">
            <span className="text-lg">{icon}</span>
            <span>{text}</span>
        </li>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 font-mono text-sm text-zinc-300">{value}</p>
        </div>
    );
}
