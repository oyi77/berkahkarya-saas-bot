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

  // ---------------------------------------------------------------------------
  // Generate flow (V3)
  // ---------------------------------------------------------------------------
  'gen.analyzing_photo': {
    id: '🔍 *Menganalisis foto produk...*',
    en: '🔍 *Analyzing product photo...*',
    ru: '🔍 *Анализируем фото товара...*',
    zh: '🔍 *正在分析产品照片...*',
  },
  'gen.send_photo_or_text': {
    id: '❌ Kirim foto produk atau ketik deskripsi produk.',
    en: '❌ Please send a product photo or type a description.',
    ru: '❌ Отправьте фото товара или введите описание.',
    zh: '❌ 请发送产品照片或输入描述。',
  },
  'gen.input_failed': {
    id: '❌ Gagal memproses input. Coba lagi.',
    en: '❌ Failed to process input. Try again.',
    ru: '❌ Не удалось обработать ввод. Попробуйте снова.',
    zh: '❌ 处理输入失败，请重试。',
  },
  'gen.already_processing': {
    id: '⏳ Sedang diproses... mohon tunggu.',
    en: '⏳ Already processing... please wait.',
    ru: '⏳ Уже обрабатывается... подождите.',
    zh: '⏳ 正在处理中...请稍候。',
  },
  'gen.user_not_found': {
    id: '❌ User tidak ditemukan.',
    en: '❌ User not found.',
    ru: '❌ Пользователь не найден.',
    zh: '❌ 用户未找到。',
  },
  'gen.insufficient_credits': {
    id: '❌ *Kredit tidak cukup*\n\nDibutuhkan: {cost} kredit\nSaldo: {balance} kredit\n\nGunakan /topup untuk menambah kredit.',
    en: '❌ *Insufficient credits*\n\nRequired: {cost} credits\nBalance: {balance} credits\n\nUse /topup to add credits.',
    ru: '❌ *Недостаточно кредитов*\n\nТребуется: {cost}\nБаланс: {balance}\n\nИспользуйте /topup для пополнения.',
    zh: '❌ *积分不足*\n\n需要: {cost} 积分\n余额: {balance} 积分\n\n使用 /topup 充值。',
  },
  'gen.generating': {
    id: '⏳ *Generating konten...*\n\nMohon tunggu ~30-60 detik 🚀',
    en: '⏳ *Generating content...*\n\nPlease wait ~30-60 seconds 🚀',
    ru: '⏳ *Генерируем контент...*\n\nПодождите ~30-60 секунд 🚀',
    zh: '⏳ *正在生成内容...*\n\n请等待约30-60秒 🚀',
  },
  'gen.scene_generating': {
    id: '🎨 Generating scene {n}/7: *{name}*...',
    en: '🎨 Generating scene {n}/7: *{name}*...',
    ru: '🎨 Генерация сцены {n}/7: *{name}*...',
    zh: '🎨 正在生成场景 {n}/7: *{name}*...',
  },
  'gen.all_scenes_failed': {
    id: '❌ Gagal generate semua scene. Kredit tidak ditagih.',
    en: '❌ All scenes failed to generate. No credits charged.',
    ru: '❌ Все сцены не удались. Кредиты не списаны.',
    zh: '❌ 所有场景生成失败。未扣费。',
  },
  'gen.video_queued': {
    id: '✅ Video masuk antrian #{position}\n\nKamu akan dinotifikasi saat selesai.',
    en: '✅ Video queued at #{position}\n\nYou\'ll be notified when ready.',
    ru: '✅ Видео в очереди #{position}\n\nМы уведомим вас, когда будет готово.',
    zh: '✅ 视频已排队 #{position}\n\n完成后会通知您。',
  },
  'gen.video_processing': {
    id: '✅ Video sedang diproses. Kamu akan dinotifikasi saat selesai.',
    en: '✅ Video is processing. You\'ll be notified when ready.',
    ru: '✅ Видео обрабатывается. Мы уведомим вас.',
    zh: '✅ 视频正在处理中，完成后会通知您。',
  },
  'gen.generation_failed': {
    id: '❌ Gagal generate. Coba lagi atau hubungi /support.',
    en: '❌ Generation failed. Try again or contact /support.',
    ru: '❌ Генерация не удалась. Попробуйте снова или обратитесь в /support.',
    zh: '❌ 生成失败。请重试或联系 /support。',
  },
  'gen.video_failed_refund': {
    id: '❌ Video gagal diproses. Kredit dikembalikan.',
    en: '❌ Video processing failed. Credits refunded.',
    ru: '❌ Обработка видео не удалась. Кредиты возвращены.',
    zh: '❌ 视频处理失败。积分已退还。',
  },
  'gen.campaign_processing': {
    id: '⏳ *Campaign {size} scene masuk antrian #{position}!*\n\n1 video dengan {size} hook berbeda.\nKamu akan dinotifikasi saat selesai.',
    en: '⏳ *Campaign {size} scenes queued at #{position}!*\n\n1 video with {size} different hooks.\nYou\'ll be notified when ready.',
    ru: '⏳ *Кампания {size} сцен в очереди #{position}!*\n\n1 видео с {size} разными хуками.\nМы уведомим вас.',
    zh: '⏳ *{size} 场景活动已排队 #{position}！*\n\n1个视频包含 {size} 个不同的开场。\n完成后会通知您。',
  },
  'gen.campaign_failed': {
    id: '❌ *Campaign Gagal*\n\nGagal membuat video. Kredit dikembalikan.',
    en: '❌ *Campaign Failed*\n\nFailed to create video. Credits refunded.',
    ru: '❌ *Кампания не удалась*\n\nНе удалось создать видео. Кредиты возвращены.',
    zh: '❌ *活动失败*\n\n创建视频失败。积分已退还。',
  },

  // Image preference
  'gen.image_pref_title': {
    id: '📸 *Foto Referensi*\n\nIngin menggunakan foto referensi untuk hasil yang lebih bagus?\n\n• Kirim foto untuk mode *Image-to-Video*\n• Atau skip untuk *Text-to-Video*',
    en: '📸 *Reference Photo*\n\nWant to use a reference photo for better results?\n\n• Send a photo for *Image-to-Video* mode\n• Or skip for *Text-to-Video*',
    ru: '📸 *Референсное фото*\n\nХотите использовать фото для лучших результатов?\n\n• Отправьте фото для режима *Image-to-Video*\n• Или пропустите для *Text-to-Video*',
    zh: '📸 *参考照片*\n\n想使用参考照片获得更好的效果吗？\n\n• 发送照片使用 *图生视频* 模式\n• 或跳过使用 *文生视频*',
  },
  'gen.btn_upload_ref': {
    id: '📸 Upload Foto Referensi',
    en: '📸 Upload Reference Photo',
    ru: '📸 Загрузить фото',
    zh: '📸 上传参考照片',
  },
  'gen.btn_skip_ref': {
    id: '🚀 Langsung Generate (Tanpa Foto)',
    en: '🚀 Generate Now (No Photo)',
    ru: '🚀 Создать сразу (без фото)',
    zh: '🚀 直接生成（无照片）',
  },

  // Prompt source
  'gen.prompt_source_title': {
    id: '📝 *Pilih Sumber Prompt*\n\nMau buat {action} dari mana?',
    en: '📝 *Choose Prompt Source*\n\nHow do you want to create your {action}?',
    ru: '📝 *Выберите источник промпта*\n\nОткуда создать {action}?',
    zh: '📝 *选择提示来源*\n\n想从哪里创建 {action}？',
  },
  'gen.btn_prompt_library': {
    id: '📚 Pilih dari Prompt Library',
    en: '📚 Choose from Prompt Library',
    ru: '📚 Выбрать из библиотеки',
    zh: '📚 从提示库选择',
  },
  'gen.btn_custom_prompt': {
    id: '✍️ Tulis Prompt Sendiri',
    en: '✍️ Write Custom Prompt',
    ru: '✍️ Написать свой промпт',
    zh: '✍️ 自定义提示',
  },
  'gen.custom_prompt_input': {
    id: '✍️ *Tulis Prompt Sendiri*\n\nKirim foto produk atau ketik deskripsi produk.\n\nOutput: {action}',
    en: '✍️ *Write Custom Prompt*\n\nSend a product photo or type a description.\n\nOutput: {action}',
    ru: '✍️ *Напишите свой промпт*\n\nОтправьте фото товара или введите описание.\n\nВывод: {action}',
    zh: '✍️ *自定义提示*\n\n发送产品照片或输入描述。\n\n输出: {action}',
  },

  // Confirm screen
  'gen.confirm_title': {
    id: '✅ *Konfirmasi Generate*',
    en: '✅ *Confirm Generation*',
    ru: '✅ *Подтверждение генерации*',
    zh: '✅ *确认生成*',
  },
  'gen.confirm_cost': {
    id: '💰 Biaya: **{cost} kredit**',
    en: '💰 Cost: **{cost} credits**',
    ru: '💰 Стоимость: **{cost} кредитов**',
    zh: '💰 费用: **{cost} 积分**',
  },
  'gen.btn_generate_now': {
    id: '✅ Generate Sekarang ({cost} kredit)',
    en: '✅ Generate Now ({cost} credits)',
    ru: '✅ Создать сейчас ({cost} кредитов)',
    zh: '✅ 立即生成（{cost} 积分）',
  },
  'gen.post_delivery': {
    id: '✨ *Konten berhasil dibuat!*\n\nMau apa selanjutnya?',
    en: '✨ *Content created!*\n\nWhat\'s next?',
    ru: '✨ *Контент создан!*\n\nЧто дальше?',
    zh: '✨ *内容已创建！*\n\n接下来做什么？',
  },

  // Smart mode
  'gen.smart_select_duration': {
    id: '🎯 *Smart Mode*\n\nPilih durasi video:',
    en: '🎯 *Smart Mode*\n\nSelect video duration:',
    ru: '🎯 *Smart Mode*\n\nВыберите длительность видео:',
    zh: '🎯 *智能模式*\n\n选择视频时长:',
  },

  // Buttons
  'btn.back': {
    id: '◀️ Kembali', en: '◀️ Back', ru: '◀️ Назад', zh: '◀️ 返回',
  },
  'btn.main_menu': {
    id: '🏠 Menu Utama', en: '🏠 Main Menu', ru: '🏠 Главное меню', zh: '🏠 主菜单',
  },
  'btn.topup': {
    id: '💳 Top Up Kredit', en: '💳 Top Up Credits', ru: '💳 Пополнить кредиты', zh: '💳 充值积分',
  },
  'btn.variation': {
    id: '🔄 Variasi Lain', en: '🔄 Another Variation', ru: '🔄 Ещё вариант', zh: '🔄 其他变体',
  },
  'btn.campaign': {
    id: '📦 Campaign', en: '📦 Campaign', ru: '📦 Кампания', zh: '📦 活动',
  },

  // Message handler
  'msg.photo_received': {
    id: '✅ *Foto referensi diterima!*\n\nMelanjutkan ke generate...',
    en: '✅ *Reference photo received!*\n\nContinuing to generate...',
    ru: '✅ *Референсное фото получено!*\n\nПродолжаем...',
    zh: '✅ *参考照片已收到！*\n\n继续生成...',
  },
  'msg.skip_photo': {
    id: '⏭️ Lanjut tanpa foto referensi.',
    en: '⏭️ Continuing without reference photo.',
    ru: '⏭️ Продолжаем без референсного фото.',
    zh: '⏭️ 不使用参考照片继续。',
  },
  'msg.send_photo_or_skip': {
    id: '📸 Kirim foto referensi atau ketik /skip untuk lanjut tanpa foto.',
    en: '📸 Send a reference photo or type /skip to continue without one.',
    ru: '📸 Отправьте референсное фото или /skip для продолжения без него.',
    zh: '📸 发送参考照片或输入 /skip 跳过。',
  },
  'msg.photo_too_small': {
    id: '❌ Foto terlalu kecil (min 10KB). Kirim foto dengan resolusi lebih tinggi.',
    en: '❌ Photo too small (min 10KB). Send a higher resolution photo.',
    ru: '❌ Фото слишком маленькое (мин. 10КБ). Отправьте в более высоком разрешении.',
    zh: '❌ 照片太小（最小10KB）。请发送更高分辨率的照片。',
  },
  'msg.photo_too_large': {
    id: '❌ Foto terlalu besar (maks 20MB). Kirim foto yang lebih kecil.',
    en: '❌ Photo too large (max 20MB). Send a smaller photo.',
    ru: '❌ Фото слишком большое (макс. 20МБ). Отправьте поменьше.',
    zh: '❌ 照片太大（最大20MB）。请发送较小的照片。',
  },

  // Topup
  'topup.payment_ready': {
    id: '💳 *Pembayaran Siap!*\n\nOrder: `{orderId}`\nMetode: *{method}*\n\nKlik tombol di bawah untuk menyelesaikan pembayaran.',
    en: '💳 *Payment Ready!*\n\nOrder: `{orderId}`\nMethod: *{method}*\n\nClick the button below to complete payment.',
    ru: '💳 *Оплата готова!*\n\nЗаказ: `{orderId}`\nМетод: *{method}*\n\nНажмите кнопку ниже для оплаты.',
    zh: '💳 *付款就绪！*\n\n订单: `{orderId}`\n方式: *{method}*\n\n点击下方按钮完成付款。',
  },
  'topup.btn_pay': {
    id: '💳 Bayar Sekarang', en: '💳 Pay Now', ru: '💳 Оплатить', zh: '💳 立即支付',
  },
  'topup.btn_paid': {
    id: '✅ Sudah Bayar', en: '✅ I\'ve Paid', ru: '✅ Я оплатил', zh: '✅ 已付款',
  },
  'topup.success': {
    id: '✅ *Pembayaran Berhasil!*\n\nKredit ditambahkan: {credits}\n\nTerima kasih! 🎉',
    en: '✅ *Payment Successful!*\n\nCredits added: {credits}\n\nThank you! 🎉',
    ru: '✅ *Оплата успешна!*\n\nДобавлено кредитов: {credits}\n\nСпасибо! 🎉',
    zh: '✅ *支付成功！*\n\n已添加积分: {credits}\n\n谢谢！🎉',
  },
  'topup.pending': {
    id: 'Pembayaran masih pending. Selesaikan pembayaran terlebih dahulu.',
    en: 'Payment still pending. Please complete payment first.',
    ru: 'Оплата ещё в ожидании. Сначала завершите оплату.',
    zh: '付款仍在处理中。请先完成付款。',
  },
  'topup.not_found': {
    id: '❌ Transaksi tidak ditemukan.',
    en: '❌ Transaction not found.',
    ru: '❌ Транзакция не найдена.',
    zh: '❌ 未找到交易。',
  },
  'topup.failed_status': {
    id: '❌ Status pembayaran: *{status}*. Hubungi /support jika sudah membayar.',
    en: '❌ Payment status: *{status}*. Contact /support if you already paid.',
    ru: '❌ Статус оплаты: *{status}*. Обратитесь в /support если уже оплатили.',
    zh: '❌ 付款状态: *{status}*。如已付款请联系 /support。',
  },
  'topup.create_failed': {
    id: '❌ Gagal membuat pembayaran. Coba lagi.',
    en: '❌ Failed to create payment. Try again.',
    ru: '❌ Не удалось создать платёж. Попробуйте снова.',
    zh: '❌ 创建支付失败。请重试。',
  },

  // Profile
  'profile.title': {
    id: '*Profil Kamu*', en: '*Your Profile*', ru: '*Ваш профиль*', zh: '*个人资料*',
  },
  // profile.tier and profile.credits already defined above
  'profile.videos_created': {
    id: 'Video Dibuat', en: 'Videos Created', ru: 'Видео создано', zh: '已创建视频',
  },
  'profile.referral_code': {
    id: 'Kode', en: 'Code', ru: 'Код', zh: '代码',
  },
  'profile.total_referrals': {
    id: 'Total Referral', en: 'Total Referrals', ru: 'Всего рефералов', zh: '总推荐数',
  },
  'profile.commission': {
    id: 'Komisi', en: 'Commission', ru: 'Комиссия', zh: '佣金',
  },
  'profile.total_spent': {
    id: 'Total', en: 'Total Spent', ru: 'Всего потрачено', zh: '总消费',
  },
  'profile.subscription_plan': {
    id: 'Plan', en: 'Plan', ru: 'Тариф', zh: '计划',
  },
  'profile.renews_in': {
    id: '{action} dalam: {days} hari',
    en: '{action} in: {days} days',
    ru: '{action} через: {days} дней',
    zh: '{action}还有: {days} 天',
  },

  // Videos
  'videos.copy_link': {
    id: '📋 *Link Download Video:*\n\n{url}\n\n_Tekan dan tahan link di atas untuk menyalin_',
    en: '📋 *Video Download Link:*\n\n{url}\n\n_Tap and hold the link above to copy_',
    ru: '📋 *Ссылка для скачивания:*\n\n{url}\n\n_Нажмите и удерживайте ссылку для копирования_',
    zh: '📋 *视频下载链接:*\n\n{url}\n\n_长按链接复制_',
  },
  'videos.not_found': {
    id: '❌ Video tidak ditemukan',
    en: '❌ Video not found',
    ru: '❌ Видео не найдено',
    zh: '❌ 视频未找到',
  },
  'videos.link_copied': {
    id: 'Link disalin!', en: 'Link copied!', ru: 'Ссылка скопирована!', zh: '链接已复制！',
  },

  // Worker notifications
  'worker.vo_failed': {
    id: '⚠️ Voice-over tidak dapat ditambahkan ke video ini. Video dikirim tanpa audio narasi.',
    en: '⚠️ Voice-over could not be added to this video. Video sent without narration.',
    ru: '⚠️ Озвучка не может быть добавлена. Видео отправлено без аудио.',
    zh: '⚠️ 无法添加语音旁白。视频已发送（无旁白）。',
  },
  'worker.partial_refund': {
    id: '💰 Refund: {amount} kredit dikembalikan untuk {count} scene yang gagal.',
    en: '💰 Refund: {amount} credits returned for {count} failed scene(s).',
    ru: '💰 Возврат: {amount} кредитов за {count} неудавшихся сцен.',
    zh: '💰 退款: {amount} 积分已退还（{count} 个场景失败）。',
  },

  // Common errors (error.generic already defined above)
  'error.no_session': {
    id: 'Tidak ada sesi pembuatan video aktif. Gunakan /create untuk mulai.',
    en: 'No active video creation session. Use /create to start.',
    ru: 'Нет активного сеанса создания видео. Используйте /create.',
    zh: '没有活动的视频创建会话。使用 /create 开始。',
  },
  'error.no_photos': {
    id: 'Belum ada foto. Kirim gambar referensi atau /skip.',
    en: 'No photos uploaded. Send a reference image or /skip.',
    ru: 'Фото не загружены. Отправьте референс или /skip.',
    zh: '尚未上传照片。发送参考图或 /skip。',
  },

  // Payment failure notification
  'payment.failed': {
    id: '❌ *Pembayaran Gagal*\n\nOrder: `{orderId}`\n\nSilakan coba lagi atau pilih metode pembayaran lain.',
    en: '❌ *Payment Failed*\n\nOrder: `{orderId}`\n\nPlease try again or choose a different payment method.',
    ru: '❌ *Оплата не удалась*\n\nЗаказ: `{orderId}`\n\nПопробуйте снова или выберите другой способ оплаты.',
    zh: '❌ *支付失败*\n\nOrder: `{orderId}`\n\n请重试或选择其他支付方式。',
  },
  'payment.expired': {
    id: '❌ *Pembayaran Kedaluwarsa*\n\nOrder: `{orderId}`\n\nSilakan coba lagi.',
    en: '❌ *Payment Expired*\n\nOrder: `{orderId}`\n\nPlease try again.',
    ru: '❌ *Оплата истекла*\n\nЗаказ: `{orderId}`\n\nПопробуйте снова.',
    zh: '❌ *支付已过期*\n\nOrder: `{orderId}`\n\n请重试。',
  },
  'payment.crypto_success': {
    id: '✅ *Pembayaran Crypto Berhasil!*\n\n💰 {amount} {coin} diterima\n🎬 Kredit sudah ditambahkan ke akun kamu\n\nGunakan /create untuk buat video sekarang! 🚀',
    en: '✅ *Crypto Payment Confirmed!*\n\n💰 {amount} {coin} received\n🎬 Credits added to your account\n\nUse /create to generate your video now! 🚀',
    ru: '✅ *Крипто-оплата подтверждена!*\n\n💰 {amount} {coin} получено\n🎬 Кредиты добавлены\n\nИспользуйте /create для создания видео! 🚀',
    zh: '✅ *加密支付成功！*\n\n💰 {amount} {coin} 已收到\n🎬 积分已添加到您的账户\n\n使用 /create 开始制作视频！🚀',
  },

  // ---------------------------------------------------------------------------
  // Callback / General Errors
  // ---------------------------------------------------------------------------
  'cb.transfer_cancelled': {
    id: '❌ Transfer dibatalkan.',
    en: '❌ Transfer cancelled.',
    ru: '❌ Перевод отменён.',
    zh: '❌ 转账已取消。',
  },
  'cb.transfer_failed': {
    id: '❌ *Transfer Gagal:* {error}',
    en: '❌ *Transfer Failed:* {error}',
    ru: '❌ *Перевод не удался:* {error}',
    zh: '❌ *转账失败:* {error}',
  },
  'cb.transfer_error': {
    id: '❌ *Transfer Error:* {error}',
    en: '❌ *Transfer Error:* {error}',
    ru: '❌ *Ошибка перевода:* {error}',
    zh: '❌ *转账错误:* {error}',
  },
  'cb.access_denied': {
    id: '❌ Akses ditolak.',
    en: '❌ Access denied.',
    ru: '❌ Доступ запрещён.',
    zh: '❌ 访问被拒绝。',
  },
  'cb.access_denied_video': {
    id: '❌ Akses ditolak atau video tidak ditemukan.',
    en: '❌ Access denied or video not found.',
    ru: '❌ Доступ запрещён или видео не найдено.',
    zh: '❌ 访问被拒绝或视频未找到。',
  },
  'cb.clone_data_missing': {
    id: '❌ Data clone tidak ditemukan. Silakan mulai ulang.',
    en: '❌ Clone data not found. Please start over.',
    ru: '❌ Данные клонирования не найдены. Начните заново.',
    zh: '❌ 未找到克隆数据。请重新开始。',
  },
  'cb.analysis_data_missing': {
    id: '❌ Data analisis tidak ditemukan. Silakan mulai ulang.',
    en: '❌ Analysis data not found. Please start over.',
    ru: '❌ Данные анализа не найдены. Начните заново.',
    zh: '❌ 未找到分析数据。请重新开始。',
  },
  'cb.insufficient_credits_cost': {
    id: '❌ Kredit tidak cukup. Butuh {cost} kredit.',
    en: '❌ Insufficient credits. Need {cost} credits.',
    ru: '❌ Недостаточно кредитов. Нужно {cost} кредитов.',
    zh: '❌ 积分不足。需要 {cost} 积分。',
  },
  'cb.video_process_failed_refund': {
    id: '❌ Gagal memproses video. Kredit dikembalikan.',
    en: '❌ Failed to process video. Credits refunded.',
    ru: '❌ Не удалось обработать видео. Кредиты возвращены.',
    zh: '❌ 视频处理失败。积分已退还。',
  },
  'cb.user_not_found_start': {
    id: '❌ User tidak ditemukan. Silakan /start ulang.',
    en: '❌ User not found. Please /start again.',
    ru: '❌ Пользователь не найден. Используйте /start.',
    zh: '❌ 用户未找到。请重新 /start。',
  },
  'cb.prompt_not_found': {
    id: '❌ Prompt tidak ditemukan.',
    en: '❌ Prompt not found.',
    ru: '❌ Промпт не найден.',
    zh: '❌ 未找到提示词。',
  },
  'cb.video_not_found_url': {
    id: '❌ Video tidak ditemukan atau tidak ada URL.',
    en: '❌ Video not found or has no URL.',
    ru: '❌ Видео не найдено или нет URL.',
    zh: '❌ 视频未找到或没有链接。',
  },
  'cb.unknown_action': {
    id: 'Aksi tidak dikenali.',
    en: 'Unknown action.',
    ru: 'Неизвестное действие.',
    zh: '未知操作。',
  },
  'cb.storyboard_failed': {
    id: 'Gagal membuat storyboard. Coba lagi.',
    en: 'Failed to create storyboard. Try again.',
    ru: 'Не удалось создать раскадровку. Попробуйте снова.',
    zh: '创建分镜头失败。请重试。',
  },
  'cb.caption_failed': {
    id: 'Gagal membuat caption. Silakan coba lagi.',
    en: 'Failed to create caption. Please try again.',
    ru: 'Не удалось создать подпись. Попробуйте снова.',
    zh: '创建文案失败。请重试。',
  },
  'cb.video_not_found_create': {
    id: 'Video tidak ditemukan. Gunakan /create untuk mulai.',
    en: 'Video not found. Use /create to start.',
    ru: 'Видео не найдено. Используйте /create.',
    zh: '视频未找到。使用 /create 开始。',
  },
  'cb.processing_transfer': {
    id: 'Memproses transfer...',
    en: 'Processing transfer...',
    ru: 'Обработка перевода...',
    zh: '正在处理转账...',
  },
  'cb.retrying_video': {
    id: 'Mencoba ulang video...',
    en: 'Retrying video...',
    ru: 'Повторная генерация видео...',
    zh: '正在重试视频...',
  },
  'cb.caption_copied': {
    id: 'Caption disalin di bawah!',
    en: 'Caption copied below!',
    ru: 'Подпись скопирована ниже!',
    zh: '文案已复制到下方！',
  },
  'cb.loading_video_settings': {
    id: 'Memuat pengaturan video...',
    en: 'Loading video settings...',
    ru: 'Загрузка настроек видео...',
    zh: '正在加载视频设置...',
  },
  'cb.select_platform_min': {
    id: 'Pilih minimal satu platform.',
    en: 'Select at least one platform.',
    ru: 'Выберите хотя бы одну платформу.',
    zh: '请至少选择一个平台。',
  },
  'cb.publishing_all': {
    id: 'Mempublikasikan ke semua akun...',
    en: 'Publishing to all accounts...',
    ru: 'Публикация во все аккаунты...',
    zh: '正在发布到所有账号...',
  },
  'cb.account_disconnected': {
    id: '✅ Akun terputus.',
    en: '✅ Account disconnected.',
    ru: '✅ Аккаунт отключён.',
    zh: '✅ 账号已断开。',
  },

  // ---------------------------------------------------------------------------
  // Referral / Commission
  // ---------------------------------------------------------------------------
  'referral.insufficient_commission_credits': {
    id: '❌ Komisi tidak cukup untuk ditukar ke kredit.',
    en: '❌ Insufficient commission to convert to credits.',
    ru: '❌ Недостаточно комиссии для конвертации в кредиты.',
    zh: '❌ 佣金不足，无法兑换积分。',
  },
  'referral.insufficient_commission_sell': {
    id: '❌ Komisi tidak cukup untuk dijual.',
    en: '❌ Insufficient commission to sell.',
    ru: '❌ Недостаточно комиссии для продажи.',
    zh: '❌ 佣金不足，无法出售。',
  },
  'referral.withdrawal_load_failed': {
    id: '❌ Gagal memuat info withdrawal. Coba lagi.',
    en: '❌ Failed to load withdrawal info. Try again.',
    ru: '❌ Не удалось загрузить данные о выводе. Попробуйте снова.',
    zh: '❌ 加载提现信息失败。请重试。',
  },
  'referral.convert_failed': {
    id: '❌ Gagal konversi. Coba lagi.',
    en: '❌ Conversion failed. Try again.',
    ru: '❌ Конвертация не удалась. Попробуйте снова.',
    zh: '❌ 兑换失败。请重试。',
  },
  'referral.cashout_failed': {
    id: '❌ Gagal memproses cashout. Coba lagi.',
    en: '❌ Failed to process cashout. Try again.',
    ru: '❌ Не удалось обработать вывод. Попробуйте снова.',
    zh: '❌ 提现处理失败。请重试。',
  },
  'referral.load_failed': {
    id: '❌ Gagal memuat info referral. Coba lagi.',
    en: '❌ Unable to load referral info. Please try again.',
    ru: '❌ Не удалось загрузить реферальную информацию. Попробуйте снова.',
    zh: '❌ 无法加载推荐信息。请重试。',
  },

  // ---------------------------------------------------------------------------
  // Prompts
  // ---------------------------------------------------------------------------
  'prompt.library_load_failed': {
    id: '❌ Gagal load prompt library. Coba lagi.',
    en: '❌ Failed to load prompt library. Try again.',
    ru: '❌ Не удалось загрузить библиотеку промптов. Попробуйте снова.',
    zh: '❌ 加载提示库失败。请重试。',
  },
  'prompt.niche_not_found': {
    id: '❌ Niche tidak ditemukan.',
    en: '❌ Niche not found.',
    ru: '❌ Ниша не найдена.',
    zh: '❌ 未找到该类别。',
  },
  'prompt.daily_load_failed': {
    id: '❌ Gagal load daily prompt. Coba lagi.',
    en: '❌ Failed to load daily prompt. Try again.',
    ru: '❌ Не удалось загрузить ежедневный промпт. Попробуйте снова.',
    zh: '❌ 加载每日提示失败。请重试。',
  },
  'prompt.trending_load_failed': {
    id: '❌ Gagal load trending. Coba lagi.',
    en: '❌ Failed to load trending. Try again.',
    ru: '❌ Не удалось загрузить тренды. Попробуйте снова.',
    zh: '❌ 加载热门趋势失败。请重试。',
  },
  'prompt.fingerprint_load_failed': {
    id: '❌ Gagal load fingerprint. Coba lagi.',
    en: '❌ Failed to load fingerprint. Try again.',
    ru: '❌ Не удалось загрузить отпечаток. Попробуйте снова.',
    zh: '❌ 加载特征指纹失败。请重试。',
  },
  'prompt.saved_load_failed': {
    id: '❌ Gagal load prompt tersimpan.',
    en: '❌ Failed to load saved prompts.',
    ru: '❌ Не удалось загрузить сохранённые промпты.',
    zh: '❌ 加载已保存的提示失败。',
  },
  'prompt.deleted': {
    id: '🗑️ Prompt dihapus!',
    en: '🗑️ Prompt deleted!',
    ru: '🗑️ Промпт удалён!',
    zh: '🗑️ 提示已删除！',
  },
  'prompt.saved_to_session': {
    id: '💾 Prompt disimpan ke sesi kamu!',
    en: '💾 Prompt saved to your session!',
    ru: '💾 Промпт сохранён в вашу сессию!',
    zh: '💾 提示已保存到您的会话！',
  },
  'prompt.save_failed': {
    id: '❌ Gagal menyimpan. Coba lagi.',
    en: '❌ Failed to save. Try again.',
    ru: '❌ Не удалось сохранить. Попробуйте снова.',
    zh: '❌ 保存失败。请重试。',
  },
  'prompt.btn_create_video_hpas': {
    id: '🎥 Buat Video (HPAS V3)',
    en: '🎥 Create Video (HPAS V3)',
    ru: '🎥 Создать видео (HPAS V3)',
    zh: '🎥 创建视频 (HPAS V3)',
  },
  'prompt.btn_generate_image': {
    id: '🖼️ Generate Gambar (Text-to-Image)',
    en: '🖼️ Generate Image (Text-to-Image)',
    ru: '🖼️ Создать изображение (Text-to-Image)',
    zh: '🖼️ 生成图片 (文本转图片)',
  },
  'prompt.btn_generate_i2i': {
    id: '📸 Generate Gambar + Foto Referensi (i2i)',
    en: '📸 Generate Image + Reference Photo (i2i)',
    ru: '📸 Создать изображение + Фото-референс (i2i)',
    zh: '📸 生成图片 + 参考照片 (i2i)',
  },
  'prompt.btn_edit_prompt': {
    id: '✏️ Edit Prompt Dulu',
    en: '✏️ Edit Prompt First',
    ru: '✏️ Сначала отредактировать промпт',
    zh: '✏️ 先编辑提示词',
  },
  'prompt.btn_pick_another': {
    id: '◀️ Pilih Prompt Lain',
    en: '◀️ Pick Another Prompt',
    ru: '◀️ Выбрать другой промпт',
    zh: '◀️ 选择其他提示词',
  },
  'prompt.options_label': {
    id: '🎬 *Opsi:*',
    en: '🎬 *Options:*',
    ru: '🎬 *Варианты:*',
    zh: '🎬 *选项:*',
  },
  'prompt.selected': {
    id: '✅ *Prompt Dipilih!*',
    en: '✅ *Prompt Selected!*',
    ru: '✅ *Промпт выбран!*',
    zh: '✅ *已选择提示词！*',
  },
  'prompt.cost_credit': {
    id: '💳 Biaya: {cost} kredit (sisa: {balance})',
    en: '💳 Cost: {cost} credits (remaining: {balance})',
    ru: '💳 Стоимость: {cost} кредитов (остаток: {balance})',
    zh: '💳 费用: {cost} 积分 (余额: {balance})',
  },
  'prompt.cost_bonus': {
    id: '🎁 Menggunakan: {bonusType}',
    en: '🎁 Using: {bonusType}',
    ru: '🎁 Используется: {bonusType}',
    zh: '🎁 使用: {bonusType}',
  },
  'prompt.image_success': {
    id: '✅ *Gambar Berhasil!*',
    en: '✅ *Image Generated!*',
    ru: '✅ *Изображение создано!*',
    zh: '✅ *图片生成成功！*',
  },
  'prompt.balance_credit': {
    id: '💳 Sisa kredit: {balance}',
    en: '💳 Remaining credits: {balance}',
    ru: '💳 Остаток кредитов: {balance}',
    zh: '💳 剩余积分: {balance}',
  },
  'prompt.balance_bonus_used': {
    id: '🎁 {bonusType} digunakan',
    en: '🎁 {bonusType} used',
    ru: '🎁 {bonusType} использован',
    zh: '🎁 {bonusType} 已使用',
  },
  'prompt.like_result': {
    id: 'Suka hasilnya? Generate lebih banyak!',
    en: 'Like the result? Generate more!',
    ru: 'Нравится результат? Создавайте ещё!',
    zh: '喜欢结果？生成更多！',
  },
  'prompt.btn_generate_again': {
    id: '🔄 Generate Lagi',
    en: '🔄 Generate Again',
    ru: '🔄 Создать ещё',
    zh: '🔄 再次生成',
  },
  'prompt.btn_buy_credits': {
    id: '💰 Beli Kredit',
    en: '💰 Buy Credits',
    ru: '💰 Купить кредиты',
    zh: '💰 购买积分',
  },
  'prompt.btn_main_menu': {
    id: '🏠 Menu Utama',
    en: '🏠 Main Menu',
    ru: '🏠 Главное меню',
    zh: '🏠 主菜单',
  },
  'prompt.btn_try_again': {
    id: '🔄 Coba Lagi',
    en: '🔄 Try Again',
    ru: '🔄 Попробовать снова',
    zh: '🔄 重试',
  },
  'prompt.generation_failed': {
    id: '❌ *Generation Gagal*\n\nTerjadi error saat generate image.\nBonus Anda tidak terpakai.\n\nSilakan coba lagi atau hubungi support.',
    en: '❌ *Generation Failed*\n\nAn error occurred during image generation.\nYour bonus was not used.\n\nPlease try again or contact support.',
    ru: '❌ *Генерация не удалась*\n\nПроизошла ошибка при создании изображения.\nВаш бонус не был использован.\n\nПопробуйте снова или обратитесь в поддержку.',
    zh: '❌ *生成失败*\n\n生成图片时出错。\n您的奖励未被使用。\n\n请重试或联系支持。',
  },
  'prompt.free_trial_exhausted': {
    id: '⚠️ *Free Trial sudah habis!*\n\nWelcome Bonus: ❌ Sudah digunakan\nDaily Free: ❌ Belum reset\n\nBeli kredit untuk melanjutkan.',
    en: '⚠️ *Free Trial Exhausted!*\n\nWelcome Bonus: ❌ Already used\nDaily Free: ❌ Not yet reset\n\nBuy credits to continue.',
    ru: '⚠️ *Пробный период исчерпан!*\n\nПриветственный бонус: ❌ Уже использован\nЕжедневный бесплатный: ❌ Ещё не сброшен\n\nКупите кредиты для продолжения.',
    zh: '⚠️ *免费试用已用完！*\n\n欢迎奖励: ❌ 已使用\n每日免费: ❌ 未重置\n\n购买积分以继续。',
  },
  'prompt.btn_back': {
    id: '◀️ Kembali',
    en: '◀️ Back',
    ru: '◀️ Назад',
    zh: '◀️ 返回',
  },
  'prompt.generating': {
    id: '⏳ *Generating...*\n\n📋 {name}\n💳 Menggunakan: {cost}\n\nMohon tunggu 10-30 detik...',
    en: '⏳ *Generating...*\n\n📋 {name}\n💳 Using: {cost}\n\nPlease wait 10-30 seconds...',
    ru: '⏳ *Генерация...*\n\n📋 {name}\n💳 Используется: {cost}\n\nПожалуйста, подождите 10-30 секунд...',
    zh: '⏳ *生成中...*\n\n📋 {name}\n💳 使用: {cost}\n\n请等待10-30秒...',
  },
  'prompt.btn_pick_niche': {
    id: '◀️ Pilih Niche Lain',
    en: '◀️ Pick Another Niche',
    ru: '◀️ Выбрать другую нишу',
    zh: '◀️ 选择其他类别',
  },
  'prompt.edit_prompt_msg': {
    id: '✏️ *Edit Prompt*\n\nPrompt saat ini:\n`{prompt}`\n\nKetik prompt baru atau modifikasi di atas, lalu kirim.\nAtau kirim foto produk + teks untuk mengganti prompt.',
    en: '✏️ *Edit Prompt*\n\nCurrent prompt:\n`{prompt}`\n\nType a new prompt or modify the above, then send.\nOr send a product photo + text to replace the prompt.',
    ru: '✏️ *Редактировать промпт*\n\nТекущий промпт:\n`{prompt}`\n\nВведите новый промпт или измените текущий, затем отправьте.\nИли отправьте фото продукта + текст для замены промпта.',
    zh: '✏️ *编辑提示词*\n\n当前提示词:\n`{prompt}`\n\n输入新的提示词或修改以上内容，然后发送。\n或发送产品照片+文字来替换提示词。',
  },

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------
  'sub.start_first': {
    id: '❌ Silakan /start terlebih dahulu untuk menggunakan fitur ini.',
    en: '❌ Please /start first to use this feature.',
    ru: '❌ Сначала используйте /start для доступа к этой функции.',
    zh: '❌ 请先 /start 以使用此功能。',
  },
  'sub.payment_create_failed': {
    id: '❌ Gagal membuat pembayaran. Coba lagi.',
    en: '❌ Failed to create payment. Please try again.',
    ru: '❌ Не удалось создать платёж. Попробуйте снова.',
    zh: '❌ 创建支付失败。请重试。',
  },
  'sub.cancel_failed': {
    id: '❌ Gagal membatalkan. Coba lagi.',
    en: '❌ Failed to cancel. Please try again.',
    ru: '❌ Не удалось отменить. Попробуйте снова.',
    zh: '❌ 取消失败。请重试。',
  },
  'sub.creating_payment': {
    id: 'Membuat pembayaran...',
    en: 'Creating payment...',
    ru: 'Создание платежа...',
    zh: '正在创建支付...',
  },
  'sub.processing': {
    id: 'Memproses...',
    en: 'Processing...',
    ru: 'Обработка...',
    zh: '处理中...',
  },

  // ---------------------------------------------------------------------------
  // Topup (remaining)
  // ---------------------------------------------------------------------------
  'topup.process_failed': {
    id: '❌ Gagal memproses. Coba lagi.',
    en: '❌ Failed to process. Please try again.',
    ru: '❌ Не удалось обработать. Попробуйте снова.',
    zh: '❌ 处理失败。请重试。',
  },
  'topup.invalid_package': {
    id: '❌ Paket tidak valid.',
    en: '❌ Invalid package.',
    ru: '❌ Недействительный пакет.',
    zh: '❌ 无效的套餐。',
  },
  'topup.stars_invoice_failed': {
    id: '❌ Gagal membuat invoice Stars. Coba lagi.',
    en: '❌ Failed to create Stars invoice. Please try again.',
    ru: '❌ Не удалось создать Stars-счёт. Попробуйте снова.',
    zh: '❌ 创建 Stars 发票失败。请重试。',
  },
  'topup.crypto_payment_failed': {
    id: '❌ Gagal membuat pembayaran crypto. Coba lagi.',
    en: '❌ Failed to create crypto payment. Please try again.',
    ru: '❌ Не удалось создать крипто-платёж. Попробуйте снова.',
    zh: '❌ 创建加密支付失败。请重试。',
  },
  'topup.something_wrong': {
    id: '❌ Terjadi kesalahan. Coba lagi.',
    en: '❌ Something went wrong. Please try again.',
    ru: '❌ Что-то пошло не так. Попробуйте снова.',
    zh: '❌ 出了点问题。请重试。',
  },
  'topup.creating_crypto': {
    id: 'Membuat pembayaran crypto...',
    en: 'Creating crypto payment...',
    ru: 'Создание крипто-платежа...',
    zh: '正在创建加密支付...',
  },

  // ---------------------------------------------------------------------------
  // Video Uploader / Analyzer
  // ---------------------------------------------------------------------------
  'uploader.no_media': {
    id: '❌ Media tidak ditemukan. Kirim video atau gambar.',
    en: '❌ No media found. Please send a video or image.',
    ru: '❌ Медиа не найдено. Отправьте видео или изображение.',
    zh: '❌ 未找到媒体。请发送视频或图片。',
  },
  'uploader.analyzing': {
    id: '⏳ *Menganalisis...*\nMengekstrak prompt dari media kamu...',
    en: '⏳ *Analyzing...*\nExtracting prompt from your media...',
    ru: '⏳ *Анализируем...*\nИзвлекаем промпт из вашего медиа...',
    zh: '⏳ *分析中...*\n正在从您的媒体中提取提示词...',
  },
  'uploader.analysis_failed': {
    id: '❌ Gagal menganalisis media. Coba lagi.',
    en: '❌ Failed to analyze media. Please try again.',
    ru: '❌ Не удалось проанализировать медиа. Попробуйте снова.',
    zh: '❌ 媒体分析失败。请重试。',
  },
  'uploader.analyzing_photos': {
    id: 'Menganalisis {count} foto dengan AI Vision...',
    en: 'Analyzing {count} photo(s) with AI Vision...',
    ru: 'Анализируем {count} фото с AI Vision...',
    zh: '正在使用 AI Vision 分析 {count} 张照片...',
  },
  'uploader.no_active_creation': {
    id: '❌ Tidak ada pembuatan video aktif. Mulai dengan /create',
    en: '❌ No active video creation. Please start with /create',
    ru: '❌ Нет активного создания видео. Начните с /create',
    zh: '❌ 没有进行中的视频创建。请使用 /create 开始',
  },

  // ---------------------------------------------------------------------------
  // Social / Send / Transfer
  // ---------------------------------------------------------------------------
  'social.unable_identify_user': {
    id: '❌ Tidak dapat mengidentifikasi pengguna.',
    en: '❌ Unable to identify user.',
    ru: '❌ Невозможно идентифицировать пользователя.',
    zh: '❌ 无法识别用户。',
  },
  'social.invalid_recipient_id': {
    id: '❌ Format ID penerima tidak valid.',
    en: '❌ Invalid recipient ID format.',
    ru: '❌ Неверный формат ID получателя.',
    zh: '❌ 接收者 ID 格式无效。',
  },
  'social.amount_positive': {
    id: '❌ Jumlah harus angka positif.',
    en: '❌ Amount must be a positive number.',
    ru: '❌ Сумма должна быть положительным числом.',
    zh: '❌ 金额必须为正数。',
  },
  'social.transfer_failed': {
    id: '❌ Transfer Gagal: {error}',
    en: '❌ Transfer Failed: {error}',
    ru: '❌ Перевод не удался: {error}',
    zh: '❌ 转账失败: {error}',
  },
  'social.send_usage': {
    id: 'Penggunaan: /send <id_telegram_penerima> <jumlah>\nContoh: /send 123456789 50',
    en: 'Usage: /send <recipient_telegram_id> <amount>\nExample: /send 123456789 50',
    ru: 'Использование: /send <telegram_id_получателя> <сумма>\nПример: /send 123456789 50',
    zh: '用法: /send <收件人telegram_id> <金额>\n示例: /send 123456789 50',
  },

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------
  'misc.coming_soon': {
    id: '🚧 Fitur segera hadir!',
    en: '🚧 Feature coming soon!',
    ru: '🚧 Функция скоро появится!',
    zh: '🚧 功能即将推出！',
  },
  'misc.ads_report_failed': {
    id: '❌ Gagal menarik laporan.',
    en: '❌ Failed to fetch report.',
    ru: '❌ Не удалось получить отчёт.',
    zh: '❌ 获取报告失败。',
  },
  'misc.ads_ideas_failed': {
    id: '❌ Gagal generate ide.',
    en: '❌ Failed to generate ideas.',
    ru: '❌ Не удалось сгенерировать идеи.',
    zh: '❌ 生成创意失败。',
  },
  'misc.avatar_not_found': {
    id: 'Avatar tidak ditemukan.',
    en: 'Avatar not found.',
    ru: 'Аватар не найден.',
    zh: '未找到头像。',
  },
  'misc.avatar_set_default': {
    id: '✅ Avatar ditetapkan sebagai default!',
    en: '✅ Avatar set as default!',
    ru: '✅ Аватар установлен по умолчанию!',
    zh: '✅ 头像已设为默认！',
  },
  'misc.user_not_found': {
    id: 'Error: pengguna tidak ditemukan.',
    en: 'Error: user not found.',
    ru: 'Ошибка: пользователь не найден.',
    zh: '错误：用户未找到。',
  },
  'misc.share_coming_soon': {
    id: 'Fitur share segera hadir!',
    en: 'Share feature coming soon!',
    ru: 'Функция поделиться скоро появится!',
    zh: '分享功能即将推出！',
  },

  // ---------------------------------------------------------------------------
  // Profile (remaining)
  // ---------------------------------------------------------------------------
  'profile.load_failed': {
    id: 'Gagal memuat profil. Coba lagi.',
    en: 'Unable to load profile. Please try again.',
    ru: 'Не удалось загрузить профиль. Попробуйте снова.',
    zh: '无法加载个人资料。请重试。',
  },
  'profile.load_error': {
    id: 'Gagal memuat profil. Coba lagi nanti.',
    en: 'Failed to load profile. Please try again later.',
    ru: 'Не удалось загрузить профиль. Попробуйте позже.',
    zh: '加载个人资料失败。请稍后重试。',
  },
  'profile.no_account': {
    id: 'Kamu belum punya akun. Gunakan /start untuk mendaftar terlebih dahulu.',
    en: 'You don\'t have an account yet. Please use /start to register first.',
    ru: 'У вас ещё нет аккаунта. Используйте /start для регистрации.',
    zh: '您还没有账号。请先使用 /start 注册。',
  },

  // ---------------------------------------------------------------------------
  // Message handler state strings
  // ---------------------------------------------------------------------------
  'msg.invalid_duration': {
    id: '❌ Durasi harus antara 6 sampai 300 detik.',
    en: '❌ Duration must be between 6 and 300 seconds.',
    ru: '❌ Длительность должна быть от 6 до 300 секунд.',
    zh: '❌ 时长必须在6到300秒之间。',
  },
  'msg.save_prompt_failed': {
    id: '❌ Gagal menyimpan prompt. Coba lagi.',
    en: '❌ Failed to save prompt. Try again.',
    ru: '❌ Не удалось сохранить промпт. Попробуйте снова.',
    zh: '❌ 保存提示失败。请重试。',
  },
  'msg.send_prompt_or_create': {
    id: 'Kirim prompt atau gunakan /create untuk mulai ulang.',
    en: 'Send a prompt or use /create to start over.',
    ru: 'Отправьте промпт или используйте /create чтобы начать заново.',
    zh: '发送提示或使用 /create 重新开始。',
  },
  'msg.invalid_account_id': {
    id: '❌ ID Akun PostBridge tidak valid.',
    en: '❌ Invalid PostBridge Account ID.',
    ru: '❌ Недействительный ID аккаунта PostBridge.',
    zh: '❌ PostBridge 账户ID无效。',
  },
  'msg.avatar_lost': {
    id: '❌ Avatar hilang. Silakan mulai ulang.',
    en: '❌ Avatar image lost. Please start over.',
    ru: '❌ Изображение аватара потеряно. Начните заново.',
    zh: '❌ 头像图片丢失。请重新开始。',
  },
  'msg.analyzing_avatar': {
    id: '⏳ *Menganalisis avatar...*',
    en: '⏳ *Analyzing avatar...*',
    ru: '⏳ *Анализируем аватар...*',
    zh: '⏳ *正在分析头像...*',
  },
  'msg.send_video_or_url': {
    id: '❌ Kirim video atau URL video.',
    en: '❌ Please send a video or video URL.',
    ru: '❌ Отправьте видео или ссылку на видео.',
    zh: '❌ 请发送视频或视频链接。',
  },
  'msg.clone_not_found': {
    id: '❌ Data clone tidak ditemukan. Silakan mulai ulang.',
    en: '❌ Clone data not found. Please start over.',
    ru: '❌ Данные клонирования не найдены. Начните заново.',
    zh: '❌ 未找到克隆数据。请重新开始。',
  },
  'msg.send_image_or_url': {
    id: '❌ Kirim gambar atau URL gambar.',
    en: '❌ Please send an image or image URL.',
    ru: '❌ Отправьте изображение или ссылку на изображение.',
    zh: '❌ 请发送图片或图片链接。',
  },
  'msg.image_analyze_failed': {
    id: '❌ Gagal menganalisa gambar. Silakan coba lagi.',
    en: '❌ Failed to analyze image. Please try again.',
    ru: '❌ Не удалось проанализировать изображение. Попробуйте снова.',
    zh: '❌ 图片分析失败。请重试。',
  },
  'msg.unable_identify': {
    id: '❌ Tidak dapat mengidentifikasi user.',
    en: '❌ Unable to identify user.',
    ru: '❌ Не удалось определить пользователя.',
    zh: '❌ 无法识别用户。',
  },
  'msg.credits_refunded': {
    id: '{message}\n\nKredit dikembalikan.',
    en: '{message}\n\nCredits refunded.',
    ru: '{message}\n\nКредиты возвращены.',
    zh: '{message}\n\n积分已退还。',
  },

  // ---------------------------------------------------------------------------
  // 3-Mode system (Basic/Smart/Pro)
  // ---------------------------------------------------------------------------
  'gen.basic_send_input': {
    id: '📸 *Mode Basic — Full Auto*\n\nKirim foto produk, teks deskripsi, atau keduanya.\nAI akan handle semuanya secara otomatis!',
    en: '📸 *Basic Mode — Full Auto*\n\nSend a product photo, text description, or both.\nAI will handle everything automatically!',
    ru: '📸 *Базовый режим — полный автомат*\n\nОтправьте фото товара, текст или и то, и другое.\nAI сделает всё автоматически!',
    zh: '📸 *基础模式 — 全自动*\n\n发送产品照片、文字描述或两者兼备。\nAI会自动处理一切！',
  },
  'gen.basic_auto_detected': {
    id: '🤖 Auto: Industri {industry} | Platform TikTok | 30 detik',
    en: '🤖 Auto: Industry {industry} | Platform TikTok | 30s',
    ru: '🤖 Авто: Отрасль {industry} | TikTok | 30 секунд',
    zh: '🤖 自动: 行业 {industry} | TikTok | 30秒',
  },
  'gen.multi_image_title': {
    id: '📸 *Upload Gambar ({n}/{total})*\n\nKirim foto satu per satu untuk setiap scene.',
    en: '📸 *Upload Images ({n}/{total})*\n\nSend photos one by one for each scene.',
    ru: '📸 *Загрузить фото ({n}/{total})*\n\nОтправляйте фото по одному для каждой сцены.',
    zh: '📸 *上传图片 ({n}/{total})*\n\n逐一发送每个场景的照片。',
  },
  'gen.multi_image_received': {
    id: '✅ Foto {n}/{total} diterima!',
    en: '✅ Photo {n}/{total} received!',
    ru: '✅ Фото {n}/{total} получено!',
    zh: '✅ 照片 {n}/{total} 已收到！',
  },
  'gen.btn_complete_ai': {
    id: '🤖 Lengkapi Sisa dengan AI', en: '🤖 Complete Rest with AI',
    ru: '🤖 Дополнить остальное AI', zh: '🤖 AI补充剩余',
  },
  'gen.btn_skip_images': {
    id: '⏭️ Lewati (AI Generate Semua)', en: '⏭️ Skip (AI Generates All)',
    ru: '⏭️ Пропустить (AI создаст все)', zh: '⏭️ 跳过（AI生成全部）',
  },
  'gen.storyboard_choice': {
    id: '📋 *Storyboard*\n\nPilih cara membuat storyboard:',
    en: '📋 *Storyboard*\n\nChoose how to create storyboard:',
    ru: '📋 *Раскадровка*\n\nВыберите способ создания:',
    zh: '📋 *分镜*\n\n选择创建分镜的方式:',
  },
  'gen.btn_storyboard_auto': {
    id: '🤖 Auto-Generate Storyboard', en: '🤖 Auto-Generate Storyboard',
    ru: '🤖 Авто-генерация', zh: '🤖 自动生成分镜',
  },
  'gen.btn_storyboard_manual': {
    id: '✍️ Tulis Storyboard Manual', en: '✍️ Write Storyboard Manually',
    ru: '✍️ Написать вручную', zh: '✍️ 手动编写分镜',
  },
  'gen.storyboard_edit_scene': {
    id: '📋 *Scene {n}: {name}*\n\nTulis deskripsi scene ini:',
    en: '📋 *Scene {n}: {name}*\n\nWrite description for this scene:',
    ru: '📋 *Сцена {n}: {name}*\n\nОпишите эту сцену:',
    zh: '📋 *场景 {n}: {name}*\n\n请描述此场景:',
  },
  'gen.storyboard_scene_saved': {
    id: '✅ Scene {n} disimpan! ({remaining} tersisa)',
    en: '✅ Scene {n} saved! ({remaining} remaining)',
    ru: '✅ Сцена {n} сохранена! (осталось {remaining})',
    zh: '✅ 场景 {n} 已保存！（还剩 {remaining}）',
  },
  'gen.transcript_choice': {
    id: '🎤 *Voice-Over Script*\n\nPilih cara membuat narasi:',
    en: '🎤 *Voice-Over Script*\n\nChoose how to create narration:',
    ru: '🎤 *Озвучка*\n\nВыберите способ создания:',
    zh: '🎤 *旁白脚本*\n\n选择创建旁白的方式:',
  },
  'gen.btn_transcript_auto': {
    id: '🤖 AI Generate Narasi', en: '🤖 AI-Generated Narration',
    ru: '🤖 AI создаст озвучку', zh: '🤖 AI生成旁白',
  },
  'gen.btn_transcript_manual': {
    id: '✍️ Tulis Narasi Sendiri', en: '✍️ Write My Own Script',
    ru: '✍️ Написать свой текст', zh: '✍️ 自己编写脚本',
  },
  'gen.transcript_input': {
    id: '✍️ *Tulis Script Voice-Over*\n\nKetik narasi lengkap untuk video kamu:',
    en: '✍️ *Write Voice-Over Script*\n\nType the full narration for your video:',
    ru: '✍️ *Напишите озвучку*\n\nВведите полный текст:',
    zh: '✍️ *编写旁白脚本*\n\n输入视频的完整旁白:',
  },
  'gen.transcript_saved': {
    id: '✅ Narasi disimpan!', en: '✅ Narration saved!',
    ru: '✅ Озвучка сохранена!', zh: '✅ 旁白已保存！',
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
