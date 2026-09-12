import { Anthropic } from '@anthropic-ai/sdk'
import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, BorderStyle } from 'docx'
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
    // Load inventory data
    const inventoryPath = path.join(process.cwd(), 'src/data/inventory.json')
    const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

    // Call Claude to analyze inventory for this factory
    const prompt = `You are a warehouse inventory analyst. Analyze this inventory data for the ${factory} factory.

INVENTORY DATA (sample):
${JSON.stringify(inventoryData.skus.slice(0, 20), null, 2)}

FACTORY THRESHOLDS:
- AIM: MOS ≤ 1.5
- All others: MOS ≤ 2.0

TASK: Return a JSON object with SKUs on alert for ${factory}:
{
  "factory": "${factory}",
  "threshold": <number>,
  "skusOnAlert": [
    { "sku": "XXX", "description": "...", "onHand": 0, "mos": 0, "avgMonthlySales": 0, "plannedProd": 0, "notes": "" }
  ],
  "totalCount": 0
}

Include only SKUs where:
- MOS ≤ threshold for ${factory}
- plannedProd > 0
- description exists

Sort by MOS ascending (lowest first).`

    const response = await client.messages.create({
      model: 'claude-opus-4',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const alertData = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!alertData || !alertData.skusOnAlert) {
      return res.status(500).json({ error: 'Failed to parse alert data' })
    }

    // Create Word document
    const headerCells = ['SKU', 'OnHand', 'MOS', 'Avg Sales', 'Planned Prod', 'Notes']
    const headerRow = new TableRow({
      children: headerCells.map(text => new TableCell({
        children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
        shading: { fill: 'E5E7EB' },
        borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 } }
      }))
    })

    const dataRows = alertData.skusOnAlert.map(sku => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(sku.sku)] }),
        new TableCell({ children: [new Paragraph(String(sku.onHand))] }),
        new TableCell({ children: [new Paragraph(String(sku.mos))] }),
        new TableCell({ children: [new Paragraph(String(sku.avgMonthlySales))] }),
        new TableCell({ children: [new Paragraph(String(sku.plannedProd))] }),
        new TableCell({ children: [new Paragraph(sku.notes || '')] })
      ]
    }))

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: `Weekly Low SKU Alert - ${factory}`, bold: true, size: 28, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, size: 22 }),
          new Paragraph({ text: `SKUs on Alert (MOS ≤ ${alertData.threshold}): ${alertData.totalCount}`, size: 22 }),
          new Paragraph({ text: '' }),
          new Table({ width: { size: 100, type: 'pct' }, rows: [headerRow, ...dataRows] })
        ]
      }]
    })

    const blob = await Packer.toBlob(doc)
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Alert_${factory}_${new Date().toISOString().split('T')[0]}.docx"`)
    res.send(Buffer.from(await blob.arrayBuffer()))
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
