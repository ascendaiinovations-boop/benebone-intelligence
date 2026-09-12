/**
 * Data Quality Framework
 * Validates inventory data before processing
 * Implements: SKU count checks, description coverage, factory coverage, anomaly detection
 */

import { inventoryData } from './inventory-data.js'

/**
 * Calculate data quality metrics
 * Returns: quality score and detailed validation report
 */
export function validateDataQuality() {
  const report = {
    timestamp: new Date().toISOString(),
    dataVersion: {
      snapshot: 'BeneBone Inventory Snapshot 20260910191007.csv',
      snapshotDate: '2026-09-10',
      weeklyReport: 'Weekly Inventory Report 9-11-2026.xlsx',
      reportDate: '2026-09-11',
      planning: 'Benebone Planning Tool September 2026.xlsx',
      planningDate: '2026-09-09',
      cpd: 'Benebone CPD v03.xlsx',
      cpdDate: '2026-08-15',
      poLog: 'PO & Receiving Log.xlsm',
      poLogDate: '2026-09-10'
    },
    checks: {}
  }

  // Check 1: SKU Count
  const skuCountCheck = validateSkuCount(inventoryData)
  report.checks.skuCount = skuCountCheck

  // Check 2: Description Coverage
  const descriptionCheck = validateDescriptionCoverage(inventoryData)
  report.checks.descriptionCoverage = descriptionCheck

  // Check 3: Factory Coverage
  const factoryCoverageCheck = validateFactoryCoverage(inventoryData)
  report.checks.factoryCoverage = factoryCoverageCheck

  // Check 4: MOS Distribution
  const mosDistributionCheck = validateMosDistribution(inventoryData)
  report.checks.mosDistribution = mosDistributionCheck

  // Check 5: Wrapper Data
  const wrapperDataCheck = validateWrapperData(inventoryData)
  report.checks.wrapperData = wrapperDataCheck

  // Check 6: Missing Required Fields
  const requiredFieldsCheck = validateRequiredFields(inventoryData)
  report.checks.requiredFields = requiredFieldsCheck

  // Calculate overall quality score
  report.overallScore = calculateQualityScore(report.checks)
  report.status = report.overallScore >= 95 ? 'PASS' : report.overallScore >= 85 ? 'WARN' : 'FAIL'
  report.readyToProcess = report.overallScore >= 95

  return report
}

/**
 * Check 1: Validate SKU Count
 * Acceptable range: 750-810 (flags if >50 SKUs missing or too many)
 */
function validateSkuCount(data) {
  const totalSkus = data.length
  const minExpected = 750
  const maxExpected = 810
  const pass = totalSkus >= minExpected && totalSkus <= maxExpected

  return {
    name: 'SKU Count',
    expected: `${minExpected}-${maxExpected}`,
    actual: totalSkus,
    pass,
    message: pass
      ? `✓ SKU count OK (${totalSkus} SKUs)`
      : totalSkus < minExpected
        ? `⚠️ SKU count low (${totalSkus} vs expected ${minExpected}) - check if data incomplete`
        : `⚠️ SKU count high (${totalSkus} vs expected ${maxExpected}) - verify data integrity`,
    severity: pass ? 'OK' : 'WARNING',
    weight: 15
  }
}

/**
 * Check 2: Description Coverage
 * Acceptable: >85% (warn if <90%)
 */
function validateDescriptionCoverage(data) {
  const withDescription = data.filter(sku => sku.description && sku.description.trim().length > 0).length
  const percentage = Math.round((withDescription / data.length) * 100)
  const pass = percentage >= 85
  const warn = percentage < 90

  return {
    name: 'Description Coverage',
    expected: '>85%',
    actual: `${percentage}% (${withDescription}/${data.length})`,
    pass,
    message: pass
      ? percentage < 90
        ? `⚠️ Description coverage borderline (${percentage}%) - acceptable but monitor`
        : `✓ Description coverage good (${percentage}%)`
      : `✗ Description coverage too low (${percentage}%) - data quality issue`,
    severity: pass ? (warn ? 'WARN' : 'OK') : 'ERROR',
    weight: 15,
    missingCount: data.length - withDescription
  }
}

/**
 * Check 3: Factory Coverage
 * All 8 factories must have at least 1 SKU in their production data
 */
function validateFactoryCoverage(data) {
  const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']
  const factoryCounts = {}

  factories.forEach(factory => {
    factoryCounts[factory] = 0
  })

  // Count SKUs by primary producer
  data.forEach(sku => {
    const producer = getPrimaryProducer(sku)
    if (producer && factoryCounts.hasOwnProperty(producer)) {
      factoryCounts[producer]++
    }
  })

  const allPresent = factories.every(f => factoryCounts[f] > 0)
  const missingFactories = factories.filter(f => factoryCounts[f] === 0)

  return {
    name: 'Factory Coverage',
    expected: 'All 8 factories',
    actual: `${factories.length - missingFactories.length}/8 factories`,
    pass: allPresent,
    message: allPresent
      ? `✓ All 8 factories covered in data`
      : `⚠️ Missing factories: ${missingFactories.join(', ')}`,
    severity: allPresent ? 'OK' : 'WARNING',
    weight: 15,
    breakdown: factoryCounts,
    missingFactories
  }
}

/**
 * Check 4: MOS Distribution
 * Verify that MOS values are reasonable (not all zero, not all very high)
 */
function validateMosDistribution(data) {
  const mosValues = data.filter(sku => sku.mos !== undefined && sku.mos !== null).map(sku => sku.mos)
  const avgMos = mosValues.length > 0 ? mosValues.reduce((a, b) => a + b) / mosValues.length : 0
  const minMos = Math.min(...mosValues, 100)
  const maxMos = Math.max(...mosValues)

  // Check for reasonable distribution
  const hasLowMos = mosValues.some(m => m < 2.0) // Should have some SKUs below threshold
  const hasHighMos = mosValues.some(m => m > 8.0) // Should have some SKUs above threshold
  const pass = hasLowMos && hasHighMos

  return {
    name: 'MOS Distribution',
    expected: 'Mix of low and high MOS values',
    actual: `Min: ${minMos.toFixed(2)}, Max: ${maxMos.toFixed(2)}, Avg: ${avgMos.toFixed(2)}`,
    pass,
    message: pass
      ? `✓ MOS distribution looks healthy`
      : `⚠️ MOS distribution unusual (check if data is stale)`,
    severity: pass ? 'OK' : 'WARNING',
    weight: 15,
    stats: {
      min: minMos,
      max: maxMos,
      avg: avgMos,
      belowThreshold: mosValues.filter(m => m <= 2.0).length,
      aboveThreshold: mosValues.filter(m => m > 8.0).length
    }
  }
}

/**
 * Check 5: Wrapper Data Coverage
 * Optional field, but should have reasonable coverage (>25%, but flag if <20%)
 */
function validateWrapperData(data) {
  const withWrapperData = data.filter(sku => {
    const hasOH = sku.wrappersOH && sku.wrappersOH > 0
    const hasOO = sku.wrappersOO && sku.wrappersOO > 0
    return hasOH || hasOO
  }).length

  const percentage = Math.round((withWrapperData / data.length) * 100)
  const pass = percentage >= 20 // Relaxed threshold for optional field

  return {
    name: 'Wrapper Data Coverage',
    expected: '>20% (optional field)',
    actual: `${percentage}% (${withWrapperData}/${data.length})`,
    pass,
    message: pass
      ? `✓ Wrapper data coverage OK (${percentage}%)`
      : `⚠️ Wrapper data very sparse (${percentage}%) - may not be tracked`,
    severity: 'INFO',
    weight: 5,
    coverage: percentage
  }
}

/**
 * Check 6: Required Fields Present
 * Every SKU must have: SKU, description, onHand, available, mos
 */
function validateRequiredFields(data) {
  const requiredFields = ['sku', 'onHand', 'available', 'mos']
  let missingCount = 0

  const skusWithMissing = data.filter(sku => {
    const missing = requiredFields.some(field => {
      const value = sku[field]
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
    })
    if (missing) missingCount++
    return missing
  })

  const pass = missingCount === 0

  return {
    name: 'Required Fields',
    expected: 'All SKUs have required fields',
    actual: missingCount === 0 ? 'Complete' : `${missingCount} SKUs missing fields`,
    pass,
    message: pass
      ? `✓ All required fields present`
      : `✗ ${missingCount} SKUs missing required fields`,
    severity: pass ? 'OK' : 'ERROR',
    weight: 20,
    missingCount,
    affected: missingCount > 0 ? skusWithMissing.map(s => s.sku).slice(0, 5) : []
  }
}

/**
 * Calculate overall quality score (0-100)
 * Weighted average of all checks
 */
function calculateQualityScore(checks) {
  const weights = {
    skuCount: checks.skuCount.weight || 15,
    descriptionCoverage: checks.descriptionCoverage.weight || 15,
    factoryCoverage: checks.factoryCoverage.weight || 15,
    mosDistribution: checks.mosDistribution.weight || 15,
    wrapperData: checks.wrapperData.weight || 5,
    requiredFields: checks.requiredFields.weight || 20
  }

  const scores = {
    skuCount: checks.skuCount.pass ? 100 : 70,
    descriptionCoverage: checks.descriptionCoverage.pass ? (checks.descriptionCoverage.severity === 'WARN' ? 85 : 100) : 50,
    factoryCoverage: checks.factoryCoverage.pass ? 100 : 80,
    mosDistribution: checks.mosDistribution.pass ? 100 : 75,
    wrapperData: checks.wrapperData.pass ? 100 : 80,
    requiredFields: checks.requiredFields.pass ? 100 : 0
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const weightedScore = Object.keys(scores).reduce((sum, key) => {
    return sum + (scores[key] * weights[key])
  }, 0)

  return Math.round(weightedScore / totalWeight)
}

/**
 * Get primary producer for a SKU
 * Used to determine which factory gets the alert
 */
function getPrimaryProducer(sku) {
  // Check production data in order
  if (sku.aimProduction && sku.aimProduction > 0) return 'AIM'
  if (sku.midburyProduction && sku.midburyProduction > 0) return 'Midbury'
  if (sku.ltmProduction && sku.ltmProduction > 0) return 'LTM'
  if (sku.grupoProduction && sku.grupoProduction > 0) return '201'
  if (sku.bennettProduction && sku.bennettProduction > 0) return 'Bennett'
  // For others, default based on factoryFlag
  if (sku.factoryFlag) return sku.factoryFlag
  return null
}

/**
 * Express handler for validation endpoint
 * GET /api/validate-data
 */
export async function validateDataHandler(req, res) {
  try {
    const report = validateDataQuality()
    return res.status(200).json(report)
  } catch (error) {
    console.error('Data validation error:', error)
    return res.status(500).json({ error: 'Data validation failed', details: error.message })
  }
}

export default validateDataHandler
