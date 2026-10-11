# Shree Ganesha Solar - Production Website & Lead Management System

A polished, full-stack, production-ready website for **Shree Ganesha Solar**, an authorized Waaree Energies partner serving homeowners, housing societies, and businesses in Pune and PCMC, Maharashtra.

---

## 🌟 Key Highlights & Capabilities

- **Brand & Local Identity:** Centered around Shree Ganesha Solar's Pune presence (Sinhagad Road & Kothrud branches), authorized Waaree Energies supply, and official contact channels.
- **Conversion Architecture:** Triple-action conversion flow:
  1. Instant interactive site assessment lead forms with anti-spam honeypot and real database storage.
  2. Direct phone call actions (`+91 98810 54321` / `+91 98220 12345`).
  3. Pre-populated WhatsApp deep links carrying unique customer inquiry references.
- **Calibrated Savings Calculator:** Grounded in Pune’s solar irradiance (~4.15 peak sun hours/day, 125 units/kW/month) and MSEDCL residential/society/commercial tariffs.
- **Full-Stack Lead Capture & Management:** Real backend API with input validation, sliding-window rate limiting, privacy-safe IP hashing, and SQLite database persistence.
- **Staff Admin Portal (`/admin`):** Secure lead dashboard for sales reps to review, filter, update follow-up statuses, record notes, call/WhatsApp customers in one click, and export inquiries to CSV.
- **Bilingual Experience:** Instant English and Marathi (मराठी) localization.
- **Structured Content Model (`content/site-content.json`):** Routine updates to tariffs, FAQs, branch addresses, and solutions without touching HTML code.
- **Technical SEO & Analytics Foundations:** Schema.org JSON-LD structured data (`SolarEnergyCompany`), Open Graph, Twitter Cards, `robots.txt`, `sitemap.xml`, and Google Tag Manager / GA4 conversion event tracking with UTM attribution preservation.

---

## 📂 Project Structure

```text
├── server/
│   ├── index.js              # Express 5 full-stack server (REST API, security, SEO routes)
│   └── db.js                 # Provider-agnostic LeadRepository (SQLite with JSON fallback)
├── data/
│   └── leads.db              # SQLite database storing customer inquiries
├── content/
│   └── site-content.json     # Editable content model (business info, FAQs, solutions)
├── css/
│   └── styles.css            # Complete design system, accessibility, responsive rules
├── js/
│   ├── app.js                # Core frontend controller (API lead submission, forms, tabs)
│   ├── calculator.js         # Solar calculation engine (Pune insolation & MSEDCL tariffs)
│   ├── translations.js       # Complete English & Marathi localization dictionary
│   ├── analytics.js          # UTM attribution engine & privacy-conscious dataLayer tracking
│   └── admin.js              # Staff admin portal logic (filtering, status updates, CSV export)
├── images/
│   ├── logo.png              # Official Shree Ganesha Solar logo
│   ├── hero-solar-pune.jpg   # Pune rooftop solar installation photo
│   ├── residential-solar-pune.jpg
│   ├── society-solar-pune.jpg
│   └── commercial-solar-pune.jpg
├── index.html                # Customer-facing landing page
├── admin.html                # Staff Lead Management Portal
├── robots.txt                # Search engine crawler instructions
├── sitemap.xml               # Search engine index sitemap
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration (gitignored)
├── package.json              # Dependencies and run scripts
└── README.md                 # Setup and handoff documentation
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js (v18 or higher recommended; fully tested on Node v24)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```env
PORT=8080
NODE_ENV=development
ADMIN_SECRET_KEY=sgs_pune_admin_2026
HASH_SALT=sgs_solar_salt_pune
```

### 3. Start the Server
```bash
npm start
```
The application will launch on **[http://localhost:8080](http://localhost:8080)**.

---

## 💼 Staff Lead Management Portal (Subdomain Architecture)

Authorized sales and field staff can manage inbound solar inquiries directly on a dedicated subdomain:
- **Local Development URL:** [http://admin.localhost:8080/](http://admin.localhost:8080/)
- **Production URL:** `https://admin.shreeganeshasolar.com/` (or your configured `ADMIN_SUBDOMAIN.APP_DOMAIN`)
- **Default Development Access Key:** `sgs_pune_admin_2026` *(Set via `ADMIN_SECRET_KEY` in `.env` for production)*

### 🚀 Netlify Deployment (`shreesolarcompany.netlify.app`)

If your main site is hosted on Netlify at **[https://shreesolarcompany.netlify.app](https://shreesolarcompany.netlify.app/)**:

1. **How Subdomains Work on Netlify:**
   - **On free `*.netlify.app` domains:** Netlify's SSL certificates only cover single-level subdomains (`site-name.netlify.app`). Therefore, third-level subdomains like `admin.shreesolarcompany.netlify.app` cannot be issued directly on `netlify.app`.
   - **Option A (Dedicated Netlify Staff Site):** Create a 2nd site in your Netlify dashboard linked to this same repository and name it **`https://shreesolarcompany-admin.netlify.app`** or **`https://admin-shreesolarcompany.netlify.app`**.
   - **Option B (Direct Protected Route):** Access the staff portal directly at **`https://shreesolarcompany.netlify.app/admin`** (pre-configured in `netlify.toml` with `X-Robots-Tag: noindex` and protected by your secret access key).
   - **Option C (Custom Domain - Recommended):** If you connect a custom domain (e.g., `shreesolarcompany.com`), you can add **`admin.shreesolarcompany.com`** as a standard CNAME subdomain in Netlify Domain Management.

2. **Serverless Functions:**
   - The repository includes pre-configured Netlify Serverless Functions in `netlify/functions/api.js` and `netlify.toml`.
   - All quote submissions (`POST /api/leads`) and staff queries (`/api/admin/*`) run serverlessly on Netlify without needing external server hosting.

### Features:
1. **Pipeline Dashboard:** View total inquiries, new leads, site visits scheduled, and closed deals in real-time.
2. **Filtering & Search:** Filter by lead status (`New`, `Contacted`, `Visit Scheduled`, `Quote Sent`, `Closed Won`, `Closed Lost`) or search by name, phone, and Pune area (e.g., *Kothrud*, *Wagholi*, *Baner*).
3. **Instant Actions:**
   - Click **📞 Call** to trigger a telephone call.
   - Click **💬 Chat** to open WhatsApp with a personalized message referencing the inquiry ID.
   - Click **📝 Notes** to log site survey observations or quotation details.
4. **CSV Export:** Click **📥 Export CSV** to download customer records for CRM import or weekly sales reviews.
5. **Direct Site Navigation:** The portal header includes **View Live Website ↗** which dynamically resolves back to the public apex website.

---

## 🛠️ Routine Content Management

To update tariffs, business contact details, FAQs, or solution descriptions without code changes, edit:
👉 `content/site-content.json`

- **Phone & WhatsApp numbers:** Update under `"business"."phones"` and `"business"."whatsapp"`.
- **Branch addresses:** Add or edit locations under `"business"."offices"`.
- **Electricity Tariffs:** Adjust rates under `"calculator"."tariffs"`.
- **FAQs:** Add or modify questions and answers under `"faq"`.

---

## 📈 Marketing, Analytics & Ads Tracking

### UTM Campaign Attribution
The site automatically detects and stores campaign parameters from inbound links:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `document.referrer`

When a visitor submits a quote request, their marketing attribution is stored in the database alongside their inquiry, allowing the business owner to see which Google or Meta ads generate customers.

### Conversion Events (`window.dataLayer`)
The frontend pushes clean, **zero-PII** events to `window.dataLayer`:
- `sgs_form_start`: When a user begins entering property details.
- `sgs_quote_submission`: When a quote is successfully verified and stored in the database.
- `sgs_call_click`: When a user clicks a phone button.
- `sgs_whatsapp_click`: When a user opens WhatsApp.
- `sgs_calculator_interact`: When a user adjusts the solar bill slider.

To connect **Google Analytics 4** or **Google Tag Manager**, simply place your GTM container script into `<head>` in `index.html`.

---

## 🔍 Technical SEO & Local Search

1. **Structured Data:** Embedded Schema.org `SolarEnergyCompany` / `LocalBusiness` JSON-LD in `index.html` detailing:
   - Official brand name & logo
   - Sinhagad Road & Kothrud addresses
   - Pune coordinates (18.4902° N, 73.8188° E)
   - Working hours and contact numbers
2. **Meta & Social:** Full Open Graph (`og:*`) and Twitter Card (`twitter:*`) tags for clean link previews on WhatsApp, LinkedIn, and social media.
3. **Crawlers:** Live `robots.txt` and `sitemap.xml` served at `/robots.txt` and `/sitemap.xml`.

---

## 🚢 Production Deployment Guide

### Deploying to Render / Railway / Heroku
1. Push code to your private GitHub repository.
2. Connect repository to Render or Railway as a **Web Service**.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure Environment Variables in the platform dashboard:
   - `PORT`: `8080` (or platform default)
   - `NODE_ENV`: `production`
   - `ADMIN_SECRET_KEY`: *Set a strong password for staff*
   - `HASH_SALT`: *Set a random alphanumeric salt*
6. Set up a persistent disk mounted to `/data` if using SQLite on containerized platforms (or connect an external database).

### External Database Option (Supabase / PostgreSQL)
If migrating from local SQLite to Supabase or managed PostgreSQL:
1. Set `DATABASE_URL` or `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
2. The `LeadRepository` in `server/db.js` is isolated behind a clean interface, so switching the driver requires zero changes to the frontend or admin UI.

---

## 🔒 Security & Privacy Practices

- **Honeypot Anti-Spam:** Hidden form field traps bots without irritating real human customers with CAPTCHAs.
- **Rate Limiting:** Sliding-window limiter protects lead endpoints from flooding (maximum 10 requests per 15 minutes per IP hash).
- **No PII Logging:** Server logs never print customer names or phone numbers.
- **Protected Admin API:** All `/api/admin/*` endpoints strictly enforce authorization checks; public visitors receive a `401 Unauthorized`.
- **Sanitized Inputs:** Form inputs are stripped of HTML tags and validated against strict regex rules before database insertion.

---

## 📞 Business Contact Information

- **Company:** Shree Ganesha Solar
- **Status:** Authorized Waaree Energies Partner
- **Phone:** +91 98810 54321 / +91 98220 12345
- **Offices:**
  - Anand Nagar, Sinhagad Road, Pune, Maharashtra 411051
  - Paud Road, Kothrud, Pune, Maharashtra 411038
- **Website:** [http://localhost:8080](http://localhost:8080)
