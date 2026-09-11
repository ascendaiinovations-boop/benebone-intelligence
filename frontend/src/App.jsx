import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import Header from './components/Header'
import InventoryTable from './components/InventoryTable'

export default function App() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(d => {
      setInventory(d.skus || [])
      setLoading(false)
    }).catch(e => { console.error(e); setLoading(false) })
  }, [])

  const download = async () => {
    setDownloading(true)
    try {
      const now = new Date().toLocaleString()
      const date = new Date().toISOString().split('T')[0]
      let rows = ''
      inventory.forEach(i => {
        rows += '<w:tr><w:tc><w:p><w:r><w:t>' + (i.sku || '') + '</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>' + (i.description || '') + '</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>' + (i.available || 0) + '</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>' + (i.casePack || '') + '</w:t></w:r></w:p></w:tc></w:tr>'
      })
      const xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Benebone Inventory - ' + now + '</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SKU</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Description</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>OnHand</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>CasePack</w:t></w:r></w:p></w:tc></w:tr>' + rows + '</w:tbl></w:body></w:document>'
      const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Benebone_' + date + '.docx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1b2817' }}>Inventory ({inventory.length})</h1>
          <button onClick={download} disabled={downloading || loading} style={{
            padding: '0.75rem 1.5rem', background: '#2d5016', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
          }}>
            <Download size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {downloading ? 'Downloading...' : 'Download as Word'}
          </button>
        </div>
        {loading ? <p>Loading...</p> : <InventoryTable skus={inventory} />}
      </div>
    </div>
  )
}
// Fresh commit for Vercel - Fri Sep 11 23:21:51 UTC 2026
