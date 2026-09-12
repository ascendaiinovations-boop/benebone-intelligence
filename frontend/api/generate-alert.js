import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, BorderStyle } from 'docx'
import { INVENTORY_DATA } from './inventory-data.js'

const THRESHOLDS = { AIM: 1.5, Midbury: 2.0, LTM: 2.0, '201': 2.0, Bennett: 2.0, DMG: 2.0, Coltoys: 2.0, 'Loving Pets': 2.0 }

// Recipients per Michael's Sep 10 email - Peter Toolan EXCLUDED from AIM
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

function isBaconWishbone(description) {
  const desc = description || ''
  return desc.includes('Wishbone') && (desc.includes('Bacon') || desc.includes('bacon'))
}

function isWishbone(description) {
  const desc = description || ''
  return desc.includes('Wishbone')
}

function getPrimaryProducer(sku) {
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

  let highest = null
  let maxProduction = 0
  
  for (const [factory, prod] of Object.entries(productions)) {
    if (prod > maxProduction) {
      maxProduction = prod
      highest = factory
    }
  }

  return highest
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { factory } = req.body
  if (!factory || !THRESHOLDS[factory]) return res.status(400).json({ error: 'Invalid factory' })

  try {
    const threshold = THRESHOLDS[factory]
    
    const alertSkus = INVENTORY_DATA.filter(sku => {
      if (!sku.description || sku.mos > threshold || sku.exclude === 'X') return false
      
      const primaryProducer = getPrimaryProducer(sku)
      
      // Bacon Wishbones: AIM only, exclude from all others
      const isBacon = isBaconWishbone(sku.description)
      if (isBacon && factory !== 'AIM') return false
      if (isBacon && factory === 'AIM') return primaryProducer === 'AIM'
      
      // Regular Wishbones: AIM only, exclude from Midbury
      const isWish = isWishbone(sku.description)
      if (isWish && factory === 'Midbury') return false
      if (isWish && factory !== 'AIM') return false
      if (isWish && factory === 'AIM') return primaryProducer === 'AIM'
      
      // All other SKUs: single-sourced to their primary producer
      return primaryProducer === factory
    }).sort((a, b) => a.mos - b.mos)

    let headerCells, dataRows

    if (factory === 'AIM') {
      headerCells = ['SKU', 'Description', 'OnHand', 'Available Eaches', 'Avg Mthly Sales', 'MOS OH', 'Amt to SS', 'Notes', 'Seg Band', 'Wrappers OH', 'Wrappers OO', 'Planned Prod']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.availableEaches)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.avgMonthlySales)))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(2)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.amtToSS)))] }),
          new TableCell({ children: [new Paragraph(s.notes)] }),
          new TableCell({ children: [new Paragraph(s.segBand)] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.wrappersOH)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.wrappersOO)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.plannedProdEaches)))] })
        ]
      }))
    } else if (factory === 'DMG') {
      headerCells = ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.available)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.avgMonthlySales)))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(2)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.amtToSS)))] }),
          new TableCell({ children: [new Paragraph(s.notes)] })
        ]
      }))
    } else {
      headerCells = ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.sku)] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.onHand))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.available)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.avgMonthlySales)))] }),
          new TableCell({ children: [new Paragraph(String(s.mos.toFixed(2)))] }),
          new TableCell({ children: [new Paragraph(String(Math.round(s.amtToSS)))] }),
          new TableCell({ children: [new Paragraph(s.notes)] })
        ]
      }))
    }

    const recipients = RECIPIENTS[factory] || { to: [], cc: [] }

    const headerRow = new TableRow({
      children: headerCells.map(text => new TableCell({
        children: [new Paragraph({ text, bold: true, size: 20 })],
        shading: { fill: 'CCCCCC' },
        borders: { all: { style: BorderStyle.SINGLE } }
      }))
    })

    let docChildren = [
      new Paragraph({ text: `Weekly Low SKU Alert - ${factory}`, bold: true, size: 32, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, size: 20, spacing: { after: 200 } }),
      new Paragraph({ text: `To: ${recipients.to.join(', ')}`, size: 20 }),
      new Paragraph({ text: `CC: ${recipients.cc.join(', ')}`, size: 20, spacing: { after: 400 } })
    ]

    // Add alert message or table
    if (alertSkus.length === 0) {
      docChildren.push(new Paragraph({ text: 'No SKUs are on alert this week.', bold: true, size: 22, spacing: { after: 200 } }))
    } else {
      docChildren.push(new Paragraph({ text: `SKUs on Alert (MOS ≤ ${threshold}): ${alertSkus.length}`, bold: true, size: 22, spacing: { after: 300 } }))
      const table = new Table({ width: { size: 100, type: 'pct' }, rows: [headerRow, ...dataRows] })
      docChildren.push(table)
    }

    const doc = new Document({
      sections: [{
        children: docChildren
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
