export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { factory, factoryEmails, ccEmails, alerts, mosThreshold } = req.body

    // Generate email HTML
    const emailHtml = generateEmailHtml(factory, alerts, mosThreshold)

    // TODO: Integration with Resend API
    // const resendApiKey = process.env.RESEND_API_KEY
    // const emailResponse = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${resendApiKey}`
    //   },
    //   body: JSON.stringify({
    //     from: 'michael@benebone.com',
    //     to: factoryEmails,
    //     cc: ccEmails,
    //     subject: `Weekly Low SKU Alert ${new Date().toLocaleDateString()} - ${factory}`,
    //     html: emailHtml
    //   })
    // })

    // For now, return success with mock response
    res.status(200).json({
      success: true,
      message: `Alert prepared for ${factory}`,
      recipients: factoryEmails,
      ccRecipients: ccEmails,
      alertCount: alerts.length,
      emailPreview: emailHtml.substring(0, 200) + '...'
    })
  } catch (error) {
    console.error('Send Alert error:', error)
    res.status(500).json({ error: 'Failed to send alert' })
  }
}

function generateEmailHtml(factory, alerts, mosThreshold) {
  const criticalCount = alerts.filter(a => a.priority === 'critical').length
  const warningCount = alerts.filter(a => a.priority === 'warning').length

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; }
        .header { border-bottom: 3px solid #2d5016; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #2d5016; font-size: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f9fafb; padding: 12px; text-align: left; font-weight: 600; color: #666; font-size: 12px; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .critical { color: #dc2626; font-weight: 700; }
        .warning { color: #f59e0b; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Low SKU Alert - ${factory}</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <p>Hi ${factory} Team,</p>
        <p>Below are the SKUs currently on alert at ≤ ${mosThreshold} MOS, sorted by priority.</p>
        <p><strong>Critical Alerts:</strong> ${criticalCount} SKUs<br><strong>Warning Alerts:</strong> ${warningCount} SKUs</p>

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

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Please continue prioritizing recovery of all SKUs below 1 MOS as quickly as possible.
        </p>

        <p style="margin-top: 30px; color: #999; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated alert from the Benebone Inventory Intelligence System.<br>
          Contact: michael@benebone.com | Phone: (732) 993-3955
        </p>
      </div>
    </body>
    </html>
  `
}
