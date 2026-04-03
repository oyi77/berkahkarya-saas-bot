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
  "create.title": {
    id: "🎬 Buat Video Baru",
    en: "🎬 Create New Video",
    ru: "🎬 Создать новое видео",
    zh: "🎬 创建新视频",
  },
  "create.current_credits": {
    id: "Kredit saat ini",
    en: "Current credits",
    ru: "Текущий баланс",
    zh: "当前积分",
  },
  "create.select_niche": {
    id: "Pilih kategori konten:",
    en: "Select content category:",
    ru: "Выберите категорию контента:",
    zh: "选择内容类别：",
  },
  "create.need_credits": {
    id: "💰 Butuh lebih banyak kredit?",
    en: "💰 Need more credits?",
    ru: "💰 Нужно больше кредитов?",
    zh: "💰 需要更多积分？",
  },
  "create.niche_selected": {
    id: "dipilih!",
    en: "selected!",
    ru: "выбрано!",
    zh: "已选择！",
  },
  "create.select_style": {
    id: "Pilih style video:",
    en: "Select video style:",
    ru: "Выберите стиль видео:",
    zh: "选择视频风格：",
  },
  "create.change_category": {
    id: "← Ganti Kategori",
    en: "← Change Category",
    ru: "← Изменить категорию",
    zh: "← 更换类别",
  },
  "create.style_selected": {
    id: "🎬 Style dipilih!",
    en: "🎬 Style selected!",
    ru: "🎬 Стиль выбран!",
    zh: "🎬 风格已选择！",
  },
  "create.extend_mode": {
    id: "💡 Extend Mode: Duration sepanjang apapun!",
    en: "💡 Extend Mode: Any duration you want!",
    ru: "💡 Режим расширения: любая длительность!",
    zh: "💡 扩展模式：任意时长！",
  },
  "create.select_duration": {
    id: "Pilih total durasi:",
    en: "Select total duration:",
    ru: "Выберите продолжительность:",
    zh: "选择视频时长：",
  },
  "create.custom_duration": {
    id: "🎯 Custom Duration",
    en: "🎯 Custom Duration",
    ru: "🎯 Произвольная длительность",
    zh: "🎯 自定义时长",
  },
  "create.custom_duration_prompt": {
    id: "🎯 **Custom Duration**\n\nKirim jumlah detik yang kamu inginkan (misal 45, 60, 90, 120)\n\nNote: Sistem akan otomatis hitung scene (maks 15 detik per scene)\nContoh: 60 detik = 4 scene (15 detik per scene)",
    en: "🎯 **Custom Duration**\n\nSend number of seconds you want (e.g., 45, 60, 90, 120)\n\nNote: System will auto-calculate scenes (15s max per scene)\nExample: 60s = 4 scenes (15s each)",
    ru: "🎯 **Произвольная длительность**\n\nВведите количество секунд (например, 45, 60, 90, 120)\n\nПримечание: система автоматически рассчитает сцены (макс. 15 сек/сцена)\nПример: 60 сек = 4 сцены (по 15 сек)",
    zh: "🎯 **自定义时长**\n\n请输入秒数（如 45、60、90、120）\n\n注意：系统将自动计算场景数（最多 15 秒/场景）\n示例：60 秒 = 4 个场景（每个 15 秒）",
  },
  "create.almost_ready": {
    id: "🎬 **Hampir Siap!**",
    en: "🎬 **Almost Ready!**",
    ru: "🎬 **Почти готово!**",
    zh: "🎬 **即将完成！**",
  },
  "create.niche_label": {
    id: "📋 Niche",
    en: "📋 Niche",
    ru: "📋 Ниша",
    zh: "📋 类别",
  },
  "create.duration_label": {
    id: "⏱ Durasi",
    en: "⏱ Duration",
    ru: "⏱ Длительность",
    zh: "⏱ 时长",
  },
  "create.credit_cost_label": {
    id: "💰 Biaya kredit",
    en: "💰 Credit cost",
    ru: "💰 Стоимость в кредитах",
    zh: "💰 积分费用",
  },
  "create.send_reference_image": {
    id: "📸 **Kirim gambar referensi** untuk video kamu,\natau ketik /skip untuk biarkan AI generate semua.",
    en: "📸 **Send a reference image** for your video,\nor type /skip to let AI generate everything.",
    ru: "📸 **Отправьте референс-изображение** для видео,\nили введите /skip, чтобы ИИ сгенерировал всё.",
    zh: "📸 **发送参考图片**以供视频使用，\n或输入 /skip 让 AI 全自动生成。",
  },
  "create.scene": {
    id: "scene",
    en: "scene",
    ru: "сцена",
    zh: "场景",
  },
  "create.scenes": {
    id: "scene",
    en: "scenes",
    ru: "сцены",
    zh: "场景",
  },

  // Platform selection
  "create.select_platform": {
    id: "Pilih platform target:",
    en: "Select target platform:",
    ru: "Выберите целевую платформу:",
    zh: "选择目标平台：",
  },
  "create.platform_tiktok": {
    id: "📱 TikTok/Reels (9:16)",
    en: "📱 TikTok/Reels (9:16)",
    ru: "📱 TikTok/Reels (9:16)",
    zh: "📱 TikTok/Reels (9:16)",
  },
  "create.platform_youtube": {
    id: "📺 YouTube (16:9)",
    en: "📺 YouTube (16:9)",
    ru: "📺 YouTube (16:9)",
    zh: "📺 YouTube (16:9)",
  },
  "create.platform_instagram": {
    id: "📷 Instagram Feed (4:5)",
    en: "📷 Instagram Feed (4:5)",
    ru: "📷 Instagram Feed (4:5)",
    zh: "📷 Instagram Feed (4:5)",
  },
  "create.platform_square": {
    id: "🔲 Square (1:1)",
    en: "🔲 Square (1:1)",
    ru: "🔲 Квадрат (1:1)",
    zh: "🔲 正方形 (1:1)",
  },
  "create.change_style": {
    id: "← Ganti Style",
    en: "← Change Style",
    ru: "← Изменить стиль",
    zh: "← 更换风格",
  },
  "create.platform_selected": {
    id: "📱 Platform dipilih!",
    en: "📱 Platform selected!",
    ru: "📱 Платформа выбрана!",
    zh: "📱 平台已选择！",
  },

  // Daily limit
  "create.daily_limit_reached": {
    id: "Batas harian tercapai ({used}/{limit}). Upgrade untuk membuat lebih banyak hari ini.",
    en: "Daily limit reached ({used}/{limit}). Upgrade to create more today.",
    ru: "Дневной лимит достигнут ({used}/{limit}). Перейдите на Premium для большего.",
    zh: "已达每日上限（{used}/{limit}）。升级以今天创作更多。",
  },
  "create.daily_remaining": {
    id: "Sisa hari ini: {remaining}/{limit}",
    en: "Remaining today: {remaining}/{limit}",
    ru: "Осталось сегодня: {remaining}/{limit}",
    zh: "今日剩余：{remaining}/{limit}",
  },

  // Feedback
  "feedback.thanks_good": {
    id: "Terima kasih atas feedback-nya! Senang kamu suka.",
    en: "Thanks for the feedback! Glad you liked it.",
    ru: "Спасибо за отзыв! Рады, что вам понравилось.",
    zh: "感谢您的反馈！很高兴您喜欢。",
  },
  "feedback.thanks_bad": {
    id: "Maaf tentang itu. Kami akan terus meningkatkan kualitas. Coba regenerate?",
    en: "Sorry about that. We'll improve. Try regenerating?",
    ru: "Извините за это. Мы будем улучшаться. Попробуйте снова?",
    zh: "非常抱歉。我们会持续改进。要重新生成吗？",
  },

  // Duration options
  "create.duration_quick": {
    id: "⚡ Cepat: 15 detik (1 scene)",
    en: "⚡ Quick: 15s (1 scene)",
    ru: "⚡ Быстро: 15 сек (1 сцена)",
    zh: "⚡ 快速：15 秒（1 个场景）",
  },
  "create.duration_standard": {
    id: "📊 Standar: 30 detik (2 scene)",
    en: "📊 Standard: 30s (2 scenes)",
    ru: "📊 Стандарт: 30 сек (2 сцены)",
    zh: "📊 标准：30 秒（2 个场景）",
  },
  "create.duration_long": {
    id: "🎬 Panjang: 60 detik (4 scene)",
    en: "🎬 Long: 60s (4 scenes)",
    ru: "🎬 Длинное: 60 сек (4 сцены)",
    zh: "🎬 长版：60 秒（4 个场景）",
  },
  "create.duration_extended": {
    id: "📹 Extended: 120 detik (8 scene)",
    en: "📹 Extended: 120s (8 scenes)",
    ru: "📹 Расширенное: 120 сек (8 сцен)",
    zh: "📹 扩展：120 秒（8 个场景）",
  },

  // ---------------------------------------------------------------------------
  // Errors
  // ---------------------------------------------------------------------------
  "error.account_banned": {
    id: "Akun kamu telah disuspend. Hubungi support untuk bantuan.",
    en: "Your account has been suspended. Contact support for assistance.",
    ru: "Ваш аккаунт был заблокирован. Обратитесь в поддержку.",
    zh: "您的账户已被封禁。请联系客服获取帮助。",
  },
  "error.generic": {
    id: "❌ Terjadi kesalahan. Silakan coba lagi.",
    en: "❌ Something went wrong. Please try again.",
    ru: "❌ Что-то пошло не так. Пожалуйста, попробуйте снова.",
    zh: "❌ 出了点问题，请再试一次。",
  },
  "error.something_went_wrong": {
    id: "Terjadi kesalahan.",
    en: "Something went wrong.",
    ru: "Произошла ошибка.",
    zh: "出了点问题。",
  },
  "error.try_start": {
    id: "Ketik /start untuk kembali ke menu.",
    en: "Type /start to return to menu.",
    ru: "Введите /start для возврата в меню.",
    zh: "输入 /start 返回菜单。",
  },
  "error.user_not_found": {
    id: "❌ Pengguna tidak ditemukan. Silakan mulai dengan /start",
    en: "❌ User not found. Please start with /start",
    ru: "❌ Пользователь не найден. Начните с /start",
    zh: "❌ 未找到用户，请从 /start 开始",
  },
  "error.identify_user": {
    id: "❌ Tidak dapat mengidentifikasi pengguna.",
    en: "❌ Unable to identify user.",
    ru: "❌ Невозможно идентифицировать пользователя.",
    zh: "❌ 无法识别用户。",
  },
  "error.insufficient_credits": {
    id: "❌ Kredit tidak cukup.",
    en: "❌ Insufficient credits.",
    ru: "❌ Недостаточно кредитов.",
    zh: "❌ 积分不足。",
  },
  "error.insufficient_credits_detail": {
    id: "Saldo saat ini: {balance}\nMinimum diperlukan: {min} kredit\n\nGunakan /topup untuk menambah kredit.",
    en: "Current balance: {balance}\nMinimum required: {min} credits\n\nUse /topup to add more credits.",
    ru: "Текущий баланс: {balance}\nМинимум требуется: {min} кредитов\n\nИспользуйте /topup для пополнения.",
    zh: "当前余额：{balance}\n最少需要：{min} 积分\n\n使用 /topup 充值。",
  },

  // ---------------------------------------------------------------------------
  // Success messages
  // ---------------------------------------------------------------------------
  "success.video_ready": {
    id: "✅ **Video Siap!**",
    en: "✅ **Video Ready!**",
    ru: "✅ **Видео готово!**",
    zh: "✅ **视频已就绪！**",
  },
  "success.video_failed": {
    id: "❌ Pembuatan video gagal",
    en: "❌ Video generation failed",
    ru: "❌ Создание видео не удалось",
    zh: "❌ 视频生成失败",
  },
  "success.credits_refunded": {
    id: "💰 Kredit dikembalikan.",
    en: "💰 Credits refunded.",
    ru: "💰 Кредиты возвращены.",
    zh: "💰 积分已退还。",
  },

  // ---------------------------------------------------------------------------
  // Menu / button labels
  // ---------------------------------------------------------------------------
  "menu.create_video": {
    id: "🎬 Buat Video",
    en: "🎬 Create Video",
    ru: "🎬 Создать видео",
    zh: "🎬 创建视频",
  },
  "menu.generate_image": {
    id: "🖼️ Generate Gambar",
    en: "🖼️ Generate Image",
    ru: "🖼️ Создать изображение",
    zh: "🖼️ 生成图片",
  },
  "menu.chat_ai": {
    id: "💬 Chat AI",
    en: "💬 Chat AI",
    ru: "💬 Чат с ИИ",
    zh: "💬 AI 对话",
  },
  "menu.my_videos": {
    id: "📁 Video Saya",
    en: "📁 My Videos",
    ru: "📁 Мои видео",
    zh: "📁 我的视频",
  },
  "menu.top_up": {
    id: "💰 Top Up",
    en: "💰 Top Up",
    ru: "💰 Пополнить",
    zh: "💰 充值",
  },
  "menu.subscription": {
    id: "⭐ Langganan",
    en: "⭐ Subscription",
    ru: "⭐ Подписка",
    zh: "⭐ 订阅",
  },
  "menu.profile": {
    id: "👤 Profil",
    en: "👤 Profile",
    ru: "👤 Профиль",
    zh: "👤 个人资料",
  },
  "menu.referral": {
    id: "👥 Referral",
    en: "👥 Referral",
    ru: "👥 Реферал",
    zh: "👥 推荐",
  },
  "menu.settings": {
    id: "⚙️ Pengaturan",
    en: "⚙️ Settings",
    ru: "⚙️ Настройки",
    zh: "⚙️ 设置",
  },
  "menu.support": {
    id: "🆘 Bantuan",
    en: "🆘 Support",
    ru: "🆘 Поддержка",
    zh: "🆘 帮助",
  },
  "menu.create_another": {
    id: "🎬 Buat Lagi",
    en: "🎬 Create Another",
    ru: "🎬 Создать ещё",
    zh: "🎬 再创建一个",
  },
  "menu.try_again": {
    id: "🔄 Coba Lagi",
    en: "🔄 Try Again",
    ru: "🔄 Попробовать снова",
    zh: "🔄 再试一次",
  },
  "menu.top_up_now": {
    id: "💰 Top Up Sekarang",
    en: "💰 Top Up Now",
    ru: "💰 Пополнить сейчас",
    zh: "💰 立即充值",
  },
  "menu.subscribe": {
    id: "⭐ Berlangganan",
    en: "⭐ Subscribe",
    ru: "⭐ Подписаться",
    zh: "⭐ 订阅",
  },

  // Main menu specific
  "menu.hello": {
    id: "👋 *Halo, {name}!*",
    en: "👋 *Hello, {name}!*",
    ru: "👋 *Привет, {name}!*",
    zh: "👋 *你好，{name}！*",
  },
  "menu.credits_label": {
    id: "Kredit",
    en: "Credits",
    ru: "Кредиты",
    zh: "积分",
  },
  "menu.today_question": {
    id: "Mau buat apa hari ini? 👇",
    en: "What would you like to create today? 👇",
    ru: "Что создадим сегодня? 👇",
    zh: "今天想创作什么？ 👇",
  },
  "menu.btn_prompts": {
    id: "📚 Pilih Prompt & Buat Video",
    en: "📚 Browse Prompts & Create",
    ru: "📚 Шаблоны и создание",
    zh: "📚 浏览模板并创建",
  },
  "menu.btn_trending": {
    id: "🔥 Trending",
    en: "🔥 Trending",
    ru: "🔥 Тренды",
    zh: "🔥 热门",
  },
  "menu.btn_free_prompt": {
    id: "🎁 Prompt Gratis",
    en: "🎁 Free Prompt",
    ru: "🎁 Бесплатный шаблон",
    zh: "🎁 免费模板",
  },
  "menu.btn_create_video": {
    id: "🎬 Buat Video",
    en: "🎬 Create Video",
    ru: "🎬 Создать видео",
    zh: "🎬 创建视频",
  },
  "menu.btn_create_image": {
    id: "🖼️ Buat Gambar",
    en: "🖼️ Create Image",
    ru: "🖼️ Создать изображение",
    zh: "🖼️ 创建图片",
  },
  "menu.btn_clone": {
    id: "🔄 Clone",
    en: "🔄 Clone",
    ru: "🔄 Клонировать",
    zh: "🔄 克隆",
  },
  "menu.btn_storyboard": {
    id: "📋 Storyboard",
    en: "📋 Storyboard",
    ru: "📋 Раскадровка",
    zh: "📋 分镜头",
  },
  "menu.btn_viral": {
    id: "📈 Viral",
    en: "📈 Viral",
    ru: "📈 Вирусный",
    zh: "📈 爆款",
  },
  "menu.btn_my_videos": {
    id: "📁 Video Saya",
    en: "📁 My Videos",
    ru: "📁 Мои видео",
    zh: "📁 我的视频",
  },
  "menu.btn_referral": {
    id: "👥 Referral",
    en: "👥 Referral",
    ru: "👥 Реферал",
    zh: "👥 推荐",
  },
  "menu.btn_profile": {
    id: "👤 Profil",
    en: "👤 Profile",
    ru: "👤 Профиль",
    zh: "👤 个人资料",
  },
  "menu.btn_web_dashboard": {
    id: "🌐 Dashboard Web",
    en: "🌐 Web Dashboard",
    ru: "🌐 Веб-дашборд",
    zh: "🌐 网页控制台",
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  "settings.title": {
    id: "⚙️ *Pengaturan*",
    en: "⚙️ *Settings*",
    ru: "⚙️ *Настройки*",
    zh: "⚙️ *设置*",
  },
  "settings.description": {
    id: "Konfigurasi preferensi kamu:",
    en: "Configure your preferences:",
    ru: "Настройте ваши предпочтения:",
    zh: "配置您的偏好：",
  },
  "settings.language_label": {
    id: "*Bahasa:*",
    en: "*Language:*",
    ru: "*Язык:*",
    zh: "*语言：*",
  },
  "settings.notifications_label": {
    id: "*Notifikasi:*",
    en: "*Notifications:*",
    ru: "*Уведомления:*",
    zh: "*通知：*",
  },
  "settings.autorenewal_label": {
    id: "*Auto-renewal:*",
    en: "*Auto-renewal:*",
    ru: "*Авто-продление:*",
    zh: "*自动续订：*",
  },
  "settings.enabled": {
    id: "Aktif",
    en: "Enabled",
    ru: "Включено",
    zh: "已启用",
  },
  "settings.disabled": {
    id: "Nonaktif",
    en: "Disabled",
    ru: "Отключено",
    zh: "已禁用",
  },
  "settings.what_to_change": {
    id: "Apa yang ingin kamu ubah?",
    en: "What would you like to change?",
    ru: "Что хотите изменить?",
    zh: "您想更改什么？",
  },
  "settings.btn_language": {
    id: "🌐 Ganti Bahasa",
    en: "🌐 Change Language",
    ru: "🌐 Изменить язык",
    zh: "🌐 更改语言",
  },
  "settings.btn_notifications": {
    id: "🔔 Notifikasi",
    en: "🔔 Notifications",
    ru: "🔔 Уведомления",
    zh: "🔔 通知",
  },
  "settings.btn_autorenewal": {
    id: "🔄 Auto-renewal",
    en: "🔄 Auto-renewal",
    ru: "🔄 Авто-продление",
    zh: "🔄 自动续订",
  },

  // ---------------------------------------------------------------------------
  // Retention / notification buttons
  // ---------------------------------------------------------------------------
  "retention.btn_generate": {
    id: "🎬 Generate Sekarang",
    en: "🎬 Generate Now",
    ru: "🎬 Создать сейчас",
    zh: "🎬 立即生成",
  },
  "retention.btn_unsubscribe": {
    id: "🔕 Unsubscribe",
    en: "🔕 Unsubscribe",
    ru: "🔕 Отписаться",
    zh: "🔕 取消订阅",
  },
  "retention.video_expiry_warning": {
    id: "⚠️ {count} video kamu akan kedaluwarsa dalam 3 hari. Segera download!",
    en: "⚠️ {count} of your videos expire in 3 days. Download them now!",
    ru: "⚠️ {count} ваших видео истекают через 3 дня. Скачайте их сейчас!",
    zh: "⚠️ 您有 {count} 个视频将在3天内到期，请立即下载！",
  },

  // ---------------------------------------------------------------------------
  // Profile / referral headings
  // ---------------------------------------------------------------------------
  "profile.heading": {
    id: "👤 Profil Kamu",
    en: "👤 Your Profile",
    ru: "👤 Ваш профиль",
    zh: "👤 您的个人资料",
  },
  "profile.credits": {
    id: "💰 Kredit",
    en: "💰 Credits",
    ru: "💰 Кредиты",
    zh: "💰 积分",
  },
  "profile.tier": {
    id: "⭐ Tier",
    en: "⭐ Tier",
    ru: "⭐ Уровень",
    zh: "⭐ 等级",
  },
  "referral.heading": {
    id: "👥 Program Referral",
    en: "👥 Referral Program",
    ru: "👥 Реферальная программа",
    zh: "👥 推荐计划",
  },
  "referral.your_code": {
    id: "🔗 Kode referral kamu",
    en: "🔗 Your referral code",
    ru: "🔗 Ваш реферальный код",
    zh: "🔗 您的推荐码",
  },

  // ---------------------------------------------------------------------------
  // Common actions / labels
  // ---------------------------------------------------------------------------
  "common.generate": {
    id: "Generate",
    en: "Generate",
    ru: "Создать",
    zh: "生成",
  },
  "common.cancel": {
    id: "Batal",
    en: "Cancel",
    ru: "Отмена",
    zh: "取消",
  },
  "common.back": {
    id: "Kembali",
    en: "Back",
    ru: "Назад",
    zh: "返回",
  },
  "common.confirm": {
    id: "Konfirmasi",
    en: "Confirm",
    ru: "Подтвердить",
    zh: "确认",
  },
  "common.credits": {
    id: "kredit",
    en: "credits",
    ru: "кредитов",
    zh: "积分",
  },

  // ---------------------------------------------------------------------------
  // Low credit warning
  // ---------------------------------------------------------------------------
  "credits.low_warning": {
    id: "⚠️ Kredit Rendah: {remaining} tersisa\n\nVideo berikutnya membutuhkan minimal 0.5 kredit.",
    en: "⚠️ Low Credits: {remaining} remaining\n\nYour next video needs at least 0.5 credits.",
    ru: "⚠️ Мало кредитов: {remaining} осталось\n\nСледующее видео требует минимум 0.5 кредита.",
    zh: "⚠️ 积分不足：剩余 {remaining}\n\n下一个视频至少需要 0.5 积分。",
  },

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  "onboarding.select_language": {
    id: "🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言",
    en: "🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言",
    ru: "🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言",
    zh: "🌐 Pilih bahasa kamu / Please select your language / Выберите язык / 请选择语言",
  },
  "onboarding.welcome": {
    id: "Selamat datang di BerkahKarya AI! 🎉\n\n📱 **Platform AI Content Creation Terlengkap di Indonesia**\n\nKamu udah dapat **3 credits GRATIS** yang bisa dipake untuk:\n• 6 video pendek (5 detik)\n• 3 gambar HD\n• Atau kombinasi keduanya!",
    en: "Welcome to BerkahKarya AI! 🎉\n\n📱 **The Most Complete AI Content Creation Platform**\n\nYou got **3 FREE credits** which can be used for:\n• 6 short videos (5 seconds)\n• 3 HD images\n• Or a combination of both!",
    ru: "Добро пожаловать в BerkahKarya AI! 🎉\n\n📱 **Платформа для создания AI-контента**\n\nВы получили **3 БЕСПЛАТНЫХ кредита** для:\n• 6 коротких видео (5 секунд)\n• 3 HD-изображения\n• Или комбинацию!",
    zh: "欢迎来到 BerkahKarya AI！🎉\n\n📱 **最全面的 AI 内容创作平台**\n\n您获得了 **3 个免费积分**，可用于：\n• 6 个短视频（5 秒）\n• 3 张高清图片\n• 或两者的组合！",
  },
  "onboarding.features": {
    id: "─────────────────────────────\n**MAU BUAT APA HARI INI?**\n─────────────────────────────\n\n🎬 **Video**\n• Upload foto → jadi video cinematic\n• Deskripsikan → AI bikin video\n• Clone video viral → adaptasi buat brandmu\n\n🖼️ **Gambar**\n• Foto produk profesional\n• Thumbnail YouTube\n• Social media content\n\n📋 **Prompt Templates**\n• 40+ prompt profesional per niche\n• Tinggal pilih → langsung generate\n• Gratis untuk semua user!",
    en: "─────────────────────────────\n**WHAT DO YOU WANT TO CREATE TODAY?**\n─────────────────────────────\n\n🎬 **Video**\n• Upload photo → cinematic video\n• Describe → AI makes video\n• Clone viral video → adapt for your brand\n\n🖼️ **Image**\n• Professional product photo\n• YouTube Thumbnail\n• Social media content\n\n📋 **Prompt Templates**\n• 40+ professional prompts per niche\n• Just pick → generate instantly\n• Free for all users!",
    ru: "─────────────────────────────\n**ЧТО ХОТИТЕ СОЗДАТЬ СЕГОДНЯ?**\n─────────────────────────────\n\n🎬 **Видео**\n• Загрузите фото → кинематографическое видео\n• Опишите → ИИ создаст видео\n• Клонируйте вирусное → для вашего бренда\n\n🖼️ **Изображение**\n• Профессиональное фото продукта\n• Обложка YouTube\n• Контент для соцсетей\n\n📋 **Шаблоны**\n• 40+ профессиональных шаблонов\n• Просто выберите → генерируйте сразу\n• Бесплатно для всех!",
    zh: "─────────────────────────────\n**今天想创作什么？**\n─────────────────────────────\n\n🎬 **视频**\n• 上传照片 → 生成电影感视频\n• 描述需求 → AI 制作视频\n• 克隆爆款视频 → 为您的品牌定制\n\n🖼️ **图片**\n• 专业产品图\n• YouTube 封面\n• 社交媒体内容\n\n📋 **提示词模板**\n• 40+ 个专业模板\n• 直接选择 → 立即生成\n• 所有用户免费！",
  },
  "onboarding.cta": {
    id: "👇 *Mau mulai dari mana?*",
    en: "👇 *Where would you like to start?*",
    ru: "👇 *С чего хотите начать?*",
    zh: "👇 *您想从哪里开始？*",
  },
  "onboarding.btn_create_video": {
    id: "📚 Pilih Prompt & Buat Video",
    en: "📚 Browse Prompts & Create Video",
    ru: "📚 Выбрать шаблон и создать видео",
    zh: "📚 浏览模板并创建视频",
  },
  "onboarding.btn_try_image": {
    id: "🎁 Ambil Prompt Gratis Hari Ini",
    en: "🎁 Get Today's Free Prompt",
    ru: "🎁 Получить бесплатный шаблон дня",
    zh: "🎁 获取今日免费模板",
  },
  "onboarding.btn_chat_ai": {
    id: "💬 Tanya AI — Saya Bantu Pilihkan",
    en: "💬 Ask AI — I'll Help You Choose",
    ru: "💬 Спросить ИИ — помогу выбрать",
    zh: "💬 咨询 AI — 我来帮您选",
  },
  "onboarding.select_niche": {
    id: "🏪 Bisnis kamu bergerak di bidang apa?",
    en: "🏪 What type of business do you have?",
    ru: "🏪 Какой у вас тип бизнеса?",
    zh: "🏪 您的业务类型是什么？",
  },

  // ---------------------------------------------------------------------------
  // Image reference & Avatar
  // ---------------------------------------------------------------------------
  "image.select_mode": {
    id: "Pilih cara generate:",
    en: "Select generation method:",
    ru: "Выберите способ генерации:",
    zh: "选择生成方式：",
  },
  "image.upload_reference": {
    id: "📸 Kirim foto produk/subjek kamu sebagai referensi.",
    en: "📸 Send your product/subject photo as reference.",
    ru: "📸 Отправьте фото вашего продукта/объекта как референс.",
    zh: "📸 发送您的产品/主题照片作为参考。",
  },
  "image.reference_received": {
    id: "📸 Gambar referensi diterima! Sekarang deskripsikan yang ingin di-generate:",
    en: "📸 Reference image received! Now describe what you want to generate:",
    ru: "📸 Референс получен! Теперь опишите, что хотите создать:",
    zh: "📸 已收到参考图！现在描述您想生成的内容：",
  },
  "image.generating_with_ref": {
    id: "⏳ Generating gambar dengan referensi...",
    en: "⏳ Generating image with reference...",
    ru: "⏳ Создание изображения с референсом...",
    zh: "⏳ 正在使用参考图生成图片...",
  },
  "image.generating_with_avatar": {
    id: "⏳ Generating gambar dengan avatar...",
    en: "⏳ Generating image with avatar...",
    ru: "⏳ Создание изображения с аватаром...",
    zh: "⏳ 正在使用头像生成图片...",
  },
  "image.no_img2img_providers": {
    id: "⚠️ Tidak ada provider yang mendukung gambar referensi saat ini. Menggunakan mode teks saja.",
    en: "⚠️ No providers support reference images right now. Using text-only mode.",
    ru: "⚠️ Нет доступных провайдеров для референс-изображений. Использую текстовый режим.",
    zh: "⚠️ 目前没有支持参考图片的提供商。仅使用文本模式。",
  },
  "avatar.title": {
    id: "👤 Avatar Kamu",
    en: "👤 Your Avatars",
    ru: "👤 Ваши аватары",
    zh: "👤 您的头像",
  },
  "avatar.empty": {
    id: "Belum ada avatar tersimpan.",
    en: "No avatars saved yet.",
    ru: "Аватары отсутствуют.",
    zh: "暂无头像。",
  },
  "avatar.add_prompt": {
    id: "Kirim foto yang jelas untuk avatar baru.",
    en: "Send a clear photo for your new avatar.",
    ru: "Отправьте четкое фото для нового аватара.",
    zh: "发送清晰的照片以创建新头像。",
  },
  "avatar.name_prompt": {
    id: "Beri nama avatar ini:",
    en: "Give this avatar a name:",
    ru: "Дайте имя этому аватару:",
    zh: "为此头像命名：",
  },
  "avatar.saved": {
    id: "✅ Avatar tersimpan!",
    en: "✅ Avatar saved!",
    ru: "✅ Аватар сохранён!",
    zh: "✅ 头像已保存！",
  },
  "avatar.deleted": {
    id: "🗑️ Avatar dihapus.",
    en: "🗑️ Avatar deleted.",
    ru: "🗑️ Аватар удалён.",
    zh: "🗑️ 头像已删除。",
  },
  "avatar.set_default": {
    id: "⭐ Avatar ditetapkan sebagai default!",
    en: "⭐ Avatar set as default!",
    ru: "⭐ Аватар установлен по умолчанию!",
    zh: "⭐ 头像已设为默认！",
  },
  "avatar.max_reached": {
    id: "❌ Maksimal {max} avatar. Hapus salah satu dulu.",
    en: "❌ Maximum {max} avatars. Delete one first.",
    ru: "❌ Максимум {max} аватаров. Сначала удалите один.",
    zh: "❌ 最多 {max} 个头像。请先删除一个。",
  },

  // ---------------------------------------------------------------------------
  // Generate flow (V3)
  // ---------------------------------------------------------------------------
  "gen.daily_limit_reached": {
    id: "Kamu telah mencapai batas generate harian ({limit}). Coba lagi besok!",
    en: "You've reached your daily generation limit ({limit}). Try again tomorrow!",
    ru: "Вы достигли дневного лимита генераций ({limit}). Попробуйте завтра!",
    zh: "您已达到每日生成上限（{limit}）。明天再试吧！",
  },
  "gen.analyzing_photo": {
    id: "🔍 *Menganalisis foto produk...*",
    en: "🔍 *Analyzing product photo...*",
    ru: "🔍 *Анализируем фото товара...*",
    zh: "🔍 *正在分析产品照片...*",
  },
  "gen.send_photo_or_text": {
    id: "❌ Kirim foto produk atau ketik deskripsi produk.",
    en: "❌ Please send a product photo or type a description.",
    ru: "❌ Отправьте фото товара или введите описание.",
    zh: "❌ 请发送产品照片或输入描述。",
  },
  "gen.input_failed": {
    id: "❌ Gagal memproses input. Coba lagi.",
    en: "❌ Failed to process input. Try again.",
    ru: "❌ Не удалось обработать ввод. Попробуйте снова.",
    zh: "❌ 处理输入失败，请重试。",
  },
  "gen.already_processing": {
    id: "⏳ Sedang diproses... mohon tunggu.",
    en: "⏳ Already processing... please wait.",
    ru: "⏳ Уже обрабатывается... подождите.",
    zh: "⏳ 正在处理中...请稍候。",
  },
  "gen.user_not_found": {
    id: "❌ User tidak ditemukan.",
    en: "❌ User not found.",
    ru: "❌ Пользователь не найден.",
    zh: "❌ 用户未找到。",
  },
  "gen.insufficient_credits": {
    id: "❌ *Kredit tidak cukup*\n\nDibutuhkan: {cost} kredit\nSaldo: {balance} kredit\n\nGunakan /topup untuk menambah kredit.",
    en: "❌ *Insufficient credits*\n\nRequired: {cost} credits\nBalance: {balance} credits\n\nUse /topup to add credits.",
    ru: "❌ *Недостаточно кредитов*\n\nТребуется: {cost}\nБаланс: {balance}\n\nИспользуйте /topup для пополнения.",
    zh: "❌ *积分不足*\n\n需要: {cost} 积分\n余额: {balance} 积分\n\n使用 /topup 充值。",
  },
  "gen.generating": {
    id: "⏳ *Generating konten...*\n\nMohon tunggu ~30-60 detik 🚀",
    en: "⏳ *Generating content...*\n\nPlease wait ~30-60 seconds 🚀",
    ru: "⏳ *Генерируем контент...*\n\nПодождите ~30-60 секунд 🚀",
    zh: "⏳ *正在生成内容...*\n\n请等待约30-60秒 🚀",
  },
  "gen.scene_generating": {
    id: "🎨 Generating scene {n}/7: *{name}*...",
    en: "🎨 Generating scene {n}/7: *{name}*...",
    ru: "🎨 Генерация сцены {n}/7: *{name}*...",
    zh: "🎨 正在生成场景 {n}/7: *{name}*...",
  },
  "gen.all_scenes_failed": {
    id: "❌ Gagal generate semua scene. Kredit tidak ditagih.",
    en: "❌ All scenes failed to generate. No credits charged.",
    ru: "❌ Все сцены не удались. Кредиты не списаны.",
    zh: "❌ 所有场景生成失败。未扣费。",
  },
  "gen.video_queued": {
    id: "✅ Video masuk antrian #{position}\n\nKamu akan dinotifikasi saat selesai.",
    en: "✅ Video queued at #{position}\n\nYou'll be notified when ready.",
    ru: "✅ Видео в очереди #{position}\n\nМы уведомим вас, когда будет готово.",
    zh: "✅ 视频已排队 #{position}\n\n完成后会通知您。",
  },
  "gen.video_processing": {
    id: "✅ Video sedang diproses. Kamu akan dinotifikasi saat selesai.",
    en: "✅ Video is processing. You'll be notified when ready.",
    ru: "✅ Видео обрабатывается. Мы уведомим вас.",
    zh: "✅ 视频正在处理中，完成后会通知您。",
  },
  "gen.imgset_preview_offer": {
    id: "✅ *{count} gambar scene berhasil di-generate!*\n\nVideo sedang diproses di background (antrian #{position}).\n\nMau lihat gambar scene-nya?",
    en: "✅ *{count} scene images generated!*\n\nVideo is processing in background (queue #{position}).\n\nWant to preview the scene images?",
    ru: "✅ *{count} изображений сцен создано!*\n\nВидео обрабатывается в фоне (очередь #{position}).\n\nХотите посмотреть изображения сцен?",
    zh: "✅ *已生成{count}张场景图片！*\n\n视频正在后台处理（队列#{position}）。\n\n要预览场景图片吗？",
  },
  "gen.btn_preview_images": {
    id: "👀 Lihat Gambar",
    en: "👀 View Images",
    ru: "👀 Посмотреть",
    zh: "👀 查看图片",
  },
  "gen.btn_skip_preview": {
    id: "⏭️ Lanjut, Tunggu Video",
    en: "⏭️ Skip, Wait for Video",
    ru: "⏭️ Пропустить, ждать видео",
    zh: "⏭️ 跳过，等待视频",
  },
  "gen.imgset_preview_caption": {
    id: "🎬 *Preview {count} Scene*\nVideo sedang diproses...",
    en: "🎬 *Preview {count} Scenes*\nVideo is processing...",
    ru: "🎬 *Превью {count} сцен*\nВидео обрабатывается...",
    zh: "🎬 *预览{count}个场景*\n视频处理中...",
  },
  "gen.generation_failed": {
    id: "❌ Gagal generate. Coba lagi atau hubungi /support.",
    en: "❌ Generation failed. Try again or contact /support.",
    ru: "❌ Генерация не удалась. Попробуйте снова или обратитесь в /support.",
    zh: "❌ 生成失败。请重试或联系 /support。",
  },
  "gen.video_failed_refund": {
    id: "❌ Video gagal diproses. Kredit dikembalikan.",
    en: "❌ Video processing failed. Credits refunded.",
    ru: "❌ Обработка видео не удалась. Кредиты возвращены.",
    zh: "❌ 视频处理失败。积分已退还。",
  },
  "gen.campaign_processing": {
    id: "⏳ *Campaign {size} scene masuk antrian #{position}!*\n\n1 video dengan {size} hook berbeda.\nKamu akan dinotifikasi saat selesai.",
    en: "⏳ *Campaign {size} scenes queued at #{position}!*\n\n1 video with {size} different hooks.\nYou'll be notified when ready.",
    ru: "⏳ *Кампания {size} сцен в очереди #{position}!*\n\n1 видео с {size} разными хуками.\nМы уведомим вас.",
    zh: "⏳ *{size} 场景活动已排队 #{position}！*\n\n1个视频包含 {size} 个不同的开场。\n完成后会通知您。",
  },
  "gen.campaign_failed": {
    id: "❌ *Campaign Gagal*\n\nGagal membuat video. Kredit dikembalikan.",
    en: "❌ *Campaign Failed*\n\nFailed to create video. Credits refunded.",
    ru: "❌ *Кампания не удалась*\n\nНе удалось создать видео. Кредиты возвращены.",
    zh: "❌ *活动失败*\n\n创建视频失败。积分已退还。",
  },
  "gen.campaign_done_single": {
    id: "✅ *Campaign Selesai*\n\n{count}/{total} video berhasil diproses.",
    en: "✅ *Campaign Done*\n\n{count}/{total} video(s) processed.",
    ru: "✅ *Кампания завершена*\n\n{count}/{total} видео обработано.",
    zh: "✅ *活动完成*\n\n{count}/{total} 个视频已处理。",
  },
  "gen.campaign_done_all": {
    id: "✅ *Campaign Selesai!*\n\n{total} video berhasil diproses semua.",
    en: "✅ *Campaign Complete!*\n\nAll {total} videos processed successfully.",
    ru: "✅ *Кампания завершена!*\n\nВсе {total} видео успешно обработаны.",
    zh: "✅ *活动全部完成！*\n\n所有 {total} 个视频均已成功处理。",
  },

  // Image preference
  "gen.image_pref_title": {
    id: "📸 *Foto Referensi*\n\nIngin menggunakan foto referensi untuk hasil yang lebih bagus?\n\n• Kirim foto untuk mode *Image-to-Video*\n• Atau skip untuk *Text-to-Video*",
    en: "📸 *Reference Photo*\n\nWant to use a reference photo for better results?\n\n• Send a photo for *Image-to-Video* mode\n• Or skip for *Text-to-Video*",
    ru: "📸 *Референсное фото*\n\nХотите использовать фото для лучших результатов?\n\n• Отправьте фото для режима *Image-to-Video*\n• Или пропустите для *Text-to-Video*",
    zh: "📸 *参考照片*\n\n想使用参考照片获得更好的效果吗？\n\n• 发送照片使用 *图生视频* 模式\n• 或跳过使用 *文生视频*",
  },
  "gen.btn_upload_ref": {
    id: "📸 Upload Foto Referensi",
    en: "📸 Upload Reference Photo",
    ru: "📸 Загрузить фото",
    zh: "📸 上传参考照片",
  },
  "gen.btn_skip_ref": {
    id: "🚀 Langsung Generate (Tanpa Foto)",
    en: "🚀 Generate Now (No Photo)",
    ru: "🚀 Создать сразу (без фото)",
    zh: "🚀 直接生成（无照片）",
  },
  "gen.image_url_expired": {
    id: "⚠️ Gambar sebelumnya sudah kedaluwarsa. Silakan upload ulang untuk melanjutkan.",
    en: "⚠️ Previous image has expired. Please upload a new one to continue.",
    ru: "⚠️ Предыдущее изображение устарело. Пожалуйста, загрузите новое для продолжения.",
    zh: "⚠️ 之前的图片已过期，请重新上传以继续。",
  },

  // Prompt source
  "gen.prompt_source_title": {
    id: "📝 *Pilih Sumber Prompt*\n\nMau buat {action} dari mana?",
    en: "📝 *Choose Prompt Source*\n\nHow do you want to create your {action}?",
    ru: "📝 *Выберите источник промпта*\n\nОткуда создать {action}?",
    zh: "📝 *选择提示来源*\n\n想从哪里创建 {action}？",
  },
  "gen.btn_prompt_library": {
    id: "📚 Pilih dari Prompt Library",
    en: "📚 Choose from Prompt Library",
    ru: "📚 Выбрать из библиотеки",
    zh: "📚 从提示库选择",
  },
  "gen.btn_custom_prompt": {
    id: "✍️ Tulis Prompt Sendiri",
    en: "✍️ Write Custom Prompt",
    ru: "✍️ Написать свой промпт",
    zh: "✍️ 自定义提示",
  },
  "gen.btn_auto_prompt": {
    id: "✨ Auto Generate (AI)",
    en: "✨ Auto Generate (AI)",
    ru: "✨ Авто-генерация (AI)",
    zh: "✨ 自动生成 (AI)",
  },
  "gen.auto_prompt_generating": {
    id: "✨ Membuat prompt otomatis berdasarkan foto & niche kamu...",
    en: "✨ Auto-generating prompt based on your photo & niche...",
    ru: "✨ Автоматическая генерация промпта на основе фото и ниши...",
    zh: "✨ 正在根据您的照片和类别自动生成提示...",
  },
  "gen.auto_prompt_no_input": {
    id: "📝 Tidak ada foto atau teks. Kirim foto produk atau ketik deskripsi dulu.",
    en: "📝 No photo or text found. Please send a product photo or type a description first.",
    ru: "📝 Нет фото или текста. Сначала отправьте фото товара или введите описание.",
    zh: "📝 没有找到照片或文字。请先发送产品照片或输入描述。",
  },
  "gen.select_aspect_ratio": {
    id: "📐 *Pilih Rasio Gambar*\n\nPilih rasio aspek untuk gambar yang akan di-generate:",
    en: "📐 *Select Aspect Ratio*\n\nChoose the aspect ratio for your generated images:",
    ru: "📐 *Выберите соотношение сторон*\n\nВыберите соотношение сторон для генерируемых изображений:",
    zh: "📐 *选择宽高比*\n\n选择生成图片的宽高比：",
  },
  "gen.select_resolution": {
    id: "🖼️ *Pilih Resolusi*\n\nResolusi lebih tinggi = detail lebih tajam, cocok untuk cetak banner/poster.",
    en: "🖼️ *Select Resolution*\n\nHigher resolution = sharper details, great for print banners/posters.",
    ru: "🖼️ *Выберите разрешение*\n\nБолее высокое разрешение = более чёткие детали, подходит для печати баннеров/плакатов.",
    zh: "🖼️ *选择分辨率*\n\n更高分辨率 = 更清晰的细节，适合打印横幅/海报。",
  },
  "gen.res_standard": {
    id: "📐 Standard (1024px) — 1x Credit",
    en: "📐 Standard (1024px) — 1x Credit",
    ru: "📐 Стандарт (1024px) — 1x Кредит",
    zh: "📐 标准 (1024px) — 1x 积分",
  },
  "gen.res_hd": {
    id: "🖼️ HD (2048px) — 2x Credit",
    en: "🖼️ HD (2048px) — 2x Credit",
    ru: "🖼️ HD (2048px) — 2x Кредит",
    zh: "🖼️ HD (2048px) — 2x 积分",
  },
  "gen.res_ultra": {
    id: "✨ Ultra HD (4096px) — 4x Credit",
    en: "✨ Ultra HD (4096px) — 4x Credit",
    ru: "✨ Ultra HD (4096px) — 4x Кредит",
    zh: "✨ Ultra HD (4096px) — 4x 积分",
  },
  "gen.custom_prompt_input": {
    id: "✍️ *Tulis Prompt Sendiri*\n\nKirim foto produk atau ketik deskripsi produk.\n\nOutput: {action}",
    en: "✍️ *Write Custom Prompt*\n\nSend a product photo or type a description.\n\nOutput: {action}",
    ru: "✍️ *Напишите свой промпт*\n\nОтправьте фото товара или введите описание.\n\nВывод: {action}",
    zh: "✍️ *自定义提示*\n\n发送产品照片或输入描述。\n\n输出: {action}",
  },

  // Confirm screen
  "gen.confirm_title": {
    id: "✅ *Konfirmasi Generate*",
    en: "✅ *Confirm Generation*",
    ru: "✅ *Подтверждение генерации*",
    zh: "✅ *确认生成*",
  },
  "gen.confirm_cost": {
    id: "💰 Biaya: **{cost} kredit**",
    en: "💰 Cost: **{cost} credits**",
    ru: "💰 Стоимость: **{cost} кредитов**",
    zh: "💰 费用: **{cost} 积分**",
  },
  "gen.btn_generate_now": {
    id: "✅ Generate Sekarang ({cost} kredit)",
    en: "✅ Generate Now ({cost} credits)",
    ru: "✅ Создать сейчас ({cost} кредитов)",
    zh: "✅ 立即生成（{cost} 积分）",
  },
  "gen.post_delivery": {
    id: "✨ *Konten berhasil dibuat!*\n\nMau apa selanjutnya?",
    en: "✨ *Content created!*\n\nWhat's next?",
    ru: "✨ *Контент создан!*\n\nЧто дальше?",
    zh: "✨ *内容已创建！*\n\n接下来做什么？",
  },

  // Generate mode/action selection (i18n)
  "gen.title": {
    id: "Generate Konten",
    en: "Generate Content",
    ru: "Создать контент",
    zh: "生成内容",
  },
  "gen.select_mode": {
    id: "Pilih mode:",
    en: "Select mode:",
    ru: "Выберите режим:",
    zh: "选择模式:",
  },
  "gen.mode_basic": {
    id: "⚡ Basic — Full Auto",
    en: "⚡ Basic — Full Auto",
    ru: "⚡ Basic — Полный авто",
    zh: "⚡ Basic — 全自动",
  },
  "gen.mode_smart": {
    id: "🎯 Smart — Pilih Preset",
    en: "🎯 Smart — Choose Preset",
    ru: "🎯 Smart — Выбрать пресет",
    zh: "🎯 Smart — 选择预设",
  },
  "gen.mode_pro": {
    id: "👑 Pro — Full Control",
    en: "👑 Pro — Full Control",
    ru: "👑 Pro — Полный контроль",
    zh: "👑 Pro — 完全控制",
  },
  "gen.select_action": {
    id: "Pilih aksi:",
    en: "Select action:",
    ru: "Выберите действие:",
    zh: "选择操作:",
  },
  "gen.balance_label": {
    id: "Saldo",
    en: "Balance",
    ru: "Баланс",
    zh: "余额",
  },
  "gen.action_image_set": {
    id: "📸 Image Set (7 scene) — {cost} kredit",
    en: "📸 Image Set (7 scenes) — {cost} credits",
    ru: "📸 Набор изображений (7 сцен) — {cost} кредитов",
    zh: "📸 图片集（7 场景）— {cost} 积分",
  },
  "gen.action_video": {
    id: "🎥 Video Iklan — mulai {cost} kredit",
    en: "🎥 Ad Video — from {cost} credits",
    ru: "🎥 Рекламное видео — от {cost} кредитов",
    zh: "🎥 广告视频 — 起 {cost} 积分",
  },
  "gen.action_clone_style": {
    id: "🔄 Clone Style — {cost} kredit",
    en: "🔄 Clone Style — {cost} credits",
    ru: "🔄 Клонировать стиль — {cost} кредитов",
    zh: "🔄 克隆风格 — {cost} 积分",
  },
  "gen.action_campaign": {
    id: "📦 Campaign (5/10 scene) — {cost5}/{cost10} kredit",
    en: "📦 Campaign (5/10 scenes) — {cost5}/{cost10} credits",
    ru: "📦 Кампания (5/10 сцен) — {cost5}/{cost10} кредитов",
    zh: "📦 活动（5/10 场景）— {cost5}/{cost10} 积分",
  },
  "gen.no_credits_early": {
    id: "💰 Saldo kamu *{balance} kredit*. Top up dulu untuk mulai membuat konten!",
    en: "💰 Your balance is *{balance} credits*. Top up to start creating!",
    ru: "💰 Ваш баланс: *{balance} кредитов*. Пополните для создания контента!",
    zh: "💰 您的余额为 *{balance} 积分*。请充值以开始创建！",
  },

  // Smart mode
  "gen.smart_select_duration": {
    id: "🎯 *Smart Mode*\n\nPilih durasi video:",
    en: "🎯 *Smart Mode*\n\nSelect video duration:",
    ru: "🎯 *Smart Mode*\n\nВыберите длительность видео:",
    zh: "🎯 *智能模式*\n\n选择视频时长:",
  },

  "gen.select_platform": {
    id: "Platform:",
    en: "Platform:",
    ru: "Платформа:",
    zh: "平台:",
  },

  "gen.photo_fallback_desc": {
    id: "produk dari foto yang dikirim",
    en: "product from submitted photo",
    ru: "продукт из отправленного фото",
    zh: "来自上传照片的产品",
  },

  "gen.pro_scene_review": {
    id: "👑 *Pro Mode — Review Scene*\n\nIndustri terdeteksi: *{industry}*\n\n{scenes}\n\nTap scene untuk edit, atau lanjut:",
    en: "👑 *Pro Mode — Scene Review*\n\nDetected industry: *{industry}*\n\n{scenes}\n\nTap a scene to edit, or continue:",
    ru: "👑 *Pro Mode — Обзор сцен*\n\nОпределённая отрасль: *{industry}*\n\n{scenes}\n\nНажмите на сцену для редактирования или продолжите:",
    zh: "👑 *Pro 模式 — 场景审核*\n\n检测到的行业: *{industry}*\n\n{scenes}\n\n点击场景进行编辑，或继续:",
  },

  "gen.btn_pro_continue": {
    id: "✅ Lanjut ke Pilih Durasi",
    en: "✅ Continue to Duration",
    ru: "✅ Продолжить к выбору длительности",
    zh: "✅ 继续选择时长",
  },

  // Fingerprint
  "fingerprint.coming_soon": {
    id: "🧬 *Prompt Fingerprint*\n\nFitur ini segera hadir! Kami sedang menganalisis pola generate kamu untuk memberikan rekomendasi style yang personal.",
    en: "🧬 *Prompt Fingerprint*\n\nThis feature is coming soon! We are analyzing your generation patterns to provide personalized style recommendations.",
    ru: "🧬 *Prompt Fingerprint*\n\nЭта функция скоро появится! Мы анализируем ваши паттерны генерации для персональных рекомендаций.",
    zh: "🧬 *Prompt Fingerprint*\n\n此功能即将推出！我们正在分析您的生成模式，以提供个性化风格推荐。",
  },

  // Buttons
  "btn.back": {
    id: "◀️ Kembali",
    en: "◀️ Back",
    ru: "◀️ Назад",
    zh: "◀️ 返回",
  },
  "btn.main_menu": {
    id: "🏠 Menu Utama",
    en: "🏠 Main Menu",
    ru: "🏠 Главное меню",
    zh: "🏠 主菜单",
  },
  "btn.topup": {
    id: "💳 Top Up Kredit",
    en: "💳 Top Up Credits",
    ru: "💳 Пополнить кредиты",
    zh: "💳 充值积分",
  },
  "btn.variation": {
    id: "🔄 Variasi Lain",
    en: "🔄 Another Variation",
    ru: "🔄 Ещё вариант",
    zh: "🔄 其他变体",
  },
  "btn.campaign": {
    id: "📦 Campaign",
    en: "📦 Campaign",
    ru: "📦 Кампания",
    zh: "📦 活动",
  },

  // Message handler
  "msg.photo_received": {
    id: "✅ *Foto referensi diterima!*\n\nMelanjutkan ke generate...",
    en: "✅ *Reference photo received!*\n\nContinuing to generate...",
    ru: "✅ *Референсное фото получено!*\n\nПродолжаем...",
    zh: "✅ *参考照片已收到！*\n\n继续生成...",
  },
  "msg.skip_photo": {
    id: "⏭️ Lanjut tanpa foto referensi.",
    en: "⏭️ Continuing without reference photo.",
    ru: "⏭️ Продолжаем без референсного фото.",
    zh: "⏭️ 不使用参考照片继续。",
  },
  "msg.send_photo_or_skip": {
    id: "📸 Kirim foto referensi atau ketik /skip untuk lanjut tanpa foto.",
    en: "📸 Send a reference photo or type /skip to continue without one.",
    ru: "📸 Отправьте референсное фото или /skip для продолжения без него.",
    zh: "📸 发送参考照片或输入 /skip 跳过。",
  },
  "msg.photo_too_small": {
    id: "❌ Foto terlalu kecil (min 10KB). Kirim foto dengan resolusi lebih tinggi.",
    en: "❌ Photo too small (min 10KB). Send a higher resolution photo.",
    ru: "❌ Фото слишком маленькое (мин. 10КБ). Отправьте в более высоком разрешении.",
    zh: "❌ 照片太小（最小10KB）。请发送更高分辨率的照片。",
  },
  "msg.photo_too_large": {
    id: "❌ Foto terlalu besar (maks 20MB). Kirim foto yang lebih kecil.",
    en: "❌ Photo too large (max 20MB). Send a smaller photo.",
    ru: "❌ Фото слишком большое (макс. 20МБ). Отправьте поменьше.",
    zh: "❌ 照片太大（最大20MB）。请发送较小的照片。",
  },

  // Topup
  "topup.payment_ready": {
    id: "💳 *Pembayaran Siap!*\n\nOrder: `{orderId}`\nMetode: *{method}*\n\nKlik tombol di bawah untuk menyelesaikan pembayaran.",
    en: "💳 *Payment Ready!*\n\nOrder: `{orderId}`\nMethod: *{method}*\n\nClick the button below to complete payment.",
    ru: "💳 *Оплата готова!*\n\nЗаказ: `{orderId}`\nМетод: *{method}*\n\nНажмите кнопку ниже для оплаты.",
    zh: "💳 *付款就绪！*\n\n订单: `{orderId}`\n方式: *{method}*\n\n点击下方按钮完成付款。",
  },
  "topup.btn_pay": {
    id: "💳 Bayar Sekarang",
    en: "💳 Pay Now",
    ru: "💳 Оплатить",
    zh: "💳 立即支付",
  },
  "topup.btn_paid": {
    id: "✅ Sudah Bayar",
    en: "✅ I've Paid",
    ru: "✅ Я оплатил",
    zh: "✅ 已付款",
  },
  "topup.success": {
    id: "✅ *Pembayaran Berhasil!*\n\nKredit ditambahkan: {credits}\n\nTerima kasih! 🎉",
    en: "✅ *Payment Successful!*\n\nCredits added: {credits}\n\nThank you! 🎉",
    ru: "✅ *Оплата успешна!*\n\nДобавлено кредитов: {credits}\n\nСпасибо! 🎉",
    zh: "✅ *支付成功！*\n\n已添加积分: {credits}\n\n谢谢！🎉",
  },
  "topup.pending": {
    id: "Pembayaran masih pending. Selesaikan pembayaran terlebih dahulu.",
    en: "Payment still pending. Please complete payment first.",
    ru: "Оплата ещё в ожидании. Сначала завершите оплату.",
    zh: "付款仍在处理中。请先完成付款。",
  },
  "topup.not_found": {
    id: "❌ Transaksi tidak ditemukan.",
    en: "❌ Transaction not found.",
    ru: "❌ Транзакция не найдена.",
    zh: "❌ 未找到交易。",
  },
  "topup.failed_status": {
    id: "❌ Status pembayaran: *{status}*. Hubungi /support jika sudah membayar.",
    en: "❌ Payment status: *{status}*. Contact /support if you already paid.",
    ru: "❌ Статус оплаты: *{status}*. Обратитесь в /support если уже оплатили.",
    zh: "❌ 付款状态: *{status}*。如已付款请联系 /support。",
  },
  "topup.create_failed": {
    id: "❌ Gagal membuat pembayaran. Coba lagi.",
    en: "❌ Failed to create payment. Try again.",
    ru: "❌ Не удалось создать платёж. Попробуйте снова.",
    zh: "❌ 创建支付失败。请重试。",
  },

  // Profile
  "profile.title": {
    id: "*Profil Kamu*",
    en: "*Your Profile*",
    ru: "*Ваш профиль*",
    zh: "*个人资料*",
  },
  // profile.tier and profile.credits already defined above
  "profile.videos_created": {
    id: "Video Dibuat",
    en: "Videos Created",
    ru: "Видео создано",
    zh: "已创建视频",
  },
  "profile.referral_code": {
    id: "Kode",
    en: "Code",
    ru: "Код",
    zh: "代码",
  },
  "profile.total_referrals": {
    id: "Total Referral",
    en: "Total Referrals",
    ru: "Всего рефералов",
    zh: "总推荐数",
  },
  "profile.commission": {
    id: "Komisi",
    en: "Commission",
    ru: "Комиссия",
    zh: "佣金",
  },
  "profile.total_spent": {
    id: "Total",
    en: "Total Spent",
    ru: "Всего потрачено",
    zh: "总消费",
  },
  "profile.subscription_plan": {
    id: "Plan",
    en: "Plan",
    ru: "Тариф",
    zh: "计划",
  },
  "profile.renews_in": {
    id: "{action} dalam: {days} hari",
    en: "{action} in: {days} days",
    ru: "{action} через: {days} дней",
    zh: "{action}还有: {days} 天",
  },

  // Videos
  "videos.copy_link": {
    id: "📋 *Link Download Video:*\n\n{url}\n\n_Tekan dan tahan link di atas untuk menyalin_",
    en: "📋 *Video Download Link:*\n\n{url}\n\n_Tap and hold the link above to copy_",
    ru: "📋 *Ссылка для скачивания:*\n\n{url}\n\n_Нажмите и удерживайте ссылку для копирования_",
    zh: "📋 *视频下载链接:*\n\n{url}\n\n_长按链接复制_",
  },
  "videos.not_found": {
    id: "❌ Video tidak ditemukan",
    en: "❌ Video not found",
    ru: "❌ Видео не найдено",
    zh: "❌ 视频未找到",
  },
  "videos.link_copied": {
    id: "Link disalin!",
    en: "Link copied!",
    ru: "Ссылка скопирована!",
    zh: "链接已复制！",
  },

  // Worker notifications
  "worker.vo_failed": {
    id: "⚠️ Voice-over tidak dapat ditambahkan ke video ini. Video dikirim tanpa audio narasi.",
    en: "⚠️ Voice-over could not be added to this video. Video sent without narration.",
    ru: "⚠️ Озвучка не может быть добавлена. Видео отправлено без аудио.",
    zh: "⚠️ 无法添加语音旁白。视频已发送（无旁白）。",
  },
  "worker.partial_refund": {
    id: "💰 Refund: {amount} kredit dikembalikan untuk {count} scene yang gagal.",
    en: "💰 Refund: {amount} credits returned for {count} failed scene(s).",
    ru: "💰 Возврат: {amount} кредитов за {count} неудавшихся сцен.",
    zh: "💰 退款: {amount} 积分已退还（{count} 个场景失败）。",
  },

  // Common errors (error.generic already defined above)
  "error.no_session": {
    id: "Tidak ada sesi pembuatan video aktif. Gunakan /create untuk mulai.",
    en: "No active video creation session. Use /create to start.",
    ru: "Нет активного сеанса создания видео. Используйте /create.",
    zh: "没有活动的视频创建会话。使用 /create 开始。",
  },
  "error.no_photos": {
    id: "Belum ada foto. Kirim gambar referensi atau /skip.",
    en: "No photos uploaded. Send a reference image or /skip.",
    ru: "Фото не загружены. Отправьте референс или /skip.",
    zh: "尚未上传照片。发送参考图或 /skip。",
  },

  // Payment failure notification
  "payment.failed": {
    id: "❌ *Pembayaran Gagal*\n\nOrder: `{orderId}`\n\nSilakan coba lagi atau pilih metode pembayaran lain.",
    en: "❌ *Payment Failed*\n\nOrder: `{orderId}`\n\nPlease try again or choose a different payment method.",
    ru: "❌ *Оплата не удалась*\n\nЗаказ: `{orderId}`\n\nПопробуйте снова или выберите другой способ оплаты.",
    zh: "❌ *支付失败*\n\nOrder: `{orderId}`\n\n请重试或选择其他支付方式。",
  },
  "payment.expired": {
    id: "❌ *Pembayaran Kedaluwarsa*\n\nOrder: `{orderId}`\n\nSilakan coba lagi.",
    en: "❌ *Payment Expired*\n\nOrder: `{orderId}`\n\nPlease try again.",
    ru: "❌ *Оплата истекла*\n\nЗаказ: `{orderId}`\n\nПопробуйте снова.",
    zh: "❌ *支付已过期*\n\nOrder: `{orderId}`\n\n请重试。",
  },
  "payment.crypto_success": {
    id: "✅ *Pembayaran Crypto Berhasil!*\n\n💰 {amount} {coin} diterima\n🎬 Kredit sudah ditambahkan ke akun kamu\n\nGunakan /create untuk buat video sekarang! 🚀",
    en: "✅ *Crypto Payment Confirmed!*\n\n💰 {amount} {coin} received\n🎬 Credits added to your account\n\nUse /create to generate your video now! 🚀",
    ru: "✅ *Крипто-оплата подтверждена!*\n\n💰 {amount} {coin} получено\n🎬 Кредиты добавлены\n\nИспользуйте /create для создания видео! 🚀",
    zh: "✅ *加密支付成功！*\n\n💰 {amount} {coin} 已收到\n🎬 积分已添加到您的账户\n\n使用 /create 开始制作视频！🚀",
  },

  // ---------------------------------------------------------------------------
  // Callback / General Errors
  // ---------------------------------------------------------------------------
  "cb.transfer_cancelled": {
    id: "❌ Transfer dibatalkan.",
    en: "❌ Transfer cancelled.",
    ru: "❌ Перевод отменён.",
    zh: "❌ 转账已取消。",
  },
  "cb.transfer_failed": {
    id: "❌ *Transfer Gagal:* {error}",
    en: "❌ *Transfer Failed:* {error}",
    ru: "❌ *Перевод не удался:* {error}",
    zh: "❌ *转账失败:* {error}",
  },
  "cb.transfer_error": {
    id: "❌ *Transfer Error:* {error}",
    en: "❌ *Transfer Error:* {error}",
    ru: "❌ *Ошибка перевода:* {error}",
    zh: "❌ *转账错误:* {error}",
  },
  "cb.access_denied": {
    id: "❌ Akses ditolak.",
    en: "❌ Access denied.",
    ru: "❌ Доступ запрещён.",
    zh: "❌ 访问被拒绝。",
  },
  "cb.access_denied_video": {
    id: "❌ Akses ditolak atau video tidak ditemukan.",
    en: "❌ Access denied or video not found.",
    ru: "❌ Доступ запрещён или видео не найдено.",
    zh: "❌ 访问被拒绝或视频未找到。",
  },
  "cb.clone_data_missing": {
    id: "❌ Data clone tidak ditemukan. Silakan mulai ulang.",
    en: "❌ Clone data not found. Please start over.",
    ru: "❌ Данные клонирования не найдены. Начните заново.",
    zh: "❌ 未找到克隆数据。请重新开始。",
  },
  "cb.analysis_data_missing": {
    id: "❌ Data analisis tidak ditemukan. Silakan mulai ulang.",
    en: "❌ Analysis data not found. Please start over.",
    ru: "❌ Данные анализа не найдены. Начните заново.",
    zh: "❌ 未找到分析数据。请重新开始。",
  },
  "cb.insufficient_credits_cost": {
    id: "❌ Kredit tidak cukup. Butuh {cost} kredit.",
    en: "❌ Insufficient credits. Need {cost} credits.",
    ru: "❌ Недостаточно кредитов. Нужно {cost} кредитов.",
    zh: "❌ 积分不足。需要 {cost} 积分。",
  },
  "cb.video_process_failed_refund": {
    id: "❌ Gagal memproses video. Kredit dikembalikan.",
    en: "❌ Failed to process video. Credits refunded.",
    ru: "❌ Не удалось обработать видео. Кредиты возвращены.",
    zh: "❌ 视频处理失败。积分已退还。",
  },
  "cb.user_not_found_start": {
    id: "❌ User tidak ditemukan. Silakan /start ulang.",
    en: "❌ User not found. Please /start again.",
    ru: "❌ Пользователь не найден. Используйте /start.",
    zh: "❌ 用户未找到。请重新 /start。",
  },
  "cb.prompt_not_found": {
    id: "❌ Prompt tidak ditemukan.",
    en: "❌ Prompt not found.",
    ru: "❌ Промпт не найден.",
    zh: "❌ 未找到提示词。",
  },
  "cb.video_not_found_url": {
    id: "❌ Video tidak ditemukan atau tidak ada URL.",
    en: "❌ Video not found or has no URL.",
    ru: "❌ Видео не найдено или нет URL.",
    zh: "❌ 视频未找到或没有链接。",
  },
  "cb.unknown_action": {
    id: "Aksi tidak dikenali.",
    en: "Unknown action.",
    ru: "Неизвестное действие.",
    zh: "未知操作。",
  },
  "cb.storyboard_failed": {
    id: "Gagal membuat storyboard. Coba lagi.",
    en: "Failed to create storyboard. Try again.",
    ru: "Не удалось создать раскадровку. Попробуйте снова.",
    zh: "创建分镜头失败。请重试。",
  },
  "cb.caption_failed": {
    id: "Gagal membuat caption. Silakan coba lagi.",
    en: "Failed to create caption. Please try again.",
    ru: "Не удалось создать подпись. Попробуйте снова.",
    zh: "创建文案失败。请重试。",
  },
  "cb.video_not_found_create": {
    id: "Video tidak ditemukan. Gunakan /create untuk mulai.",
    en: "Video not found. Use /create to start.",
    ru: "Видео не найдено. Используйте /create.",
    zh: "视频未找到。使用 /create 开始。",
  },
  "cb.processing_transfer": {
    id: "Memproses transfer...",
    en: "Processing transfer...",
    ru: "Обработка перевода...",
    zh: "正在处理转账...",
  },
  "cb.retrying_video": {
    id: "Mencoba ulang video...",
    en: "Retrying video...",
    ru: "Повторная генерация видео...",
    zh: "正在重试视频...",
  },
  "cb.caption_copied": {
    id: "Caption disalin di bawah!",
    en: "Caption copied below!",
    ru: "Подпись скопирована ниже!",
    zh: "文案已复制到下方！",
  },
  "cb.loading_video_settings": {
    id: "Memuat pengaturan video...",
    en: "Loading video settings...",
    ru: "Загрузка настроек видео...",
    zh: "正在加载视频设置...",
  },
  "cb.select_platform_min": {
    id: "Pilih minimal satu platform.",
    en: "Select at least one platform.",
    ru: "Выберите хотя бы одну платформу.",
    zh: "请至少选择一个平台。",
  },
  "cb.publishing_all": {
    id: "Mempublikasikan ke semua akun...",
    en: "Publishing to all accounts...",
    ru: "Публикация во все аккаунты...",
    zh: "正在发布到所有账号...",
  },
  "cb.account_disconnected": {
    id: "✅ Akun terputus.",
    en: "✅ Account disconnected.",
    ru: "✅ Аккаунт отключён.",
    zh: "✅ 账号已断开。",
  },

  // ---------------------------------------------------------------------------
  // Referral / Commission
  // ---------------------------------------------------------------------------
  "referral.insufficient_commission_credits": {
    id: "❌ Komisi tidak cukup untuk ditukar ke kredit.",
    en: "❌ Insufficient commission to convert to credits.",
    ru: "❌ Недостаточно комиссии для конвертации в кредиты.",
    zh: "❌ 佣金不足，无法兑换积分。",
  },
  "referral.insufficient_commission_sell": {
    id: "❌ Komisi tidak cukup untuk dijual.",
    en: "❌ Insufficient commission to sell.",
    ru: "❌ Недостаточно комиссии для продажи.",
    zh: "❌ 佣金不足，无法出售。",
  },
  "referral.withdrawal_load_failed": {
    id: "❌ Gagal memuat info withdrawal. Coba lagi.",
    en: "❌ Failed to load withdrawal info. Try again.",
    ru: "❌ Не удалось загрузить данные о выводе. Попробуйте снова.",
    zh: "❌ 加载提现信息失败。请重试。",
  },
  "referral.convert_failed": {
    id: "❌ Gagal konversi. Coba lagi.",
    en: "❌ Conversion failed. Try again.",
    ru: "❌ Конвертация не удалась. Попробуйте снова.",
    zh: "❌ 兑换失败。请重试。",
  },
  "referral.cashout_failed": {
    id: "❌ Gagal memproses cashout. Coba lagi.",
    en: "❌ Failed to process cashout. Try again.",
    ru: "❌ Не удалось обработать вывод. Попробуйте снова.",
    zh: "❌ 提现处理失败。请重试。",
  },
  "referral.cashout_completed": {
    id: "✅ *Penarikan Komisi Selesai!*\n\nPenarikan komisi sebesar *Rp {amount}* telah diproses dan ditransfer ke rekening Anda!",
    en: "✅ *Commission Withdrawal Complete!*\n\nYour commission withdrawal of *Rp {amount}* has been processed and transferred!",
    ru: "✅ *Вывод комиссии завершён!*\n\nВаш вывод на сумму *Rp {amount}* был обработан и переведён!",
    zh: "✅ *佣金提现完成！*\n\n您的佣金提现 *Rp {amount}* 已处理并转账！",
  },
  "referral.load_failed": {
    id: "❌ Gagal memuat info referral. Coba lagi.",
    en: "❌ Unable to load referral info. Please try again.",
    ru: "❌ Не удалось загрузить реферальную информацию. Попробуйте снова.",
    zh: "❌ 无法加载推荐信息。请重试。",
  },

  // ---------------------------------------------------------------------------
  // Prompts
  // ---------------------------------------------------------------------------
  "prompt.library_load_failed": {
    id: "❌ Gagal load prompt library. Coba lagi.",
    en: "❌ Failed to load prompt library. Try again.",
    ru: "❌ Не удалось загрузить библиотеку промптов. Попробуйте снова.",
    zh: "❌ 加载提示库失败。请重试。",
  },
  "prompt.niche_not_found": {
    id: "❌ Niche tidak ditemukan.",
    en: "❌ Niche not found.",
    ru: "❌ Ниша не найдена.",
    zh: "❌ 未找到该类别。",
  },
  "prompt.daily_load_failed": {
    id: "❌ Gagal load daily prompt. Coba lagi.",
    en: "❌ Failed to load daily prompt. Try again.",
    ru: "❌ Не удалось загрузить ежедневный промпт. Попробуйте снова.",
    zh: "❌ 加载每日提示失败。请重试。",
  },
  "prompt.trending_load_failed": {
    id: "❌ Gagal load trending. Coba lagi.",
    en: "❌ Failed to load trending. Try again.",
    ru: "❌ Не удалось загрузить тренды. Попробуйте снова.",
    zh: "❌ 加载热门趋势失败。请重试。",
  },
  "prompt.fingerprint_load_failed": {
    id: "❌ Gagal load fingerprint. Coba lagi.",
    en: "❌ Failed to load fingerprint. Try again.",
    ru: "❌ Не удалось загрузить отпечаток. Попробуйте снова.",
    zh: "❌ 加载特征指纹失败。请重试。",
  },
  "prompt.saved_load_failed": {
    id: "❌ Gagal load prompt tersimpan.",
    en: "❌ Failed to load saved prompts.",
    ru: "❌ Не удалось загрузить сохранённые промпты.",
    zh: "❌ 加载已保存的提示失败。",
  },
  "prompt.deleted": {
    id: "🗑️ Prompt dihapus!",
    en: "🗑️ Prompt deleted!",
    ru: "🗑️ Промпт удалён!",
    zh: "🗑️ 提示已删除！",
  },
  "prompt.saved_to_session": {
    id: "💾 Prompt disimpan ke sesi kamu!",
    en: "💾 Prompt saved to your session!",
    ru: "💾 Промпт сохранён в вашу сессию!",
    zh: "💾 提示已保存到您的会话！",
  },
  "prompt.save_failed": {
    id: "❌ Gagal menyimpan. Coba lagi.",
    en: "❌ Failed to save. Try again.",
    ru: "❌ Не удалось сохранить. Попробуйте снова.",
    zh: "❌ 保存失败。请重试。",
  },
  "prompt.btn_create_video_hpas": {
    id: "🎥 Buat Video (HPAS V3)",
    en: "🎥 Create Video (HPAS V3)",
    ru: "🎥 Создать видео (HPAS V3)",
    zh: "🎥 创建视频 (HPAS V3)",
  },
  "prompt.btn_generate_image": {
    id: "🖼️ Generate Gambar (Text-to-Image)",
    en: "🖼️ Generate Image (Text-to-Image)",
    ru: "🖼️ Создать изображение (Text-to-Image)",
    zh: "🖼️ 生成图片 (文本转图片)",
  },
  "prompt.btn_generate_i2i": {
    id: "📸 Generate Gambar + Foto Referensi (i2i)",
    en: "📸 Generate Image + Reference Photo (i2i)",
    ru: "📸 Создать изображение + Фото-референс (i2i)",
    zh: "📸 生成图片 + 参考照片 (i2i)",
  },
  "prompt.btn_edit_prompt": {
    id: "✏️ Edit Prompt Dulu",
    en: "✏️ Edit Prompt First",
    ru: "✏️ Сначала отредактировать промпт",
    zh: "✏️ 先编辑提示词",
  },
  "prompt.btn_pick_another": {
    id: "◀️ Pilih Prompt Lain",
    en: "◀️ Pick Another Prompt",
    ru: "◀️ Выбрать другой промпт",
    zh: "◀️ 选择其他提示词",
  },
  "prompt.options_label": {
    id: "🎬 *Opsi:*",
    en: "🎬 *Options:*",
    ru: "🎬 *Варианты:*",
    zh: "🎬 *选项:*",
  },
  "prompt.selected": {
    id: "✅ *Prompt Dipilih!*",
    en: "✅ *Prompt Selected!*",
    ru: "✅ *Промпт выбран!*",
    zh: "✅ *已选择提示词！*",
  },
  "prompt.cost_credit": {
    id: "💳 Biaya: {cost} kredit (sisa: {balance})",
    en: "💳 Cost: {cost} credits (remaining: {balance})",
    ru: "💳 Стоимость: {cost} кредитов (остаток: {balance})",
    zh: "💳 费用: {cost} 积分 (余额: {balance})",
  },
  "prompt.cost_bonus": {
    id: "🎁 Menggunakan: {bonusType}",
    en: "🎁 Using: {bonusType}",
    ru: "🎁 Используется: {bonusType}",
    zh: "🎁 使用: {bonusType}",
  },
  "prompt.image_success": {
    id: "✅ *Gambar Berhasil!*",
    en: "✅ *Image Generated!*",
    ru: "✅ *Изображение создано!*",
    zh: "✅ *图片生成成功！*",
  },
  "prompt.balance_credit": {
    id: "💳 Sisa kredit: {balance}",
    en: "💳 Remaining credits: {balance}",
    ru: "💳 Остаток кредитов: {balance}",
    zh: "💳 剩余积分: {balance}",
  },
  "prompt.balance_bonus_used": {
    id: "🎁 {bonusType} digunakan",
    en: "🎁 {bonusType} used",
    ru: "🎁 {bonusType} использован",
    zh: "🎁 {bonusType} 已使用",
  },
  "prompt.like_result": {
    id: "Suka hasilnya? Generate lebih banyak!",
    en: "Like the result? Generate more!",
    ru: "Нравится результат? Создавайте ещё!",
    zh: "喜欢结果？生成更多！",
  },
  "prompt.btn_generate_again": {
    id: "🔄 Generate Lagi",
    en: "🔄 Generate Again",
    ru: "🔄 Создать ещё",
    zh: "🔄 再次生成",
  },
  "prompt.btn_buy_credits": {
    id: "💰 Beli Kredit",
    en: "💰 Buy Credits",
    ru: "💰 Купить кредиты",
    zh: "💰 购买积分",
  },
  "prompt.btn_main_menu": {
    id: "🏠 Menu Utama",
    en: "🏠 Main Menu",
    ru: "🏠 Главное меню",
    zh: "🏠 主菜单",
  },
  "prompt.btn_try_again": {
    id: "🔄 Coba Lagi",
    en: "🔄 Try Again",
    ru: "🔄 Попробовать снова",
    zh: "🔄 重试",
  },
  "prompt.generation_failed": {
    id: "❌ *Generation Gagal*\n\nTerjadi error saat generate image.\nBonus Anda tidak terpakai.\n\nSilakan coba lagi atau hubungi support.",
    en: "❌ *Generation Failed*\n\nAn error occurred during image generation.\nYour bonus was not used.\n\nPlease try again or contact support.",
    ru: "❌ *Генерация не удалась*\n\nПроизошла ошибка при создании изображения.\nВаш бонус не был использован.\n\nПопробуйте снова или обратитесь в поддержку.",
    zh: "❌ *生成失败*\n\n生成图片时出错。\n您的奖励未被使用。\n\n请重试或联系支持。",
  },
  "prompt.free_trial_exhausted": {
    id: "⚠️ *Free Trial sudah habis!*\n\nWelcome Bonus: ❌ Sudah digunakan\nDaily Free: ❌ Belum reset\n\nBeli kredit untuk melanjutkan.",
    en: "⚠️ *Free Trial Exhausted!*\n\nWelcome Bonus: ❌ Already used\nDaily Free: ❌ Not yet reset\n\nBuy credits to continue.",
    ru: "⚠️ *Пробный период исчерпан!*\n\nПриветственный бонус: ❌ Уже использован\nЕжедневный бесплатный: ❌ Ещё не сброшен\n\nКупите кредиты для продолжения.",
    zh: "⚠️ *免费试用已用完！*\n\n欢迎奖励: ❌ 已使用\n每日免费: ❌ 未重置\n\n购买积分以继续。",
  },
  "prompt.btn_back": {
    id: "◀️ Kembali",
    en: "◀️ Back",
    ru: "◀️ Назад",
    zh: "◀️ 返回",
  },
  "prompt.generating": {
    id: "⏳ *Generating...*\n\n📋 {name}\n💳 Menggunakan: {cost}\n\nMohon tunggu 10-30 detik...",
    en: "⏳ *Generating...*\n\n📋 {name}\n💳 Using: {cost}\n\nPlease wait 10-30 seconds...",
    ru: "⏳ *Генерация...*\n\n📋 {name}\n💳 Используется: {cost}\n\nПожалуйста, подождите 10-30 секунд...",
    zh: "⏳ *生成中...*\n\n📋 {name}\n💳 使用: {cost}\n\n请等待10-30秒...",
  },
  "prompt.btn_pick_niche": {
    id: "◀️ Pilih Niche Lain",
    en: "◀️ Pick Another Niche",
    ru: "◀️ Выбрать другую нишу",
    zh: "◀️ 选择其他类别",
  },
  "prompt.edit_prompt_msg": {
    id: "✏️ *Edit Prompt*\n\nPrompt saat ini:\n`{prompt}`\n\nKetik prompt baru atau modifikasi di atas, lalu kirim.\nAtau kirim foto produk + teks untuk mengganti prompt.",
    en: "✏️ *Edit Prompt*\n\nCurrent prompt:\n`{prompt}`\n\nType a new prompt or modify the above, then send.\nOr send a product photo + text to replace the prompt.",
    ru: "✏️ *Редактировать промпт*\n\nТекущий промпт:\n`{prompt}`\n\nВведите новый промпт или измените текущий, затем отправьте.\nИли отправьте фото продукта + текст для замены промпта.",
    zh: "✏️ *编辑提示词*\n\n当前提示词:\n`{prompt}`\n\n输入新的提示词或修改以上内容，然后发送。\n或发送产品照片+文字来替换提示词。",
  },

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------
  "sub.start_first": {
    id: "❌ Silakan /start terlebih dahulu untuk menggunakan fitur ini.",
    en: "❌ Please /start first to use this feature.",
    ru: "❌ Сначала используйте /start для доступа к этой функции.",
    zh: "❌ 请先 /start 以使用此功能。",
  },
  "sub.payment_create_failed": {
    id: "❌ Gagal membuat pembayaran. Coba lagi.",
    en: "❌ Failed to create payment. Please try again.",
    ru: "❌ Не удалось создать платёж. Попробуйте снова.",
    zh: "❌ 创建支付失败。请重试。",
  },
  "sub.cancel_failed": {
    id: "❌ Gagal membatalkan. Coba lagi.",
    en: "❌ Failed to cancel. Please try again.",
    ru: "❌ Не удалось отменить. Попробуйте снова.",
    zh: "❌ 取消失败。请重试。",
  },
  "cancel.nothing_active": {
    id: "Tidak ada operasi yang aktif.",
    en: "No active operation to cancel.",
    ru: "Нет активной операции.",
    zh: "没有活动操作可取消。",
  },
  "cancel.cancelled": {
    id: "Dibatalkan. Kembali ke menu utama.",
    en: "Cancelled. Returning to main menu.",
    ru: "Отменено. Возврат в главное меню.",
    zh: "已取消。返回主菜单。",
  },
  "sub.creating_payment": {
    id: "Membuat pembayaran...",
    en: "Creating payment...",
    ru: "Создание платежа...",
    zh: "正在创建支付...",
  },
  "sub.processing": {
    id: "Memproses...",
    en: "Processing...",
    ru: "Обработка...",
    zh: "处理中...",
  },

  // ---------------------------------------------------------------------------
  // Topup (remaining)
  // ---------------------------------------------------------------------------
  "topup.process_failed": {
    id: "❌ Gagal memproses. Coba lagi.",
    en: "❌ Failed to process. Please try again.",
    ru: "❌ Не удалось обработать. Попробуйте снова.",
    zh: "❌ 处理失败。请重试。",
  },
  "topup.invalid_package": {
    id: "❌ Paket tidak valid.",
    en: "❌ Invalid package.",
    ru: "❌ Недействительный пакет.",
    zh: "❌ 无效的套餐。",
  },
  "topup.stars_invoice_failed": {
    id: "❌ Gagal membuat invoice Stars. Coba lagi.",
    en: "❌ Failed to create Stars invoice. Please try again.",
    ru: "❌ Не удалось создать Stars-счёт. Попробуйте снова.",
    zh: "❌ 创建 Stars 发票失败。请重试。",
  },
  "topup.crypto_payment_failed": {
    id: "❌ Gagal membuat pembayaran crypto. Coba lagi.",
    en: "❌ Failed to create crypto payment. Please try again.",
    ru: "❌ Не удалось создать крипто-платёж. Попробуйте снова.",
    zh: "❌ 创建加密支付失败。请重试。",
  },
  "topup.something_wrong": {
    id: "❌ Terjadi kesalahan. Coba lagi.",
    en: "❌ Something went wrong. Please try again.",
    ru: "❌ Что-то пошло не так. Попробуйте снова.",
    zh: "❌ 出了点问题。请重试。",
  },
  "topup.creating_crypto": {
    id: "Membuat pembayaran crypto...",
    en: "Creating crypto payment...",
    ru: "Создание крипто-платежа...",
    zh: "正在创建加密支付...",
  },

  // ---------------------------------------------------------------------------
  // Video Uploader / Analyzer
  // ---------------------------------------------------------------------------
  "uploader.no_media": {
    id: "❌ Media tidak ditemukan. Kirim video atau gambar.",
    en: "❌ No media found. Please send a video or image.",
    ru: "❌ Медиа не найдено. Отправьте видео или изображение.",
    zh: "❌ 未找到媒体。请发送视频或图片。",
  },
  "uploader.analyzing": {
    id: "⏳ *Menganalisis...*\nMengekstrak prompt dari media kamu...",
    en: "⏳ *Analyzing...*\nExtracting prompt from your media...",
    ru: "⏳ *Анализируем...*\nИзвлекаем промпт из вашего медиа...",
    zh: "⏳ *分析中...*\n正在从您的媒体中提取提示词...",
  },
  "uploader.analysis_failed": {
    id: "❌ Gagal menganalisis media. Coba lagi.",
    en: "❌ Failed to analyze media. Please try again.",
    ru: "❌ Не удалось проанализировать медиа. Попробуйте снова.",
    zh: "❌ 媒体分析失败。请重试。",
  },
  "uploader.analyzing_photos": {
    id: "Menganalisis {count} foto dengan AI Vision...",
    en: "Analyzing {count} photo(s) with AI Vision...",
    ru: "Анализируем {count} фото с AI Vision...",
    zh: "正在使用 AI Vision 分析 {count} 张照片...",
  },
  "uploader.no_active_creation": {
    id: "❌ Tidak ada pembuatan video aktif. Mulai dengan /create",
    en: "❌ No active video creation. Please start with /create",
    ru: "❌ Нет активного создания видео. Начните с /create",
    zh: "❌ 没有进行中的视频创建。请使用 /create 开始",
  },

  // ---------------------------------------------------------------------------
  // Social / Send / Transfer
  // ---------------------------------------------------------------------------
  "social.unable_identify_user": {
    id: "❌ Tidak dapat mengidentifikasi pengguna.",
    en: "❌ Unable to identify user.",
    ru: "❌ Невозможно идентифицировать пользователя.",
    zh: "❌ 无法识别用户。",
  },
  "social.invalid_recipient_id": {
    id: "❌ Format ID penerima tidak valid.",
    en: "❌ Invalid recipient ID format.",
    ru: "❌ Неверный формат ID получателя.",
    zh: "❌ 接收者 ID 格式无效。",
  },
  "social.amount_positive": {
    id: "❌ Jumlah harus angka positif.",
    en: "❌ Amount must be a positive number.",
    ru: "❌ Сумма должна быть положительным числом.",
    zh: "❌ 金额必须为正数。",
  },
  "social.transfer_failed": {
    id: "❌ Transfer Gagal: {error}",
    en: "❌ Transfer Failed: {error}",
    ru: "❌ Перевод не удался: {error}",
    zh: "❌ 转账失败: {error}",
  },
  "social.send_usage": {
    id: "Penggunaan: /send <id_telegram_penerima> <jumlah>\nContoh: /send 123456789 50",
    en: "Usage: /send <recipient_telegram_id> <amount>\nExample: /send 123456789 50",
    ru: "Использование: /send <telegram_id_получателя> <сумма>\nПример: /send 123456789 50",
    zh: "用法: /send <收件人telegram_id> <金额>\n示例: /send 123456789 50",
  },

  // ---------------------------------------------------------------------------
  // Social — Coming Soon
  // ---------------------------------------------------------------------------
  "social.coming_soon": {
    id: "🔗 *Social Media Auto-Post*\n\nFitur koneksi akun sosial media dan auto-post sedang dalam pengembangan.\n\nSegera hadir: hubungkan TikTok, Instagram, Facebook, YouTube dan publikasikan video langsung dari bot!",
    en: "🔗 *Social Media Auto-Post*\n\nSocial media account connection and auto-post is under development.\n\nComing soon: connect TikTok, Instagram, Facebook, YouTube and publish videos directly from the bot!",
    ru: "🔗 *Авто-публикация в соцсетях*\n\nПодключение аккаунтов соцсетей и авто-публикация в разработке.\n\nСкоро: подключите TikTok, Instagram, Facebook, YouTube и публикуйте видео прямо из бота!",
    zh: "🔗 *社交媒体自动发布*\n\n社交媒体账号连接和自动发布功能正在开发中。\n\n即将推出：连接TikTok、Instagram、Facebook、YouTube，直接从机器人发布视频！",
  },
  "social.coming_soon_short": {
    id: "🚧 Segera hadir!",
    en: "🚧 Coming soon!",
    ru: "🚧 Скоро!",
    zh: "🚧 即将推出！",
  },

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------
  "misc.coming_soon": {
    id: "🚧 Fitur segera hadir!",
    en: "🚧 Feature coming soon!",
    ru: "🚧 Функция скоро появится!",
    zh: "🚧 功能即将推出！",
  },
  "misc.ads_report_failed": {
    id: "❌ Gagal menarik laporan.",
    en: "❌ Failed to fetch report.",
    ru: "❌ Не удалось получить отчёт.",
    zh: "❌ 获取报告失败。",
  },
  "misc.ads_ideas_failed": {
    id: "❌ Gagal generate ide.",
    en: "❌ Failed to generate ideas.",
    ru: "❌ Не удалось сгенерировать идеи.",
    zh: "❌ 生成创意失败。",
  },
  "misc.avatar_not_found": {
    id: "Avatar tidak ditemukan.",
    en: "Avatar not found.",
    ru: "Аватар не найден.",
    zh: "未找到头像。",
  },
  "misc.avatar_set_default": {
    id: "✅ Avatar ditetapkan sebagai default!",
    en: "✅ Avatar set as default!",
    ru: "✅ Аватар установлен по умолчанию!",
    zh: "✅ 头像已设为默认！",
  },
  "misc.user_not_found": {
    id: "Error: pengguna tidak ditemukan.",
    en: "Error: user not found.",
    ru: "Ошибка: пользователь не найден.",
    zh: "错误：用户未找到。",
  },
  "misc.share_coming_soon": {
    id: "Fitur share segera hadir!",
    en: "Share feature coming soon!",
    ru: "Функция поделиться скоро появится!",
    zh: "分享功能即将推出！",
  },

  // ---------------------------------------------------------------------------
  // Message handler — hardcoded strings replaced with t() calls
  // ---------------------------------------------------------------------------
  "msg.img_btn_product_photo": {
    id: "🛍️ Foto Produk",
    en: "🛍️ Product Photo",
    ru: "🛍️ Фото товара",
    zh: "🛍️ 产品照片",
  },
  "msg.img_btn_fnb": {
    id: "🍔 F&B / Kuliner",
    en: "🍔 F&B Food",
    ru: "🍔 Еда и напитки",
    zh: "🍔 餐饮美食",
  },
  "msg.img_btn_realestate": {
    id: "🏠 Properti / Real Estate",
    en: "🏠 Real Estate",
    ru: "🏠 Недвижимость",
    zh: "🏠 房地产",
  },
  "msg.img_btn_car": {
    id: "🚗 Otomotif / Mobil",
    en: "🚗 Car/Automotive",
    ru: "🚗 Автомобиль",
    zh: "🚗 汽车/汽车业",
  },
  "msg.photo_received_niche": {
    id: "✅ Foto diterima!\n\nSekarang, pilih niche kamu:",
    en: "✅ Photo received!\n\nNow, please select your niche:",
    ru: "✅ Фото получено!\n\nТеперь выберите нишу:",
    zh: "✅ 照片已收到！\n\n请选择您的类别：",
  },
  "msg.niche_btn_fnb": {
    id: "🍔 F&B",
    en: "🍔 F&B",
    ru: "🍔 Еда",
    zh: "🍔 餐饮",
  },
  "msg.niche_btn_beauty": {
    id: "💄 Beauty",
    en: "💄 Beauty",
    ru: "💄 Красота",
    zh: "💄 美妆",
  },
  "msg.niche_btn_retail": {
    id: "🛍️ Retail",
    en: "🛍️ Retail",
    ru: "🛍️ Розница",
    zh: "🛍️ 零售",
  },
  "msg.niche_btn_services": {
    id: "🔧 Services",
    en: "🔧 Services",
    ru: "🔧 Услуги",
    zh: "🔧 服务",
  },
  "msg.niche_btn_professional": {
    id: "🏢 Professional",
    en: "🏢 Professional",
    ru: "🏢 Профессиональный",
    zh: "🏢 专业",
  },
  "msg.niche_btn_hospitality": {
    id: "🏨 Hospitality",
    en: "🏨 Hospitality",
    ru: "🏨 Гостеприимство",
    zh: "🏨 酒店业",
  },
  "msg.ref_image_received": {
    id: '📸 *Gambar referensi diterima!*\n\nSekarang deskripsikan yang ingin di-generate:\n\n_Contoh: "Produk di meja marmer dengan pencahayaan studio lembut, foto marketing"_',
    en: '📸 *Reference image received!*\n\nNow describe what you want to generate:\n\n_Example: "Product on marble table with soft studio lighting, marketing photo"_',
    ru: '📸 *Референсное изображение получено!*\n\nТеперь опишите, что хотите создать:\n\n_Пример: "Продукт на мраморном столе с мягким студийным освещением, маркетинговое фото"_',
    zh: '📸 *参考图片已收到！*\n\n现在描述您想生成的内容：\n\n_示例："产品放在大理石桌上，柔和的工作室灯光，营销照片"_',
  },
  "msg.btn_cancel": {
    id: "❌ Batal",
    en: "❌ Cancel",
    ru: "❌ Отмена",
    zh: "❌ 取消",
  },
  "msg.avatar_photo_received": {
    id: '📸 *Foto diterima!*\n\nBeri nama avatar ini (misal, "Sarah", "Model Produk", "Maskot Merek"):',
    en: '📸 *Photo received!*\n\nGive this avatar a name (e.g., "Sarah", "Product Model", "Brand Mascot"):',
    ru: '📸 *Фото получено!*\n\nДайте имя этому аватару (напр., "Сара", "Модель продукта", "Маскот бренда"):',
    zh: '📸 *照片已收到！*\n\n为此头像取个名字（如"Sarah"、"产品模特"、"品牌吉祥物"）：',
  },
  "msg.avatar_saved": {
    id: '✅ *Avatar "{name}" tersimpan!*\n{defaultLine}\n{descLine}Kamu bisa gunakan avatar ini saat generate gambar untuk karakter yang konsisten.',
    en: '✅ *Avatar "{name}" saved!*\n{defaultLine}\n{descLine}You can now use this avatar when generating images to keep consistent characters.',
    ru: '✅ *Аватар "{name}" сохранён!*\n{defaultLine}\n{descLine}Вы можете использовать этот аватар при генерации изображений для сохранения единого образа.',
    zh: '✅ *头像"{name}"已保存！*\n{defaultLine}\n{descLine}您现在可以在生成图片时使用此头像以保持角色一致性。',
  },
  "msg.avatar_default_line": {
    id: "⭐ Dijadikan avatar default\n",
    en: "⭐ Set as default avatar\n",
    ru: "⭐ Установлен как аватар по умолчанию\n",
    zh: "⭐ 设为默认头像\n",
  },
  "msg.btn_generate_with_avatar": {
    id: "🖼️ Generate dengan Avatar",
    en: "🖼️ Generate with Avatar",
    ru: "🖼️ Создать с аватаром",
    zh: "🖼️ 使用头像生成",
  },
  "msg.btn_manage_avatars": {
    id: "👤 Kelola Avatar",
    en: "👤 Manage Avatars",
    ru: "👤 Управление аватарами",
    zh: "👤 管理头像",
  },
  "msg.btn_back_to_menu": {
    id: "◀️ Kembali ke Menu",
    en: "◀️ Back to Menu",
    ru: "◀️ Назад в меню",
    zh: "◀️ 返回菜单",
  },
  "msg.video_analysis_result": {
    id: "📋 *Hasil Analisis Video*\n\n*Style:* {style}\n\n*Deskripsi:*\n{cleanPrompt}\n\nSiap buat video serupa?",
    en: "📋 *Video Analysis Result*\n\n*Style:* {style}\n\n*Description:*\n{cleanPrompt}\n\nReady to create a similar video?",
    ru: "📋 *Результат анализа видео*\n\n*Стиль:* {style}\n\n*Описание:*\n{cleanPrompt}\n\nГотовы создать похожее видео?",
    zh: "📋 *视频分析结果*\n\n*风格:* {style}\n\n*描述：*\n{cleanPrompt}\n\n准备创建类似视频吗？",
  },
  "msg.btn_create_similar_video": {
    id: "🎬 Buat Video Serupa",
    en: "🎬 Create Similar Video",
    ru: "🎬 Создать похожее видео",
    zh: "🎬 创建类似视频",
  },
  "msg.btn_edit_description": {
    id: "✏️ Edit Deskripsi",
    en: "✏️ Edit Description",
    ru: "✏️ Редактировать описание",
    zh: "✏️ 编辑描述",
  },
  "msg.btn_cancel_main_menu": {
    id: "❌ Batal",
    en: "❌ Cancel",
    ru: "❌ Отмена",
    zh: "❌ 取消",
  },
  "msg.analysis_failed_error": {
    id: "❌ *Analisis Gagal*\n\nError: {error}",
    en: "❌ *Analysis Failed*\n\nError: {error}",
    ru: "❌ *Анализ не удался*\n\nОшибка: {error}",
    zh: "❌ *分析失败*\n\n错误: {error}",
  },
  "msg.clone_desc_updated": {
    id: "✅ *Deskripsi Diperbarui!*\n\n*Style:* {style}\n\n*Deskripsi Baru:*\n{newDescription}\n\nSiap buat video?",
    en: "✅ *Description Updated!*\n\n*Style:* {style}\n\n*New Description:*\n{newDescription}\n\nReady to create video?",
    ru: "✅ *Описание обновлено!*\n\n*Стиль:* {style}\n\n*Новое описание:*\n{newDescription}\n\nГотовы создать видео?",
    zh: "✅ *描述已更新！*\n\n*风格:* {style}\n\n*新描述：*\n{newDescription}\n\n准备创建视频吗？",
  },
  "msg.btn_create_video_new": {
    id: "🎬 Buat Video",
    en: "🎬 Create Video",
    ru: "🎬 Создать видео",
    zh: "🎬 创建视频",
  },
  "msg.btn_edit_again": {
    id: "✏️ Edit Lagi",
    en: "✏️ Edit Again",
    ru: "✏️ Редактировать снова",
    zh: "✏️ 再次编辑",
  },
  "msg.clone_image_extracted": {
    id: "✅ Style Gambar Diekstrak:\n\n{cleanPrompt}\n\nStyle: {style}\n\nSiap generate gambar serupa?",
    en: "✅ Image Style Extracted:\n\n{cleanPrompt}\n\nStyle: {style}\n\nReady to generate a similar image?",
    ru: "✅ Стиль изображения извлечён:\n\n{cleanPrompt}\n\nСтиль: {style}\n\nГотовы создать похожее изображение?",
    zh: "✅ 图片风格已提取：\n\n{cleanPrompt}\n\n风格: {style}\n\n准备生成类似图片吗？",
  },
  "msg.btn_generate_similar_image": {
    id: "🖼️ Generate Gambar Serupa",
    en: "🖼️ Generate Similar Image",
    ru: "🖼️ Создать похожее изображение",
    zh: "🖼️ 生成类似图片",
  },
  "msg.clone_image_analyzing": {
    id: "⏳ *Menganalisis gambar...*\n\nMengekstrak style dan membuat prompt...",
    en: "⏳ *Analyzing image...*\n\nExtracting style and creating prompt...",
    ru: "⏳ *Анализируем изображение...*\n\nИзвлекаем стиль и создаём промпт...",
    zh: "⏳ *正在分析图片...*\n\n提取风格并生成提示词...",
  },
  "msg.max_photos_reached": {
    id: 'Kamu sudah upload {max} foto (maksimal).\n\nTap "Generate Sekarang" untuk mulai buat video, atau /skip untuk generate tanpa referensi.',
    en: 'You have already uploaded {max} photos (maximum).\n\nTap "Generate Now" to start video creation, or /skip to generate without references.',
    ru: 'Вы уже загрузили {max} фото (максимум).\n\nНажмите "Создать сейчас" для создания видео, или /skip без референсов.',
    zh: '您已上传 {max} 张照片（最多）。\n\n点击"立即生成"开始创建视频，或 /skip 不使用参考图。',
  },
  "msg.btn_generate_now": {
    id: "▶️ Generate Sekarang",
    en: "▶️ Generate Now",
    ru: "▶️ Создать сейчас",
    zh: "▶️ 立即生成",
  },
  "msg.btn_skip_reference": {
    id: "⏭️ Skip Referensi",
    en: "⏭️ Skip Reference",
    ru: "⏭️ Пропустить референс",
    zh: "⏭️ 跳过参考",
  },
  "msg.batch_photos_received": {
    id: "📸 {count} foto diterima!{extra}",
    en: "📸 {count} photo(s) received!{extra}",
    ru: "📸 {count} фото получено!{extra}",
    zh: "📸 收到 {count} 张照片！{extra}",
  },
  "msg.batch_send_more": {
    id: " Kirim lagi atau tap Generate.",
    en: " Send more or tap Generate.",
    ru: " Отправьте ещё или нажмите Создать.",
    zh: " 发送更多或点击生成。",
  },
  "msg.batch_max_reached": {
    id: " Maksimum tercapai — tap Generate.",
    en: " Maximum reached — tap Generate.",
    ru: " Максимум достигнут — нажмите Создать.",
    zh: " 已达最大数量 — 点击生成。",
  },
  "msg.btn_add_more": {
    id: "📸 Tambah Lagi",
    en: "📸 Add More",
    ru: "📸 Добавить ещё",
    zh: "📸 添加更多",
  },
  "msg.single_photo_received": {
    id: "📸 Foto {count}/{max} diterima!{extra}",
    en: "📸 Photo {count}/{max} received!{extra}",
    ru: "📸 Фото {count}/{max} получено!{extra}",
    zh: "📸 已收到照片 {count}/{max}！{extra}",
  },
  "msg.single_send_more": {
    id: " Kirim lebih banyak foto atau tap Generate.",
    en: " Send more photos or tap Generate.",
    ru: " Отправьте больше фото или нажмите Создать.",
    zh: " 发送更多照片或点击生成。",
  },
  "msg.repurpose_generate_t2v": {
    id: "🎬 Generate (Text-to-Video)",
    en: "🎬 Generate (Text-to-Video)",
    ru: "🎬 Создать (Text-to-Video)",
    zh: "🎬 生成（文字转视频）",
  },
  "msg.repurpose_generate_i2v": {
    id: "🖼️ Generate (Image-to-Video)",
    en: "🖼️ Generate (Image-to-Video)",
    ru: "🖼️ Создать (Image-to-Video)",
    zh: "🖼️ 生成（图片转视频）",
  },
  "msg.almost_ready": {
    id: "🎬 **Hampir Siap!**\n\nDiminta: {requested}d → Dioptimalkan: {optimized}d ({scenes} × {sceneDuration}d)\n💰 Biaya kredit: {creditCost}\n\n📸 **Kirim gambar referensi** untuk video kamu,\natau ketik /skip untuk biarkan AI generate semua.",
    en: "🎬 **Almost Ready!**\n\nRequested: {requested}s → Optimized: {optimized}s ({scenes} × {sceneDuration}s)\n💰 Credit cost: {creditCost}\n\n📸 **Send a reference image** for your video,\nor type /skip to let AI generate everything.",
    ru: "🎬 **Почти готово!**\n\nЗапрошено: {requested}с → Оптимизировано: {optimized}с ({scenes} × {sceneDuration}с)\n💰 Стоимость: {creditCost}\n\n📸 **Отправьте референс-изображение** для видео,\nили /skip, чтобы ИИ сгенерировал всё.",
    zh: "🎬 **即将完成！**\n\n请求: {requested}秒 → 优化: {optimized}秒（{scenes} × {sceneDuration}秒）\n💰 积分费用: {creditCost}\n\n📸 **发送参考图片**以供视频使用，\n或输入 /skip 让 AI 全自动生成。",
  },
  "msg.btn_manage_accounts": {
    id: "🔗 Kelola Akun",
    en: "🔗 Manage Accounts",
    ru: "🔗 Управление аккаунтами",
    zh: "🔗 管理账号",
  },

  // ---------------------------------------------------------------------------
  // Profile (remaining)
  // ---------------------------------------------------------------------------
  "profile.load_failed": {
    id: "Gagal memuat profil. Coba lagi.",
    en: "Unable to load profile. Please try again.",
    ru: "Не удалось загрузить профиль. Попробуйте снова.",
    zh: "无法加载个人资料。请重试。",
  },
  "profile.load_error": {
    id: "Gagal memuat profil. Coba lagi nanti.",
    en: "Failed to load profile. Please try again later.",
    ru: "Не удалось загрузить профиль. Попробуйте позже.",
    zh: "加载个人资料失败。请稍后重试。",
  },
  "profile.no_account": {
    id: "Kamu belum punya akun. Gunakan /start untuk mendaftar terlebih dahulu.",
    en: "You don't have an account yet. Please use /start to register first.",
    ru: "У вас ещё нет аккаунта. Используйте /start для регистрации.",
    zh: "您还没有账号。请先使用 /start 注册。",
  },

  // ---------------------------------------------------------------------------
  // Message handler state strings
  // ---------------------------------------------------------------------------
  "msg.invalid_duration": {
    id: "❌ Durasi harus antara 6 sampai 300 detik.",
    en: "❌ Duration must be between 6 and 300 seconds.",
    ru: "❌ Длительность должна быть от 6 до 300 секунд.",
    zh: "❌ 时长必须在6到300秒之间。",
  },
  "msg.save_prompt_failed": {
    id: "❌ Gagal menyimpan prompt. Coba lagi.",
    en: "❌ Failed to save prompt. Try again.",
    ru: "❌ Не удалось сохранить промпт. Попробуйте снова.",
    zh: "❌ 保存提示失败。请重试。",
  },
  "msg.send_prompt_or_create": {
    id: "Kirim prompt atau gunakan /create untuk mulai ulang.",
    en: "Send a prompt or use /create to start over.",
    ru: "Отправьте промпт или используйте /create чтобы начать заново.",
    zh: "发送提示或使用 /create 重新开始。",
  },
  "msg.invalid_account_id": {
    id: "❌ ID Akun PostBridge tidak valid.",
    en: "❌ Invalid PostBridge Account ID.",
    ru: "❌ Недействительный ID аккаунта PostBridge.",
    zh: "❌ PostBridge 账户ID无效。",
  },
  "msg.avatar_lost": {
    id: "❌ Avatar hilang. Silakan mulai ulang.",
    en: "❌ Avatar image lost. Please start over.",
    ru: "❌ Изображение аватара потеряно. Начните заново.",
    zh: "❌ 头像图片丢失。请重新开始。",
  },
  "msg.analyzing_avatar": {
    id: "⏳ *Menganalisis avatar...*",
    en: "⏳ *Analyzing avatar...*",
    ru: "⏳ *Анализируем аватар...*",
    zh: "⏳ *正在分析头像...*",
  },
  "msg.send_video_or_url": {
    id: "❌ Kirim video atau URL video.",
    en: "❌ Please send a video or video URL.",
    ru: "❌ Отправьте видео или ссылку на видео.",
    zh: "❌ 请发送视频或视频链接。",
  },
  "msg.clone_not_found": {
    id: "❌ Data clone tidak ditemukan. Silakan mulai ulang.",
    en: "❌ Clone data not found. Please start over.",
    ru: "❌ Данные клонирования не найдены. Начните заново.",
    zh: "❌ 未找到克隆数据。请重新开始。",
  },
  "msg.send_image_or_url": {
    id: "❌ Kirim gambar atau URL gambar.",
    en: "❌ Please send an image or image URL.",
    ru: "❌ Отправьте изображение или ссылку на изображение.",
    zh: "❌ 请发送图片或图片链接。",
  },
  "msg.image_analyze_failed": {
    id: "❌ Gagal menganalisa gambar. Silakan coba lagi.",
    en: "❌ Failed to analyze image. Please try again.",
    ru: "❌ Не удалось проанализировать изображение. Попробуйте снова.",
    zh: "❌ 图片分析失败。请重试。",
  },
  "msg.unable_identify": {
    id: "❌ Tidak dapat mengidentifikasi user.",
    en: "❌ Unable to identify user.",
    ru: "❌ Не удалось определить пользователя.",
    zh: "❌ 无法识别用户。",
  },
  "msg.credits_refunded": {
    id: "{message}\n\nKredit dikembalikan.",
    en: "{message}\n\nCredits refunded.",
    ru: "{message}\n\nКредиты возвращены.",
    zh: "{message}\n\n积分已退还。",
  },

  // ---------------------------------------------------------------------------
  // 3-Mode system (Basic/Smart/Pro)
  // ---------------------------------------------------------------------------
  "gen.basic_send_input": {
    id: "📸 *Mode Basic — Full Auto*\n\nKirim foto produk, teks deskripsi, atau keduanya.\nAI akan handle semuanya secara otomatis!",
    en: "📸 *Basic Mode — Full Auto*\n\nSend a product photo, text description, or both.\nAI will handle everything automatically!",
    ru: "📸 *Базовый режим — полный автомат*\n\nОтправьте фото товара, текст или и то, и другое.\nAI сделает всё автоматически!",
    zh: "📸 *基础模式 — 全自动*\n\n发送产品照片、文字描述或两者兼备。\nAI会自动处理一切！",
  },
  "gen.basic_auto_detected": {
    id: "🤖 Auto: Industri {industry} | Platform TikTok | 30 detik",
    en: "🤖 Auto: Industry {industry} | Platform TikTok | 30s",
    ru: "🤖 Авто: Отрасль {industry} | TikTok | 30 секунд",
    zh: "🤖 自动: 行业 {industry} | TikTok | 30秒",
  },
  "gen.multi_image_title": {
    id: "📸 *Upload Gambar ({n}/{total})*\n\nKirim foto satu per satu untuk setiap scene.",
    en: "📸 *Upload Images ({n}/{total})*\n\nSend photos one by one for each scene.",
    ru: "📸 *Загрузить фото ({n}/{total})*\n\nОтправляйте фото по одному для каждой сцены.",
    zh: "📸 *上传图片 ({n}/{total})*\n\n逐一发送每个场景的照片。",
  },
  "gen.multi_image_received": {
    id: "✅ Foto {n}/{total} diterima!",
    en: "✅ Photo {n}/{total} received!",
    ru: "✅ Фото {n}/{total} получено!",
    zh: "✅ 照片 {n}/{total} 已收到！",
  },
  "gen.btn_complete_ai": {
    id: "🤖 Lengkapi Sisa dengan AI",
    en: "🤖 Complete Rest with AI",
    ru: "🤖 Дополнить остальное AI",
    zh: "🤖 AI补充剩余",
  },
  "gen.btn_skip_images": {
    id: "⏭️ Lewati (AI Generate Semua)",
    en: "⏭️ Skip (AI Generates All)",
    ru: "⏭️ Пропустить (AI создаст все)",
    zh: "⏭️ 跳过（AI生成全部）",
  },
  "gen.storyboard_choice": {
    id: "📋 *Storyboard*\n\nPilih cara membuat storyboard:",
    en: "📋 *Storyboard*\n\nChoose how to create storyboard:",
    ru: "📋 *Раскадровка*\n\nВыберите способ создания:",
    zh: "📋 *分镜*\n\n选择创建分镜的方式:",
  },
  "gen.btn_storyboard_auto": {
    id: "🤖 Auto-Generate Storyboard",
    en: "🤖 Auto-Generate Storyboard",
    ru: "🤖 Авто-генерация",
    zh: "🤖 自动生成分镜",
  },
  "gen.btn_storyboard_manual": {
    id: "✍️ Tulis Storyboard Manual",
    en: "✍️ Write Storyboard Manually",
    ru: "✍️ Написать вручную",
    zh: "✍️ 手动编写分镜",
  },
  "gen.storyboard_edit_scene": {
    id: "📋 *Scene {n}: {name}*\n\nTulis deskripsi scene ini:",
    en: "📋 *Scene {n}: {name}*\n\nWrite description for this scene:",
    ru: "📋 *Сцена {n}: {name}*\n\nОпишите эту сцену:",
    zh: "📋 *场景 {n}: {name}*\n\n请描述此场景:",
  },
  "gen.storyboard_scene_saved": {
    id: "✅ Scene {n} disimpan! ({remaining} tersisa)",
    en: "✅ Scene {n} saved! ({remaining} remaining)",
    ru: "✅ Сцена {n} сохранена! (осталось {remaining})",
    zh: "✅ 场景 {n} 已保存！（还剩 {remaining}）",
  },
  "gen.transcript_choice": {
    id: "🎤 *Voice-Over Script*\n\nPilih cara membuat narasi:",
    en: "🎤 *Voice-Over Script*\n\nChoose how to create narration:",
    ru: "🎤 *Озвучка*\n\nВыберите способ создания:",
    zh: "🎤 *旁白脚本*\n\n选择创建旁白的方式:",
  },
  "gen.btn_transcript_auto": {
    id: "🤖 AI Generate Narasi",
    en: "🤖 AI-Generated Narration",
    ru: "🤖 AI создаст озвучку",
    zh: "🤖 AI生成旁白",
  },
  "gen.btn_transcript_manual": {
    id: "✍️ Tulis Narasi Sendiri",
    en: "✍️ Write My Own Script",
    ru: "✍️ Написать свой текст",
    zh: "✍️ 自己编写脚本",
  },
  "gen.transcript_input": {
    id: "✍️ *Tulis Script Voice-Over*\n\nKetik narasi lengkap untuk video kamu:",
    en: "✍️ *Write Voice-Over Script*\n\nType the full narration for your video:",
    ru: "✍️ *Напишите озвучку*\n\nВведите полный текст:",
    zh: "✍️ *编写旁白脚本*\n\n输入视频的完整旁白:",
  },
  "gen.transcript_saved": {
    id: "✅ Narasi disimpan!",
    en: "✅ Narration saved!",
    ru: "✅ Озвучка сохранена!",
    zh: "✅ 旁白已保存！",
  },

  // ---------------------------------------------------------------------------
  // Callback handler — buttons & UI (lines 1-2000)
  // ---------------------------------------------------------------------------
  "btn.buy_credits": {
    id: "💰 Beli Kredit",
    en: "💰 Buy Credits",
    ru: "💰 Купить кредиты",
    zh: "💰 购买积分",
  },
  "btn.try_again": {
    id: "🔄 Coba Lagi",
    en: "🔄 Try Again",
    ru: "🔄 Попробовать снова",
    zh: "🔄 重试",
  },
  "btn.create_video": {
    id: "🎬 Buat Video",
    en: "🎬 Create Video",
    ru: "🎬 Создать видео",
    zh: "🎬 创建视频",
  },
  "btn.create_image": {
    id: "🖼️ Buat Gambar",
    en: "🖼️ Create Image",
    ru: "🖼️ Создать изображение",
    zh: "🖼️ 创建图片",
  },
  "btn.subscription": {
    id: "⭐ Langganan",
    en: "⭐ Subscription",
    ru: "⭐ Подписка",
    zh: "⭐ 订阅",
  },
  "btn.my_videos": {
    id: "📁 Video Saya",
    en: "📁 My Videos",
    ru: "📁 Мои видео",
    zh: "📁 我的视频",
  },
  "btn.referral": {
    id: "👥 Referral",
    en: "👥 Referral",
    ru: "👥 Реферал",
    zh: "👥 推荐",
  },
  "btn.profile": {
    id: "👤 Profil",
    en: "👤 Profile",
    ru: "👤 Профиль",
    zh: "👤 个人资料",
  },
  "btn.web_dashboard": {
    id: "🌐 Dashboard Web",
    en: "🌐 Web Dashboard",
    ru: "🌐 Веб-панель",
    zh: "🌐 网页仪表板",
  },
  "btn.upgrade_subscription": {
    id: "⭐ Upgrade Langganan",
    en: "⭐ Upgrade Subscription",
    ru: "⭐ Улучшить подписку",
    zh: "⭐ 升级订阅",
  },
  "btn.referral_code": {
    id: "🎁 Kode Referral",
    en: "🎁 Referral Code",
    ru: "🎁 Реферальный код",
    zh: "🎁 推荐码",
  },
  "btn.fav_workflows": {
    id: "⭐ Workflow Favorit",
    en: "⭐ Favorite Workflows",
    ru: "⭐ Избранные процессы",
    zh: "⭐ 收藏工作流",
  },
  "btn.workflow_prefs": {
    id: "⚙️ Preferensi Workflow",
    en: "⚙️ Workflow Preferences",
    ru: "⚙️ Настройки процессов",
    zh: "⚙️ 工作流偏好",
  },
  "btn.lang_notif": {
    id: "🌐 Bahasa & Notifikasi",
    en: "🌐 Language & Notifications",
    ru: "🌐 Язык и уведомления",
    zh: "🌐 语言与通知",
  },
  "btn.help_faq": {
    id: "❓ Bantuan & FAQ",
    en: "❓ Help & FAQ",
    ru: "❓ Помощь и FAQ",
    zh: "❓ 帮助与常见问题",
  },
  "btn.prompt_library": {
    id: "📚 Prompt Library",
    en: "📚 Prompt Library",
    ru: "📚 Библиотека промптов",
    zh: "📚 提示词库",
  },
  "btn.browse_prompts": {
    id: "📚 Pilih Prompt & Buat Video",
    en: "📚 Choose Prompt & Create Video",
    ru: "📚 Выбрать промпт и создать видео",
    zh: "📚 选择提示词并创建视频",
  },
  "btn.trending": {
    id: "🔥 Trending",
    en: "🔥 Trending",
    ru: "🔥 Тренды",
    zh: "🔥 热门",
  },
  "btn.free_prompt": {
    id: "🎁 Prompt Gratis",
    en: "🎁 Free Prompt",
    ru: "🎁 Бесплатный промпт",
    zh: "🎁 免费提示词",
  },
  "btn.clone": {
    id: "🔄 Clone",
    en: "🔄 Clone",
    ru: "🔄 Клон",
    zh: "🔄 克隆",
  },
  "btn.storyboard": {
    id: "📋 Storyboard",
    en: "📋 Storyboard",
    ru: "📋 Раскадровка",
    zh: "📋 分镜",
  },
  "btn.viral": {
    id: "📈 Viral",
    en: "📈 Viral",
    ru: "📈 Вирусное",
    zh: "📈 爆款",
  },
  "btn.repurpose": {
    id: "🔄 Repurpose Video",
    en: "🔄 Repurpose Video",
    ru: "🔄 Переделать видео",
    zh: "🔄 视频再利用",
  },
  "btn.disassemble": {
    id: "🔍 Disassemble",
    en: "🔍 Disassemble",
    ru: "🔍 Разобрать",
    zh: "🔍 拆解",
  },
  "btn.generate_again": {
    id: "🔄 Generate Lagi",
    en: "🔄 Generate Again",
    ru: "🔄 Сгенерировать снова",
    zh: "🔄 再次生成",
  },
  "btn.use_now": {
    id: "🚀 Pakai Sekarang",
    en: "🚀 Use Now",
    ru: "🚀 Использовать сейчас",
    zh: "🚀 立即使用",
  },
  "btn.browse_all": {
    id: "📚 Browse Semua",
    en: "📚 Browse All",
    ru: "📚 Просмотреть все",
    zh: "📚 浏览全部",
  },
  "btn.customize_again": {
    id: "🔧 Customize Lagi",
    en: "🔧 Customize Again",
    ru: "🔧 Настроить снова",
    zh: "🔧 再次自定义",
  },
  "btn.back_to_niche": {
    id: "◀️ Kembali ke Niche",
    en: "◀️ Back to Niche",
    ru: "◀️ Назад к нише",
    zh: "◀️ 返回类别",
  },
  "btn.view_prompt_library": {
    id: "📚 Lihat Prompt Library",
    en: "📚 View Prompt Library",
    ru: "📚 Открыть библиотеку промптов",
    zh: "📚 查看提示词库",
  },
  "btn.use_daily_free": {
    id: "🎁 Gunakan Daily Free",
    en: "🎁 Use Daily Free",
    ru: "🎁 Использовать бесплатный",
    zh: "🎁 使用每日免费",
  },
  "btn.use_welcome_bonus": {
    id: "🎨 Gunakan Welcome Bonus!",
    en: "🎨 Use Welcome Bonus!",
    ru: "🎨 Использовать приветственный бонус!",
    zh: "🎨 使用欢迎奖励！",
  },
  "btn.claim_trial": {
    id: "🎁 Klaim FREE TRIAL!",
    en: "🎁 Claim FREE TRIAL!",
    ru: "🎁 Получить БЕСПЛАТНУЮ ПРОБУ!",
    zh: "🎁 领取免费试用！",
  },
  "btn.product_photo": {
    id: "🛍️ Foto Produk",
    en: "🛍️ Product Photo",
    ru: "🛍️ Фото продукта",
    zh: "🛍️ 产品照片",
  },
  "btn.fnb_food": {
    id: "🍔 Makanan & Minuman",
    en: "🍔 Food & Beverage",
    ru: "🍔 Еда и напитки",
    zh: "🍔 餐饮",
  },
  "btn.real_estate": {
    id: "🏠 Properti / Real Estate",
    en: "🏠 Property / Real Estate",
    ru: "🏠 Недвижимость",
    zh: "🏠 房产",
  },
  "btn.automotive": {
    id: "🚗 Kendaraan / Otomotif",
    en: "🚗 Vehicle / Automotive",
    ru: "🚗 Транспорт / Авто",
    zh: "🚗 车辆/汽车",
  },
  "btn.manage_avatar": {
    id: "👤 Kelola Avatar",
    en: "👤 Manage Avatar",
    ru: "👤 Управление аватаром",
    zh: "👤 管理头像",
  },
  "btn.skip_describe": {
    id: "⏭️ Skip — Deskripsikan Saja",
    en: "⏭️ Skip — Describe Instead",
    ru: "⏭️ Пропустить — только описание",
    zh: "⏭️ 跳过 — 直接描述",
  },
  "btn.upload_new_image": {
    id: "📤 Upload Gambar Baru",
    en: "📤 Upload New Image",
    ru: "📤 Загрузить новое фото",
    zh: "📤 上传新图片",
  },
  "btn.add_avatar": {
    id: "➕ Tambah Avatar Baru",
    en: "➕ Add New Avatar",
    ru: "➕ Добавить аватар",
    zh: "➕ 添加新头像",
  },
  "btn.create_video_now": {
    id: "🚀 Buat Video Sekarang",
    en: "🚀 Create Video Now",
    ru: "🚀 Создать видео сейчас",
    zh: "🚀 立即创建视频",
  },
  "btn.back_to_selection": {
    id: "◀️ Kembali ke Pilihan",
    en: "◀️ Back to Selection",
    ru: "◀️ Назад к выбору",
    zh: "◀️ 返回选择",
  },
  "btn.yes_create": {
    id: "✅ Ya, Buat!",
    en: "✅ Yes, Create!",
    ru: "✅ Да, создать!",
    zh: "✅ 是的，创建！",
  },
  "btn.cancel": {
    id: "❌ Batal",
    en: "❌ Cancel",
    ru: "❌ Отмена",
    zh: "❌ 取消",
  },
  "btn.simulate_success": {
    id: "✅ Simulasikan Sukses",
    en: "✅ Simulate Success",
    ru: "✅ Симулировать успех",
    zh: "✅ 模拟成功",
  },
  "btn.custom_ai": {
    id: "✨ Custom AI",
    en: "✨ Custom AI",
    ru: "✨ Свой AI",
    zh: "✨ 自定义AI",
  },
  "btn.credits_packages": {
    id: "💳 Kredit & Paket",
    en: "💳 Credits & Packages",
    ru: "💳 Кредиты и пакеты",
    zh: "💳 积分与套餐",
  },
  "btn.my_videos_emoji": {
    id: "🎞 Video Saya",
    en: "🎞 My Videos",
    ru: "🎞 Мои видео",
    zh: "🎞 我的视频",
  },
  "btn.account": {
    id: "👤 Akun",
    en: "👤 Account",
    ru: "👤 Аккаунт",
    zh: "👤 账户",
  },
  "btn.use_welcome": {
    id: "🎁 Gunakan Welcome Bonus",
    en: "🎁 Use Welcome Bonus",
    ru: "🎁 Использовать приветственный бонус",
    zh: "🎁 使用欢迎奖励",
  },
  "btn.home_menu": {
    id: "🏠 Menu Utama",
    en: "🏠 Main Menu",
    ru: "🏠 Главное меню",
    zh: "🏠 主菜单",
  },
  "btn.set_default": {
    id: "⭐ Set as Default",
    en: "⭐ Set as Default",
    ru: "⭐ Установить по умолчанию",
    zh: "⭐ 设为默认",
  },
  "btn.delete": {
    id: "🗑️ Hapus",
    en: "🗑️ Delete",
    ru: "🗑️ Удалить",
    zh: "🗑️ 删除",
  },
  "btn.settings": {
    id: "⚙️ Pengaturan",
    en: "⚙️ Settings",
    ru: "⚙️ Настройки",
    zh: "⚙️ 设置",
  },

  // ── Storyboard ──
  "cb.storyboard_title": {
    id: "📋 *Storyboard: {niche}*",
    en: "📋 *Storyboard: {niche}*",
    ru: "📋 *Раскадровка: {niche}*",
    zh: "📋 *分镜：{niche}*",
  },
  "cb.storyboard_scene": {
    id: "🎬 *Scene {scene} ({duration}s)*\nType: {type}\nDesc: {description}",
    en: "🎬 *Scene {scene} ({duration}s)*\nType: {type}\nDesc: {description}",
    ru: "🎬 *Сцена {scene} ({duration}с)*\nТип: {type}\nОпис: {description}",
    zh: "🎬 *场景 {scene}（{duration}秒）*\n类型：{type}\n描述：{description}",
  },
  "cb.storyboard_caption": {
    id: "📝 *Caption:*\n_{caption}_",
    en: "📝 *Caption:*\n_{caption}_",
    ru: "📝 *Подпись:*\n_{caption}_",
    zh: "📝 *字幕：*\n_{caption}_",
  },
  "cb.storyboard_cost": {
    id: "💰 *Biaya: 1.0 Kredit*",
    en: "💰 *Cost: 1.0 Credits*",
    ru: "💰 *Стоимость: 1.0 кредит*",
    zh: "💰 *费用：1.0 积分*",
  },

  // ── P2P Transfer ──
  "cb.transfer_success": {
    id: "✅ *Transfer Berhasil!*\n\nAnda berhasil mengirim *{amount}* kredit ke ID `{recipientId}`.",
    en: "✅ *Transfer Successful!*\n\nYou have successfully sent *{amount}* credits to ID `{recipientId}`.",
    ru: "✅ *Перевод выполнен!*\n\nВы успешно отправили *{amount}* кредитов на ID `{recipientId}`.",
    zh: "✅ *转账成功！*\n\n您已成功向 ID `{recipientId}` 发送 *{amount}* 积分。",
  },
  "cb.transfer_received": {
    id: "💸 *Anda menerima kredit!*\n\nUser `{senderId}` mengirim *{amount}* kredit.\nCek saldo dengan /profile.",
    en: "💸 *You received credits!*\n\nUser `{senderId}` has sent you *{amount}* credits.\nCheck your balance with /profile.",
    ru: "💸 *Вы получили кредиты!*\n\nПользователь `{senderId}` отправил вам *{amount}* кредитов.\nПроверьте баланс: /profile.",
    zh: "💸 *您收到了积分！*\n\n用户 `{senderId}` 向您发送了 *{amount}* 积分。\n使用 /profile 查看余额。",
  },

  // ── Main Menu ──
  "cb.main_menu_greeting": {
    id: "👋 *Halo, {name}!*\n\n{credEmoji} Kredit: *{credits}*\n\nMau buat apa hari ini? 👇",
    en: "👋 *Hello, {name}!*\n\n{credEmoji} Credits: *{credits}*\n\nWhat do you want to create today? 👇",
    ru: "👋 *Привет, {name}!*\n\n{credEmoji} Кредиты: *{credits}*\n\nЧто хотите создать сегодня? 👇",
    zh: "👋 *你好，{name}！*\n\n{credEmoji} 积分：*{credits}*\n\n今天想创建什么？👇",
  },
  "cb.main_menu_quick_actions": {
    id: "⚡ *Aksi Cepat:*",
    en: "⚡ *Quick Actions:*",
    ru: "⚡ *Быстрые действия:*",
    zh: "⚡ *快速操作:*",
  },

  // ── Credits Menu ──
  "cb.credits_menu_title": {
    id: "💳 *Kredit & Paket*\n\nSaldo kredit: *{credits}*\nTier: *{tier}*\n\nPilih aksi:",
    en: "💳 *Credits & Packages*\n\nCredit balance: *{credits}*\nTier: *{tier}*\n\nChoose action:",
    ru: "💳 *Кредиты и пакеты*\n\nБаланс кредитов: *{credits}*\nУровень: *{tier}*\n\nВыберите действие:",
    zh: "💳 *积分与套餐*\n\n积分余额：*{credits}*\n等级：*{tier}*\n\n请选择：",
  },

  // ── Account Menu ──
  "cb.account_title": {
    id: "👤 *Akun*\n\nKelola preferensi dan pengaturan kamu:",
    en: "👤 *Account*\n\nManage your preferences and settings:",
    ru: "👤 *Аккаунт*\n\nУправление настройками:",
    zh: "👤 *账户*\n\n管理你的偏好和设置：",
  },
  "cb.lang_notif_coming_soon": {
    id: "🚧 Pengaturan Bahasa & Notifikasi segera hadir!",
    en: "🚧 Language & Notification settings coming soon!",
    ru: "🚧 Настройки языка и уведомлений скоро!",
    zh: "🚧 语言和通知设置即将推出！",
  },

  // ── Chat AI ──
  "cb.chat_ai_active": {
    id: '💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu sekarang.\n\n*Contoh:*\n• "Bikinin prompt untuk bakso saya"\n• "Tips video TikTok F&B yang viral"\n\nAtau ketik /prompts untuk template siap pakai',
    en: '💬 *AI Assistant active!*\n\nJust type your question now.\n\n*Examples:*\n• "Create a prompt for my product"\n• "Tips for viral TikTok F&B videos"\n\nOr type /prompts for ready-to-use templates',
    ru: "💬 *AI Ассистент активен!*\n\nПросто введите ваш вопрос.\n\n*Примеры:*\n• «Создай промпт для моего продукта»\n• «Советы по вирусным видео TikTok»\n\nИли введите /prompts для готовых шаблонов",
    zh: '💬 *AI助手已启动！*\n\n直接输入你的问题。\n\n*示例：*\n• "为我的产品创建提示词"\n• "TikTok 爆款视频技巧"\n\n或输入 /prompts 使用现成模板',
  },

  // ── Rate Result ──
  "cb.rate_title": {
    id: "⭐ *Rate Hasil Konten*\n\nSeberapa puas dengan hasil generate?",
    en: "⭐ *Rate Content Result*\n\nHow satisfied are you with the generated result?",
    ru: "⭐ *Оценить результат*\n\nНасколько вы довольны результатом?",
    zh: "⭐ *评价内容结果*\n\n您对生成结果满意吗？",
  },
  "cb.rate_5": {
    id: "⭐⭐⭐⭐⭐ Sempurna!",
    en: "⭐⭐⭐⭐⭐ Perfect!",
    ru: "⭐⭐⭐⭐⭐ Отлично!",
    zh: "⭐⭐⭐⭐⭐ 完美！",
  },
  "cb.rate_4": {
    id: "⭐⭐⭐⭐ Bagus",
    en: "⭐⭐⭐⭐ Good",
    ru: "⭐⭐⭐⭐ Хорошо",
    zh: "⭐⭐⭐⭐ 不错",
  },
  "cb.rate_3": {
    id: "⭐⭐⭐ Cukup",
    en: "⭐⭐⭐ Average",
    ru: "⭐⭐⭐ Нормально",
    zh: "⭐⭐⭐ 一般",
  },
  "cb.rate_2": {
    id: "⭐⭐ Kurang",
    en: "⭐⭐ Poor",
    ru: "⭐⭐ Плохо",
    zh: "⭐⭐ 差",
  },
  "cb.rate_thanks": {
    id: "Terima kasih! Rating: {stars}",
    en: "Thank you! Rating: {stars}",
    ru: "Спасибо! Рейтинг: {stars}",
    zh: "谢谢！评分：{stars}",
  },
  "cb.rate_thanks_msg": {
    id: "✅ *Terima kasih atas feedbacknya!*\n\nRating: {stars}\n\nFeedback kamu membantu kami meningkatkan kualitas AI.",
    en: "✅ *Thank you for your feedback!*\n\nRating: {stars}\n\nYour feedback helps us improve AI quality.",
    ru: "✅ *Спасибо за отзыв!*\n\nРейтинг: {stars}\n\nВаш отзыв помогает улучшить качество AI.",
    zh: "✅ *感谢您的反馈！*\n\n评分：{stars}\n\n您的反馈帮助我们提升AI质量。",
  },

  // ── Tutorial ──
  "cb.tutorial": {
    id: "📖 *Tutorial Singkat*\n\n1. Ketik /create untuk membuat video\n2. Pilih mode (Basic/Smart/Pro)\n3. Upload foto produk atau ketik deskripsi\n4. Pilih platform & durasi\n5. Konfirmasi — video masuk antrian\n\nUntuk gambar: ketik /image\nUntuk top up kredit: ketik /topup",
    en: "📖 *Quick Tutorial*\n\n1. Type /create to make a video\n2. Choose mode (Basic/Smart/Pro)\n3. Upload product photo or type description\n4. Select platform & duration\n5. Confirm — video enters queue\n\nFor images: type /image\nFor credit top up: type /topup",
    ru: "📖 *Краткое руководство*\n\n1. Введите /create для создания видео\n2. Выберите режим (Basic/Smart/Pro)\n3. Загрузите фото или введите описание\n4. Выберите платформу и длительность\n5. Подтвердите — видео в очереди\n\nДля изображений: /image\nДля пополнения: /topup",
    zh: "📖 *快速教程*\n\n1. 输入 /create 创建视频\n2. 选择模式（Basic/Smart/Pro）\n3. 上传产品照片或输入描述\n4. 选择平台和时长\n5. 确认 — 视频进入队列\n\n创建图片：输入 /image\n充值积分：输入 /topup",
  },

  // ── Report Bug ──
  "cb.report_bug": {
    id: "🐛 *Report Bug*\n\nSilakan ketik laporan bug kamu di bawah ini. Sertakan:\n• Deskripsi masalah\n• Langkah-langkah yang dilakukan\n\nKetik pesanmu sekarang:",
    en: "🐛 *Report Bug*\n\nPlease type your bug report below. Include:\n• Problem description\n• Steps to reproduce\n\nType your message now:",
    ru: "🐛 *Сообщить об ошибке*\n\nПожалуйста, опишите проблему ниже. Укажите:\n• Описание проблемы\n• Шаги воспроизведения\n\nНапишите сообщение:",
    zh: "🐛 *报告Bug*\n\n请在下方输入错误报告，包含：\n• 问题描述\n• 重现步骤\n\n请输入您的消息：",
  },

  "cb.bug_report_thanks": {
    id: "✅ Laporan bug kamu telah dikirim. Terima kasih!",
    en: "✅ Your bug report has been submitted. Thank you!",
    ru: "✅ Ваш отчёт об ошибке отправлен. Спасибо!",
    zh: "✅ 您的错误报告已提交。感谢您！",
  },

  // ── Image Generation Menu ──
  "cb.img_gen_menu": {
    id: "🖼️ *Image Generation*\n\nPilih workflow:",
    en: "🖼️ *Image Generation*\n\nSelect workflow:",
    ru: "🖼️ *Генерация изображений*\n\nВыберите процесс:",
    zh: "🖼️ *图片生成*\n\n选择工作流：",
  },
  "cb.img_product": {
    id: "🛍️ Product Photo",
    en: "🛍️ Product Photo",
    ru: "🛍️ Фото продукта",
    zh: "🛍️ 产品照片",
  },
  "cb.img_fnb": {
    id: "🍔 F&B Food",
    en: "🍔 F&B Food",
    ru: "🍔 Еда и напитки",
    zh: "🍔 餐饮",
  },
  "cb.img_realestate": {
    id: "🏠 Real Estate",
    en: "🏠 Real Estate",
    ru: "🏠 Недвижимость",
    zh: "🏠 房产",
  },
  "cb.img_car": {
    id: "🚗 Car/Automotive",
    en: "🚗 Car/Automotive",
    ru: "🚗 Авто",
    zh: "🚗 汽车",
  },

  // ── Custom Duration (V3) ──
  "cb.custom_duration_v3": {
    id: "⏱️ *Custom Duration*\n\nKetik durasi video dalam detik:\n\nContoh:\n`90` = 1 menit 30 detik\n`300` = 5 menit\n`3600` = 1 jam\n\nMin: 6 detik | Max: 3600 detik (1 jam)",
    en: "⏱️ *Custom Duration*\n\nType video duration in seconds:\n\nExamples:\n`90` = 1 minute 30 seconds\n`300` = 5 minutes\n`3600` = 1 hour\n\nMin: 6 seconds | Max: 3600 seconds (1 hour)",
    ru: "⏱️ *Произвольная длительность*\n\nВведите длительность видео в секундах:\n\nПримеры:\n`90` = 1 минута 30 секунд\n`300` = 5 минут\n`3600` = 1 час\n\nМин: 6 сек | Макс: 3600 сек (1 час)",
    zh: "⏱️ *自定义时长*\n\n输入视频秒数：\n\n示例：\n`90` = 1分30秒\n`300` = 5分钟\n`3600` = 1小时\n\n最短：6秒 | 最长：3600秒（1小时）",
  },

  // ── Image preference flow ──
  "cb.send_reference_photo": {
    id: "📸 *Kirim Foto Referensi*\n\nKirim foto yang ingin dijadikan referensi gaya video.\n\nAtau ketik /skip untuk lanjut tanpa foto.",
    en: "📸 *Send Reference Photo*\n\nSend a photo to use as video style reference.\n\nOr type /skip to continue without a photo.",
    ru: "📸 *Отправьте референс*\n\nОтправьте фото для стиля видео.\n\nИли введите /skip, чтобы продолжить без фото.",
    zh: "📸 *发送参考照片*\n\n发送照片作为视频风格参考。\n\n或输入 /skip 跳过。",
  },

  // ── Prompt source: custom ──
  "cb.action_label_image_set": {
    id: "7 gambar (1 per scene HPAS)",
    en: "7 images (1 per HPAS scene)",
    ru: "7 изображений (1 на сцену HPAS)",
    zh: "7张图片（每个HPAS场景1张）",
  },
  "cb.action_label_video": {
    id: "video iklan HPAS",
    en: "HPAS ad video",
    ru: "Рекламное видео HPAS",
    zh: "HPAS广告视频",
  },
  "cb.action_label_campaign": {
    id: "5 atau 10 video batch",
    en: "5 or 10 video batch",
    ru: "Пакет из 5 или 10 видео",
    zh: "5或10个视频批量",
  },
  "cb.write_custom_prompt": {
    id: "✍️ *Tulis Prompt Sendiri*\n\nKirim foto produk atau ketik deskripsi produk.\n\nOutput: {output}",
    en: "✍️ *Write Your Own Prompt*\n\nSend a product photo or type product description.\n\nOutput: {output}",
    ru: "✍️ *Напишите свой промпт*\n\nОтправьте фото продукта или введите описание.\n\nРезультат: {output}",
    zh: "✍️ *自定义提示词*\n\n发送产品照片或输入产品描述。\n\n输出：{output}",
  },

  // ── Onboarding ──
  "cb.onboard_credits_info": {
    id: "💡 *APA ITU KREDIT?*\n\nKredit adalah mata uang digital di BerkahKarya.\n\n*1 kredit bisa digunakan untuk:*\n• 5 gambar AI berkualitas\n• 1 video pendek (5 detik)\n• Video lebih panjang = lebih banyak kredit\n\n*CONTOH:*\n• 20 kredit = 100 gambar atau 20 video 5 detik\n• 50 kredit = 250 gambar atau 50 video 5 detik\n\nSiap klaim FREE TRIAL? 🎁",
    en: "💡 *WHAT ARE CREDITS?*\n\nCredits are digital currency in BerkahKarya.\n\n*1 credit can be used for:*\n• 5 quality AI images\n• 1 short video (5 seconds)\n• Longer videos = more credits\n\n*EXAMPLES:*\n• 20 credits = 100 images or 20 x 5-second videos\n• 50 credits = 250 images or 50 x 5-second videos\n\nReady to claim your FREE TRIAL? 🎁",
    ru: "💡 *ЧТО ТАКОЕ КРЕДИТЫ?*\n\nКредиты — цифровая валюта в BerkahKarya.\n\n*1 кредит можно использовать для:*\n• 5 качественных AI-изображений\n• 1 короткое видео (5 секунд)\n• Длинные видео = больше кредитов\n\n*ПРИМЕРЫ:*\n• 20 кредитов = 100 изображений или 20 видео по 5 сек\n• 50 кредитов = 250 изображений или 50 видео по 5 сек\n\nГотовы получить БЕСПЛАТНУЮ ПРОБУ? 🎁",
    zh: "💡 *什么是积分？*\n\n积分是 BerkahKarya 的数字货币。\n\n*1积分可用于：*\n• 5张高质量AI图片\n• 1个短视频（5秒）\n• 更长视频 = 更多积分\n\n*示例：*\n• 20积分 = 100张图片或20个5秒视频\n• 50积分 = 250张图片或50个5秒视频\n\n准备领取免费试用？🎁",
  },
  "cb.onboard_trial_claimed": {
    id: "🎉 *SELAMAT! Anda mendapat FREE TRIAL!*\n\n*Bonus yang Anda dapatkan:*\n• ✅ 1x Image Generation GRATIS (sekali pakai)\n• ✅ 1x Mystery Prompt harian (inspirasi prompt terbaik!)\n\nPilih niche bisnis Anda untuk mulai:",
    en: "🎉 *CONGRATULATIONS! You got a FREE TRIAL!*\n\n*Your bonuses:*\n• ✅ 1x FREE Image Generation (one-time)\n• ✅ 1x Daily Mystery Prompt (best prompt inspiration!)\n\nSelect your business niche to begin:",
    ru: "🎉 *ПОЗДРАВЛЯЕМ! Вы получили БЕСПЛАТНУЮ ПРОБУ!*\n\n*Ваши бонусы:*\n• ✅ 1x БЕСПЛАТНАЯ генерация изображения (разово)\n• ✅ 1x Ежедневный промпт-сюрприз (лучшие промпты!)\n\nВыберите нишу вашего бизнеса:",
    zh: "🎉 *恭喜！您获得了免费试用！*\n\n*您的奖励：*\n• ✅ 1次免费图片生成（一次性）\n• ✅ 1次每日神秘提示词（最佳灵感！）\n\n选择您的业务类别开始：",
  },
  "cb.onboard_account_created": {
    id: "✅ *Akun berhasil dibuat!*\n\nNiche Anda: {niche}\n\n📋 *CARA KERJA BOT:*\n\n1️⃣ Pilih template dari library\n2️⃣ Generate image/video\n3️⃣ Tunggu hasil (30 detik - 2 menit)\n4️⃣ Download dan gunakan!\n\n*FREE TRIAL ANDA:*\n• ✅ 1x Image Generation (Welcome Bonus)\n• ✅ 1x Mystery Prompt harian (contoh prompt terbaik!)\n• 🎨 Harus pilih dari Prompt Library\n• 🆓 AI Generation GRATIS\n\n*FITUR PREMIUM (Bayar):*\n• ✍️ Custom prompt sendiri\n• 🎬 Video generation\n• 📸 Upload foto produk\n• 🚀 Priority queue\n\nSiap mulai? 🚀",
    en: "✅ *Account created!*\n\nYour niche: {niche}\n\n📋 *HOW THE BOT WORKS:*\n\n1️⃣ Choose a template from the library\n2️⃣ Generate image/video\n3️⃣ Wait for results (30 sec - 2 min)\n4️⃣ Download and use!\n\n*YOUR FREE TRIAL:*\n• ✅ 1x Image Generation (Welcome Bonus)\n• ✅ 1x Daily Mystery Prompt (best prompt examples!)\n• 🎨 Must choose from Prompt Library\n• 🆓 FREE AI Generation\n\n*PREMIUM FEATURES (Paid):*\n• ✍️ Custom prompts\n• 🎬 Video generation\n• 📸 Product photo upload\n• 🚀 Priority queue\n\nReady to start? 🚀",
    ru: "✅ *Аккаунт создан!*\n\nВаша ниша: {niche}\n\n📋 *КАК РАБОТАЕТ БОТ:*\n\n1️⃣ Выберите шаблон из библиотеки\n2️⃣ Сгенерируйте изображение/видео\n3️⃣ Подождите результат (30 сек - 2 мин)\n4️⃣ Скачайте и используйте!\n\n*ВАША БЕСПЛАТНАЯ ПРОБА:*\n• ✅ 1x Генерация изображения (Приветственный бонус)\n• ✅ 1x Ежедневный промпт-сюрприз\n• 🎨 Нужно выбрать из библиотеки\n• 🆓 БЕСПЛАТНАЯ AI-генерация\n\n*ПРЕМИУМ ФУНКЦИИ (Платно):*\n• ✍️ Свои промпты\n• 🎬 Генерация видео\n• 📸 Загрузка фото продукта\n• 🚀 Приоритетная очередь\n\nГотовы начать? 🚀",
    zh: "✅ *账户已创建！*\n\n您的类别：{niche}\n\n📋 *机器人使用方法：*\n\n1️⃣ 从库中选择模板\n2️⃣ 生成图片/视频\n3️⃣ 等待结果（30秒-2分钟）\n4️⃣ 下载并使用！\n\n*您的免费试用：*\n• ✅ 1次图片生成（欢迎奖励）\n• ✅ 1次每日神秘提示词\n• 🎨 必须从提示词库选择\n• 🆓 免费AI生成\n\n*高级功能（付费）：*\n• ✍️ 自定义提示词\n• 🎬 视频生成\n• 📸 上传产品照片\n• 🚀 优先队列\n\n准备开始？🚀",
  },
  "cb.welcome_bonus_used": {
    id: "⚠️ *Welcome Bonus sudah digunakan!*\n\nGunakan Daily Free Anda atau beli kredit.",
    en: "⚠️ *Welcome Bonus already used!*\n\nUse your Daily Free or buy credits.",
    ru: "⚠️ *Приветственный бонус уже использован!*\n\nИспользуйте бесплатный ежедневный или купите кредиты.",
    zh: "⚠️ *欢迎奖励已使用！*\n\n使用每日免费或购买积分。",
  },
  "cb.welcome_bonus_prompt": {
    id: "🎨 *Welcome Bonus: 1x Image Generation*\n\nPilih prompt dari library {niche}:",
    en: "🎨 *Welcome Bonus: 1x Image Generation*\n\nChoose a prompt from the {niche} library:",
    ru: "🎨 *Приветственный бонус: 1x генерация изображения*\n\nВыберите промпт из библиотеки {niche}:",
    zh: "🎨 *欢迎奖励：1次图片生成*\n\n从 {niche} 库中选择提示词：",
  },
  "cb.daily_free_not_reset": {
    id: "⏰ *Daily Free belum reset!*\n\nReset dalam: {hours} jam\nReset time: 00:00 WIB setiap hari\n\nGunakan Welcome Bonus atau beli kredit.",
    en: "⏰ *Daily Free not yet reset!*\n\nResets in: {hours} hours\nReset time: 00:00 WIB daily\n\nUse your Welcome Bonus or buy credits.",
    ru: "⏰ *Ежедневный бесплатный ещё не сброшен!*\n\nСброс через: {hours} ч.\nВремя сброса: 00:00 WIB ежедневно\n\nИспользуйте бонус или купите кредиты.",
    zh: "⏰ *每日免费尚未重置！*\n\n重置倒计时：{hours}小时\n重置时间：每天00:00 WIB\n\n使用欢迎奖励或购买积分。",
  },
  "cb.daily_free_prompt": {
    id: "🎁 *Daily Free: 1x Image Generation*\n\nPilih prompt dari library {niche}:",
    en: "🎁 *Daily Free: 1x Image Generation*\n\nChoose a prompt from the {niche} library:",
    ru: "🎁 *Бесплатный ежедневный: 1x генерация*\n\nВыберите промпт из библиотеки {niche}:",
    zh: "🎁 *每日免费：1次图片生成*\n\n从 {niche} 库中选择提示词：",
  },

  // ── Onboarding language ──
  "cb.onboard_lang_welcome": {
    id: "🌐 *Selamat datang di Vilona Asisten OpenClaw!*\n\nPlease select your preferred language.\nThis will be used for the bot interface, voice over, subtitles, and captions.",
    en: "🌐 *Welcome to Vilona OpenClaw Assistant!*\n\nPlease select your preferred language.\nThis will be used for the bot interface, voice over, subtitles, and captions.",
    ru: "🌐 *Добро пожаловать в Vilona OpenClaw!*\n\nВыберите предпочтительный язык.\nОн будет использоваться для интерфейса бота, озвучки, субтитров и подписей.",
    zh: "🌐 *欢迎使用 Vilona OpenClaw 助手！*\n\n请选择您的首选语言。\n此语言将用于机器人界面、配音、字幕和说明。",
  },

  // ── Trending prompts ──
  "cb.trending_header": {
    id: "🔥 *TRENDING PROMPTS THIS WEEK*\n_Diupdate berdasarkan penggunaan real user!_",
    en: "🔥 *TRENDING PROMPTS THIS WEEK*\n_Updated based on real user usage!_",
    ru: "🔥 *TRENDING ПРОМПТЫ ЭТОЙ НЕДЕЛИ*\n_Обновлено на основе реального использования!_",
    zh: "🔥 *本周热门提示词*\n_根据真实用户使用量更新！_",
  },

  // ── Custom prompt generator ──
  "cb.custom_prompt_gen": {
    id: "✨ *Custom Prompt Generator*\n\nCeritakan kebutuhan kamu:\n\n1️⃣ Produk/jasa apa?\n2️⃣ Target audience?\n3️⃣ Mood video: energetic/calm/luxury?\n4️⃣ Platform utama: TikTok/IG/YouTube?\n5️⃣ Durasi: 5-60 detik?\n\nJawab semuanya dalam satu pesan, saya akan generate prompt optimal! 🎯",
    en: "✨ *Custom Prompt Generator*\n\nTell us your needs:\n\n1️⃣ What product/service?\n2️⃣ Target audience?\n3️⃣ Video mood: energetic/calm/luxury?\n4️⃣ Main platform: TikTok/IG/YouTube?\n5️⃣ Duration: 5-60 seconds?\n\nAnswer everything in one message, I will generate the optimal prompt! 🎯",
    ru: "✨ *Генератор промптов*\n\nРасскажите о ваших потребностях:\n\n1️⃣ Какой продукт/услуга?\n2️⃣ Целевая аудитория?\n3️⃣ Настроение видео: энергичное/спокойное/luxury?\n4️⃣ Основная платформа: TikTok/IG/YouTube?\n5️⃣ Длительность: 5-60 секунд?\n\nОтветьте на всё в одном сообщении, я сгенерирую оптимальный промпт! 🎯",
    zh: "✨ *自定义提示词生成器*\n\n告诉我们您的需求：\n\n1️⃣ 什么产品/服务？\n2️⃣ 目标受众？\n3️⃣ 视频风格：活力/平静/奢华？\n4️⃣ 主要平台：TikTok/IG/YouTube？\n5️⃣ 时长：5-60秒？\n\n在一条消息中回答所有问题，我将生成最佳提示词！🎯",
  },

  // ── Prompt Updated ──
  "cb.prompt_updated": {
    id: "✅ *Prompt Updated!*\n\n`{prompt}`\n\n_{typeLabel}: *{value}* applied_\n\nMau buat video atau gambar dengan prompt ini?",
    en: "✅ *Prompt Updated!*\n\n`{prompt}`\n\n_{typeLabel}: *{value}* applied_\n\nWant to create a video or image with this prompt?",
    ru: "✅ *Промпт обновлён!*\n\n`{prompt}`\n\n_{typeLabel}: *{value}* применён_\n\nХотите создать видео или изображение?",
    zh: "✅ *提示词已更新！*\n\n`{prompt}`\n\n_{typeLabel}: *{value}* 已应用_\n\n要用这个提示词创建视频或图片吗？",
  },

  // ── Prompt Library (back_prompts) ──
  "cb.prompt_library_title": {
    id: "📚 *Prompt Library — 40+ Template Siap Pakai*\n\n👇 *Pilih niche bisnis kamu:*\n\n🍔 F&B · 👗 Fashion · 📱 Tech · 💪 Health\n✈️ Travel · 📚 Education · 💰 Finance · 🎭 Entertainment\n\n_Setiap niche punya 5 prompt profesional yang sudah ditest ribuan user. Tinggal pilih → buat video!_",
    en: "📚 *Prompt Library — 40+ Ready-Made Templates*\n\n👇 *Choose your business niche:*\n\n🍔 F&B · 👗 Fashion · 📱 Tech · 💪 Health\n✈️ Travel · 📚 Education · 💰 Finance · 🎭 Entertainment\n\n_Each niche has 5 professional prompts tested by thousands of users. Just pick → create video!_",
    ru: "📚 *Библиотека промптов — 40+ готовых шаблонов*\n\n👇 *Выберите нишу бизнеса:*\n\n🍔 Еда · 👗 Мода · 📱 Техника · 💪 Здоровье\n✈️ Путешествия · 📚 Образование · 💰 Финансы · 🎭 Развлечения\n\n_В каждой нише 5 профессиональных промптов, ��ротестированных тысячами пользователей. Просто выберите → создайте видео!_",
    zh: "📚 *提示词库 — 40+现成模板*\n\n👇 *选择您的业务类别：*\n\n🍔 餐饮 · 👗 时尚 · 📱 科技 · 💪 健康\n✈️ 旅行 · 📚 教育 · 💰 金融 · 🎭 娱乐\n\n_每个类别有5个经过数千用户测试的专业提示词。选择即可创建视频！_",
  },

  // ── Daily another mystery ──
  "cb.another_mystery": {
    id: "🎁 *Another Mystery Prompt!*\n\n{emoji} *{title}*\n`{prompt}`\n\n⭐ {rate}% success rate",
    en: "🎁 *Another Mystery Prompt!*\n\n{emoji} *{title}*\n`{prompt}`\n\n⭐ {rate}% success rate",
    ru: "🎁 *Ещё один промпт-сюрприз!*\n\n{emoji} *{title}*\n`{prompt}`\n\n⭐ {rate}% успешных",
    zh: "🎁 *又一个神秘提示词！*\n\n{emoji} *{title}*\n`{prompt}`\n\n⭐ {rate}% 成功率",
  },

  // ── Image generate ──
  "cb.image_generate_title": {
    id: "🖼️ *Generate Gambar AI*\n\n💡 _AI buat foto marketing profesional dari deskripsi atau foto referensi kamu_\n\nPilih kategori konten kamu:",
    en: "🖼️ *AI Image Generation*\n\n💡 _AI creates professional marketing photos from your description or reference photo_\n\nChoose your content category:",
    ru: "🖼️ *Генерация изображений AI*\n\n💡 _AI создаёт профессиональные маркетинговые фото по описанию или фото-референсу_\n\nВыберите категорию контента:",
    zh: "🖼️ *AI图片生成*\n\n💡 _AI根据描述或参考照片创建专业营销图片_\n\n选择内容类别：",
  },

  // ── Avatar ──
  "cb.avatar_title": {
    id: "👤 *Your Avatars*",
    en: "👤 *Your Avatars*",
    ru: "👤 *Ваши аватары*",
    zh: "👤 *您的头像*",
  },
  "cb.avatar_empty": {
    id: "_Belum ada avatar tersimpan._\n\nSimpan avatar untuk menjaga karakter konsisten di gambar dan video kamu.",
    en: "_No avatars saved yet._\n\nSave an avatar to maintain consistent characters across your images and videos.",
    ru: "_Аватары ещё не сохранены._\n\nСохраните аватар для единообразия персонажей.",
    zh: "_还没有保存的头像。_\n\n保存头像以在图片和视频中保持角色一致。",
  },
  "cb.avatar_add": {
    id: "👤 *Tambah Avatar Baru*\n\nKirim foto karakter/orang yang ingin digunakan secara konsisten.\n\n📸 _Tips:_\n• Gunakan foto jelas, tampak depan\n• Pencahayaan bagus membantu AI mengenali fitur\n• Satu orang per avatar paling efektif",
    en: "👤 *Add New Avatar*\n\nSend me a clear photo of the character/person you want to use consistently.\n\n📸 _Tips:_\n• Use a clear, front-facing photo\n• Good lighting helps AI understand features\n• One person per avatar works best",
    ru: "👤 *Добавить аватар*\n\nОтправьте чёткое фото персонажа/человека.\n\n📸 _Советы:_\n• Используйте чёткое фото анфас\n• Хорошее освещение помогает AI\n• Один человек на аватар — лучший вариант",
    zh: "👤 *添加新头像*\n\n发送您想持续使用的角色/人物照片。\n\n📸 _提示：_\n• 使用清晰的正面照片\n• 良好的光线有助于AI识别特征\n• 每个头像一个人效果最好",
  },
  "cb.avatar_view": {
    id: "👤 *Avatar: {name}*\n{defaultLabel}\n{description}\nMau melakukan apa?",
    en: "👤 *Avatar: {name}*\n{defaultLabel}\n{description}\nWhat would you like to do?",
    ru: "👤 *Аватар: {name}*\n{defaultLabel}\n{description}\nЧто хотите сделать?",
    zh: "👤 *头像：{name}*\n{defaultLabel}\n{description}\n您想做什么？",
  },
  "cb.avatar_is_default": {
    id: "⭐ Avatar default",
    en: "⭐ Default avatar",
    ru: "⭐ Аватар по умолчанию",
    zh: "⭐ 默认头像",
  },
  "cb.avatar_deleted": {
    id: "🗑️ Avatar dihapus",
    en: "🗑️ Avatar deleted",
    ru: "🗑️ Аватар удалён",
    zh: "🗑️ 头像已删除",
  },
  "cb.avatar_not_found_del": {
    id: "❌ Avatar tidak ditemukan",
    en: "❌ Avatar not found",
    ru: "❌ Аватар не найден",
    zh: "❌ 头像未找到",
  },

  // ── Upload reference image ──
  "cb.upload_reference": {
    id: "📸 *Upload Foto Referensi*\n\nKirim foto produk kamu sekarang.\nAI akan animasikan foto tersebut menjadi video!\n\n_Atau ketik /skip untuk generate tanpa foto._",
    en: "📸 *Upload Reference Photo*\n\nSend your product photo now.\nAI will animate this photo into a video!\n\n_Or type /skip to generate without a photo._",
    ru: "📸 *Загрузите референс-фото*\n\nОтправьте фото продукта сейчас.\nAI анимирует его в видео!\n\n_Или введите /skip для генерации без фото._",
    zh: "📸 *上传参考照片*\n\n现在发送您的产品照片。\nAI将把照片动画化为视频！\n\n_或输入 /skip 不使用照片生成。_",
  },

  // ── Brief skip ──
  "cb.brief_skip": {
    id: "⏭️ Brief dilewati\n\n✅ Konfirmasi pembuatan video:\n\nEstimasi kredit: 1.0\n\nLanjutkan?",
    en: "⏭️ Brief skipped\n\n✅ Confirm video creation:\n\nEstimated credits: 1.0\n\nProceed?",
    ru: "⏭️ Бриф пропущен\n\n✅ Подтвердите создание видео:\n\nОценка кредитов: 1.0\n\nПродолжить?",
    zh: "⏭️ 简介已跳过\n\n✅ 确认创建视频：\n\n预估积分：1.0\n\n继续？",
  },
  "cb.creation_cancelled": {
    id: "❌ Pembuatan video dibatalkan.\n\nKetik /create untuk mulai lagi.",
    en: "❌ Video creation cancelled.\n\nUse /create to start again.",
    ru: "❌ Создание видео отменено.\n\nВведите /create, чтобы начать заново.",
    zh: "❌ 视频创建已取消。\n\n输入 /create 重新开始。",
  },
  "cb.payment_processing": {
    id: "💳 Memproses pembayaran {method}...\n\nDalam mode sandbox — ini akan mengarahkan ke halaman pembayaran Midtrans.",
    en: "💳 Processing {method} payment...\n\nIn sandbox mode — this would redirect to Midtrans payment page.",
    ru: "💳 Обработка платежа {method}...\n\nВ режиме песочницы — это перенаправит на страницу оплаты Midtrans.",
    zh: "💳 正在处理 {method} 支付...\n\n沙盒模式 — 将跳转到 Midtrans 支付页面。",
  },
  "cb.payment_success_sim": {
    id: "✅ Pembayaran Berhasil! (Simulasi)\n\nKredit ditambahkan: {credits}\n\nTerima kasih! 🎉",
    en: "✅ Payment Successful! (Simulated)\n\nCredits added: {credits}\n\nThank you! 🎉",
    ru: "✅ Оплата прошла! (Симуляция)\n\nДобавлено кредитов: {credits}\n\nСпасибо! 🎉",
    zh: "✅ 支付成功！（模拟）\n\n已添加积分：{credits}\n\n谢谢！🎉",
  },

  // ── Image ref upload ──
  "cb.imgref_upload": {
    id: "📸 *Upload Foto Referensi*\n\nKirim foto produk atau subjek kamu.\n\nAI akan gunakan foto ini sebagai referensi untuk buat gambar marketing yang menjaga identitas produk kamu.\n\n_Bisa: foto produk, makanan, properti, kendaraan, dll_",
    en: "📸 *Upload Reference Photo*\n\nSend your product or subject photo.\n\nAI will use this photo as a reference to create marketing images that maintain your product identity.\n\n_Accepts: product photos, food, property, vehicles, etc._",
    ru: "📸 *Загрузите референс-фото*\n\nОтправьте фото продукта или объекта.\n\nAI использует это фото как референс для создания маркетинговых изображений.\n\n_Принимается: фото продуктов, еда, недвижимость, транспорт и т.д._",
    zh: "📸 *上传参考照片*\n\n发送您的产品或对象照片。\n\nAI将使用此照片作为参考来创建保持产品特征的营销图片。\n\n_支持：产品照片、食物、房产、车辆等_",
  },
  "cb.imgref_hint_product": {
    id: 'contoh: _"botol parfum premium di background hitam, lighting studio, close-up detail"_',
    en: 'e.g.: _"premium perfume bottle on black background, studio lighting, close-up detail"_',
    ru: 'пример: _"премиальный флакон парфюма на чёрном фоне, студийное освещение"_',
    zh: '示例：_"高级香水瓶，黑色背景，摄影棚灯光，特写细节"_',
  },
  "cb.imgref_hint_fnb": {
    id: 'contoh: _"semangkuk bakso kuah dengan steam, lighting hangat, sudut 45 derajat"_',
    en: 'e.g.: _"a bowl of soup with steam, warm lighting, 45 degree angle"_',
    ru: 'пример: _"тарелка супа с паром, тёплое освещение, угол 45 градусов"_',
    zh: '示例：_"一碗热气腾腾的汤，温暖灯光，45度角"_',
  },
  "cb.imgref_hint_realestate": {
    id: 'contoh: _"ruang tamu modern minimalis, natural lighting, sofa abu-abu"_',
    en: 'e.g.: _"modern minimalist living room, natural lighting, grey sofa"_',
    ru: 'пример: _"современная минималистичная гостиная, естественное освещение"_',
    zh: '示例：_"现代简约客厅，自然采光，灰色沙发"_',
  },
  "cb.imgref_hint_car": {
    id: 'contoh: _"mobil SUV warna putih, outdoor sunset lighting, angle 3/4 front"_',
    en: 'e.g.: _"white SUV, outdoor sunset lighting, 3/4 front angle"_',
    ru: 'пример: _"белый внедорожник, закатное освещение, ракурс 3/4 спереди"_',
    zh: '示例：_"白色SUV，户外日落灯光，3/4正面角度"_',
  },
  "cb.imgref_hint_default": {
    id: 'contoh: _"produk saya dengan background putih bersih, lighting profesional"_',
    en: 'e.g.: _"my product on clean white background, professional lighting"_',
    ru: 'пример: _"мой продукт на чистом белом фоне, профессиональное освещение"_',
    zh: '示例：_"我的产品，白色干净背景，专业灯光"_',
  },
  "cb.describe_image": {
    id: "✏️ *Deskripsikan Gambar yang Kamu Mau*\n\n{hint}\n\nKetik deskripsi kamu sekarang 👇",
    en: "✏️ *Describe the Image You Want*\n\n{hint}\n\nType your description now 👇",
    ru: "✏️ *Опишите желаемое изображение*\n\n{hint}\n\nВведите описание 👇",
    zh: "✏️ *描述您想要的图片*\n\n{hint}\n\n现在输入描述 👇",
  },
  "cb.using_avatar": {
    id: "🖼️ *Menggunakan Avatar: {name}*\n\nAI akan menjaga identitas karakter ini.\n\nSekarang deskripsikan scene/setting yang kamu inginkan:",
    en: "🖼️ *Using Avatar: {name}*\n\nThe AI will maintain this character's identity.\n\nNow describe the scene/setting you want:",
    ru: "🖼️ *Используется аватар: {name}*\n\nAI сохранит идентичность персонажа.\n\nТеперь опишите сцену/обстановку:",
    zh: "🖼️ *使用头像：{name}*\n\nAI将保持此角色的特征。\n\n现在描述您想要的场景/设置：",
  },

  // ── Clone Video ──
  "cb.clone_video": {
    id: "🔄 *Clone/Remake Video*\n\nKirim video yang mau direkreasi, atau paste URL dari:\n• TikTok · Instagram Reels · YouTube Shorts\n\n_AI akan buat video dengan style serupa._",
    en: "🔄 *Clone/Remake Video*\n\nSend the video you want to recreate, or paste a URL from:\n• TikTok · Instagram Reels · YouTube Shorts\n\n_AI will create a video with a similar style._",
    ru: "🔄 *Клонировать/Переделать видео*\n\nОтправьте видео для воссоздания или вставьте URL из:\n• TikTok · Instagram Reels · YouTube Shorts\n\n_AI создаст видео в похожем стиле._",
    zh: "🔄 *克隆/翻拍视频*\n\n发送您想重新制作的视频，或粘贴以下平台的URL：\n• TikTok · Instagram Reels · YouTube Shorts\n\n_AI将创建类似风格的视频。_",
  },

  // ---------------------------------------------------------------------------
  // creation.ts translations
  // ---------------------------------------------------------------------------
  "creation.insufficient_credits": {
    id: "❌ *Kredit tidak cukup*\n\nButuh: {cost} kredit\nSaldo: {balance} kredit",
    en: "❌ *Insufficient Credits*\n\nRequired: {cost} credits\nBalance: {balance} credits",
    ru: "❌ *Недостаточно кредитов*\n\nТребуется: {cost} кредитов\nБаланс: {balance} кредитов",
    zh: "❌ *积分不足*\n\n需要: {cost} 积分\n余额: {balance} 积分",
  },
  "creation.video_done": {
    id: "✅ *Video Selesai!*\n\n📋 {name}\n🎬 {scenes} scene • {duration} detik",
    en: "✅ *Video Complete!*\n\n📋 {name}\n🎬 {scenes} scenes • {duration} seconds",
    ru: "✅ *Видео готово!*\n\n📋 {name}\n🎬 {scenes} сцен • {duration} секунд",
    zh: "✅ *视频完成！*\n\n📋 {name}\n🎬 {scenes} 个场景 • {duration} 秒",
  },
  "creation.credits_refunded": {
    id: "❌ *Generation Failed*\n\nJob: {jobId}\n{error}\n\nKredit kamu sudah di-refund.",
    en: "❌ *Generation Failed*\n\nJob: {jobId}\n{error}\n\nYour credits have been refunded.",
    ru: "❌ *Генерация не удалась*\n\nЗадание: {jobId}\n{error}\n\nКредиты возвращены.",
    zh: "❌ *生成失败*\n\n任务: {jobId}\n{error}\n\n积分已退还。",
  },
  "creation.generating": {
    id: "🚀 *Generating...*\n\nVideo kamu sedang dibuat!\n\n📋 Template: {name}\n🎬 {scenes} scene • {duration} detik\n💰 {cost} kredit terpakai\n\n⏱️ Estimasi: 2-5 menit\nKamu akan dapat notifikasi saat selesai.",
    en: "🚀 *Generating...*\n\nYour video is being created!\n\n📋 Template: {name}\n🎬 {scenes} scenes • {duration} seconds\n💰 {cost} credits used\n\n⏱️ Estimated: 2-5 minutes\nYou will be notified when complete.",
    ru: "🚀 *Генерация...*\n\nВаше видео создаётся!\n\n📋 Шаблон: {name}\n🎬 {scenes} сцен • {duration} секунд\n💰 {cost} кредитов использовано\n\n⏱️ Ожидание: 2-5 минут\nВы получите уведомление по готовности.",
    zh: "🚀 *生成中...*\n\n正在创建您的视频！\n\n📋 模板: {name}\n🎬 {scenes} 个场景 • {duration} 秒\n💰 使用了 {cost} 积分\n\n⏱️ 预计: 2-5分钟\n完成后会通知您。",
  },
  "creation.generation_failed_refund": {
    id: "❌ *Generation Failed*\n\n{error}\n\nKredit kamu sudah di-refund jika sudah ditagih.",
    en: "❌ *Generation Failed*\n\n{error}\n\nYour credits have been refunded if charged.",
    ru: "❌ *Генерация не удалась*\n\n{error}\n\nКредиты возвращены, если были списаны.",
    zh: "❌ *生成失败*\n\n{error}\n\n如已扣除积分，已退还。",
  },
  "creation.image_flow_coming": {
    id: "🚧 Alur Buat Gambar baru segera hadir! Gunakan menu lama sementara.",
    en: "🚧 New Image Creation flow coming soon! Using legacy menu for now.",
    ru: "🚧 Новый процесс создания изображений скоро! Пока используем старое меню.",
    zh: "🚧 新的图片创建流程即将推出！暂时使用旧菜单。",
  },
  "creation.image_generate_title": {
    id: "🖼️ *Generate Gambar AI*\n\n💡 _AI buat foto marketing profesional dari deskripsi atau foto referensi kamu_\n\nPilih kategori konten kamu:",
    en: "🖼️ *AI Image Generation*\n\n💡 _AI creates professional marketing photos from your description or reference photo_\n\nSelect your content category:",
    ru: "🖼️ *Генерация изображений AI*\n\n💡 _AI создаёт профессиональные маркетинговые фото по описанию или референсу_\n\nВыберите категорию контента:",
    zh: "🖼️ *AI图片生成*\n\n💡 _AI根据您的描述或参考照片创建专业营销照片_\n\n选择内容类别:",
  },
  "creation.btn_product_photo": {
    id: "🛍️ Foto Produk",
    en: "🛍️ Product Photo",
    ru: "🛍️ Фото товара",
    zh: "🛍️ 产品照片",
  },
  "creation.btn_fnb": {
    id: "🍔 Makanan & Minuman",
    en: "🍔 Food & Beverage",
    ru: "🍔 Еда и напитки",
    zh: "🍔 食品和饮料",
  },
  "creation.btn_realestate": {
    id: "🏠 Properti / Real Estate",
    en: "🏠 Property / Real Estate",
    ru: "🏠 Недвижимость",
    zh: "🏠 房地产",
  },
  "creation.btn_car": {
    id: "🚗 Kendaraan / Otomotif",
    en: "🚗 Vehicle / Automotive",
    ru: "🚗 Транспорт / Авто",
    zh: "🚗 汽车/车辆",
  },
  "creation.btn_avatar": {
    id: "👤 Kelola Avatar",
    en: "👤 Manage Avatars",
    ru: "👤 Управление аватарами",
    zh: "👤 管理头像",
  },

  // ---------------------------------------------------------------------------
  // message.ts translations
  // ---------------------------------------------------------------------------
  "msg.duration_range_error": {
    id: "❌ Durasi harus antara 6 - 3600 detik.\n\nContoh: `120` untuk 2 menit, `3600` untuk 1 jam.",
    en: "❌ Duration must be between 6 - 3600 seconds.\n\nExample: `120` for 2 minutes, `3600` for 1 hour.",
    ru: "❌ Длительность должна быть от 6 до 3600 секунд.\n\nПример: `120` для 2 минут, `3600` для 1 часа.",
    zh: "❌ 时长必须在6-3600秒之间。\n\n例如: `120` 表示2分钟, `3600` 表示1小时。",
  },
  "msg.custom_duration_set": {
    id: "✅ *Custom Duration: {durLabel}*\n\n🎬 {scenes} scene\n💰 Biaya: {cost} kredit\n\nPilih platform tujuan:",
    en: "✅ *Custom Duration: {durLabel}*\n\n🎬 {scenes} scenes\n💰 Cost: {cost} credits\n\nSelect target platform:",
    ru: "✅ *Своя длительность: {durLabel}*\n\n🎬 {scenes} сцен\n💰 Стоимость: {cost} кредитов\n\nВыберите платформу:",
    zh: "✅ *自定义时长: {durLabel}*\n\n🎬 {scenes} 个场景\n💰 费用: {cost} 积分\n\n选择目标平台:",
  },
  "msg.prompt_too_short": {
    id: "⚠️ Prompt terlalu pendek. Minimal 10 kata. Coba lagi atau tap /start untuk batal.",
    en: "⚠️ Prompt too short. Minimum 10 words. Try again or tap /start to cancel.",
    ru: "⚠️ Промпт слишком короткий. Минимум 10 слов. Попробуйте снова или /start для отмены.",
    zh: "⚠️ 提示词太短。至少10个词。再试一次或点击 /start 取消。",
  },
  "msg.prompt_saved": {
    id: "✅ *Prompt tersimpan ke {niche}!*\n\n`{preview}`\n\nMau langsung pakai prompt ini?",
    en: "✅ *Prompt saved to {niche}!*\n\n`{preview}`\n\nWant to use this prompt now?",
    ru: "✅ *Промпт сохранён в {niche}!*\n\n`{preview}`\n\nИспользовать этот промпт сейчас?",
    zh: "✅ *提示词已保存到 {niche}！*\n\n`{preview}`\n\n现在就使用这个提示词？",
  },
  "msg.btn_create_video_now": {
    id: "🚀 Buat Video Sekarang!",
    en: "🚀 Create Video Now!",
    ru: "🚀 Создать видео сейчас!",
    zh: "🚀 立即创建视频！",
  },
  "msg.btn_view_saved": {
    id: "📌 Lihat Prompt Tersimpan",
    en: "📌 View Saved Prompts",
    ru: "📌 Просмотр сохранённых",
    zh: "📌 查看已保存提示词",
  },
  "msg.account_connected": {
    id: "✅ *Akun Terhubung!*\n\nPlatform: {platform}\nID: `{accountId}`\n\nSekarang kamu bisa publish video ke akun ini.",
    en: "✅ *Account Connected!*\n\nPlatform: {platform}\nAccount ID: `{accountId}`\n\nYou can now publish videos to this account.",
    ru: "✅ *Аккаунт подключён!*\n\nПлатформа: {platform}\nID: `{accountId}`\n\nТеперь вы можете публиковать видео.",
    zh: "✅ *账号已连接！*\n\n平台: {platform}\nID: `{accountId}`\n\n现在可以发布视频到此账号。",
  },
  "msg.connect_failed": {
    id: "❌ Gagal menghubungkan akun.\n\nError: {error}\n\nSilakan coba lagi atau hubungi support.",
    en: "❌ Failed to connect account.\n\nError: {error}\n\nPlease try again or contact support.",
    ru: "❌ Не удалось подключить аккаунт.\n\nОшибка: {error}\n\nПопробуйте снова или обратитесь в поддержку.",
    zh: "❌ 连接账号失败。\n\n错误: {error}\n\n请重试或联系客服。",
  },
  "msg.image_generate_title": {
    id: "🖼️ *Generate Gambar*\n\nPilih kategori:",
    en: "🖼️ *Image Generation*\n\nSelect category:",
    ru: "🖼️ *Генерация изображений*\n\nВыберите категорию:",
    zh: "🖼️ *图片生成*\n\n选择类别:",
  },
  "msg.ai_chat_active": {
    id: '💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu sekarang.\n\n*Contoh:*\n• _"Bikinin prompt untuk bakso saya"_\n• _"Tips video TikTok F\\&B yang viral"_\n\nAtau ketik /prompts untuk template siap pakai 📚',
    en: '💬 *AI Assistant active!*\n\nJust type your question now.\n\n*Examples:*\n• _"Create a prompt for my product"_\n• _"Tips for viral TikTok F\\&B videos"_\n\nOr type /prompts for ready-made templates 📚',
    ru: '💬 *AI Ассистент активен!*\n\nПросто напишите ваш вопрос.\n\n*Примеры:*\n• _"Создай промпт для моего продукта"_\n• _"Советы для вирусных TikTok видео"_\n\nИли напишите /prompts для готовых шаблонов 📚',
    zh: '💬 *AI助手已激活！*\n\n直接输入您的问题。\n\n*示例:*\n• _"为我的产品创建提示词"_\n• _"TikTok美食爆款视频技巧"_\n\n或输入 /prompts 查看现成模板 📚',
  },
  "msg.custom_only_premium": {
    id: "Prompt custom hanya tersedia untuk pengguna Premium.",
    en: "Custom prompts are only available for Premium users.",
    ru: "Пользовательские промпты доступны только Premium-пользователям.",
    zh: "自定义提示词仅限高级用户使用。",
  },
  "msg.credits_exhausted": {
    id: "Kredit tidak cukup & Reward harian sudah habis.",
    en: "Insufficient credits & daily reward already used.",
    ru: "Недостаточно кредитов и дневной бонус исчерпан.",
    zh: "积分不足，每日奖励已用完。",
  },
  "msg.generation_start_failed": {
    id: "❌ *Gagal Memulai*\n\n{reason}\n\nGunakan /topup untuk menambah kredit agar bisa menggunakan fitur custom dan video.",
    en: "❌ *Failed to Start*\n\n{reason}\n\nUse /topup to add credits to use custom and video features.",
    ru: "❌ *Не удалось начать*\n\n{reason}\n\nИспользуйте /topup для пополнения кредитов.",
    zh: "❌ *无法开始*\n\n{reason}\n\n使用 /topup 充值积分以使用自定义和视频功能。",
  },
  "msg.generating_image": {
    id: "⏳ *Generating image{modeLabel}...*\n\nSedang diproses, kamu bisa lanjut pakai bot. Hasil akan dikirim sebentar lagi.",
    en: "⏳ *Generating image{modeLabel}...*\n\nProcessing, you can continue using the bot. Results will be sent shortly.",
    ru: "⏳ *Генерация изображения{modeLabel}...*\n\nОбработка, можете продолжать использовать бота. Результат будет отправлен скоро.",
    zh: "⏳ *正在生成图片{modeLabel}...*\n\n处理中，您可以继续使用机器人。结果稍后发送。",
  },
  "msg.image_success": {
    id: "✅ *Gambar Berhasil Dibuat!*\n\n_Deskripsi: {description}_{modeInfo}\n\nMau lanjut apa?",
    en: "✅ *Image Generated Successfully!*\n\n_Description: {description}_{modeInfo}\n\nWhat would you like to do next?",
    ru: "✅ *Изображение создано!*\n\n_Описание: {description}_{modeInfo}\n\nЧто дальше?",
    zh: "✅ *图片生成成功！*\n\n_描述: {description}_{modeInfo}\n\n接下来要做什么？",
  },
  "msg.btn_make_variation": {
    id: "🔄 Buat Variasi Lain",
    en: "🔄 Create Variation",
    ru: "🔄 Создать вариацию",
    zh: "🔄 创建变体",
  },
  "msg.btn_make_video": {
    id: "🎬 Jadikan Video",
    en: "🎬 Make Video",
    ru: "🎬 Сделать видео",
    zh: "🎬 制作视频",
  },
  "msg.generate_failed": {
    id: "❌ *Generate Gagal*\n\n{error}\n\nCoba lagi dengan deskripsi yang berbeda.",
    en: "❌ *Generation Failed*\n\n{error}\n\nTry again with a different description.",
    ru: "❌ *Генерация не удалась*\n\n{error}\n\nПопробуйте с другим описанием.",
    zh: "❌ *生成失败*\n\n{error}\n\n请尝试使用不同的描述。",
  },
  "msg.analyzing_video": {
    id: "⏳ *Analyzing video...*\n\nSedang diproses, kamu bisa lanjut pakai bot. Hasil akan dikirim sebentar lagi.",
    en: "⏳ *Analyzing video...*\n\nProcessing, you can continue using the bot. Results will be sent shortly.",
    ru: "⏳ *Анализ видео...*\n\nОбработка, можете продолжать. Результат будет отправлен скоро.",
    zh: "⏳ *分析视频中...*\n\n处理中，您可以继续使用机器人。结果稍后发送。",
  },
  "msg.avatar_save_failed": {
    id: "❌ *Gagal menyimpan avatar*\n\n{error}",
    en: "❌ *Failed to save avatar*\n\n{error}",
    ru: "❌ *Не удалось сохранить аватар*\n\n{error}",
    zh: "❌ *保存头像失败*\n\n{error}",
  },
  "msg.unrecognized_format": {
    id: "❌ Format tidak dikenali.\n\nKirim salah satu dari:\n• Upload video langsung (MP4)\n• Link TikTok / Instagram Reels / YouTube Shorts / Twitter\n• URL langsung ke file video (.mp4)",
    en: "❌ Unrecognized format.\n\nSend one of:\n• Upload video directly (MP4)\n• TikTok / Instagram Reels / YouTube Shorts / Twitter link\n• Direct URL to video file (.mp4)",
    ru: "❌ Неизвестный формат.\n\nОтправьте одно из:\n• Загрузите видео напрямую (MP4)\n• Ссылка TikTok / Instagram Reels / YouTube Shorts / Twitter\n• Прямой URL на видеофайл (.mp4)",
    zh: "❌ 无法识别的格式。\n\n请发送以下之一:\n• 直接上传视频 (MP4)\n• TikTok / Instagram Reels / YouTube Shorts / Twitter 链接\n• 视频文件的直接URL (.mp4)",
  },
  "msg.analyzing_repurpose": {
    id: "⏳ *Menganalisis video...*\n\nSedang diproses, kamu bisa lanjut pakai bot. Hasil akan dikirim sebentar lagi.",
    en: "⏳ *Analyzing video...*\n\nProcessing, you can continue using the bot. Results will be sent shortly.",
    ru: "⏳ *Анализ видео...*\n\nОбработка, можете продолжать. Результат будет отправлен скоро.",
    zh: "⏳ *分析视频中...*\n\n处理中，您可以继续使用机器人。结果稍后发送。",
  },
  "msg.analysis_failed": {
    id: "❌ Gagal menganalisis video.\n\n{error}",
    en: "❌ Failed to analyze video.\n\n{error}",
    ru: "❌ Не удалось проанализировать видео.\n\n{error}",
    zh: "❌ 视频分析失败。\n\n{error}",
  },
  "msg.analysis_complete": {
    id: "✅ *Analisis Selesai!*\n\n🎯 *Niche:* {niche}\n🎨 *Style:* {style}\n⏱️ *Durasi:* {duration}s · {sceneCount} scenes\n\n*Storyboard:*\n{sceneText}{moreScenes}{transcriptPreview}\n\nMau regenerate gimana?",
    en: "✅ *Analysis Complete!*\n\n🎯 *Niche:* {niche}\n🎨 *Style:* {style}\n⏱️ *Duration:* {duration}s · {sceneCount} scenes\n\n*Storyboard:*\n{sceneText}{moreScenes}{transcriptPreview}\n\nHow would you like to regenerate?",
    ru: "✅ *Анализ завершён!*\n\n🎯 *Ниша:* {niche}\n🎨 *Стиль:* {style}\n⏱️ *Длительность:* {duration}с · {sceneCount} сцен\n\n*Раскадровка:*\n{sceneText}{moreScenes}{transcriptPreview}\n\nКак хотите перегенерировать?",
    zh: "✅ *分析完成！*\n\n🎯 *领域:* {niche}\n🎨 *风格:* {style}\n⏱️ *时长:* {duration}秒 · {sceneCount} 个场景\n\n*分镜:*\n{sceneText}{moreScenes}{transcriptPreview}\n\n您想如何重新生成？",
  },
  "msg.tap_button_above": {
    id: "Tap salah satu tombol di atas untuk mulai generate, atau /menu untuk kembali ke dashboard.",
    en: "Tap one of the buttons above to start generating, or /menu to return to dashboard.",
    ru: "Нажмите одну из кнопок выше для генерации, или /menu для возврата.",
    zh: "点击上方按钮开始生成，或 /menu 返回主页。",
  },
  "msg.transcript_label": {
    id: '\n\n*Transkrip:*\n_"{preview}"_',
    en: '\n\n*Transcript:*\n_"{preview}"_',
    ru: '\n\n*Транскрипт:*\n_"{preview}"_',
    zh: '\n\n*字幕:*\n_"{preview}"_',
  },

  // ---------------------------------------------------------------------------
  // topup.ts translations
  // ---------------------------------------------------------------------------
  "topup.select_payment_method": {
    id: "🏦 *Pilih Metode Pembayaran*",
    en: "🏦 *Select Payment Method*",
    ru: "🏦 *Выберите способ оплаты*",
    zh: "🏦 *选择付款方式*",
  },
  "topup.package_label": {
    id: "Paket",
    en: "Package",
    ru: "Пакет",
    zh: "套餐",
  },
  "topup.price_label": {
    id: "Harga",
    en: "Price",
    ru: "Цена",
    zh: "价格",
  },
  "topup.select_method_prompt": {
    id: "Pilih metode pembayaran:",
    en: "Select payment method:",
    ru: "Выберите способ оплаты:",
    zh: "选择付款方式:",
  },
  "topup.credits_word": {
    id: "kredit",
    en: "credits",
    ru: "кредитов",
    zh: "积分",
  },
  "topup.stars_title": {
    id: "⭐ *Bayar dengan Telegram Stars*\n\nPilih paket:\n\n{list}\n\n_Stars adalah mata uang Telegram. Bayar langsung dari saldo Stars kamu._",
    en: "⭐ *Pay with Telegram Stars*\n\nSelect a package:\n\n{list}\n\n_Stars is Telegram's currency. Pay directly from your Stars balance._",
    ru: "⭐ *Оплата Telegram Stars*\n\nВыберите пакет:\n\n{list}\n\n_Stars — валюта Telegram. Оплата из баланса Stars._",
    zh: "⭐ *使用Telegram Stars支付*\n\n选择套餐:\n\n{list}\n\n_Stars是Telegram的货币。直接从Stars余额支付。_",
  },
  "topup.crypto_title": {
    id: "💎 *Pembayaran Crypto*\n\nPilih jumlah:\n\n{list}\n\n_Didukung: USDT (BSC), BNB, MATIC, TON_",
    en: "💎 *Crypto Payment*\n\nSelect amount:\n\n{list}\n\n_Supported: USDT (BSC), BNB, MATIC, TON_",
    ru: "💎 *Крипто-оплата*\n\nВыберите сумму:\n\n{list}\n\n_Поддерживаются: USDT (BSC), BNB, MATIC, TON_",
    zh: "💎 *加密货币支付*\n\n选择金额:\n\n{list}\n\n_支持: USDT (BSC), BNB, MATIC, TON_",
  },
  "topup.crypto_coin_select": {
    id: "💎 *{credits} Kredit — ${usd} USD*\n\nPilih cryptocurrency:",
    en: "💎 *{credits} Credits — ${usd} USD*\n\nSelect cryptocurrency:",
    ru: "💎 *{credits} Кредитов — ${usd} USD*\n\nВыберите криптовалюту:",
    zh: "💎 *{credits} 积分 — ${usd} USD*\n\n选择加密货币:",
  },
  "topup.crypto_created": {
    id: "💎 *Crypto Payment Created*\n\nSend exactly:\n`{payAmount} {payCurrency}`\n\nTo address:\n`{payAddress}`\n\nNetwork: *{coinLabel}*\nKredit: *{credits}*\nOrder: `{orderId}`\n\n⏱ Payment expires in ~15 minutes.\n\n_Credits will be added automatically once confirmed._",
    en: "💎 *Crypto Payment Created*\n\nSend exactly:\n`{payAmount} {payCurrency}`\n\nTo address:\n`{payAddress}`\n\nNetwork: *{coinLabel}*\nCredits: *{credits}*\nOrder: `{orderId}`\n\n⏱ Payment expires in ~15 minutes.\n\n_Credits will be added automatically once confirmed._",
    ru: "💎 *Крипто-платёж создан*\n\nОтправьте точно:\n`{payAmount} {payCurrency}`\n\nНа адрес:\n`{payAddress}`\n\nСеть: *{coinLabel}*\nКредиты: *{credits}*\nЗаказ: `{orderId}`\n\n⏱ Платёж истекает через ~15 минут.\n\n_Кредиты будут начислены автоматически после подтверждения._",
    zh: "💎 *加密支付已创建*\n\n请准确发送:\n`{payAmount} {payCurrency}`\n\n到地址:\n`{payAddress}`\n\n网络: *{coinLabel}*\n积分: *{credits}*\n订单: `{orderId}`\n\n⏱ 支付将在约15分钟后过期。\n\n_确认后积分将自动添加。_",
  },
  "topup.stars_invoice_desc": {
    id: "{credits} Video Generation Credit untuk @berkahkarya_saas_bot",
    en: "{credits} Video Generation Credits for @berkahkarya_saas_bot",
    ru: "{credits} кредитов генерации видео для @berkahkarya_saas_bot",
    zh: "{credits} 个视频生成积分 @berkahkarya_saas_bot",
  },
  "topup.stars_invoice_label": {
    id: "{credits} Kredit",
    en: "{credits} Credits",
    ru: "{credits} Кредитов",
    zh: "{credits} 积分",
  },
  "topup.no_gateway_available": {
    id: "Tidak ada metode pembayaran yang tersedia saat ini. Coba lagi nanti.",
    en: "No payment method is available at the moment. Please try again later.",
    ru: "В данный момент нет доступных методов оплаты. Попробуйте позже.",
    zh: "目前没有可用的支付方式，请稍后再试。",
  },
  "topup.gateway_unavailable": {
    id: "Metode pembayaran yang dipilih sedang tidak tersedia. Silakan pilih metode lain.",
    en: "The selected payment method is currently unavailable. Please choose another method.",
    ru: "Выбранный способ оплаты временно недоступен. Пожалуйста, выберите другой.",
    zh: "所选支付方式暂时不可用，请选择其他方式。",
  },

  // ---------------------------------------------------------------------------
  // referral.ts translations
  // ---------------------------------------------------------------------------
  "referral.no_account": {
    id: "Kamu belum punya akun. Gunakan /start untuk mendaftar.",
    en: "You don't have an account yet. Please use /start to register first.",
    ru: "У вас ещё нет аккаунта. Используйте /start для регистрации.",
    zh: "您还没有账号。请先使用 /start 注册。",
  },
  "referral.main_msg": {
    id: "👥 Referral & Affiliate\n\nAjak teman dan dapatkan komisi!\n\nKode Referral: {code}\n\nStruktur Komisi:\n• Tier 1 (Langsung): 15%\n• Tier 2 (Tidak Langsung): 5%\n\nStats Kamu:\n• Total Referral: {referralCount}\n• Total Komisi: {commission}\n\nOpsi Komisi:\n• Tukar ke kredit (untuk generate)\n• Transfer P2P ke user lain\n• Jual ke admin (50% harga kredit)\n\nTap Share untuk mulai earn!",
    en: "👥 Referral & Affiliate\n\nInvite friends and earn commissions!\n\nReferral Code: {code}\n\nCommission Structure:\n• Tier 1 (Direct): 15%\n• Tier 2 (Indirect): 5%\n\nYour Stats:\n• Total Referrals: {referralCount}\n• Total Commission: {commission}\n\nCommission Options:\n• Convert to credits (for generation)\n• P2P transfer to other users\n• Sell to admin (50% of credit price)\n\nTap Share to start earning!",
    ru: "👥 Реферальная программа\n\nПриглашайте друзей и получайте комиссию!\n\nРеферальный код: {code}\n\nСтруктура комиссий:\n• Уровень 1 (Прямые): 15%\n• Уровень 2 (Непрямые): 5%\n\nВаша статистика:\n• Всего рефералов: {referralCount}\n• Общая комиссия: {commission}\n\nОпции вывода:\n• Конвертировать в кредиты\n• P2P перевод другому пользователю\n• Продать админу (50% от стоимости кредита)\n\nНажмите Поделиться, чтобы начать зарабатывать!",
    zh: "👥 推荐与联盟\n\n邀请朋友赚取佣金！\n\n推荐码: {code}\n\n佣金结构:\n• 一级 (直接): 15%\n• 二级 (间接): 5%\n\n您的统计:\n• 总推荐数: {referralCount}\n• 总佣金: {commission}\n\n佣金选项:\n• 兑换为积分 (用于生成)\n• P2P转账给其他用户\n• 卖给管理员 (积分价格的50%)\n\n点击分享开始赚取！",
  },
  "referral.btn_share": {
    id: "📤 Share Link Referral",
    en: "📤 Share Referral Link",
    ru: "📤 Поделиться ссылкой",
    zh: "📤 分享推荐链接",
  },
  "referral.share_text": {
    id: "Buat video iklan AI keren! Pakai link referral saya:",
    en: "Create awesome AI ad videos! Use my referral link:",
    ru: "Создавайте крутые AI-видео! Используйте мою реферальную ссылку:",
    zh: "创建酷炫AI广告视频！使用我的推荐链接:",
  },
  "referral.btn_withdraw": {
    id: "💸 Withdraw Komisi",
    en: "💸 Withdraw Commission",
    ru: "💸 Вывод комиссии",
    zh: "💸 提现佣金",
  },
  "referral.btn_stats": {
    id: "📊 Lihat Stats",
    en: "📊 View Stats",
    ru: "📊 Статистика",
    zh: "📊 查看统计",
  },
  "referral.how_it_works": {
    id: "❓ Cara Kerja",
    en: "❓ How it Works",
    ru: "❓ Как это работает",
    zh: "❓ 如何运作",
  },
  "referral.explanation": {
    id: "❓ *Cara Kerja Program Referral*\n\n*Komisi 15%*\nSetiap kali teman yang kamu ajak melakukan pembelian, kamu otomatis mendapatkan komisi sebesar *15%* dari nilai transaksinya.\n\n*Cara Menggunakan Komisi*\nKomisi yang terkumpul bisa kamu gunakan dengan dua cara:\n• 🔄 *Tukar ke Kredit* — Ubah komisi menjadi kredit untuk membuat video\n• 💵 *Cairkan ke Admin* — Jual komisi ke admin dengan harga 50% dari nilai kredit\n\n*Cashout ke Admin*\nSaat kamu memilih cashout, admin akan memproses pembayaran sebesar *50%* dari total komisimu via transfer manual.\n\n*Terus Ajak Teman*\nSemakin banyak teman yang bergabung dan berbelanja, semakin besar komisi yang kamu kumpulkan. Tidak ada batas maksimal!",
    en: "❓ *How the Referral Program Works*\n\n*15% Commission*\nEvery time a friend you invited makes a purchase, you automatically earn a *15%* commission on their transaction value.\n\n*Using Your Commission*\nYou can use your accumulated commission in two ways:\n• 🔄 *Convert to Credits* — Turn commission into credits for video creation\n• 💵 *Cash Out via Admin* — Sell commission to admin at 50% of credit value\n\n*Admin Cashout*\nWhen you choose to cash out, the admin will process payment of *50%* of your total commission via manual transfer.\n\n*Keep Referring*\nThe more friends who join and make purchases, the more commission you accumulate. There is no maximum limit!",
    ru: "❓ *Как работает реферальная программа*\n\n*Комиссия 15%*\nКаждый раз, когда приглашённый вами друг совершает покупку, вы автоматически получаете комиссию в размере *15%* от суммы транзакции.\n\n*Использование комиссии*\nНакопленную комиссию можно использовать двумя способами:\n• 🔄 *Конвертировать в кредиты* — Превратить комиссию в кредиты для создания видео\n• 💵 *Вывод через админа* — Продать комиссию админу по цене 50% от стоимости кредита\n\n*Вывод через админа*\nПри выборе вывода, админ обработает выплату в размере *50%* от вашей общей комиссии через ручной перевод.\n\n*Продолжайте приглашать*\nЧем больше друзей присоединится и совершит покупки, тем больше комиссии вы накопите. Максимального предела нет!",
    zh: "❓ *推荐计划如何运作*\n\n*15% 佣金*\n每当您邀请的朋友完成购买，您将自动获得其交易金额 *15%* 的佣金。\n\n*使用佣金*\n您可以通过两种方式使用累积的佣金：\n• 🔄 *兑换积分* — 将佣金转换为用于创建视频的积分\n• 💵 *向管理员提现* — 以积分价值50%的价格将佣金卖给管理员\n\n*管理员提现*\n选择提现后，管理员将通过手动转账处理您总佣金 *50%* 的付款。\n\n*持续推荐*\n加入并购买的朋友越多，您累积的佣金就越多。没有上限！",
  },

  // ---------------------------------------------------------------------------
  // help.ts translations
  // ---------------------------------------------------------------------------
  "help.full_guide": {
    id: "📖 **BERKAHKARYA AI — PANDUAN LENGKAP**\n─────────────────────────────────────\n\n**COMMANDS UTAMA:**\n─────────────────────────────────────\n\n📚 `/prompts [niche]` — Browse prompt library\n🔥 `/trending` — Lihat prompt trending\n🎁 `/daily` — Mystery prompt gratis\n🔧 `/customize [id]` — Modify prompt\n✨ `/create` — Bikin prompt custom via AI\n📊 `/fingerprint` — Lihat style preference kamu\n\n**GENERATE:**\n─────────────────────────────────────\n🎬 `/create` — Buat video / gambar AI\n📋 `/prompts` — Browse prompt library\n🔥 `/trending` — Prompt trending\n🎁 `/daily` — Mystery prompt gratis\n\n**ACCOUNT:**\n─────────────────────────────────────\n💰 `/topup` — Isi kredit\n📋 `/subscription` — Langganan & paket\n🎞 `/videos` — Video saya\n👤 `/profile` — Profil akun\n⚙️ `/settings` — Pengaturan\n👥 `/referral` — Program referral\n\n**INFO:**\n─────────────────────────────────────\n❓ `/help` — Panduan lengkap\n📞 `/support` — Hubungi support\n\n─────────────────────────────────────\n\nButuh bantuan spesifik? Langsung tanya aja! 😊",
    en: "📖 **BERKAHKARYA AI — FULL GUIDE**\n─────────────────────────────────────\n\n**MAIN COMMANDS:**\n─────────────────────────────────────\n\n📚 `/prompts [niche]` — Browse prompt library\n🔥 `/trending` — View trending prompts\n🎁 `/daily` — Free mystery prompt\n🔧 `/customize [id]` — Modify prompt\n✨ `/create` — Create custom prompt via AI\n📊 `/fingerprint` — View your style preference\n\n**GENERATE:**\n─────────────────────────────────────\n🎬 `/create` — Create AI video / image\n📋 `/prompts` — Browse prompt library\n🔥 `/trending` — Trending prompts\n🎁 `/daily` — Free mystery prompt\n\n**ACCOUNT:**\n─────────────────────────────────────\n💰 `/topup` — Top up credits\n📋 `/subscription` — Subscriptions & plans\n🎞 `/videos` — My videos\n👤 `/profile` — Account profile\n⚙️ `/settings` — Settings\n👥 `/referral` — Referral program\n\n**INFO:**\n─────────────────────────────────────\n❓ `/help` — Full guide\n📞 `/support` — Contact support\n\n─────────────────────────────────────\n\nNeed specific help? Just ask! 😊",
    ru: "📖 **BERKAHKARYA AI — ПОЛНОЕ РУКОВОДСТВО**\n─────────────────────────────────────\n\n**ОСНОВНЫЕ КОМАНДЫ:**\n─────────────────────────────────────\n\n📚 `/prompts [ниша]` — Библиотека промптов\n🔥 `/trending` — Трендовые промпты\n🎁 `/daily` — Бесплатный промпт дня\n🔧 `/customize [id]` — Изменить промпт\n✨ `/create` — Создать промпт через AI\n📊 `/fingerprint` — Ваши стилевые предпочтения\n\n**ГЕНЕРАЦИЯ:**\n─────────────────────────────────────\n🎬 `/create` — Создать AI видео / изображение\n📋 `/prompts` — Библиотека промптов\n🔥 `/trending` — Трендовые промпты\n🎁 `/daily` — Бесплатный промпт дня\n\n**АККАУНТ:**\n─────────────────────────────────────\n💰 `/topup` — Пополнить кредиты\n📋 `/subscription` — Подписки и планы\n🎞 `/videos` — Мои видео\n👤 `/profile` — Профиль\n⚙️ `/settings` — Настройки\n👥 `/referral` — Реферальная программа\n\n**ИНФОРМАЦИЯ:**\n─────────────────────────────────────\n❓ `/help` — Полное руководство\n📞 `/support` — Связаться с поддержкой\n\n─────────────────────────────────────\n\nНужна конкретная помощь? Просто спросите! 😊",
    zh: "📖 **BERKAHKARYA AI — 完整指南**\n─────────────────────────────────────\n\n**主要命令:**\n─────────────────────────────────────\n\n📚 `/prompts [领域]` — 浏览提示词库\n🔥 `/trending` — 查看热门提示词\n🎁 `/daily` — 免费每日提示词\n🔧 `/customize [id]` — 修改提示词\n✨ `/create` — 通过AI创建自定义提示词\n📊 `/fingerprint` — 查看您的风格偏好\n\n**生成:**\n─────────────────────────────────────\n🎬 `/create` — 创建AI视频/图片\n📋 `/prompts` — 浏览提示词库\n🔥 `/trending` — 热门提示词\n🎁 `/daily` — 免费每日提示词\n\n**账户:**\n─────────────────────────────────────\n💰 `/topup` — 充值积分\n📋 `/subscription` — 订阅与套餐\n🎞 `/videos` — 我的视频\n👤 `/profile` — 账户资料\n⚙️ `/settings` — 设置\n👥 `/referral` — 推荐计划\n\n**信息:**\n─────────────────────────────────────\n❓ `/help` — 完整指南\n📞 `/support` — 联系客服\n\n─────────────────────────────────────\n\n需要具体帮助？直接问就好！ 😊",
  },

  // ---------------------------------------------------------------------------
  // subscription.ts translations
  // ---------------------------------------------------------------------------
  "sub.available_plans": {
    id: "Paket Tersedia",
    en: "Available Plans",
    ru: "Доступные планы",
    zh: "可用套餐",
  },
  "sub.credits_per_month": {
    id: "kredit/bln",
    en: "credits/mo",
    ru: "кредитов/мес",
    zh: "积分/月",
  },
  "sub.monthly": {
    id: "Bulanan",
    en: "Monthly",
    ru: "Ежемесячно",
    zh: "月付",
  },
  "sub.annual": {
    id: "Tahunan",
    en: "Annual",
    ru: "Годовой",
    zh: "年付",
  },
  "sub.save_2_months": {
    id: "Hemat 2 bulan!",
    en: "Save 2 months!",
    ru: "Экономия 2 месяца!",
    zh: "省2个月！",
  },
  "sub.cancelled": {
    id: "✅ *Langganan Dibatalkan*\n\nLanggananmu akan berakhir di akhir periode billing.\nKredit tetap bisa digunakan sampai saat itu.\n\nGunakan /subscription untuk berlangganan lagi.",
    en: "✅ *Subscription Cancelled*\n\nYour subscription will end at the current billing period.\nYou'll keep access and credits until then.\n\nUse /subscription to re-subscribe anytime.",
    ru: "✅ *Подписка отменена*\n\nВаша подписка завершится в конце текущего периода.\nКредиты сохранятся до этого момента.\n\nИспользуйте /subscription для повторной подписки.",
    zh: "✅ *订阅已取消*\n\n您的订阅将在当前计费周期结束时终止。\n积分可以使用到那时。\n\n使用 /subscription 重新订阅。",
  },

  "subscription.auto_renewed": {
    id: "✅ *Langganan Diperpanjang Otomatis*\n\nLangganan *{plan}* kamu telah diperpanjang secara otomatis!\nPeriode baru berakhir: *{endDate}*.",
    en: "✅ *Subscription Auto-Renewed*\n\nYour *{plan}* subscription has been automatically renewed!\nNew period ends *{endDate}*.",
    ru: "✅ *Подписка автоматически продлена*\n\nВаша подписка *{plan}* была автоматически продлена!\nНовый период заканчивается: *{endDate}*.",
    zh: "✅ *订阅已自动续订*\n\n您的 *{plan}* 订阅已自动续订！\n新周期结束时间：*{endDate}*。",
  },

  "subscription.renewal_failed": {
    id: "⚠️ *Perpanjangan Otomatis Gagal*\n\nSaldo kredit tidak cukup untuk memperbarui paket *{plan}*.\nSilakan top up agar langganan kamu tetap aktif.",
    en: "⚠️ *Auto-Renewal Failed*\n\nAuto-renewal failed — insufficient balance. Please top up to continue your *{plan}* plan.",
    ru: "⚠️ *Ошибка автопродления*\n\nНедостаточно кредитов для продления подписки *{plan}*.\nПополните баланс, чтобы продолжить использование плана.",
    zh: "⚠️ *自动续订失败*\n\n余额不足，无法续订 *{plan}* 套餐。\n请充值以继续您的订阅计划。",
  },

  "subscription.renewal_prompt": {
    id: "Langganan *{plan}* kamu akan segera berakhir. Perpanjang sekarang untuk menjaga kredit dan fitur premium kamu!",
    en: "Your *{plan}* subscription is expiring. Renew now to keep your credits and premium features!",
    ru: "Ваша подписка *{plan}* скоро истекает. Продлите сейчас, чтобы сохранить кредиты и премиум-функции!",
    zh: "您的 *{plan}* 订阅即将到期。立即续订以保留您的积分和高级功能！",
  },

  "subscription.btn_renew": {
    id: "Perpanjang Sekarang",
    en: "Renew Now",
    ru: "Продлить сейчас",
    zh: "立即续订",
  },

  "subscription.btn_skip": {
    id: "Nanti Saja",
    en: "Not Now",
    ru: "Не сейчас",
    zh: "暂不续订",
  },

  // ---------------------------------------------------------------------------
  // videos.ts translations
  // ---------------------------------------------------------------------------
  "videos.empty": {
    id: "📁 *Video Saya*\n\nBelum ada video. Buat yang pertama! 🎬\n\nVideo disimpan selama 30 hari.",
    en: "📁 *My Videos*\n\nNo videos yet. Create your first one! 🎬\n\nVideos are stored for 30 days.",
    ru: "📁 *Мои видео*\n\nВидео ещё нет. Создайте первое! 🎬\n\nВидео хранятся 30 дней.",
    zh: "📁 *我的视频*\n\n还没有视频。创建第一个！🎬\n\n视频保存30天。",
  },

  "videos.list_header": {
    id: "📁 *Video Saya*\n\nDitemukan {count} video\n\nKlik video untuk lihat/unduh:",
    en: "📁 *My Videos*\n\nFound {count} video(s)\n\nClick a video to view/download:",
    ru: "📁 *Мои видео*\n\nНайдено {count} видео\n\nНажмите на видео для просмотра/загрузки:",
    zh: "📁 *我的视频*\n\n找到 {count} 个视频\n\n点击视频查看/下载:",
  },

  "videos.btn_create_new": {
    id: "🎬 Buat Video Baru",
    en: "🎬 Create New Video",
    ru: "🎬 Создать новое видео",
    zh: "🎬 创建新视频",
  },
  "videos.btn_my_videos": {
    id: "🎞 Video Saya",
    en: "🎞 My Videos",
    ru: "🎞 Мои видео",
    zh: "🎞 我的视频",
  },

  // ---------------------------------------------------------------------------
  // support.ts translations
  // ---------------------------------------------------------------------------
  "support.btn_chat": {
    id: "💬 Chat Support",
    en: "💬 Chat Support",
    ru: "💬 Чат поддержки",
    zh: "💬 在线支持",
  },

  "support.btn_tutorial": {
    id: "📖 Lihat Tutorial",
    en: "📖 View Tutorial",
    ru: "📖 Смотреть туториал",
    zh: "📖 查看教程",
  },

  "support.btn_bug": {
    id: "🐛 Laporkan Bug",
    en: "🐛 Report Bug",
    ru: "🐛 Сообщить об ошибке",
    zh: "🐛 报告错误",
  },

  "videos.found_count": {
    id: "Ditemukan {count} video",
    en: "Found {count} video(s)",
    ru: "Найдено видео: {count}",
    zh: "找到 {count} 个视频",
  },

  "btn.chat_support": {
    id: "💬 Chat Support",
    en: "💬 Chat Support",
    ru: "💬 Чат поддержки",
    zh: "💬 聊天支持",
  },

  "btn.view_tutorial": {
    id: "📖 Tutorial",
    en: "📖 Tutorial",
    ru: "📖 Туториал",
    zh: "📖 教程",
  },

  "support.full_msg": {
    id: "🆘 *Bantuan & Support*\n\n*Pertanyaan Umum:*\n\n*T: Bagaimana cara membuat video?*\nJ: Gunakan perintah /create dan ikuti langkahnya.\n\n*T: Berapa lama pembuatan video?*\nJ: Biasanya 2-5 menit tergantung antrian.\n\n*T: Format apa yang didukung?*\nJ: TikTok, Instagram, YouTube, Facebook, Twitter.\n\n*T: Bagaimana cara kerja kredit?*\nJ: 1 kredit = 1 video (30d, 5 scene)\n\nButuh bantuan lain? Hubungi kami!",
    en: "🆘 *Help & Support*\n\n*Frequently Asked Questions:*\n\n*Q: How do I create a video?*\nA: Use /create command and follow the steps.\n\n*Q: How long does video generation take?*\nA: Usually 2-5 minutes depending on queue.\n\n*Q: What formats are supported?*\nA: TikTok, Instagram, YouTube, Facebook, Twitter.\n\n*Q: How do credits work?*\nA: 1 credit = 1 video (30s, 5 scenes)\n\nNeed more help? Contact us!",
    ru: "🆘 *Помощь и поддержка*\n\n*Часто задаваемые вопросы:*\n\n*В: Как создать видео?*\nО: Используйте команду /create и следуйте шагам.\n\n*В: Сколько времени занимает генерация?*\nО: Обычно 2-5 минут в зависимости от очереди.\n\n*В: Какие форматы поддерживаются?*\nО: TikTok, Instagram, YouTube, Facebook, Twitter.\n\n*В: Как работают кредиты?*\nО: 1 кредит = 1 видео (30с, 5 сцен)\n\nНужна дополнительная помощь? Свяжитесь с нами!",
    zh: "🆘 *帮助与支持*\n\n*常见问题:*\n\n*问: 如何创建视频？*\n答: 使用 /create 命令并按步骤操作。\n\n*问: 视频生成需要多长时间？*\n答: 通常2-5分钟，取决于队列。\n\n*问: 支持哪些格式？*\n答: TikTok、Instagram、YouTube、Facebook、Twitter。\n\n*问: 积分如何运作？*\n答: 1积分 = 1个视频 (30秒, 5个场景)\n\n需要更多帮助？联系我们！",
  },

  // ---------------------------------------------------------------------------
  // Callback handler part 2 (cb2.*) — lines 2000-4235
  // ---------------------------------------------------------------------------
  "cb2.edit_video_desc": {
    id: '✏️ *Edit Deskripsi Video*\n\nKirim deskripsi baru untuk video yang akan dibuat.\n\n_Contoh: "Buat video produk skincare dengan lighting soft, background minimalis putih, close-up detail produk"_',
    en: '✏️ *Edit Video Description*\n\nSend a new description for the video to be created.\n\n_Example: "Create a skincare product video with soft lighting, minimalist white background, close-up product details"_',
    ru: '✏️ *Редактировать описание видео*\n\nОтправьте новое описание для видео.\n\n_Пример: "Создайте видео продукта по уходу за кожей с мягким освещением, минималистичным белым фоном"_',
    zh: '✏️ *编辑视频描述*\n\n发送新的视频描述。\n\n_示例："制作一个护肤品视频，柔和灯光，简约白色背景，产品特写"_',
  },
  "cb2.clone_image": {
    id: "🔄 *Clone/Remake Image*\n\nKirim gambar yang mau direkreasi.\n_AI akan buat gambar dengan style serupa._",
    en: "🔄 *Clone/Remake Image*\n\nSend the image you want to recreate.\n_AI will create an image with a similar style._",
    ru: "🔄 *Клонировать/Пересоздать*\n\nОтправьте изображение.\n_AI создаст в похожем стиле._",
    zh: "🔄 *克隆/重制图片*\n\n发送你想重新创建的图片。\n_AI将以类似风格创建。_",
  },
  "cb2.storyboard_creator": {
    id: "📋 *Storyboard Creator*\n\nPilih tipe konten kamu:",
    en: "📋 *Storyboard Creator*\n\nSelect your content type:",
    ru: "📋 *Создатель сценария*\n\nВыберите тип контента:",
    zh: "📋 *故事板创建器*\n\n选择你的内容类型:",
  },
  "cb2.product_promo": {
    id: "🛍️ Product Promo",
    en: "🛍️ Product Promo",
    ru: "🛍️ Промо продукта",
    zh: "🛍️ 产品推广",
  },
  "cb2.fnb_content": {
    id: "🍔 F&B Content",
    en: "🍔 F&B Content",
    ru: "🍔 F&B контент",
    zh: "🍔 餐饮内容",
  },
  "cb2.realestate_tour": {
    id: "🏠 Real Estate Tour",
    en: "🏠 Real Estate Tour",
    ru: "🏠 Тур по недвижимости",
    zh: "🏠 房产展示",
  },
  "cb2.car_showcase": {
    id: "🚗 Car Showcase",
    en: "🚗 Car Showcase",
    ru: "🚗 Автомобильная витрина",
    zh: "🚗 汽车展示",
  },
  "cb2.viral_research": {
    id: "📈 *Riset Viral/Tren*\n\nMenganalisis konten trending di berbagai platform...\n\nPilih niche untuk melihat apa yang sedang populer:",
    en: "📈 *Viral/Trend Research*\n\nAnalyzing trending content across platforms...\n\nSelect niche to discover what's working:",
    ru: "📈 *Исследование трендов*\n\nАнализ трендов на платформах...\n\nВыберите нишу:",
    zh: "📈 *病毒/趋势研究*\n\n分析各平台热门内容...\n\n选择细分领域:",
  },
  "cb2.all_trends": {
    id: "🔥 Semua Tren (Viral)",
    en: "🔥 All Trends (Viral)",
    ru: "🔥 Все тренды",
    zh: "🔥 所有趋势（病毒式）",
  },
  "cb2.fnb_restaurant": {
    id: "🍔 F&B / Restoran",
    en: "🍔 F&B / Restaurant",
    ru: "🍔 F&B / Ресторан",
    zh: "🍔 餐饮/餐厅",
  },
  "cb2.realestate": {
    id: "🏠 Real Estate",
    en: "🏠 Real Estate",
    ru: "🏠 Недвижимость",
    zh: "🏠 房地产",
  },
  "cb2.ecommerce": {
    id: "🛍️ E-commerce",
    en: "🛍️ E-commerce",
    ru: "🛍️ Электронная коммерция",
    zh: "🛍️ 电子商务",
  },
  "cb2.back_to_menu": {
    id: "◀️ Kembali ke Menu",
    en: "◀️ Back to Menu",
    ru: "◀️ Назад к меню",
    zh: "◀️ 返回菜单",
  },
  "cb2.viral_research_result": {
    id: "📈 *Riset Viral: {niche}*\n\n✅ Analisis selesai.\n\n*Pola Trending:* \n• Quick cuts, beat-matching\n• ASMR audio layer\n• Text-to-speech overlay (Female voice)\n\n*Saran Storyboard:*",
    en: "📈 *Viral Research: {niche}*\n\n✅ Analysis complete.\n\n*Trending Patterns:* \n• Quick cuts, beat-matching\n• ASMR audio layer\n• Text-to-speech overlay (Female voice)\n\n*Suggested Storyboard:*",
    ru: "📈 *Вирусный анализ: {niche}*\n\n✅ Анализ завершён.\n\n*Трендовые паттерны:* \n• Быстрые переходы\n• ASMR аудио\n• TTS озвучка\n\n*Рекомендуемый сценарий:*",
    zh: "📈 *病毒研究: {niche}*\n\n✅ 分析完成。\n\n*热门模式:* \n• 快速剪辑\n• ASMR音效\n• 文本转语音\n\n*建议故事板:*",
  },
  "cb2.generate_viral_storyboard": {
    id: "📋 Buat Storyboard Viral",
    en: "📋 Generate Viral Storyboard",
    ru: "📋 Создать вирусный сценарий",
    zh: "📋 生成病毒式故事板",
  },
  "cb2.disassemble": {
    id: "🔍 *Video/Image to Prompt*\n\nKirim video atau gambar kamu.\n_AI akan extract prompt yang digunakan untuk membuatnya._",
    en: "🔍 *Video/Image to Prompt*\n\nSend your video or image.\n_AI will extract the prompt used to create it._",
    ru: "🔍 *Видео/Изображение → Промпт*\n\nОтправьте видео или изображение.\n_AI извлечёт промпт._",
    zh: "🔍 *视频/图片转提示词*\n\n发送你的视频或图片。\n_AI将提取提示词。_",
  },
  "cb2.repurpose_video": {
    id: "🔄 *Repurpose Trending Video*\n\nKirim video dengan cara:\n• 📎 Upload file MP4 langsung\n• 🔗 Paste link TikTok / Instagram Reels\n• 🔗 Paste link YouTube Shorts / Twitter/X\n\n_AI akan extract storyboard, scene prompts, dan transkrip — lalu buat ulang videonya._",
    en: "🔄 *Repurpose Trending Video*\n\nSend a video by:\n• 📎 Upload MP4 file directly\n• 🔗 Paste TikTok / Instagram Reels link\n• 🔗 Paste YouTube Shorts / Twitter/X link\n\n_AI will extract the storyboard, scene prompts, and transcript — then recreate the video._",
    ru: "🔄 *Переделать трендовое видео*\n\nОтправьте видео:\n• 📎 MP4 файл\n• 🔗 Ссылка TikTok / Instagram Reels\n• 🔗 Ссылка YouTube Shorts / Twitter/X\n\n_AI извлечёт раскадровку и пересоздаст видео._",
    zh: "🔄 *重制热门视频*\n\n发送视频：\n• 📎 直接上传MP4\n• 🔗 TikTok / Instagram Reels链接\n• 🔗 YouTube Shorts / Twitter/X链接\n\n_AI将提取故事板并重新创建视频。_",
  },
  "cb2.video_regen_started": {
    id: "✅ *Regenerasi video dimulai!*\n\n🎬 Job: `{jobId}`\n📊 {scenes} scenes · {duration}s · niche: {niche}\n\n_Kami akan kirim video setelah selesai._",
    en: "✅ *Video regeneration started!*\n\n🎬 Job: `{jobId}`\n📊 {scenes} scenes · {duration}s · niche: {niche}\n\n_We'll send you the video when it's ready._",
    ru: "✅ *Генерация видео начата!*\n\n🎬 Задание: `{jobId}`\n📊 {scenes} сцен · {duration}с · ниша: {niche}\n\n_Мы отправим видео, когда оно будет готово._",
    zh: "✅ *视频重新生成已开始！*\n\n🎬 任务: `{jobId}`\n📊 {scenes}个场景 · {duration}秒 · 类别: {niche}\n\n_视频完成后我们会发送给你。_",
  },
  "cb2.video_regen_started_ref": {
    id: "✅ *Regenerasi video dimulai! (dengan referensi)*\n\n🎬 Job: `{jobId}`\n📊 {scenes} scenes · {duration}s · niche: {niche}\n\n_Kami akan kirim video setelah selesai._",
    en: "✅ *Video regeneration started! (with frame reference)*\n\n🎬 Job: `{jobId}`\n📊 {scenes} scenes · {duration}s · niche: {niche}\n\n_We'll send you the video when it's ready._",
    ru: "✅ *Генерация начата! (с референсом)*\n\n🎬 Задание: `{jobId}`\n📊 {scenes} сцен · {duration}с · ниша: {niche}\n\n_Мы отправим видео._",
    zh: "✅ *视频重新生成已开始！（含参考帧）*\n\n🎬 任务: `{jobId}`\n📊 {scenes}个场景 · {duration}秒 · 类别: {niche}\n\n_视频完成后发送给你。_",
  },
  "cb2.favorites_title": {
    id: "⭐ *Video Favorit*",
    en: "⭐ *Favorite Videos*",
    ru: "⭐ *Избранные видео*",
    zh: "⭐ *收藏视频*",
  },
  "cb2.favorites_empty": {
    id: "⭐ *Video Favorit*\n\nBelum ada favorit. Tandai video dengan ⭐ untuk menyimpannya di sini.",
    en: "⭐ *Favorite Videos*\n\nNo favorites yet. Star a video to save it here.",
    ru: "⭐ *Избранные видео*\n\nПока нет избранных. Отметьте видео ⭐ чтобы сохранить.",
    zh: "⭐ *收藏视频*\n\n暂无收藏。给视频加星标来收藏。",
  },
  "cb2.trash_title": {
    id: "🗑️ *Sampah*\n\nTap video untuk memulihkan:",
    en: "🗑️ *Trash*\n\nTap a video to restore:",
    ru: "🗑️ *Корзина*\n\nНажмите на видео для восстановления:",
    zh: "🗑️ *回收站*\n\n点击视频以恢复：",
  },
  "cb2.trash_empty": {
    id: "🗑️ *Sampah*\n\nSampah kosong.",
    en: "🗑️ *Trash*\n\nTrash is empty.",
    ru: "🗑️ *Корзина*\n\nКорзина пуста.",
    zh: "🗑️ *回收站*\n\n回收站为空。",
  },
  "cb2.video_restored": {
    id: "✅ Video dipulihkan!",
    en: "✅ Video restored!",
    ru: "✅ Видео восстановлено!",
    zh: "✅ 视频已恢复！",
  },
  "cb2.video_moved_trash": {
    id: "🗑️ *Video Dipindahkan ke Sampah*\n\nVideo telah dipindahkan ke sampah.",
    en: "🗑️ *Video Moved to Trash*\n\nThe video has been moved to trash.",
    ru: "🗑️ *Видео перемещено в корзину*",
    zh: "🗑️ *视频已移至回收站*",
  },
  "cb2.create_similar_failed": {
    id: "Gagal memuat pengaturan video. Gunakan /create untuk mulai.",
    en: "Failed to load video settings. Use /create to start.",
    ru: "Не удалось загрузить настройки. Используйте /create.",
    zh: "加载视频设置失败。请使用 /create 开始。",
  },
  "cb2.creating_similar": {
    id: "🎬 *Membuat video serupa*\n\nNiche: {nicheInfo}\nDurasi: {duration}s\nStoryboard: {storyboardInfo}\nStyle: {style}\n\nKirim gambar referensi atau /skip",
    en: "🎬 *Creating similar video*\n\nNiche: {nicheInfo}\nDuration: {duration}s\nStoryboard: {storyboardInfo}\nStyle: {style}\n\nSend a reference image or /skip",
    ru: "🎬 *Создание похожего видео*\n\nНиша: {nicheInfo}\nДлительность: {duration}с\nСценарий: {storyboardInfo}\nСтиль: {style}\n\nОтправьте референс или /skip",
    zh: "🎬 *创建类似视频*\n\n类别: {nicheInfo}\n时长: {duration}秒\n故事板: {storyboardInfo}\n风格: {style}\n\n发送参考图片或 /skip",
  },
  "cb2.ai_assistant_active": {
    id: '💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu sekarang.\n\n*Contoh:*\n• _"Bikinin prompt untuk produk skincare saya"_\n• _"Tips video TikTok F&B yang viral"_\n• _"Niche mana yang paling bagus buat jualan online?"_\n\nAtau browse template siap pakai:',
    en: '💬 *AI Assistant active!*\n\nJust type your question now.\n\n*Examples:*\n• _"Create a prompt for my skincare product"_\n• _"Tips for viral TikTok F&B videos"_\n• _"Which niche is best for selling online?"_\n\nOr browse ready-made templates:',
    ru: '💬 *AI Ассистент активен!*\n\nПросто напишите свой вопрос.\n\n*Примеры:*\n• _"Создай промпт для моего продукта"_\n• _"Советы по вирусным видео TikTok"_\n\nИли просмотрите готовые шаблоны:',
    zh: '💬 *AI助手已激活！*\n\n直接输入你的问题。\n\n*示例:*\n• _"为我的护肤品创建提示词"_\n• _"TikTok餐饮视频爆款技巧"_\n\n或浏览现成模板:',
  },
  "cb2.ai_assistant_fallback": {
    id: "💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu!",
    en: "💬 *AI Assistant active!*\n\nJust type your question!",
    ru: "💬 *AI Ассистент активен!*\n\nПросто напишите вопрос!",
    zh: "💬 *AI助手已激活！*\n\n直接输入你的问题！",
  },
  "cb2.prompt_library": {
    id: "📚 Lihat Prompt Library",
    en: "📚 View Prompt Library",
    ru: "📚 Библиотека промптов",
    zh: "📚 查看提示词库",
  },
  "cb2.trending_prompts": {
    id: "🔥 Trending Prompts",
    en: "🔥 Trending Prompts",
    ru: "🔥 Популярные промпты",
    zh: "🔥 热门提示词",
  },
  "cb2.mystery_prompt_box": {
    id: "🎁 *MYSTERY PROMPT BOX*\n\n✨ *PROMPT UNLOCKED!*\n\n{nicheEmoji} Niche: *{nicheLabel}* · ⭐ Rarity: *{rarity}*\n\n*{title}*\n\n`{prompt}`\n\n⭐ {successRate}% success rate\n\n🆓 Gratis untuk kamu hari ini!",
    en: "🎁 *MYSTERY PROMPT BOX*\n\n✨ *PROMPT UNLOCKED!*\n\n{nicheEmoji} Niche: *{nicheLabel}* · ⭐ Rarity: *{rarity}*\n\n*{title}*\n\n`{prompt}`\n\n⭐ {successRate}% success rate\n\n🆓 Free for you today!",
    ru: "🎁 *ЗАГАДОЧНЫЙ ПРОМПТ*\n\n✨ *РАЗБЛОКИРОВАН!*\n\n{nicheEmoji} Ниша: *{nicheLabel}* · ⭐ Редкость: *{rarity}*\n\n*{title}*\n\n`{prompt}`\n\n⭐ {successRate}% успешности\n\n🆓 Бесплатно сегодня!",
    zh: "🎁 *神秘提示词盒*\n\n✨ *提示词已解锁！*\n\n{nicheEmoji} 类别: *{nicheLabel}* · ⭐ 稀有度: *{rarity}*\n\n*{title}*\n\n`{prompt}`\n\n⭐ {successRate}% 成功率\n\n🆓 今日免费！",
  },
  "cb2.use_now": {
    id: "🚀 Pakai Sekarang",
    en: "🚀 Use Now",
    ru: "🚀 Использовать",
    zh: "🚀 立即使用",
  },
  "cb2.another_prompt": {
    id: "🔄 Prompt Lain",
    en: "🔄 Another Prompt",
    ru: "🔄 Другой промпт",
    zh: "🔄 其他提示词",
  },
  "cb2.back_to_settings": {
    id: "◀️ Kembali ke Pengaturan",
    en: "◀️ Back to Settings",
    ru: "◀️ Назад к настройкам",
    zh: "◀️ 返回设置",
  },
  "cb2.lang_updated": {
    id: "🌐 *Bahasa Diperbarui*\n\n✅ {flag} {label} dipilih.\n\nPesan bot, voice over, subtitle, dan caption akan menggunakan {label}.",
    en: "🌐 *Language Updated*\n\n✅ {flag} {label} selected.\n\nBot messages, voice over, subtitles, and captions will use {label}.",
    ru: "🌐 *Язык обновлён*\n\n✅ {flag} {label} выбран.\n\nСообщения, озвучка, субтитры будут на {label}.",
    zh: "🌐 *语言已更新*\n\n✅ {flag} {label} 已选择。\n\n消息、配音、字幕将使用 {label}。",
  },
  "cb2.notifications_title": {
    id: "🔔 *Notifikasi*\n\nStatus: {status}\n\nMenerima notifikasi untuk:\n• Penyelesaian video\n• Konfirmasi pembayaran\n• Komisi referral\n• Promo & update",
    en: "🔔 *Notifications*\n\nStatus: {status}\n\nReceive notifications for:\n• Video completion\n• Payment confirmations\n• Referral commissions\n• Promotions & updates",
    ru: "🔔 *Уведомления*\n\nСтатус: {status}\n\nУведомления о:\n• Завершении видео\n• Подтверждении оплаты\n• Реферальных комиссиях\n• Акции и обновления",
    zh: "🔔 *通知*\n\n状态: {status}\n\n接收以下通知:\n• 视频完成\n• 支付确认\n• 推荐佣金\n• 促销和更新",
  },
  "cb2.turn_off_notif": {
    id: "🔕 Matikan Notifikasi",
    en: "🔕 Turn Off Notifications",
    ru: "🔕 Выключить уведомления",
    zh: "🔕 关闭通知",
  },
  "cb2.turn_on_notif": {
    id: "🔔 Aktifkan Notifikasi",
    en: "🔔 Turn On Notifications",
    ru: "🔔 Включить уведомления",
    zh: "🔔 开启通知",
  },
  "cb2.notif_toggle_on": {
    id: "Notifikasi diaktifkan",
    en: "Notifications enabled",
    ru: "Уведомления включены",
    zh: "通知已启用",
  },
  "cb2.notif_toggle_off": {
    id: "Notifikasi dinonaktifkan",
    en: "Notifications disabled",
    ru: "Уведомления отключены",
    zh: "通知已禁用",
  },
  "cb2.notif_updated": {
    id: "🔔 *Notifikasi*\n\nStatus: {status}\n\nNotifikasi telah {action}.",
    en: "🔔 *Notifications*\n\nStatus: {status}\n\nNotifications have been {action}.",
    ru: "🔔 *Уведомления*\n\nСтатус: {status}\n\nУведомления {action}.",
    zh: "🔔 *通知*\n\n状态: {status}\n\n通知已{action}。",
  },
  "cb2.notif_enabled": {
    id: "✅ Aktif",
    en: "✅ Enabled",
    ru: "✅ Включены",
    zh: "✅ 已启用",
  },
  "cb2.notif_disabled": {
    id: "❌ Nonaktif",
    en: "❌ Disabled",
    ru: "❌ Отключены",
    zh: "❌ 已禁用",
  },
  "cb2.notif_action_enabled": {
    id: "diaktifkan",
    en: "enabled",
    ru: "включены",
    zh: "启用",
  },
  "cb2.notif_action_disabled": {
    id: "dinonaktifkan",
    en: "disabled",
    ru: "отключены",
    zh: "禁用",
  },
  "cb2.autorenewal_title": {
    id: "🔄 *Perpanjangan Otomatis*\n\nStatus: {status}\n\nJika diaktifkan, langganan kamu akan otomatis diperpanjang di akhir setiap siklus tagihan.",
    en: "🔄 *Auto-Renewal*\n\nStatus: {status}\n\nWhen enabled, your subscription will automatically renew at the end of each billing cycle.",
    ru: "🔄 *Автопродление*\n\nСтатус: {status}\n\nПри включении подписка продлевается автоматически.",
    zh: "🔄 *自动续费*\n\n状态: {status}\n\n启用后，订阅将自动续费。",
  },
  "cb2.disable_autorenewal": {
    id: "❌ Nonaktifkan Perpanjangan",
    en: "❌ Disable Auto-Renewal",
    ru: "❌ Отключить автопродление",
    zh: "❌ 关闭自动续费",
  },
  "cb2.enable_autorenewal": {
    id: "✅ Aktifkan Perpanjangan",
    en: "✅ Enable Auto-Renewal",
    ru: "✅ Включить автопродление",
    zh: "✅ 开启自动续费",
  },
  "cb2.autorenewal_toggle_on": {
    id: "Perpanjangan otomatis diaktifkan",
    en: "Auto-renewal enabled",
    ru: "Автопродление включено",
    zh: "自动续费已启用",
  },
  "cb2.autorenewal_toggle_off": {
    id: "Perpanjangan otomatis dinonaktifkan",
    en: "Auto-renewal disabled",
    ru: "Автопродление отключено",
    zh: "自动续费已禁用",
  },
  "cb2.autorenewal_updated": {
    id: "🔄 *Perpanjangan Otomatis*\n\nStatus: {status}\n\nPerpanjangan otomatis telah {action}.",
    en: "🔄 *Auto-Renewal*\n\nStatus: {status}\n\nAuto-renewal has been {action}.",
    ru: "🔄 *Автопродление*\n\nСтатус: {status}\n\nАвтопродление {action}.",
    zh: "🔄 *自动续费*\n\n状态: {status}\n\n自动续费已{action}。",
  },
  "cb2.settings_title": {
    id: "⚙️ *Pengaturan*\n\nKonfigurasi preferensi kamu:\n\n*Bahasa:* {lang}\n*Notifikasi:* {notif}\n*Perpanjangan Otomatis:* {autoRenew}\n\nApa yang ingin kamu ubah?",
    en: "⚙️ *Settings*\n\nConfigure your preferences:\n\n*Language:* {lang}\n*Notifications:* {notif}\n*Auto-renewal:* {autoRenew}\n\nWhat would you like to change?",
    ru: "⚙️ *Настройки*\n\n*Язык:* {lang}\n*Уведомления:* {notif}\n*Автопродление:* {autoRenew}\n\nЧто изменить?",
    zh: "⚙️ *设置*\n\n*语言:* {lang}\n*通知:* {notif}\n*自动续费:* {autoRenew}\n\n你想更改什么？",
  },
  "cb2.settings_lang_btn": {
    id: "🌐 Ganti Bahasa",
    en: "🌐 Change Language",
    ru: "🌐 Изменить язык",
    zh: "🌐 更改语言",
  },
  "cb2.settings_notif_btn": {
    id: "🔔 Notifikasi",
    en: "🔔 Notifications",
    ru: "🔔 Уведомления",
    zh: "🔔 通知",
  },
  "cb2.settings_autorenewal_btn": {
    id: "🔄 Perpanjangan Otomatis",
    en: "🔄 Auto-renewal",
    ru: "🔄 Автопродление",
    zh: "🔄 自动续费",
  },
  "cb2.tx_history_empty": {
    id: "📜 *Riwayat Transaksi*\n\nBelum ada transaksi.\n\nTop up kredit untuk mulai!",
    en: "📜 *Transaction History*\n\nNo transactions yet.\n\nTop up credits to get started!",
    ru: "📜 *История транзакций*\n\nТранзакций пока нет.\n\nПополните кредиты!",
    zh: "📜 *交易记录*\n\n暂无交易。\n\n充值积分开始！",
  },
  "cb2.tx_history_title": {
    id: "📜 *Riwayat Transaksi*",
    en: "📜 *Transaction History*",
    ru: "📜 *История транзакций*",
    zh: "📜 *交易记录*",
  },
  "cb2.tx_history_recent": {
    id: "_10 transaksi terakhir:_",
    en: "_Last 10 transactions:_",
    ru: "_Последние 10 транзакций:_",
    zh: "_最近10笔交易:_",
  },
  "cb2.tx_history_failed": {
    id: "❌ Gagal memuat riwayat transaksi.\n\nSilakan coba lagi nanti.",
    en: "❌ Failed to load transaction history.\n\nPlease try again later.",
    ru: "❌ Не удалось загрузить историю.\n\nПопробуйте позже.",
    zh: "❌ 加载交易记录失败。\n\n请稍后重试。",
  },
  "cb2.copy_prompt_title": {
    id: "📋 *Prompt yang Diekstrak:*",
    en: "📋 *Extracted Prompt:*",
    ru: "📋 *Извлечённый промпт:*",
    zh: "📋 *提取的提示词:*",
  },
  "cb2.copy_prompt_hint": {
    id: "_Salin teks di atas untuk menggunakannya._",
    en: "_Copy the text above to use it._",
    ru: "_Скопируйте текст выше._",
    zh: "_复制上方文字即可使用。_",
  },
  "cb2.copy_prompt_not_found": {
    id: "❌ Prompt tidak ditemukan. Gunakan fitur Disassemble terlebih dahulu untuk mengekstrak prompt dari media.",
    en: "❌ Prompt not found. Use the Disassemble feature first to extract a prompt from media.",
    ru: "❌ Промпт не найден. Сначала используйте «Разобрать».",
    zh: "❌ 未找到提示词。请先使用反向提取功能。",
  },
  "cb2.connect_new_account_title": {
    id: "🔗 *Hubungkan Akun Baru*\n\nPilih platform untuk dihubungkan:",
    en: "🔗 *Connect New Account*\n\nSelect platform to connect:",
    ru: "🔗 *Подключить новый аккаунт*\n\nВыберите платформу:",
    zh: "🔗 *连接新账号*\n\n选择要连接的平台:",
  },
  "cb2.referral_stats": {
    id: "📊 *Statistik Referral*\n\n*Total Referral:* {referralCount}\n*Tier Referral:* {referralTier}\n\n*Ringkasan Komisi:*\n• Total Didapat: Rp {totalCommission}\n• Tersedia: Rp {availableCommission}\n• Ditarik: Rp {withdrawnCommission}\n\n*Kode Referral:* `{referralCode}`",
    en: "📊 *Referral Statistics*\n\n*Total Referrals:* {referralCount}\n*Referral Tier:* {referralTier}\n\n*Commission Summary:*\n• Total Earned: Rp {totalCommission}\n• Available: Rp {availableCommission}\n• Withdrawn: Rp {withdrawnCommission}\n\n*Referral Code:* `{referralCode}`",
    ru: "📊 *Статистика рефералов*\n\n*Всего:* {referralCount}\n*Уровень:* {referralTier}\n\n*Комиссии:*\n• Заработано: Rp {totalCommission}\n• Доступно: Rp {availableCommission}\n• Выведено: Rp {withdrawnCommission}\n\n*Код:* `{referralCode}`",
    zh: "📊 *推荐统计*\n\n*总推荐:* {referralCount}\n*等级:* {referralTier}\n\n*佣金:*\n• 总收入: Rp {totalCommission}\n• 可用: Rp {availableCommission}\n• 已提现: Rp {withdrawnCommission}\n\n*推荐码:* `{referralCode}`",
  },
  "cb2.referral_stats_failed": {
    id: "❌ Gagal memuat statistik referral. Silakan coba lagi.",
    en: "❌ Failed to load referral statistics. Please try again.",
    ru: "❌ Не удалось загрузить статистику. Попробуйте снова.",
    zh: "❌ 加载推荐统计失败。请重试。",
  },
  "cb2.withdraw_title": {
    id: "💸 *Tarik Komisi*",
    en: "💸 *Withdraw Commission*",
    ru: "💸 *Вывод комиссии*",
    zh: "💸 *提取佣金*",
  },
  "cb2.withdraw_balance": {
    id: "*Saldo Komisi:* Rp {available}",
    en: "*Commission Balance:* Rp {available}",
    ru: "*Баланс комиссии:* Rp {available}",
    zh: "*佣金余额:* Rp {available}",
  },
  "cb2.withdraw_no_commission": {
    id: "❌ Belum ada komisi yang tersedia.\n\nAjak teman untuk mulai mendapatkan komisi!",
    en: "❌ No commission available yet.\n\nInvite friends to start earning!",
    ru: "❌ Комиссий пока нет.\n\nПригласите друзей!",
    zh: "❌ 暂无可用佣金。\n\n邀请朋友开始赚取佣金！",
  },
  "cb2.withdraw_options": {
    id: "*Opsi Penarikan:*\n\n1️⃣ *Tukar ke Kredit* — {creditsCanConvert} kredit\n   (Rate: Rp {sellRate}/kredit)\n\n2️⃣ *Jual ke Admin* — Rp {cashoutHalf}\n   (50% dari harga beli kredit)\n\n3️⃣ *Transfer P2P* — Kirim kredit ke user lain\n   (Gunakan /send setelah konversi)\n\n_Komisi juga bisa dipakai langsung untuk generate!_",
    en: "*Withdrawal Options:*\n\n1️⃣ *Convert to Credits* — {creditsCanConvert} credits\n   (Rate: Rp {sellRate}/credit)\n\n2️⃣ *Sell to Admin* — Rp {cashoutHalf}\n   (50% of credit price)\n\n3️⃣ *P2P Transfer* — Send credits to another user\n   (Use /send after conversion)\n\n_Commission can also be used directly for generation!_",
    ru: "*Варианты вывода:*\n\n1️⃣ *В кредиты* — {creditsCanConvert} кредитов\n   (Курс: Rp {sellRate}/кредит)\n\n2️⃣ *Продать админу* — Rp {cashoutHalf}\n   (50% стоимости)\n\n3️⃣ *P2P перевод*\n   (/send после конвертации)\n\n_Комиссию можно использовать для генерации!_",
    zh: "*提现选项:*\n\n1️⃣ *兑换积分* — {creditsCanConvert}积分\n   (汇率: Rp {sellRate}/积分)\n\n2️⃣ *卖给管理员* — Rp {cashoutHalf}\n   (50%价格)\n\n3️⃣ *P2P转账*\n   (兑换后用 /send)\n\n_佣金可直接用于生成！_",
  },
  "cb2.convert_to_credits_btn": {
    id: "🔄 Tukar ke {credits} Kredit",
    en: "🔄 Convert to {credits} Credits",
    ru: "🔄 В {credits} кредитов",
    zh: "🔄 兑换为 {credits} 积分",
  },
  "cb2.sell_to_admin_btn": {
    id: "💵 Jual ke Admin (Rp {amount})",
    en: "💵 Sell to Admin (Rp {amount})",
    ru: "💵 Продать админу (Rp {amount})",
    zh: "💵 卖给管理员 (Rp {amount})",
  },
  "cb2.view_stats": {
    id: "📊 Lihat Stats",
    en: "📊 View Stats",
    ru: "📊 Статистика",
    zh: "📊 查看统计",
  },
  "cb2.conversion_success": {
    id: "✅ *Konversi Berhasil!*\n\nRp {available} komisi → *{credits} kredit*\n\nKredit sudah ditambahkan ke saldo kamu.",
    en: "✅ *Conversion Successful!*\n\nRp {available} commission → *{credits} credits*\n\nCredits have been added to your balance.",
    ru: "✅ *Конвертация успешна!*\n\nRp {available} комиссии → *{credits} кредитов*\n\nКредиты добавлены.",
    zh: "✅ *兑换成功！*\n\nRp {available} 佣金 → *{credits} 积分*\n\n积分已添加到余额。",
  },
  "cb2.create_video_btn": {
    id: "🎬 Buat Video",
    en: "🎬 Create Video",
    ru: "🎬 Создать видео",
    zh: "🎬 创建视频",
  },
  "cb2.main_menu": {
    id: "🏠 Menu Utama",
    en: "🏠 Main Menu",
    ru: "🏠 Главное меню",
    zh: "🏠 主菜单",
  },
  "cb2.cashout_admin_notify": {
    id: "💸 *Cashout Request*\n\nUser: {userName}\nTG ID: {telegramId}\nKomisi: Rp {available}\nCashout (50%): *Rp {cashoutAmount}*\n\nTransfer ke rekening user, lalu ketik:\n/grant_credits {telegramId} 0 cashout_approved",
    en: "💸 *Cashout Request*\n\nUser: {userName}\nTG ID: {telegramId}\nCommission: Rp {available}\nCashout (50%): *Rp {cashoutAmount}*\n\nTransfer to user account, then type:\n/grant_credits {telegramId} 0 cashout_approved",
    ru: "💸 *Запрос на вывод*\n\nПользователь: {userName}\nTG ID: {telegramId}\nКомиссия: Rp {available}\nВывод (50%): *Rp {cashoutAmount}*\n\nПереведите, затем:\n/grant_credits {telegramId} 0 cashout_approved",
    zh: "💸 *提现请求*\n\n用户: {userName}\nTG ID: {telegramId}\n佣金: Rp {available}\n提现 (50%): *Rp {cashoutAmount}*\n\n转账后输入:\n/grant_credits {telegramId} 0 cashout_approved",
  },
  "cb2.cashout_sent": {
    id: "✅ *Permintaan Cashout Dikirim!*\n\nKomisi: Rp {available}\nCashout (50%): *Rp {cashoutAmount}*\n\nAdmin akan memproses dalam 1-3 hari kerja.\nKamu akan dinotifikasi saat transfer selesai.",
    en: "✅ *Cashout Request Sent!*\n\nCommission: Rp {available}\nCashout (50%): *Rp {cashoutAmount}*\n\nAdmin will process within 1-3 business days.\nYou'll be notified when complete.",
    ru: "✅ *Запрос отправлен!*\n\nКомиссия: Rp {available}\nВывод (50%): *Rp {cashoutAmount}*\n\nАдмин обработает за 1-3 рабочих дня.",
    zh: "✅ *提现请求已发送！*\n\n佣金: Rp {available}\n提现 (50%): *Rp {cashoutAmount}*\n\n管理员将在1-3个工作日内处理。",
  },
  "cb2.no_photos_yet": {
    id: "Belum ada foto. Kirim gambar referensi dulu, atau /skip untuk lanjut tanpa foto.",
    en: "No photos yet. Send a reference image first, or /skip to continue without one.",
    ru: "Фото ещё нет. Отправьте референс или /skip.",
    zh: "还没有照片。先发送参考图片，或 /skip 跳过。",
  },
  "cb2.add_more_photos": {
    id: 'Kirim {remaining} foto lagi.\n\nKamu juga bisa tap "Generate Sekarang" kalau sudah siap.',
    en: 'Send up to {remaining} more photo(s).\n\nYou can also tap "Generate Now" when ready.',
    ru: "Отправьте ещё до {remaining} фото.\n\nНажмите «Сгенерировать» когда готовы.",
    zh: '再发送最多 {remaining} 张照片。\n\n准备好后点击"立即生成"。',
  },
  "cb2.contact_support": {
    id: "💬 *Butuh Bantuan?*\n\nHubungi tim support kami:\n• Telegram: @BerkahKaryaSupport\n\nSertakan screenshot error dan username kamu saat menghubungi.",
    en: "💬 *Need Help?*\n\nContact our support team:\n• Telegram: @BerkahKaryaSupport\n\nInclude error screenshots and your username.",
    ru: "💬 *Нужна помощь?*\n\nПоддержка: @BerkahKaryaSupport\n\nПриложите скриншот ошибки.",
    zh: "💬 *需要帮助？*\n\n联系: @BerkahKaryaSupport\n\n请附上错误截图和用户名。",
  },
  "cb2.notif_unsubscribed": {
    id: "🔕 Notifikasi dinonaktifkan.\n\nKamu bisa mengaktifkan kembali di ⚙️ Settings.",
    en: "🔕 Notifications disabled.\n\nYou can re-enable them in ⚙️ Settings.",
    ru: "🔕 Уведомления отключены.\n\nВключите снова в ⚙️ Настройках.",
    zh: "🔕 通知已关闭。\n\n可在 ⚙️ 设置中重新开启。",
  },
  "cb2.edit_scene": {
    id: "✏️ *Edit Scene {sceneNum}*\n\nKetik deskripsi baru untuk scene ini.\nAtau ketik /skip untuk membatalkan.",
    en: "✏️ *Edit Scene {sceneNum}*\n\nType a new description for this scene.\nOr type /skip to cancel.",
    ru: "✏️ *Редактировать сцену {sceneNum}*\n\nВведите новое описание.\nИли /skip для отмены.",
    zh: "✏️ *编辑场景 {sceneNum}*\n\n输入新描述。\n或 /skip 取消。",
  },
  "cb2.publish_no_accounts": {
    id: "📤 *Publikasi ke Media Sosial*\n\nKamu belum menghubungkan akun media sosial.\n\nHubungkan akun dulu untuk mempublikasikan video.",
    en: "📤 *Publish to Social Media*\n\nYou haven't connected any social media accounts yet.\n\nConnect your accounts first to publish videos.",
    ru: "📤 *Публикация в соцсети*\n\nВы не подключили аккаунты.\n\nСначала подключите аккаунты.",
    zh: "📤 *发布到社交媒体*\n\n你还没有连接社交媒体账号。\n\n先连接账号才能发布。",
  },
  "cb2.publish_select_platform": {
    id: "📤 *Publikasi ke Media Sosial*\n\nPilih platform untuk mempublikasikan video ini:",
    en: "📤 *Publish to Social Media*\n\nSelect the platform(s) to publish this video:",
    ru: "📤 *Публикация*\n\nВыберите платформы:",
    zh: "📤 *发布到社交媒体*\n\n选择发布平台:",
  },
  "cb2.publish_ready": {
    id: "📤 *Publikasi Video*\n\n✅ {count} platform dipilih\n\nSiap mempublikasikan?",
    en: "📤 *Publish Video*\n\n✅ {count} platform(s) selected\n\nReady to publish?",
    ru: "📤 *Публикация*\n\n✅ Платформ: {count}\n\nОпубликовать?",
    zh: "📤 *发布视频*\n\n✅ 已选 {count} 个平台\n\n准备发布？",
  },
  "cb2.publishing_progress": {
    id: "⏳ *Mempublikasikan...*\n\nMengunggah ke platform yang dipilih...",
    en: "⏳ *Publishing...*\n\nUploading to selected platforms...",
    ru: "⏳ *Публикация...*\n\nЗагрузка на платформы...",
    zh: "⏳ *正在发布...*\n\n正在上传...",
  },
  "cb2.publish_failed": {
    id: "❌ *Publikasi Gagal*\n\nError: {error}\n\nSilakan coba lagi atau hubungi support.",
    en: "❌ *Publish Failed*\n\nError: {error}\n\nPlease try again or contact support.",
    ru: "❌ *Публикация не удалась*\n\nОшибка: {error}\n\nПопробуйте снова.",
    zh: "❌ *发布失败*\n\n错误: {error}\n\n请重试或联系客服。",
  },
  "cb2.no_connected_accounts": {
    id: "❌ Tidak ada akun sosial yang terhubung.\n\nHubungkan akun terlebih dahulu untuk auto-post.",
    en: "❌ No connected social accounts found.\n\nConnect your accounts first to auto-post.",
    ru: "❌ Нет подключённых аккаунтов.\n\nСначала подключите аккаунты.",
    zh: "❌ 未找到已连接的社交账号。\n\n先连接账号。",
  },
  "cb2.auto_posting": {
    id: "⏳ *Auto-Posting ke {count} akun...*\n\nPlatform: {platforms}",
    en: "⏳ *Auto-Posting to {count} account(s)...*\n\nPlatforms: {platforms}",
    ru: "⏳ *Авто-публикация на {count} аккаунт(ов)...*\n\nПлатформы: {platforms}",
    zh: "⏳ *自动发布到 {count} 个账号...*\n\n平台: {platforms}",
  },
  "cb2.auto_post_failed": {
    id: "❌ *Auto-Post Gagal*\n\nError: {error}\n\nKamu masih bisa publish manual.",
    en: "❌ *Auto-Post Failed*\n\nError: {error}\n\nYou can still publish manually.",
    ru: "❌ *Авто-публикация не удалась*\n\nОшибка: {error}\n\nМожно опубликовать вручную.",
    zh: "❌ *自动发布失败*\n\n错误: {error}\n\n你仍可手动发布。",
  },
  "cb2.connect_social_empty": {
    id: "🔗 *Hubungkan Akun Sosial*\n\nHubungkan akun media sosial kamu untuk mempublikasikan video langsung.\n\nPilih platform:",
    en: "🔗 *Connect Social Accounts*\n\nConnect your social media accounts to publish videos directly.\n\nSelect platform to connect:",
    ru: "🔗 *Подключить соцсети*\n\nПодключите аккаунты для публикации.\n\nВыберите платформу:",
    zh: "🔗 *连接社交账号*\n\n连接账号以直接发布视频。\n\n选择平台:",
  },
  "cb2.connected_accounts_title": {
    id: "🔗 *Akun Terhubung*",
    en: "🔗 *Connected Accounts*",
    ru: "🔗 *Подключённые аккаунты*",
    zh: "🔗 *已连接账号*",
  },
  "cb2.connect_more": {
    id: "\nHubungkan akun lainnya:",
    en: "\nConnect more accounts:",
    ru: "\nПодключить ещё:",
    zh: "\n连接更多账号:",
  },
  "cb2.disconnect_btn": {
    id: "❌ Putuskan {platform} ({username})",
    en: "❌ Disconnect {platform} ({username})",
    ru: "❌ Отключить {platform} ({username})",
    zh: "❌ 断开 {platform} ({username})",
  },
  "cb2.connect_platform": {
    id: "🔗 *Hubungkan {platform}*\n\nUntuk menghubungkan akun {platform} kamu:\n\n1. Buka PostBridge Dashboard\n2. Hubungkan akun {platform} kamu\n3. Salin Account ID\n4. Tempelkan di sini\n\nAtau gunakan link di bawah:",
    en: "🔗 *Connect {platform}*\n\nTo connect your {platform} account:\n\n1. Go to PostBridge Dashboard\n2. Connect your {platform} account\n3. Copy your Account ID\n4. Paste it here\n\nOr use the link below:",
    ru: "🔗 *Подключить {platform}*\n\n1. Откройте PostBridge Dashboard\n2. Подключите {platform}\n3. Скопируйте Account ID\n4. Вставьте здесь\n\nИли по ссылке:",
    zh: "🔗 *连接{platform}*\n\n1. 前往PostBridge Dashboard\n2. 连接{platform}账号\n3. 复制Account ID\n4. 粘贴到这里\n\n或使用链接:",
  },
  "cb2.image_success": {
    id: "✅ *Gambar Berhasil Dibuat!*\n\n_Prompt: {prompt}_",
    en: "✅ *Image Created Successfully!*\n\n_Prompt: {prompt}_",
    ru: "✅ *Изображение создано!*\n\n_Промпт: {prompt}_",
    zh: "✅ *图片创建成功！*\n\n_提示词: {prompt}_",
  },
  "cb2.image_send_failed": {
    id: "❌ Gagal mengirim gambar. Kredit dikembalikan.",
    en: "❌ Failed to send image. Credits refunded.",
    ru: "❌ Не удалось отправить. Кредиты возвращены.",
    zh: "❌ 发送图片失败。积分已退还。",
  },
  "cb2.image_gen_failed": {
    id: "❌ Gagal generate gambar. Kredit tidak ditagih.",
    en: "❌ Failed to generate image. Credits not charged.",
    ru: "❌ Не удалось сгенерировать. Кредиты не списаны.",
    zh: "❌ 生成图片失败。未扣除积分。",
  },
  "cb2.image_gen_error": {
    id: "❌ Gagal generate gambar. Coba lagi.",
    en: "❌ Failed to generate image. Try again.",
    ru: "❌ Не удалось сгенерировать. Попробуйте снова.",
    zh: "❌ 生成图片失败。请重试。",
  },
  "cb2.image_gen_title": {
    id: "🖼️ *Generate {category}*\n💰 _Biaya: {cost} kredit per gambar_",
    en: "🖼️ *Generate {category}*\n💰 _Cost: {cost} credits per image_",
    ru: "🖼️ *Создать {category}*\n💰 _Стоимость: {cost} кредитов_",
    zh: "🖼️ *生成{category}*\n💰 _费用: {cost} 积分/张_",
  },
  "cb2.image_gen_method": {
    id: "Pilih cara generate:",
    en: "How do you want to generate?",
    ru: "Как создать?",
    zh: "选择生成方式:",
  },
  "cb2.image_upload_ref": {
    id: "📸 *Upload Referensi* — Kirim foto produk, AI buat gambar berdasarkan itu",
    en: "📸 *Upload Reference* — Send your product photo and AI will create based on it",
    ru: "📸 *Загрузить референс* — Отправьте фото, AI создаст по нему",
    zh: "📸 *上传参考* — 发送产品照片，AI将基于此创建",
  },
  "cb2.image_use_avatar": {
    id: "👤 *Pakai Avatar* — Karakter konsisten di semua gambar",
    en: "👤 *Use Avatar* — Keep a consistent character across images",
    ru: "👤 *Аватар* — Единый персонаж",
    zh: "👤 *使用头像* — 保持角色一致",
  },
  "cb2.image_describe_only": {
    id: "✏️ *Deskripsi Saja* — AI generate dari teks deskripsi kamu",
    en: "✏️ *Describe Only* — AI generates from your text description",
    ru: "✏️ *Только описание* — AI создаст по тексту",
    zh: "✏️ *仅描述* — AI根据文字描述生成",
  },
  "cb2.image_generating": {
    id: "🖼️ *Generate {category}*\n\nMenggunakan prompt yang di-clone:\n_{prompt}_\n\nMembuat gambar...",
    en: "🖼️ *Generate {category}*\n\nUsing cloned prompt:\n_{prompt}_\n\nGenerating image...",
    ru: "🖼️ *Создание {category}*\n\nКлонированный промпт:\n_{prompt}_\n\nГенерация...",
    zh: "🖼️ *生成{category}*\n\n使用克隆提示词:\n_{prompt}_\n\n正在生成...",
  },
  "cb2.upload_ref_photo_btn": {
    id: "📸 Upload Foto Referensi",
    en: "📸 Upload Reference Photo",
    ru: "📸 Загрузить фото",
    zh: "📸 上传参考照片",
  },
  "cb2.describe_only_btn": {
    id: "✏️ Deskripsi Saja (Tanpa Referensi)",
    en: "✏️ Describe Only (No Reference)",
    ru: "✏️ Только описание",
    zh: "✏️ 仅描述（无参考）",
  },
  "cb2.skip_ref_image": {
    id: "⏭️ Lewati Gambar Referensi",
    en: "⏭️ Skip Reference Image",
    ru: "⏭️ Пропустить",
    zh: "⏭️ 跳过参考图片",
  },
  "cb2.change_niche_style": {
    id: "🔄 Ganti Niche/Style",
    en: "🔄 Change Niche/Style",
    ru: "🔄 Изменить нишу/стиль",
    zh: "🔄 更换类别/风格",
  },
  "cb2.create_video_again": {
    id: "🎬 Buat Video Lagi",
    en: "🎬 Create Another Video",
    ru: "🎬 Создать ещё видео",
    zh: "🎬 再创建视频",
  },
  "cb2.my_videos": {
    id: "📁 Video Saya",
    en: "📁 My Videos",
    ru: "📁 Мои видео",
    zh: "📁 我的视频",
  },
  "cb2.connect_accounts_btn": {
    id: "🔗 Hubungkan Akun",
    en: "🔗 Connect Accounts",
    ru: "🔗 Подключить аккаунты",
    zh: "🔗 连接账号",
  },
  "cb2.connect_new_btn": {
    id: "➕ Hubungkan Akun Baru",
    en: "➕ Connect New Account",
    ru: "➕ Подключить новый",
    zh: "➕ 连接新账号",
  },
  "cb2.publish_now_btn": {
    id: "✅ Publish Sekarang",
    en: "✅ Publish Now",
    ru: "✅ Опубликовать",
    zh: "✅ 立即发布",
  },
  "cb2.publish_manually_btn": {
    id: "📤 Publish Manual",
    en: "📤 Publish Manually",
    ru: "📤 Вручную",
    zh: "📤 手动发布",
  },
  "cb2.topup_now": {
    id: "💰 Top Up Sekarang",
    en: "💰 Top Up Now",
    ru: "💰 Пополнить",
    zh: "💰 立即充值",
  },
  "cb2.withdraw_btn": {
    id: "💸 Tarik Dana",
    en: "💸 Withdraw",
    ru: "💸 Вывести",
    zh: "💸 提现",
  },
  "cb2.open_postbridge": {
    id: "🔗 Buka PostBridge",
    en: "🔗 Open PostBridge",
    ru: "🔗 Открыть PostBridge",
    zh: "🔗 打开PostBridge",
  },

  // Remaining callback handler translations
  "cb.tx_history_error": {
    id: "❌ Gagal memuat riwayat transaksi.\n\nSilakan coba lagi nanti.",
    en: "❌ Failed to load transaction history.\n\nPlease try again later.",
    ru: "❌ Не удалось загрузить историю транзакций.\n\nПопробуйте позже.",
    zh: "❌ 加载交易记录失败。\n\n请稍后重试。",
  },
  "cb.referral_stats_error": {
    id: "❌ Gagal memuat statistik referral. Silakan coba lagi.",
    en: "❌ Failed to load referral stats. Please try again.",
    ru: "❌ Не удалось загрузить статистику рефералов. Попробуйте снова.",
    zh: "❌ 加载推荐统计失败。请重试。",
  },
  "cb.publish_failed": {
    id: "❌ *Publish Gagal*\n\nSilakan coba lagi atau hubungi support.",
    en: "❌ *Publish Failed*\n\nPlease try again or contact support.",
    ru: "❌ *Публикация не удалась*\n\nПопробуйте снова или обратитесь в поддержку.",
    zh: "❌ *发布失败*\n\n请重试或联系支持。",
  },
  "cb.image_gen_header": {
    id: "🖼️ *Generate {category}*\n💰 _Biaya: {cost} kredit per gambar_\n\nPilih cara generate:\n\n📸 *Upload Referensi* — Kirim foto produk, AI buat gambar berdasarkan itu\n👤 *Pakai Avatar* — Karakter konsisten di semua gambar\n✏️ *Deskripsi Saja* — AI generate dari teks deskripsi kamu",
    en: "🖼️ *Generate {category}*\n💰 _Cost: {cost} credits per image_\n\nChoose generation method:\n\n📸 *Upload Reference* — Send your product photo, AI creates based on it\n👤 *Use Avatar* — Consistent character across all images\n✏️ *Describe Only* — AI generates from your text description",
    ru: "🖼️ *Создать {category}*\n💰 _Стоимость: {cost} кредитов за изображение_\n\nВыберите способ создания:\n\n📸 *Загрузить референс* — Отправьте фото товара, AI создаст по нему\n👤 *Аватар* — Единый персонаж на всех изображениях\n✏️ *Только описание* — AI создаст по текстовому описанию",
    zh: "🖼️ *生成 {category}*\n💰 _费用: {cost} 积分/张_\n\n选择生成方式:\n\n📸 *上传参考* — 发送产品照片，AI将基于此创建\n👤 *使用头像* — 保持角色一致\n✏️ *仅描述* — AI根据文字描述生成",
  },
  "cb.btn_upload_ref": {
    id: "📸 Upload Foto Referensi",
    en: "📸 Upload Reference Photo",
    ru: "📸 Загрузить фото-референс",
    zh: "📸 上传参考照片",
  },
  "cb.btn_describe_only": {
    id: "✏️ Deskripsi Saja (Tanpa Referensi)",
    en: "✏️ Describe Only (No Reference)",
    ru: "✏️ Только описание (без референса)",
    zh: "✏️ 仅描述 (无参考)",
  },
  "gamification.badge_earned": {
    id: "{emoji} Selamat! Kamu mendapatkan badge *{badgeName}*!",
    en: "{emoji} Congratulations! You earned the *{badgeName}* badge!",
    ru: "{emoji} Поздравляем! Вы получили значок *{badgeName}*!",
    zh: "{emoji} 恭喜！您获得了 *{badgeName}* 徽章！",
  },
  "prompts.library_menu": {
    id: "📚 **PROMPT LIBRARY — 40+ Templates Profesional**\n\nPilih niche bisnismu untuk lihat prompt yang relevan:\n\n────────────────────────────────────────────\n🍔 **F&B** — Restaurant, cafe, food stall\n👗 **Fashion** — Clothing, hijab, accessories\n📱 **Tech** — Gadget, software, gaming\n💪 **Health** — Skincare, supplement, fitness\n✈️ **Travel** — Hotel, tour, destination\n📚 **Education** — Course, training, tutorial\n💰 **Finance** — Investment, insurance, fintech\n🎭 **Entertainment** — Event, content creator\n────────────────────────────────────────────\n\n🔥 **Trending Now** — Prompt paling populer minggu ini\n\nKetik niche atau `/prompts [niche]`\nContoh: `/prompts fnb` atau `/prompts fashion`",
    en: "📚 **PROMPT LIBRARY — 40+ Professional Templates**\n\nChoose your business niche to see relevant prompts:\n\n────────────────────────────────────────────\n🍔 **F&B** — Restaurant, cafe, food stall\n👗 **Fashion** — Clothing, hijab, accessories\n📱 **Tech** — Gadget, software, gaming\n💪 **Health** — Skincare, supplement, fitness\n✈️ **Travel** — Hotel, tour, destination\n📚 **Education** — Course, training, tutorial\n💰 **Finance** — Investment, insurance, fintech\n🎭 **Entertainment** — Event, content creator\n────────────────────────────────────────────\n\n🔥 **Trending Now** — Most popular prompts this week\n\nType a niche or `/prompts [niche]`\nExample: `/prompts fnb` or `/prompts fashion`",
    ru: "📚 **БИБЛИОТЕКА ПРОМПТОВ — 40+ Профессиональных шаблонов**\n\nВыберите нишу вашего бизнеса:\n\n────────────────────────────────────────────\n🍔 **F&B** — Рестораны, кафе\n👗 **Fashion** — Одежда, аксессуары\n📱 **Tech** — Гаджеты, софт, игры\n💪 **Health** — Уход, фитнес\n✈️ **Travel** — Отели, туры\n📚 **Education** — Курсы, обучение\n💰 **Finance** — Инвестиции, финтех\n🎭 **Entertainment** — Контент, события\n────────────────────────────────────────────\n\n🔥 **Тренды** — Популярные промпты за неделю\n\nВведите нишу или `/prompts [ниша]`",
    zh: "📚 **提示词库 — 40+ 专业模板**\n\n选择您的业务类别查看相关提示词:\n\n────────────────────────────────────────────\n🍔 **餐饮** — 餐厅、咖啡厅\n👗 **时尚** — 服装、配饰\n📱 **科技** — 数码、软件、游戏\n💪 **健康** — 护肤、健身\n✈️ **旅游** — 酒店、旅行\n📚 **教育** — 课程、培训\n💰 **金融** — 投资、保险\n🎭 **娱乐** — 活动、创作者\n────────────────────────────────────────────\n\n🔥 **热门** — 本周最受欢迎的提示词\n\n输入类别或 `/prompts [类别]`",
  },
  // ---------------------------------------------------------------------------
  // Video completion notification (Sprint 3.2)
  // ---------------------------------------------------------------------------
  "video.completion_title": {
    id: "✅ *Video Selesai!*",
    en: "✅ *Video Complete!*",
    ru: "✅ *Видео готово!*",
    zh: "✅ *视频完成!*",
  },
  "video.completion_info": {
    id: "🎬 Durasi: {duration}s | Platform: {platform}",
    en: "🎬 Duration: {duration}s | Platform: {platform}",
    ru: "🎬 Длительность: {duration}с | Платформа: {platform}",
    zh: "🎬 时长: {duration}s | 平台: {platform}",
  },
  "video.completion_cta": {
    id: "Tap tombol di bawah untuk download atau publish:",
    en: "Tap the buttons below to download or publish:",
    ru: "Нажмите кнопки ниже для скачивания или публикации:",
    zh: "点击下方按钮下载或发布：",
  },
  "video.btn_download": {
    id: "⬇️ Download HD",
    en: "⬇️ Download HD",
    ru: "⬇️ Скачать HD",
    zh: "⬇️ 下载 HD",
  },
  "video.btn_publish": {
    id: "📤 Publish ke Social Media",
    en: "📤 Publish to Social Media",
    ru: "📤 Опубликовать в соцсетях",
    zh: "📤 发布到社交媒体",
  },
  "video.btn_good": {
    id: "👍 Bagus",
    en: "👍 Good",
    ru: "👍 Хорошо",
    zh: "👍 不错",
  },
  "video.btn_needs_work": {
    id: "👎 Perlu Perbaikan",
    en: "👎 Needs Work",
    ru: "👎 Нужно улучшить",
    zh: "👎 需要改进",
  },
  "video.btn_create_another": {
    id: "🎬 Buat Lagi",
    en: "🎬 Create Another",
    ru: "🎬 Создать ещё",
    zh: "🎬 再创建一个",
  },
  "video.btn_my_videos": {
    id: "📁 Video Saya",
    en: "📁 My Videos",
    ru: "📁 Мои видео",
    zh: "📁 我的视频",
  },
  // ---------------------------------------------------------------------------
  // First-video beginner tips (Sprint 3.3)
  // ---------------------------------------------------------------------------
  "video.first_video_tips": {
    id: "🎉 *Selamat atas video pertamamu!*\n\nBerikut tips untuk memaksimalkan OpenClaw:\n\n💾 *Simpan promptmu* — Catat prompt yang berhasil agar bisa dipakai lagi\n🔄 *Coba niche berbeda* — Eksplorasi kategori lain untuk temukan gaya terbaikmu\n🔗 *Bagikan referral* — Dapatkan komisi 15% setiap kali teman mendaftar via linkmu\n📊 *Lihat videomu* — Gunakan /videos untuk kelola semua video yang sudah dibuat\n\nSelamat berkreasi! 🚀",
    en: "🎉 *Congratulations on your first video!*\n\nHere are tips to get the most out of OpenClaw:\n\n💾 *Save your prompt* — Note down prompts that work well so you can reuse them\n🔄 *Try different niches* — Explore other categories to find your best style\n🔗 *Share your referral link* — Earn 15% commission every time a friend signs up via your link\n📊 *Manage your videos* — Use /videos to see and manage all your created videos\n\nHappy creating! 🚀",
    ru: "🎉 *Поздравляем с первым видео!*\n\nСоветы по максимальному использованию OpenClaw:\n\n💾 *Сохраняйте промпты* — Записывайте удачные промпты для повторного использования\n🔄 *Пробуйте разные ниши* — Исследуйте другие категории, чтобы найти свой стиль\n🔗 *Делитесь реферальной ссылкой* — Получайте 15% комиссии за каждого приведённого друга\n📊 *Управляйте видео* — Используйте /videos для просмотра всех созданных видео\n\nТворите с удовольствием! 🚀",
    zh: "🎉 *恭喜完成第一个视频！*\n\n以下是充分利用 OpenClaw 的技巧：\n\n💾 *保存您的提示词* — 记下效果好的提示词以便重复使用\n🔄 *尝试不同类别* — 探索其他类别，找到最适合您的风格\n🔗 *分享推荐链接* — 每次朋友通过您的链接注册可获得 15% 佣金\n📊 *管理您的视频* — 使用 /videos 查看和管理所有已创建的视频\n\n尽情创作吧！ 🚀",
  },
  // ---------------------------------------------------------------------------
  // Prompt library niche buttons
  // ---------------------------------------------------------------------------
  "niche.food": {
    id: "🍔 Makanan & Minuman",
    en: "🍔 F&B",
    ru: "🍔 Еда и напитки",
    zh: "🍔 餐饮",
  },
  "niche.fashion": {
    id: "👗 Fashion",
    en: "👗 Fashion",
    ru: "👗 Мода",
    zh: "👗 时尚",
  },
  "niche.tech": {
    id: "📱 Teknologi",
    en: "📱 Tech",
    ru: "📱 Технологии",
    zh: "📱 科技",
  },
  "niche.health": {
    id: "💪 Kesehatan",
    en: "💪 Health",
    ru: "💪 Здоровье",
    zh: "💪 健康",
  },
  "niche.travel": {
    id: "✈️ Perjalanan",
    en: "✈️ Travel",
    ru: "✈️ Путешествия",
    zh: "✈️ 旅行",
  },
  "niche.education": {
    id: "📚 Pendidikan",
    en: "📚 Education",
    ru: "📚 Образование",
    zh: "📚 教育",
  },
  "niche.finance": {
    id: "💰 Keuangan",
    en: "💰 Finance",
    ru: "💰 Финансы",
    zh: "💰 金融",
  },
  "niche.entertainment": {
    id: "🎭 Hiburan",
    en: "🎭 Entertainment",
    ru: "🎭 Развлечения",
    zh: "🎭 娱乐",
  },

  // ── Pricing command ──
  "pricing.title": {
    id: "Daftar Harga",
    en: "Pricing",
    ru: "Цены",
    zh: "价格",
  },
  "pricing.per_video": {
    id: "Harga per Video",
    en: "Cost per Video",
    ru: "Стоимость видео",
    zh: "每个视频价格",
  },
  "pricing.packages": {
    id: "Paket Kredit",
    en: "Credit Packages",
    ru: "Пакеты кредитов",
    zh: "积分套餐",
  },

  // ── Template Video (Free Trial) ──
  "gen.free_trial_video": {
    id: "🎁 *Video Demo Gratis!*\n\nIni contoh video untuk niche _{niche}_. Suka hasilnya? Buat video custom milikmu sendiri!",
    en: "🎁 *Free Demo Video!*\n\nHere's a sample video for the _{niche}_ niche. Like it? Create your own custom video!",
    ru: "🎁 *Бесплатное демо-видео!*\n\nВот пример видео для ниши _{niche}_. Нравится? Создайте собственное!",
    zh: "🎁 *免费演示视频!*\n\n这是_{niche}_领域的示例视频。喜欢吗？创建你自己的视频！",
  },
  "btn.create_own": {
    id: "🎬 Buat Video Sendiri",
    en: "🎬 Create My Own",
    ru: "🎬 Создать своё",
    zh: "🎬 创建我的视频",
  },
  "gen.generating_trial": {
    id: "🎁 Membuat video demo gratis untukmu...",
    en: "🎁 Generating your free demo video...",
    ru: "🎁 Создаём бесплатное демо-видео...",
    zh: "🎁 正在为你生成免费演示视频...",
  },
  "gen.trial_queued": {
    id: "✅ Video demo sedang diproses! Kamu akan menerima notifikasi saat selesai.\n\nSuka hasilnya? Beli kredit untuk buat video custom!",
    en: "✅ Your demo video is being processed! You'll be notified when ready.\n\nLike it? Buy credits to create custom videos!",
    ru: "✅ Демо-видео обрабатывается! Мы уведомим, когда будет готово.\n\nПонравилось? Купите кредиты для создания своих видео!",
    zh: "✅ 演示视频正在处理中！准备好后会通知你。\n\n喜欢吗？购买积分创建自定义视频！",
  },
  "gen.trial_failed": {
    id: "😔 Maaf, gagal membuat video demo. Silakan coba lagi nanti.",
    en: "😔 Sorry, failed to generate demo video. Please try again later.",
    ru: "😔 Не удалось создать демо-видео. Попробуйте позже.",
    zh: "😔 抱歉，生成演示视频失败。请稍后再试。",
  },
  "delete_account.title": {
    id: "🗑️ Hapus Akun",
    en: "🗑️ Delete Account",
    ru: "🗑️ Удалить аккаунт",
    zh: "🗑️ 删除账户",
  },
  "delete_account.warning": {
    id: "⚠️ Tindakan ini tidak dapat dibatalkan. Semua data pribadi akan dihapus secara permanen.",
    en: "⚠️ This action cannot be undone. All your personal data will be permanently deleted.",
    ru: "⚠️ Это действие нельзя отменить. Все ваши личные данные будут безвозвратно удалены.",
    zh: "⚠️ 此操作无法撤销。您的所有个人数据将被永久删除。",
  },
  "delete_account.irreversible": {
    id: "🔴 Setelah akun dihapus, Anda tidak akan dapat mengaksesnya lagi.",
    en: "🔴 Once deleted, you will not be able to access your account again.",
    ru: "🔴 После удаления вы больше не сможете получить доступ к своему аккаунту.",
    zh: "🔴 账户删除后，您将无法再次访问它。",
  },
  "delete_account.data_removed": {
    id: "📁 Data yang dihapus: Nama, Username, No. HP, Kode Referral",
    en: "📁 Data to be removed: Name, Username, Phone Number, Referral Code",
    ru: "📁 Данные для удаления: Имя, Имя пользователя, Номер телефона, Реферальный код",
    zh: "📁 将删除的数据：姓名、用户名、电话号码、推荐码",
  },
  "delete_account.transaction_retention": {
    id: "📋 Catatan: Data transaksi akan disimpan selama 30 hari sebelum dihapus (wajib UU PDP).",
    en: "📋 Note: Transaction records will be retained for 30 days before deletion (UU PDP requirement).",
    ru: "📋 Примечание: Записи о транзакциях будут храниться 30 дней перед удалением (требование UU PDP).",
    zh: "📋 注意：交易记录将在删除前保留30天（UU PDP要求）。",
  },
  "delete_account.confirm_button": {
    id: "✅ Ya, Hapus Akun Saya",
    en: "✅ Yes, Delete My Account",
    ru: "✅ Да, удалить мой аккаунт",
    zh: "✅ 是的，删除我的账户",
  },
  "delete_account.cancel_button": {
    id: "❌ Batal",
    en: "❌ Cancel",
    ru: "❌ Отмена",
    zh: "❌ 取消",
  },
  "delete_account.success": {
    id: "✅ Akun Anda telah dihapus. Semua data pribadi telah dihapus.",
    en: "✅ Your account has been deleted. All personal data has been removed.",
    ru: "✅ Ваш аккаунт удалён. Все личные данные удалены.",
    zh: "✅ 您的账户已删除。所有个人数据已被移除。",
  },
  "delete_account.cancelled": {
    id: "Penghapusan akun dibatalkan.",
    en: "Account deletion cancelled.",
    ru: "Удаление аккаунта отменено.",
    zh: "账户删除已取消。",
  },
  "fingerprint.preview_title": {
    id: "🎨 Brand Fingerprint — Segera Hadir",
    en: "🎨 Brand Fingerprint — Coming Soon",
    ru: "🎨 Бренд Отпечаток — Скоро",
    zh: "🎨 品牌指纹 — 即将推出",
  },
  "fingerprint.preview_desc": {
    id: "Fitur *Brand Fingerprint* akan menganalisis gaya visual dan suara merek Anda secara otomatis, sehingga semua video Anda terasa konsisten.\n\n✨ Sementara itu, coba *Prompt Library* kami untuk menemukan prompt terbaik yang sudah dikurasi!",
    en: "The *Brand Fingerprint* feature will automatically analyze your visual style and brand voice, keeping all your videos consistent.\n\n✨ In the meantime, try our *Prompt Library* for curated prompts!",
    ru: "Функция *Отпечаток бренда* автоматически проанализирует ваш визуальный стиль и голос бренда.\n\n✨ А пока попробуйте нашу *Библиотеку промптов*!",
    zh: "*品牌指纹*功能将自动分析您的视觉风格和品牌声音。\n\n✨与此同时，试试我们的*提示词库*吧！",
  },
  "fingerprint.try_library": {
    id: "📚 Coba Prompt Library",
    en: "📚 Try Prompt Library",
    ru: "📚 Библиотека промптов",
    zh: "📚 试试提示词库",
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
  lang: Lang = "id",
  vars?: Record<string, string | number>,
): string {
  // Try exact match, then English fallback, then Indonesian fallback
  let text =
    translations[key]?.[lang] ||
    translations[key]?.["en"] ||
    translations[key]?.["id"] ||
    key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}
