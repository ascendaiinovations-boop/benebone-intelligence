# Phase 2 Migration Plan: FTP + Auto-Send

**Document:** Phase 1.5 → Phase 2 Staged Rollout  
**Timeline:** 2 weeks  
**Coordinator:** Michael Kirkus  
**Support:** Grace Williams  
**Start Date:** [TBD - when Phase 2 code is ready]

---

## Executive Summary

**Phase 1.5** (Current): Manual Word doc generation  
**Phase 2** (Target): Automated FTP pull + auto-send via Resend API  
**Risk Level:** Medium (automation adds complexity)  
**Mitigation:** 2-week staged rollout with dry run + kill switch

---

## Pre-Migration Checklist

Before starting migration, verify:

- [ ] All 6 Michael Kirkus requirements implemented (Data Quality, Audit Log, Runbook, Performance, Rollback, Archive)
- [ ] Phase 2 code is complete and tested
- [ ] FTP credentials are working (test connection)
- [ ] Dropbox API token is valid (test auth)
- [ ] Resend API key is active (test email send)
- [ ] Email template is updated for automated sends
- [ ] All 8 factory recipients verified in database
- [ ] Kill switch script is tested and ready
- [ ] Monitoring dashboard is live and collecting data
- [ ] Michael has signed off: "Ready to proceed"

---

## Migration Timeline: 2 Weeks

### WEEK 1: DRY RUN (No Real Emails Sent)

#### Day 1-2: Enable Phase 2 Code in Test Environment

**Goals:**
- Load Phase 2 code into test/staging server
- Verify FTP connection works
- Verify Dropbox API works
- Verify data loads correctly

**Steps:**

1. Deploy Phase 2 code to staging.benebone-intelligence.vercel.app (or test server)

2. Test FTP Connection:
   ```
   FTP Server: [warehouse FTP address]
   Username: [credentials from Michael]
   Password: [credentials from Michael]
   Folder: /inventory/snapshots/
   
   Action: Try to download latest CSV
   Expected: Successfully retrieve file
   ```

3. Test Dropbox API:
   ```
   API Token: [from Michael]
   Folder: /Benebone/Operations/Tools/#Inventory/USA Benebone LLC/Weekly Alert
   
   Action: List files in folder
   Expected: See CSV and XLSX files
   ```

4. Test Data Load:
   ```
   FTP Pull: Fetch latest Snapshot CSV
   Dropbox Fetch: Fetch latest Weekly Report XLSX
   Parse: Merge into 782 SKUs
   Validate: Data Quality Score ≥95%
   
   Expected: All steps complete in <5 minutes
   ```

5. **Status Check:**
   - ✅ All connections successful
   - ✅ Data loads correctly
   - ✅ Quality validation passes
   - ✅ No errors in logs

**If failures:** Fix in code, re-test. Do NOT proceed until all tests pass.

---

#### Day 3-5: Test Emails Sent to Michael Only

**Goals:**
- Generate 8 factory emails from Phase 2
- Send to Michael as test
- Michael verifies content and formatting

**Steps:**

1. Trigger alert generation (Phase 2 mode):
   ```
   System runs: FTP pull → Dropbox fetch → Data merge → Validation → Alert gen
   ```

2. Generate Word/email for all 8 factories

3. **Send test emails to Michael:**
   - TO: michael@benebone.com
   - Subject: "[TEST] Benebone Weekly Alert - [Factory Name]"
   - Body: Same as production email
   - Include: "This is a TEST email. Do NOT forward to actual factory."

4. Michael reviews each email:
   - Is formatting correct?
   - Are recipients correct?
   - Are SKU numbers correct?
   - Are MOS values correct?
   - Any missing data?

5. Michael approves via email:
   "All emails look good. Ready for next phase."

**If issues found:** Fix code, regenerate emails, retry.

---

#### Day 6-7: Extended Dry Run - Simulate Production Timing

**Goals:**
- Run Phase 2 process on production schedule
- Test FTP/Dropbox reliability (pull consistency)
- Test error handling (corrupt file, FTP timeout)
- Verify data freshness

**Steps:**

1. **Run on production schedule:**
   - Day 6: Run at 7:02 AM (daily refresh time)
   - Day 6: Run at 7:34 AM (weekly send time)
   - Day 7: Repeat both runs
   - Total: 4 successful runs required

2. **Verify data freshness:**
   - Check that FTP pulls latest Snapshot CSV
   - Check that Dropbox pulls latest files
   - Check timestamps are current

3. **Test error handling:**
   - Simulate corrupt CSV (put garbage data, see if validation catches it)
   - Simulate FTP timeout (disconnect during pull, see if system retries)
   - Simulate missing Dropbox file (remove file, verify error alerting)

4. **Monitor performance:**
   - Each run should complete in <5 minutes
   - Log times in performance dashboard
   - Alert if >10 minutes, error if >30 minutes

5. **Status Check:**
   - ✅ 4 runs completed successfully
   - ✅ All error scenarios handled gracefully
   - ✅ Data freshness confirmed
   - ✅ Performance meets SLA

**If issues found:** Fix and retry. Must have 4 successful consecutive runs before proceeding.

---

### WEEK 2: STAGED ROLLOUT (Real Emails to Real Factories)

#### Day 8: Early Adopter Phase (1 Factory)

**Goals:**
- Send to 1 test factory
- Verify they receive email
- Verify they can open/read it
- Get feedback

**Steps:**

1. **Select early adopter factory:**
   - Recommendation: Coltoys or Loving Pets
   - These factories have smaller operations (less critical)

2. **Enable auto-send for Coltoys only:**
   - Set: `SEND_TO_FACTORIES=["Coltoys"]`
   - All other factories still in draft mode (not sent)

3. **Run alert generation (production):**
   - System fetches latest data from FTP/Dropbox
   - Generates alert for all 8 factories
   - **Sends email ONLY to Coltoys**
   - Other 7 factories: Word doc created but NOT sent

4. **Verify receipt:**
   - Call jparra@coltoys.com or check email
   - Confirm they received alert
   - Ask: "Does email look correct? Can you open attachment if any?"

5. **Monitor for issues:**
   - Email delivered successfully? (check Resend API logs)
   - Email read/opened? (track open rate if available)
   - Did they respond with questions? (check for replies)

6. **Status Check:**
   - ✅ Email sent and received
   - ✅ Format is correct
   - ✅ SKU data is accurate
   - ✅ No negative feedback

**If issues found:** Disable auto-send, investigate, fix, then retry with Coltoys.

---

#### Day 9-10: Expand to 3 More Factories (4 Total)

**Goals:**
- Increase from 1 to 4 factories
- Monitor for patterns/issues at scale
- Build confidence

**Steps:**

1. **Expand to 3 more factories:**
   - Coltoys (already proven)
   - + LTM (chosen for variety)
   - + Bennett (chosen for variety)
   - + DMG (chosen for variety)

2. **Set:** `SEND_TO_FACTORIES=["Coltoys", "LTM", "Bennett", "DMG"]`

3. **Run alert generation (production):**
   - System sends to 4 factories
   - Other 4 factories still draft only

4. **Monitor all 4 emails:**
   - Check Resend API logs for delivery status
   - Spot-check recipient lists
   - Verify SKU counts per factory
   - Look for any duplicates/anomalies

5. **Collect feedback (optional):**
   - Email factories: "Did you receive? Any issues?"
   - Keep feedback log

6. **Status Check:**
   - ✅ All 4 delivered successfully
   - ✅ No issues reported
   - ✅ Performance still within SLA
   - ✅ Audit logs show correct decisions

**If issues found:** Disable auto-send for problematic factory, investigate, fix.

---

#### Day 11-12: Full Production Rollout (All 8 Factories)

**Goals:**
- All 8 factories receiving automated emails
- Confirm system is production-ready

**Steps:**

1. **Enable all 8 factories:**
   - `SEND_TO_FACTORIES=["AIM", "Midbury", "LTM", "201", "Bennett", "DMG", "Coltoys", "Loving Pets"]`

2. **Run final alert generation:**
   - System pulls latest data (FTP + Dropbox)
   - Generates + sends emails to all 8 factories
   - This is production mode

3. **Verify all deliveries:**
   - Check Resend API: all 8 emails delivered
   - Check audit log: all 8 logged correctly
   - Check performance: <5 minute total time

4. **Monitor closely:**
   - Set up alerts for failures
   - Watch for unexpected bounces/delivery issues
   - Have Michael on standby to revert if needed

5. **Status Check:**
   - ✅ All 8 emails sent
   - ✅ All 8 acknowledged as delivered
   - ✅ No errors or failures
   - ✅ All SLAs met

**If critical issues found:** See "Kill Switch" section below.

---

#### Day 13-14: Monitor & Stabilize

**Goals:**
- Run 2 more days of production to ensure stability
- Collect final feedback
- Document any issues for future improvement

**Steps:**

1. **Continue production mode:**
   - Run Day 13 and Day 14 (if weekly schedule allows)
   - If not, just monitor existing runs

2. **Collect feedback:**
   - Email from factories: Any issues?
   - Michael feedback: Everything looking good?

3. **Review audit logs:**
   - All alerts logged correctly
   - SKU decisions are accurate
   - Recipients are correct

4. **Performance review:**
   - Look at last 5 runs
   - Average time: should be <5 min
   - Any violations? Investigate

5. **Go/No-Go Decision:**
   - Michael: "Phase 2 is stable. Approved for ongoing production."
   - If issues remain, stay in Phase 1.5 until resolved

---

## Kill Switch: Emergency Rollback

### If Phase 2 Breaks at ANY Point

**Trigger (any of these):**
- FTP pull fails 2x in a row
- Resend API returns errors for >2 factories
- Data quality validation fails suddenly
- Word doc generation fails
- Email recipients list is corrupted
- Any critical error in logs

**Emergency Response (follow exactly):**

### Step 1: Immediate Alert (Within 5 Minutes)

1. **Alert Michael:**
   ```
   Subject: URGENT - Phase 2 System Down
   Message: "Phase 2 auto-send has failed. Reverting to Phase 1. Details: [brief description]"
   Method: Call (732-993-3955) + Email
   ```

2. **Trigger Kill Switch:**
   ```
   Set environment: PHASE=1
   Restart system
   Verify: Phase 1 code is running
   ```

### Step 2: Revert to Phase 1 (within 5-10 Minutes)

1. **Phase 1 recovery:**
   - Stop Phase 2 auto-send process
   - Switch to Phase 1 mode (manual Word doc only)
   - Disable `SEND_TO_FACTORIES` env var
   - System back to manual operation

2. **Generate manual alerts:**
   - Use Phase 1 UI
   - Generate Word docs manually
   - Michael sends via copy-paste to Outlook
   - Send to all factories manually

3. **Notify factories:**
   - Email: "Weekly alert being sent manually this week due to system maintenance"
   - Still get the alerts, just via manual email

### Step 3: Root Cause Analysis (Next 24 Hours)

1. **Investigate what went wrong:**
   - Check error logs
   - Check FTP connection
   - Check Dropbox API
   - Check Resend API
   - Check data quality

2. **Document the incident:**
   - What failed?
   - When did it fail?
   - What triggered the failure?
   - How long was it down?

3. **Fix the issue:**
   - Code fix if needed
   - Credentials update if needed
   - Configuration change if needed

4. **Test the fix:**
   - Run Phase 2 in test environment
   - Verify the issue is resolved
   - Get Michael's approval

### Step 4: Restart Phase 2 (After Fix Verified)

1. **Careful restart:**
   - Start with 1 factory (early adopter approach again)
   - Monitor closely
   - Only expand after success

2. **Report to Paul:**
   - "Phase 2 had an incident. Here's what happened and how we fixed it."

---

## Health Checks: Before Each Phase Transition

**Must PASS all before proceeding:**

### FTP Connection Test
```
Test: Try to download latest Snapshot CSV
Expected: Success within 30 seconds
Command: sftp -i key user@ftp.warehouse.com
         ls -la /inventory/snapshots/
         get BeneBone_Inventory_Snapshot_*.csv
```

### Dropbox API Test
```
Test: List files in /Benebone/Operations/Tools/#Inventory/USA Benebone LLC/Weekly Alert/
Expected: Success, find latest .xlsx file
Response: {"files": [...], "count": >5}
```

### Resend API Test
```
Test: Send test email to michael@benebone.com
Expected: Delivered successfully
Response: {"statusCode": 200, "messageId": "..."}
```

### Data Quality Test
```
Test: Validate loaded data
Expected: Quality Score ≥95%
Check: SKU count (750-810), descriptions (>90%), all 8 factories
```

### Word Doc Generation Test
```
Test: Generate Word doc for AIM factory
Expected: File created, contains correct SKUs, formatting correct
Output: .docx file, >50KB, opens in Word
```

**Passing = All 5 tests successful**  
**Failing = Stop, investigate, fix, re-test**

---

## Rollback Procedure: One-Command Kill Switch

**File: `/scripts/rollback.sh`**

```bash
#!/bin/bash
# Emergency Rollback Script
# Usage: ./rollback.sh
# Effect: Reverts from Phase 2 back to Phase 1 in <5 minutes

echo "🚨 EMERGENCY ROLLBACK INITIATED 🚨"
echo "Reverting from Phase 2 to Phase 1..."

# 1. Set environment to Phase 1
export PHASE=1
export AUTO_SEND=false
export SEND_TO_FACTORIES=[]

# 2. Disable FTP/Dropbox automation
export FTP_ENABLED=false
export DROPBOX_API_ENABLED=false
export RESEND_API_ENABLED=false

# 3. Restart application
echo "Restarting application in Phase 1 mode..."
pkill -f "node.*benebone-intelligence"
sleep 2

# 4. Start Phase 1 server
npm start &

# 5. Verify Phase 1 is running
sleep 5
curl http://localhost:3000/api/data-quality

echo "✅ ROLLBACK COMPLETE"
echo "System is now in Phase 1 (manual Word doc generation)"
echo "Contact: michael@benebone.com (732-993-3955)"
echo "Root cause analysis: TODO"
```

**How to use:**
```
cd /path/to/benebone-intelligence
chmod +x scripts/rollback.sh
./rollback.sh
```

**Time to revert:** <5 minutes  
**Who can run:** Michael or Grace (credentials in 1Password)

---

## Monitoring During Migration

### During Week 1 (Dry Run)

**Monitor:**
- FTP connection stability
- Dropbox API response times
- Data load times
- Error logs for warnings

**Alert thresholds:**
- FTP pull >60 seconds = WARN
- Dropbox API >30 seconds = WARN
- Any exceptions = CRITICAL

### During Week 2 (Rollout)

**Monitor:**
- Email delivery status (check Resend API logs every hour)
- Email open rates (if available)
- Recipient feedback (check for replies)
- Performance times (should stay <5 min)

**Alert contacts:**
- P1 (Critical): michael@benebone.com, call (732-993-3955)
- P2 (Warning): grace@ascendaiinnovations.com

---

## Communication Plan

### Daily Updates to Michael

**Dry Run Week (Days 1-7):**
```
Daily email at EOD:
Subject: Phase 2 Dry Run - Day X Status
Content:
- Tests completed today: [list]
- Status: [PASS/FAIL]
- Issues found: [list or "None"]
- Next steps: [tomorrow's plan]
- Recommendation: Continue / Hold / Escalate
```

### Weekly Steering Committee (Optional)

If Paul wants visibility:
```
End of Week 1 (Day 7) Readout:
- Dry run summary (7 days of testing)
- All tests passed or issues resolved
- Ready to proceed to production rollout

End of Week 2 (Day 14) Final Report:
- 7 days of production Phase 2 running
- All 8 factories receiving emails successfully
- Performance metrics
- Incidents: [list or "None"]
- Recommendation: Approve Phase 2 as permanent
```

---

## Post-Migration Checklist

Once Phase 2 is stable for 7+ days:

- [ ] All 8 factories confirmed receiving emails
- [ ] Zero critical incidents
- [ ] Performance consistently <5 min
- [ ] Data Quality Score ≥95% every run
- [ ] Audit logs show correct decisions
- [ ] Archive is growing with each week
- [ ] Michael has given final approval
- [ ] Paul has been briefed on success
- [ ] Runbook updated if needed
- [ ] Performance dashboard shows healthy trend

**Sign-Off:**

Michael Kirkus, Director of Operations: ___________  
Date: ___________

Paul Nolan, CEO/COO: ___________  
Date: ___________

---

## FAQ During Migration

### Q: What if a factory doesn't receive their email?

**During Week 1 (Dry Run):**
- This is expected behavior (test environment)
- Make note, fix, retry

**During Week 2 (Rollout):**
- Activate kill switch immediately
- Revert to Phase 1
- Debug the issue (bad email, typo in recipient, API failure)
- Get email to factory via manual process
- Fix in code, then retry Phase 2

### Q: What if generation takes >5 minutes?

**Check in order:**
1. FTP pull taking too long? (check warehouse)
2. Dropbox API slow? (check Dropbox status page)
3. Code is inefficient? (optimize, cache, parallelize)

**Action:**
- <5 min = OK, monitor
- 5-10 min = WARN, investigate
- >10 min = CRITICAL, activate kill switch

### Q: What if email shows wrong recipients?

**Immediate action:**
1. Activate kill switch
2. Revert to Phase 1
3. Manually fix recipient list in database
4. Verify all 8 factories have correct emails
5. Re-test before Phase 2 restart

---

## Success Criteria

**Phase 2 is considered successful when:**

1. ✅ All 8 factories receive emails every week
2. ✅ 99.5% delivery success rate (8 emails × 52 weeks = 416, can miss 2)
3. ✅ Generation time <5 min every week
4. ✅ Data Quality Score ≥95% every week
5. ✅ Zero critical incidents in first month
6. ✅ Michael signs off: "This is better than manual"
7. ✅ Factories report happy with automation

---

**Document Owner:** Michael Kirkus  
**Last Updated:** September 12, 2026  
**Questions:** michael@benebone.com
