// CORRECTED API: generate-alert.js
// Fixes: 1) Factory flag filtering, 2) Correct column indices, 3) Proper Word column mapping

import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, BorderStyle } from 'docx'
import fs from 'fs'
import path from 'path'

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
    const inventoryPath = path.join(process.cwd(), 'src/data/inventory.json')
    const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
    const allSkus = inventoryData.skus

    // CRITICAL FIX: Filter by factory flag (column 25-32: aimSKU, midburySKU, ltmSKU, etc.)
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

    // Filter with ALL conditions
    const alertSkus = allSkus.filter(sku => {
      // Condition 1: Factory flag must be Y
      if (sku[factoryFlagField] !== 'Y') return false
      
      // Condition 2: MOS must be <= threshold
      if (!sku.mosOH || sku.mosOH > threshold) return false
      
      // Condition 3: Planned production must be > 0
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false
      
      // Condition 4: Must not be excluded
      if (sku.excludeFromEmail === 'X') return false
      
      // Condition 5: Factory must have production > 0 (primary producer)
      const factoryProd = sku[factoryProdField] || 0
      if (factoryProd <= 0) return false
      
      return true
    }).sort((a, b) => a.mosOH - b.mosOH)

    // Group by Seg Band (A, B, C, D, E) for AIM output
    const groupedByBand = {}
    alertSkus.forEach(sku => {
      const band = sku.segL6MBand || 'A'
      if (!groupedByBand[band]) groupedByBand[band] = []
      groupedByBand[band].push(sku)
    })

    // Create Word document
    const recipients = RECIPIENTS[factory] || { to: [], cc: [] }
    
    let headerCells = []
    let dataRows = []

    if (factory === 'AIM') {
      // AIM: 12 columns including Wrappers + Seg Band
      headerCells = [
        'Item No.', 'Description', 'Inbound', 'Available Eaches Plus Inbound', 'Avg Mthly Sales', 
        'MOS O/H', 'Amt to Reach SS', 'Notes', 'Seg L6M Band', 'Wrappers OH Eaches', 'Wrappers OO', 'Planned Prod Eaches'
      ]
      
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(s.itemNo))] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.inbound.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.availableEachesPlus.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.avgMonthlySales.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.mosOH.toFixed(2)))] }),
          new TableCell({ children: [new Paragraph(String(s.amtToSS.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(s.notes)] }),
          new TableCell({ children: [new Paragraph(s.segL6MBand)] }),
          new TableCell({ children: [new Paragraph(String(s.wrappersOHEaches.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.wrappersOO.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.plannedProdEaches.toFixed(0)))] })
        ]
      }))
    } else {
      // Other factories: 8 columns
      headerCells = [
        'Item No.', 'Description', 'Inbound', 'Available Eaches Plus Inbound', 'Avg Mthly Sales',
        'MOS O/H', 'Amt to Reach SS', 'Notes'
      ]
      
      dataRows = alertSkus.map(s => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(s.itemNo))] }),
          new TableCell({ children: [new Paragraph(s.description)] }),
          new TableCell({ children: [new Paragraph(String(s.inbound.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.availableEachesPlus.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.avgMonthlySales.toFixed(0)))] }),
          new TableCell({ children: [new Paragraph(String(s.mosOH.toFixed(2)))] }),
          new TableCell({ children: [new Paragraph(String(s.amtToSS.toFixed(0)))] }),
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

    const doc = new Document({
      sections: [{
        page: { margins: { top: 720, bottom: 720, left: 720, right: 720 } },
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
