import React, { useState } from 'react'
import { Search } from 'lucide-react'

function InventoryTable({ skus }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('sku')

  if (!skus || !Array.isArray(skus)) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No inventory data</div>
  }

  const filtered = skus.filter(item =>
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortColumn === 'sku') return a.sku.localeCompare(b.sku)
    if (sortColumn === 'available') return b.available - a.available
    return 0
  })

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Search by SKU or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th onClick={() => setSortColumn('sku')} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  SKU {sortColumn === 'sku' && '↓'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>
                  Description
                </th>
                <th onClick={() => setSortColumn('available')} style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  On Hand {sortColumn === 'available' && '↓'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>
                  Case Pack
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>
                  Available Eaches
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>
                  Avg Mthly Sales
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No SKUs found</td>
                </tr>
              ) : (
                sorted.map((item, idx) => (
                  <tr key={item.sku} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1b2817' }}>{item.sku}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666', maxWidth: '350px' }}>{item.description}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#1b2817', fontWeight: 500 }}>{item.available}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>{item.casePack || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#3a7d44', fontWeight: 500 }}>{(item.available * (item.casePack || 1)).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>{item.avgMonthlySales || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryTable
