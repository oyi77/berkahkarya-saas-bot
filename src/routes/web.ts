/**
 * Web Routes
 * 
 * Landing page and web app routes with Telegram Login support
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/config/database';
import { UserService } from '@/services/user.service';
import { VideoService } from '@/services/video.service';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import { TripayService } from '@/services/tripay.service';
import { checkTelegramHash } from '@/utils/telegram';
import jwt from 'jsonwebtoken';

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
    header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-links { display: flex; gap: 30px; }
    .nav-links a { color: rgba(255,255,255,0.7); text-decoration: none; transition: color 0.3s; }
    .nav-links a:hover { color: #00d9ff; }
    .hero { text-align: center; padding: 100px 20px; }
    .hero h1 { font-size: 56px; font-weight: 700; margin-bottom: 24px; line-height: 1.2; }
    .hero h1 span { background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 20px; color: rgba(255,255,255,0.7); max-width: 600px; margin: 0 auto 40px; }
    .cta-buttons { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
    .btn { padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.3s; cursor: pointer; border: none; }
    .btn-primary { background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%); color: #0f0f23; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(0,217,255,0.3); }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .features { padding: 80px 20px; background: rgba(255,255,255,0.02); }
    .features h2 { text-align: center; font-size: 40px; margin-bottom: 60px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
    .feature-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; transition: all 0.3s; }
    .feature-card:hover { transform: translateY(-5px); border-color: rgba(0,217,255,0.3); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .feature-icon { font-size: 48px; margin-bottom: 20px; }
    .feature-card h3 { font-size: 24px; margin-bottom: 12px; }
    .feature-card p { color: rgba(255,255,255,0.6); line-height: 1.6; }
    .telegram-login { display: inline-block; margin-top: 20px; }
    footer { border-top: 1px solid rgba(255,255,255,0.1); padding: 40px 20px; text-align: center; color: rgba(255,255,255,0.5); }
    footer a { color: #00d9ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">OpenClaw</div>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="/app">Dashboard</a>
      </nav>
    </header>
    
    <section class="hero">
      <h1>Create <span>Viral Videos</span> in Minutes with AI</h1>
      <p>Transform your product photos into stunning marketing videos. No editing skills required.</p>
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
          <p>Transform static images into engaging marketing videos with AI.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📋</div>
          <h3>Auto Storyboard</h3>
          <p>Automatically generate scene-by-scene storyboards tailored to your niche.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Clone & Remake</h3>
          <p>Clone viral video styles and create your own version in minutes.</p>
        </div>
      </div>
    </div>
  </section>
  
  <footer>
    <p>&copy; 2024 OpenClaw by <a href="https://berkahkarya.com">BerkahKarya</a>. All rights reserved.</p>
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
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: rgba(0,0,0,0.2); border-right: 1px solid var(--border); padding: 24px; }
    .logo { font-size: 24px; font-weight: 700; background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 40px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; color: var(--text-dim); cursor: pointer; transition: all 0.2s; margin-bottom: 8px; border: 1px solid transparent; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    .nav-item.active { background: rgba(0,217,255,0.1); color: var(--accent); border-color: rgba(0,217,255,0.2); }
    .main { flex: 1; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .user-info { display: flex; align-items: center; gap: 15px; }
    .credits-badge { background: var(--accent-grad); color: #0f0f23; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; cursor: pointer; }
    .view { display: none; animation: fadeIn 0.3s ease; }
    .view.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .action-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
    .action-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .action-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-5px); border-color: var(--accent); }
    .action-card .icon { font-size: 32px; margin-bottom: 12px; display: block; }
    .action-card h3 { font-size: 14px; font-weight: 600; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-dim); }
    select, input, textarea { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; color: white; font-family: inherit; }
    button.primary { background: var(--accent-grad); color: #0f0f23; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    button.primary:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(0,217,255,0.4); }
    .result-box { margin-top: 30px; background: rgba(0,0,0,0.3); border-radius: 16px; padding: 24px; border: 1px solid var(--border); }
    .scene-item { padding: 12px; border-bottom: 1px solid var(--border); }
    .scene-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">OpenClaw</div>
      <div class="nav-item active" onclick="showView('dashboard')">🏠 Dashboard</div>
      <div class="nav-item" onclick="showView('create')">🎬 Create Video</div>
      <div class="nav-item" onclick="showView('pricing')">💰 Billing</div>
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
          <div class="action-card" onclick="showView('pricing')">
            <span class="icon">💰</span>
            <h3>Top Up Credits</h3>
          </div>
        </div>
      </section>

      <!-- Create Video View -->
      <section id="create-view" class="view">
        <div style="max-width: 600px;">
          <div class="form-group">
            <label>Niche / Category</label>
            <select id="v-niche">
              <option value="fnb">🍔 F&B / Restaurant</option>
              <option value="product">🛍️ Product / E-commerce</option>
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
      </section>
      
    </main>
  </div>

  <script>
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';

    function showView(viewId) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
      const targetView = document.getElementById(viewId + '-view');
      if (targetView) targetView.classList.add('active');
      const titles = { dashboard: 'Dashboard', create: 'Create Video', pricing: 'Billing & Plans' };
      document.getElementById('view-title').innerText = titles[viewId] || 'Dashboard';
    }

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
      data.scenes.forEach(function(s) {
        const div = document.createElement('div');
        div.className = 'scene-item';
        div.innerHTML = '<strong>Scene ' + s.scene + ' (' + s.duration + 's):</strong> ' + s.description;
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

  // Get packages/pricing
  server.get('/api/packages', async () => {
    return PaymentService.getPackages();
  });

  // Create payment (topup)
  server.post('/api/payment/create', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const { packageId, gateway } = request.body as any;
      
      if (!packageId || !gateway) {
        return reply.status(400).send({ error: 'packageId and gateway required' });
      }

      const user = await UserService.findByUuid(decoded.userId);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      let result;
      if (gateway === 'duitku') {
        result = await DuitkuService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      } else if (gateway === 'tripay') {
        result = await TripayService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      } else {
        result = await PaymentService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      }

      return result;
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get user transactions
  server.get('/api/my/transactions', async (request, reply) => {
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

      const transactions = await prisma.transaction.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return transactions;
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch transactions' });
    }
  });

  // Get user videos
  server.get('/api/user/videos', async (request, reply) => {
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

      const videos = await prisma.video.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return videos;
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch videos' });
    }
  });
}
