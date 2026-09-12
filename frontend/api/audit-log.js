/**
 * Vercel Serverless Function: Audit Log Manager
 * Endpoint: POST /api/audit-log (create log entry), GET /api/audit-log (read history)
 * 
 * Tracks:
 * - Generation timestamps (ISO format)
 * - Data versions used (which CSV/XLSX files)
 * - SKU-level decisions (why each SKU was included/excluded)
 * - Manual changes (edits by Michael)
 * - Archive (past 52 weeks)
 */

import fs from 'fs'
import path from 'path'

const AUDIT_LOG_FILE = path.join(process.cwd(), 'data', 'audit-log.json')
const ARCHIVE_DIR = path.join(process.cwd(), 'data', 'archive')

/**
 * Initialize audit log if it doesn't exist
 */
function initializeAuditLog() {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      const dir = path.dirname(AUDIT_LOG_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify({
        logs: [],
        lastGeneration: null
      }, null, 2))
    }
  } catch (error) {
    console.error('Error initializing audit log:', error)
  }
}

/**
 * Initialize archive directory
 */
function initializeArchiveDir() {
  try {
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('Error initializing archive directory:', error)
  }
}

/**
 * Read audit log
 */
function readAuditLog() {
  try {
    initializeAuditLog()
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading audit log:', error)
    return { logs: [], lastGeneration: null }
  }
}

/**
 * Write audit log
 */
function writeAuditLog(data) {
  try {
    initializeAuditLog()
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing audit log:', error)
  }
}

/**
 * Create new audit log entry
 */
export function createAuditLogEntry({
  factory,
  timestamp,
  dataVersions,
  skusIncluded,
  skusExcluded,
  totalSkusOnAlert,
  manualChanges = [],
  status = 'GENERATED'
}) {
  const entry = {
    id: `${timestamp}-${factory}`,
    timestamp: new Date(timestamp).toISOString(),
    dateFormatted: new Date(timestamp).toLocaleString(),
    factory,
    dataVersions: {
      snapshot: dataVersions.snapshot || 'BeneBone Inventory Snapshot 20260910191007.csv',
      snapshotDate: dataVersions.snapshotDate || '2026-09-10',
      weeklyReport: dataVersions.weeklyReport || 'Weekly Inventory Report 9-11-2026.xlsx',
      reportDate: dataVersions.reportDate || '2026-09-11',
      planning: dataVersions.planning || 'Benebone Planning Tool September 2026.xlsx',
      planningDate: dataVersions.planningDate || '2026-09-09',
      cpd: dataVersions.cpd || 'Benebone CPD v03.xlsx',
      cpdDate: dataVersions.cpdDate || '2026-08-15',
      poLog: dataVersions.poLog || 'PO & Receiving Log.xlsm',
      poLogDate: dataVersions.poLogDate || '2026-09-10'
    },
    summary: {
      totalSkusOnAlert: totalSkusOnAlert || skusIncluded.length,
      skusIncluded: skusIncluded.length,
      skusExcluded: skusExcluded.length
    },
    decisions: {
      included: skusIncluded.slice(0, 50), // Store first 50 for audit trail
      excluded: skusExcluded.slice(0, 20) // Store first 20 excluded
    },
    manualChanges: manualChanges,
    status: status, // GENERATED, APPROVED, SENT, FAILED
    wordDocGenerated: `Word_Alert_${new Date(timestamp).toISOString().split('T')[0]}_${factory}.docx`,
    approvedBy: null,
    sentAt: null
  }

  return entry
}

/**
 * Log alert generation event
 */
export async function logAlertGeneration(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      factory,
      timestamp,
      dataVersions,
      skusIncluded,
      skusExcluded,
      totalSkusOnAlert,
      manualChanges
    } = req.body

    // Create entry
    const entry = createAuditLogEntry({
      factory,
      timestamp,
      dataVersions,
      skusIncluded,
      skusExcluded,
      totalSkusOnAlert,
      manualChanges
    })

    // Read current log
    const auditLog = readAuditLog()

    // Add entry
    auditLog.logs.push(entry)
    auditLog.lastGeneration = {
      timestamp: entry.timestamp,
      factory: factory,
      skuCount: totalSkusOnAlert
    }

    // Keep only last 52 entries (1 per week)
    if (auditLog.logs.length > 52) {
      auditLog.logs = auditLog.logs.slice(-52)
    }

    // Write back
    writeAuditLog(auditLog)

    // Also archive this generation
    initializeArchiveDir()
    const archiveFile = path.join(ARCHIVE_DIR, `${new Date(timestamp).toISOString().split('T')[0]}-${factory}-alerts.json`)
    fs.writeFileSync(archiveFile, JSON.stringify({
      ...entry,
      archivedAt: new Date().toISOString()
    }, null, 2))

    return res.status(200).json({
      success: true,
      logId: entry.id,
      message: 'Audit log entry created'
    })
  } catch (error) {
    console.error('Error logging alert generation:', error)
    return res.status(500).json({
      error: 'Failed to log alert generation',
      message: error.message
    })
  }
}

/**
 * Get audit log history
 */
export async function getAuditLogHistory(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auditLog = readAuditLog()
    const { factory, limit = 10 } = req.query

    let logs = auditLog.logs

    if (factory) {
      logs = logs.filter(log => log.factory === factory)
    }

    // Return most recent first
    logs = logs.reverse().slice(0, parseInt(limit))

    return res.status(200).json({
      total: auditLog.logs.length,
      returned: logs.length,
      lastGeneration: auditLog.lastGeneration,
      logs: logs
    })
  } catch (error) {
    console.error('Error reading audit log history:', error)
    return res.status(500).json({
      error: 'Failed to read audit log',
      message: error.message
    })
  }
}

/**
 * Get week-over-week comparison
 */
export async function getWeekOverWeekComparison(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auditLog = readAuditLog()
    const { factory } = req.query

    let logs = auditLog.logs.filter(log => log.factory === factory).reverse()

    if (logs.length < 2) {
      return res.status(200).json({
        comparison: null,
        message: 'Not enough data for comparison'
      })
    }

    const thisWeek = logs[0]
    const lastWeek = logs[1]

    const comparison = {
      thisWeek: {
        date: thisWeek.dateFormatted,
        factory: thisWeek.factory,
        totalSkus: thisWeek.summary.totalSkusOnAlert
      },
      lastWeek: {
        date: lastWeek.dateFormatted,
        factory: lastWeek.factory,
        totalSkus: lastWeek.summary.totalSkusOnAlert
      },
      change: {
        absolute: thisWeek.summary.totalSkusOnAlert - lastWeek.summary.totalSkusOnAlert,
        percentage: ((thisWeek.summary.totalSkusOnAlert - lastWeek.summary.totalSkusOnAlert) / lastWeek.summary.totalSkusOnAlert * 100).toFixed(1),
        trend: thisWeek.summary.totalSkusOnAlert < lastWeek.summary.totalSkusOnAlert ? 'IMPROVING' : thisWeek.summary.totalSkusOnAlert > lastWeek.summary.totalSkusOnAlert ? 'WORSENING' : 'STABLE'
      }
    }

    return res.status(200).json(comparison)
  } catch (error) {
    console.error('Error calculating week-over-week comparison:', error)
    return res.status(500).json({
      error: 'Failed to calculate comparison',
      message: error.message
    })
  }
}

/**
 * Update audit log entry (e.g., mark as approved/sent)
 */
export async function updateAuditLogEntry(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { logId, status, approvedBy, sentAt } = req.body

    const auditLog = readAuditLog()
    const entry = auditLog.logs.find(log => log.id === logId)

    if (!entry) {
      return res.status(404).json({ error: 'Log entry not found' })
    }

    entry.status = status || entry.status
    entry.approvedBy = approvedBy || entry.approvedBy
    entry.sentAt = sentAt || entry.sentAt

    writeAuditLog(auditLog)

    return res.status(200).json({
      success: true,
      message: 'Audit log entry updated',
      entry: entry
    })
  } catch (error) {
    console.error('Error updating audit log entry:', error)
    return res.status(500).json({
      error: 'Failed to update audit log entry',
      message: error.message
    })
  }
}

/**
 * Export handler for Vercel
 */
export default async function handler(req, res) {
  const { action } = req.query

  switch (action) {
    case 'log':
      return logAlertGeneration(req, res)
    case 'history':
      return getAuditLogHistory(req, res)
    case 'comparison':
      return getWeekOverWeekComparison(req, res)
    case 'update':
      return updateAuditLogEntry(req, res)
    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}
