# 💸 Skema Harga Jual & Sistem Kredit (OpenClaw SaaS Bot)

Dokumen ini membedah secara lengkap sistem ekonomi atau monetisasi yang berjalan di dalam bot, mulai dari harga pembelian kredit oleh *User* hingga bagaimana kredit tersebut dihabiskan *(Burn Rate)*. Seluruh data ini diekstraksi dari pengaturan aktual di `src/config/pricing.ts`.

---

## 1. Harga Pembelian Kredit (Top-Up / Paket)

Sistem bot menggunakan _Credit_ sebagai mata uang virtual. Pengguna bisa mendapatkan _Credit_ melalui 3 jalur: Beli Eceran, Beli Paket (Bulk), atau Berlangganan (Subscription).

### A. Harga Eceran (Extra Credit)
Jika _user_ hanya ingin menambah sedikit kredit di luar paket:
* **Standar (Non-Subscriber):** Rp 20.000 / 1 Kredit
* **VIP (Subscriber):** Rp 10.000 / 1 Kredit *(Diskon 50%)*

### B. Paket Top-up Bundling (Bonus System)
Sistem memanipulasi rentang harga agar pengguna lebih memilih beli secara _bulk_ sekaligus.
* **📦 Starter Flow**
  * Harga: **Rp 49.000**
  * Total Didapat: **6 Kredit** (5 Dasar + 1 Bonus)
  * Harga Asli per Kredit: **~Rp 8.166**
* **📦 Growth Machine (Paling Populer)**
  * Harga: **Rp 149.000**
  * Total Didapat: **22 Kredit** (18 Dasar + 4 Bonus)
  * Harga Asli per Kredit: **~Rp 6.772**
* **📦 Business Kingdom**
  * Harga: **Rp 499.000**
  * Total Didapat: **85 Kredit** (70 Dasar + 15 Bonus)
  * Harga Asli per Kredit: **~Rp 5.870**

### C. Langganan Bulanan (Subscription Tiers)
Jalur *recurring revenue* utama bagi pemilik bot (SaaS). *Subscriber* juga mendapatkan akses antrean prioritas dan diskon kredit eceran.
* **⭐ LITE Tier**
  * Harga: **Rp 99.000 / bulan** (Atau Rp 990.000 / tahun)
  * Total Didapat: **20 Kredit**
  * Harga Asli per Kredit: **Rp 4.950**
  * Limit Harian: 3 Video
  * Perks: Priority queue (1.5x)
* **⭐⭐ PRO Tier**
  * Harga: **Rp 199.000 / bulan** (Atau Rp 1.990.000 / tahun)
  * Total Didapat: **50 Kredit**
  * Harga Asli per Kredit: **Rp 3.980**
  * Limit Harian: 10 Video
  * Perks: Semua format, 3 Style variants, Priority queue (2x)
* **⭐⭐⭐ AGENCY Tier**
  * Harga: **Rp 499.000 / bulan** (Atau Rp 4.990.000 / tahun)
  * Total Didapat: **150 Kredit**
  * Harga Asli per Kredit: **Rp 3.326**
  * Limit Harian: 30 Video
  * Perks: White-label, API Access, Priority queue (3x), Bulk generation (20 files)

---

## 2. Pengeluaran Kredit (Burn Rate)

Setelah _user_ memiliki saldo kredit, berikut adalah aturan pemotongan saldo saat mereka mencetak aset AI.

### A. Video Generation Cost (Berdasarkan Durasi)
Aturan dasar (Base Rule): Semakin panjang durasi, semakin eksponensial biaya potongannya, karena ini memakan _GPU Compute_ API yang lebih lama.
* **Video 5 Detik:** Dipotong **0.2 Kredit**
* **Video 10 Detik:** Dipotong **0.4 Kredit**
* **Video 15 Detik:** Dipotong **0.5 Kredit**
* **Video 20 Detik:** Dipotong **0.7 Kredit**
* **Video 25 Detik:** Dipotong **0.9 Kredit**
* **Video 30 Detik:** Dipotong **1.0 Kredit**
* **Video 40 Detik:** Dipotong **1.4 Kredit**
* **Video 60 Detik:** Dipotong **2.0 Kredit**

> *Formula Hardcoded Cadangan:* Jika durasi aneh dimasukkan, bot menghitung: `Durasi/5 * (2.0/12)` yang dibulatkan.

### B. Image Generation Cost
* **Generate 1 Gambar Biasa:** Biasanya dipotong **0.1 Kredit** 
*(Hal ini karena biaya modal (base-cost) _Text-to-Image_ jauh lebih murah dibandingkan _Video_).*

---

## 3. Skema Komisi (Affiliate & Referral System)

Sistem juga mendistribusikan uang kembali ke pengguna dalam bentuk komisi untuk memperbesar _user acquisition_ organik.
* **Direct Referral (Tier 1):** Komisi **15%** dari nilai top-up *downline* langsung.
* **Indirect Referral (Tier 2):** Komisi **5%** dari nilai top-up *downline* lapis kedua.
* **Activity Window:** Komisi / _Cookies_ berlaku selama **30 Hari** sejak *New User* mendaftar.

---

## 4. Analisis & Identifikasi Celah Harga (Vulnerability Warning)

Jika membandingkan *Harga Beli Kredit Termurah User* (Agency: Rp 3.326/Kredit) dengan *Harga Modal Server Asli*:
1. **Titik Bahaya (Video 5 Detik):** 
   - User Agency membuat video 5 detik. Dia dipotong 0.2 kredit. Nilai uangnya: `0.2 x Rp 3.326 = Rp 665`.
   - Sementara "Modal API" untuk video pendek 5 detik (terutama ke *GeminiGen*) bisa memakan dana hingga **~Rp 1.600 - 2.400**.
   - **Status: RUGI/BONCOS.** Bot mensubsidi kerugian sekitar Rp 1.000 per video 5 detik dari user khusus *Agency*.
2. **Titik Menguntungkan (Video 60 Detik):**
   - User dibuatkan video 60 detik. Dipotong 2.0 kredit. Nilai uangnya: `2.0 x Rp 5.870 (Rata-rata) = Rp 11.740`.
   - Modal server video panjang (misal ~Rp 4.000 - 6.000).
   - **Status: PROFIT.** 

**Rekomendasi Perbaikan Code (Actionable Advice):**
Segera masuk ke file `src/config/pricing.ts` baris 34-35 `VIDEO_CREDIT_COSTS` dan naikkan tarif eksekusi durasi terpendek:
- Ubah `5: 0.2` menjadi minimal `5: 0.4` atau `0.5` kredit.
- Strategi ini akan menambal potensi "Bakar Uang" jika seorang user Agency melakukan _spam_ permintaan video pendek 5 detik.
