import { INVENTORY_DATA } from './inventory-data.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // For now, return current data count
    // In Phase 2, this will accept formdata and parse CSV
    res.json({
      success: true,
      skuCount: INVENTORY_DATA.length,
      message: 'Ready to accept CSV uploads (Phase 2)'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
