import React, { useState, useEffect } from 'react'
import { Download, Menu, X } from 'lucide-react'
import Header from './components/Header'
import InventoryTable from './components/InventoryTable'

function App() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      setInventory(data.skus || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadAsWord = async () => {
    setDownloading(true)
    try {
      const timestamp = new Date().toLocaleString()
      const date = new Date().toISOString().split('T')[0]

      let tableRows = '<w:tr><w:trPr><w:trHeight w:val="360" w:type="auto"/></w:trPr>'
      tableRows += '<w:tc><w:p><w:pPr><w:pStyle w:val="TableHeader"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>SKU</w:t></w:r></w:p></w:tc>'
      tableRows += '<w:tc><w:p><w:pPr><w:pStyle w:val="TableHeader"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Description</w:t></w:r></w:p></w:tc>'
      tableRows += '<w:tc><w:p><w:pPr><w:pStyle w:val="TableHeader"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>OnHand</w:t></w:r></w:p></w:tc>'
      tableRows += '<w:tc><w:p><w:pPr><w:pStyle w:val="TableHeader"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>CasePack</w:t></w:r></w:p></w:tc></w:tr>'

      inventory.forEach(item => {
        tableRows += '<w:tr>'
        tableRows += '<w:tc><w:p><w:r><w:t>' + (item.sku || '') + '</w:t></w:r></w:p></w:tc>'
        tableRows += '<w:tc><w:p><w:r><w:t>' + (item.description || '') + '</w:t></w:r></w:p></w:tc>'
        tableRows += '<w:tc><w:p><w:r><w:t>' + (item.available || '') + '</w:t></w:r></w:p></w:tc>'
        tableRows += '<w:tc><w:p><w:r><w:t>' + (item.casePack || '') + '</w:t></w:r></w:p></w:tc>'
        tableRows += '</w:tr>'
      })

      const wordXml = '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Benebone Inventory Report</w:t></w:r></w:p><w:p><w:r><w:t>Generated: ' + timestamp + '</w:t></w:r></w:p><w:p><w:r><w:t>Total SKUs: ' + inventory.length + '</w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:tbl><w:tblPr><w:tblW w:w="5000" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>' + tableRows + '</w:tbl></w:body></w:document>'

      const blob = new Blob([wordXml], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Benebone_Inventory_' + date + '.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error downloading document: ' + error.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{
        width: sidebarOpen ? '200px' : '0',
        background: '#1b2817',
        color: 'white',
        padding: sidebarOpen ? '1.5rem' : '0',
        transition: 'all 0.3s',
        overflow: 'hidden',
        borderRight: '1px solid #333'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '1rem' }}>Benebone</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        
        <div style={{ padding: '2rem', flex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '0.5rem', color: '#1b2817' }}>
                  Inventory
                </h1>
                <p style={{ color: '#666', fontSize: '14px' }}>{inventory.length} SKUs</p>
              </div>
              <button
                onClick={downloadAsWord}
                disabled={downloading || loading || inventory.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#2d5016',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.6 : 1
                }}
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download as Word'}
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading inventory...
              </div>
            ) : inventory.length > 0 ? (
              <InventoryTable skus={inventory} />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No inventory data available
              </div>
            )}
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            background: '#2d5016',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <Menu size={24} />
        </button>
      )}
    </div>
  )
}

export default App
// Force rebuild
