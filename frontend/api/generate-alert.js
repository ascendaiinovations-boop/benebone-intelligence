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

    let allSkus = Array.isArray(INVENTORY_DATA) ? INVENTORY_DATA : (INVENTORY_DATA.skus || [])

    if (!allSkus || !Array.isArray(allSkus) || allSkus.length === 0) {
      return res.status(500).json({ error: 'No inventory data' })
    }

    const alertSkus = allSkus.filter(sku => {
      if (sku[factoryFlagField] !== 'Y') return false
      if (!sku.mosOH || sku.mosOH > threshold) return false
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false
      if (sku.excludeFromEmail === 'X') return false
      
      const factoryProd = sku[factoryProdField] || 0
      return factoryProd > 0
    }).sort((a, b) => a.mosOH - b.mosOH)

    // Build table rows
    const rows = [
      new TableRow({
        cells: [
          new TableCell({ children: [new Paragraph('Item No.')] }),
          new TableCell({ children: [new Paragraph('Description')] }),
          new TableCell({ children: [new Paragraph('Inbound')] }),
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
          new TableCell({ children: [new Paragraph(sku.itemNo || '')] }),
          new TableCell({ children: [new Paragraph(sku.description || '')] }),
          new TableCell({ children: [new Paragraph((sku.inbound || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.availableEachesPlus || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.avgMonthlySales || 0).toString())] }),
          new TableCell({ children: [new Paragraph((sku.mosOH || 0).toFixed(2))] }),
          new TableCell({ children: [new Paragraph((sku.amtToReachSS || 0).toString())] }),
          new TableCell({ children: [new Paragraph(sku.notes || '')] })
        ]
      }))
    })

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: `${factory} Inventory Alerts - ${new Date().toLocaleDateString()}`,
            bold: true,
            size: 28
          }),
          new Paragraph(''),
          new Table({
            rows: rows
          })
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${factory}-alerts-${new Date().toISOString().split('T')[0]}.docx"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: 'Failed to generate document', message: error.message })
  }
}
