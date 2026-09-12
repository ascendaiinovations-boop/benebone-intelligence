/**
 * Vercel Serverless Function: Archive & Retention
 * Endpoint: GET /api/archive (query), GET /api/archive/export (download)
 * 
 * Tracks:
 * - Past 52 weeks of alerts
 * - Week-over-week comparison and trends
 * - SKU trend analysis
 * - Export to CSV/Excel
 */

import fs from 'fs'
import path from 'path'

const ARCHIVE_DIR = path.join(process.cwd(), 'data', 'archive')
const INDEX_FILE = path.join(ARCHIVE_DIR, 'archive-index.json')

/**
 * Initialize archive directory
 */
function initializeArchiveDir() {
  try {
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true })
    }
    if (!fs.existsSync(INDEX_FILE)) {
      fs.writeFileSync(INDEX_FILE, JSON.stringify({
        weeks: [],
        lastUpdate: null,
        totalWeeks: 0
      }, null, 2))
    }
  } catch (error) {
    console.error('Error initializing archive directory:', error)
  }
}

/**
 * Read archive index
 */
function readArchiveIndex() {
  try {
    initializeArchiveDir()
    const content = fs.readFileSync(INDEX_FILE, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading archive index:', error)
    return { weeks: [], lastUpdate: null, totalWeeks: 0 }
  }
}

/**
 * Get all archived weeks
 */
export async function getArchivedWeeks(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const archiveIndex = readArchiveIndex()
    const { limit = 52 } = req.query

    // Get list of all archive files
    initializeArchiveDir()
    let files = []
    try {
      files = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => f.match(/\d{4}-\d{2}-\d{2}-.*-alerts\.json/))
        .sort()
        .reverse()
        .slice(0, parseInt(limit))
    } catch (readErr) {
      // Directory might not exist yet or be empty, that's okay
      files = []
    }

    const weeks = files.map(file => {
      const filePath = path.join(ARCHIVE_DIR, file)
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      return {
        date: content.timestamp.split('T')[0],
        dateFormatted: new Date(content.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        factory: content.factory,
        totalSkus: content.summary.totalSkusOnAlert,
        skusIncluded: content.summary.skusIncluded,
        skusExcluded: content.summary.skusExcluded,
        file: file
      }
    })

    return res.status(200).json({
      total: archiveIndex.totalWeeks,
      returned: weeks.length,
      weeks: weeks
    })
  } catch (error) {
    console.error('Error getting archived weeks:', error)
    return res.status(500).json({
      error: 'Failed to get archived weeks',
      message: error.message
    })
  }
}

/**
 * Get archive details for a specific week
 */
export async function getWeekDetails(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { date, factory } = req.query

    if (!date || !factory) {
      return res.status(400).json({ error: 'Missing date or factory parameter' })
    }

    initializeArchiveDir()
    const fileName = `${date}-${factory}-alerts.json`
    const filePath = path.join(ARCHIVE_DIR, fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archive file not found' })
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    return res.status(200).json({
      date: content.timestamp.split('T')[0],
      factory: content.factory,
      timestamp: content.timestamp,
      dataVersions: content.dataVersions,
      summary: content.summary,
      topSkusOnAlert: content.decisions.included.slice(0, 20),
      samplesExcluded: content.decisions.excluded.slice(0, 5),
      manualChanges: content.manualChanges || []
    })
  } catch (error) {
    console.error('Error getting week details:', error)
    return res.status(500).json({
      error: 'Failed to get week details',
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
    const { factory } = req.query

    if (!factory) {
      return res.status(400).json({ error: 'Missing factory parameter' })
    }

    initializeArchiveDir()
    const files = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.includes(`-${factory}-alerts.json`))
      .sort()
      .reverse()
      .slice(0, 2) // Get last 2 weeks

    if (files.length < 2) {
      return res.status(200).json({
        comparison: null,
        message: 'Not enough data for comparison'
      })
    }

    const thisWeek = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, files[0]), 'utf8'))
    const lastWeek = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, files[1]), 'utf8'))

    const absolute = thisWeek.summary.totalSkusOnAlert - lastWeek.summary.totalSkusOnAlert
    const percentage = lastWeek.summary.totalSkusOnAlert > 0
      ? ((absolute / lastWeek.summary.totalSkusOnAlert) * 100).toFixed(1)
      : 0

    const comparison = {
      thisWeek: {
        date: thisWeek.timestamp.split('T')[0],
        dateFormatted: new Date(thisWeek.timestamp).toLocaleDateString(),
        factory: thisWeek.factory,
        totalSkus: thisWeek.summary.totalSkusOnAlert
      },
      lastWeek: {
        date: lastWeek.timestamp.split('T')[0],
        dateFormatted: new Date(lastWeek.timestamp).toLocaleDateString(),
        factory: lastWeek.factory,
        totalSkus: lastWeek.summary.totalSkusOnAlert
      },
      change: {
        absolute: absolute,
        percentage: percentage,
        trend: absolute < 0 ? 'IMPROVING ✓' : absolute > 0 ? 'WORSENING ✗' : 'STABLE =',
        direction: absolute < 0 ? 'down' : absolute > 0 ? 'up' : 'stable'
      },
      summary: `${factory}: ${thisWeek.summary.totalSkusOnAlert} SKUs this week vs ${lastWeek.summary.totalSkusOnAlert} last week (${absolute > 0 ? '+' : ''}${absolute}, ${percentage}%)`
    }

    return res.status(200).json(comparison)
  } catch (error) {
    console.error('Error getting week-over-week comparison:', error)
    return res.status(500).json({
      error: 'Failed to get week-over-week comparison',
      message: error.message
    })
  }
}

/**
 * Get SKU trend over past weeks
 */
export async function getSKUTrend(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sku, factory, weeks = 12 } = req.query

    if (!sku || !factory) {
      return res.status(400).json({ error: 'Missing sku or factory parameter' })
    }

    initializeArchiveDir()
    const archiveFiles = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.includes(`-${factory}-alerts.json`))
      .sort()
      .reverse()
      .slice(0, parseInt(weeks))

    const trend = {
      sku: sku,
      factory: factory,
      weeksAnalyzed: archiveFiles.length,
      history: []
    }

    for (const file of archiveFiles) {
      const content = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf8'))
      const date = content.timestamp.split('T')[0]

      // Search in included SKUs
      const skuData = content.decisions.included.find(s => s.sku === sku)

      if (skuData) {
        trend.history.push({
          date: date,
          dateFormatted: new Date(content.timestamp).toLocaleDateString(),
          status: 'ON_ALERT',
          mos: skuData.mos,
          mosCritical: skuData.mos < 1.0,
          threshold: factory === 'AIM' ? 1.5 : 2.0
        })
      } else {
        // SKU not on alert this week
        trend.history.push({
          date: date,
          dateFormatted: new Date(content.timestamp).toLocaleDateString(),
          status: 'OK',
          mos: null,
          mosCritical: false,
          threshold: factory === 'AIM' ? 1.5 : 2.0
        })
      }
    }

    // Analyze trend
    const onAlertCount = trend.history.filter(h => h.status === 'ON_ALERT').length
    const mosValues = trend.history.filter(h => h.mos !== null).map(h => h.mos)

    trend.analysis = {
      weeksOnAlert: onAlertCount,
      weeksOK: trend.history.length - onAlertCount,
      status: onAlertCount > trend.history.length * 0.6 ? 'CRITICAL' : onAlertCount > 0 ? 'CONCERNING' : 'HEALTHY',
      trend: mosValues.length > 1 && mosValues[0] > mosValues[mosValues.length - 1] ? 'IMPROVING' : mosValues.length > 1 ? 'WORSENING' : 'STABLE',
      avgMos: mosValues.length > 0 ? (mosValues.reduce((a, b) => a + b) / mosValues.length).toFixed(2) : 'N/A'
    }

    return res.status(200).json(trend)
  } catch (error) {
    console.error('Error getting SKU trend:', error)
    return res.status(500).json({
      error: 'Failed to get SKU trend',
      message: error.message
    })
  }
}

/**
 * Export archive to CSV
 */
export async function exportArchiveCSV(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { date, factory } = req.query

    if (!date || !factory) {
      return res.status(400).json({ error: 'Missing date or factory parameter' })
    }

    initializeArchiveDir()
    const fileName = `${date}-${factory}-alerts.json`
    const filePath = path.join(ARCHIVE_DIR, fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archive file not found' })
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    // Build CSV
    let csv = 'SKU,Description,MOS,Threshold,Status,OnHand,Available,AvgMonthlySales,Notes\n'

    content.decisions.included.forEach(sku => {
      const row = [
        sku.sku || '',
        sku.description || '',
        sku.mos || '',
        factory === 'AIM' ? '1.5' : '2.0',
        'INCLUDED',
        sku.onHand || '',
        sku.available || '',
        sku.avgMonthlySales || '',
        sku.notes || ''
      ]
      csv += row.map(col => `"${col}"`).join(',') + '\n'
    })

    // Send as download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="Weekly_Alerts_${date}_${factory}.csv"`)
    return res.status(200).send(csv)
  } catch (error) {
    console.error('Error exporting archive CSV:', error)
    return res.status(500).json({
      error: 'Failed to export archive',
      message: error.message
    })
  }
}

/**
 * Get factory comparison (all factories this week)
 */
export async function getFactoryComparison(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter' })
    }

    initializeArchiveDir()
    const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']

    const comparison = {
      date: date,
      factories: {}
    }

    for (const factory of factories) {
      const fileName = `${date}-${factory}-alerts.json`
      const filePath = path.join(ARCHIVE_DIR, fileName)

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        comparison.factories[factory] = {
          totalSkus: content.summary.totalSkusOnAlert,
          threshold: factory === 'AIM' ? '≤1.5 MOS' : '≤2.0 MOS'
        }
      } else {
        comparison.factories[factory] = {
          totalSkus: 0,
          threshold: factory === 'AIM' ? '≤1.5 MOS' : '≤2.0 MOS'
        }
      }
    }

    const totalSkus = Object.values(comparison.factories).reduce((sum, f) => sum + f.totalSkus, 0)
    comparison.summary = {
      totalSkus: totalSkus,
      factoriesWithAlerts: Object.values(comparison.factories).filter(f => f.totalSkus > 0).length,
      averagePerFactory: (totalSkus / factories.length).toFixed(1)
    }

    return res.status(200).json(comparison)
  } catch (error) {
    console.error('Error getting factory comparison:', error)
    return res.status(500).json({
      error: 'Failed to get factory comparison',
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
    case 'weeks':
      return getArchivedWeeks(req, res)
    case 'details':
      return getWeekDetails(req, res)
    case 'comparison':
      return getWeekOverWeekComparison(req, res)
    case 'sku-trend':
      return getSKUTrend(req, res)
    case 'export-csv':
      return exportArchiveCSV(req, res)
    case 'factory-comparison':
      return getFactoryComparison(req, res)
    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}
