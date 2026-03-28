# 👥 Sistem Affiliate & Referral - OpenClaw SaaS Bot

Sistem komisi Affiliate dan Referral merupakan salah satu ekosistem inti pada OpenClaw SaaS Bot untuk memperbesar *user acquisition* secara organik. Berikut adalah detail lengkap mengenai sistem affiliate dari dokumentasi internal bot:

## 1. Skema Komisi (2-Tier Affiliate)
Dalam sistem terdapat mekanisme *multi-level commission* (2 tingkat):
- **Tier 1 (Direct Referral):** Komisi **10%** hingga **15%** dari nilai transaksi / top-up *downline* secara langsung.
- **Tier 2 (Indirect Referral):** Komisi **5%** dari nilai transaksi / top-up *downline* lapis kedua.

> **Catatan Aturan Berlaku:** 
> - Dokumen spesifikasi harga (`SaaS_Bot_Credit_Pricing_Scheme.md`) mencantumkan bahwa *Activity Window* atau komisi/cookies berlaku selama **30 Hari** sejak *New User* mendaftar.
> - Batas Pencairan Minimum (*Payout Threshold*): 
>   - **Tier 1:** Rp 50.000
>   - **Tier 2:** Rp 100.000

## 2. Format Kode Referral
Kode Referral digenerate otomatis menggunakan karakter jelas (tanpa karakter membingungkan seperti 0, O, 1, atau I) dengan himpunan `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`:
- **Format:** `REF-{username}-{random4}`
- **Contoh:** `REF-JOHNDOE-X7K9`
- **Link URL Login:** Parameter URL menggunakan rujukan unik, misal: `?start=ref_X7K9`

## 3. Cara Kerja & Workflow
1. User memanggil *command* `/referral` pada antarmuka Telegram Bot.
2. Bot akan menampilkan Tautan Unik Rujukan (Referral Code / Link).
3. Marketer/user membagikan *link* *referral* mereka.
4. Pengguna baru (New User) mendaftar menggunakan *link* yang diteruskan.
5. Setiap pengguna baru tersebut (Tier 1) melakukan bayar/Top-Up, pemilik refferal akan langsung menerima komisi **15% / 10%**. Jika pengguna baru itu mengajak orang lain lagi (Tier 2), pemilik *link* pertama tetap menerima passive income **5%** dari pembelanjaan lapis kedua mereka.
6. Afiliator dapat melacak total akumulasi *Commission Earned* langsung dari dashboard Referral via bot.

## 4. Gamifikasi (Bonus Referral)
Untuk memacu semangat affiliator, sistem OpenClaw memiliki skema insentif tambahan (*Gamification*):

**A. Hadiah Pencapaian (Milestones):**
- Tembus 10 Referral Pertama: +5 AI credits
- Tembus 50 Referral Pertama: +20 AI credits
- Tembus 100 Referral Pertama: +50 AI credits + Gratis *Agency tier* selama 1 bulan

**B. Leaderboard Afiliator (Periode Bulanan):**
- Rank 1: Hadiah 50 credits + Pro tier 1 bulan
- Rank 2: Hadiah 30 credits
- Rank 3: Hadiah 15 credits

## 5. Proteksi Fraud & Keamanan (Anti-Fraud)
Sistem memiliki kontrol bawaan (`affiliate_fraud` indicators) untuk menghindari *abuse* dari pengguna yang memanipulasi pendaftaran atau pembayaran palsu.
- **Indikator Deteksi Kecurangan:** Registrasi akun palsu (*fake accounts*), mereferensikan diri sendiri dengan 2 akun berbeda (*self referral*), *multiple accounts same device*, atau top-up tanpa *usage* kredit.
- **Tindak Lanjut Server (Action):**
  1. Melabeli tanda merah (*Flag for review*).
  2. Melakukan *Commission hold* (Penahanan aliran komisi sementara) untuk diselidiki.
- **Tindak Pencairan Ekstra:** Untuk keamanan finansial, jika ada penarikan komisi (*withdrawal*) bernilai tinggi (> Rp 1.000.000), sistem *webhook* secara otomatis melakukan trigger eskalasi yang mewajibkan `require_human_approval` (persetujuan admin manual).
