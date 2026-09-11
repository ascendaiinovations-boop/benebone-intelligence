export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { factory, alerts, mosThreshold } = req.body

    // Count alerts by priority
    const criticalCount = alerts.filter(a => a.priority === 'critical').length
    const warningCount = alerts.filter(a => a.priority === 'warning').length

    // Generate Word document XML content
    const wordXml = generateWordXml(factory, alerts, mosThreshold, criticalCount, warningCount)

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Weekly_Low_SKU_Alert_${factory}_${new Date().toISOString().split('T')[0]}.docx"`)
    res.status(200).send(Buffer.from(wordXml, 'binary'))
  } catch (error) {
    console.error('Word generation error:', error)
    res.status(500).json({ error: 'Failed to generate Word document' })
  }
}

function generateWordXml(factory, alerts, mosThreshold, criticalCount, warningCount) {
  const timestamp = new Date().toLocaleString()
  
  // Build table rows for alerts
  let tableRows = `<w:tr>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Priority</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>SKU</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Description</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>On Hand</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Avg Sales</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>MOS</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:fill="D3D3D3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Amt to SS</w:t></w:r></w:p></w:tc>
  </w:tr>`

  // Add data rows
  alerts.forEach(alert => {
    const bgColor = alert.priority === 'critical' ? 'FFE6E6' : 'FFF5E6'
    tableRows += `<w:tr>
      <w:tc><w:tcPr><w:shd w:fill="${bgColor}"/></w:tcPr><w:p><w:r><w:t>${alert.priority.toUpperCase()}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${alert.sku}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${alert.description}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${alert.onHand}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${alert.avgMonthlySales}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${alert.mos.toFixed(2)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${alert.amountToReachSS}</w:t></w:r></w:p></w:tc>
    </w:tr>`
  })

  // Complete Word XML document
  const wordDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t>Weekly Low SKU Alert - ${factory}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:color w:val="666666"/>
        </w:rPr>
        <w:t>Generated: ${timestamp}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Hi ${factory} Team,</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:spacing w:after="200"/>
      <w:r>
        <w:t>Below are the SKUs currently on alert at ≤ ${mosThreshold} MOS, sorted by priority.</w:t>
      </w:r>
    </w:p>

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:insideH w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:trPr>
          <w:trHeight w:val="400" w:type="auto"/>
        </w:trPr>
        <w:tc>
          <w:tcPr><w:shd w:fill="FFE6E6"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>CRITICAL ALERTS</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${criticalCount} SKUs</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:shd w:fill="FFF5E6"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>WARNING ALERTS</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${warningCount} SKUs</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p>
      <w:spacing w:after="200"/>
      <w:r></w:r>
    </w:p>

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:insideH w:val="single" w:sz="12" w:space="0" w:color="000000"/>
          <w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      ${tableRows}
    </w:tbl>

    <w:p>
      <w:spacing w:after="300"/>
      <w:r></w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Please continue prioritizing recovery of all SKUs below 1 MOS as quickly as possible.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:spacing w:after="100"/>
      <w:r>
        <w:rPr><w:i/></w:rPr>
        <w:t>Contact: Michael Kirkus | michael@benebone.com | (732) 993-3955</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:i/></w:rPr>
        <w:t>This is an automated alert from the Benebone Inventory Intelligence System.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

  return wordDoc
}
