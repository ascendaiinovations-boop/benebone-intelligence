import { INVENTORY_DATA } from './inventory-data.js'

const THRESHOLDS = { AIM: 1.5, Midbury: 2.0, LTM: 2.0, '201': 2.0, Bennett: 2.0, DMG: 2.0, Coltoys: 2.0, 'Loving Pets': 2.0 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { factory } = req.body
  if (!factory || !THRESHOLDS[factory]) return res.status(400).json({ error: 'Invalid factory' })

  try {
    const threshold = THRESHOLDS[factory]
    const alertSkus = INVENTORY_DATA.filter(sku => {
      if (!sku.description || sku.mos > threshold || sku.exclude === 'X') return false
      
      const productions = {
        'AIM': sku.aimProduction || 0,
        'Midbury': sku.midburyProduction || 0,
        'LTM': sku.ltmProduction || 0,
        '201': sku.grupoProduction || 0,
        'Bennett': sku.bennettProduction || 0,
        'DMG': 0,
        'Coltoys': 0,
        'Loving Pets': 0
      }
      
      const factoryProd = productions[factory] || 0
      return Object.entries(productions).every(([f, p]) => !p || p <= factoryProd) && factoryProd > 0
    }).sort((a, b) => a.mos - b.mos)

    res.json({
      factory,
      threshold,
      skus: alertSkus.slice(0, 20),
      total: alertSkus.length,
      source: 'Michael + Paul files only'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
