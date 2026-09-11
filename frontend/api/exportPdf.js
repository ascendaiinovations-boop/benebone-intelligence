export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { factory, alerts, mosThreshold } = req.body

    // Generate HTML content for the alert email
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f5f7f6;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 3px solid #2d5016;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #2d5016;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 13px;
        }
        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-box {
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }
        .summary-box.warning {
          border-left-color: #f59e0b;
          background-color: #fef3c7;
        }
        .summary-box h3 {
          margin: 0;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
        }
        .summary-box .number {
          font-size: 28px;
          font-weight: 700;
          color: #dc2626;
          margin: 10px 0;
        }
        .summary-box.warning .number {
          color: #f59e0b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        thead tr {
          background-color: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #666;
          font-size: 12px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
        }
        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .critical {
          color: #dc2626;
          font-weight: 700;
        }
        .warning {
          color: #f59e0b;
          font-weight: 700;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Low SKU Alert - ${factory}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-box">
            <h3>Critical Alerts</h3>
            <div class="number">${alerts.filter(a => a.priority === 'critical').length}</div>
            <p style="margin: 5px 0 0 0; color: #666;">SKUs below 1 MOS</p>
          </div>
          <div class="summary-box warning">
            <h3>Warning Alerts</h3>
            <div class="number">${alerts.filter(a => a.priority === 'warning').length}</div>
            <p style="margin: 5px 0 0 0; color: #666;">SKUs below ${mosThreshold} MOS</p>
          </div>
        </div>

        <h2 style="color: #1b2817; margin-top: 30px; margin-bottom: 15px;">Alert Details</h2>

        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>SKU</th>
              <th>Description</th>
              <th>On Hand</th>
              <th>Avg Mthly Sales</th>
              <th>MOS</th>
              <th>Amount to SS</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(alert => `
              <tr>
                <td><span class="${alert.priority}">${alert.priority.toUpperCase()}</span></td>
                <td><strong>${alert.sku}</strong></td>
                <td>${alert.description}</td>
                <td>${alert.onHand}</td>
                <td>${alert.avgMonthlySales}</td>
                <td><span class="${alert.priority}">${alert.mos.toFixed(2)}</span></td>
                <td>${alert.amountToReachSS}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automated alert from the Benebone Inventory Intelligence System.</p>
          <p>Please continue prioritizing recovery of all SKUs below 1 MOS as quickly as possible.</p>
          <p>Contact: michael@benebone.com</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Send HTML as plain text response that can be downloaded
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="Benebone_Alert_${factory}_${new Date().toISOString().split('T')[0]}.html"`)
    res.status(200).send(htmlContent)
  } catch (error) {
    console.error('PDF Export error:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
}
