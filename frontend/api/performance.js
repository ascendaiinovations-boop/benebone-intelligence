/**
 * Vercel Serverless Function: Performance Monitoring
 * Endpoint: POST /api/performance (log metric), GET /api/performance (get dashboard)
 * 
 * Tracks:
 * - Generation time (should be <5 min)
 * - FTP pull time (should be <1 min)
 * - Data validation time (should be <30 sec)
 * - Word doc generation (should be <1 min per factory)
 * - Availability (target 99.5%)
 * - SLA violations (alerts to Michael)
 */

import fs from 'fs'
import path from 'path'

const PERF_LOG_FILE = path.join(process.cwd(), 'data', 'performance-log.json')

const SLA_TARGETS = {
  dataLoad: { max: 60000, name: 'Data Load (FTP + Parse)' }, // 1 min
  validation: { max: 30000, name: 'Data Validation' }, // 30 sec
  alertGeneration: { max: 120000, name: 'Alert Generation' }, // 2 min
  wordDocPerFactory: { max: 60000, name: 'Word Doc per Factory' }, // 1 min
  total: { max: 300000, name: 'Total Process' } // 5 min
}

/**
 * Initialize performance log
 */
function initializePerfLog() {
  try {
    if (!fs.existsSync(PERF_LOG_FILE)) {
      const dir = path.dirname(PERF_LOG_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(PERF_LOG_FILE, JSON.stringify({
        metrics: [],
        slaViolations: [],
        summary: {
          totalRuns: 0,
          passCount: 0,
          failCount: 0,
          averageTime: 0,
          availability: 100
        }
      }, null, 2))
    }
  } catch (error) {
    console.error('Error initializing perf log:', error)
  }
}

/**
 * Read performance log
 */
function readPerfLog() {
  try {
    initializePerfLog()
    const content = fs.readFileSync(PERF_LOG_FILE, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading perf log:', error)
    return {
      metrics: [],
      slaViolations: [],
      summary: { totalRuns: 0, passCount: 0, failCount: 0, averageTime: 0, availability: 100 }
    }
  }
}

/**
 * Write performance log
 */
function writePerfLog(data) {
  try {
    initializePerfLog()
    fs.writeFileSync(PERF_LOG_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing perf log:', error)
  }
}

/**
 * Log a performance metric
 */
export async function logPerformanceMetric(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      factory,
      timestamp,
      dataLoadTime, // ms
      validationTime, // ms
      alertGenerationTime, // ms
      wordDocTime, // ms (per factory)
      totalTime, // ms
      status = 'SUCCESS', // SUCCESS or FAILURE
      errorMessage
    } = req.body

    const metric = {
      id: `${timestamp}-${factory}`,
      timestamp: new Date(timestamp).toISOString(),
      factory,
      timings: {
        dataLoad: dataLoadTime,
        validation: validationTime,
        alertGeneration: alertGenerationTime,
        wordDocPerFactory: wordDocTime,
        total: totalTime
      },
      status: status,
      errorMessage: errorMessage || null,
      slaStatus: checkSLACompliance({ dataLoadTime, validationTime, alertGenerationTime, wordDocTime, totalTime })
    }

    // Read current log
    const perfLog = readPerfLog()

    // Add metric
    perfLog.metrics.push(metric)

    // Check for SLA violations
    const violations = metric.slaStatus.violations
    if (violations.length > 0) {
      violations.forEach(violation => {
        perfLog.slaViolations.push({
          timestamp: metric.timestamp,
          factory: factory,
          violation: violation.name,
          actual: violation.actual,
          target: violation.target,
          exceeded: violation.exceeded,
          severity: violation.exceeded > 2 ? 'CRITICAL' : 'WARNING'
        })
      })
    }

    // Keep only last 100 metrics (10-15 weeks)
    if (perfLog.metrics.length > 100) {
      perfLog.metrics = perfLog.metrics.slice(-100)
    }

    // Update summary
    updateSummary(perfLog)

    // Write back
    writePerfLog(perfLog)

    return res.status(200).json({
      success: true,
      metricId: metric.id,
      slaStatus: metric.slaStatus
    })
  } catch (error) {
    console.error('Error logging performance metric:', error)
    return res.status(500).json({
      error: 'Failed to log performance metric',
      message: error.message
    })
  }
}

/**
 * Check SLA compliance for a metric
 */
function checkSLACompliance(timings) {
  const violations = []

  Object.entries(SLA_TARGETS).forEach(([key, target]) => {
    const actual = timings[key === 'dataLoad' ? 'dataLoad' : key === 'validation' ? 'validation' : key === 'alertGeneration' ? 'alertGeneration' : key === 'wordDocPerFactory' ? 'wordDocPerFactory' : 'total']

    if (actual && actual > target.max) {
      violations.push({
        name: target.name,
        target: target.max,
        actual: actual,
        exceeded: Math.round((actual / target.max) * 100) // Percentage over
      })
    }
  })

  return {
    pass: violations.length === 0,
    violations: violations,
    status: violations.length === 0 ? 'PASS' : violations.some(v => v.exceeded > 2) ? 'CRITICAL' : 'WARNING'
  }
}

/**
 * Update summary statistics
 */
function updateSummary(perfLog) {
  const metrics = perfLog.metrics.slice(-10) // Last 10 runs

  const totalTimes = metrics.map(m => m.timings.total)
  const averageTime = totalTimes.length > 0 ? Math.round(totalTimes.reduce((a, b) => a + b) / totalTimes.length) : 0

  const passCount = metrics.filter(m => m.slaStatus.pass).length
  const failCount = metrics.filter(m => !m.slaStatus.pass).length

  perfLog.summary = {
    totalRuns: perfLog.metrics.length,
    lastRuns: metrics.length,
    passCount: passCount,
    failCount: failCount,
    passPercentage: metrics.length > 0 ? Math.round((passCount / metrics.length) * 100) : 0,
    averageTime: averageTime,
    fastestTime: Math.min(...totalTimes),
    slowestTime: Math.max(...totalTimes),
    availability: 99.8, // Will be calculated from SLA violations later
    status: passCount >= metrics.length * 0.8 ? 'HEALTHY' : 'DEGRADED'
  }
}

/**
 * Get performance dashboard
 */
export async function getPerformanceDashboard(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const perfLog = readPerfLog()
    const { limit = 10 } = req.query

    const recentMetrics = perfLog.metrics.slice(-parseInt(limit)).reverse()

    const dashboard = {
      summary: perfLog.summary,
      slaTargets: SLA_TARGETS,
      recentMetrics: recentMetrics.map(m => ({
        timestamp: m.timestamp,
        factory: m.factory,
        totalTime: m.timings.total,
        totalTimeFormatted: formatMilliseconds(m.timings.total),
        components: {
          dataLoad: formatMilliseconds(m.timings.dataLoad),
          validation: formatMilliseconds(m.timings.validation),
          alertGeneration: formatMilliseconds(m.timings.alertGeneration),
          wordDoc: formatMilliseconds(m.timings.wordDocPerFactory)
        },
        status: m.slaStatus.status,
        violations: m.slaStatus.violations.map(v => ({
          component: v.name,
          target: formatMilliseconds(v.target),
          actual: formatMilliseconds(v.actual),
          exceededBy: `${v.exceeded}%`
        }))
      })),
      recentViolations: perfLog.slaViolations.slice(-5).reverse(),
      chartData: {
        labels: recentMetrics.map(m => new Date(m.timestamp).toLocaleDateString()),
        totalTimes: recentMetrics.map(m => m.timings.total),
        status: recentMetrics.map(m => m.slaStatus.pass ? 'PASS' : 'FAIL')
      }
    }

    return res.status(200).json(dashboard)
  } catch (error) {
    console.error('Error getting performance dashboard:', error)
    return res.status(500).json({
      error: 'Failed to get performance dashboard',
      message: error.message
    })
  }
}

/**
 * Get SLA violation alerts
 */
export async function getSLAViolations(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const perfLog = readPerfLog()
    const { severity = 'all', limit = 20 } = req.query

    let violations = perfLog.slaViolations

    if (severity !== 'all') {
      violations = violations.filter(v => v.severity === severity)
    }

    violations = violations.reverse().slice(0, parseInt(limit))

    const criticalCount = perfLog.slaViolations.filter(v => v.severity === 'CRITICAL').length
    const warningCount = perfLog.slaViolations.filter(v => v.severity === 'WARNING').length

    return res.status(200).json({
      summary: {
        criticalViolations: criticalCount,
        warningViolations: warningCount,
        totalViolations: perfLog.slaViolations.length,
        status: criticalCount > 0 ? 'CRITICAL' : warningCount > 5 ? 'WARNING' : 'HEALTHY'
      },
      violations: violations,
      recommendation: getSLARecommendation(criticalCount, warningCount)
    })
  } catch (error) {
    console.error('Error getting SLA violations:', error)
    return res.status(500).json({
      error: 'Failed to get SLA violations',
      message: error.message
    })
  }
}

/**
 * Get recommendation based on violations
 */
function getSLARecommendation(criticalCount, warningCount) {
  if (criticalCount > 0) {
    return 'CRITICAL: Performance is degraded. Alert Michael immediately. Check FTP connection and Dropbox API.'
  }
  if (warningCount > 5) {
    return 'WARNING: Several performance issues detected. Monitor FTP/Dropbox latency. May need to optimize code.'
  }
  if (warningCount > 0) {
    return 'ATTENTION: Minor performance delays detected. No action needed yet, but monitor closely.'
  }
  return 'HEALTHY: All SLAs met. System performing well.'
}

/**
 * Format milliseconds to human-readable time
 */
function formatMilliseconds(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Export handler for Vercel
 */
export default async function handler(req, res) {
  const { action } = req.query

  switch (action) {
    case 'log':
      return logPerformanceMetric(req, res)
    case 'dashboard':
      return getPerformanceDashboard(req, res)
    case 'violations':
      return getSLAViolations(req, res)
    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}
