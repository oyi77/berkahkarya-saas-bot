/**
 * i18n Translation System
 *
 * UI translations for 4 supported languages: id, en, ru, zh.
 * All other language codes (TTS/subtitle level) fall back to English for UI.
 *
 * Usage:
 *   import { t } from '@/i18n/translations';
 *   const msg = t('create.select_niche', 'ru');
 */

type Lang = string;

const translations: Record<string, Record<Lang, string>> = {
  // ---------------------------------------------------------------------------
  // Create flow
  // ---------------------------------------------------------------------------
  'create.title': {
    id: '🎬 Buat Video Baru',
    en: '🎬 Create New Video',
    ru: '🎬 Создать новое видео',
    zh: '🎬 创建新视频',
  },
  'create.current_credits': {
    id: 'Kredit saat ini',
    en: 'Current credits',
    ru: 'Текущий баланс',
    zh: '当前积分',
  },
  'create.select_niche': {
    id: 'Pilih kategori konten:',
    en: 'Select content category:',
    ru: 'Выберите категорию контента:',
    zh: '选择内容类别：',
  },
  'create.need_credits': {
    id: '💰 Butuh lebih banyak kredit?',
    en: '💰 Need more credits?',
    ru: '💰 Нужно больше кредитов?',
    zh: '💰 需要更多积分？',
  },
  'create.niche_selected': {
    id: 'dipilih!',
    en: 'selected!',
    ru: 'выбрано!',
    zh: '已选择！',
  },
  'create.select_style': {
    id: 'Pilih style video:',
    en: 'Select video style:',
    ru: 'Выберите стиль видео:',
    zh: '选择视频风格：',
  },
  'create.change_category': {
    id: '← Ganti Kategori',
    en: '← Change Category',
    ru: '← Изменить категорию',
    zh: '← 更换类别',
  },
  'create.style_selected': {
    id: '🎬 Style dipilih!',
    en: '🎬 Style selected!',
    ru: '🎬 Стиль выбран!',
    zh: '🎬 风格已选择！',
  },
  'create.extend_mode': {
    id: '💡 Extend Mode: Duration sepanjang apapun!',
    en: '💡 Extend Mode: Any duration you want!',
    ru: '💡 Режим расширения: любая длительность!',
    zh: '💡 扩展模式：任意时长！',
  },
  'create.select_duration': {
    id: 'Pilih total durasi:',
    en: 'Select total duration:',
    ru: 'Выберите продолжительность:',
    zh: '选择视频时长：',
  },
  'create.custom_duration': {
    id: '🎯 Custom Duration',
    en: '🎯 Custom Duration',
    ru: '🎯 Произвольная длительность',
    zh: '🎯 自定义时长',
  },
  'create.custom_duration_prompt': {
    id: '🎯 **Custom Duration**\n\nKirim jumlah detik yang kamu inginkan (misal 45, 60, 90, 120)\n\nNote: Sistem akan otomatis hitung scene (maks 15 detik per scene)\nContoh: 60 detik = 4 scene (15 detik per scene)',
    en: '🎯 **Custom Duration**\n\nSend number of seconds you want (e.g., 45, 60, 90, 120)\n\nNote: System will auto-calculate scenes (15s max per scene)\nExample: 60s = 4 scenes (15s each)',
    ru: '🎯 **Произвольная длительность**\n\nВведите количество секунд (например, 45, 60, 90, 120)\n\nПримечание: система автоматически рассчитает сцены (макс. 15 сек/сцена)\nПример: 60 сек = 4 сцены (по 15 сек)',
    zh: '🎯 **自定义时长**\n\n请输入秒数（如 45、60、90、120）\n\n注意：系统将自动计算场景数（最多 15 秒/场景）\n示例：60 秒 = 4 个场景（每个 15 秒）',
  },
  'create.almost_ready': {
    id: '🎬 **Hampir Siap!**',
    en: '🎬 **Almost Ready!**',
    ru: '🎬 **Почти готово!**',
    zh: '🎬 **即将完成！**',
  },
  'create.niche_label': {
    id: '📋 Niche',
    en: '📋 Niche',
    ru: '📋 Ниша',
    zh: '📋 类别',
  },
  'create.duration_label': {
    id: '⏱ Durasi',
    en: '⏱ Duration',
    ru: '⏱ Длительность',
    zh: '⏱ 时长',
  },
  'create.credit_cost_label': {
    id: '💰 Biaya kredit',
    en: '💰 Credit cost',
    ru: '💰 Стоимость в кредитах',
    zh: '💰 积分费用',
  },
  'create.send_reference_image': {
    id: '📸 **Kirim gambar referensi** untuk video kamu,\natau ketik /skip untuk biarkan AI generate semua.',
    en: '📸 **Send a reference image** for your video,\nor type /skip to let AI generate everything.',
    ru: '📸 **Отправьте референс-изображение** для видео,\nили введите /skip, чтобы ИИ сгенерировал всё.',
    zh: '📸 **发送参考图片**以供视频使用，\n或输入 /skip 让 AI 全自动生成。',
  },
  'create.scene': {
    id: 'scene',
    en: 'scene',
    ru: 'сцена',
    zh: '场景',
  },
  'create.scenes': {
    id: 'scene',
    en: 'scenes',
    ru: 'сцены',
    zh: '场景',
  },

  // Platform selection
  'create.select_platform': {
    id: 'Pilih platform target:',
    en: 'Select target platform:',
    ru: 'Выберите целевую платформу:',
    zh: '选择目标平台：',
  },
  'create.platform_tiktok': {
    id: '📱 TikTok/Reels (9:16)',
    en: '📱 TikTok/Reels (9:16)',
    ru: '📱 TikTok/Reels (9:16)',
    zh: '📱 TikTok/Reels (9:16)',
  },
  'create.platform_youtube': {
    id: '📺 YouTube (16:9)',
    en: '📺 YouTube (16:9)',
    ru: '📺 YouTube (16:9)',
    zh: '📺 YouTube (16:9)',
  },
  'create.platform_instagram': {
    id: '📷 Instagram Feed (4:5)',
    en: '📷 Instagram Feed (4:5)',
    ru: '📷 Instagram Feed (4:5)',
    zh: '📷 Instagram Feed (4:5)',
  },
  'create.platform_square': {
    id: '🔲 Square (1:1)',
    en: '🔲 Square (1:1)',
    ru: '🔲 Квадрат (1:1)',
    zh: '🔲 正方形 (1:1)',
  },
  'create.change_style': {
    id: '← Ganti Style',
    en: '← Change Style',
    ru: '← Изменить стиль',
    zh: '← 更换风格',
  },
  'create.platform_selected': {
    id: '📱 Platform dipilih!',
    en: '📱 Platform selected!',
    ru: '📱 Платформа выбрана!',
    zh: '📱 平台已选择！',
  },

  // Daily limit
  'create.daily_limit_reached': {
    id: 'Batas harian tercapai ({used}/{limit}). Upgrade untuk membuat lebih banyak hari ini.',
    en: 'Daily limit reached ({used}/{limit}). Upgrade to create more today.',
    ru: 'Дневной лимит достигнут ({used}/{limit}). Перейдите на Premium для большего.',
    zh: '已达每日上限（{used}/{limit}）。升级以今天创作更多。',
  },
  'create.daily_remaining': {
    id: 'Sisa hari ini: {remaining}/{limit}',
    en: 'Remaining today: {remaining}/{limit}',
    ru: 'Осталось сегодня: {remaining}/{limit}',
    zh: '今日剩余：{remaining}/{limit}',
  },

  // Feedback
  'feedback.thanks_good': {
    id: 'Terima kasih atas feedback-nya! Senang kamu suka.',
    en: 'Thanks for the feedback! Glad you liked it.',
    ru: 'Спасибо за отзыв! Рады, что вам понравилось.',
    zh: '感谢您的反馈！很高兴您喜欢。',
  },
  'feedback.thanks_bad': {
    id: 'Maaf tentang itu. Kami akan terus meningkatkan kualitas. Coba regenerate?',
    en: 'Sorry about that. We\'ll improve. Try regenerating?',
    ru: 'Извините за это. Мы будем улучшаться. Попробуйте снова?',
    zh: '非常抱歉。我们会持续改进。要重新生成吗？',
  },

  // Duration options
  'create.duration_quick': {
    id: '⚡ Cepat: 15 detik (1 scene)',
    en: '⚡ Quick: 15s (1 scene)',
    ru: '⚡ Быстро: 15 сек (1 сцена)',
    zh: '⚡ 快速：15 秒（1 个场景）',
  },
  'create.duration_standard': {
    id: '📊 Standar: 30 detik (2 scene)',
    en: '📊 Standard: 30s (2 scenes)',
    ru: '📊 Стандарт: 30 сек (2 сцены)',
    zh: '📊 标准：30 秒（2 个场景）',
  },
  'create.duration_long': {
    id: '🎬 Panjang: 60 detik (4 scene)',
    en: '🎬 Long: 60s (4 scenes)',
    ru: '🎬 Длинное: 60 сек (4 сцены)',
    zh: '🎬 长版：60 秒（4 个场景）',
  },
  'create.duration_extended': {
    id: '📹 Extended: 120 detik (8 scene)',
    en: '📹 Extended: 120s (8 scenes)',
    ru: '📹 Расширенное: 120 сек (8 сцен)',
    zh: '📹 扩展：120 秒（8 个场景）',
  },

  // ---------------------------------------------------------------------------
  // Errors
  // ---------------------------------------------------------------------------
  'error.generic': {
    id: '❌ Terjadi kesalahan. Silakan coba lagi.',
    en: '❌ Something went wrong. Please try again.',
    ru: '❌ Что-то пошло не так. Пожалуйста, попробуйте снова.',
    zh: '❌ 出了点问题，请再试一次。',
  },
  'error.user_not_found': {
    id: '❌ Pengguna tidak ditemukan. Silakan mulai dengan /start',
    en: '❌ User not found. Please start with /start',
    ru: '❌ Пользователь не найден. Начните с /start',
    zh: '❌ 未找到用户，请从 /start 开始',
  },
  'error.identify_user': {
    id: '❌ Tidak dapat mengidentifikasi pengguna.',
    en: '❌ Unable to identify user.',
    ru: '❌ Невозможно идентифицировать пользователя.',
    zh: '❌ 无法识别用户。',
  },
  'error.insufficient_credits': {
    id: '❌ Kredit tidak cukup.',
    en: '❌ Insufficient credits.',
    ru: '❌ Недостаточно кредитов.',
    zh: '❌ 积分不足。',
  },
  'error.insufficient_credits_detail': {
    id: 'Saldo saat ini: {balance}\nMinimum diperlukan: {min} kredit\n\nGunakan /topup untuk menambah kredit.',
    en: 'Current balance: {balance}\nMinimum required: {min} credits\n\nUse /topup to add more credits.',
    ru: 'Текущий баланс: {balance}\nМинимум требуется: {min} кредитов\n\nИспользуйте /topup для пополнения.',
    zh: '当前余额：{balance}\n最少需要：{min} 积分\n\n使用 /topup 充值。',
  },

  // ---------------------------------------------------------------------------
  // Success messages
  // ---------------------------------------------------------------------------
  'success.video_ready': {
    id: '✅ **Video Siap!**',
    en: '✅ **Video Ready!**',
    ru: '✅ **Видео готово!**',
    zh: '✅ **视频已就绪！**',
  },
  'success.video_failed': {
    id: '❌ Pembuatan video gagal',
    en: '❌ Video generation failed',
    ru: '❌ Создание видео не удалось',
    zh: '❌ 视频生成失败',
  },
  'success.credits_refunded': {
    id: '💰 Kredit dikembalikan.',
    en: '💰 Credits refunded.',
    ru: '💰 Кредиты возвращены.',
    zh: '💰 积分已退还。',
  },

  // ---------------------------------------------------------------------------
  // Menu / button labels
  // ---------------------------------------------------------------------------
  'menu.create_video': {
    id: '🎬 Buat Video',
    en: '🎬 Create Video',
    ru: '🎬 Создать видео',
    zh: '🎬 创建视频',
  },
  'menu.generate_image': {
    id: '🖼️ Generate Gambar',
    en: '🖼️ Generate Image',
    ru: '🖼️ Создать изображение',
    zh: '🖼️ 生成图片',
  },
  'menu.chat_ai': {
    id: '💬 Chat AI',
    en: '💬 Chat AI',
    ru: '💬 Чат с ИИ',
    zh: '💬 AI 对话',
  },
  'menu.my_videos': {
    id: '📁 Video Saya',
    en: '📁 My Videos',
    ru: '📁 Мои видео',
    zh: '📁 我的视频',
  },
  'menu.top_up': {
    id: '💰 Top Up',
    en: '💰 Top Up',
    ru: '💰 Пополнить',
    zh: '💰 充值',
  },
  'menu.subscription': {
    id: '⭐ Langganan',
    en: '⭐ Subscription',
    ru: '⭐ Подписка',
    zh: '⭐ 订阅',
  },
  'menu.profile': {
    id: '👤 Profil',
    en: '👤 Profile',
    ru: '👤 Профиль',
    zh: '👤 个人资料',
  },
  'menu.referral': {
    id: '👥 Referral',
    en: '👥 Referral',
    ru: '👥 Реферал',
    zh: '👥 推荐',
  },
  'menu.settings': {
    id: '⚙️ Pengaturan',
    en: '⚙️ Settings',
    ru: '⚙️ Настройки',
    zh: '⚙️ 设置',
  },
  'menu.support': {
    id: '🆘 Bantuan',
    en: '🆘 Support',
    ru: '🆘 Поддержка',
    zh: '🆘 帮助',
  },
  'menu.create_another': {
    id: '🎬 Buat Lagi',
    en: '🎬 Create Another',
    ru: '🎬 Создать ещё',
    zh: '🎬 再创建一个',
  },
  'menu.try_again': {
    id: '🔄 Coba Lagi',
    en: '🔄 Try Again',
    ru: '🔄 Попробовать снова',
    zh: '🔄 再试一次',
  },
  'menu.top_up_now': {
    id: '💰 Top Up Sekarang',
    en: '💰 Top Up Now',
    ru: '💰 Пополнить сейчас',
    zh: '💰 立即充值',
  },
  'menu.subscribe': {
    id: '⭐ Berlangganan',
    en: '⭐ Subscribe',
    ru: '⭐ Подписаться',
    zh: '⭐ 订阅',
  },

  // Main menu specific
  'menu.hello': {
    id: '👋 *Halo, {name}!*',
    en: '👋 *Hello, {name}!*',
    ru: '👋 *Привет, {name}!*',
    zh: '👋 *你好，{name}！*',
  },
  'menu.credits_label': {
    id: 'Kredit',
    en: 'Credits',
    ru: 'Кредиты',
    zh: '积分',
  },
  'menu.today_question': {
    id: 'Mau buat apa hari ini? 👇',
    en: 'What would you like to create today? 👇',
    ru: 'Что создадим сегодня? 👇',
    zh: '今天想创作什么？ 👇',
  },
  'menu.btn_prompts': {
    id: '📚 Pilih Prompt & Buat Video',
    en: '📚 Browse Prompts & Create',
    ru: '📚 Шаблоны и создание',
    zh: '📚 浏览模板并创建',
  },
  'menu.btn_trending': {
    id: '🔥 Trending',
    en: '🔥 Trending',
    ru: '🔥 Тренды',
    zh: '🔥 热门',
  },
  'menu.btn_free_prompt': {
    id: '🎁 Prompt Gratis',
    en: '🎁 Free Prompt',
    ru: '🎁 Бесплатный шаблон',
    zh: '🎁 免费模板',
  },
  'menu.btn_create_video': {
    id: '🎬 Buat Video',
    en: '🎬 Create Video',
    ru: '🎬 Создать видео',
    zh: '🎬 创建视频',
  },
  'menu.btn_create_image': {
    id: '🖼️ Buat Gambar',
    en: '🖼️ Create Image',
    ru: '🖼️ Создать изображение',
    zh: '🖼️ 创建图片',
  },
  'menu.btn_clone': {
    id: '🔄 Clone',
    en: '🔄 Clone',
    ru: '🔄 Клонировать',
    zh: '🔄 克隆',
  },
  'menu.btn_storyboard': {
    id: '📋 Storyboard',
    en: '📋 Storyboard',
    ru: '📋 Раскадровка',
    zh: '📋 分镜头',
  },
  'menu.btn_viral': {
    id: '📈 Viral',
    en: '📈 Viral',
    ru: '📈 Вирусный',
    zh: '📈 爆款',
  },
  'menu.btn_my_videos': {
    id: '📁 Video Saya',
    en: '📁 My Videos',
    ru: '📁 Мои видео',
    zh: '📁 我的视频',
  },
  'menu.btn_referral': {
    id: '👥 Referral',
    en: '👥 Referral',
    ru: '👥 Реферал',
    zh: '👥 推荐',
  },
  'menu.btn_profile': {
    id: '👤 Profil',
    en: '👤 Profile',
    ru: '👤 Профиль',
    zh: '👤 个人资料',
  },
  'menu.btn_web_dashboard': {
    id: '🌐 Dashboard Web',
    en: '🌐 Web Dashboard',
    ru: '🌐 Веб-дашборд',
    zh: '🌐 网页控制台',
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  'settings.title': {
    id: '⚙️ *Pengaturan*',
    en: '⚙️ *Settings*',
    ru: '⚙️ *Настройки*',
    zh: '⚙️ *设置*',
  },
  'settings.description': {
    id: 'Konfigurasi preferensi kamu:',
    en: 'Configure your preferences:',
    ru: 'Настройте ваши предпочтения:',
    zh: '配置您的偏好：',
  },
  'settings.language_label': {
    id: '*Bahasa:*',
    en: '*Language:*',
    ru: '*Язык:*',
    zh: '*语言：*',
  },
  'settings.notifications_label': {
    id: '*Notifikasi:*',
    en: '*Notifications:*',
    ru: '*Уведомления:*',
    zh: '*通知：*',
  },
  'settings.autorenewal_label': {
    id: '*Auto-renewal:*',
    en: '*Auto-renewal:*',
    ru: '*Авто-продление:*',
    zh: '*自动续订：*',
  },
  'settings.enabled': {
    id: 'Aktif',
    en: 'Enabled',
    ru: 'Включено',
    zh: '已启用',
  },
  'settings.disabled': {
    id: 'Nonaktif',
    en: 'Disabled',
    ru: 'Отключено',
    zh: '已禁用',
  },
  'settings.what_to_change': {
    id: 'Apa yang ingin kamu ubah?',
    en: 'What would you like to change?',
    ru: 'Что хотите изменить?',
    zh: '您想更改什么？',
  },
  'settings.btn_language': {
    id: '🌐 Ganti Bahasa',
    en: '🌐 Change Language',
    ru: '🌐 Изменить язык',
    zh: '🌐 更改语言',
  },
  'settings.btn_notifications': {
    id: '🔔 Notifikasi',
    en: '🔔 Notifications',
    ru: '🔔 Уведомления',
    zh: '🔔 通知',
  },
  'settings.btn_autorenewal': {
    id: '🔄 Auto-renewal',
    en: '🔄 Auto-renewal',
    ru: '🔄 Авто-продление',
    zh: '🔄 自动续订',
  },

  // ---------------------------------------------------------------------------
  // Profile / referral headings
  // ---------------------------------------------------------------------------
  'profile.heading': {
    id: '👤 Profil Kamu',
    en: '👤 Your Profile',
    ru: '👤 Ваш профиль',
    zh: '👤 您的个人资料',
  },
  'profile.credits': {
    id: '💰 Kredit',
    en: '💰 Credits',
    ru: '💰 Кредиты',
    zh: '💰 积分',
  },
  'profile.tier': {
    id: '⭐ Tier',
    en: '⭐ Tier',
    ru: '⭐ Уровень',
    zh: '⭐ 等级',
  },
  'referral.heading': {
    id: '👥 Program Referral',
    en: '👥 Referral Program',
    ru: '👥 Реферальная программа',
    zh: '👥 推荐计划',
  },
  'referral.your_code': {
    id: '🔗 Kode referral kamu',
    en: '🔗 Your referral code',
    ru: '🔗 Ваш реферальный код',
    zh: '🔗 您的推荐码',
  },

  // ---------------------------------------------------------------------------
  // Common actions / labels
  // ---------------------------------------------------------------------------
  'common.generate': {
    id: 'Generate',
    en: 'Generate',
    ru: 'Создать',
    zh: '生成',
  },
  'common.cancel': {
    id: 'Batal',
    en: 'Cancel',
    ru: 'Отмена',
    zh: '取消',
  },
  'common.back': {
    id: 'Kembali',
    en: 'Back',
    ru: 'Назад',
    zh: '返回',
  },
  'common.confirm': {
    id: 'Konfirmasi',
    en: 'Confirm',
    ru: 'Подтвердить',
    zh: '确认',
  },
  'common.credits': {
    id: 'kredit',
    en: 'credits',
    ru: 'кредитов',
    zh: '积分',
  },

  // ---------------------------------------------------------------------------
  // Low credit warning
  // ---------------------------------------------------------------------------
  'credits.low_warning': {
    id: '⚠️ Kredit Rendah: {remaining} tersisa\n\nVideo berikutnya membutuhkan minimal 0.5 kredit.',
    en: '⚠️ Low Credits: {remaining} remaining\n\nYour next video needs at least 0.5 credits.',
    ru: '⚠️ Мало кредитов: {remaining} осталось\n\nСледующее видео требует минимум 0.5 кредита.',
    zh: '⚠️ 积分不足：剩余 {remaining}\n\n下一个视频至少需要 0.5 积分。',
  },

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  'onboarding.select_language': {
    id: '🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言',
    en: '🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言',
    ru: '🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言',
    zh: '🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言',
  },
  'onboarding.welcome': {
    id: 'Selamat datang di BerkahKarya AI! 🎉\n\n📱 **Platform AI Content Creation Terlengkap di Indonesia**\n\nKamu udah dapat **3 credits GRATIS** yang bisa dipake untuk:\n• 6 video pendek (5 detik)\n• 3 gambar HD\n• Atau kombinasi keduanya!',
    en: 'Welcome to BerkahKarya AI! 🎉\n\n📱 **The Most Complete AI Content Creation Platform**\n\nYou got **3 FREE credits** which can be used for:\n• 6 short videos (5 seconds)\n• 3 HD images\n• Or a combination of both!',
    ru: 'Добро пожаловать в BerkahKarya AI! 🎉\n\n📱 **Платформа для создания AI-контента**\n\nВы получили **3 БЕСПЛАТНЫХ кредита** для:\n• 6 коротких видео (5 секунд)\n• 3 HD-изображения\n• Или комбинацию!',
    zh: '欢迎来到 BerkahKarya AI！🎉\n\n📱 **最全面的 AI 内容创作平台**\n\n您获得了 **3 个免费积分**，可用于：\n• 6 个短视频（5 秒）\n• 3 张高清图片\n• 或两者的组合！',
  },
  'onboarding.features': {
    id: '─────────────────────────────\n**MAU BUAT APA HARI INI?**\n─────────────────────────────\n\n🎬 **Video**\n• Upload foto → jadi video cinematic\n• Deskripsikan → AI bikin video\n• Clone video viral → adaptasi buat brandmu\n\n🖼️ **Gambar**\n• Foto produk profesional\n• Thumbnail YouTube\n• Social media content\n\n📋 **Prompt Templates**\n• 40+ prompt profesional per niche\n• Tinggal pilih → langsung generate\n• Gratis untuk semua user!',
    en: '─────────────────────────────\n**WHAT DO YOU WANT TO CREATE TODAY?**\n─────────────────────────────\n\n🎬 **Video**\n• Upload photo → cinematic video\n• Describe → AI makes video\n• Clone viral video → adapt for your brand\n\n🖼️ **Image**\n• Professional product photo\n• YouTube Thumbnail\n• Social media content\n\n📋 **Prompt Templates**\n• 40+ professional prompts per niche\n• Just pick → generate instantly\n• Free for all users!',
    ru: '─────────────────────────────\n**ЧТО ХОТИТЕ СОЗДАТЬ СЕГОДНЯ?**\n─────────────────────────────\n\n🎬 **Видео**\n• Загрузите фото → кинематографическое видео\n• Опишите → ИИ создаст видео\n• Клонируйте вирусное → для вашего бренда\n\n🖼️ **Изображение**\n• Профессиональное фото продукта\n• Обложка YouTube\n• Контент для соцсетей\n\n📋 **Шаблоны**\n• 40+ профессиональных шаблонов\n• Просто выберите → генерируйте сразу\n• Бесплатно для всех!',
    zh: '─────────────────────────────\n**今天想创作什么？**\n─────────────────────────────\n\n🎬 **视频**\n• 上传照片 → 生成电影感视频\n• 描述需求 → AI 制作视频\n• 克隆爆款视频 → 为您的品牌定制\n\n🖼️ **图片**\n• 专业产品图\n• YouTube 封面\n• 社交媒体内容\n\n📋 **提示词模板**\n• 40+ 个专业模板\n• 直接选择 → 立即生成\n• 所有用户免费！',
  },
  'onboarding.cta': {
    id: '👇 *Mau mulai dari mana?*',
    en: '👇 *Where would you like to start?*',
    ru: '👇 *С чего хотите начать?*',
    zh: '👇 *您想从哪里开始？*',
  },
  'onboarding.btn_create_video': {
    id: '📚 Pilih Prompt & Buat Video',
    en: '📚 Browse Prompts & Create Video',
    ru: '📚 Выбрать шаблон и создать видео',
    zh: '📚 浏览模板并创建视频',
  },
  'onboarding.btn_try_image': {
    id: '🎁 Ambil Prompt Gratis Hari Ini',
    en: '🎁 Get Today\'s Free Prompt',
    ru: '🎁 Получить бесплатный шаблон дня',
    zh: '🎁 获取今日免费模板',
  },
  'onboarding.btn_chat_ai': {
    id: '💬 Tanya AI — Saya Bantu Pilihkan',
    en: '💬 Ask AI — I\'ll Help You Choose',
    ru: '💬 Спросить ИИ — помогу выбрать',
    zh: '💬 咨询 AI — 我来帮您选',
  },

  // ---------------------------------------------------------------------------
  // Image reference & Avatar
  // ---------------------------------------------------------------------------
  'image.select_mode': {
    id: 'Pilih cara generate:',
    en: 'Select generation method:',
    ru: 'Выберите способ генерации:',
    zh: '选择生成方式：',
  },
  'image.upload_reference': {
    id: '📸 Kirim foto produk/subjek kamu sebagai referensi.',
    en: '📸 Send your product/subject photo as reference.',
    ru: '📸 Отправьте фото вашего продукта/объекта как референс.',
    zh: '📸 发送您的产品/主题照片作为参考。',
  },
  'image.reference_received': {
    id: '📸 Gambar referensi diterima! Sekarang deskripsikan yang ingin di-generate:',
    en: '📸 Reference image received! Now describe what you want to generate:',
    ru: '📸 Референс получен! Теперь опишите, что хотите создать:',
    zh: '📸 已收到参考图！现在描述您想生成的内容：',
  },
  'image.generating_with_ref': {
    id: '⏳ Generating gambar dengan referensi...',
    en: '⏳ Generating image with reference...',
    ru: '⏳ Создание изображения с референсом...',
    zh: '⏳ 正在使用参考图生成图片...',
  },
  'image.generating_with_avatar': {
    id: '⏳ Generating gambar dengan avatar...',
    en: '⏳ Generating image with avatar...',
    ru: '⏳ Создание изображения с аватаром...',
    zh: '⏳ 正在使用头像生成图片...',
  },
  'image.no_img2img_providers': {
    id: '⚠️ Tidak ada provider yang mendukung gambar referensi saat ini. Menggunakan mode teks saja.',
    en: '⚠️ No providers support reference images right now. Using text-only mode.',
    ru: '⚠️ Нет доступных провайдеров для референс-изображений. Использую текстовый режим.',
    zh: '⚠️ 目前没有支持参考图片的提供商。仅使用文本模式。',
  },
  'avatar.title': {
    id: '👤 Avatar Kamu',
    en: '👤 Your Avatars',
    ru: '👤 Ваши аватары',
    zh: '👤 您的头像',
  },
  'avatar.empty': {
    id: 'Belum ada avatar tersimpan.',
    en: 'No avatars saved yet.',
    ru: 'Аватары отсутствуют.',
    zh: '暂无头像。',
  },
  'avatar.add_prompt': {
    id: 'Kirim foto yang jelas untuk avatar baru.',
    en: 'Send a clear photo for your new avatar.',
    ru: 'Отправьте четкое фото для нового аватара.',
    zh: '发送清晰的照片以创建新头像。',
  },
  'avatar.name_prompt': {
    id: 'Beri nama avatar ini:',
    en: 'Give this avatar a name:',
    ru: 'Дайте имя этому аватару:',
    zh: '为此头像命名：',
  },
  'avatar.saved': {
    id: '✅ Avatar tersimpan!',
    en: '✅ Avatar saved!',
    ru: '✅ Аватар сохранён!',
    zh: '✅ 头像已保存！',
  },
  'avatar.deleted': {
    id: '🗑️ Avatar dihapus.',
    en: '🗑️ Avatar deleted.',
    ru: '🗑️ Аватар удалён.',
    zh: '🗑️ 头像已删除。',
  },
  'avatar.set_default': {
    id: '⭐ Avatar ditetapkan sebagai default!',
    en: '⭐ Avatar set as default!',
    ru: '⭐ Аватар установлен по умолчанию!',
    zh: '⭐ 头像已设为默认！',
  },
  'avatar.max_reached': {
    id: '❌ Maksimal {max} avatar. Hapus salah satu dulu.',
    en: '❌ Maximum {max} avatars. Delete one first.',
    ru: '❌ Максимум {max} аватаров. Сначала удалите один.',
    zh: '❌ 最多 {max} 个头像。请先删除一个。',
  },
};

/**
 * Get a translated string.
 *
 * Priority: requested lang → English → Indonesian → key itself.
 * Supports placeholder interpolation: `t('key', 'ru', { remaining: '0.4' })`
 * Placeholders in the translation string use `{name}` syntax.
 */
export function t(
  key: string,
  lang: Lang = 'id',
  vars?: Record<string, string | number>,
): string {
  // Try exact match, then English fallback, then Indonesian fallback
  let text = translations[key]?.[lang] || translations[key]?.['en'] || translations[key]?.['id'] || key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
