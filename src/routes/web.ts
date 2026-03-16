/**
 * Web Routes
 * 
 * Landing page and web app routes with Telegram Login support
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/config/database';
import { UserService } from '@/services/user.service';
import { VideoService } from '@/services/video.service';
import { checkTelegramHash } from '@/utils/telegram';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'openclaw-secret-change-in-production';
const BOT_USERNAME = process.env.BOT_USERNAME || 'openclaw_bot';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

/**
 * Landing page HTML
 */
const LANDING_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw - AI Video Marketing Platform</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d1f 100%);
      color: #ffffff;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links { display: flex; gap: 30px; }
    .nav-links a {
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      transition: color 0.3s;
    }
    .nav-links a:hover { color: #00d9ff; }
    
    /* Hero */
    .hero {
      text-align: center;
      padding: 100px 20px;
    }
    .hero h1 {
      font-size: 56px;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.2;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 20px;
      color: rgba(255,255,255,0.7);
      max-width: 600px;
      margin: 0 auto 40px;
    }
    .cta-buttons { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
    .btn {
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
      color: #0f0f23;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(0,217,255,0.3); }
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    
    /* Features */
    .features {
      padding: 80px 20px;
      background: rgba(255,255,255,0.02);
    }
    .features h2 {
      text-align: center;
      font-size: 40px;
      margin-bottom: 60px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    .feature-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 30px;
      transition: all 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-5px);
      border-color: rgba(0,217,255,0.3);
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .feature-icon { font-size: 48px; margin-bottom: 20px; }
    .feature-card h3 { font-size: 24px; margin-bottom: 12px; }
    .feature-card p { color: rgba(255,255,255,0.6); line-height: 1.6; }
    
    /* Workflows */
    .workflows { padding: 80px 20px; }
    .workflows h2 { text-align: center; font-size: 40px; margin-bottom: 60px; }
    .workflow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .workflow-card {
      background: linear-gradient(135deg, rgba(0,217,255,0.1) 0%, rgba(0,255,136,0.1) 100%);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      transition: all 0.3s;
    }
    .workflow-card:hover { transform: scale(1.05); }
    .workflow-card .icon { font-size: 40px; margin-bottom: 12px; }
    .workflow-card h3 { font-size: 20px; }
    
    /* Pricing */
    .pricing { padding: 80px 20px; background: rgba(255,255,255,0.02); }
    .pricing h2 { text-align: center; font-size: 40px; margin-bottom: 60px; }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .pricing-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
    }
    .pricing-card.popular {
      border-color: #00d9ff;
      position: relative;
    }
    .pricing-card.popular::before {
      content: 'MOST POPULAR';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
      color: #0f0f23;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .pricing-card h3 { font-size: 24px; margin-bottom: 8px; }
    .pricing-card .price {
      font-size: 48px;
      font-weight: 700;
      margin: 20px 0;
    }
    .pricing-card .price span { font-size: 16px; color: rgba(255,255,255,0.5); }
    .pricing-card ul {
      list-style: none;
      margin: 20px 0;
      text-align: left;
    }
    .pricing-card li {
      padding: 8px 0;
      color: rgba(255,255,255,0.7);
    }
    .pricing-card li::before { content: '✓ '; color: #00ff88; }
    
    /* CTA Section */
    .cta-section {
      text-align: center;
      padding: 100px 20px;
    }
    .cta-section h2 { font-size: 40px; margin-bottom: 20px; }
    .cta-section p { color: rgba(255,255,255,0.7); margin-bottom: 40px; }
    
    /* Footer */
    footer {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 40px 20px;
      text-align: center;
      color: rgba(255,255,255,0.5);
    }
    footer a { color: #00d9ff; text-decoration: none; }
    
    /* Telegram Login Widget */
    .telegram-login {
      display: inline-block;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">OpenClaw</div>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="#workflows">Workflows</a>
        <a href="#pricing">Pricing</a>
        <a href="/app">Dashboard</a>
      </nav>
    </header>
    
    <section class="hero">
      <h1>Create <span>Viral Videos</span> in Minutes with AI</h1>
      <p>Transform your product photos into stunning marketing videos. No editing skills required. Just upload and let AI do the magic.</p>
      <div class="cta-buttons">
        <a href="https://t.me/${BOT_USERNAME}" class="btn btn-primary">Start on Telegram</a>
        <a href="/app" class="btn btn-secondary">Try Web App</a>
      </div>
      <div class="telegram-login">
        <script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-login="${BOT_USERNAME}" data-size="large" data-radius="12" data-request-access="write" data-userpic="true" data-onauth="onTelegramAuth(user)"></script>
      </div>
    </section>
  </div>
  
  <section id="features" class="features">
    <div class="container">
      <h2>Powerful Features</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎬</div>
          <h3>AI Video Generation</h3>
          <p>Transform static images into engaging marketing videos with AI-powered motion and effects.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📋</div>
          <h3>Auto Storyboard</h3>
          <p>Automatically generate scene-by-scene storyboards tailored to your niche and product.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Clone & Remake</h3>
          <p>Found a viral video? Clone its style and create your own version in minutes.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📈</div>
          <h3>Viral Research</h3>
          <p>Discover trending content in your niche and create videos that capture the moment.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🖼️</div>
          <h3>AI Image Generation</h3>
          <p>Generate professional product photos without expensive photoshoots.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3>Prompt Extraction</h3>
          <p>Reverse-engineer any video or image to understand how it was created.</p>
        </div>
      </div>
    </div>
  </section>
  
  <section id="workflows" class="workflows">
    <div class="container">
      <h2>Industry-Specific Workflows</h2>
      <div class="workflow-grid">
        <div class="workflow-card">
          <div class="icon">🍔</div>
          <h3>F&B / Restaurant</h3>
        </div>
        <div class="workflow-card">
          <div class="icon">🏠</div>
          <h3>Real Estate</h3>
        </div>
        <div class="workflow-card">
          <div class="icon">🛍️</div>
          <h3>Product / E-commerce</h3>
        </div>
        <div class="workflow-card">
          <div class="icon">🚗</div>
          <h3>Car Dealership</h3>
        </div>
        <div class="workflow-card">
          <div class="icon">💄</div>
          <h3>Beauty & Wellness</h3>
        </div>
        <div class="workflow-card">
          <div class="icon">💼</div>
          <h3>Professional Services</h3>
        </div>
      </div>
    </div>
  </section>
  
  <section id="pricing" class="pricing">
    <div class="container">
      <h2>Simple, Credit-Based Pricing</h2>
      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Starter</h3>
          <div class="price">$5 <span>/ 6 credits</span></div>
          <ul>
            <li>6 short videos (15s)</li>
            <li>3 medium videos (30s)</li>
            <li>All platforms</li>
            <li>Basic support</li>
          </ul>
          <a href="https://t.me/${BOT_USERNAME}" class="btn btn-secondary" style="display:block;margin-top:20px;">Get Started</a>
        </div>
        <div class="pricing-card popular">
          <h3>Growth</h3>
          <div class="price">$15 <span>/ 20 credits</span></div>
          <ul>
            <li>20 short videos</li>
            <li>10 medium videos</li>
            <li>5 long videos (60s)</li>
            <li>Priority queue</li>
          </ul>
          <a href="https://t.me/${BOT_USERNAME}" class="btn btn-primary" style="display:block;margin-top:20px;">Get Started</a>
        </div>
        <div class="pricing-card">
          <h3>Scale</h3>
          <div class="price">$50 <span>/ 80 credits</span></div>
          <ul>
            <li>80 short videos</li>
            <li>40 medium videos</li>
            <li>20 long videos</li>
            <li>API access</li>
          </ul>
          <a href="https://t.me/${BOT_USERNAME}" class="btn btn-secondary" style="display:block;margin-top:20px;">Get Started</a>
        </div>
      </div>
    </div>
  </section>
  
  <section class="cta-section">
    <div class="container">
      <h2>Ready to Create Viral Content?</h2>
      <p>Join thousands of businesses creating amazing videos with AI.</p>
      <a href="https://t.me/${BOT_USERNAME}" class="btn btn-primary">Start Free Trial</a>
    </div>
  </section>
  
  <footer>
    <div class="container">
      <p>&copy; 2024 OpenClaw by <a href="https://berkahkarya.com">BerkahKarya</a>. All rights reserved.</p>
    </div>
  </footer>
  
  <script>
    function onTelegramAuth(user) {
      fetch('/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.href = '/app';
 } else if (data.error) {
 alert(data.error);
 }
        }
      });
    }
  </script>
</body>
</html>
`;

/**
 * Web app HTML (dashboard)
 */
const WEB_APP = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw - Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f0f23;
      --card-bg: rgba(255,255,255,0.05);
      --accent: #00d9ff;
      --accent-grad: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
      --text: #ffffff;
      --text-dim: rgba(255,255,255,0.6);
      --border: rgba(255,255,255,0.1);
      --danger: #ff4757;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
    .layout { display: flex; min-height: 100vh; }
    
    /* Sidebar */
    .sidebar {
      width: 260px;
      background: rgba(0,0,0,0.2);
      border-right: 1px solid var(--border);
      padding: 24px;
      display: flex;
      flex-direction: column;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      background: var(--accent-grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 40px;
    }
    .nav-group { flex: 1; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      color: var(--text-dim);
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 8px;
      border: 1px solid transparent;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text);
    }
    .nav-item.active {
      background: rgba(0,217,255,0.1);
      color: var(--accent);
      border-color: rgba(0,217,255,0.2);
    }
    
    /* Main Content */
    .main { flex: 1; padding: 40px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }
    .user-info { display: flex; align-items: center; gap: 15px; }
    .credits-badge {
      background: var(--accent-grad);
      color: #0f0f23;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    
    /* Views */
    .view { display: none; animation: fadeIn 0.3s ease; }
    .view.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    /* Action Cards */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    }
    .action-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
    }
    .action-card:hover {
      background: rgba(255,255,255,0.08);
      transform: translateY(-5px);
      border-color: var(--accent);
    }
    .action-card .icon { font-size: 32px; margin-bottom: 12px; display: block; }
    .action-card h3 { font-size: 14px; font-weight: 600; }
    
    /* Forms */
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-dim); }
    select, input, textarea {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      font-family: inherit;
    }
    button.primary {
      background: var(--accent-grad);
      color: #0f0f23;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }
    button.primary:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(0,217,255,0.4); }
    
    /* Accounts */
    .account-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      padding: 15px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid var(--border);
    }
    .acc-info { display: flex; align-items: center; gap: 12px; }
    .acc-icon { width: 40px; height: 40px; border-radius: 50%; background: #222; overflow: hidden; }
    
    /* Result Display */
    .result-box {
      margin-top: 30px;
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--border);
    }
    .scene-item {
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .scene-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">OpenClaw</div>
      <div class="nav-group">
        <div class="nav-item active" onclick="showView('dashboard')">🏠 Dashboard</div>
        <div class="nav-item" onclick="showView('create')">🎬 Create Video</div>
        <div class="nav-item" onclick="showView('social')">🔗 Social Accounts</div>
        <div class="nav-item" onclick="showView('pricing')">💰 Billing & Credits</div>
        <div class="nav-item" onclick="showView('my-videos')">📁 My Library</div>
      </div>
      <div class="nav-item" onclick="logout()">🚪 Logout</div>
    </aside>
    
    <main class="main">
      <header class="header">
        <h1 id="view-title">Dashboard</h1>
        <div class="user-info">
          <span id="user-name">Loading...</span>
          <div class="credits-badge" onclick="showView('pricing')"><span id="user-credits">0</span> Credits</div>
        </div>
      </header>
      
      <!-- Dashboard View -->
      <section id="dashboard-view" class="view active">
        <div class="action-grid">
          <div class="action-card" onclick="showView('create')">
            <span class="icon">🎬</span>
            <h3>Create Video</h3>
          </div>
          <div class="action-card" onclick="showView('social')">
            <span class="icon">🔗</span>
            <h3>Connect Social</h3>
          </div>
          <div class="action-card" onclick="showView('pricing')">
            <span class="icon">💰</span>
            <h3>Top Up Credits</h3>
          </div>
          <div class="action-card" onclick="showView('my-videos')">
            <span class="icon">📁</span>
            <h3>My Library</h3>
          </div>
        </div>
      </section>

      <!-- Social Accounts View -->
      <section id="social-view" class="view">
        <div class="section-card" style="max-width:800px;">
          <h2 style="margin-bottom:20px;">Connected Channels</h2>
          <div id="accounts-list">
            <p style="color:var(--text-dim);">No accounts connected yet.</p>
          </div>
          <div style="margin-top:40px;">
            <h3>Connect New Account</h3>
            <div class="action-grid" style="margin-top:20px;">
              <div class="action-card" style="padding:15px;" onclick="connectAccount('tiktok')">
                <span class="icon">📱</span>
                <h3>TikTok</h3>
              </div>
              <div class="action-card" style="padding:15px;" onclick="connectAccount('facebook')">
                <span class="icon">👥</span>
                <h3>Facebook</h3>
              </div>
              <div class="action-card" style="padding:15px;" onclick="connectAccount('instagram')">
                <span class="icon">📸</span>
                <h3>Instagram</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing View -->
      <section id="pricing-view" class="view">
         <h2>Upgrade Your Plan</h2>
         <p style="color:var(--text-dim); margin-bottom:30px;">Choose a package to power your Business Kingdom.</p>
         <div class="action-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
            <div class="action-card" style="text-align:left;">
               <h3>Starter Flow</h3>
               <div style="font-size:24px; font-weight:700; margin:10px 0;">IDR 49.000</div>
               <p style="font-size:12px; margin-bottom:15px;">6 Credits (~6 mins video)</p>
               <button class="primary" style="width:100%;">Buy Package</button>
            </div>
            <div class="action-card" style="text-align:left; border-color:var(--accent);">
               <h3>Growth Machine</h3>
               <div style="font-size:24px; font-weight:700; margin:10px 0;">IDR 149.000</div>
               <p style="font-size:12px; margin-bottom:15px;">22 Credits + Viral Research</p>
               <button class="primary" style="width:100%;">Buy Package</button>
            </div>
            <div class="action-card" style="text-align:left;">
               <h3>Business Kingdom</h3>
               <div style="font-size:24px; font-weight:700; margin:10px 0;">IDR 499.000</div>
               <p style="font-size:12px; margin-bottom:15px;">85 Credits + Unlimited Access</p>
               <button class="primary" style="width:100%;">Buy Package</button>
            </div>
         </div>

         <div style="margin-top:40px; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:12px; border: 1px solid var(--border);">
               <h3>Affiliate & MLM</h3>
               <p style="font-size:12px; color:var(--text-dim); margin-top:5px;">Share and earn from 2 tiers of referrals.</p>
               <div style="margin-top:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; font-family:monospace; font-size:12px; color:var(--accent);">
                 REFERRAL LINK: https://t.me/berkahkarya_bot?start=REF123
               </div>
               <div style="margin-top:15px; display:flex; gap:20px;">
                 <div><small style="color:var(--text-dim)">Tier 1</small><br><strong>15%</strong></div>
                 <div><small style="color:var(--text-dim)">Tier 2</small><br><strong>5%</strong></div>
                 <div style="color:var(--danger);"><small style="color:var(--text-dim)">Status</small><br><strong>In-Active</strong></div>
               </div>
               <p style="font-size:10px; color:var(--danger); margin-top:10px;">⚠️ Buy any package to activate your commissions for 30 days.</p>
            </div>
            
            <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:12px; border: 1px solid var(--border);">
               <h3>Top Up Credits</h3>
               <p style="font-size:12px; color:var(--text-dim);">Quick addition to current balance.</p>
               <div style="display:flex; gap:15px; margin-top:15px;">
                  <button class="primary" style="background:#333; color:white; flex:1;">1 Credit<br>IDR 15k</button>
                  <button class="primary" style="background:#333; color:white; flex:1;">5 Credits<br>IDR 65k</button>
               </div>
            </div>
         </div>
      </section>
      
      <!-- Create Video View -->
      <section id="create-view" class="view">
        <div class="form-container" style="max-width: 600px;">
          <div class="form-group">
            <label>Niche / Category</label>
            <select id="v-niche">
              <option value="fnb">🍔 F&B / Restaurant</option>
              <option value="realestate">🏠 Real Estate</option>
              <option value="product">🛍️ Product / E-commerce</option>
              <option value="car">🚗 Automotive</option>
            </select>
          </div>
          <div class="form-group">
            <label>Platform</label>
            <select id="v-platform">
              <option value="tiktok">TikTok / Reels (9:16)</option>
              <option value="youtube">YouTube Shorts (9:16)</option>
              <option value="facebook">Facebook (4:5)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Product Description</label>
            <textarea id="v-desc" placeholder="Describe your product..."></textarea>
          </div>
          <button class="primary" onclick="generateStoryboard()">Preview Storyboard</button>
        </div>
        
        <div id="storyboard-result" class="result-box" style="display:none;">
          <h2>Storyboard Preview</h2>
          <div id="scenes-list"></div>
          <div style="margin-top:20px;">
            <h3>Caption</h3>
            <p id="caption-text" style="color:var(--accent); font-style:italic; margin-top:10px;"></p>
          </div>
          <button class="primary" style="margin-top:30px;" onclick="alert('Creating video...')">Start Generation (1.0 Credits)</button>
        </div>
      </section>
      
    </main>
  </div>

  <script>
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';

    // UI Routing
    function showView(viewId) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
      
      const targetView = document.getElementById(viewId + '-view');
      if (targetView) targetView.classList.add('active');
      
      const titles = { 
        dashboard: 'Dashboard', 
        create: 'Create Video', 
        social: 'Connected Channels', 
        pricing: 'Billing & Plans',
        'my-videos': 'My Library' 
      };
      document.getElementById('view-title').innerText = titles[viewId] || 'Dashboard';
      
      Array.from(document.querySelectorAll('.nav-item')).forEach(item => {
        if (item.innerText.toLowerCase().includes(viewId)) item.classList.add('active');
      });
    }

    function connectAccount(platform) {
      alert('Connecting to PostBridge for ' + platform + '...');
      // In real life, fetch auth URL from API
    }

    // Load user data
    function loadUser() {
      fetch('/api/user', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(res => res.json())
      .then(user => {
        if (user.error) { logout(); return; }
        document.getElementById('user-name').innerText = user.firstName || user.username;
        document.getElementById('user-credits').innerText = user.credits;
      });
    }

    function logout() {
      localStorage.removeItem('token');
      window.location.href = '/';
    }

    async function generateStoryboard() {
      const niche = document.getElementById('v-niche').value;
      const desc = document.getElementById('v-desc').value;
      
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ niche, duration: 30, productDescription: desc })
      });
      
      const data = await res.json();
      
      const list = document.getElementById('scenes-list');
      list.innerHTML = '';
      data.scenes.forEach(s => {
        const div = document.createElement('div');
        div.className = 'scene-item';
        div.innerHTML = \`<strong>Scene \${s.scene} (\${s.duration}s):</strong> \${s.description}\`;
        list.appendChild(div);
      });
      
      document.getElementById('caption-text').innerText = data.caption;
      document.getElementById('storyboard-result').style.display = 'block';
    }

    loadUser();
  </script>
</body>
</html>
`;

  <script>
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';

    // UI Routing
    function showView(viewId) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
      
      const targetView = document.getElementById(viewId + '-view');
      if (targetView) targetView.classList.add('active');
      
      // Update title
      const titles = { dashboard: 'Dashboard', create: 'Create Video', storyboard: 'Storyboard Creator', images: 'AI Image Studio', 'my-videos': 'My Library' };
      document.getElementById('view-title').innerText = titles[viewId] || 'Dashboard';
      
      // Find nav item by text (simple version)
      Array.from(document.querySelectorAll('.nav-item')).forEach(item => {
        if (item.innerText.toLowerCase().includes(viewId)) item.classList.add('active');
      });
    }

    // Load user data
    function loadUser() {
      fetch('/api/user', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(res => res.json())
      .then(user => {
        if (user.error) { logout(); return; }
        document.getElementById('user-name').innerText = user.firstName || user.username;
        document.getElementById('user-credits').innerText = user.credits;
      });
    }

    function logout() {
      localStorage.removeItem('token');
      window.location.href = '/';
    }

    async function generateStoryboard() {
      const niche = document.getElementById('v-niche').value;
      const desc = document.getElementById('v-desc').value;
      
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ niche, duration: 30, productDescription: desc })
      });
      
      const data = await res.json();
      
      const list = document.getElementById('scenes-list');
      list.innerHTML = '';
      data.scenes.forEach(s => {
        const div = document.createElement('div');
        div.className = 'scene-item';
        div.innerHTML = \`<strong>Scene \${s.scene} (\${s.duration}s):</strong> \${s.description}\`;
        list.appendChild(div);
      });
      
      document.getElementById('caption-text').innerText = data.caption;
      document.getElementById('storyboard-result').style.display = 'block';
    }

    loadUser();
  </script>
</body>
</html>
`;

/**
 * Register web routes
 */
export async function webRoutes(server: FastifyInstance): Promise<void> {
  // Landing page
  server.get('/', async (_request, reply) => {
    reply.type('text/html').send(LANDING_PAGE);
  });

  // Web app dashboard
  server.get('/app', async (_request, reply) => {
    reply.type('text/html').send(WEB_APP);
  });

  // Telegram login callback
  server.post('/auth/telegram', async (request, reply) => {
    try {
      const userData = request.body as any;
      
      if (!userData || !userData.id || !userData.hash) {
        return reply.status(400).send({ error: 'Invalid user data' });
      }

      // Verify this is a real Telegram user
      const isValid = checkTelegramHash(userData, BOT_TOKEN);
      if (!isValid && process.env.NODE_ENV === 'production') {
        return reply.status(401).send({ error: 'Auth hash verification failed' });
      }
      
      // Find or create user
      let user = await UserService.findByTelegramId(BigInt(userData.id));
      
      if (!user) {
        user = await UserService.create({
          telegramId: BigInt(userData.id),
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.uuid,
          telegramId: user.telegramId.toString(),
          tier: user.tier,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token, user: { id: user.uuid, credits: user.creditBalance, tier: user.tier } };
    } catch (error: unknown) {
      server.log.error({ error }, 'Telegram auth error');
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // Get current user (for web app)
  server.get('/api/user', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await UserService.findByUuid(decoded.userId);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        id: user.uuid,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        credits: user.creditBalance,
        tier: user.tier,
        createdAt: user.createdAt,
      };
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  // Storyboard Preview
  server.post('/api/storyboard', async (request, reply) => {
    try {
      const { niche, duration, productDescription } = request.body as any;
      if (!niche || !duration) {
        return reply.status(400).send({ error: 'Niche and duration required' });
      }

      const storyboard = VideoService.generateStoryboard({ 
        niche, 
        duration, 
        productDescription 
      });
      
      return storyboard;
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate storyboard' });
    }
  });
}
