/**
 * i18n Translation System
 *
 * Lightweight internationalisation layer. Indonesian (id) is the default
 * language; English (en) is the secondary locale.
 *
 * Usage:
 *   import { t } from '@/i18n/translations';
 *   const msg = t('create.select_niche', 'id');
 */

type Lang = 'id' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // ---------------------------------------------------------------------------
  // Create flow
  // ---------------------------------------------------------------------------
  'create.title': {
    id: '🎬 Buat Video Baru',
    en: '🎬 Create New Video',
  },
  'create.current_credits': {
    id: 'Kredit saat ini',
    en: 'Current credits',
  },
  'create.select_niche': {
    id: 'Pilih kategori konten:',
    en: 'Select content category:',
  },
  'create.need_credits': {
    id: '💰 Butuh lebih banyak kredit?',
    en: '💰 Need more credits?',
  },
  'create.niche_selected': {
    id: 'dipilih!',
    en: 'selected!',
  },
  'create.select_style': {
    id: 'Pilih style video:',
    en: 'Select video style:',
  },
  'create.change_category': {
    id: '← Ganti Kategori',
    en: '← Change Category',
  },
  'create.style_selected': {
    id: '🎬 Style dipilih!',
    en: '🎬 Style selected!',
  },
  'create.extend_mode': {
    id: '💡 Extend Mode: Duration sepanjang apapun!',
    en: '💡 Extend Mode: Any duration you want!',
  },
  'create.select_duration': {
    id: 'Pilih total durasi:',
    en: 'Select total duration:',
  },
  'create.custom_duration': {
    id: '🎯 Custom Duration',
    en: '🎯 Custom Duration',
  },
  'create.custom_duration_prompt': {
    id: '🎯 **Custom Duration**\n\nKirim jumlah detik yang kamu inginkan (misal 45, 60, 90, 120)\n\nNote: Sistem akan otomatis hitung scene (maks 15 detik per scene)\nContoh: 60 detik = 4 scene (15 detik per scene)',
    en: '🎯 **Custom Duration**\n\nSend number of seconds you want (e.g., 45, 60, 90, 120)\n\nNote: System will auto-calculate scenes (15s max per scene)\nExample: 60s = 4 scenes (15s each)',
  },
  'create.almost_ready': {
    id: '🎬 **Hampir Siap!**',
    en: '🎬 **Almost Ready!**',
  },
  'create.niche_label': {
    id: '📋 Niche',
    en: '📋 Niche',
  },
  'create.duration_label': {
    id: '⏱ Durasi',
    en: '⏱ Duration',
  },
  'create.credit_cost_label': {
    id: '💰 Biaya kredit',
    en: '💰 Credit cost',
  },
  'create.send_reference_image': {
    id: '📸 **Kirim gambar referensi** untuk video kamu,\natau ketik /skip untuk biarkan AI generate semua.',
    en: '📸 **Send a reference image** for your video,\nor type /skip to let AI generate everything.',
  },
  'create.scene': {
    id: 'scene',
    en: 'scene',
  },
  'create.scenes': {
    id: 'scene',
    en: 'scenes',
  },

  // Platform selection
  'create.select_platform': {
    id: 'Pilih platform target:',
    en: 'Select target platform:',
  },
  'create.platform_tiktok': {
    id: '📱 TikTok/Reels (9:16)',
    en: '📱 TikTok/Reels (9:16)',
  },
  'create.platform_youtube': {
    id: '📺 YouTube (16:9)',
    en: '📺 YouTube (16:9)',
  },
  'create.platform_instagram': {
    id: '📷 Instagram Feed (4:5)',
    en: '📷 Instagram Feed (4:5)',
  },
  'create.platform_square': {
    id: '🔲 Square (1:1)',
    en: '🔲 Square (1:1)',
  },
  'create.change_style': {
    id: '← Ganti Style',
    en: '← Change Style',
  },
  'create.platform_selected': {
    id: '📱 Platform dipilih!',
    en: '📱 Platform selected!',
  },

  // Daily limit
  'create.daily_limit_reached': {
    id: 'Batas harian tercapai ({used}/{limit}). Upgrade untuk membuat lebih banyak hari ini.',
    en: 'Daily limit reached ({used}/{limit}). Upgrade to create more today.',
  },
  'create.daily_remaining': {
    id: 'Sisa hari ini: {remaining}/{limit}',
    en: 'Remaining today: {remaining}/{limit}',
  },

  // Feedback
  'feedback.thanks_good': {
    id: 'Terima kasih atas feedback-nya! Senang kamu suka.',
    en: 'Thanks for the feedback! Glad you liked it.',
  },
  'feedback.thanks_bad': {
    id: 'Maaf tentang itu. Kami akan terus meningkatkan kualitas. Coba regenerate?',
    en: 'Sorry about that. We\'ll improve. Try regenerating?',
  },

  // Duration options
  'create.duration_quick': {
    id: '⚡ Cepat: 15 detik (1 scene)',
    en: '⚡ Quick: 15s (1 scene)',
  },
  'create.duration_standard': {
    id: '📊 Standar: 30 detik (2 scene)',
    en: '📊 Standard: 30s (2 scenes)',
  },
  'create.duration_long': {
    id: '🎬 Panjang: 60 detik (4 scene)',
    en: '🎬 Long: 60s (4 scenes)',
  },
  'create.duration_extended': {
    id: '📹 Extended: 120 detik (8 scene)',
    en: '📹 Extended: 120s (8 scenes)',
  },

  // ---------------------------------------------------------------------------
  // Errors
  // ---------------------------------------------------------------------------
  'error.generic': {
    id: '❌ Terjadi kesalahan. Silakan coba lagi.',
    en: '❌ Something went wrong. Please try again.',
  },
  'error.user_not_found': {
    id: '❌ Pengguna tidak ditemukan. Silakan mulai dengan /start',
    en: '❌ User not found. Please start with /start',
  },
  'error.identify_user': {
    id: '❌ Tidak dapat mengidentifikasi pengguna.',
    en: '❌ Unable to identify user.',
  },
  'error.insufficient_credits': {
    id: '❌ Kredit tidak cukup.',
    en: '❌ Insufficient credits.',
  },
  'error.insufficient_credits_detail': {
    id: 'Saldo saat ini: {balance}\nMinimum diperlukan: {min} kredit\n\nGunakan /topup untuk menambah kredit.',
    en: 'Current balance: {balance}\nMinimum required: {min} credits\n\nUse /topup to add more credits.',
  },

  // ---------------------------------------------------------------------------
  // Success messages
  // ---------------------------------------------------------------------------
  'success.video_ready': {
    id: '✅ **Video Siap!**',
    en: '✅ **Video Ready!**',
  },
  'success.video_failed': {
    id: '❌ Pembuatan video gagal',
    en: '❌ Video generation failed',
  },
  'success.credits_refunded': {
    id: '💰 Kredit dikembalikan.',
    en: '💰 Credits refunded.',
  },

  // ---------------------------------------------------------------------------
  // Menu / button labels
  // ---------------------------------------------------------------------------
  'menu.create_video': {
    id: '🎬 Buat Video',
    en: '🎬 Create Video',
  },
  'menu.generate_image': {
    id: '🖼️ Generate Gambar',
    en: '🖼️ Generate Image',
  },
  'menu.chat_ai': {
    id: '💬 Chat AI',
    en: '💬 Chat AI',
  },
  'menu.my_videos': {
    id: '📁 Video Saya',
    en: '📁 My Videos',
  },
  'menu.top_up': {
    id: '💰 Top Up',
    en: '💰 Top Up',
  },
  'menu.subscription': {
    id: '⭐ Langganan',
    en: '⭐ Subscription',
  },
  'menu.profile': {
    id: '👤 Profil',
    en: '👤 Profile',
  },
  'menu.referral': {
    id: '👥 Referral',
    en: '👥 Referral',
  },
  'menu.settings': {
    id: '⚙️ Pengaturan',
    en: '⚙️ Settings',
  },
  'menu.support': {
    id: '🆘 Bantuan',
    en: '🆘 Support',
  },
  'menu.create_another': {
    id: '🎬 Buat Lagi',
    en: '🎬 Create Another',
  },
  'menu.try_again': {
    id: '🔄 Coba Lagi',
    en: '🔄 Try Again',
  },
  'menu.top_up_now': {
    id: '💰 Top Up Sekarang',
    en: '💰 Top Up Now',
  },
  'menu.subscribe': {
    id: '⭐ Berlangganan',
    en: '⭐ Subscribe',
  },

  // ---------------------------------------------------------------------------
  // Profile / referral headings
  // ---------------------------------------------------------------------------
  'profile.heading': {
    id: '👤 Profil Kamu',
    en: '👤 Your Profile',
  },
  'profile.credits': {
    id: '💰 Kredit',
    en: '💰 Credits',
  },
  'profile.tier': {
    id: '⭐ Tier',
    en: '⭐ Tier',
  },
  'referral.heading': {
    id: '👥 Program Referral',
    en: '👥 Referral Program',
  },
  'referral.your_code': {
    id: '🔗 Kode referral kamu',
    en: '🔗 Your referral code',
  },

  // ---------------------------------------------------------------------------
  // Common actions / labels
  // ---------------------------------------------------------------------------
  'common.generate': {
    id: 'Generate',
    en: 'Generate',
  },
  'common.cancel': {
    id: 'Batal',
    en: 'Cancel',
  },
  'common.back': {
    id: 'Kembali',
    en: 'Back',
  },
  'common.confirm': {
    id: 'Konfirmasi',
    en: 'Confirm',
  },
  'common.credits': {
    id: 'kredit',
    en: 'credits',
  },

  // ---------------------------------------------------------------------------
  // Low credit warning
  // ---------------------------------------------------------------------------
  'credits.low_warning': {
    id: '⚠️ Kredit Rendah: {remaining} tersisa\n\nVideo berikutnya membutuhkan minimal 0.5 kredit.',
    en: '⚠️ Low Credits: {remaining} remaining\n\nYour next video needs at least 0.5 credits.',
  },

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  'onboarding.welcome': {
    id: '🎉 Selamat datang di OpenClaw!\n\nKamu mendapat 3 kredit gratis untuk mencoba.\n\nIzinkan saya tunjukkan apa yang bisa kamu lakukan:',
    en: '🎉 Welcome to OpenClaw!\n\nYou received 3 free credits to try.\n\nLet me show you what you can do:',
  },
  'onboarding.features': {
    id: '🎬 Buat Video — AI membuat video marketing untuk bisnismu\n🖼️ Generate Gambar — Foto produk, makanan, real estate\n💬 Chat AI — Brainstorm ide, tulis caption\n\nVideo pertamamu hanya 0.5 kredit!',
    en: '🎬 Create Videos — AI generates marketing videos for your business\n🖼️ Generate Images — Product photos, food shots, real estate\n💬 Chat AI — Brainstorm ideas, write captions\n\nYour first video costs just 0.5 credits!',
  },
  'onboarding.cta': {
    id: 'Siap mencoba? Ketuk "Buat Video" di bawah! 👇',
    en: 'Ready to try? Tap "Create Video" below! 👇',
  },
  'onboarding.btn_create_video': {
    id: '🎬 Buat Video Pertama',
    en: '🎬 Create First Video',
  },
  'onboarding.btn_try_image': {
    id: '🖼️ Coba Generate Gambar',
    en: '🖼️ Try Image Generation',
  },
  'onboarding.btn_chat_ai': {
    id: '💬 Chat dengan AI',
    en: '💬 Chat with AI',
  },

  // ---------------------------------------------------------------------------
  // Image reference & Avatar
  // ---------------------------------------------------------------------------
  'image.select_mode': {
    id: 'Pilih cara generate:',
    en: 'Select generation method:',
  },
  'image.upload_reference': {
    id: '📸 Kirim foto produk/subjek kamu sebagai referensi.',
    en: '📸 Send your product/subject photo as reference.',
  },
  'image.reference_received': {
    id: '📸 Gambar referensi diterima! Sekarang deskripsikan yang ingin di-generate:',
    en: '📸 Reference image received! Now describe what you want to generate:',
  },
  'image.generating_with_ref': {
    id: '⏳ Generating gambar dengan referensi...',
    en: '⏳ Generating image with reference...',
  },
  'image.generating_with_avatar': {
    id: '⏳ Generating gambar dengan avatar...',
    en: '⏳ Generating image with avatar...',
  },
  'image.no_img2img_providers': {
    id: '⚠️ Tidak ada provider yang mendukung gambar referensi saat ini. Menggunakan mode teks saja.',
    en: '⚠️ No providers support reference images right now. Using text-only mode.',
  },
  'avatar.title': {
    id: '👤 Avatar Kamu',
    en: '👤 Your Avatars',
  },
  'avatar.empty': {
    id: 'Belum ada avatar tersimpan.',
    en: 'No avatars saved yet.',
  },
  'avatar.add_prompt': {
    id: 'Kirim foto yang jelas untuk avatar baru.',
    en: 'Send a clear photo for your new avatar.',
  },
  'avatar.name_prompt': {
    id: 'Beri nama avatar ini:',
    en: 'Give this avatar a name:',
  },
  'avatar.saved': {
    id: '✅ Avatar tersimpan!',
    en: '✅ Avatar saved!',
  },
  'avatar.deleted': {
    id: '🗑️ Avatar dihapus.',
    en: '🗑️ Avatar deleted.',
  },
  'avatar.set_default': {
    id: '⭐ Avatar ditetapkan sebagai default!',
    en: '⭐ Avatar set as default!',
  },
  'avatar.max_reached': {
    id: '❌ Maksimal {max} avatar. Hapus salah satu dulu.',
    en: '❌ Maximum {max} avatars. Delete one first.',
  },
};

/**
 * Get a translated string.
 *
 * Supports placeholder interpolation: `t('key', 'id', { remaining: '0.4' })`
 * Placeholders in the translation string use `{name}` syntax.
 */
export function t(
  key: string,
  lang: Lang = 'id',
  vars?: Record<string, string | number>,
): string {
  let text = translations[key]?.[lang] || translations[key]?.['id'] || key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
