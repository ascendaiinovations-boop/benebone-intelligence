import { INVENTORY_DATA } from './inventory-data.js'

const THRESHOLDS = {
  AIM: 1.5,
  Midbury: 2.0,
  LTM: 2.0,
  '201': 2.0,
  Bennett: 2.0,
  DMG: 2.0,
  Coltoys: 2.0,
  'Loving Pets': 2.0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { factory } = req.body
  if (!factory || !THRESHOLDS[factory]) return res.status(400).json({ error: 'Invalid factory' })

  try {
    const factoryProductionMap = {
      AIM: 'aimProduction',
      Midbury: 'midburyProduction',
      LTM: 'ltmProduction',
      '201': 'grupoProduction',
      Bennett: 'bennettProduction',
      DMG: 'dmgProduction',
      Coltoys: 'coltoysProduction',
      'Loving Pets': 'lovingPetsProduction'
    }

    const threshold = THRESHOLDS[factory]
    const factoryProdField = factoryProductionMap[factory]

    let allSkus = Array.isArray(INVENTORY_DATA) ? INVENTORY_DATA : (INVENTORY_DATA.skus || [])

    if (!allSkus || !Array.isArray(allSkus) || allSkus.length === 0) {
      return res.status(500).json({ error: 'No inventory data available' })
    }

    const alertSkus = allSkus.filter(sku => {
      // Check factory flag (boolean in factoryFlag object)
      if (!sku.factoryFlag || !sku.factoryFlag[factory]) return false
      
      // Check MOS threshold (use 'mos' not 'mosOH')
      if (sku.mos === undefined || sku.mos === null || sku.mos > threshold) return false
      
      // Check planned production
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false
      
      // Check exclude flag
      if (sku.exclude === 'X') return false
      
      // Check factory has production for this SKU
      const factoryProd = sku[factoryProdField] || 0
      if (factoryProd <= 0) return false
      
      return true
    }).sort((a, b) => a.mos - b.mos)

    res.json({
      factory,
      threshold,
      skus: alertSkus.slice(0, 20),
      total: alertSkus.length,
      source: 'Benebone inventory (FIXED)',
      generated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: 'Failed to load alerts', message: error.message })
  }
}
