# Deployment Guide: Benebone Intelligence Platform

Complete instructions for deploying the platform to Vercel.

---

## Prerequisites

Before deploying, ensure you have:
- GitHub account (repo hosting)
- Vercel account (free tier OK)
- Node.js 18+ installed locally
- (Optional) Resend API key for email functionality

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `benebone-intelligence`
3. Description: "Benebone Inventory Intelligence Platform"
4. Select: Public
5. Skip README (we have one)
6. Create repository

---

## Step 2: Push Code to GitHub

```bash
cd benebone-intelligence
git config user.email "your@email.com"
git config user.name "Your Name"
git add .
git commit -m "Initial commit: Benebone Intelligence Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/benebone-intelligence.git
git push -u origin main
```

---

## Step 3: Set Up Vercel

### Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import from GitHub
4. Select `benebone-intelligence` repository
5. **Framework Preset:** Vite
6. **Root Directory:** `./frontend`
7. **Build Command:** `npm run build`
8. **Output Directory:** `dist`
9. Click "Deploy"

### Configure Environment Variables

After deployment:

1. Go to project settings → "Environment Variables"
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | Your Resend API key | Production |
| `FTP_SERVER` | ftp.benebone.com | Production |
| `FTP_USERNAME` | Your FTP username | Production |
| `FTP_PASSWORD` | Your FTP password | Production |
| `FTP_INVENTORY_PATH` | /exports/inventory/ | Production |
| `DROPBOX_ACCESS_TOKEN` | Your Dropbox token | Production |

3. Redeploy to apply changes

---

## Step 4: Verify Deployment

1. Visit your Vercel URL: `https://benebone-intelligence.vercel.app`
2. Dashboard should load with mock data
3. Click on factory cards to see alerts
4. Test "Export PDF" button (downloads HTML)
5. Test "Send Alert" button (prepares email)

---

## Step 5: Configure Email Sending (Resend API)

### Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account
3. Create API key
4. Add to Vercel environment variables

### Test Email

```bash
curl -X POST https://api.resend.com/emails \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_RESEND_KEY' \
  -d '
{
  "from": "michael@benebone.com",
  "to": "test@benebone.com",
  "subject": "Test Alert",
  "html": "<h1>Test</h1>"
}
'
```

---

## Step 6: Connect FTP (Future Phase)

Once Phase 2 is implemented:

1. Add FTP server address to environment variables
2. Add FTP credentials (encrypted)
3. Enable automatic inventory snapshot ingestion
4. Test file transfer

---

## Step 7: Set Up Scheduled Jobs (Future Phase)

Once Phase 2 is implemented:

1. Create `api/scheduled.js` for Vercel Cron
2. Configure to run every Wednesday morning
3. Fetch latest CSV from FTP
4. Calculate alerts
5. Send emails automatically

---

## Verification Checklist

After deployment, verify:

- [ ] Dashboard loads at https://benebone-intelligence.vercel.app
- [ ] 8 factory cards display with stat counts
- [ ] Click factory → detailed alert table appears
- [ ] Export PDF button downloads HTML file
- [ ] Send Alert button shows success message
- [ ] Search works in Inventory tab
- [ ] Factory Configuration tab shows all 8 factories
- [ ] All colors match Benebone brand (green &amp; cream)
- [ ] No errors in browser console
- [ ] Vercel build logs show successful deployment

---

## Troubleshooting

### Issue: Dashboard won't load

**Solution:**
- Check Vercel build logs for errors
- Verify Node.js 18+ is being used
- Clear browser cache
- Check API endpoint is responding

### Issue: API returns 500 error

**Solution:**
- Check Vercel function logs
- Verify environment variables are set
- Ensure CSV data format is correct
- Check MOS calculation logic

### Issue: Email won't send

**Solution:**
- Verify Resend API key is correct
- Check email addresses are valid
- Confirm Resend account is verified
- Review error message in API logs

### Issue: Data not updating

**Solution:**
- Click "Refresh" button (for Phase 1 - manual)
- Verify CSV is in FTP folder (for Phase 2 - automatic)
- Check Vercel Cron is enabled (for Phase 2+)

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Resend API key added (for email)
- [ ] FTP credentials configured (when ready)
- [ ] Email recipients verified
- [ ] Alert thresholds confirmed (AIM: 1.5, others: 2.0)
- [ ] Factory hierarchy documented
- [ ] Backup process established
- [ ] Monitoring alerts set up
- [ ] Error logging configured
- [ ] Team trained on dashboard

---

## Security Checklist

- [ ] No API keys in code (all in environment variables)
- [ ] FTP credentials encrypted
- [ ] Dropbox token secured
- [ ] Resend API key secured
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] No PII logged to console
- [ ] Error messages don't expose sensitive data

---

## Monitoring

### Daily
- Check Vercel Analytics dashboard
- Monitor error rate
- Watch response times

### Weekly
- Review email delivery logs (post-Phase 2)
- Verify alert accuracy
- Check for missed SKUs

### Monthly
- Analyze alert trends
- Review false positives
- Adjust MOS thresholds if needed

---

## Rollback Procedure

If deployment has issues:

1. **Vercel Deployments** tab → click previous stable version → "Promote to Production"
2. **GitHub** → revert commit → push to main
3. **Environment variables** → reset to known-good values

---

## Next Steps

### Immediate (Week 1)
- [ ] Deploy to Vercel
- [ ] Test with mock data
- [ ] Train Michael Kirkus on dashboard
- [ ] Collect feedback

### Short-term (Month 1)
- [ ] Integrate with FTP (Phase 2)
- [ ] Set up Resend email delivery
- [ ] Import real inventory data
- [ ] Run first automated alert cycle

### Medium-term (Month 2-3)
- [ ] Implement Dropbox integration
- [ ] Enable scheduled processing
- [ ] Add email delivery verification
- [ ] Build alert history

### Long-term (Quarter 2+)
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Predictive alerts
- [ ] Mobile app

---

## Support

- **Deployment issues:** Check Vercel docs (https://vercel.com/docs)
- **Email integration:** See Resend docs (https://resend.com/docs)
- **React/Vite issues:** Check Vite docs (https://vitejs.dev)
- **Questions:** Contact Ascend AI Innovations

---

*Deployment Guide for Benebone Intelligence Platform v1.0*
