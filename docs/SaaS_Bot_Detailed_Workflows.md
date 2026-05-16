# 🤖 Detail Alur Kerja (Workflow) Per-Fitur: OpenClaw SaaS Bot

Dokumen ini membedah alur interaksi pengguna (End-to-End User Journey) secara mendetail untuk setiap fitur utama di dalam OpenClaw SaaS Bot.

---

## 1. Fitur Pembuatan Video (Creation Flow)
*Proses pengguna merubah imajinasi atau foto menjadi video promosi AI.*

**Trigger:** User memanggil `/create` atau menekan tombol **"🎬 Buat Video Baru"**.
1. **[Bot]** Menampilkan menu sumber pembuatan: Foto Produk, Teks/Script, Foto+Teks, atau Clone Gaya.
2. **[User]** Memilih sumber, misalnya: **"📸 Foto Produk"**.
3. **[Bot]** Menginstruksikan user untuk mengirimkan foto produknya.
4. **[User]** Mengupload gambar (jpg/png) di *chat*.
5. **[Bot]** Merespons dengan *"✅ Foto diterima!"* dan menawarkan opsi: Lanjut atau Tambah Foto.
6. **[User]** Menekan **"➡️ Lanjut"**.
7. **[Bot]** Meminta user memilih Tipe Output: Video Penuh, Image Only, atau Kombinasi (Hybrid).
8. **[User]** Memilih "Video Penuh".
9. **[Bot]** Menampilkan **Kategori / Niche** (F&B, Fashion, Tech, Health, Travel, dll).
10. **[User]** Memilih kategori.
11. **[Bot]** Menampilkan list spesifik tipe **Template** beserta perkiraan biaya kreditnya (misal: 💡 *Steam & Zoom Drama - 1.0 Credit*).
12. **[User]** Memilih Template.
13. **[Bot]** Menampilkan **Preview & Konfirmasi Pesanan**. Memeriksa apakah Saldo Kredit user mencukupi.
14. **[User]** Menekan **"🚀 Generate Sekarang!"**.
15. **[Sistem Output]** Saldo dipotong. Sistem memasukkan perintah ke antrean (Queue) *BullMQ*. AI akan membaca gambar, mengekstrak _prompt_, lalu memproses render video. 
16. **[Selesai]** Bot secara otomatis akan mengirimkan File Video Output (MP4) ke *user* ketika proses *rendering background* selesai dalam 2-5 menit.

---

## 2. Fitur Prompt Library & Customization
*Katalog prompt siap pakai yang dioptimasi per-niche bisnis.*

**Trigger:** User memanggil `/prompts` atau `/trending`.
1. **[Bot]** Menampilkan daftar klasifikasi bisnis (F&B, Fashion, Education, Entertainment, dll).
2. **[User]** Mengklik salah satu kategori (misal: **F&B**).
3. **[Bot]** Membaca database, lalu menampilkan daftar prompt *High Success Rate (90%+)* bawaan sistem, ditambah dengan *Prompt Kustom* yang pernah disimpan user secara proporsional.
4. **[User]** Mengklik salah satu referensi prompt.
5. **[Bot]** Menampilkan detail deskripsi *prompt* dan memperlihatkan *Credit Estimator* (Berapa biaya untuk render 5, 15, 30 detik).
6. **[User]** Dihadapkan opsi: **"🚀 Buat Video Sekarang"**, **"🔧 Customize"**, atau **"💾 Simpan"**.
7. **[Sistem Output]** Jika user memilih *Customize*, pengguna dapat memodifikasi parameter khusus (misal: ganti Style menjadi Cinematic, ganti Lighting menjadi Moody, dsb). Jika memilih *Buat Video*, user akan langsung dilempar ke Fitur Pembuatan Video (Step 1) dengan *prompt* tersebut bertindak sebagai dasarnya.

---

## 3. Fitur Top-Up & Payment Terpadu
*Membeli AI Credits secara otomatis 24/7 tanpa perantara admin manusia.*

**Trigger:** User memanggil `/topup` atau menekan opsi beli kredit saat saldo kurang.
1. **[Bot]** Mengecek tier langganan user. Menampilkan paket *Top-Up* Pilihan Utama, Paket *Bulk/Extra*, *Telegram Stars*, dan *Kripto*.
2. **[User]** Mengklik salah satu tombol paket (misal: **Paket Dasar 50 Credits**).
3. **[Bot]** Jika Payment Gateway lebih dari satu, bot meminta user memilih jalur pembayaran: **Midtrans** atau **Duitku**.
4. **[User]** Memilih penyedia (contoh: Duitku).
5. **[Bot]** Mengontak API Gateway untuk membuat *Order ID* dan membalas user dengan *Invoice Link* serta tombol **"💳 Pay Now"** dan **"✅ I've Paid"**.
6. **[User]** User mengklik link, membayar menggunakan QRIS/VA melalui *browser*.
7. **[Sistem Output]**
   - User dapat menekan *"I've Paid"* untuk verifikasi manual, ATAU
   - Sistem *Webhook* (`/webhook/duitku`) dari Payment Gateway mengirim _callback_ sukses ke server bot. Saldo kredit akan langsung ditambahkan ke _database_ user secara instan, dan user mendapat pesan *"✅ Payment Successful!"*.

---

## 4. Fitur Subscriptions (Pro / Premium Plans)
*Mendaftar jadi pelanggan bulanan untuk diskon video reguler.*

**Trigger:** User memanggil `/subscription`.
1. **[Bot]** Menampilkan status langganan saat ini dan opsi paket (Monthly / Annual) untuk tier Pro.
2. **[User]** Mengklik tombol berlangganan (misal: **Subscribe /mo**).
3. **[Bot]** Menge-generate tagihan melalui Payment Gateway dan menyajikan *Invoice Link*.
4. **[User]** Membayar invoice tersebut.
5. **[Sistem Output]** Webhook diterima. Sistem meningkatkan *Tier* akun pada _database_. Perpanjangan dapat dibatalkan sewaktu-waktu dengan menekan opsi *"❌ Cancel Subscription"*. Keuntungan: Biaya _generate video_ / kredit menjadi separuh harga dari _Standard Pricing_.

---

## 5. Fitur Social Media & Auto-Publishing
*Mempublikasikan hasil video langsung dari bot ke media sosial.*

**Trigger:** User memanggil `/social` atau saat mem-preview hasil video.
1. **[Bot]** Menampilkan akun sosial media yang sudah dikoneksikan, atau menampilkan menu sinkronasi (TikTok, Instagram, YouTube, Twitter).
2. **[User]** Memilih sinkronasi (misal: **➕ Connect New Account -> TikTok**).
3. **[Bot]** State berpindah ke penjaringan kredensial/ID.
4. **[User]** Memasukkan **Account ID** _PostBridge_ untuk diselaraskan.
5. **[Bot]** Menghubungkan ID tersebut ke database user.
6. **[Sistem Output]** Kini, saat proses Pembuatan Video selesai (Fitur No.1), user akan melihat tombol ekstra bertuliskan **"📤 Publish to Social Media"**. Jika ditekan, bot akan secara mandiri menggungah video ke akun sosial media terpilih menggunakan *PostAutomationService*.

---

## 6. Fitur Video History & Management
*Melihat riwayat karya dan mengelola video lama.*

**Trigger:** User memanggil `/videos`.
1. **[Bot]** Mengambil *10 video terakhir* milik user dari database. Melabeli setiap video dengan status (`✅ Completed`, `⏳ Processing`, atau `❌ Failed`). Opsi berupa _inline keyboard_ daftar nama proyek.
2. **[User]** Mengeklik salah satu video di daftar (misal: "Video Promosi Baju").
3. **[Bot]** Menampilkan **Thumbnail Gambar**, detail meta (Biaya Kredit, Tanggal, Durasi), dan File Video lengkap jika masih tersimpan (Biasanya tersimpan hingga 30 hari).
4. **[Sistem Output/Tindakan]** User diperlihatkan tombol fungsional untuk video tersebut:
   - **⬇️ Download** (Menyediakan tautan raw `.mp4` langsung).
   - **📤 Publish** (Lempar ke media sosial).
   - **🎬 Create Similar** (Menduplikasi *prompt* & skenario video tersebut untuk video baru).
   - **🗑️ Delete** (Menghapus catatan video dari database secara permanen).

---

## 7. Fitur Affiliate / Referral
*Mendapatkan profit dari mengajak pengguna baru.*

**Trigger:** User memanggil `/referral`.
1. **[Bot]** Menampilkan Tautan Unik Rujukan (Referral Code / Link, cth: `?start=ref_ABC123`).
2. **[User]** Menyebarkan *link* tersebut.
3. **[New User]** Mendaftar menggunakan *link* yang diteruskan.
4. **[Sistem Output]** Setiap *New User* (Tier 1) melakukan *Top-Up*, pemilik *Link Referral* secara otomatis akan menerima Komisi 10% masuk ke *balance* mereka. Jika *New User* mengajak orang lain (Tier 2), pemilik *Link* pertama akan tetap menerima Pasif Inkam sebesar 5% dari pembelanjaan kredit mereka. Pengguna bisa terus melacak total akumulasi _komisi_ (_Commission Earned_) langsung lewat menu ini.

---

## 8. Fitur Generate Image (Gambar AI & Kelola Avatar)
*Membuat foto marketing profesional dari teks murni atau dengan referensi gambar lain.*

**Trigger:** User memanggil perintah `/image` atau menekan tombol **"🖼️ Buat Gambar Saja"**.
1. **[Bot]** Menampilkan pilihan Kategori Konten: Foto Produk, Makanan & Minuman, Properti, Kendaraan, atau **Kelola Avatar**.
   - *(Jika user memilih Kelola Avatar, user bisa mengirimkan foto wajah model/karakter untuk disimpan ke dalam database. Karakter ini nantinya dijamin konsisten wajahnya pada hasil _generate image_).*
2. **[User]** Memilih salah satu kategori konten (misal: **Foto Produk**).
3. **[Bot]** Menanyakan apakah user ingin **"📸 Upload Foto Referensi"** (jika ingin gambar yang dihasilkan mirip produk aslinya) atau memilih **"⏭️ Skip — Deskripsikan Saja"** (jika murni Text-to-Image).
4. **[User]** Mengupload foto referensi (opsional).
5. **[Bot]** Meminta user untuk mengetik detail deskripsi yang diinginkan (misal: *"Botol parfum di background hitam, lighting terang studio"*).
6. **[User]** Mengetikkan teks tersebut lalu mengirimnya.
7. **[Sistem Output]** Bot akan terhubung dengan _ImageGenerationService_ AI. Dalam hitungan detik, *Bot* akan mengirimkan hasil _render_ beresolusi tinggi langsung berupa File Foto ke chat _user_. User bisa menyimpannya atau menggunakan opsi khusus untuk mengirim gambar hasil render tersebut langsung ke tahap `/create` video.
