# 🤖 Dokumen Analisis & Panduan Lengkap: OpenClaw SaaS Bot

**OpenClaw SaaS Bot** (v3.0.0) adalah *Telegram Bot* turunan tingkat *Enterprise* yang terintegrasi langsung dengan OpenClaw Core System. Platform SaaS ini difokuskan pada penyediaan layanan pembuatan *Video Marketing AI* secara komprehensif dan otomatis.

---

## 1. Summary Lengkap (Ringkasan Proyek)
Aplikasi ini memungkinkan pengguna (baik _end-user_ maupun _marketer_) untuk secara otomatis men-*generate* video *marketing* dari foto produk hanya melalui interaksi platform Telegram. Sebagai SaaS (*Software as a Service*), bot ini dilengkapi ekosistem monitisasi seperti sistem *top-up* kredit mutakhir, *referral/affiliate* (2-tier), *dashboard analytics* interaktif, dan kapabilitas *publish* langsung ke *social media*.

---

## 2. Provider yang Dipakai & Tech Stack
Sistem ini menggunakan arsitektur modern berkinerja tinggi yang siap *scale*:

### Cloud & AI Providers:
- **AI Pipeline / Generative Video**: GeminiGen.ai API, KLING API, dan RUNWAY API.
- **Payment Gateway**: Midtrans (Sebagai jalur utama/*primary*) dan Tripay (Sebagai cadangan/*backup*).
- **Storage/CDN**: AWS S3 dan Cloudflare R2 (untuk menyimpan aset input foto dan *output* video).

### Core Technology Stack:
- **Runtime & Language**: Node.js 20 (LTS) dikembangkan murni menggunakan TypeScript (`tsx`, `tsc`).
- **Framework Aplikasi**: **Telegraf.js** (Untuk _core_ engine routing Telegram Bot) yang dipadukan dengan **Fastify** dan **EJS** (Untuk Webhook & _Web View/Frontend Dashboard_ terpisah berbasis MVC).
- **Database Utama**: PostgreSQL 15 dengan struktur *Primary-Replica*, diolah menggunakan ORM **Prisma**.
- **Caching & State Management**: Redis Cluster 7.x (via `ioredis`).
- **Task Queue & Background Jobs**: **BullMQ** (Untuk manajemen antrean prioritas komputasi AI video generatif agar tidak terjadi _bottleneck_).

---

## 3. Analisa Lengkap & Arsitektur (Architecture Analysis)
Arsitektur OpenClaw SaaS Bot direkayasa untuk menyangga *beban berat* rendering AI (*heavy computational API payloads*):
- **Webhooks Handling**: _Event_ masuk ditarik melalui *webhook* oleh server Fastify (beroperasi via port 3000).
- **Decoupled Architecture**: Logika manajemen status pengguna (_state manager_) dipecah ke Redis, sedangkan operasi *Long-Polling* (proses antrean pembuatan video AI) didelegasikan sepenuhnya ke *Queue Worker* dengan perantara *BullMQ*. Ini memastikan antarmuka bot Telegram tidak "hang" saat video sedang digenerate (Asynchronous flow).
- **Monetization & Credit System**: Menggunakan metode top-up kredit berbasis P2P mutakhir plus sistem *fee* (komisi), dilengkapi modul pembayaran asinkron (_Midtrans/Tripay Callback_).
- **Security Check**: Dipenuhi dengan `Telegraf` guards, limiter dari `rate-limiter-flexible`, serta environment produksi didekorasi dengan PM2 / `systemd` (`openclaw-saas-bot.service`).

---

## 4. Alur Kerja (Working Flow)
Berikut adalah gambaran umum saat *user* menggunakan layanan bot ini:

1. **User Registration / Start**: User menekan `/start` di Telegram. Data _user_ di-insert ke PostgreSQL via Prisma.
2. **Top-up / Deposit**: User memesan komputasi. Jika saldo kurang, _Fastify web routes_ meng-generate HTML/EJS _payment page_ untuk Midtrans/Tripay.
3. **Data Input**: User meng-upload gambar produk ke dalam *chat*. Bot menerima asil tersebut dan mengamankannya di AWS S3/Cloudflare R2.
4. **Queue Processing (BullMQ)**: Telegram bot memberi tahu sistem backend untuk memulai _rendering_. *Job params* masuk ke Redis.
5. **AI API Calling**: Worker di _background_ memanggil GeminiGen/Kling/Runway API menggunakan payload *image url* 
6. **Result Delivery (Webhook)**: AI provider mengembalikan video final. Worker menyimpannya di CDN, lalu menggunakan metode `sendVideo` API Telegram untuk men-*deliver* video jadi kepada user secara mandiri disertai dengan pesan notifikasi dari Bot.

---

## 5. User Guide (Buku Panduan Developer & Deployment)

### Instalasi & Setup Lokal:
1. **Clone & Install**: Pastikan menggunakan Node.js >=20.0.0. Jalankan `npm install`.
2. **Konfigurasi Lingkungan (`.env`)**: Integrasikan Token *Telegram Bot*, Database URL (*PostgreSQL/Redis*), API AI (Kling/Runway), serta *Keys* (Midtrans/Tripay, AWS).
   *(Contoh file .env.example telah disediakan di root).*
3. **Database Migration**: Jalankan `npm run migrate:dev` (Ditunggangi Prisma untuk menyikronisasikan skema PostgeSQL).
4. **Jalankan Bot**: Untuk testing gunakan `npm run dev`.

### Panduan Produksi (Deployment):
- Sangat disarankan untuk menjalankan di atas **Docker** atau **Systemd Service**.
- **Via Systemd**: Codebase ini memiliki file `openclaw-saas-bot.service` (biasanya diletakkan di `/etc/systemd/system/`). Sistem menggunakan `tsx src/index.ts` sebagai daemon.
- **Via Docker**: `docker build -t openclaw-bot:latest .` dilanjutkan dengan menjalankan _container_ yang di-biding ke port 3000.
- **Monitoring Observability**: Cek secara periodik Endpoint `/metrics` untuk memantau sirkulasi user, _error_ rate, dan antrean generasi di backend menggunakan layanan _observability_ mandiri.

---
*Dokumentasi ini otomatis dibuat (auto-generated) berdasarkan profil kode `package.json`, `README.md`, dan topologi internal dari SaaS Bot milik Anda.*
