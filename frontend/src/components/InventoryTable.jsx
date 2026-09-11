import React, { useState } from 'react'
import { Search } from 'lucide-react'

function InventoryTable({ inventory }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('sku')

  const filteredInventory = inventory.filter(item =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortColumn === 'sku') return a.sku.localeCompare(b.sku)
    if (sortColumn === 'available') return b.available - a.available
    if (sortColumn === 'mos') return b.mos - a.mos
    return 0
  })

  return (
    &lt;div&gt;
      {/* Search Bar */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}&gt;
        <div style={{ position: 'relative' }}&gt;
          <Search size={18} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search by SKU or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}&gt;
        <div style={{ overflowX: 'auto' }}&gt;
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}&gt;
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}&gt;
                <th
                  onClick={() => setSortColumn('sku')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#666',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  SKU {sortColumn === 'sku' &amp;&amp; '↓'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>
                  Description
                </th>
                <th
                  onClick={() => setSortColumn('available')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#666',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  On Hand {sortColumn === 'available' &amp;&amp; '↓'}
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
                <th
                  onClick={() => setSortColumn('mos')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#666',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  MOS {sortColumn === 'mos' &amp;&amp; '↓'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInventory.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    No SKUs found
                  </td>
                </tr>
              ) : (
                sortedInventory.map((item, idx) => (
                  <tr
                    key={item.sku}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      background: idx % 2 === 0 ? 'white' : '#f9fafb',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eef2e8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f9fafb'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1b2817' }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666', maxWidth: '350px' }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#1b2817', fontWeight: 500 }}>
                      {item.available}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>
                      {item.casePack || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#3a7d44', fontWeight: 500 }}>
                      {(item.available * (item.casePack || 1)).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666' }}>
                      {item.avgMonthlySales}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: item.mos &lt; 1 ? '#fee2e2' : item.mos &lt; 2 ? '#fef3c7' : '#f0fdf4',
                        color: item.mos &lt; 1 ? '#dc2626' : item.mos &lt; 2 ? '#f59e0b' : '#22c55e'
                      }}&gt;
                        {item.mos.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    &lt;/div&gt;
  )
}

export default InventoryTable
