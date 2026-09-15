import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, BorderStyle } from 'docx'
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
      return res.status(500).json({ error: 'No inventory data' })
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

    // Build table rows
    const rows = [
      new TableRow({
        cells: [
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

    alertSkus.slice(0, 100).forEach(sku => {
      rows.push(new TableRow({
        cells: [
          new TableCell({ children: [new Paragraph(sku.sku || '')] }),
          new TableCell({ children: [new Paragraph(sku.description || '')] }),
          new TableCell({ children: [new Paragraph((sku.onHand || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.available || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.avgMonthlySales || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.mos || 0).toFixed(2))] }),
          new TableCell({ children: [new Paragraph((sku.amtToSS || 0).toString())] }),
          new TableCell({ children: [new Paragraph(sku.notes || '')] })
        ]
      }))
    })

    const recipients = RECIPIENTS[factory]
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `Weekly Low SKU Alert - ${factory}`,
              style: 'Heading1'
            }),
            new Paragraph(`Generated: ${new Date().toLocaleString()}`),
            new Paragraph(`To: ${recipients.to.join(', ')}`),
            new Paragraph(`CC: ${recipients.cc.join(', ')}`),
            new Paragraph(`SKUs on Alert (MOS ≤ ${threshold}): ${alertSkus.length}`),
            new Paragraph(''),
            new Table({
              rows: rows
            })
          ]
        }
      ]
    })

    const buffer = await Packer.toBuffer(doc)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Benebone_Alert_${factory}_${new Date().toISOString().split('T')[0]}.docx"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: 'Failed to generate alert', message: error.message })
  }
}
