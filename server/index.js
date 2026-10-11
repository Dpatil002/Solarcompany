/**
 * Shree Ganesha Solar - Production-Ready Express Full-Stack Server
 * Includes Lead Management API, Admin Portal, Rate Limiting, Spam Honeypot,
 * SEO Files (robots.txt, sitemap.xml), and Content API.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const { LeadRepository } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'sgs_pune_admin_2026';
const HASH_SALT = process.env.HASH_SALT || 'sgs_solar_salt_pune';
const ADMIN_SUBDOMAIN = (process.env.ADMIN_SUBDOMAIN || 'admin').trim().toLowerCase();
const APP_DOMAIN = (process.env.APP_DOMAIN || '').trim().toLowerCase();

/**
 * Checks whether the incoming request is directed to the staff admin subdomain.
 * Supports both local testing (admin.localhost:8080) and production (admin.yourdomain.com).
 */
function isAdminHost(req) {
  const rawHost = (req.headers.host || req.hostname || '').toLowerCase();
  const host = rawHost.split(':')[0];
  if (!host) return false;
  if (host === `${ADMIN_SUBDOMAIN}.localhost`) return true;
  if (APP_DOMAIN && host === `${ADMIN_SUBDOMAIN}.${APP_DOMAIN}`) return true;
  if (host.startsWith(`${ADMIN_SUBDOMAIN}.`)) return true;
  return false;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const PUBLIC_DIR = path.join(__dirname, '..');

// Subdomain SEO Protection: Never allow web crawlers to index the staff portal
app.get('/robots.txt', (req, res) => {
  if (isAdminHost(req)) {
    res.type('text/plain');
    return res.send('User-agent: *\nDisallow: /\n');
  }
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /data/

Sitemap: https://www.shreeganeshasolar.com/sitemap.xml
`;
  res.type('text/plain');
  res.send(robots);
});

// Admin Subdomain Root Routing:
// When requested via the admin subdomain, GET / serves admin.html directly
app.use((req, res, next) => {
  if (isAdminHost(req)) {
    if (req.method === 'GET' && req.path === '/') {
      return res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
    }
  }
  next();
});

// Static file serving (CSS, JS, images, content)
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  etag: true
}));

/* --------------------------------------------------------------------------
   Security: In-Memory Sliding Window Rate Limiter
   -------------------------------------------------------------------------- */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ipHash) {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash) || [];
  const recent = entry.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recent.push(now);
  rateLimitMap.set(ipHash, recent);
  return true;
}

// Cleanup stale rate limit map entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const active = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, active);
    }
  }
}, 60 * 60 * 1000);

/* --------------------------------------------------------------------------
   Security: Admin Authentication Middleware
   -------------------------------------------------------------------------- */
function requireAdminAuth(req, res, next) {
  const providedKey = req.headers['x-admin-key'] || req.query.key || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!providedKey || providedKey !== ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing administrator credentials'
    });
  }
  next();
}

/* --------------------------------------------------------------------------
   API Route: Lead Submission (POST /api/leads)
   -------------------------------------------------------------------------- */
app.post('/api/leads', (req, res) => {
  try {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(String(rawIp) + HASH_SALT).digest('hex').slice(0, 16);

    // 1. Rate Limit Verification
    if (!checkRateLimit(ipHash)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a few minutes before submitting again.'
      });
    }

    // 2. Honeypot Verification (Traps automated spam bots)
    if (req.body.website_url_check && String(req.body.website_url_check).trim().length > 0) {
      // Silently succeed to not tip off spambots, but discard lead
      return res.status(200).json({
        success: true,
        message: 'Quote request registered successfully.'
      });
    }

    // 3. Input Validation & Sanitization
    const name = String(req.body.name || '').trim().replace(/[<>]/g, '');
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid name (2 to 100 characters).'
      });
    }

    // Clean phone number (strip whitespace, +91, dashes)
    let phone = String(req.body.phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
    if (phone.startsWith('91') && phone.length === 12) {
      phone = phone.slice(2);
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit Indian mobile number.'
      });
    }

    const monthly_bill = parseFloat(req.body.monthly_bill) || 0;
    const property_type = ['home', 'society', 'business'].includes(req.body.property_type) 
      ? req.body.property_type 
      : 'home';
    const area = String(req.body.area || '').trim().slice(0, 100).replace(/[<>]/g, '');

    if (!req.body.consent) {
      return res.status(400).json({
        success: false,
        error: 'Consent is required to be contacted regarding your solar estimate.'
      });
    }

    // 4. Persistence via LeadRepository
    const newLead = LeadRepository.createLead({
      name,
      phone,
      monthly_bill,
      property_type,
      area,
      consent: true,
      utm_source: req.body.utm_source,
      utm_medium: req.body.utm_medium,
      utm_campaign: req.body.utm_campaign,
      utm_term: req.body.utm_term,
      utm_content: req.body.utm_content,
      referrer: req.body.referrer,
      ip_hash: ipHash,
      user_agent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      leadId: newLead.id,
      message: 'Quote request received successfully! Our Pune solar engineer will call within 15 minutes.'
    });

  } catch (err) {
    console.error('[API /api/leads Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your request. Please call +91 98810 54321.'
    });
  }
});

/* --------------------------------------------------------------------------
   API Route: Admin Lead Management (Protected)
   -------------------------------------------------------------------------- */
app.get('/api/admin/leads', requireAdminAuth, (req, res) => {
  try {
    const { status = 'all', search = '', limit = 50, offset = 0 } = req.query;
    const result = LeadRepository.getLeads({ status, search, limit, offset });
    return res.json({
      success: true,
      total: result.total,
      leads: result.leads
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const stats = LeadRepository.getStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/leads/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updated = LeadRepository.updateLead(id, { status, notes });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    return res.json({ success: true, lead: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leads/export', requireAdminAuth, (req, res) => {
  try {
    const csvData = LeadRepository.exportCsv();
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sgs-leads-${dateStr}.csv"`);
    return res.send(csvData);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   API Route: Structured Site Content
   -------------------------------------------------------------------------- */
app.get('/api/content', (req, res) => {
  try {
    const contentPath = path.join(__dirname, '..', 'content', 'site-content.json');
    if (fs.existsSync(contentPath)) {
      const data = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      return res.json({ success: true, data });
    }
    return res.status(404).json({ success: false, error: 'Content file not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   API Route: Health Check
   -------------------------------------------------------------------------- */
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'Shree Ganesha Solar Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    database: LeadRepository.isSqlite() ? 'SQLite' : 'JSON Fallback',
    timestamp: new Date().toISOString()
  });
});

/* --------------------------------------------------------------------------
   SEO: sitemap.xml
   -------------------------------------------------------------------------- */
app.get('/sitemap.xml', (req, res) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.shreeganeshasolar.com/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.shreeganeshasolar.com/#calculator</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.shreeganeshasolar.com/#solutions</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.shreeganeshasolar.com/#subsidy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.shreeganeshasolar.com/#how-it-works</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.shreeganeshasolar.com/#faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
  res.type('application/xml');
  res.send(sitemap);
});

/* --------------------------------------------------------------------------
   Admin Dashboard Route:
   - On subdomain: Serves admin.html directly
   - On apex domain: Redirects to the subdomain (or serves admin.html if no subdomain DNS)
   -------------------------------------------------------------------------- */
app.get('/admin', (req, res) => {
  const host = (req.headers.host || req.hostname || '').split(':')[0].toLowerCase();
  const port = (req.headers.host || '').split(':')[1];
  const portSuffix = port ? `:${port}` : '';

  if (isAdminHost(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
  }

  // If visited locally on apex (localhost or 127.0.0.1), redirect to admin.localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return res.redirect(302, `${req.protocol}://${ADMIN_SUBDOMAIN}.localhost${portSuffix}/`);
  }

  // If in production and APP_DOMAIN is configured, redirect to subdomain
  if (APP_DOMAIN) {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    return res.redirect(302, `${proto}://${ADMIN_SUBDOMAIN}.${APP_DOMAIN}${portSuffix}/`);
  }

  // Fallback if accessed directly on apex without domain configuration
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// Fallback routing:
// - On subdomain: SPA fallback to admin.html
// - On apex: SPA fallback to index.html
app.use((req, res) => {
  if (isAdminHost(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start Server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SGS Full-Stack Server] Server running on port ${PORT}`);
    console.log(`[SGS Full-Stack Server] Public Website: http://localhost:${PORT}`);
    console.log(`[SGS Full-Stack Server] Staff Portal Subdomain: http://${ADMIN_SUBDOMAIN}.localhost:${PORT}`);
    if (APP_DOMAIN) {
      console.log(`[SGS Full-Stack Server] Production Portal: https://${ADMIN_SUBDOMAIN}.${APP_DOMAIN}`);
    }
    console.log(`[SGS Full-Stack Server] Database: ${LeadRepository.isSqlite() ? 'Native SQLite' : 'JSON Fallback'}`);
  });
}

module.exports = app;
