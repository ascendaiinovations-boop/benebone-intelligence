/**
 * Vercel Serverless Function: Data Quality Validation
 * Endpoint: GET /api/data-quality
 * Returns: Data quality report with validation scores
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Import inventory data
    let inventoryModule = await import('./inventory-data.js')
    let inventoryData = inventoryModule.inventoryData || inventoryModule.default || []
    
    // Ensure inventoryData is an array
    if (!Array.isArray(inventoryData)) {
      inventoryData = []
    }
    
    // If data is empty, return warning report
    if (inventoryData.length === 0) {
      return res.status(200).json({
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
        checks: {
          skuCount: {
            name: 'SKU Count',
            expected: '750-810',
            actual: 0,
            pass: false,
            message: '⚠️ No data loaded - please upload inventory CSV file first',
            severity: 'WARNING',
            weight: 15
          }
        },
        overallScore: 0,
        status: 'FAIL',
        readyToProcess: false,
        message: 'No inventory data available. Please upload a CSV file to begin.'
      })
    }

    // Validation report structure
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

    // Check 1: SKU Count (750-810 expected)
    const skuCount = inventoryData.length
    const skuCountPass = skuCount >= 750 && skuCount <= 810
    report.checks.skuCount = {
      name: 'SKU Count',
      expected: '750-810',
      actual: skuCount,
      pass: skuCountPass,
      message: skuCountPass
        ? `✓ SKU count OK (${skuCount} SKUs)`
        : skuCount < 750
          ? `⚠️ SKU count low (${skuCount}) - check if data incomplete`
          : `⚠️ SKU count high (${skuCount}) - verify data integrity`,
      severity: skuCountPass ? 'OK' : 'WARNING',
      weight: 15
    }

    // Check 2: Description Coverage (>85% required)
    const withDesc = inventoryData.filter(s => s.description && s.description.trim().length > 0).length
    const descPercent = Math.round((withDesc / skuCount) * 100)
    const descPass = descPercent >= 85
    const descWarn = descPercent < 90
    report.checks.descriptionCoverage = {
      name: 'Description Coverage',
      expected: '>85%',
      actual: `${descPercent}% (${withDesc}/${skuCount})`,
      pass: descPass,
      message: descPass
        ? descWarn
          ? `⚠️ Description coverage borderline (${descPercent}%) - monitor`
          : `✓ Description coverage good (${descPercent}%)`
        : `✗ Description coverage too low (${descPercent}%)`,
      severity: descPass ? (descWarn ? 'WARN' : 'OK') : 'ERROR',
      weight: 15,
      missingCount: skuCount - withDesc
    }

    // Check 3: Factory Coverage (all 8 factories)
    const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']
    const factoryCounts = {}
    factories.forEach(f => { factoryCounts[f] = 0 })

    inventoryData.forEach(sku => {
      const producer = sku.aimProduction > 0 ? 'AIM'
        : sku.midburyProduction > 0 ? 'Midbury'
          : sku.ltmProduction > 0 ? 'LTM'
            : sku.grupoProduction > 0 ? '201'
              : sku.bennettProduction > 0 ? 'Bennett'
                : sku.factoryFlag || null

      if (producer && factoryCounts.hasOwnProperty(producer)) {
        factoryCounts[producer]++
      }
    })

    const allFactoriesPresent = factories.every(f => factoryCounts[f] > 0)
    const missingFactories = factories.filter(f => factoryCounts[f] === 0)

    report.checks.factoryCoverage = {
      name: 'Factory Coverage',
      expected: 'All 8 factories',
      actual: `${factories.length - missingFactories.length}/8 factories`,
      pass: allFactoriesPresent,
      message: allFactoriesPresent
        ? `✓ All 8 factories covered`
        : `⚠️ Missing: ${missingFactories.join(', ')}`,
      severity: allFactoriesPresent ? 'OK' : 'WARNING',
      weight: 15,
      breakdown: factoryCounts
    }

    // Check 4: MOS Distribution
    const mosValues = inventoryData.filter(s => s.mos !== undefined && s.mos !== null).map(s => s.mos)
    const avgMos = mosValues.length > 0 ? (mosValues.reduce((a, b) => a + b) / mosValues.length).toFixed(2) : 0
    const minMos = Math.min(...mosValues, 100)
    const maxMos = Math.max(...mosValues)
    const hasLowMos = mosValues.some(m => m < 2.0)
    const hasHighMos = mosValues.some(m => m > 8.0)
    const mosPass = hasLowMos && hasHighMos

    report.checks.mosDistribution = {
      name: 'MOS Distribution',
      expected: 'Mix of low and high values',
      actual: `Min: ${minMos.toFixed(2)}, Max: ${maxMos.toFixed(2)}, Avg: ${avgMos}`,
      pass: mosPass,
      message: mosPass ? `✓ MOS distribution healthy` : `⚠️ MOS distribution unusual`,
      severity: mosPass ? 'OK' : 'WARNING',
      weight: 15,
      stats: {
        min: minMos,
        max: maxMos,
        avg: parseFloat(avgMos),
        belowThreshold: mosValues.filter(m => m <= 2.0).length,
        aboveThreshold: mosValues.filter(m => m > 8.0).length
      }
    }

    // Check 5: Wrapper Data (optional, >20% okay)
    const withWrapperData = inventoryData.filter(s => {
      const hasOH = s.wrappersOH && s.wrappersOH > 0
      const hasOO = s.wrappersOO && s.wrappersOO > 0
      return hasOH || hasOO
    }).length
    const wrapperPercent = Math.round((withWrapperData / skuCount) * 100)
    const wrapperPass = wrapperPercent >= 20

    report.checks.wrapperData = {
      name: 'Wrapper Data Coverage',
      expected: '>20% (optional)',
      actual: `${wrapperPercent}% (${withWrapperData}/${skuCount})`,
      pass: wrapperPass,
      message: wrapperPass ? `✓ Wrapper coverage OK` : `⚠️ Wrapper data sparse`,
      severity: 'INFO',
      weight: 5,
      coverage: wrapperPercent
    }

    // Check 6: Required Fields
    const requiredFields = ['sku', 'onHand', 'available', 'mos']
    const missingRequiredCount = inventoryData.filter(sku => {
      return requiredFields.some(field => {
        const value = sku[field]
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
      })
    }).length
    const requiredPass = missingRequiredCount === 0

    report.checks.requiredFields = {
      name: 'Required Fields',
      expected: 'All SKUs complete',
      actual: missingRequiredCount === 0 ? 'Complete' : `${missingRequiredCount} SKUs missing`,
      pass: requiredPass,
      message: requiredPass ? `✓ All fields present` : `✗ ${missingRequiredCount} SKUs incomplete`,
      severity: requiredPass ? 'OK' : 'ERROR',
      weight: 20,
      missingCount: missingRequiredCount
    }

    // Calculate weighted quality score
    const weights = {
      skuCount: 15,
      descriptionCoverage: 15,
      factoryCoverage: 15,
      mosDistribution: 15,
      wrapperData: 5,
      requiredFields: 20
    }

    const scores = {
      skuCount: report.checks.skuCount.pass ? 100 : 70,
      descriptionCoverage: report.checks.descriptionCoverage.pass ? (report.checks.descriptionCoverage.severity === 'WARN' ? 85 : 100) : 50,
      factoryCoverage: report.checks.factoryCoverage.pass ? 100 : 80,
      mosDistribution: report.checks.mosDistribution.pass ? 100 : 75,
      wrapperData: report.checks.wrapperData.pass ? 100 : 80,
      requiredFields: report.checks.requiredFields.pass ? 100 : 0
    }

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
    const weightedScore = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * weights[key])
    }, 0)

    report.overallScore = Math.round(weightedScore / totalWeight)
    report.status = report.overallScore >= 95 ? 'PASS' : report.overallScore >= 85 ? 'WARN' : 'FAIL'
    report.readyToProcess = report.overallScore >= 95

    return res.status(200).json(report)
  } catch (error) {
    console.error('Data quality check error:', error)
    return res.status(500).json({
      error: 'Data quality validation failed',
      message: error.message,
      status: 'FAIL',
      readyToProcess: false
    })
  }
}
