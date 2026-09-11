import Papa from 'papaparse'

const mockInventoryData = [
  { sku: '880244', description: 'Benebone Wishbone Bacon Medium 60PK', available: 76, avgMonthlySales: 50, mos: 1.52, amountToReachSS: 24, segmentBand: 'A', casePack: 24 },
  { sku: '880244ML', description: 'Benebone Wishbone Bacon Medium Mini 60PK', available: 112, avgMonthlySales: 48, mos: 2.33, amountToReachSS: 18, segmentBand: 'A', casePack: 24 },
  { sku: '881244', description: 'Benebone Bacon Mini 60PK', available: 2, avgMonthlySales: 45, mos: 0.04, amountToReachSS: 88, segmentBand: 'A', casePack: 24 },
  { sku: '882244', description: 'Benebone Bacon Large 60PK', available: 2, avgMonthlySales: 35, mos: 0.06, amountToReachSS: 70, segmentBand: 'B', casePack: 24 },
  { sku: '890244', description: 'Benebone Dental Chew Medium 60PK', available: 53, avgMonthlySales: 40, mos: 1.33, amountToReachSS: 27, segmentBand: 'B', casePack: 24 },
  { sku: '890244ML', description: 'Benebone Dental Chew Medium Mini 60PK', available: 70, avgMonthlySales: 42, mos: 1.67, amountToReachSS: 20, segmentBand: 'B', casePack: 24 },
  { sku: '891244', description: 'Benebone Peanut Butter Mini 60PK', available: 46, avgMonthlySales: 38, mos: 1.21, amountToReachSS: 30, segmentBand: 'C', casePack: 24 },
  { sku: '901244', description: 'Benebone Peanut Butter Medium 60PK', available: 17, avgMonthlySales: 55, mos: 0.31, amountToReachSS: 93, segmentBand: 'C', casePack: 24 }
]

const factories = [
  { id: 'aim', mosThreshold: 1.5 },
  { id: 'midbury', mosThreshold: 2.0 },
  { id: 'ltm', mosThreshold: 2.0 },
  { id: '201', mosThreshold: 2.0 },
  { id: 'bennett', mosThreshold: 2.0 },
  { id: 'dmg', mosThreshold: 2.0 },
  { id: 'coltoys', mosThreshold: 2.0 },
  { id: 'lovingpets', mosThreshold: 2.0 }
]

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Generate alerts based on MOS thresholds
    const alerts = []
    mockInventoryData.forEach(sku => {
      factories.forEach(factory => {
        if (sku.mos <= factory.mosThreshold) {
          alerts.push({
            id: `${sku.sku}-${factory.id}`,
            sku: sku.sku,
            description: sku.description,
            factory: factory.id,
            factoryId: factory.id,
            mos: sku.mos,
            threshold: factory.mosThreshold,
            onHand: sku.available,
            avgMonthlySales: sku.avgMonthlySales,
            amountToReachSS: sku.amountToReachSS,
            priority: sku.mos < 1 ? 'critical' : 'warning',
            segmentBand: sku.segmentBand
          })
        }
      })
    })

    res.status(200).json({
      skus: mockInventoryData,
      alerts: alerts,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Inventory API error:', error)
    res.status(500).json({ error: 'Failed to load inventory data' })
  }
}
