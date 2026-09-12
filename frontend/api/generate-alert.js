import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, BorderStyle, PageSize, PageOrientation } from 'docx'
import fs from 'fs'
import path from 'path'

// Factory thresholds
const THRESHOLDS = { AIM: 1.5, Midbury: 2.0, LTM: 2.0, '201': 2.0, Bennett: 2.0, DMG: 2.0, Coltoys: 2.0, 'Loving Pets': 2.0 }

// Factory recipients from Michael's emails
const RECIPIENTS = {
  'AIM': { to: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'Midbury': { to: ['benebone@midbury.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'LTM': { to: ['eric@ltmplastics.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  '201': { to: ['emilio.otero@201oficial.com.mx'], cc: ['salvador@201oficial.com.mx', 'punam@benebone.com'] },
  'Bennett': { to: ['jmattox@bpkc.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'DMG': { to: ['monique.brunson@dmgincusa.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'Coltoys': { to: ['jparra@coltoys.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
  'Loving Pets': { to: ['aaron@lovingpetsproducts.com'], cc: ['zach@benebone.com', 'carly@benebone.com', 'punam@benebone.com'] }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { factory } = req.body
  if (!factory || !THRESHOLDS[factory]) return res.status(400).json({ error: 'Invalid factory' })

  try {
    // Load inventory data from Michael's files
    const inventoryPath = path.join(process.cwd(), 'src/data/inventory.json')
    const data = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
    const allSkus = data.skus

    // Filter SKUs on alert for this factory
    const threshold = THRESHOLDS[factory]
    const alertSkus = allSkus.filter(sku => {
      // All conditions must be true
      if (!sku.description) return false
      if (sku.mos > threshold) return false
      if (sku.plannedProdEaches <= 0) return false
      if (sku.exclude === 'X') return false
      
      // Check if this factory is primary producer
      const productions = {
        'AIM': sku.aimProduction || 0,
        'Midbury': sku.midburyProduction || 0,
        'LTM': sku.ltmProduction || 0,
        '201': sku.grupoProduction || 0,
        'Bennett': sku.bennettProduction || 0,
        'DMG': 0, // Would need from data
        'Coltoys': 0,
        'Loving Pets': 0
      }
      
      const factoryProd = productions[factory] || 0
      const isHighest = Object.entries(productions).every(([f, p]) => !p || p <= factoryProd)
      
      return isHighest && factoryProd > 0
    }).sort((a, b) => a.mos - b.mos)

    // Create Word document with factory-specific columns
    let headerCells, dataRows

    if (factory === 'AIM') {
      // AIM: 12 columns with Seg Band + Wrappers
      headerCells = ['SKU', 'Description', 'OnHand', 'Available Eaches', 'Avg Mthly Sales', 'MOS O/H', 'Amt to SS', 'Notes', 'Seg L6M Band', 'Wrappers OH', 'Wrappers OO', 'Planned Prod']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(s.availableEaches))] }),
          new TableCell({ children: [new Paragraph(String(s.avgMonthlySales))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(1)))] }),
          new TableCell({ children: [new Paragraph(String(s.amtToSS))] }),
          new TableCell({ children: [new Paragraph(s.notes)] }),
          new TableCell({ children: [new Paragraph(s.segBand)] }),
          new TableCell({ children: [new Paragraph(String(s.wrappersOH))] }),
          new TableCell({ children: [new Paragraph(String(s.wrappersOO))] }),
          new TableCell({ children: [new Paragraph(String(s.plannedProdEaches))] })
        ]
      }))
    } else if (factory === 'DMG') {
      // DMG: 8 columns with Available, Avg Mthly Sales, Amt to SS
      headerCells = ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(s.available))] }),
          new TableCell({ children: [new Paragraph(String(s.avgMonthlySales))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(1)))] }),
          new TableCell({ children: [new Paragraph(String(s.amtToSS))] }),
          new TableCell({ children: [new Paragraph(s.notes)] })
        ]
      }))
    } else {
      // Others: 8 columns with Notes
      headerCells = ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(s.available))] }),
          new TableCell({ children: [new Paragraph(String(s.avgMonthlySales))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(1)))] }),
          new TableCell({ children: [new Paragraph(String(s.amtToSS))] }),
          new TableCell({ children: [new Paragraph(s.notes)] })
        ]
      }))
    }

    const headerRow = new TableRow({
      children: headerCells.map(text => new TableCell({
        children: [new Paragraph({ text, bold: true, size: 20 })],
        shading: { fill: 'CCCCCC' },
        borders: { all: { style: BorderStyle.SINGLE } }
      }))
    })

    const table = new Table({ width: { size: 100, type: 'pct' }, rows: [headerRow, ...dataRows] })

    const recipients = RECIPIENTS[factory] || { to: [], cc: [] }

    const doc = new Document({
      sections: [{
        page: { margins: { top: 720, bottom: 720, left: 720, right: 720 }, size: PageSize.LETTER },
        children: [
          new Paragraph({ text: `Weekly Low SKU Alert ${factory}`, bold: true, size: 32, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, size: 20, spacing: { after: 200 } }),
          new Paragraph({ text: `To: ${recipients.to.join(', ')}`, size: 20 }),
          new Paragraph({ text: `CC: ${recipients.cc.join(', ')}`, size: 20, spacing: { after: 400 } }),
          new Paragraph({ text: `SKUs on Alert (MOS ≤ ${threshold}): ${alertSkus.length}`, bold: true, size: 22, spacing: { after: 300 } }),
          table
        ]
      }]
    })

    const blob = await Packer.toBlob(doc)
    const buffer = Buffer.from(await blob.arrayBuffer())

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Benebone_Alert_${factory}_${new Date().toISOString().split('T')[0]}.docx"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
