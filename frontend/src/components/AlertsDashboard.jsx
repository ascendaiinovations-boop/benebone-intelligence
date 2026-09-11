import React from 'react'
import { AlertTriangle, TrendingDown } from 'lucide-react'

function AlertsDashboard({ alerts, factory }) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.priority === 'critical' &amp;&amp; b.priority !== 'critical') return -1
    if (a.priority !== 'critical' &amp;&amp; b.priority === 'critical') return 1
    return a.mos - b.mos
  })

  const criticalCount = alerts.filter(a => a.priority === 'critical').length
  const warningCount = alerts.filter(a => a.priority === 'warning').length

  if (alerts.length === 0) {
    return (
      &lt;div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#999'
      }}&gt;
        <div style={{ fontSize: '14px', marginTop: '1rem' }}>
          No alerts {factory ? `for ${factory.name}` : ''} — All SKUs above MOS thresholds
        </div>
      &lt;/div&gt;
    )
  }

  return (
    &lt;div&gt;
      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}&gt;
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          padding: '1rem'
        }}&gt;
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Critical Alerts
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '0.25rem' }}>
            SKUs below 1 MOS
          </div>
        </div>
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '6px',
          padding: '1rem'
        }}&gt;
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Warning Alerts
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {warningCount}
          </div>
          <div style={{ fontSize: '11px', color: '#78350f', marginTop: '0.25rem' }}>
            SKUs below threshold
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div style={{ overflowX: 'auto' }}&gt;
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}&gt;
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}&gt;
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Priority</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>SKU</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>On Hand</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Avg Mthly Sales</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>MOS</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Threshold</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Amount to SS</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Band</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlerts.map((alert, idx) => (
              <tr
                key={alert.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  background: idx % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#eef2e8'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f9fafb'}
              >
                <td style={{ padding: '0.75rem', textAlign: 'left' }}&gt;
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: alert.priority === 'critical' ? '#fee2e2' : '#fef3c7',
                    color: alert.priority === 'critical' ? '#dc2626' : '#f59e0b',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}&gt;
                    <AlertTriangle size={12} />
                    {alert.priority}
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1b2817' }}&gt;
                  {alert.sku}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'left', color: '#666', maxWidth: '300px' }}&gt;
                  {alert.description}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#1b2817', fontWeight: 500 }}&gt;
                  {alert.onHand}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#666' }}&gt;
                  {alert.avgMonthlySales}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}&gt;
                  <span style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    color: alert.priority === 'critical' ? '#dc2626' : '#f59e0b'
                  }}&gt;
                    {alert.mos.toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#2d5016', fontWeight: 600 }}&gt;
                  {alert.threshold}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#3a7d44' }}&gt;
                  {alert.amountToReachSS}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 500, color: '#666' }}&gt;
                  {alert.segmentBand}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    &lt;/div&gt;
  )
}

export default AlertsDashboard
