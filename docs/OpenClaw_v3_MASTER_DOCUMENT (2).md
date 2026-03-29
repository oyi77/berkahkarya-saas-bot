# ════════════════════════════════════════════════════════════════════════
# VILONA OPENCLAW SAAS — MASTER DOCUMENT v3.0
# ════════════════════════════════════════════════════════════════════════
# Platform AI Generate Image & Video — Telegram Bot
# BerkahKarya | berkahkarya.org
# Bot: @berkahkarya_saas_bot
# Admin: @codergaboets (Telegram)
# ════════════════════════════════════════════════════════════════════════

Dokumen ini adalah satu-satunya referensi lengkap untuk seluruh sistem Vilona OpenClaw SaaS. Setiap aspek bisnis, teknis, strategi, dan operasional tercakup di sini.

# ════════════════════════════════════════════════════════════════════════
# DAFTAR ISI LENGKAP
# ════════════════════════════════════════════════════════════════════════

PART 1 — PRODUCT OVERVIEW
  1.1  Apa itu Vilona OpenClaw SaaS
  1.2  Visi dan Misi
  1.3  Target Market
  1.4  Unique Value Proposition
  1.5  Competitive Landscape

PART 2 — USER EXPERIENCE (UX)
  2.1  Onboarding Flow (User Baru)
  2.2  Menu Utama
  2.3  Mode Generate (Basic/Smart/Pro)
  2.4  Fitur Image Generation
  2.5  Fitur Video Generation
  2.6  Fitur Clone Style
  2.7  Fitur Campaign Builder
  2.8  Fitur Transfer Credit P2P
  2.9  Fitur Dashboard Web (User)
  2.10 Fitur Settings & Preferences
  2.11 UX Principles & Design Decisions

PART 3 — WORKFLOW & FLOWCHART
  3.1  Master Workflow (Semua Step)
  3.2  Basic Mode Flow
  3.3  Smart Mode Flow
  3.4  Pro Mode Flow
  3.5  Clone Style Flow
  3.6  Campaign Builder Flow
  3.7  Payment Flow
  3.8  Referral Flow
  3.9  Transfer P2P Flow
  3.10 Error & Recovery Flow

PART 4 — HPAS FRAMEWORK
  4.1  Apa itu HPAS
  4.2  7 Scene Breakdown
  4.3  Duration Presets
  4.4  Industry Templates (6 Industri)
  4.5  Kenapa HPAS Convert Tinggi

PART 5 — PRICING & ECONOMICS
  5.1  Credit System (1 Credit = 10 Unit)
  5.2  COGS Analysis (22 Provider)
  5.3  Unit Cost per Aksi
  5.4  Paket Credit (5 Tier)
  5.5  Subscription Plans (3 Tier)
  5.6  Margin Analysis
  5.7  Cost-Based Provider Routing
  5.8  Break-Even Analysis
  5.9  Revenue Projection

PART 6 — AFFILIATE & REFERRAL SYSTEM
  6.1  Struktur Komisi 3 Tier (15/5/3%)
  6.2  Syarat Aktivasi (Detail)
  6.3  Alur Komisi End-to-End
  6.4  Contoh Perhitungan (5 Skenario)
  6.5  Payout Rules
  6.6  Anti-Fraud Detection
  6.7  Affiliate Growth Strategy

PART 7 — PROVIDER INFRASTRUCTURE
  7.1  Image Providers (12 Provider)
  7.2  Video Providers (10 Provider)
  7.3  AI Analysis Providers
  7.4  TTS & Audio Providers
  7.5  Failover & Circuit Breaker
  7.6  Provider Health Monitoring
  7.7  Cost Routing Rules

PART 8 — RETENTION & ENGAGEMENT STRATEGY
  8.1  5 Tipe User yang Hilang
  8.2  Automated Trigger System
  8.3  Gamification (Streak/Badge/Leaderboard)
  8.4  Content Calendar
  8.5  Win-Back Campaign
  8.6  Anti-Spam Rules

PART 9 — SCALE-UP STRATEGY
  9.1  Phase 1: First 50 Users (Bulan 1-2)
  9.2  Phase 2: Product-Market Fit (Bulan 3-4)
  9.3  Phase 3: Growth (Bulan 5-8)
  9.4  Phase 4: Scale (Bulan 9-12)
  9.5  Phase 5: Expansion (Tahun 2)
  9.6  Key Metrics per Phase
  9.7  Hiring Roadmap
  9.8  Tech Scaling

PART 10 — ADMIN & OPERATIONS
  10.1  Admin Dashboard
  10.2  Daily Operations Checklist
  10.3  Weekly Operations
  10.4  Monthly Operations
  10.5  Incident Response
  10.6  Content Moderation

PART 11 — DEVELOPER GUIDE
  11.1  Architecture Overview
  11.2  File Structure
  11.3  Patch Instructions
  11.4  Meta CAPI Tracking
  11.5  Database Schema
  11.6  Queue System
  11.7  Environment Variables

PART 12 — LANDING PAGE
  12.1  Page Structure
  12.2  Copy & Messaging
  12.3  SEO Strategy

PART 13 — ERROR HANDLING & EDGE CASES
  13.1  Generate Failures (6 Skenario)
  13.2  Payment Failures (4 Skenario)
  13.3  Referral Failures (4 Skenario)
  13.4  Transfer P2P Failures
  13.5  Bot Failures

PART 14 — FAQ (40 Pertanyaan)

PART 15 — CHANGELOG & ROADMAP

# ════════════════════════════════════════════════════════════════════════
# PART 1 — PRODUCT OVERVIEW
# ════════════════════════════════════════════════════════════════════════

## 1.1 Apa itu Vilona OpenClaw SaaS

Vilona OpenClaw SaaS adalah platform AI generate image dan video berbasis Telegram Bot. User mengirim 1 foto produk, AI mengubahnya menjadi set gambar (7 scene) atau video iklan profesional (15-60 detik) siap posting ke TikTok, Instagram Reels, dan YouTube Shorts.

Platform ini dibangun di atas 22 AI provider dengan auto-failover, memastikan layanan selalu tersedia. Setiap output mengikuti HPAS Framework — struktur narasi iklan yang terbukti convert. 3 mode operasi (Basic/Smart/Pro) melayani semua level user dari pemula UMKM sampai agency profesional.

Diakses 100% melalui Telegram Bot (@berkahkarya_saas_bot). Tidak perlu download app, tidak perlu buka browser, tidak perlu skill editing.

## 1.2 Visi dan Misi

Visi: Menjadi platform AI video ads nomor 1 untuk UMKM di Asia Tenggara.

Misi: Memberikan UMKM akses ke produksi video iklan berkualitas agency dengan harga yang terjangkau, melalui teknologi AI yang sederhana dan bisa diakses dari Telegram.

## 1.3 Target Market

Primary: UMKM offline di Indonesia (kafe, restoran, salon, klinik kecantikan, gym, toko fashion, toko online). Mereka butuh konten video untuk TikTok/IG tapi tidak punya skill editing, tidak punya budget agency (Rp 500k-5jt per video), dan tidak punya waktu belajar tools rumit.

Secondary: Kreator konten dan agency kecil yang butuh volume tinggi dengan biaya rendah. Mereka sudah paham value video ads tapi butuh tools yang lebih efisien dari editing manual.

Tertiary: UMKM di Asia Tenggara (Malaysia, Thailand, Vietnam, Filipina) yang punya kebutuhan sama. Didukung 24 bahasa.

## 1.4 Unique Value Proposition

1. HPAS Framework: Setiap video mengikuti struktur Hook-Problem-Agitate-Solution yang terbukti convert. Bukan video random.
2. 1 Foto = 1 Video: Kirim foto produk, terima video iklan. Tidak perlu skill apapun.
3. Konsistensi Visual: IP-Adapter dan Face Swap menjaga karakter dan produk konsisten di setiap scene.
4. 22 Provider, Never Down: Auto-failover memastikan 99.9% uptime.
5. 60 Detik: Dari upload foto sampai terima video, hanya butuh ~60 detik.
6. Mulai Rp 25.000: Harga yang terjangkau untuk UMKM.
7. Telegram-Native: Tidak perlu app baru. 99% HP di Indonesia sudah ada Telegram.

## 1.5 Competitive Landscape

Kompetitor langsung: Tidak ada yang persis sama (Telegram bot + HPAS + multi-provider + targeting UMKM Indonesia). Ini blue ocean.

Kompetitor tidak langsung:
- Canva Video: Self-service, butuh skill, bukan AI-generated
- CapCut: Editing tool, bukan generator, butuh waktu belajar
- Runway/Pika/Kling: AI video generator tapi generic (tidak ada HPAS), harga USD (mahal untuk UMKM Indonesia), tidak ada Telegram interface
- Freelancer/Agency: Mahal (Rp 500k-5jt per video), lambat (3-7 hari), tidak scalable
- Sora/Gen-3: Belum available/mahal, tidak targeting UMKM

Keunggulan OpenClaw: Satu-satunya platform yang combine Telegram bot + HPAS framework + multi-provider failover + harga Rupiah + targeting UMKM Indonesia.

# ════════════════════════════════════════════════════════════════════════
# PART 2 — USER EXPERIENCE (UX)
# ════════════════════════════════════════════════════════════════════════

## 2.1 Onboarding Flow (User Baru)

Step 1: User menemukan bot melalui referral link, iklan, atau pencarian Telegram.
Step 2: User ketik /start atau tap "Start" di bot @berkahkarya_saas_bot.
Step 3: Bot mendeteksi user baru (belum ada di database).
Step 4: Bot membuat akun otomatis dengan data Telegram (ID, nama, username).
Step 5: Jika user datang dari referral link, koneksi referrer dicatat (Tier 1).
Step 6: User mendapat welcome message + bonus 1x generate image GRATIS.
Step 7: Bot tampilkan Menu Utama.
Step 8: User tap "Generate Konten" → mulai flow pertama.

Bonus gratis: 1x generate image saja (bukan video, bukan campaign). Sekali seumur hidup, tidak berulang. Tujuan: biarkan user merasakan value tanpa commit uang. Jika hasilnya bagus, mereka akan beli credit.

## 2.2 Menu Utama

Setelah /start, bot tampilkan:

Baris 1: [🎬 Generate Konten] — entry point utama
Baris 2: [💰 Beli Credit] [📊 History]
Baris 3: [👤 Profil] [👥 Referral]
Baris 4: [💸 Transfer Credit] [📈 Dashboard]
Baris 5: [⚙️ Settings] [❓ Bantuan]

Setiap tombol adalah callback button yang mengarah ke handler masing-masing. Menu ini juga menampilkan saldo credit user saat ini.

## 2.3 Mode Generate

User pilih mode SETIAP KALI mau generate (bukan setting permanen). Ini memberikan fleksibilitas — kadang mau cepat (Basic), kadang mau kontrol (Pro).

Basic (Full Auto): Upload foto → AI deteksi → AI pilih semua parameter → Generate → Terima hasil. User tidak diminta input apapun selain foto. Ideal untuk pemula dan yang terburu-buru. Template otomatis: Standard 30s, TikTok 9:16, VO ON, Subs ON.

Smart (Pilih Preset): Upload foto → AI deteksi → User pilih durasi (Quick 15s / Standard 30s / Extended 60s) → User pilih platform (TikTok/IG/YouTube) → Confirm → Generate. User punya sedikit kontrol tanpa overwhelmed oleh pilihan.

Pro (Full Control): Upload foto → AI deteksi → User lihat semua 7 scene HPAS → User bisa edit script per scene → User pilih durasi, platform, VO, subtitles → Confirm → Generate. Setiap aspek bisa di-customize. Cocok untuk agency yang punya brand guideline spesifik.

## 2.4 Fitur Image Generation

Menghasilkan 7 gambar (1 per scene HPAS) dari 1 foto produk. Output dikirim sebagai media group di Telegram. Cocok untuk carousel Instagram, feed post, atau storyboard sebelum buat video.

Biaya: 1.5 unit (0.15 credit). Waktu: ~30-45 detik.

Setiap gambar mengikuti scene HPAS: Hook image (attention-grabbing close-up), Problem image (relatable frustration), Agitate image (urgency), Discovery image (product reveal), Interaction image (product usage), Result image (transformation), CTA image (call-to-action layout).

Jika user upload foto produk: AI menggunakan img2img mode — output tetap mempertahankan produk asli dengan variasi scene.
Jika user ketik deskripsi saja: AI menggunakan text2img mode — generate dari nol berdasarkan deskripsi.

## 2.5 Fitur Video Generation

Menghasilkan video iklan 15-60 detik dengan struktur HPAS. Output: file MP4 dikirim langsung di Telegram.

Proses internal:
1. AI generate 5-7 keyframe images (1 per scene HPAS)
2. Setiap keyframe di-face-swap untuk konsistensi karakter (jika ada wajah)
3. Keyframe di-animate menjadi video clips (per scene)
4. Voice over di-generate oleh TTS engine (jika diaktifkan)
5. Subtitle di-overlay (jika diaktifkan)
6. Semua clips di-concat + transition + audio mixing via FFmpeg
7. Video final di-upload dan dikirim ke user

Biaya: 2.5 unit (15s), 3.5 unit (30s), 6.0 unit (60s). Waktu: ~60-120 detik.

Platform support: TikTok 9:16, Instagram 9:16, YouTube 16:9, Square 1:1.

## 2.6 Fitur Clone Style

Tiru gaya visual dari referensi (foto/screenshot) dan terapkan ke produk user. Yang ditiru: color palette, lighting style, composition, mood, visual tone. Yang TIDAK ditiru: konten persis, brand marks, text.

Flow: Kirim foto referensi → kirim foto produk sendiri → AI analisis style referensi → AI generate produk user dengan gaya referensi → deliver.

Biaya: 0.5 unit. Waktu: ~30-60 detik.

Use case: Owner kafe screenshot iklan Starbucks → kirim foto kopi dia → dapat foto kopi dia dengan "vibe Starbucks". Brand skincare screenshot iklan Korea → kirim foto serum → dapat foto dengan estetika K-beauty.

## 2.7 Fitur Campaign Builder

Buat 5 atau 10 video sekaligus dari 1 produk dengan hook berbeda. Tujuan: A/B testing iklan — post semua, track mana yang perform terbaik, scale budget di winner.

Variasi hook yang dihasilkan AI:
1. Pertanyaan — "Capek kulit kusam?"
2. Statistik — "8 dari 10 wanita punya masalah ini"
3. Before-After — Transformasi dramatis
4. Testimoni — Gaya review customer
5. Trending — Format challenge TikTok
6. Emotional — Storytelling harian (untuk 10-pack)
7. Comparison — Perbandingan subtle (untuk 10-pack)
8. FOMO — Urgency limited time (untuk 10-pack)
9. Influencer — Celebrity style (untuk 10-pack)
10. UGC — User-generated authentic style (untuk 10-pack)

Scene 2-7 KONSISTEN di semua video (produk sama, visual sama). Hanya Scene 1 (Hook) berbeda.

Biaya: 15 unit (5 video, hemat 14%), 25 unit (10 video, hemat 29%). Waktu: ~5-10 menit.

## 2.8 Fitur Transfer Credit P2P

Kirim credit ke user OpenClaw lain langsung dari bot. Instant, gratis, tanpa fee.

Aturan: Min 0.5 credit, tidak bisa self-transfer, kedua user dapat notifikasi, history tercatat, credit komisi bisa ditransfer, admin bisa freeze per user jika abuse.

Use case: Agency distribusi credit ke operator, hadiah teman, pembayaran jasa antar user.

## 2.9 Fitur Dashboard Web (User)

Akses via tombol "Dashboard" di bot atau URL langsung. Autentikasi via Telegram login widget.

Halaman: Overview (saldo, grafik penggunaan, statistik bulan ini), History (semua generate dengan filter, preview, download, detail provider), Referral Stats (downline 3 tier, komisi earned/pending/available, history payout, link+QR), Transfer History (keluar/masuk), Subscription (plan, renewal, upgrade/downgrade), Settings (bahasa, default platform/mode, notifikasi).

## 2.10 Fitur Settings & Preferences

Bahasa: 24 bahasa didukung. Default: Indonesian. User bisa ganti kapan saja.

Default platform: TikTok (default) / IG / YouTube / Square. Berlaku sebagai pre-select di Smart/Pro mode.

Notifikasi: ON/OFF untuk automated messages (retention, promo, weekly recap).

## 2.11 UX Principles & Design Decisions

Principle 1 — Minimum Taps to Value: Basic mode hanya butuh 3 tap dari /start sampai generate (Generate Konten → Basic → Image Set). Upload foto dihitung 1 aksi. Total: 4 aksi sampai dapat hasil. Ini critical untuk retention — setiap tap tambahan kehilangan ~20% user.

Principle 2 — Progressive Disclosure: Basic menyembunyikan semua parameter. Smart menampilkan 2 pilihan (durasi + platform). Pro menampilkan semua. User tidak overwhelmed di awal.

Principle 3 — Always Recoverable: Setiap langkah ada tombol "Kembali". Generate gagal = credit auto-refund. Tidak ada dead-end.

Principle 4 — Nagih Loop: Setelah deliver hasil, bot langsung tawarkan aksi berikutnya (Variasi, Campaign, Share, Rate). Tidak pernah berhenti di "selesai" — selalu ada next step.

Principle 5 — Trust Through Transparency: Confirm screen menampilkan SEMUA detail sebelum generate (niche, template, scenes, platform, biaya). User tahu persis apa yang akan dibuat dan berapa biayanya. Tidak ada surprise charge.

# ════════════════════════════════════════════════════════════════════════
# PART 3 — WORKFLOW & FLOWCHART
# ════════════════════════════════════════════════════════════════════════

## 3.1 Master Workflow (Semua Step)

```
/start
  │
  ▼
MENU UTAMA ─── [Profil] [History] [Transfer] [Referral] [Dashboard] [Settings] [Bantuan]
  │
  ▼ tap "Generate Konten"
  │
STEP 1: PILIH MODE
  ├── ⚡ Basic (Full Auto)
  ├── 🎯 Smart (Pilih Preset)
  └── 👑 Pro (Full Control)
  │
  ▼
STEP 2: PILIH AKSI
  ├── 📸 Image Set (7 scene)
  ├── 🎥 Video Iklan (HPAS)
  ├── 🔄 Clone Style
  └── 📦 Campaign (5-10 video)
  │
  ▼
STEP 3: INPUT
  ├── Upload foto produk
  ├── Ketik deskripsi produk
  └── [Clone: upload referensi → upload produk]
  │
  ▼
STEP 4: AI DETECTION
  └── Niche, style, mood, product type auto-detected
  │
  ▼
STEP 5: TEMPLATE SELECTION (mode-dependent)
  ├── Basic: AUTO-SKIP (AI pilih terbaik)
  ├── Smart: Pilih dari 3 preset (Quick/Standard/Extended) + platform
  └── Pro: Edit setiap scene, pilih durasi/platform/VO/subs
  │
  ▼
STEP 6: CONFIRM (1 layar)
  └── Ringkasan: niche, template, scenes, platform, biaya, saldo
  │
  ▼
STEP 7: GENERATE
  ├── Progress bar per scene
  ├── AI generate images → face swap → video render → VO → subs → concat
  └── Quality check
  │
  ▼
STEP 8: DELIVER
  └── Kirim hasil (image group / video MP4)
  │
  ▼
POST-DELIVERY (Nagih Loop)
  ├── [🔄 Variasi Lain]
  ├── [📦 Campaign]
  ├── [📱 Post Sosmed]
  ├── [⭐ Rate]
  ├── [👥 Refer Teman]
  ├── [🎬 Buat Baru] ──→ kembali ke STEP 1
  └── [🏠 Menu Utama]
```

## 3.2 Basic Mode Flow

```
Generate Konten → Basic → Image/Video → Kirim foto
  → AI detect (auto) → AI pick template (auto) → Confirm → Generate → Deliver
Total langkah user: 5 tap + 1 upload = 6 interaksi
```

## 3.3 Smart Mode Flow

```
Generate Konten → Smart → Image/Video → Kirim foto
  → AI detect → Pilih durasi (Quick/Standard/Extended) → Pilih platform → Confirm → Generate → Deliver
Total langkah user: 7 tap + 1 upload = 8 interaksi
```

## 3.4 Pro Mode Flow

```
Generate Konten → Pro → Image/Video → Kirim foto
  → AI detect → Lihat 7 scene → [Edit scene X] → Pilih durasi → Pilih platform → Toggle VO → Toggle Subs → Confirm → Generate → Deliver
Total langkah user: 10+ tap + 1 upload = 11+ interaksi
```

## 3.5 Clone Style Flow

```
Generate Konten → [Mode] → Clone Style
  → Kirim foto referensi gaya → Bot: "Referensi diterima!"
  → Kirim foto produk sendiri → AI detect → Confirm → Generate → Deliver
Total langkah user: 6 tap + 2 upload = 8 interaksi
```

## 3.6 Campaign Builder Flow

```
Generate Konten → [Mode] → Campaign → Pilih 5/10 video
  → Kirim foto produk → AI detect → Confirm (lihat 5/10 hook variations) → Generate batch → Deliver semua
Total langkah user: 7 tap + 1 upload = 8 interaksi
Output: 5/10 video dikirim satu per satu
```

## 3.7 Payment Flow

```
Beli Credit → Pilih paket (Coba Dulu s/d Agency)
  → Pilih metode (QRIS/Bank/Crypto/Stars) → Bayar → Webhook confirm → Credit masuk → Notif
Waktu: QRIS instant, Transfer 1-10 menit, Crypto 2-10 menit
```

## 3.8 Referral Flow

```
Referral → Copy link unik
  → Share ke teman → Teman klik link → Teman /start di bot → Terikat sebagai downline Tier 1
  → Teman deposit → Sistem hitung 15% → Komisi pending (7 hari) → Komisi available
  → Referrer bisa: pakai credit / transfer / tarik tunai (min Rp 50k, setiap Senin)
```

## 3.9 Transfer P2P Flow

```
Transfer Credit → Masukkan username tujuan → Masukkan jumlah
  → Confirm: "Kirim X credit ke @user?" → Tap konfirmasi → Instant transfer → Notif kedua user
```

## 3.10 Error & Recovery Flow

```
Generate gagal:
  Provider down → Auto-switch provider cadangan (user tidak tahu) → Lanjut normal
  Semua provider down → Credit TIDAK dipotong → User: "Gangguan teknis, coba 5 menit" → Admin alert
  Foto blur → Credit TIDAK dipotong → User: "Foto kurang jelas, tips: ..."
  Video timeout > 3 menit → Pindah background queue → Notif saat selesai
  Gagal total setelah retry → Credit AUTO-REFUND penuh → User: "Gagal, credit kembali"

Payment gagal:
  QRIS expired → Generate ulang
  Transfer belum masuk → Tunggu 15 menit → Hubungi admin
  Double payment → Admin credit-kan kelebihan
```

# ════════════════════════════════════════════════════════════════════════
# PART 4 — HPAS FRAMEWORK
# ════════════════════════════════════════════════════════════════════════

## 4.1 Apa itu HPAS

HPAS adalah singkatan dari Hook → Problem → Agitate → Solution. Ini adalah framework narasi iklan yang terbukti menghasilkan konversi tinggi. OpenClaw memperluas HPAS menjadi 7 scene dengan menambahkan Discovery, Interaction, dan CTA.

Prinsip: Setiap video ads yang convert tinggi mengikuti pola emosional: tarik perhatian → identifikasi masalah → buat masalah terasa urgent → perkenalkan solusi → tunjukkan bukti → dorong aksi.

## 4.2 7 Scene Breakdown

Scene 1 — Hook (2-8 detik tergantung durasi):
Tujuan: Stop the scroll. Harus menarik perhatian dalam 1.5 detik pertama (rata-rata attention span di TikTok). Gunakan visual yang striking, kontras tinggi, close-up dramatis, atau pattern interrupt. Emotion target: curiosity/shock.

Scene 2 — Problem (2-8 detik):
Tujuan: Buat viewer relate. Tampilkan masalah yang dialami target audience sehari-hari. Gunakan situasi yang familiar. Emotion target: recognition/frustration. "Oh, itu aku banget."

Scene 3 — Agitate (2-8 detik):
Tujuan: Buat masalah terasa URGENT. Perburuk masalah. Tunjukkan konsekuensi jika tidak diselesaikan. Extreme close-up, lighting dramatis. Emotion target: urgency/anxiety. "Ini harus diatasi SEKARANG."

Scene 4 — Discovery (2-10 detik):
Tujuan: Perkenalkan produk sebagai jawaban. Reveal moment — tangan meraih produk, unboxing, product hero shot. Lighting berubah dari gelap ke terang (visual metaphor: dari masalah ke solusi). Emotion target: hope/relief.

Scene 5 — Interaction (2-10 detik):
Tujuan: Tunjukkan produk DIPAKAI. Bukan foto studio — tapi action shot. Orang mengaplikasikan skincare, menyajikan makanan, memakai outfit. Social proof implicit: "Orang lain pakai ini." Emotion target: desire/engagement.

Scene 6 — Result (2-8 detik):
Tujuan: Tampilkan TRANSFORMASI. Before-after implicit. Kulit glowing, makanan lezat di meja, outfit on point, gadget berjalan smooth. Emotion target: satisfaction/aspiration. "Aku juga mau begitu."

Scene 7 — CTA (1.5-8 detik):
Tujuan: Dorong AKSI NYATA. Product centered, clean background, price tag visible, "Order sekarang", "Link di bio", "Klik di bawah". Emotion target: confidence/decision. "Oke, aku beli."

## 4.3 Duration Presets

Quick (15 detik, 5 scene): Skip scene Agitate dan Interaction. Ideal untuk TikTok ads yang butuh format pendek. Scene durasi 3s masing-masing. Total biaya 2.5 unit.

Standard (30 detik, 7 scene): Full HPAS, 7 scene lengkap. Durasi scene 4-5 detik. Narasi lengkap dan persuasif. Paling versatile — cocok untuk semua platform. Total biaya 3.5 unit.

Extended (60 detik, 7 scene): Full HPAS dengan durasi scene lebih panjang (8-10 detik). Detail lebih kaya, lebih banyak visual, cocok untuk produk yang perlu penjelasan lebih. Ideal untuk YouTube ads atau Facebook ads. Total biaya 6.0 unit.

## 4.4 Industry Templates (6 Industri)

Beauty/Skincare: Hook = close-up skin texture. Problem = kulit bermasalah, frustasi di depan cermin. Agitate = makeup tidak bisa menutupi. Discovery = produk skincare elegant. Interaction = apply serum ke wajah. Result = kulit glowing. CTA = produk + link di bio.

Food/Culinary: Hook = steam dari makanan, sizzling. Problem = bosan menu yang sama. Agitate = makanan gagal, bahan terbuang. Discovery = plating cantik. Interaction = proses masak. Result = orang menikmati makanan. CTA = menu + order sekarang.

Fashion/Lifestyle: Hook = outfit reveal, model walking. Problem = lemari penuh tapi tidak ada yang cocok. Agitate = style crisis. Discovery = unboxing fashion item. Interaction = try on + mirror check. Result = complete look, confident pose. CTA = koleksi + shop now.

Tech/Gadgets: Hook = unboxing sleek, LED glow. Problem = device lama lambat. Agitate = deadline terlewat karena tech fail. Discovery = gadget baru power on. Interaction = demo fitur, speed test. Result = productivity boost. CTA = specs + buy now.

Fitness/Health: Hook = impressive workout, body transformation tease. Problem = sedentary, out of breath. Agitate = baju tidak muat, energi rendah. Discovery = produk fitness reveal. Interaction = exercise demo, supplement usage. Result = body transformation, energi meningkat. CTA = membership offer.

General: Hook = product close-up intriguing. Problem = everyday frustration. Agitate = problem persisting. Discovery = product introduction. Interaction = hands-on usage. Result = problem solved. CTA = order today.

## 4.5 Kenapa HPAS Convert Tinggi

1. Pattern interrupt di scene 1 menghentikan scroll (video tanpa hook kehilangan 90% viewer dalam 2 detik).
2. Problem + Agitate membangun emotional tension — viewer MERASA perlu solusi.
3. Discovery timing perfect — produk muncul TEPAT saat viewer paling merasa butuh.
4. Social proof implicit dari Interaction scene — "orang lain pakai ini, aku juga bisa."
5. Result scene memberikan aspirational endpoint — viewer bisa membayangkan diri mereka di posisi itu.
6. CTA yang clear dan confident memudahkan konversi — tidak ada ambiguitas.

Video tanpa struktur (montage random, slideshow foto) rata-rata convert 0.5-1%. Video HPAS rata-rata convert 3-8% (data industry benchmark untuk short-form video ads).

# ════════════════════════════════════════════════════════════════════════
# PART 5 — PRICING & ECONOMICS
# ════════════════════════════════════════════════════════════════════════

## 5.1 Credit System

1 Credit = 10 Unit. User membeli Credit, yang otomatis dikonversi ke Unit. Setiap aksi mengonsumsi sejumlah Unit.

Kenapa pakai unit system (bukan langsung Rupiah): Fleksibilitas pricing. Jika COGS berubah (provider naikkan harga), kita bisa adjust unit cost tanpa mengubah harga paket. User tetap beli "15 credit Rp 249k" tapi di belakang layar 1 video mungkin berubah dari 3.5 unit ke 4.0 unit.

## 5.2 COGS Analysis (Semua Provider)

IMAGE PROVIDERS — Cost per generate:
Together.ai: $0.003 = Rp 48 (TERMURAH, priority 1)
SiliconFlow: $0.010 = Rp 160
SegMind: $0.010 = Rp 160
NVIDIA: $0.010 = Rp 160
HuggingFace: $0.010 = Rp 160
GeminiGen: $0.020 = Rp 320
PiAPI: $0.030 = Rp 480
Fal.ai: $0.030 = Rp 480
EvoLink: $0.030 = Rp 480
LaoZhang: $0.040 = Rp 640
Replicate: $0.050 = Rp 800 (TERMAHAL)
Google Gemini: FREE

VIDEO PROVIDERS — Cost per 5 detik clip:
SiliconFlow: $0.020 = Rp 320 (TERMURAH)
BytePlus: $0.025 = Rp 400 (PRIMARY)
LaoZhang: $0.030 = Rp 480
Hypereal: $0.030 = Rp 480
EvoLink: $0.030 = Rp 480
XAI Grok: $0.035 = Rp 560
Kie.ai: $0.035 = Rp 560
Fal.ai: $0.040 = Rp 640 (TERMAHAL API)
PiAPI Kling: $0.040 = Rp 640
Remotion: ~Rp 100 (local, server cost only)

OTHER:
Vision analysis: Rp 0 (Groq/Gemini free) — worst case Rp 300 (GPT-4o)
Script generation: Rp 0 (Groq/Gemini free) — worst case Rp 300
Face swap: Rp 80 (Kie.ai) — worst case Rp 800 (Replicate)
TTS: Rp 0 (Edge TTS free) — worst case Rp 200/scene (ElevenLabs)

COGS REALISTIC per produk (90% primary + 10% mid-tier fallback):
Image Set 7 scene: Rp 1.247
Video 15s (5 scene): Rp 2.531
Video 30s (7 scene): Rp 3.543
Video 60s (7 scene): Rp 5.839
Clone Style: Rp 200
Campaign 5 video: Rp 17.715
Campaign 10 video: Rp 35.430

## 5.3 Unit Cost per Aksi

Image Set 7 scene: 1.5 unit
Video 15s: 2.5 unit
Video 30s: 3.5 unit
Video 60s: 6.0 unit
Clone Style: 0.5 unit
Campaign 5 video: 15.0 unit (hemat 14% vs 5 × 3.5)
Campaign 10 video: 25.0 unit (hemat 29% vs 10 × 3.5)
Transfer P2P: 0 unit (gratis)

## 5.4 Paket Credit (5 Tier)

Coba Dulu: 1 credit (10 unit) — Rp 25.000 — Rp 2.500/unit
Starter: 5 credit (50 unit) — Rp 99.000 — Rp 1.980/unit — hemat 21%
Growth: 15 credit (150 unit) — Rp 249.000 — Rp 1.660/unit — hemat 34% — POPULER
Business: 50 credit (500 unit) — Rp 699.000 — Rp 1.398/unit — hemat 44%
Agency: 150 credit (1500 unit) — Rp 1.799.000 — Rp 1.199/unit — hemat 52%

## 5.5 Subscription Plans

Lite: Rp 149.000/bulan — 10 credit (100 unit) — priority queue
Pro: Rp 349.000/bulan — 30 credit (300 unit) — + Campaign, Clone, no watermark
Agency: Rp 799.000/bulan — 100 credit (1000 unit) — + white-label, batch, API, dedicated support

Tahunan hemat ~17%. Credit carry over (tidak hangus).

## 5.6 Margin Analysis

Formula: PRICE = COGS_realistic × 4 (target margin 300%)
After max affiliate (23%): margin still 200%+

Video 30s pada paket Growth (Rp 1.660/unit × 3.5 unit = Rp 5.810):
COGS realistic: Rp 3.543. Margin: 64% (Rp 2.267). After 23% affiliate: margin 26% (Rp 1.494).
Pada primary provider: COGS best Rp 3.136. Margin: 85%.

Video 30s pada paket Coba Dulu (Rp 2.500/unit × 3.5 unit = Rp 8.750):
COGS realistic: Rp 3.543. Margin: 147%. After 23% affiliate: margin 90%.

Image set pada paket Growth (Rp 1.660/unit × 1.5 unit = Rp 2.490):
COGS realistic: Rp 1.247. Margin: 100%. Pada primary: COGS Rp 896. Margin: 178%.

Clone pada paket Growth (Rp 1.660/unit × 0.5 unit = Rp 830):
COGS: Rp 200. Margin: 315%. Very profitable.

Kesimpulan: Platform TIDAK pernah rugi di level produk individual, bahkan pada worst case (paket termurah + video terpanjang + full affiliate 3 tier + fallback ke provider mahal). Margin terketat: ~26% pada video 30s paket Growth dengan full affiliate. Margin terlebar: 1000%+ pada clone/image dengan primary provider dan paket mahal.

## 5.7 Cost-Based Provider Routing

Rules yang di-enforce di provider router untuk melindungi margin:
- Max image cost: $0.03/image (Rp 480). Provider di atas ini (Replicate, LaoZhang) hanya digunakan jika semua yang lebih murah down.
- Max video cost: $0.04/5s (Rp 640). Provider di atas ini tidak digunakan.
- Campaign/bulk job: TIDAK boleh pakai Replicate. Max provider cost $0.03.
- Jika semua provider murah down: QUEUE request, jangan pakai provider mahal. Lebih baik user tunggu 5 menit daripada platform rugi.
- Exception: user Agency tier bisa pakai premium provider (mereka bayar cukup mahal).

## 5.8 Break-Even Analysis

Fixed cost bulanan (estimasi):
Server (VPS/cloud): Rp 500.000
Domain + CDN: Rp 100.000
Redis + DB: Rp 200.000
Monitoring (Sentry): Rp 0 (free tier)
Total fixed: Rp 800.000/bulan

Break-even: Jika average revenue per user Rp 99.000/bulan (1 paket Starter), butuh 9 paying user untuk cover fixed cost. Jika average Rp 249.000 (Growth), butuh 4 paying user.

Dengan 50 paying user × Rp 249.000 = Rp 12.450.000/bulan revenue. Minus COGS ~40% = Rp 4.980.000. Minus fixed Rp 800.000. Net profit: ~Rp 6.670.000/bulan.

## 5.9 Revenue Projection

Month 1: 10 users × Rp 99k avg = Rp 990k (break-even, learning)
Month 3: 50 users × Rp 149k avg = Rp 7.45M
Month 6: 200 users × Rp 199k avg = Rp 39.8M
Month 12: 500 users × Rp 249k avg = Rp 124.5M
Year 2: 2000 users × Rp 249k avg = Rp 498M/bulan

Affiliate revenue share at scale: 23% × Rp 498M = Rp 114.5M payout ke referrers. This is healthy — referrers menjadi sales force yang bisa dikelola.

# ════════════════════════════════════════════════════════════════════════
# PART 6 — AFFILIATE & REFERRAL SYSTEM
# ════════════════════════════════════════════════════════════════════════

## 6.1 Struktur Komisi 3 Tier

Tier 1 (langsung): 15% dari deposit. Kamu refer seseorang, dia deposit, kamu dapat 15%.
Tier 2 (level 2): 5% dari deposit. Orang yang kamu refer, refer orang lain, kamu dapat 5%.
Tier 3 (level 3): 3% dari deposit. 3 level deep, kamu dapat 3%.

Total max affiliate deduction per transaksi: 15% + 5% + 3% = 23%.

Komisi dihitung dari DEPOSIT (top up) user, BUKAN dari pemakaian credit. Komisi diberikan dalam bentuk CREDIT.

## 6.2 Syarat Aktivasi (Detail)

SYARAT 1 — AKUN AKTIF: User (referrer) harus punya history topup ATAU generate minimal 1x dalam 30 hari terakhir. Jika tidak ada aktivitas selama 30 hari berturut-turut, status komisi menjadi DITANGGUHKAN. Komisi yang sudah earned tidak hilang, tapi tidak bisa di-withdraw sampai user aktif kembali. Begitu user topup atau generate 1x, komisi langsung bisa diakses lagi. Check dilakukan oleh sistem setiap kali ada deposit downline masuk.

SYARAT 2 — TIDAK SELF-REFERRAL: Sistem mendeteksi otomatis berdasarkan device fingerprint (Telegram client info), IP address patterns, dan pola penggunaan waktu. Akun yang terdeteksi self-referral di-SUSPEND dari program referral secara PERMANEN. Contoh yang dilarang: membuat 2 akun Telegram untuk refer diri sendiri, minta teman daftar tapi sebenarnya kamu yang operasikan akunnya.

SYARAT 3 — AKUN TIDAK DI-BAN: User yang di-ban karena pelanggaran ToS (spam, abuse, NSFW content, fraud) tidak bisa menerima atau menarik komisi.

SYARAT 4 — DEPOSIT DOWNLINE VALID: Komisi dihitung dari deposit yang berhasil (status: paid/completed). Deposit gagal/dibatalkan/di-refund TIDAK dihitung.

## 6.3 Alur Komisi End-to-End

1. Referrer buka menu Referral, copy link unik (format: t.me/berkahkarya_saas_bot?start=ref_KODE)
2. Referrer share link ke target (WA, IG, TikTok, grup)
3. User baru (B) klik link → /start di bot → terikat sebagai Tier 1 downline referrer (A)
4. B deposit Rp 249.000 (Growth)
5. Payment webhook: sistem detect deposit sukses
6. Sistem cari referrer chain: B → A (Tier 1). A punya referrer? Jika ya → C (Tier 2). C punya referrer? Jika ya → D (Tier 3).
7. Hitung komisi: A (Tier 1) = 15% × Rp 249.000 = Rp 37.350. Cek A aktif 30 hari? Ya → catat komisi. Jika tidak → tangguhkan.
8. Komisi status "pending" (delay 7 hari — window untuk refund)
9. Setelah 7 hari tanpa refund: komisi status "available"
10. Setiap Senin pagi: sistem proses payout. Jika available >= Rp 50.000 → payout ke rekening/e-wallet. Atau user bisa pakai sebagai credit untuk generate.

## 6.4 Contoh Perhitungan (5 Skenario)

Skenario 1 — Sederhana: A refer B. B deposit Rp 249k. A dapat 15% = Rp 37.350 credit.

Skenario 2 — 2 Level: A refer B, B refer C. C deposit Rp 249k. B dapat Tier 1 15% = Rp 37.350. A dapat Tier 2 5% = Rp 12.450.

Skenario 3 — 3 Level: A refer B, B refer C, C refer D. D deposit Rp 249k. C → Tier 1 15% = Rp 37.350. B → Tier 2 5% = Rp 12.450. A → Tier 3 3% = Rp 7.470.

Skenario 4 — Volume: A refer 20 orang langsung. Semua deposit Growth Rp 249k. A Tier 1: 20 × Rp 37.350 = Rp 747.000 credit.

Skenario 5 — Full Network: A punya 20 Tier 1, masing-masing punya 5 Tier 2, masing-masing punya 3 Tier 3. Semua deposit Growth. A dapat: Tier 1: 20 × Rp 37.350 = Rp 747.000. Tier 2: 100 × Rp 12.450 = Rp 1.245.000. Tier 3: 300 × Rp 7.470 = Rp 2.241.000. Total per cycle: Rp 4.233.000. Jika semua deposit bulanan: Rp 4.2M/bulan passive income.

## 6.5 Payout Rules

Bentuk: Credit (bukan uang langsung). Bisa dipakai generate, transfer P2P, atau tarik tunai.
Tarik tunai minimum: Rp 50.000.
Jadwal payout: setiap hari Senin.
Metode payout: transfer ke rekening bank/e-wallet yang didaftarkan user.
Delay: 7 hari dari deposit downline.

## 6.6 Anti-Fraud Detection

Device fingerprint matching: jika 2 akun dari Telegram client yang sama, flag suspicious.
IP pattern analysis: jika referrer dan downline selalu akses dari IP yang sama, flag.
Timing analysis: jika deposit terjadi dalam hitungan detik setelah registrasi, dan pola berulang, flag.
Manual review: admin bisa review flagged accounts di dashboard.
Penalty: suspend dari program referral. Komisi pending dibatalkan. Akun bisa di-ban jika fraud repeated.

## 6.7 Affiliate Growth Strategy

Phase 1 (0-50 users): Founder (kamu) jadi referrer utama. DM UMKM langsung, buatkan demo video, share link. Target: 50 paying user dalam 2 bulan.

Phase 2 (50-200): Identifikasi top 5 power users yang paling sering generate. Approach mereka jadi "affiliate champion". Beri mereka affiliate kit (template caption, demo video, banner). Target: 200 users dalam 4 bulan.

Phase 3 (200-1000): Buat channel/grup komunitas OpenClaw di Telegram. Weekly sharing session: "Video terbaik minggu ini" + "Top referrer minggu ini." Gamification: leaderboard + bonus untuk top referrer. Target: 1000 users dalam 8 bulan.

Phase 4 (1000+): Paid acquisition via Meta Ads + TikTok Ads. Lookalike audience dari existing paying users. Retarget dari Meta CAPI data. Affiliate program organic growth paralel dengan paid. Target: 5000 users dalam 12 bulan.

# ════════════════════════════════════════════════════════════════════════
# PART 7 — PROVIDER INFRASTRUCTURE
# ════════════════════════════════════════════════════════════════════════

## 7.1-7.7 (Summary — detail sudah di Part 5.2 dan PATCH_INSTRUCTIONS)

22 provider total: 12 image, 10 video. Auto-failover via circuit breaker (3 fail = 60-180s timeout). Health check setiap 60 detik. Priority-based routing: cheapest first, expensive only as last resort. Cost-based routing rules prevent margin erosion. Provider health visible di Admin Dashboard.

# ════════════════════════════════════════════════════════════════════════
# PART 8 — RETENTION & ENGAGEMENT STRATEGY
# ════════════════════════════════════════════════════════════════════════

## 8.1 5 Tipe User yang Hilang

Tipe 1: Deposit tapi belum pakai. Tipe 2: Pakai gratis tapi belum deposit. Tipe 3: Pakai 1x lalu berhenti. Tipe 4: Aktif tapi tidak promosikan affiliate. Tipe 5: Churn 30+ hari.

## 8.2 Automated Trigger System

Tipe 1 triggers (deposit no use): 2 jam ("Credit masuk, yuk generate!"), 24 jam ("Sayang credit nganggur"), 72 jam (mini tutorial interaktif), 7 hari (pesan terakhir).

Tipe 2 triggers (free no deposit): 1 jam ("Paket cuma Rp 25k"), 24 jam (social proof showcase), 3 hari (first purchase discount Rp 79k → Rp 69k), 7 hari (pesan terakhir).

Tipe 3 triggers (use once stop): 3 hari ("Sudah di-post belum?"), 7 hari ("Tips: 3-5 video/minggu"), 14 hari ("Coba fitur Campaign"), 21 hari (diskon 50% 1 generate).

Tipe 4 triggers (active no affiliate): Generate ke-3 ("Tau gak bisa dapat credit gratis?"), ke-5 ("Share ke UMKM!"), ke-10 ("User lain dapat Rp 500k/bulan"), setiap rate 4-5 bintang ("Share ke teman?").

Tipe 5 triggers (churn): 30 hari (fitur baru + comeback discount), 60 hari (pesan terakhir + good luck). Setelah 60 hari STOP.

## 8.3 Gamification

Daily Streak: Generate setiap hari, streak naik. Reward: 3 hari +0.1 credit, 7 hari +0.3, 14 hari +0.5, 30 hari +1.0 + badge "Content Machine". Streak putus = reset.

Achievement Badges: First Timer, Video Creator (5 video), Content Machine (30 day streak), Style Master (semua 9 style), Campaign Pro, Clone Expert, Influencer (refer 5), Team Leader (3 level downline), Power User (100 generate), Loyal Customer (3 bulan aktif).

Weekly Leaderboard: Top 10 user by generate count. Top 3 bonus: 2.0 / 1.0 / 0.5 credit. Announce di channel komunitas.

## 8.4 Content Calendar

Opt-in weekly reminder setiap Senin 09:00 WIB: "Minggu baru, konten baru! Kirim foto produk terbaru." Builds HABIT — user jadi rutin generate mingguan. Bisa skip atau berhenti kapan saja.

## 8.5 Win-Back Campaign

30 hari inactive: info fitur baru + comeback discount (Starter Rp 69k vs Rp 99k). 60 hari: pesan terakhir, respect. Setelah 60 hari: STOP semua notif. Unsubscribe always available.

## 8.6 Anti-Spam Rules

Max 1 notif per kategori per 3 hari. Total max 2 bot-initiated messages per hari per user. Jika "Nanti Aja" 3x → reduce frequency. "Unsubscribe" → stop ALL automated. Jam kirim: 08:00-20:00 WIB only. Selalu ada tombol opt-out.

# ════════════════════════════════════════════════════════════════════════
# PART 9 — SCALE-UP STRATEGY
# ════════════════════════════════════════════════════════════════════════

## 9.1 Phase 1: First 50 Users (Bulan 1-2)

Objective: Validate product-market fit. Apakah UMKM benar-benar mau bayar untuk video AI?

Actions:
- Fix core flow sampai 10/10 foto menghasilkan output yang bagus
- DM 50 owner UMKM di Surabaya (kafe, salon, fashion, skincare)
- Buatkan 1 video GRATIS per UMKM → kirim hasilnya via WA
- Jika respons positif ("Wah bagus!") → tawarkan paket Coba Dulu Rp 25k
- Kumpulkan feedback: apa yang bagus, apa yang kurang, apa yang mereka mau
- Iterate product berdasarkan feedback nyata, bukan asumsi
- Target: 50 paying user, 5 yang repeat purchase

KPI: Conversion rate DM → paying user (target >10%). Repeat rate (target >30% beli lagi dalam 30 hari).

## 9.2 Phase 2: Product-Market Fit (Bulan 3-4)

Objective: Confirm PMF. Jika 40%+ user beli lagi tanpa diminta, PMF confirmed.

Actions:
- Analyze data 50 user pertama: niche apa yang paling banyak, durasi apa yang paling populer, mode apa yang paling dipakai
- Double down di niche winning (misal: ternyata 60% user dari F&B → buat template F&B lebih detail)
- Launch referral program untuk 50 user pertama
- Minta 10 user paling puas jadi testimonial (screenshot chat mereka bilang "bagus")
- Before/after showcase: kumpulkan 20 contoh (foto asli → output OpenClaw)
- Launch landing page berkahkarya.org dengan showcase + pricing
- Target: 200 users total, 50% organic dari referral

KPI: NPS score >40. CAC (Customer Acquisition Cost) < Rp 50k. LTV > Rp 500k.

## 9.3 Phase 3: Growth (Bulan 5-8)

Objective: Scale acquisition. Product sudah proven, saatnya memperbesar funnel.

Actions:
- Launch paid ads: Meta Ads targeting UMKM Indonesia, custom audience dari Meta CAPI data
- TikTok Ads: demo video "Kirim foto → dapat video" format native TikTok
- Content marketing: post showcase video di TikTok/IG akun OpenClaw sendiri (3x/minggu)
- Partnership: approach platform UMKM (Tokopedia Seller Center, Shopee Seller, GoFood merchant)
- Launch subscription plans (recurring revenue)
- Implement gamification (streak, badges, leaderboard)
- Implement retention automation (5 worker types)
- Target: 500 users, 200 subscribers

KPI: MRR > Rp 50M. Churn rate < 10%. Organic:Paid ratio 60:40.

## 9.4 Phase 4: Scale (Bulan 9-12)

Objective: Operasional efficiency dan revenue maximization.

Actions:
- Hire 1 customer success person (handle support, onboarding, community)
- Hire 1 content creator (buat showcase, demo, tutorial)
- Launch API untuk agency tier (mereka integrate ke workflow mereka)
- Launch white-label option untuk agency (mereka branding sendiri)
- Geographic expansion: Malaysia (bahasa Melayu sudah didukung), Thailand, Vietnam
- Advanced features: LoRA training (custom model per brand), face swap two-pass
- Target: 2000 users, 500 subscribers

KPI: MRR > Rp 200M. Revenue per employee > Rp 50M. Churn < 5%.

## 9.5 Phase 5: Expansion (Tahun 2)

Objective: Menjadi platform default untuk UMKM video ads di Asia Tenggara.

Actions:
- Series A fundraising (jika dibutuhkan)
- Multi-country launch: SEA 6 countries
- Enterprise tier: large agencies, brand corporates
- AI improvements: real-time video, live stream graphics, multi-language VO
- Marketplace: user bisa jual template/style ke user lain
- Target: 10.000+ users, Rp 1B+ MRR

## 9.6 Key Metrics per Phase

Phase 1: User count, conversion rate, feedback quality
Phase 2: Repeat rate, NPS, referral rate, CAC, LTV
Phase 3: MRR, churn rate, organic ratio, subscriber count
Phase 4: Revenue per employee, ARPU, expansion metrics
Phase 5: Market share, multi-country metrics, enterprise contracts

## 9.7 Hiring Roadmap

Month 1-4: Solo founder (kamu). Semua: dev, sales, support, content.
Month 5-6: Hire 1 freelance CS (part-time, Rp 2-3M/bulan). Handle support chat.
Month 7-8: Hire 1 content creator (part-time, Rp 3-5M). Buat showcase, demo.
Month 9-12: Hire 1 full-time developer (Rp 8-15M). Scale tech.
Year 2: Hire marketing lead, hire 2nd developer, hire ops manager.

## 9.8 Tech Scaling

0-500 users: Single VPS (4GB RAM, 2 vCPU). Redis + PostgreSQL on same server. Queue: BullMQ with 2 workers.

500-2000 users: Upgrade to 8GB RAM, 4 vCPU. Separate Redis server. Add read replica for DB. Queue: 4-6 workers. Add CDN for video delivery (Cloudflare).

2000-10000 users: Multi-server setup. Load balancer (Nginx). Dedicated DB server. Dedicated Redis cluster. Queue: 8-12 workers on separate server. Multiple bot instances (Telegram webhook mode). Video storage: S3-compatible (Cloudflare R2 or AWS S3).

# ════════════════════════════════════════════════════════════════════════
# PART 10 — ADMIN & OPERATIONS
# ════════════════════════════════════════════════════════════════════════

## 10.1 Admin Dashboard

URL khusus admin. Login credentials. Halaman: Overview (users total/active, MRR, revenue, queue depth, alerts), User Management (search/filter, ban/unban, adjust credit), Revenue (chart, breakdown, COGS, margin, affiliate payout, refund), Provider Health (status, success rate, latency, circuit breaker), Queue Monitor (video/payment/notification status), Content Moderation (flagged content, reports), Analytics (funnel, retention, churn, NPS, top niches, top referrers), Settings (pricing, feature flags, provider config, maintenance mode).

## 10.2 Daily Operations Checklist

1. Check provider health dashboard — semua provider hijau?
2. Check queue — ada yang stuck? Video queue depth normal?
3. Check payment — semua pembayaran ter-proses?
4. Check support chat — ada tiket pending?
5. Check revenue dashboard — revenue hari ini vs target?

## 10.3 Weekly Operations

1. Review top 10 user by generate count — siapa power user?
2. Process affiliate payout (Senin)
3. Review flagged content / moderation queue
4. Publish weekly leaderboard ke komunitas
5. Review churn: siapa yang hilang minggu ini? Kenapa?

## 10.4 Monthly Operations

1. Revenue report: MRR, growth rate, COGS ratio, margin trend
2. Provider cost analysis: mana yang semakin mahal? Perlu ganti priority?
3. User cohort analysis: retention D7, D30 per cohort
4. NPS survey ke 20 random active users
5. Feature planning: apa yang paling diminta user?
6. Pricing review: masih aman? Perlu adjust?

## 10.5 Incident Response

Provider down: Alert otomatis via Telegram ke admin. Circuit breaker handle auto. Jika semua down >5 menit → post di channel komunitas "Sedang ada maintenance."

Payment stuck: Cek dashboard payment. Manual credit jika bukti jelas. Prioritas: resolve dalam 2 jam.

Bot crash: PM2/Docker auto-restart. Jika repeated crash → cek error log → hotfix. Inform user di channel.

## 10.6 Content Moderation

Auto-detection: NSFW filter on uploaded images (Gemini Vision). Celebrity face detection. Flagged content masuk moderation queue. Admin approve/reject. Repeated violations → user warning → ban.

# ════════════════════════════════════════════════════════════════════════
# PART 11 — DEVELOPER GUIDE
# ════════════════════════════════════════════════════════════════════════

## 11.1 Architecture Overview

Stack: Node.js 20 + TypeScript. Bot: Telegraf v4.15. Database: PostgreSQL via Prisma v5.7. Queue: BullMQ + Redis. Server: Fastify (webhooks, dashboard API). Monitoring: Winston (logging) + Sentry (errors).

## 11.2 File Structure

src/commands/ — Bot command handlers (start, create-v3, topup, profile, referral, etc)
src/config/ — Configuration (providers, prompt-engine, hpas-engine, pricing-v3, queue, redis)
src/handlers/ — Telegram event handlers (callback, message, cb-creation-v3)
src/services/ — Business logic (image, video, video-fallback, user, payment, circuit-breaker, content-analysis, meta-capi, etc)
src/types/ — TypeScript type definitions
src/utils/ — Utilities (logger, errors)
src/workers/ — Background job workers (retention, engagement, affiliate)
prisma/ — Database schema and migrations

## 11.3-11.7 (Lihat PATCH_INSTRUCTIONS.md dan file sebelumnya)

Meta CAPI: 14 events. Database: 12+ models. Queue: BullMQ dengan 5+ job types. Environment: 50+ env vars untuk providers, payment, Meta CAPI.

# ════════════════════════════════════════════════════════════════════════
# PART 12 — LANDING PAGE
# ════════════════════════════════════════════════════════════════════════

## 12.1 Page Structure

Hero → Problem → Solution → HPAS Framework Visual → 4 Features → 3 Modes → Pricing (5 credit + 3 subscription) → Social Proof (counters + showcase) → Affiliate Section → FAQ → Footer.

## 12.2 Copy & Messaging

Hero headline: "Ubah 1 Foto Produk Jadi Video Iklan Profesional dalam 60 Detik"
Hero sub: "Vilona OpenClaw SaaS — Platform AI untuk UMKM Indonesia"
Hero CTA: "Coba Gratis Sekarang" → t.me/berkahkarya_saas_bot

Problem: "UMKM butuh video iklan tapi: tidak punya skill editing, tidak punya budget agency Rp 500k-5jt per video, tidak punya waktu belajar tools rumit."

Solution: "OpenClaw: Kirim foto ke Telegram bot → terima video iklan 60 detik. Mulai Rp 25.000. Tanpa skill. Tanpa agency."

Affiliate CTA: "Dapatkan 15% komisi dari setiap deposit. 3 level deep. Passive income dari Telegram."

## 12.3 SEO Strategy

Target keywords: "buat video iklan AI", "video iklan UMKM", "AI video generator Indonesia", "buat iklan TikTok otomatis", "video ads murah."
Meta description: "Ubah foto produk jadi video iklan profesional dalam 60 detik. Platform AI untuk UMKM Indonesia. Mulai Rp 25.000."
Schema markup: Product, FAQPage, Organization.
Blog content: tutorial "Cara bikin video TikTok yang convert" + showcase.

# ════════════════════════════════════════════════════════════════════════
# PART 13 — ERROR HANDLING & EDGE CASES
# ════════════════════════════════════════════════════════════════════════

## 13.1 Generate Failures

1. Provider primary down: auto-switch (user tidak tahu). 12 fallback image, 9 fallback video.
2. Semua provider down: queue + retry 2 min + credit tidak dipotong + user notif + admin alert.
3. Foto blur/gelap: AI reject + tips + credit tidak dipotong.
4. Quality rendah (score <6/10): hasil dikirim + retry gratis 1x.
5. Timeout >3 min: background queue + notif saat selesai + refund jika gagal.
6. Campaign 1 video gagal: 4 dikirim + video gagal retry + refund proporsional jika gagal.

## 13.2 Payment Failures

1. QRIS expired: generate ulang. 2. Transfer pending: tunggu 15 min, hubungi admin. 3. Double payment: admin credit-kan. 4. Crypto pending: tunggu blockchain confirm.

## 13.3 Referral Failures

1. Komisi tidak masuk: cek aktif 30 hari, cek deposit paid, delay 7 hari. 2. Ditangguhkan: reaktivasi via topup/generate. 3. Link error: generate baru. 4. Downline refund: komisi dibatalkan.

## 13.4 Transfer P2P Failures

1. User tidak ditemukan: cek username. 2. Saldo kurang: topup dulu. 3. User banned: tolak.

## 13.5 Bot Failures

1. Bot tidak respons: restart otomatis (PM2/Docker), tunggu 1-2 min. 2. Session lost: /start ulang, data utama di DB aman. 3. Webhook error: auto-retry Telegram.

# ════════════════════════════════════════════════════════════════════════
# PART 14 — FAQ (40 PERTANYAAN)
# ════════════════════════════════════════════════════════════════════════

Q1: Apa itu OpenClaw? A: Telegram bot yang ubah foto produk jadi image/video iklan profesional pakai AI.
Q2: Bot-nya dimana? A: @berkahkarya_saas_bot di Telegram.
Q3: Perlu install app? A: Tidak, 100% di Telegram.
Q4: Bahasa apa saja? A: 24 bahasa.
Q5: Berapa lama generate? A: Image 30-45 detik, Video 60-120 detik, Campaign 5-10 menit.
Q6: Bonus gratis? A: 1x image GRATIS saat pertama daftar. Sekali saja.
Q7: Credit kedaluwarsa? A: Tidak, selama akun aktif.
Q8: Metode bayar? A: QRIS, Transfer Bank, Crypto, Telegram Stars.
Q9: Payment belum masuk? A: QRIS instant, transfer max 15 min, hubungi @codergaboets.
Q10: Refund? A: Generate gagal = auto-refund. Pembelian = hubungi admin 24 jam.
Q11: Transfer credit? A: Ya, P2P, min 0.5 credit, gratis.
Q12: Foto yang bagus? A: Jelas, cahaya bagus, background simple, min 720px.
Q13: Hasil jelek? A: Retry gratis 1x. Coba foto lebih bagus.
Q14: Post ke TikTok/IG? A: Ya, PostBridge auto-post.
Q15: Beda Clone vs Generate? A: Generate = AI pilih gaya. Clone = kamu tentukan dari referensi.
Q16: Beda Basic/Smart/Pro? A: Basic auto, Smart preset, Pro full control.
Q17: Campaign itu apa? A: 5-10 video hook berbeda untuk A/B testing.
Q18: Komisi referral? A: Tier 1 15%, Tier 2 5%, Tier 3 3%. Credit dari deposit.
Q19: Komisi selamanya? A: Ya, selama aktif (min 1 topup/generate per 30 hari).
Q20: Tidak aktif 30 hari? A: Komisi ditangguhkan. Aktif lagi = komisi kembali.
Q21: Self-referral? A: Tidak boleh. Deteksi otomatis, sanksi permanen.
Q22: Kapan tarik komisi? A: 7 hari setelah deposit downline, min Rp 50k, Senin.
Q23: Komisi bisa generate? A: Ya, credit bisa generate, transfer, atau tarik tunai.
Q24: Provider AI? A: 22 provider, auto-failover.
Q25: Data aman? A: Foto dihapus 30 hari. Tidak simpan data kartu.
Q26: HP biasa bisa? A: Ya, install Telegram (gratis).
Q27: API developer? A: Ya, paket Agency subscription.
Q28: Web dashboard? A: Ya, tap Dashboard di bot.
Q29: Limit per hari? A: Sesuai credit. Free tier 3/hari.
Q30: Watermark? A: Free/Lite ada watermark. Pro/Agency no watermark.
Q31: Cancel subscription? A: Kapan saja. Berlaku sampai akhir periode. Credit tidak hilang.
Q32: Bisa batch? A: Ya, Campaign 5-10 video.
Q33: HPAS itu apa? A: Framework narasi iklan 7 scene: Hook-Problem-Agitate-Solution + Discovery-Interaction-CTA.
Q34: Kenapa video HPAS lebih bagus? A: Struktur emosional yang proven convert 3-8% vs video random 0.5-1%.
Q35: Bisa custom script? A: Ya, di mode Pro edit setiap scene.
Q36: Bisa multi-platform? A: Ya, generate TikTok lalu generate ulang untuk YouTube.
Q37: Ada free trial harian? A: Tidak. Bonus 1x image saat daftar saja.
Q38: Bisa pakai deskripsi tanpa foto? A: Ya, ketik deskripsi produk, AI generate dari text.
Q39: Support 24 jam? A: Admin @codergaboets Senin-Sabtu 09:00-21:00 WIB.
Q40: Dimana website-nya? A: berkahkarya.org.

# ════════════════════════════════════════════════════════════════════════
# PART 15 — CHANGELOG & ROADMAP
# ════════════════════════════════════════════════════════════════════════

## v3.0.0 (Maret 2026) — Current Release

Fitur baru: 3 mode (Basic/Smart/Pro), HPAS 7-scene engine, Clone Style, Campaign Builder, Transfer P2P, Referral 3 tier (15/5/3%), Meta CAPI 14 events, Credit system (1=10 unit), 5 paket credit, 3 subscription, User Dashboard, Admin Dashboard, Landing page, Bonus 1x image gratis, 22 provider auto-failover, cost-based routing, retention automation, gamification.

Perbaikan: Unified workflow, prompt library connected, clone connected to img2img, pricing unified, auto-refund on failure, full error handling.

## Roadmap

Q2 2026: Before/after showcase system, affiliate kit distribution, first 50 users, landing page launch.
Q3 2026: Paid ads (Meta + TikTok), subscription launch, gamification, 200 users target.
Q4 2026: API for agencies, white-label, Malaysia expansion, 500 users target.
Q1 2027: Enterprise tier, LoRA training, multi-country, 2000 users target.
Q2 2027: Marketplace (user jual template), real-time video, 5000 users target.

# ════════════════════════════════════════════════════════════════════════
# END OF DOCUMENT
# ════════════════════════════════════════════════════════════════════════

Dokumen terakhir diperbarui: 27 Maret 2026
Vilona OpenClaw SaaS v3.0.0
BerkahKarya — berkahkarya.org
Bot: @berkahkarya_saas_bot
Admin: @codergaboets (Telegram)
