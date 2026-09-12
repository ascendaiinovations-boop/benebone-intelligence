# Benebone Weekly Inventory Alert System - Operations Runbook

**Version:** 1.0  
**Last Updated:** September 12, 2026  
**Owner:** Michael Kirkus, Director of Operations  
**Support Contact:** grace@ascendaiinnovations.com

---

## Quick Start

**Time to Run:** ~1 hour per week  
**Frequency:** Every Wednesday  
**Critical Time:** Must complete by 7:00 AM to send to factories

---

## Normal Operation (Every Wednesday)

### Step 1: Load Data Files (5 minutes)

1. Gather latest data files from Benebone Dropbox:
   - `BeneBone Inventory Snapshot [YYYYMMDD].csv` (from warehouse FTP)
   - `Weekly Inventory Report [M-DD-YYYY].xlsx` (current week)
   - `Benebone Planning Tool [Month] [Year].xlsx`
   - `Benebone CPD v03.xlsx` (master reference)
   - `PO & Receiving Log.xlsm` (open receipts)

2. Log into: https://benebone-intelligence.vercel.app

3. Click **"Upload Data"** button

4. Select the latest inventory snapshot CSV file

5. Click **"Load Data"**

6. **Wait for system to process** (usually <30 seconds)

### Step 2: Review Data Quality Report (2 minutes)

After data loads, you'll see a **Data Quality Report** box.

**CRITICAL:** This must show:
- Quality Score: **≥95%** (GREEN = PASS)
- Status: **PASS** (not WARN or FAIL)

**What to check:**
- SKU Count: Should be 750-810 ✓
- Description Coverage: Should be >90% ✓
- Factory Coverage: All 8 factories ✓
- Required Fields: All present ✓

**If report shows <95%:**
- ⚠️ STOP - Do NOT generate alerts
- Contact Michael immediately (P1 - see Escalation Matrix)
- Possible issue: data corrupted, missing files, or old data

### Step 3: Generate Alerts (1 minute)

1. Click **"Check Alerts for All Factories"** button

2. System will generate Word documents for each of the 8 factories:
   - AIM
   - Midbury
   - LTM
   - 201
   - Bennett
   - DMG
   - Coltoys
   - Loving Pets

3. You'll see a summary showing SKUs per factory

### Step 4: Review Word Documents (10 minutes)

1. For each factory, open the generated Word document

2. **Spot-check 3-5 SKUs:**
   - Verify SKU number exists
   - Verify MOS value matches data
   - Verify descriptions are correct
   - Check recipients list is complete

3. **Look for anomalies:**
   - Factory with 0 alerts → Flag for investigation
   - Unusually high/low SKU count → Flag for investigation
   - SKU appears in multiple factories → Should be single-sourced

4. **If something looks wrong:**
   - DO NOT send yet
   - Investigate the issue
   - Contact Michael if unclear

### Step 5: Manual Adjustments (Optional, 5 minutes)

**If Michael needs to add/remove SKUs:**

1. In the app, scroll to **"Manual Overrides"** section

2. Add or remove SKUs:
   - Type SKU number
   - Type reason (e.g., "Packaging in transit", "Critical shortage")
   - Click "Apply Changes"

3. System logs all changes in audit trail

4. **Regenerate Word documents** after any changes

### Step 6: Approve for Sending (1 minute)

1. Click **"Approve All Alerts"** button

2. You'll see confirmation: "Alerts approved for sending"

3. System logs approval with timestamp

### Step 7: Copy-Paste into Outlook (5 minutes per factory = 40 minutes)

**Phase 1.5 Process (Manual - we handle this step for you):**

1. Open Outlook

2. For each factory's Word document:
   - Select all content (Ctrl+A in Word)
   - Copy (Ctrl+C)
   - Create new email in Outlook
   - Paste content into email body
   - Verify recipients in To/CC fields match alert
   - **SEND**

**Recipient Verification:**
- AIM: TO=JAyers, SRoloson, TSwanson | CC=carly, zach, punam
- Midbury: TO=benebone@midbury.com | CC=carly, zach, punam
- LTM: TO=eric@ltmplastics.com | CC=carly, zach, punam
- 201: TO=emilio.otero@201oficial.com.mx | CC=salvador, punam
- Bennett: TO=jmattox@bpkc.com | CC=carly, zach, punam
- DMG: TO=monique.brunson@dmgincusa.com | CC=carly, zach, punam
- Coltoys: TO=jparra@coltoys.com | CC=carly, zach, punam
- Loving Pets: TO=aaron@lovingpetsproducts.com | CC=zach, carly, punam

---

## Troubleshooting Guide

### Q: "Data Quality Report shows <95%. What's wrong?"

**Checklist (in order):**

1. **Are you using the latest data files?**
   - Check that Snapshot CSV is from THIS WEEK
   - Check that Weekly Report is from CURRENT WEEK
   - If files are >5 days old, download new ones from Dropbox

2. **Is the description coverage low?**
   - This is normal (we expect 92-95%)
   - If <85%, some products may not have descriptions
   - Solution: Verify in CPD master file, update if needed

3. **Are all 8 factories represented?**
   - If a factory is missing, check Planning Tool
   - Some factories may have 0 production weeks (that's OK)
   - If truly missing: Contact Michael (P2)

4. **Still <95%?**
   - Try reloading the data files
   - Refresh page and re-upload
   - If still fails, **Escalate to Michael (P1)**

---

### Q: "Factory X got 0 alerts. Is that normal?"

**Why this happens:**
- All their SKUs are above the MOS threshold
- Their production is very low this week
- Data hasn't been updated (stale data)

**What to do:**

1. **Check Planning Tool:**
   - Is this factory producing any SKUs this week?
   - If NO → 0 alerts is correct
   - If YES → Investigate further

2. **Check MOS values:**
   - Look at factory's SKUs in Weekly Report
   - Are all MOS values >1.5 (AIM) or >2.0 (others)?
   - If YES → 0 alerts is correct
   - If NO → Data quality issue, investigate

3. **Check data freshness:**
   - Is Weekly Report from THIS WEEK?
   - Is Snapshot from TODAY or YESTERDAY?
   - If old → Reload with fresh data

4. **Still unclear?**
   - **Escalate to Michael (P2)**
   - Include: Factory name, MOS values, alert threshold

---

### Q: "The Word document took 30 seconds to generate. Is that slow?"

**SLA Targets:**
- Normal: <5 seconds
- Slow: 5-30 seconds (⚠️ Warning)
- Very Slow: >30 seconds (🔴 Error)

**If generation is slow:**

1. **Check your internet connection**
   - Try opening a webpage to verify
   - If slow, wait or reconnect

2. **Check the app status** (Phase 2 feature)
   - FTP pull might be slow
   - Dropbox sync might be delayed

3. **Try again**
   - Refresh page
   - Re-select factory
   - Click "Check Alerts" again

4. **If still >30 seconds:**
   - **Escalate to Michael (P2)**
   - Include: Which factory, how long it took

---

### Q: "A SKU is on the alert list but we just received it. Can I remove it?"

**Yes, you can manually adjust:**

1. In the app, find **"Manual Overrides"** section

2. Type the SKU and reason:
   - Reason example: "Received inbound shipment yesterday"
   - Or: "Updated inventory in system"

3. Click "Apply Changes"

4. **Regenerate Word documents**

5. **Important:** Follow up with Michael
   - Why was threshold incorrect?
   - Does it need adjustment for next week?

---

### Q: "I can't log into the app. What do I do?"

**Troubleshooting:**

1. **Verify URL:** https://benebone-intelligence.vercel.app

2. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Shift+Delete

3. **Try different browser:**
   - If Chrome fails, try Firefox
   - If Safari fails, try Chrome

4. **Check your internet:**
   - Can you reach other websites?
   - If not, reconnect to WiFi/network

5. **If still can't access:**
   - **Escalate to Grace (P1)**
   - Server might be down

---

## Emergency Procedures

### System Down Wednesday Morning

**If app is completely unavailable:**

1. **Alert Michael immediately** (call if not responding to email)

2. **Prepare manual report:**
   - Download data files from Dropbox
   - Open Weekly Report XLSX
   - Filter by: MOS ≤ 1.5 (AIM) or ≤ 2.0 (others)
   - Sort by factory
   - Count SKUs per factory

3. **Create manual alert email:**
   - Use email template from archive
   - Fill in SKU counts
   - Send to each factory

4. **Report to Paul:** Let him know manual process was used

5. **Root Cause Analysis:** Once app is back up, investigate what happened

---

### Word Document Generation Failed

**If you click "Check Alerts" and nothing happens or error appears:**

1. **Check data quality:**
   - If report shows <95%, that's the problem
   - See "Data Quality Report shows <95%" section above

2. **Reload data files:**
   - Go back to Step 1
   - Re-upload the inventory snapshot CSV
   - Wait for data to load

3. **Try again:**
   - Click "Check Alerts" again
   - Wait 1-2 minutes

4. **If still fails:**
   - Clear browser cache (see above)
   - Refresh entire page
   - Start over from Step 1

5. **If fails twice:**
   - **Use emergency procedure above**
   - **Escalate to Grace (P1)**

---

### Email Not Sent by 10 AM (Phase 2 Issue)

**In Phase 2 (when emails are automated):**

If you're in Production mode and emails didn't send by 10 AM:

1. **Check the alert status in app:**
   - Look for "Email sent" indicator
   - If status is "FAILED": System couldn't reach Resend API

2. **Check factory recipient emails:**
   - Are all recipients still active?
   - Have any emails changed?

3. **Verify Resend API key:**
   - Contact Grace
   - Verify API credentials are still valid

4. **Send manual emails:**
   - Follow copy-paste procedure from Step 7
   - Make sure all 8 factories receive alerts

5. **Report incident:**
   - Email paul@benebone.com and michael@benebone.com
   - Explain what went wrong
   - Include screenshot

---

## Escalation Matrix

### P1 (Within 4 Hours) - CRITICAL

**These issues stop the entire process:**
- System completely down/unavailable
- Data quality <95% and you can't figure out why
- Factory didn't receive their alert (found out by calling them)
- Data appears corrupted
- Word document generation fails twice

**Who to contact:**
- **Primary:** Michael Kirkus
- **Email:** michael@benebone.com
- **Phone:** (732) 993-3955
- **Backup:** Paul Nolan (paul@benebone.com)

**What to say:**
"The weekly alert system is down/broken. I've tried [X, Y, Z]. Can you help?"

---

### P2 (Within 24 Hours) - HIGH

**These issues affect quality but don't stop the process:**
- Generation is slow (>10 seconds)
- One factory got 0 alerts unexpectedly
- Description coverage is low (<85%)
- Need to manually adjust SKU list
- Unsure why a SKU was included
- Data quality shows WARN (85-95%)

**Who to contact:**
- **Primary:** Michael Kirkus (michael@benebone.com)
- **Or:** Grace Williams (grace@ascendaiinnovations.com)

**What to say:**
"I have a question about [X issue]. This is the situation: [describe]. How should I handle it?"

---

### P3 (By Next Week) - LOW

**These are questions or enhancement requests:**
- What does MOS mean exactly?
- Why was this SKU included?
- Can we add a feature for X?
- Request for historical data export
- Feedback on the process

**Who to contact:**
- **Email:** grace@ascendaiinnovations.com
- **Subject line:** "Benebone Alert System - [Question Type]"

**What to say:**
"I have a question about the alert system: [your question]"

---

## Frequently Asked Questions

### Q: What is MOS?

**MOS = Months of Supply**

**Example:**
- You have 1,000 units in stock
- You sell 500 units per month
- MOS = 1,000 ÷ 500 = **2 months of supply**

**Thresholds:**
- AIM factories: Alert if MOS ≤ 1.5 months (more urgent)
- Other factories: Alert if MOS ≤ 2.0 months

**Why it matters:**
- Low MOS = Running out of inventory soon → Factory needs to produce NOW
- High MOS = Lots of stock → Factory can wait or slow down production

---

### Q: Why was SKU 818244 included in the AIM alert?

**Lookup in audit trail:**

1. In the app, click **"View Audit Log"**

2. Find the entry for your generation date

3. Look for SKU 818244

4. You'll see:
   - MOS value: 0.636 months
   - Threshold: 1.5 months (AIM threshold)
   - Decision: INCLUDE (because 0.636 < 1.5)

**Translation:** "This SKU only has 0.636 months of supply, which is below AIM's 1.5-month threshold, so we're alerting them to produce it."

---

### Q: Can I manually adjust which SKUs are on the alert?

**Yes, with documentation:**

1. Click **"Manual Overrides"**

2. Enter SKU ID and reason:
   - Example reason: "Packaging in transit, arrival Wednesday"
   - Example reason: "Critical shortage, priority production"

3. Click "Apply"

4. **Regenerate** Word documents

5. The change is logged in audit trail with your name and reason

**Important:** After doing this, catch up with Michael to explain why the threshold was wrong.

---

### Q: What if Paul Nolan or another executive needs to see the alerts?

**Show them:**

1. Open the app
2. Click **"View Archive"** (right side of screen)
3. Select the week they want
4. They can see summary and download historical data

**Or:**
- Send them a Word document copy
- Forward the email sent to factories
- Explain the MOS numbers

---

### Q: How often should we update the data files?

**Recommended:**
- **Inventory Snapshot:** EVERY DAY (from warehouse FTP)
- **Weekly Report:** ONCE A WEEK (usually Friday or Monday)
- **Planning Tool:** ONCE A WEEK (production planning updates)
- **CPD:** MONTHLY (descriptions rarely change)
- **PO Log:** EVERY DAY (receipts update constantly)

**For weekly alerts:**
- Use THIS WEEK's snapshot (day of, or day before)
- Use THIS WEEK's Weekly Report
- Use current Planning Tool

---

### Q: What happens if the same SKU is on alert for multiple factories?

**This should be RARE. Why it happens:**
- Multi-source SKUs (produced by >1 factory)
- Data isn't updated with latest production
- Threshold settings need review

**What to do:**
- **Contact Michael** - Explain the situation
- Michael will decide which factory should get the alert
- Use Manual Overrides to remove from secondary factories
- Log the reason so we can improve logic next time

---

## Quick Reference Cards

### Data Quality Thresholds

| Metric | Target | Warn | Fail |
|--------|--------|------|------|
| SKU Count | 750-810 | <750 or >810 | - |
| Descriptions | >90% | 85-90% | <85% |
| Factory Coverage | All 8 | 7 of 8 | <7 of 8 |
| Required Fields | 100% | >95% | <95% |
| Quality Score | ≥95% | 85-95% | <85% |

---

### MOS Thresholds

| Factory | Threshold | Priority |
|---------|-----------|----------|
| AIM | ≤1.5 months | URGENT |
| Midbury | ≤2.0 months | HIGH |
| LTM | ≤2.0 months | HIGH |
| 201 | ≤2.0 months | HIGH |
| Bennett | ≤2.0 months | HIGH |
| DMG | ≤2.0 months | HIGH |
| Coltoys | ≤2.0 months | HIGH |
| Loving Pets | ≤2.0 months | HIGH |

---

### Recipients by Factory

| Factory | Primary Recipient | CC | Notes |
|---------|-------------------|-----|-------|
| AIM | Jerry Ayers, Sydney Roloson, Tom Swanson | carly, zach, punam | 3 primary contacts |
| Midbury | benebone@midbury.com | carly, zach, punam | Shared inbox |
| LTM | eric@ltmplastics.com | carly, zach, punam | 1 contact |
| 201 | emilio.otero@201oficial.com.mx | salvador, punam | International (Mexico) |
| Bennett | jmattox@bpkc.com | carly, zach, punam | 1 contact |
| DMG | monique.brunson@dmgincusa.com | carly, zach, punam | 1 contact |
| Coltoys | jparra@coltoys.com | carly, zach, punam | 1 contact |
| Loving Pets | aaron@lovingpetsproducts.com | zach, carly, punam | 1 contact |

---

## Support Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Operations | Michael Kirkus | michael@benebone.com | (732) 993-3955 |
| Support | Grace Williams | grace@ascendaiinnovations.com | - |
| CEO/COO | Paul Nolan | paul@benebone.com | +44 7920 720 105 |

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Sep 12, 2026 | 1.0 | Initial version | Michael Kirkus / Ascend AI |

---

**Last Updated:** September 12, 2026  
**Questions?** Email: grace@ascendaiinnovations.com
