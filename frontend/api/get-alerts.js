import { Anthropic } from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const client = new Anthropic()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { factory } = req.body
  if (!factory) return res.status(400).json({ error: 'Factory required' })

  try {
    const inventoryPath = path.join(process.cwd(), 'src/data/inventory.json')
    const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

    const prompt = `Analyze inventory for ${factory} factory. Return only valid JSON:
{
  "factory": "${factory}",
  "threshold": ${factory === 'AIM' ? 1.5 : 2.0},
  "skus": [{"sku": "XXX", "description": "...", "onHand": 0, "mos": 0, "avgMonthlySales": 0, "plannedProd": 0}]
}`

    const response = await client.messages.create({
      model: 'claude-opus-4',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt + '\n\nData: ' + JSON.stringify(inventoryData.skus.slice(0, 50))
      }]
    })

    const content = response.content[0].text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    res.json(data || { factory, threshold: factory === 'AIM' ? 1.5 : 2.0, skus: [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
