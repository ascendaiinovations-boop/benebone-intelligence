export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { csvData } = req.body

    if (!csvData) {
      return res.status(400).json({ error: 'No CSV data provided' })
    }

    // Parse CSV data
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' })
    }

    // Get headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const requiredColumns = ['SKU', 'Description', 'OnHand', 'AverageMonthlySales', 'Factory', 'SegmentBand']
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      })
    }

    // Parse data rows
    const alerts = []
    const factories = {}

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parse CSV line (handle quoted values)
      const values = []
      let current = ''
      let insideQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''))
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''))

      // Create object from values
      const row = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })

      // Validate required fields
      if (!row.SKU || !row.Factory) {
        continue
      }

      // Convert numbers
      const onHand = parseInt(row.OnHand) || 0
      const avgSales = parseInt(row.AverageMonthlySales) || 0
      const mos = avgSales > 0 ? (onHand / avgSales) : 0

      // Determine priority
      let priority = 'healthy'
      const factory = factories[row.Factory] || { mosThreshold: 1.5 }
      
      if (mos < 1.0) {
        priority = 'critical'
      } else if (mos < factory.mosThreshold) {
        priority = 'warning'
      }

      // Calculate amount to reach safety stock
      const safetyStockTarget = Math.ceil(factory.mosThreshold * avgSales)
      const amountToSS = Math.max(0, safetyStockTarget - onHand)

      // Skip if not alerting
      if (priority === 'healthy') {
        continue
      }

      alerts.push({
        id: `${row.Factory}-${row.SKU}`,
        sku: row.SKU,
        description: row.Description,
        onHand: onHand,
        avgMonthlySales: avgSales,
        mos: mos,
        amountToReachSS: amountToSS,
        priority: priority,
        factory: row.Factory,
        segmentBand: row.SegmentBand || 'N/A',
        threshold: factory.mosThreshold
      })

      factories[row.Factory] = factory
    }

    if (alerts.length === 0) {
      return res.status(400).json({ 
        error: 'No valid alert data found in CSV' 
      })
    }

    // Return parsed data
    res.status(200).json({
      success: true,
      alertCount: alerts.length,
      alerts: alerts,
      message: `Successfully imported ${alerts.length} alerts`
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    })
  }
}
