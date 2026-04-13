# 🌿 IoT Greenhouse Monitoring Dashboard

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)
![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?style=for-the-badge&logo=eclipsemosquitto)

**Dashboard monitoring & kontrol perangkat greenhouse berbasis IoT secara real-time**

[🚀 Live Demo](https://iot-monitoring-ten.vercel.app) · [📖 Dokumentasi](#-arsitektur-sistem) · [🐛 Issues](https://github.com/astarionnnn/iot-monitoring/issues)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📊 **Monitoring Real-time** | Pantau suhu, kelembapan udara, kelembapan tanah, dan status hujan secara langsung |
| 📈 **Grafik Historis** | Visualisasi data sensor dengan filter waktu (1 jam, 24 jam, 7 hari) menggunakan Recharts |
| 🗓️ **Calendar Heatmap** | Pola data harian dalam bentuk kalender interaktif |
| 🎛️ **Kontrol Perangkat** | Toggle kipas, pompa air, dan lampu secara manual dari dashboard |
| 🤖 **Automation Engine** | Aturan otomatis berbasis threshold sensor yang dijalankan di VPS |
| 🧠 **DSS (Decision Support System)** | Rekomendasi kondisi greenhouse berdasarkan analisis data sensor |
| 🔔 **Notifikasi Alert** | Peringatan otomatis saat sensor melebihi batas normal |
| 📄 **Export PDF** | Unduh laporan data monitoring dalam format PDF |

---

## 🛠️ Tech Stack

### Frontend & API
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 16.1.6 | Framework React + API Routes |
| React | 19 | UI Library |
| Tailwind CSS | v4 | Styling |
| Recharts | ^3.7 | Grafik data sensor |
| React Calendar Heatmap | ^1.10 | Visualisasi kalender |
| Anime.js | ^4.3 | Animasi UI |
| Firebase SDK | ^12.8 | Koneksi Firestore |
| jsPDF + html2canvas | latest | Export PDF |

### Backend & Infrastruktur
| Teknologi | Kegunaan |
|-----------|----------|
| Firebase Firestore | Database real-time |
| Vercel | Hosting dashboard + API |
| Node.js + PM2 | Automation engine di VPS |
| Mosquitto MQTT | Broker perintah ke ESP32 |

### Hardware
| Komponen | Fungsi |
|----------|--------|
| ESP32 | Mikrokontroler utama |
| DHT22 | Sensor suhu & kelembapan udara |
| Soil Moisture Sensor | Sensor kelembapan tanah |
| Rain Sensor | Detektor hujan |
| Relay Module | Kontrol kipas, pompa, lampu |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js >= 18
- Akun Firebase (Firestore enabled)
- Akun Vercel (untuk deployment)

### 1. Clone Repository

```bash
git clone https://github.com/astarionnnn/iot-monitoring.git
cd iot-monitoring
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📡 API Endpoints

### `POST /api/sensor`
Menerima data sensor dari ESP32.

```json
// Request Body
{
  "temperature": 28.5,
  "humidity": 72.1,
  "soil_moisture": 65,
  "rain_status": false
}

// Response 200
{ "success": true, "message": "Data saved" }
```

### `GET /api/control`
Mengambil state perangkat saat ini dari Firestore.

```json
// Response 200
{
  "fan": false,
  "pump": true,
  "light": false
}
```

### `POST /api/control`
Memperbarui state perangkat (dari dashboard atau VPS).

```json
// Request Body
{ "fan": true }

// Response 200
{
  "success": true,
  "message": "Control state updated",
  "data": { "fan": true, "pump": false, "light": false }
}
```

---

## ⚙️ Setup Automation Engine (VPS)

Automation engine berjalan terpisah di VPS menggunakan Node.js dan PM2.

```bash
# Di VPS
cd ~/ta-daffa
npm install

# Jalankan dengan PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Cara Kerja:**
1. Node.js subscribe ke `devices/controls` via `onSnapshot`
2. Saat ada perubahan → evaluasi rules berdasarkan data sensor terbaru
3. Update `devices/controls` di Firestore
4. Publish perintah ke MQTT topic `greenhouse/control` (QoS 1)
5. ESP32 yang subscribe topic tersebut langsung merespons

---

## 🔌 Setup ESP32

Library Arduino yang dibutuhkan:
- `PubSubClient` by Nick O'Leary
- `ArduinoJson` by Benoit Blanchon
- `DHT sensor library` by Adafruit

```cpp
const char* API_SENSOR  = "https://iot-monitoring-ten.vercel.app/api/sensor";
const char* MQTT_BROKER = "IP_VPS_KAMU";
const char* MQTT_TOPIC  = "greenhouse/control";
```

---

## 🚢 Deployment

Project ini di-deploy otomatis ke Vercel setiap push ke branch `main`.

```bash
npm run build    # Build manual
vercel --prod    # Deploy via Vercel CLI
```

> Pastikan environment variables sudah dikonfigurasi di **Vercel Dashboard → Settings → Environment Variables**.

---

## 📊 Pengujian

| Jenis Pengujian | Tools | Indikator |
|----------------|-------|-----------|
| Fungsional | Manual + Postman | Semua fitur berjalan sesuai expected |
| API Endpoint | Postman / Thunder Client | Status code 200/400/401 sesuai |
| Real-time Latency | Serial Monitor + Stopwatch | < 3 detik data tampil di dashboard |
| MQTT QoS | `mosquitto_pub/sub` | QoS 1: 0% packet loss |
| Responsivitas | Chrome DevTools | Layout normal di 375px - 1920px |
| Kompatibilitas | Chrome, Firefox, Edge | Semua fitur berjalan normal |

---

## 👤 Author

**Daffa** — Seorang mahasiswa UGM dari Teknologi Rekayasa Internet

---

<div align="center">

Terimakasih ya

</div>
