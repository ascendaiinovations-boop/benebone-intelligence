import React from 'react'

export default function AlertPreview({ factory, skus }) {
  return (
    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1b2817', margin: 0 }}>
          Preview: First 10 SKUs on Alert
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>OnHand</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Available</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>MOS</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((sku, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1b2817' }}>{sku.sku}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>{sku.onHand}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>{sku.available}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{sku.mos}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '12px' }}>{sku.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
