import React from 'react'

function InventoryTable({ skus }) {
  if (!skus || skus.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No data</div>
  }

  return (
    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Description</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>On Hand</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Case Pack</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1b2817' }}>{item.sku}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{item.description}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#1b2817' }}>{item.available}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>{item.casePack}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InventoryTable
