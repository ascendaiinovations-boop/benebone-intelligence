// CORRECTED API: get-alerts.js
// Fixes: 1) Factory flag filtering, 2) Correct data reading

import { inventoryData } from '../src/data/inventory-data.js'

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
    // CRITICAL FIX: Factory flag field mapping
    const factoryFlagMap = {
      AIM: 'aimSKU',
      Midbury: 'midburySKU',
      LTM: 'ltmSKU',
      '201': 'grupoSKU',
      Bennett: 'bennettSKU',
      DMG: 'dmgSKU',
      Coltoys: 'coltoysSKU',
      'Loving Pets': 'lovingPetsSKU'
    }

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
    const factoryFlagField = factoryFlagMap[factory]
    const factoryProdField = factoryProductionMap[factory]

    const alertSkus = inventoryData.skus.filter(sku => {
      // All conditions must be true
      if (sku[factoryFlagField] !== 'Y') return false
      if (!sku.mosOH || sku.mosOH > threshold) return false
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false
      if (sku.excludeFromEmail === 'X') return false
      
      const factoryProd = sku[factoryProdField] || 0
      if (factoryProd <= 0) return false
      
      return true
    }).sort((a, b) => a.mosOH - b.mosOH)

    res.json({
      factory,
      threshold,
      skus: alertSkus.slice(0, 20),  // Preview first 20
      total: alertSkus.length,
      source: 'Michael + Paul files only (CORRECTED filtering)',
      generated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
