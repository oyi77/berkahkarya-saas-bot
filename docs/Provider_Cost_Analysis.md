# 💰 Analisis Harga Modal (Base Cost) API Provider
*Estimasi Konversi: 1 USD = Rp 16.000*

Berdasarkan *source code* yang ada di `image.service.ts`, `video-generation.service.ts`, dan `content-analysis.service.ts`, bot OpenClaw menggunakan skema _Smart Routing_ atau *Fallback Chain* berdasarkan tier harga dan kemampuan provider.

Berikut adalah rincian "Harga Modal" untuk masing-masing provider:

---

## 🖼️ 1. Image Generation (Text-to-Image, Img2Img, IP-Adapter)
Provider yang digunakan telah diurutkan dari yang termurah hingga termahal untuk efisiensi modal *(Cost-Efficiency Strategy)*.

| Tier | Provider & Model | Tipe Output | Est. Cost (USD) | Est. Harga Modal (IDR) |
|---|---|---|---|---|
| 1 | **Together.ai** (FLUX.1 Schnell) | Text-to-Image | $0.003 / image | **Rp 48** / gambar |
| 1 | **SiliconFlow** (FLUX.1 Schnell) | Text-to-Image | $0.003 / image | **Rp 48** / gambar |
| 2 | **SegMind** (SDXL) | Img2Img | $0.005 / image | **Rp 80** / gambar |
| 2 | **NVIDIA** (SDXL) | Text-to-Image | $0.010 / image | **Rp 160** / gambar |
| 3 | **SegMind** (Flux IP-Adapter) | Avatar Control | $0.010 / image | **Rp 160** / gambar |
| 4 | **PiAPI** (Flux Dev) | Text-to-Image / Img2Img | ~$0.020 / image | **Rp 320** / gambar |
| 5 | **Google Gemini** (Flash Image) | Text-to-Image / Img2Img | $0.030 / image | **Rp 480** / gambar |
| 5 | **Fal.ai** (Flux Dev) | High-Quality All Modes | $0.030 / image | **Rp 480** / gambar |
| 5 | **EvoLink** (Wan2.5 / Qwen) | Img2Img | ~$0.030 / image | **Rp 480** / gambar |
| 6 | **LaoZhang** (Kontext / DALL-E 3) | Img2Img / DALL-E | $0.040 - $0.050 | **Rp 640 - Rp 800** |

Rata-rata modal pembuatan 1 Gambar AI berkisar di antara **Rp 48 - Rp 480**, tergantung tipe kerumitan (apakah sekadar teks, atau butuh referensi Avatar).

---

## 🎬 2. Video Generation (Text-to-Video / Image-to-Video)
Untuk video, beban server dan waktu *rendering* GPU lebih berat, sehingga *base cost* jauh lebih tinggi daripada gambar.

| Prioritas | Provider & Model | Durasi Standard | Est. Cost (USD) | Est. Harga Modal (IDR) |
|---|---|---|---|---|
| **Primary** | **GeminiGen** (Grok-3 / video-gen) | 5 detik | ~$0.10 - $0.15 | **Rp 1.600 - Rp 2.400** / video |
| **Fallback** | **BytePlus** (Seedance lite) via AIML | 5 detik | ~$0.05 - $0.10 | **Rp 800 - Rp 1.600** / video |

> *Catatan: Semakin panjang durasi (contoh: 15 detik), biasanya API Video akan men-charge *multiplier* 2x hingga 3x lipat. Modal untuk video 15 detik bisa mencapai **Rp 4.800**.*

---

## 🧠 3. Content Analysis & Vision LLM
Digunakan untuk mengekstrak *prompt*, membedah video orang lain (Clone), dan *Storyboard generation*.

| Provider & Model | Fungsi | Est. Input (Tokens/Bites) | Est. Harga Modal (IDR) |
|---|---|---|---|
| **Google Gemini Vision** (2.5 Flash) | Image Analysis (Extract) | 1 Image + 200 tokens | **~Rp 1,6** / proses |
| **Google Gemini Vision** (2.5 Flash) | Video Analysis (Clone/Storyboard) | Video singkat + 1K tokens | **~Rp 2,5 - Rp 5** / proses |

Biaya ekstraksi _prompt_ sangat **murah dan hampir gratis/negligible** dibandingkan pembuatan video/gambar itu sendiri.

---

## 📊 Kesimpulan Margin & Saran Penetapan Harga Jual

1. **Jalur Generate Image Termurah:** Menggunakan Together.ai (Rp 48/gambar).
2. **Jalur Generate Video Termurah:** Menggunakan BytePlus/Seedance (Rp 800/video 5s).
3. **Saran Jual Kredit:**
   Jika 1 Kredit dihargai **Rp 1.000** (misal paket 50rb per 50 credit):
   * Generate Gambar (Cost: 0,1 credit / potong Rp 100). Modal Anda: Rp 48. **Margin Untung: 108%**
   * Generate Video 5s (Cost: 1,0 credit / potong Rp 1.000). Modal Anda: Byteplus (Rp 800). **Margin Untung: 25%** (Tapi bila masuk prioritas GeminiGen Rp 1.600, Anda berpotensi *rugi/bakar uang* jika dijual Rp 1.000).

Oleh karena itu, sebaiknya:
- Pastikan Fallback Video di-*balance* (BytePlus untuk Free/Basic, GeminiGen untuk PRO/Premium).
- Harga jual 1 kredit sebaiknya dinaikkan mendekati **Rp 2.000** - **Rp 3.000**, ATAU biaya Video 5s di-*markup* menjadi minimal 2 Kredit untuk mengcover server lokal dan *gateway payment fees*.
