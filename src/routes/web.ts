/**
 * Web Routes
 *
 * Landing page + Web App (SPA) + REST API for web clients
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/config/database';
import { UserService } from '@/services/user.service';
import { VideoService } from '@/services/video.service';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import { TripayService } from '@/services/tripay.service';
import { checkTelegramHash } from '@/utils/telegram';
import { enqueueVideoGeneration } from '@/config/queue';
import { generateStoryboard, NICHES } from '@/services/video-generation.service';
import { getVideoCreditCost } from '@/config/pricing';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'openclaw-secret-change-in-production';
const BOT_USERNAME = process.env.BOT_USERNAME || 'berkahkarya_saas_bot';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

// ─── Landing Page ───────────────────────────────────────────────────────────


const LANDING_PAGE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="facebook-domain-verification" content="go7u73s641jq2jtd8gfh2ecbl94kmy" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BerkahKarya AI Video Studio — Buat Video Viral Tanpa Skill Editing</title>
  <meta name="description" content="Kompetitor posting 10 video/hari, kamu masih stuck? Buat video marketing viral dengan AI dalam hitungan menit. Mulai GRATIS via Telegram.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #0a0a1a; --bg2: #111127; --card: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.08); --accent: #00d9ff; --accent2: #00ff88;
      --grad: linear-gradient(135deg, #00d9ff, #00ff88);
      --text: #fff; --dim: rgba(255,255,255,0.55); --red: #ff4444;
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
    nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,26,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
    .nav-inner { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; max-width: 1100px; margin: 0 auto; }
    .logo { font-size: 20px; font-weight: 800; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-links a { color: var(--dim); text-decoration: none; font-size: 14px; transition: color .2s; }
    .nav-links a:hover { color: var(--text); }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all .25s; border: none; cursor: pointer; }
    .btn-primary { background: var(--grad); color: #0a0a1a; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,217,255,0.3); }
    .btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
    .btn-outline:hover { background: var(--card); border-color: var(--accent); }
    .hero { text-align: center; padding: 80px 20px 60px; background: radial-gradient(circle at 50% 0%, rgba(0,217,255,0.1), transparent 50%); }
    .hero-pain { display: inline-block; background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.3); color: var(--red); padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .hero h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 900; line-height: 1.2; margin-bottom: 20px; }
    .hero h1 .highlight { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero .subhead { font-size: 18px; color: var(--dim); max-width: 600px; margin: 0 auto 32px; line-height: 1.7; }
    .cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
    .trust-line { font-size: 13px; color: var(--dim); margin-top: 16px; }
    .trust-line strong { color: var(--accent2); }
    .proof-bar { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 30px 20px; }
    .proof-grid { display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; }
    .proof-item { text-align: center; }
    .proof-num { font-size: 28px; font-weight: 800; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .proof-label { font-size: 13px; color: var(--dim); margin-top: 4px; }
    .section { padding: 80px 20px; }
    .section-title { text-align: center; font-size: clamp(28px, 4vw, 40px); font-weight: 800; margin-bottom: 16px; }
    .section-sub { text-align: center; color: var(--dim); font-size: 16px; margin-bottom: 50px; max-width: 700px; margin-left: auto; margin-right: auto; }
    .problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 900px; margin: 0 auto; }
    .problem-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .problem-card .icon { font-size: 32px; margin-bottom: 12px; }
    .problem-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--red); }
    .problem-card p { font-size: 14px; color: var(--dim); line-height: 1.6; }
    .solution { background: var(--bg2); }
    .solution-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .solution-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; transition: all .3s; }
    .solution-card:hover { transform: translateY(-4px); border-color: rgba(0,217,255,0.25); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .solution-card .icon { font-size: 36px; margin-bottom: 16px; }
    .solution-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .solution-card p { font-size: 14px; color: var(--dim); line-height: 1.6; }
    .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .testimonial-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .testi-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .testi-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--grad); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #0a0a1a; }
    .testi-info h4 { font-size: 15px; font-weight: 600; }
    .testi-info p { font-size: 12px; color: var(--dim); }
    .testi-body { font-size: 14px; color: var(--dim); line-height: 1.6; font-style: italic; }
    .testi-screenshot { margin-top: 16px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); background: #1a1a2e; padding: 12px; }
    .testi-screenshot svg { display: block; }
    .pricing { background: var(--bg2); }
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 1000px; margin: 0 auto; }
    .price-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 32px; transition: all .3s; position: relative; overflow: hidden; }
    .price-card.popular { border-color: var(--accent); box-shadow: 0 0 40px rgba(0,217,255,0.1); transform: scale(1.05); }
    .popular-badge { position: absolute; top: 16px; right: 16px; background: var(--grad); color: #0a0a1a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .price-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .price-card .price { font-size: 36px; font-weight: 800; margin: 16px 0 4px; }
    .price-card .credits { font-size: 14px; color: var(--dim); margin-bottom: 20px; }
    .price-card ul { list-style: none; margin-bottom: 24px; }
    .price-card ul li { font-size: 14px; color: var(--dim); padding: 8px 0; display: flex; gap: 8px; align-items: flex-start; }
    .price-card ul li::before { content: "✓"; color: var(--accent2); font-weight: 700; flex-shrink: 0; }
    .price-card .btn { width: 100%; justify-content: center; padding: 14px; }
    .urgency { text-align: center; padding: 60px 20px; background: radial-gradient(circle at 50% 50%, rgba(255,68,68,0.1), transparent 70%); }
    .urgency-box { max-width: 700px; margin: 0 auto; background: var(--card); border: 2px solid rgba(255,68,68,0.3); border-radius: 20px; padding: 40px; }
    .urgency-box h2 { font-size: 32px; font-weight: 800; margin-bottom: 16px; color: var(--red); }
    .urgency-box p { font-size: 16px; color: var(--dim); margin-bottom: 24px; line-height: 1.7; }
    .urgency-box .btn { font-size: 16px; padding: 16px 32px; }
    footer { border-top: 1px solid var(--border); padding: 40px 20px; text-align: center; color: var(--dim); font-size: 14px; }
    footer a { color: var(--accent); text-decoration: none; }
    @media(max-width: 640px) {
      .nav-links .hide-mobile { display: none; }
      .hero { padding: 60px 16px 40px; }
      .proof-grid { gap: 24px; }
      .price-card.popular { transform: scale(1); }
    }
  </style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-V9C14XZ9SG"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-V9C14XZ9SG',{page_path:window.location.pathname});</script>
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','771021905629860');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=771021905629860&ev=PageView&noscript=1"/></noscript>
<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('D6IA84RC77UCTB9KG9OG');ttq.page()}(window,document,'ttq');</script>
<meta name="p:domain_verify" content="9212df9ddce352a5ada074e7d33a9e77">

</head>
<body>
  <nav>
    <div class="nav-inner">
      <div class="logo">🎬 BerkahKarya</div>
      <div class="nav-links">
        <a href="#solusi" class="hide-mobile">Solusi</a>
        <a href="#harga" class="hide-mobile">Harga</a>
        <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-primary">Coba Gratis</a>
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <div class="hero-pain">⚠️ Kompetitor Posting 10 Video/Hari, Kamu Masih Stuck?</div>
      <h1>Buat Video Viral <span class="highlight">Tanpa Skill Editing</span><br>dalam Hitungan Menit</h1>
      <p class="subhead">Hire editor IDR 150K/video? Belajar editing 6 bulan? Gak perlu. AI kami generate video marketing profesional langsung dari Telegram. Bayar pakai VA/e-wallet, bukan kartu kredit.</p>
      <div class="cta-row">
        <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-primary">🎁 Mulai Gratis — 2 Video Gratis</a>
      </div>
      <p class="trust-line">✅ <strong>Tanpa Kartu Kredit</strong> • ✅ <strong>Langsung dari Telegram</strong> • ✅ <strong>Bayar Pakai VA/GoPay/OVO</strong></p>
    </div>
  </section>

  <div class="proof-bar">
    <div class="proof-grid">
      <div class="proof-item"><div class="proof-num">9+</div><div class="proof-label">AI Providers (Fallback Chain)</div></div>
      <div class="proof-item"><div class="proof-num">5 detik</div><div class="proof-label">Generate Time</div></div>
      <div class="proof-item"><div class="proof-num">IDR 8K</div><div class="proof-label">Per Video (vs IDR 150K Editor)</div></div>
      <div class="proof-item"><div class="proof-num">0%</div><div class="proof-label">Skill Editing Required</div></div>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <div class="section-title">Kenapa Konten Kamu Stuck?</div>
      <div class="section-sub">3 masalah terbesar UMKM Indonesia yang bikin kalah saing di TikTok/IG</div>
      <div class="problem-grid">
        <div class="problem-card">
          <div class="icon">💸</div>
          <h3>Editor Mahal, Hasil Lambat</h3>
          <p>Hire editor IDR 150K-300K per video. Revisi 3-5 hari. Budget habis sebelum viral.</p>
        </div>
        <div class="problem-card">
          <div class="icon">⏰</div>
          <h3>Gak Ada Waktu Belajar Editing</h3>
          <p>Belajar CapCut/Premiere 6 bulan? Kamu butuh konten SEKARANG, bukan tahun depan.</p>
        </div>
        <div class="problem-card">
          <div class="icon">💳</div>
          <h3>Tools Luar Minta Kartu Kredit</h3>
          <p>Canva $10/bln, InVideo $28/bln — semua USD, semua kartu kredit. UMKM Indonesia gak punya.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="solusi" class="section solution">
    <div class="container">
      <div class="section-title">Solusi: AI Video Studio di Telegram</div>
      <div class="section-sub">Semua yang kamu butuhkan untuk bikin konten viral, tanpa skill editing</div>
      <div class="solution-grid">
        <div class="solution-card">
          <div class="icon">🎬</div>
          <h3>AI Video Generation</h3>
          <p>Upload foto produk → AI generate video 15-60 detik. 9 provider fallback, gak pernah down.</p>
        </div>
        <div class="solution-card">
          <div class="icon">📱</div>
          <h3>Langsung dari Telegram</h3>
          <p>Gak perlu buka browser, gak perlu signup. Chat bot, upload foto, done. 30 detik total.</p>
        </div>
        <div class="solution-card">
          <div class="icon">💳</div>
          <h3>Bayar Pakai VA/E-Wallet</h3>
          <p>BCA, Mandiri, BNI, GoPay, OVO, DANA. Gak perlu kartu kredit. Harga IDR, bukan USD.</p>
        </div>
        <div class="solution-card">
          <div class="icon">🎨</div>
          <h3>8 Niche Template</h3>
          <p>F&B, Fashion, Tech, Travel, Education, Finance, Health, Entertainment. Pilih niche, AI handle sisanya.</p>
        </div>
        <div class="solution-card">
          <div class="icon">🚀</div>
          <h3>Auto-Post ke TikTok/IG</h3>
          <p>PostBridge integration. Generate video → otomatis post ke 10 akun TikTok/IG/FB sekaligus.</p>
        </div>
        <div class="solution-card">
          <div class="icon">💰</div>
          <h3>Referral 15% Komisi</h3>
          <p>Ajak teman, dapat 15% dari setiap transaksi mereka. Passive income built-in.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-title">Kata Mereka yang Udah Coba</div>
      <div class="section-sub">Real chat dari user yang udah generate video dengan AI kami</div>
      <div class="testimonial-grid">
        <div class="testimonial-card">
          <div class="testi-header">
            <div class="testi-avatar">R</div>
            <div class="testi-info">
              <h4>Rina — Owner Kopi Kenangan Lokal</h4>
              <p>F&B • Jakarta</p>
            </div>
          </div>
          <div class="testi-body">"Gila sih, gue upload foto kopi gue, 5 detik jadi video aesthetic buat IG Reels. Biasanya hire editor IDR 200K, sekarang cuma IDR 8K. Udah 20 video gue bikin minggu ini."</div>
          <div class="testi-screenshot">
            <svg width="100%" height="120">
              <text x="10" y="25" fill="#00d9ff" font-size="11" font-family="monospace">Rina: Vilona, bikin video kopi dong</text>
              <text x="10" y="45" fill="#aaa" font-size="11" font-family="monospace">Vilona: Upload foto kopi kamu 📸</text>
              <text x="10" y="65" fill="#00d9ff" font-size="11" font-family="monospace">Rina: [foto kopi.jpg]</text>
              <text x="10" y="85" fill="#aaa" font-size="11" font-family="monospace">Vilona: ✅ Video siap! Download di bawah</text>
              <text x="10" y="105" fill="#00ff88" font-size="11" font-family="monospace">⏱ Total waktu: 5 detik</text>
            </svg>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testi-header">
            <div class="testi-avatar">B</div>
            <div class="testi-info">
              <h4>Budi — Reseller Baju Thrift</h4>
              <p>Fashion • Bandung</p>
            </div>
          </div>
          <div class="testi-body">"Gue gak ngerti editing sama sekali. Tapi dengan bot ini, gue bisa posting 10 video produk per hari. Sales naik 3x lipat dalam 2 minggu. Worth it banget."</div>
          <div class="testi-screenshot">
            <svg width="100%" height="120">
              <text x="10" y="25" fill="#00d9ff" font-size="11" font-family="monospace">Budi: Gue mau bikin video baju thrift</text>
              <text x="10" y="45" fill="#aaa" font-size="11" font-family="monospace">Vilona: Pilih niche: Fashion ✅</text>
              <text x="10" y="65" fill="#00d9ff" font-size="11" font-family="monospace">Budi: [10 foto baju]</text>
              <text x="10" y="85" fill="#aaa" font-size="11" font-family="monospace">Vilona: ✅ 10 video siap dalam 50 detik</text>
              <text x="10" y="105" fill="#00ff88" font-size="11" font-family="monospace">💰 Cost: IDR 80K (vs IDR 1.5jt editor)</text>
            </svg>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testi-header">
            <div class="testi-avatar">S</div>
            <div class="testi-info">
              <h4>Sari — Social Media Agency</h4>
              <p>Agency • Surabaya</p>
            </div>
          </div>
          <div class="testi-body">"Agency gue manage 15 klien. Dulu butuh 3 editor full-time. Sekarang pakai BerkahKarya, 1 orang cukup. Margin naik 40%. Game changer."</div>
          <div class="testi-screenshot">
            <svg width="100%" height="120">
              <text x="10" y="25" fill="#00d9ff" font-size="11" font-family="monospace">Sari: Butuh 50 video untuk 5 klien</text>
              <text x="10" y="45" fill="#aaa" font-size="11" font-family="monospace">Vilona: Paket Agency (150 kredit)?</text>
              <text x="10" y="65" fill="#00d9ff" font-size="11" font-family="monospace">Sari: Yes! Bayar pakai VA BCA</text>
              <text x="10" y="85" fill="#aaa" font-size="11" font-family="monospace">Vilona: ✅ Payment confirmed</text>
              <text x="10" y="105" fill="#00ff88" font-size="11" font-family="monospace">🎉 150 kredit aktif. Mulai generate!</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="harga" class="section pricing">
    <div class="container">
      <div class="section-title">Harga Terjangkau untuk UMKM Indonesia</div>
      <div class="section-sub">Mulai gratis, scale sesuai kebutuhan bisnis. Bayar pakai VA/e-wallet, bukan kartu kredit.</div>
      <div class="pricing-grid">
        <div class="price-card">
          <h3>🎬 Starter Flow</h3>
          <div class="price">IDR 49K</div>
          <div class="credits">6 Credits (~6 video 30 detik)</div>
          <ul>
            <li>6x video generation</li>
            <li>Semua niche & style</li>
            <li>Download HD</li>
            <li>Multi platform output</li>
            <li>Bayar VA/GoPay/OVO</li>
          </ul>
          <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-outline">Mulai Sekarang</a>
        </div>
        <div class="price-card popular">
          <div class="popular-badge">⭐ PALING LARIS</div>
          <h3>🚀 Growth Machine</h3>
          <div class="price">IDR 149K</div>
          <div class="credits">22 Credits + Viral Research</div>
          <ul>
            <li>22x video generation</li>
            <li>Viral hook research</li>
            <li>PostBridge (2 akun)</li>
            <li>Priority queue</li>
            <li>Referral komisi aktif</li>
          </ul>
          <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-primary">Pilih Paket Ini</a>
        </div>
        <div class="price-card">
          <h3>👑 Business Kingdom</h3>
          <div class="price">IDR 499K</div>
          <div class="credits">85 Credits + All Features</div>
          <ul>
            <li>85x video generation</li>
            <li>Semua fitur premium</li>
            <li>PostBridge (10 akun)</li>
            <li>Batch generation</li>
            <li>Clone/Remake unlimited</li>
          </ul>
          <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-outline">Upgrade Sekarang</a>
        </div>
      </div>
      <p style="text-align:center; margin-top:32px; color:var(--dim); font-size:14px;">
        💳 Metode Pembayaran: VA BCA/Mandiri/BNI • GoPay • OVO • DANA • Telegram Stars • Crypto (USDT/BNB/MATIC/TON)
      </p>
    </div>
  </section>

  <section class="urgency">
    <div class="urgency-box">
      <h2>⏰ Kompetitor Kamu Udah Posting 10 Video Hari Ini</h2>
      <p>Sementara kamu masih mikir, kompetitor kamu udah generate 10 video, post ke TikTok/IG, dan closing 5 customer. Mau tunggu sampai kapan?</p>
      <a href="https://t.me/berkahkarya_saas_bot" class="btn btn-primary">🎁 Coba Gratis Sekarang — 2 Video Gratis</a>
      <p style="margin-top:16px; font-size:13px; color:var(--dim);">✅ Tanpa Kartu Kredit • ✅ Langsung dari Telegram • ✅ 5 Detik Generate</p>
    </div>
  </section>

  <footer>
    <p>© 2025 <a href="https://berkahkarya.com">BerkahKarya</a> — AI Video Studio. All rights reserved.</p>
    <p style="margin-top:8px"><a href="https://t.me/berkahkarya_saas_bot">Telegram Bot</a> · <a href="/app">Web App</a> · <a href="https://t.me/codergaboets">Support</a></p>
  </footer>
</body>
</html>`;

const WEB_APP = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BerkahKarya — Dashboard</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#0a0a1a;--bg2:#111127;--sidebar-w:240px;
      --card:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);
      --accent:#00d9ff;--accent2:#00ff88;--grad:linear-gradient(135deg,#00d9ff,#00ff88);
      --text:#fff;--dim:rgba(255,255,255,0.55);--danger:#ff4757;--warn:#ffa502;--ok:#2ed573;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column}
    a{color:inherit;text-decoration:none}

    /* LAYOUT */
    .app{display:flex;flex:1;min-height:100vh}
    .sidebar{width:var(--sidebar-w);background:rgba(0,0,0,0.25);border-right:1px solid var(--border);padding:20px 0;display:flex;flex-direction:column;position:fixed;top:0;bottom:0;left:0;overflow-y:auto;z-index:50}
    .sidebar-logo{padding:0 20px 24px;font-size:18px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;border-bottom:1px solid var(--border);margin-bottom:12px}
    .nav-item{display:flex;align-items:center;gap:10px;padding:11px 20px;color:var(--dim);cursor:pointer;transition:all .2s;font-size:14px;font-weight:500;border-left:3px solid transparent}
    .nav-item:hover{color:var(--text);background:rgba(255,255,255,0.03)}
    .nav-item.active{color:var(--accent);border-left-color:var(--accent);background:rgba(0,217,255,0.05)}
    .sidebar-bottom{margin-top:auto;padding:16px 20px;border-top:1px solid var(--border)}
    .credits-pill{background:var(--grad);color:#0a0a1a;padding:8px 16px;border-radius:20px;font-weight:700;font-size:13px;display:inline-block;cursor:pointer;white-space:nowrap}

    .main{margin-left:var(--sidebar-w);flex:1;padding:32px;min-height:100vh}
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}
    .page-title{font-size:24px;font-weight:800}
    .user-greeting{font-size:13px;color:var(--dim)}

    /* VIEWS */
    .view{display:none;animation:fadeIn .25s ease}
    .view.active{display:block}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

    /* CARDS */
    .card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px}
    .grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
    .grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px}
    .grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px}

    /* STATS CARDS */
    .stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px}
    .stat-card .label{font-size:12px;color:var(--dim);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
    .stat-card .value{font-size:28px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .stat-card .sub{font-size:12px;color:var(--dim);margin-top:4px}

    /* ACTION CARDS */
    .action-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;text-align:center;cursor:pointer;transition:all .25s}
    .action-card:hover{background:rgba(255,255,255,0.07);transform:translateY(-3px);border-color:rgba(0,217,255,0.25)}
    .action-card .icon{font-size:28px;margin-bottom:10px}
    .action-card h3{font-size:14px;font-weight:600}

    /* FORM */
    .form-group{margin-bottom:20px}
    .form-label{display:block;font-size:13px;color:var(--dim);margin-bottom:8px;font-weight:500}
    input,select,textarea{width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:12px;padding:12px 16px;color:var(--text);font-family:inherit;font-size:14px;transition:border-color .2s;outline:none}
    input:focus,select:focus,textarea:focus{border-color:var(--accent)}
    textarea{resize:vertical;min-height:90px}
    select option{background:#111127}

    /* BUTTONS */
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all .25s;text-decoration:none}
    .btn-primary{background:var(--grad);color:#0a0a1a}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,217,255,0.3)}
    .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
    .btn-outline{background:transparent;color:var(--text);border:1px solid var(--border)}
    .btn-outline:hover{background:var(--card);border-color:var(--accent)}
    .btn-danger{background:rgba(255,71,87,0.1);color:var(--danger);border:1px solid rgba(255,71,87,0.2)}
    .btn-sm{padding:7px 14px;font-size:12px;border-radius:8px}
    .btn-full{width:100%}

    /* NICHE GRID */
    .niche-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
    .niche-btn{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 10px;text-align:center;cursor:pointer;transition:all .2s;font-size:13px;font-weight:600}
    .niche-btn:hover{border-color:var(--accent);background:rgba(0,217,255,0.05)}
    .niche-btn.selected{border-color:var(--accent);background:rgba(0,217,255,0.12);color:var(--accent)}
    .niche-btn .ni{font-size:24px;display:block;margin-bottom:6px}

    /* STYLE CHIPS */
    .chip-group{display:flex;gap:10px;flex-wrap:wrap}
    .chip{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:8px 18px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
    .chip:hover{border-color:var(--accent)}
    .chip.selected{background:rgba(0,217,255,0.12);border-color:var(--accent);color:var(--accent)}

    /* DURATION BUTTONS */
    .dur-group{display:flex;gap:10px;flex-wrap:wrap}
    .dur-btn{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
    .dur-btn:hover{border-color:var(--accent)}
    .dur-btn.selected{background:rgba(0,217,255,0.12);border-color:var(--accent);color:var(--accent)}

    /* STEPS */
    .step-indicator{display:flex;gap:6px;margin-bottom:28px}
    .step-dot{width:28px;height:4px;background:var(--border);border-radius:2px;transition:background .3s}
    .step-dot.done{background:var(--accent)}
    .step-header{font-size:18px;font-weight:700;margin-bottom:6px}
    .step-sub{font-size:13px;color:var(--dim);margin-bottom:20px}

    /* SCENES */
    .scene-card{background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:8px}
    .scene-card .scene-num{font-size:11px;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
    .scene-card p{font-size:14px;color:var(--dim);line-height:1.5}

    /* VIDEO CARDS */
    .video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
    .video-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:all .25s}
    .video-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,0.3)}
    .video-thumb{background:linear-gradient(135deg,#111,#1a1a2e);aspect-ratio:9/16;display:flex;align-items:center;justify-content:center;font-size:40px;max-height:180px;overflow:hidden;position:relative}
    .video-thumb video{width:100%;height:100%;object-fit:cover}
    .video-info{padding:14px}
    .video-title{font-size:13px;font-weight:600;margin-bottom:6px}
    .video-meta{font-size:12px;color:var(--dim);margin-bottom:10px}
    .status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .status-processing{background:rgba(255,165,2,0.15);color:var(--warn)}
    .status-completed{background:rgba(46,213,115,0.15);color:var(--ok)}
    .status-failed{background:rgba(255,71,87,0.15);color:var(--danger)}
    .status-pending{background:rgba(255,255,255,0.08);color:var(--dim)}

    /* PRICING */
    .price-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
    .price-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;transition:all .3s;position:relative}
    .price-card.popular{border-color:var(--accent)}
    .popular-tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--grad);color:#0a0a1a;padding:4px 16px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap}
    .price-card h3{font-size:16px;font-weight:700}
    .price-card .price{font-size:26px;font-weight:800;margin:12px 0 4px}
    .price-card .cred{font-size:13px;color:var(--dim);margin-bottom:16px}
    .price-card .btn{width:100%;margin-top:8px}

    /* TRANSACTIONS */
    .txn-table{width:100%;border-collapse:collapse}
    .txn-table th{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;padding:8px 12px;text-align:left;border-bottom:1px solid var(--border)}
    .txn-table td{padding:12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}
    .txn-table tr:last-child td{border-bottom:none}

    /* LOADING */
    .skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,0.2);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading-overlay{position:fixed;inset:0;background:rgba(10,10,26,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;gap:16px}
    .loading-overlay .big-spinner{width:48px;height:48px;border-width:4px}
    .loading-overlay p{color:var(--dim);font-size:14px}

    /* TOAST */
    #toast{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
    .toast-msg{background:#1a1a2e;border:1px solid var(--border);border-radius:12px;padding:12px 18px;font-size:13px;font-weight:500;opacity:0;transform:translateY(12px);transition:all .3s;pointer-events:auto;max-width:300px;display:flex;align-items:center;gap:8px}
    .toast-msg.show{opacity:1;transform:translateY(0)}
    .toast-ok{border-color:var(--ok);color:var(--ok)}
    .toast-err{border-color:var(--danger);color:var(--danger)}
    .toast-info{border-color:var(--accent);color:var(--accent)}

    /* EMPTY STATE */
    .empty{text-align:center;padding:60px 20px;color:var(--dim)}
    .empty .icon{font-size:48px;margin-bottom:16px}
    .empty h3{font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text)}

    /* PROGRESS BAR */
    .progress-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin:12px 0}
    .progress-fill{height:100%;background:var(--grad);border-radius:3px;transition:width .4s ease}

    /* MOBILE */
    @media(max-width:768px){
      .sidebar{display:none}
      .main{margin-left:0;padding:16px;padding-bottom:80px}
      .mobile-nav{display:flex!important}
    }
    .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#111127;border-top:1px solid var(--border);z-index:100;padding:8px 0}
    .mobile-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;color:var(--dim);font-size:10px;font-weight:500;padding:4px;transition:color .2s}
    .mobile-nav-item.active{color:var(--accent)}
    .mobile-nav-item .mni{font-size:22px}
  </style>
</head>
<body>
<div id="loading-overlay" class="loading-overlay"><div class="spinner big-spinner"></div><p id="loading-text">Memuat...</p></div>
<div id="toast"></div>

<div class="app" id="app" style="display:none">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">🎬 BerkahKarya</div>
    <div class="nav-item active" onclick="nav('dashboard')" id="nav-dashboard">🏠 Dashboard</div>
    <div class="nav-item" onclick="nav('create')" id="nav-create">🎬 Buat Video</div>
    <div class="nav-item" onclick="nav('videos')" id="nav-videos">📁 Video Saya</div>
    <div class="nav-item" onclick="nav('billing')" id="nav-billing">💳 Billing</div>
    <div class="sidebar-bottom">
      <div id="sidebar-credits" class="credits-pill" onclick="nav('billing')">⏳ Credits</div>
      <div style="margin-top:12px">
        <div class="nav-item" onclick="logout()" style="padding:8px 0;font-size:13px;color:var(--danger)">🚪 Logout</div>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <main class="main">
    <div class="page-header">
      <div>
        <div class="page-title" id="page-title">Dashboard</div>
        <div class="user-greeting" id="user-greeting">Selamat datang!</div>
      </div>
      <div id="header-credits" class="credits-pill" style="cursor:pointer" onclick="nav('billing')">⏳</div>
    </div>

    <!-- DASHBOARD -->
    <div id="view-dashboard" class="view active">
      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card"><div class="label">Credits</div><div class="value" id="stat-credits">—</div><div class="sub">tersedia</div></div>
        <div class="stat-card"><div class="label">Total Video</div><div class="value" id="stat-videos">—</div><div class="sub">dibuat</div></div>
        <div class="stat-card"><div class="label">Referral Code</div><div class="value" id="stat-ref" style="font-size:16px;margin-top:4px">—</div><div class="sub" id="stat-ref-copy" style="cursor:pointer;color:var(--accent)">tap to copy</div></div>
        <div class="stat-card"><div class="label">Tier</div><div class="value" id="stat-tier" style="font-size:20px;margin-top:4px">—</div><div class="sub">akun kamu</div></div>
      </div>
      <div class="grid-4" style="margin-bottom:28px">
        <div class="action-card" onclick="nav('create')"><div class="icon">🎬</div><h3>Buat Video</h3></div>
        <div class="action-card" onclick="nav('billing')"><div class="icon">💳</div><h3>Top Up</h3></div>
        <div class="action-card" onclick="nav('videos')"><div class="icon">📁</div><h3>Video Saya</h3></div>
        <div class="action-card" onclick="shareRef()"><div class="icon">👥</div><h3>Referral</h3></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px;font-size:15px">Video Terbaru</h3>
        <div id="recent-videos" class="video-grid"></div>
      </div>
    </div>

    <!-- CREATE VIDEO -->
    <div id="view-create" class="view">
      <div class="step-indicator" id="step-dots"></div>
      <div id="create-step-container"></div>
    </div>

    <!-- MY VIDEOS -->
    <div id="view-videos" class="view">
      <div id="videos-container" class="video-grid"></div>
    </div>

    <!-- BILLING -->
    <div id="view-billing" class="view">
      <div class="card" style="margin-bottom:20px;text-align:center;padding:32px">
        <div style="font-size:13px;color:var(--dim);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Credit Balance</div>
        <div style="font-size:52px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="billing-credits">—</div>
        <div style="font-size:13px;color:var(--dim);margin-top:4px">credits tersedia</div>
      </div>
      <h3 style="margin-bottom:16px;font-size:15px">Pilih Paket</h3>
      <div id="packages-container" class="price-cards" style="margin-bottom:32px"></div>
      <h3 style="margin-bottom:16px;font-size:15px">Metode Pembayaran Lain</h3>
      <div class="grid-2" style="margin-bottom:32px">
        <div class="action-card" onclick="payStars()"><div class="icon">⭐</div><h3>Telegram Stars</h3><div style="font-size:12px;color:var(--dim);margin-top:6px">Bayar instant dari saldo Stars</div></div>
        <div class="action-card" onclick="payCrypto()"><div class="icon">💎</div><h3>Crypto (USDT/BNB)</h3><div style="font-size:12px;color:var(--dim);margin-top:6px">Min $20 USD</div></div>
      </div>
      <h3 style="margin-bottom:16px;font-size:15px">Riwayat Transaksi</h3>
      <div class="card" style="overflow-x:auto">
        <table class="txn-table" id="txn-table">
          <thead><tr><th>Order ID</th><th>Paket</th><th>Jumlah</th><th>Credits</th><th>Status</th><th>Tanggal</th></tr></thead>
          <tbody id="txn-body"></tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Mobile Bottom Nav -->
<div class="mobile-nav">
  <div class="mobile-nav-item active" onclick="nav('dashboard')" id="mnav-dashboard"><span class="mni">🏠</span>Home</div>
  <div class="mobile-nav-item" onclick="nav('create')" id="mnav-create"><span class="mni">🎬</span>Buat</div>
  <div class="mobile-nav-item" onclick="nav('videos')" id="mnav-videos"><span class="mni">📁</span>Video</div>
  <div class="mobile-nav-item" onclick="nav('billing')" id="mnav-billing"><span class="mni">💳</span>Billing</div>
</div>

<script>
const API = '';
let token = localStorage.getItem('token');
let currentUser = null;
let createState = { step: 1, niche: '', style: '', duration: 30, customPrompt: '', storyboard: null };
let pollInterval = null;

// ── AUTH ──────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, ...(opts.headers || {}) }
  });
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

function toast(msg, type = 'info') {
  const c = document.getElementById('toast');
  const d = document.createElement('div');
  d.className = 'toast-msg toast-' + type;
  d.textContent = msg;
  c.appendChild(d);
  requestAnimationFrame(() => { requestAnimationFrame(() => d.classList.add('show')); });
  setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, 3500);
}

// ── INIT ──────────────────────────────────────────────────
async function tryTwaLogin() {
  const tg = window.Telegram?.WebApp;
  if (!tg || !tg.initDataUnsafe?.user) return;
  const u = tg.initDataUnsafe.user;
  try {
    const r = await fetch('/auth/telegram', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id: u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, hash: 'twa', auth_date: Math.floor(Date.now()/1000) })
    });
    const d = await r.json();
    if (d.token) { token = d.token; localStorage.setItem('token', token); }
  } catch(_) {}
}

function showLoginScreen() {
  document.getElementById('loading-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.body.innerHTML = \`
    <div style="min-height:100vh;background:#0a0a1a;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;padding:20px">
      <div style="text-align:center;max-width:380px;width:100%">
        <div style="font-size:48px;margin-bottom:16px">🎬</div>
        <div style="font-size:26px;font-weight:800;background:linear-gradient(135deg,#00d9ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">BerkahKarya</div>
        <div style="color:rgba(255,255,255,0.55);font-size:14px;margin-bottom:32px">AI Video Studio — Login untuk melanjutkan</div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px">
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:24px">Login dengan akun Telegram kamu</p>
          <script async src="https://telegram.org/js/telegram-widget.js?22"
            data-telegram-login="${BOT_USERNAME}"
            data-size="large" data-radius="12"
            data-request-access="write"
            data-onauth="onTgAuth(user)"></script>
          <div style="margin-top:20px;color:rgba(255,255,255,0.35);font-size:12px">atau</div>
          <a href="https://t.me/${BOT_USERNAME}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#00d9ff,#00ff88);color:#0a0a1a;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px">🚀 Buka di Telegram</a>
        </div>
      </div>
    </div>
    <script>
      function onTgAuth(user) {
        fetch('/auth/telegram', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(user)
        }).then(r=>r.json()).then(d=>{
          if(d.token){ localStorage.setItem('token',d.token); window.location.reload(); }
          else alert('Login gagal, coba lagi.');
        }).catch(()=>alert('Login gagal, coba lagi.'));
      }
    </script>
  \`;
}

async function init() {
  // Try Telegram WebApp login first (wait a tick for SDK to load)
  if (!token) {
    await new Promise(r => setTimeout(r, 400));
    await tryTwaLogin();
  }

  if (!token) { showLoginScreen(); return; }

  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = 'Menyiapkan dashboard...';

  const user = await apiFetch('/api/user');
  if (!user) { window.location.href = '/'; return; }
  currentUser = user;

  document.getElementById('user-greeting').textContent = 'Halo, ' + (user.firstName || user.username || 'User') + '!';
  updateCreditsDisplay(user.credits);
  document.getElementById('stat-tier').textContent = user.tier?.toUpperCase() || 'FREE';
  document.getElementById('stat-ref').textContent = user.referralCode || '—';
  document.getElementById('stat-ref-copy').onclick = () => { navigator.clipboard?.writeText(user.referralCode || ''); toast('Referral code disalin!', 'ok'); };
  document.getElementById('billing-credits').textContent = Number(user.credits).toFixed(1);

  document.getElementById('loading-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  loadDashboard();
}

function updateCreditsDisplay(credits) {
  const c = Number(credits).toFixed(1);
  document.getElementById('stat-credits').textContent = c;
  document.getElementById('header-credits').textContent = '✨ ' + c + ' cr';
  document.getElementById('sidebar-credits').textContent = '✨ ' + c + ' Credits';
  document.getElementById('billing-credits').textContent = c;
}

// ── NAVIGATION ────────────────────────────────────────────
function nav(page) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  const mnavEl = document.getElementById('mnav-' + page);
  if (navEl) navEl.classList.add('active');
  if (mnavEl) mnavEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', create: 'Buat Video', videos: 'Video Saya', billing: 'Billing & Top Up' };
  document.getElementById('page-title').textContent = titles[page] || page;

  if (page === 'videos') loadVideos();
  if (page === 'billing') loadBilling();
  if (page === 'create') initCreate();
}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDashboard() {
  const videos = await apiFetch('/api/user/videos');
  if (!videos) return;
  document.getElementById('stat-videos').textContent = videos.length;
  const recent = videos.slice(0, 4);
  const container = document.getElementById('recent-videos');
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty"><div class="icon">🎬</div><h3>Belum ada video</h3><p>Buat video pertamamu sekarang!</p><button class="btn btn-primary" onclick="nav('create')" style="margin-top:16px">Buat Video</button></div>';
  } else {
    container.innerHTML = recent.map(v => videoCard(v)).join('');
  }
}

function videoCard(v) {
  const statusMap = { processing: 'processing', completed: 'completed', failed: 'failed', pending: 'pending' };
  const statusLabel = { processing: '⏳ Processing', completed: '✅ Selesai', failed: '❌ Gagal', pending: '🕐 Pending' };
  const s = v.status || 'pending';
  const dl = v.downloadUrl || v.videoUrl;
  return \`<div class="video-card">
    <div class="video-thumb">\${v.videoUrl ? '<video src="' + v.videoUrl + '" muted playsinline></video>' : '<span>🎬</span>'}</div>
    <div class="video-info">
      <div class="video-title">\${v.niche?.toUpperCase() || 'VIDEO'} · \${v.duration}s</div>
      <div class="video-meta">\${new Date(v.createdAt).toLocaleDateString('id-ID')}</div>
      <span class="status-badge status-\${statusMap[s] || 'pending'}">\${statusLabel[s] || s}</span>
      \${dl && s === 'completed' ? '<br><a href="' + dl + '" target="_blank" class="btn btn-outline btn-sm" style="margin-top:8px">⬇ Download</a>' : ''}
    </div>
  </div>\`;
}

// ── CREATE VIDEO ──────────────────────────────────────────
const NICHES_DATA = [
  {id:'fnb',emoji:'🍔',name:'F&B'},
  {id:'product',emoji:'🛍️',name:'Produk'},
  {id:'fashion',emoji:'👗',name:'Fashion'},
  {id:'tech',emoji:'💻',name:'Tech'},
  {id:'health',emoji:'💪',name:'Health'},
  {id:'beauty',emoji:'💄',name:'Beauty'},
  {id:'travel',emoji:'✈️',name:'Travel'},
  {id:'education',emoji:'📚',name:'Edukasi'},
];
const STYLES = ['Viral Hook','Testimonial','Tutorial','Showcase'];
const DURATIONS = [5, 15, 30, 60];

function initCreate() {
  createState = { step: 1, niche: '', style: 'Viral Hook', duration: 30, customPrompt: '', storyboard: null };
  renderCreateStep();
}

function renderCreateStep() {
  const dots = NICHES_DATA.length > 0 ? 6 : 4;
  const dotEl = document.getElementById('step-dots');
  dotEl.innerHTML = Array.from({length: 5}, (_, i) =>
    '<div class="step-dot' + (i < createState.step ? ' done' : '') + '"></div>'
  ).join('');

  const c = document.getElementById('create-step-container');
  if (createState.step === 1) {
    c.innerHTML = \`
      <div class="step-header">Pilih Niche Bisnis</div>
      <div class="step-sub">Kategori konten akan menentukan gaya video</div>
      <div class="niche-grid">
        \${NICHES_DATA.map(n => '<div class="niche-btn' + (createState.niche === n.id ? ' selected' : '') + '" onclick="selectNiche(\\'' + n.id + '\\')"><span class="ni">' + n.emoji + '</span>' + n.name + '</div>').join('')}
      </div>
      <div style="margin-top:24px"><button class="btn btn-primary" onclick="nextStep()" \${!createState.niche ? 'disabled' : ''}>Lanjut →</button></div>
    \`;
  } else if (createState.step === 2) {
    c.innerHTML = \`
      <div class="step-header">Pilih Style Video</div>
      <div class="step-sub">Gaya penyampaian konten</div>
      <div class="chip-group">
        \${STYLES.map(s => '<div class="chip' + (createState.style === s ? ' selected' : '') + '" onclick="selectStyle(\\'' + s + '\\')">'+s+'</div>').join('')}
      </div>
      <div style="margin-top:24px;display:flex;gap:12px">
        <button class="btn btn-outline" onclick="prevStep()">← Kembali</button>
        <button class="btn btn-primary" onclick="nextStep()">Lanjut →</button>
      </div>
    \`;
  } else if (createState.step === 3) {
    c.innerHTML = \`
      <div class="step-header">Pilih Durasi</div>
      <div class="step-sub">Durasi video output</div>
      <div class="dur-group">
        \${DURATIONS.map(d => '<div class="dur-btn' + (createState.duration === d ? ' selected' : '') + '" onclick="selectDur(' + d + ')">' + d + 's</div>').join('')}
      </div>
      <div style="margin-top:24px;display:flex;gap:12px">
        <button class="btn btn-outline" onclick="prevStep()">← Kembali</button>
        <button class="btn btn-primary" onclick="nextStep()">Lanjut →</button>
      </div>
    \`;
  } else if (createState.step === 4) {
    c.innerHTML = \`
      <div class="step-header">Custom Prompt (Opsional)</div>
      <div class="step-sub">Deskripsikan produkmu, atau skip untuk AI auto-generate</div>
      <div class="form-group">
        <textarea id="custom-prompt" placeholder="Contoh: Kopi arabika single origin dari Aceh, rasa fruity dan bright, cocok untuk coffee lover..." rows="4">\${createState.customPrompt}</textarea>
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn btn-outline" onclick="prevStep()">← Kembali</button>
        <button class="btn btn-outline" onclick="createState.customPrompt='';nextStep()">⚡ Skip</button>
        <button class="btn btn-primary" onclick="createState.customPrompt=document.getElementById('custom-prompt').value;nextStep()">Preview Storyboard →</button>
      </div>
    \`;
  } else if (createState.step === 5) {
    c.innerHTML = \`
      <div class="step-header">Preview Storyboard</div>
      <div class="step-sub">AI sedang generate storyboard...</div>
      <div style="display:flex;align-items:center;gap:12px;padding:20px 0"><div class="spinner"></div><span style="color:var(--dim);font-size:14px">Generating storyboard...</span></div>
    \`;
    generateStoryboardPreview();
  } else if (createState.step === 6) {
    const scenes = createState.storyboard?.scenes || [];
    const creditCost = createState.duration <= 5 ? 0.2 : createState.duration <= 15 ? 0.5 : createState.duration <= 30 ? 1.0 : 2.0;
    const canAfford = Number(currentUser?.credits || 0) >= creditCost;
    c.innerHTML = \`
      <div class="step-header">Konfirmasi & Generate</div>
      <div class="step-sub">\${scenes.length} scene · \${createState.duration}s · \${createState.niche} · \${createState.style}</div>
      <div style="margin-bottom:20px">
        \${scenes.map(s => '<div class="scene-card"><div class="scene-num">Scene '+s.scene+' · '+s.duration+'s</div><p>'+s.description+'</p></div>').join('')}
      </div>
      \${createState.storyboard?.caption ? '<div class="card" style="margin-bottom:20px"><div style="font-size:12px;color:var(--dim);margin-bottom:6px">📝 Caption</div><p style="font-size:14px;line-height:1.6">'+createState.storyboard.caption+'</p></div>' : ''}
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px">Biaya</span>
          <span style="font-size:18px;font-weight:700;color:var(--accent)">\${creditCost} Credits</span>
        </div>
        \${!canAfford ? '<div style="margin-top:12px;color:var(--danger);font-size:13px">⚠️ Credits tidak cukup. <a href="#" onclick="nav('billing')" style="color:var(--accent)">Top Up sekarang</a></div>' : ''}
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn btn-outline" onclick="createState.step=4;renderCreateStep()">← Kembali</button>
        <button class="btn btn-primary" onclick="startGeneration()" \${!canAfford ? 'disabled' : ''} id="gen-btn">🎬 Generate Video</button>
      </div>
    \`;
  }
}

function selectNiche(id) { createState.niche = id; renderCreateStep(); }
function selectStyle(s) { createState.style = s; renderCreateStep(); }
function selectDur(d) { createState.duration = d; renderCreateStep(); }
function nextStep() { createState.step++; renderCreateStep(); }
function prevStep() { createState.step--; renderCreateStep(); }

async function generateStoryboardPreview() {
  try {
    const data = await apiFetch('/api/storyboard', {
      method: 'POST',
      body: JSON.stringify({ niche: createState.niche, duration: createState.duration, customPrompt: createState.customPrompt || undefined })
    });
    if (!data || data.error) { toast('Gagal generate storyboard: ' + (data?.error || 'Unknown'), 'err'); createState.step = 4; renderCreateStep(); return; }
    createState.storyboard = data;
    createState.step = 6;
    renderCreateStep();
  } catch(e) { toast('Error: ' + e.message, 'err'); createState.step = 4; renderCreateStep(); }
}

async function startGeneration() {
  const btn = document.getElementById('gen-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memulai...'; }
  try {
    const data = await apiFetch('/api/video/create', {
      method: 'POST',
      body: JSON.stringify({
        niche: createState.niche,
        style: createState.style,
        duration: createState.duration,
        customPrompt: createState.customPrompt || undefined,
        storyboard: createState.storyboard
      })
    });
    if (!data || data.error) { toast('Gagal: ' + (data?.error || 'Server error'), 'err'); if (btn) { btn.disabled = false; btn.innerHTML = '🎬 Generate Video'; } return; }
    toast('✅ Video mulai diproses! Cek di "Video Saya"', 'ok');
    // Refresh credits
    const user = await apiFetch('/api/user');
    if (user) { currentUser = user; updateCreditsDisplay(user.credits); }
    // Go to videos and poll
    nav('videos');
    startPolling();
  } catch(e) { toast('Error: ' + e.message, 'err'); if (btn) { btn.disabled = false; btn.innerHTML = '🎬 Generate Video'; } }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  let attempts = 0;
  pollInterval = setInterval(async () => {
    attempts++;
    const videos = await apiFetch('/api/user/videos');
    if (!videos) { clearInterval(pollInterval); return; }
    const processing = videos.filter(v => v.status === 'processing' || v.status === 'pending');
    loadVideosList(videos);
    if (processing.length === 0 || attempts > 60) {
      clearInterval(pollInterval); pollInterval = null;
      if (attempts <= 60) toast('🎉 Video selesai diproses!', 'ok');
      const user = await apiFetch('/api/user');
      if (user) { currentUser = user; updateCreditsDisplay(user.credits); }
    }
  }, 4000);
}

// ── MY VIDEOS ────────────────────────────────────────────
async function loadVideos() {
  const container = document.getElementById('videos-container');
  container.innerHTML = '<div style="padding:20px;color:var(--dim);font-size:14px"><div class="spinner" style="display:inline-block"></div> Memuat video...</div>';
  const videos = await apiFetch('/api/user/videos');
  if (!videos) return;
  loadVideosList(videos);
  // Auto-poll if any processing
  if (videos.some(v => v.status === 'processing' || v.status === 'pending')) startPolling();
}

function loadVideosList(videos) {
  const container = document.getElementById('videos-container');
  if (!videos || videos.length === 0) {
    container.innerHTML = '<div class="empty"><div class="icon">📁</div><h3>Belum ada video</h3><p>Buat video pertamamu!</p><button class="btn btn-primary" onclick="nav('create')" style="margin-top:16px">Buat Video</button></div>';
    return;
  }
  container.innerHTML = videos.map(v => videoCard(v)).join('');
}

// ── BILLING ──────────────────────────────────────────────
async function loadBilling() {
  // Load packages
  const pkgs = await apiFetch('/api/packages');
  const pc = document.getElementById('packages-container');
  if (pkgs && pkgs.length > 0) {
    pc.innerHTML = pkgs.map((p, i) => \`
      <div class="price-card \${i===1?'popular':''}">
        \${i===1 ? '<div class="popular-tag">⭐ POPULER</div>' : ''}
        <h3>\${p.name}</h3>
        <div class="price">IDR \${Number(p.price).toLocaleString('id-ID')}</div>
        <div class="cred">\${p.credits} Credits</div>
        <button class="btn btn-\${i===1?'primary':'outline'} btn-full" onclick="buyPackage('\${p.id}')">Beli Paket</button>
      </div>
    \`).join('');
  } else {
    // Fallback hardcoded
    pc.innerHTML = \`
      <div class="price-card"><h3>Starter Flow</h3><div class="price">IDR 49.000</div><div class="cred">6 Credits</div><button class="btn btn-outline btn-full" onclick="buyPackage('starter')">Beli</button></div>
      <div class="price-card popular"><div class="popular-tag">⭐ POPULER</div><h3>Growth Machine</h3><div class="price">IDR 149.000</div><div class="cred">22 Credits</div><button class="btn btn-primary btn-full" onclick="buyPackage('growth')">Beli</button></div>
      <div class="price-card"><h3>Business Kingdom</h3><div class="price">IDR 499.000</div><div class="cred">85 Credits</div><button class="btn btn-outline btn-full" onclick="buyPackage('kingdom')">Beli</button></div>
    \`;
  }
  // Load transactions
  const txns = await apiFetch('/api/my/transactions');
  const tbody = document.getElementById('txn-body');
  if (txns && txns.length > 0) {
    tbody.innerHTML = txns.map(t => \`
      <tr>
        <td style="font-family:monospace;font-size:11px">\${(t.orderId||'').slice(0,18)}...</td>
        <td>\${t.packageName || '—'}</td>
        <td>IDR \${Number(t.amountIdr||0).toLocaleString('id-ID')}</td>
        <td>\${Number(t.creditsAmount||0).toFixed(1)}</td>
        <td><span class="status-badge status-\${t.status}">\${t.status}</span></td>
        <td>\${new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
      </tr>
    \`).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--dim);padding:24px">Belum ada transaksi</td></tr>';
  }
}

async function buyPackage(pkgId) {
  toast('⏳ Membuat transaksi...', 'info');
  const data = await apiFetch('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify({ packageId: pkgId, gateway: 'duitku' })
  });
  if (!data || data.error) { toast('Gagal: ' + (data?.error || 'Server error'), 'err'); return; }
  const url = data.paymentUrl || data.payment_url || data.invoiceUrl;
  if (url) { window.open(url, '_blank'); toast('✅ Halaman pembayaran dibuka', 'ok'); }
  else toast('❌ Payment URL tidak ditemukan', 'err');
}

function payStars() { window.open('https://t.me/${BOT_USERNAME}?start=topup_stars', '_blank'); }
function payCrypto() { window.open('https://t.me/${BOT_USERNAME}?start=topup_crypto', '_blank'); }

function shareRef() {
  const code = currentUser?.referralCode;
  if (!code) { toast('Referral code tidak ditemukan', 'err'); return; }
  const msg = encodeURIComponent('🎬 Buat video viral dengan AI di BerkahKarya! Pakai kode referral saya: ' + code + '\\nhttps://t.me/${BOT_USERNAME}?start=ref_' + code);
  window.open('https://t.me/share/url?url=https://t.me/${BOT_USERNAME}&text=' + msg, '_blank');
}

// ── START ─────────────────────────────────────────────────
init();
</script>
</body>
</html>`;

// ─── Backend Routes ──────────────────────────────────────────────────────────

export async function webRoutes(server: FastifyInstance): Promise<void> {
  // Landing page
  server.get('/', async (_request, reply) => {
    reply.type('text/html').send(LANDING_PAGE);
  });


  // Facebook domain verification
  server.get('/go7u73s641jq2jtd8gfh2ecbl94kmy.html', async (_request, reply) => {
    reply.type('text/html').send('go7u73s641jq2jtd8gfh2ecbl94kmy');
  });


  // Web app
  server.get('/app', async (_request, reply) => {
    reply.type('text/html').send(WEB_APP);
  });

  // ── AUTH ──
  server.post('/auth/telegram', async (request, reply) => {
    try {
      const userData = request.body as any;
      if (!userData || !userData.id) {
        return reply.status(400).send({ error: 'Invalid user data' });
      }
      const isValid = checkTelegramHash(userData, BOT_TOKEN);
      if (!isValid && process.env.NODE_ENV === 'production' && userData.hash !== 'twa') {
        return reply.status(401).send({ error: 'Auth hash verification failed' });
      }
      let user = await UserService.findByTelegramId(BigInt(userData.id));
      if (!user) {
        user = await UserService.create({
          telegramId: BigInt(userData.id),
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
      }
      const token = jwt.sign(
        { userId: user.uuid, telegramId: user.telegramId.toString(), tier: user.tier },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return { token, user: { id: user.uuid, credits: user.creditBalance, tier: user.tier } };
    } catch (error: unknown) {
      server.log.error({ error }, 'Telegram auth error');
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // ── MIDDLEWARE HELPER ──
  const getUser = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { reply.status(401).send({ error: 'Unauthorized' }); return null; }
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
      const user = await UserService.findByUuid(decoded.userId);
      if (!user) { reply.status(404).send({ error: 'User not found' }); return null; }
      return user;
    } catch { reply.status(401).send({ error: 'Invalid token' }); return null; }
  };

  // ── USER ──
  server.get('/api/user', async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    return {
      id: user.uuid,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      credits: user.creditBalance,
      tier: user.tier,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
    };
  });

  // ── STORYBOARD PREVIEW ──
  server.post('/api/storyboard', async (request, reply) => {
    try {
      const { niche, duration, customPrompt } = request.body as any;
      if (!niche || !duration) return reply.status(400).send({ error: 'Niche and duration required' });
      const nicheConfig = (NICHES as any)[niche];
      const scenes = nicheConfig ? Math.max(3, Math.min(Math.floor(duration / 5), 8)) : 4;
      const storyboard = generateStoryboard(niche, nicheConfig?.styles?.slice(0, 2) || ['viral'], duration, scenes);
      return {
        scenes: storyboard.map((s: any, i: number) => ({
          scene: i + 1,
          duration: s.duration || Math.floor(duration / storyboard.length),
          description: customPrompt ? `${customPrompt} — ${s.description}` : s.description,
        })),
        caption: `🎬 ${niche?.toUpperCase()} video | ${duration}s | Generated by BerkahKarya AI`,
        hashtags: [`#${niche}`, '#AIVideo', '#BerkahKarya', '#ViralContent'],
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Failed to generate storyboard' });
    }
  });

  // ── VIDEO CREATE ──
  server.post('/api/video/create', async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { niche, style, duration, customPrompt, storyboard } = request.body as any;
      if (!niche || !duration) return reply.status(400).send({ error: 'niche and duration required' });

      const creditCost = getVideoCreditCost(duration);
      if (Number(user.creditBalance) < creditCost) {
        return reply.status(402).send({ error: `Insufficient credits. Need ${creditCost}, have ${user.creditBalance}` });
      }

      // Deduct credits
      await UserService.deductCredits(user.telegramId, creditCost);

      const jobId = `WEB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const scenes = storyboard?.scenes || [];
      const sceneData = scenes.length > 0 ? scenes : [{ scene: 1, duration, description: customPrompt || `${niche} marketing video` }];

      // Create DB record
      await prisma.video.create({
        data: {
          userId: user.telegramId,
          jobId,
          niche,
          platform: 'tiktok',
          duration,
          scenes: sceneData.length,
          status: 'processing',
          creditsUsed: creditCost,
          storyboard: sceneData,
          styles: style ? [style] : [],
        },
      });

      // Enqueue
      await enqueueVideoGeneration({
        jobId,
        niche,
        platform: 'tiktok',
        duration,
        scenes: sceneData.length,
        storyboard: sceneData,
        customPrompt: customPrompt || undefined,
        userId: user.telegramId.toString(),
        chatId: Number(user.telegramId),
      });

      return { ok: true, jobId, message: 'Video generation started' };
    } catch (error: any) {
      server.log.error({ error }, 'Video create error');
      return reply.status(500).send({ error: error.message || 'Failed to create video' });
    }
  });

  // ── PACKAGES ──
  server.get('/api/packages', async () => {
    return PaymentService.getPackages();
  });

  // ── PAYMENT CREATE ──
  server.post('/api/payment/create', async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { packageId, gateway } = request.body as any;
      if (!packageId || !gateway) return reply.status(400).send({ error: 'packageId and gateway required' });
      let result: any;
      if (gateway === 'duitku') {
        result = await DuitkuService.createTransaction({ userId: user.telegramId, packageId, username: user.username || user.firstName });
      } else if (gateway === 'tripay') {
        result = await TripayService.createTransaction({ userId: user.telegramId, packageId, username: user.username || user.firstName });
      } else {
        result = await PaymentService.createTransaction({ userId: user.telegramId, packageId, username: user.username || user.firstName });
      }
      return result;
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ── TRANSACTIONS ──
  server.get('/api/my/transactions', async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return transactions;
    } catch { return reply.status(500).send({ error: 'Failed to fetch transactions' }); }
  });

  // ── USER VIDEOS ──
  server.get('/api/user/videos', async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const videos = await prisma.video.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return videos;
    } catch { return reply.status(500).send({ error: 'Failed to fetch videos' }); }
  });

  // ── VIDEO DOWNLOAD ──
  server.get('/video/:jobId/download', async (request, reply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      const { token } = request.query as { token?: string };
      if (!token) return reply.status(401).send({ error: 'Missing token' });
      let decoded: string;
      try { decoded = Buffer.from(token, 'base64').toString('utf-8'); } catch { return reply.status(401).send({ error: 'Invalid token' }); }
      const [tokenUserId, tokenJobId] = decoded.split(':');
      if (!tokenUserId || tokenJobId !== jobId) return reply.status(403).send({ error: 'Token mismatch' });
      const video = await VideoService.getByJobId(jobId);
      if (!video) return reply.status(404).send({ error: 'Video not found' });
      if (video.userId.toString() !== tokenUserId) return reply.status(403).send({ error: 'Access denied' });
      const localPath = video.downloadUrl;
      if (!localPath || !fs.existsSync(localPath)) return reply.status(404).send({ error: 'Video file not found' });
      const filename = `berkahkarya-${jobId}.mp4`;
      const stream = fs.createReadStream(localPath);
      const stat = fs.statSync(localPath);
      reply.header('Content-Type', 'video/mp4');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', stat.size);
      return reply.send(stream);
    } catch (error) {
      server.log.error({ error }, 'Video download error');
      return reply.status(500).send({ error: 'Download failed' });
    }
  });
}
