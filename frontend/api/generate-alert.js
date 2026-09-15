import { Document, Packer, Table, TableRow, TableCell, Paragraph } from 'docx'
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

const RECIPIENTS = {
  AIM: { to: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  Midbury: { to: ['benebone@midbury.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  LTM: { to: ['eric@ltmplastics.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  '201': { to: ['emilio.otero@201oficial.com.mx'], cc: ['salvador@201oficial.com.mx', 'punam@benebone.com'] },
  Bennett: { to: ['jmattox@bpkc.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  DMG: { to: ['monique.brunson@dmgincusa.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  Coltoys: { to: ['jparra@coltoys.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'Loving Pets': { to: ['aaron@lovingpetsproducts.com'], cc: ['zach@benebone.com', 'carly@benebone.com', 'punam@benebone.com'] }
}

export default async function handler(req, res) {
  res.socket?.setTimeout(30000)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { factory } = req.body
    
    if (!factory || !THRESHOLDS[factory]) {
      console.error('Invalid factory:', factory)
      return res.status(400).json({ error: 'Invalid factory' })
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
    const factoryProdField = factoryProductionMap[factory]

    let allSkus = Array.isArray(INVENTORY_DATA) ? INVENTORY_DATA : (INVENTORY_DATA.skus || [])

    if (!allSkus || !Array.isArray(allSkus) || allSkus.length === 0) {
      return res.status(500).json({ error: 'No inventory data available' })
    }

    const alertSkus = allSkus.filter(sku => {
      if (!sku.factoryFlag || !sku.factoryFlag[factory]) return false
      // FIX: Exclude SKUs with MOS=0 (new products with no sales history)
      if (sku.mos === 0 || sku.mos === undefined || sku.mos === null || sku.mos > threshold) return false
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false
      if (sku.exclude === 'X') return false
      
      const factoryProd = sku[factoryProdField] || 0
      return factoryProd > 0
    }).sort((a, b) => a.mos - b.mos)

    console.log(`Generate alert: ${factory} with ${alertSkus.length} SKUs`)

    // Build table rows
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('SKU')] }),
          new TableCell({ children: [new Paragraph('Description')] }),
          new TableCell({ children: [new Paragraph('OnHand')] }),
          new TableCell({ children: [new Paragraph('Available')] }),
          new TableCell({ children: [new Paragraph('Avg Sales')] }),
          new TableCell({ children: [new Paragraph('MOS')] }),
          new TableCell({ children: [new Paragraph('Amt to SS')] }),
          new TableCell({ children: [new Paragraph('Notes')] })
        ]
      })
    ]

    for (let i = 0; i < Math.min(alertSkus.length, 100); i++) {
      const sku = alertSkus[i]
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(sku.sku || ''))] }),
            new TableCell({ children: [new Paragraph(String(sku.description || '').substring(0, 50))] }),
            new TableCell({ children: [new Paragraph(String(sku.onHand || 0))] }),
            new TableCell({ children: [new Paragraph(String(sku.available || 0))] }),
            new TableCell({ children: [new Paragraph(String(sku.avgMonthlySales || 0))] }),
            new TableCell({ children: [new Paragraph(String((sku.mos || 0).toFixed(2)))] }),
            new TableCell({ children: [new Paragraph(String(sku.amtToSS || 0))] }),
            new TableCell({ children: [new Paragraph(String(sku.notes || '').substring(0, 30))] })
          ]
        })
      )
    }

    const recipients = RECIPIENTS[factory]
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `Weekly Low SKU Alert - ${factory}`,
              bold: true,
              size: 28
            }),
            new Paragraph({
              text: `Generated: ${now.toLocaleString()}`,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `To: ${recipients.to.join(', ')}`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `CC: ${recipients.cc.join(', ')}`,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `SKUs on Alert (MOS ≤ ${threshold}): ${alertSkus.length}`,
              bold: true,
              spacing: { after: 400 }
            }),
            new Table({
              rows: rows
            })
          ]
        }
      ]
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Benebone_Alert_${factory}_${dateStr}.docx"`)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

    console.log(`Sending ${buffer.length} bytes`)
    res.status(200).end(buffer)
    
  } catch (error) {
    console.error('ERROR in generate-alert:', error)
    res.status(500).json({ 
      error: 'Failed to generate alert',
      message: error.message
    })
  }
}
