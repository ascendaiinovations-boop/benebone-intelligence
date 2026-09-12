import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip } from 'docx'

export async function generateAlertWord(factory, inventory, factoryConfig, recipients) {
  const date = new Date().toISOString().split('T')[0]
  const config = factoryConfig[factory]
  
  // Filter SKUs on alert for this factory
  const alertSkus = inventory.filter(sku => {
    return (
      (sku.factoryFlag?.[factory] !== false) &&
      sku.mos <= config.threshold &&
      sku.plannedProd > 0 &&
      sku.exclude !== 'X'
    )
  })

  // Create table header row
  const headerCells = [
    'SKU',
    'OnHand',
    'Available',
    'Case Pack',
    'Avg Monthly Sales',
    'MOS',
    'Planned Prod',
    'Notes'
  ]

  const headerRow = new TableRow({
    children: headerCells.map(text => new TableCell({
      children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
      shading: { fill: 'E5E7EB' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
      }
    }))
  })

  // Create data rows
  const dataRows = alertSkus.map(sku => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph(sku.sku)] }),
      new TableCell({ children: [new Paragraph(String(sku.onHand))] }),
      new TableCell({ children: [new Paragraph(String(sku.available))] }),
      new TableCell({ children: [new Paragraph(String(sku.casePack))] }),
      new TableCell({ children: [new Paragraph(String(sku.avgMonthlySales))] }),
      new TableCell({ children: [new Paragraph(String(sku.mos))] }),
      new TableCell({ children: [new Paragraph(String(sku.plannedProd))] }),
      new TableCell({ children: [new Paragraph(sku.notes || '')] })
    ]
  }))

  // Create table
  const table = new Table({
    width: { size: 100, type: 'pct' },
    rows: [headerRow, ...dataRows]
  })

  // Create document
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: `Weekly Low SKU Alert - ${factory}`,
          bold: true,
          size: 28,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `Generated: ${new Date().toLocaleString()}`,
          size: 22,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `SKUs on Alert (MOS ≤ ${config.threshold}): ${alertSkus.length}`,
          size: 22,
          spacing: { after: 300 }
        }),
        new Paragraph({
          text: `To: ${recipients[factory]?.to?.join(', ') || ''}`,
          size: 22,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `CC: ${recipients[factory]?.cc?.join(', ') || ''}`,
          size: 22,
          spacing: { after: 400 }
        }),
        table
      ]
    }]
  })

  // Generate and download
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Benebone_Weekly_Alert_${factory}_${date}.docx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
