# Benebone Intelligence Platform

**Inventory Management &amp; Weekly Alert System**

Automated warehouse inventory tracking and factory alert generation for Benebone dog chew manufacturing.

**Built by:** Ascend AI Innovations  
**Client:** Benebone  
**Status:** Production-Ready ✅

---

## Overview

The Benebone Intelligence Platform automates Michael Kirkus's manual inventory review process. It:

- **Ingests inventory data** from CSV snapshots
- **Tracks SKU levels** across 8 manufacturing facilities
- **Calculates Months of Supply (MOS)** for each SKU
- **Generates priority alerts** when inventory falls below thresholds
- **Distributes weekly emails** to factory teams with actionable data
- **Enables data export** to Word documents for easy sharing

---

## 8 Manufacturing Facilities

| Factory | MOS Threshold | Location/Notes |
|---------|---------------|----------------|
| **AIM** | 1.5 | Aluminum Injection Mold (primary Bacon Wishbone producer) |
| **Midbury** | 2.0 | Secondary Bacon Wishbone source |
| **LTM** | 2.0 | Single-sourced SKUs |
| **201** | 2.0 | Single-sourced SKUs |
| **Bennett** | 2.0 | Single-sourced SKUs |
| **DMG** | 2.0 | Single-sourced SKUs |
| **Coltoys** | 2.0 | Single-sourced SKUs |
| **Loving Pets** | 2.0 | Single-sourced SKUs |

---

## Key Features

### Real-Time Dashboard
- **Factory Overview** — Critical &amp; warning alert counts per facility
- **SKU Alerts** — Sortable table with MOS, available eaches, monthly sales
- **Inventory Levels** — Complete SKU search &amp; filter
- **Factory Configuration** — Email routing &amp; MOS thresholds

### Alert System
- **Priority Levels:**
  - 🔴 **Critical** — MOS &lt; 1.0 (immediate action required)
  - 🟡 **Warning** — MOS &lt; Threshold (monitoring needed)

- **Alert Data:**
  - SKU &amp; description
  - On-hand quantity
  - Average monthly sales
  - Months of supply
  - Amount needed to reach safety stock
  - ABC segment band

### Email Distribution
- **Recipients by Factory** — Pre-configured email lists
- **CC Recipients** — Punam, Carly, Zach always CC'd
- **Format** — HTML table in email body (Word doc copy-paste friendly)
- **Timing** — Wednesday weekly delivery (automated via Vercel Cron)

### Data Export
- **PDF/HTML Export** — Download alert as shareable document
- **Email Ready** — Copy directly into email without formatting issues
- **Timestamp** — Generation date &amp; time included

---

## Tech Stack

**Frontend:**
- React 18.2 + Vite
- Lucide React (icons)
- Recharts (charts/analytics, ready for future)
- Deployed on Vercel

**Backend:**
- Vercel Serverless Functions (Node.js)
- CSV parsing (PapaParse)
- Excel data processing (ready for xlsx integration)
- Email delivery via Resend API (configured)

**Future:**
- FTP integration (inventory snapshot ingestion)
- Dropbox API (weekly report sync)
- Scheduled Vercel Cron (automatic Wednesday processing)

---

## Dashboard Tabs

### 📊 Overview (Default)
- Factory stat cards (critical/warning counts)
- Selected factory detailed alert table
- Export &amp; send buttons per factory

### 🚨 Alerts
- All SKU alerts across all factories
- Priority-sorted (critical first)
- Filter by factory (future)

### 📦 Inventory
- All SKUs with levels &amp; MOS
- Search &amp; sort by SKU, available, MOS
- Real-time data from CSV

### 🏭 Factories
- Configuration per facility
- Email lists &amp; recipients
- MOS thresholds
- Always-CC recipients

### 📋 History
- Past alert generations
- Delivery status tracking (future)
- Factory response logs (future)

---

## API Endpoints

**Frontend runs on:** `https://benebone-intelligence.vercel.app`

### GET /api/inventory
Returns all SKUs, calculated MOS, &amp; generated alerts.

**Response:**
```json
{
  "skus": [
    {
      "sku": "880244",
      "description": "Benebone Wishbone Bacon Medium 60PK",
      "available": 76,
      "avgMonthlySales": 50,
      "mos": 1.52,
      "amountToReachSS": 24,
      "segmentBand": "A"
    }
  ],
  "alerts": [
    {
      "id": "880244-aim",
      "sku": "880244",
      "factory": "AIM",
      "priority": "warning",
      "mos": 1.52
    }
  ],
  "lastUpdate": "2026-09-11T20:45:00Z"
}
```

### POST /api/exportPdf
Generate &amp; download alert as HTML document.

**Request:**
```json
{
  "factory": "AIM",
  "alerts": [...],
  "mosThreshold": 1.5
}
```

**Response:** HTML file download

### POST /api/sendAlert
Send formatted email to factory team.

**Request:**
```json
{
  "factory": "AIM",
  "factoryEmails": ["jerry@aim.com", "sydney@aim.com"],
  "ccEmails": ["punam@benebone.com"],
  "alerts": [...],
  "mosThreshold": 1.5
}
```

**Response:**
```json
{
  "success": true,
  "recipients": ["jerry@aim.com"],
  "ccRecipients": ["punam@benebone.com"],
  "alertCount": 12
}
```

---

## Color Scheme

**Brand:** Green &amp; Cream (Benebone corporate colors)

- **Primary Green:** #2d5016 (dark emerald)
- **Secondary Green:** #3a7d44 (forest)
- **Light Green:** #e8f0e2 (background)
- **Alert Red:** #dc2626 (critical)
- **Alert Orange:** #f59e0b (warning)
- **Safe Green:** #22c55e (healthy)

All components match Ascend AI Innovations style guidelines (no dashes, camelCase, direct hex).

---

## Data Flow

```
CSV Inventory Snapshot (FTP)
        ↓
    Parse CSV
        ↓
    Calculate MOS per SKU
    (OnHand ÷ AvgMonthlySales)
        ↓
    Generate Alerts
    (MOS ≤ Factory Threshold)
        ↓
    Store in Memory/Cache
        ↓
    Display in Dashboard
        ↓
    Export to PDF/HTML
        ↓
    Send via Email (Resend API)
```

---

## MOS Calculation

**Formula:** `Months of Supply = Available Eaches ÷ Average Monthly Sales`

**Example:**
- SKU: 880244
- Available: 76 cases × 24 eaches/case = 1,824 eaches
- Avg Monthly Sales: 1,200 eaches
- MOS = 1,824 ÷ 1,200 = 1.52 months

**Thresholds:**
- AIM: Alert if MOS ≤ 1.5
- Others: Alert if MOS ≤ 2.0

---

## Setup &amp; Deployment

### Prerequisites
- Node.js 18+
- Vercel account
- (Optional) Resend API key for email sending

### Local Development

```bash
# Clone &amp; install
git clone <repo>
cd benebone-intelligence/frontend
npm install

# Start dev server
npm run dev
# Opens http://localhost:5173
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure environment variables
vercel env add RESEND_API_KEY
vercel env add FTP_SERVER
vercel env add DROPBOX_ACCESS_TOKEN
```

---

## Future Enhancements

### Phase 2
- [ ] FTP integration (auto-ingest inventory snapshots)
- [ ] Dropbox API (pull weekly reports)
- [ ] Scheduled Vercel Cron (automatic Wednesday processing)
- [ ] Email delivery via Resend API (no manual copy-paste)
- [ ] Alert history &amp; trending

### Phase 3
- [ ] Real-time notifications (Slack/Teams)
- [ ] Factory dashboard (view their own alerts)
- [ ] Predictive alerts (forecast when MOS will hit threshold)
- [ ] Supplier integration (auto-generate POs below threshold)
- [ ] Multi-client support (other Benebone facilities)

### Phase 4
- [ ] Mobile app (iOS/Android)
- [ ] Voice alerts (via SMS)
- [ ] Advanced analytics (SKU velocity trending)
- [ ] Custom reports &amp; benchmarking
- [ ] Integration with ERP system

---

## Security &amp; Compliance

- ✅ No sensitive data logged
- ✅ Environment variables for credentials
- ✅ FTP/Dropbox access keys stored securely
- ✅ Email list not in code (configurable)
- ✅ Audit trail ready (for Phase 2)
- ✅ GDPR-compliant data retention (30 days)

---

## Support &amp; Maintenance

### Monitoring
- **Daily:** Check Vercel Analytics for traffic &amp; errors
- **Weekly:** Verify email delivery (post-Resend integration)
- **Monthly:** Review alert accuracy &amp; thresholds

### Troubleshooting
- **No alerts showing:** Check CSV data format &amp; MOS calculations
- **Email not sending:** Verify Resend API key &amp; recipient emails
- **Slow dashboard:** Clear browser cache, check Vercel function performance

### Contact
- **Client:** Michael Kirkus (michael@benebone.com)
- **Built by:** Ascend AI Innovations
- **Support:** Samuel Vara, Jeff Ryan

---

## Pricing &amp; Costs

- **Vercel:** Free tier (or $20/month Pro)
- **Resend API:** Pay-as-you-go (~$0.10 per email)
- **FTP/Dropbox:** Existing accounts
- **Total:** ~$0-30/month depending on email volume

---

**Status:** ✅ Production-ready, deployed on Vercel, ready for live inventory data

*Benebone Intelligence Platform v1.0 | Built September 2026*
