import React, { useState } from 'react'
import { Download, Mail, Loader, Upload, CheckCircle } from 'lucide-react'
import Header from './components/Header'

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM')
  const [loading, setLoading] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [alertData, setAlertData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [csvFile, setCsvFile] = useState(null)

  const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']

  const handleFileSelect = (e) => {
    setCsvFile(e.target.files[0])
    setUploadStatus('')
  }

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadStatus('Please select a CSV file')
      return
    }

    setUploading(true)
    setUploadStatus('Uploading and parsing...')

    try {
      const formData = new FormData()
      formData.append('csvFile', csvFile)

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadStatus(`Error: ${data.error}`)
      } else {
        setUploadStatus(`✅ Success! Loaded ${data.skuCount} SKUs`)
        setCsvFile(null)
        document.getElementById('csvInput').value = ''
        // Refresh alerts
        handleCheckAlerts()
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadWord = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      })

      if (!response.ok) throw new Error('Failed to generate alert')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Benebone_Alert_${selectedFactory}_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/get-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      })

      const data = await response.json()
      setAlertData(data)
      setAlertCount(data.total)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getRecipients = (factory) => {
    const recipients = {
      'AIM': { to: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      'Midbury': { to: ['benebone@midbury.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      'LTM': { to: ['eric@ltmplastics.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      '201': { to: ['emilio.otero@201oficial.com.mx'], cc: ['salvador@201oficial.com.mx', 'punam@benebone.com'] },
      'Bennett': { to: ['jmattox@bpkc.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      'DMG': { to: ['monique.brunson@dmgincusa.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      'Coltoys': { to: ['jparra@coltoys.com'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
      'Loving Pets': { to: ['aaron@lovingpetsproducts.com'], cc: ['zach@benebone.com', 'carly@benebone.com', 'punam@benebone.com'] }
    }
    return recipients[factory]
  }

  const getColumns = (factory) => {
    if (factory === 'AIM') return ['SKU', 'Description', 'OnHand', 'Available Eaches', 'Avg Mthly Sales', 'MOS OH', 'Amt to SS', 'Notes', 'Seg Band', 'Wrappers OH', 'Wrappers OO', 'Planned Prod']
    if (factory === 'DMG') return ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
    return ['SKU', 'Description', 'OnHand', 'Available', 'Avg Mthly Sales', 'MOS', 'Amt to SS', 'Notes']
  }

  const getRowData = (sku, factory) => {
    if (factory === 'AIM') return [sku.sku, sku.description, sku.onHand, Math.round(sku.availableEaches), Math.round(sku.avgMonthlySales), sku.mos.toFixed(2), Math.round(sku.amtToSS), sku.notes, sku.segBand, Math.round(sku.wrappersOH), Math.round(sku.wrappersOO), Math.round(sku.plannedProdEaches)]
    if (factory === 'DMG') return [sku.sku, sku.description, sku.onHand, Math.round(sku.available), Math.round(sku.avgMonthlySales), sku.mos.toFixed(2), Math.round(sku.amtToSS), sku.notes]
    return [sku.sku, sku.description, sku.onHand, Math.round(sku.available), Math.round(sku.avgMonthlySales), sku.mos.toFixed(2), Math.round(sku.amtToSS), sku.notes]
  }

  const recipients = getRecipients(selectedFactory)
  const columns = getColumns(selectedFactory)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Upload Section */}
        <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Upload size={20} style={{ marginRight: '0.5rem', color: '#1b4d3e' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1b2817', margin: 0 }}>Upload Inventory Data</h2>
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 1rem 0' }}>
            Upload BeneBone Inventory Snapshot CSV to update alerts
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                Select CSV File
              </label>
              <input
                id="csvInput"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ fontSize: '12px', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !csvFile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: uploading || !csvFile ? '#ccc' : '#1b4d3e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: uploading || !csvFile ? 'not-allowed' : 'pointer',
                opacity: uploading || !csvFile ? 0.5 : 1
              }}
            >
              {uploading ? <Loader size={14} /> : <Upload size={14} />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {uploadStatus && (
            <p style={{
              fontSize: '12px',
              marginTop: '1rem',
              color: uploadStatus.startsWith('✅') ? '#059669' : '#dc2626'
            }}>
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Alert Controls */}
        <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
              Select Factory
            </label>
            <select
              value={selectedFactory}
              onChange={(e) => {
                setSelectedFactory(e.target.value)
                setAlertData(null)
              }}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', maxWidth: '300px' }}
            >
              {factories.map(f => (<option key={f} value={f}>{f}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleCheckAlerts} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#1b4d3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader size={16} /> : <span>📊</span>}
              {loading ? 'Analyzing...' : 'Check Alerts'}
            </button>

            <button onClick={handleDownloadWord} disabled={loading || alertCount === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#2d5016', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading || alertCount === 0 ? 'not-allowed' : 'pointer', opacity: loading || alertCount === 0 ? 0.6 : 1 }}>
              <Download size={16} />
              {loading ? 'Generating...' : 'Download as Word'}
            </button>
            
            <button disabled style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#ccc', color: '#666', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', opacity: 0.5 }} title="Coming in Phase 2">
              <Mail size={16} />
              Send Email (Phase 2)
            </button>
          </div>
        </div>

        {/* Preview Table */}
        {alertData && (
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Weekly Low SKU Alert - {selectedFactory}</h2>
              <p style={{ fontSize: '13px', color: '#666', margin: '0.5rem 0 0 0' }}>Generated: {new Date().toLocaleString()}</p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '13px', color: '#333', margin: '0 0 0.5rem 0' }}>
                <strong>To:</strong> {recipients.to.join(', ')}
              </p>
              <p style={{ fontSize: '13px', color: '#333', margin: '0 0 1rem 0' }}>
                <strong>CC:</strong> {recipients.cc.join(', ')}
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 1.5rem 0' }}>
                <strong>SKUs on Alert (MOS ≤ {alertData.threshold}):</strong> {alertCount}
              </p>
            </div>

            <div style={{ overflowX: 'auto', borderTop: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {columns.map(col => (
                      <th key={col} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1b2817', borderBottom: '2px solid #e5e7eb' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertData.skus.map((sku, i) => {
                    const rowData = getRowData(sku, selectedFactory)
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {rowData.map((val, j) => (
                          <td key={j} style={{ padding: '0.75rem', color: '#666' }}>
                            {j === 0 ? <strong>{val}</strong> : val}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
