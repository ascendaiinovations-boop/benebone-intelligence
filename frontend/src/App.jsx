import React, { useState } from 'react'
import { Download, Mail, Loader, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import Header from './components/Header'

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM')
  const [loading, setLoading] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [alertData, setAlertData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [dataQualityReport, setDataQualityReport] = useState(null)
  const [qualityLoading, setQualityLoading] = useState(false)
  const [reportStatus, setReportStatus] = useState('')
  const [poStatus, setPoStatus] = useState('')
  const [expandedUpload, setExpandedUpload] = useState('csv')

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
        handleCheckAlerts()
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleReportUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setReportStatus('Uploading report...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-report', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        setReportStatus('✅ Report uploaded successfully')
        document.getElementById('reportInput').value = ''
      } else {
        setReportStatus(`❌ ${data.error || 'Upload failed'}`)
      }
    } catch (error) {
      setReportStatus(`❌ Error: ${error.message}`)
    }
  }

  const handlePoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPoStatus('Uploading PO log...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-po', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        setPoStatus('✅ PO log uploaded successfully')
        document.getElementById('poInput').value = ''
      } else {
        setPoStatus(`❌ ${data.error || 'Upload failed'}`)
      }
    } catch (error) {
      setPoStatus(`❌ Error: ${error.message}`)
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

  const handleCheckDataQuality = async () => {
    setQualityLoading(true)
    try {
      const response = await fetch('/api/data-quality')
      const data = await response.json()
      setDataQualityReport(data)
      return data.readyToProcess
    } catch (error) {
      console.error('Error checking data quality:', error)
      setDataQualityReport({
        overallScore: 0,
        status: 'FAIL',
        readyToProcess: false,
        error: error.message
      })
      return false
    } finally {
      setQualityLoading(false)
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

  const UploadAccordion = ({ id, title, emoji, badge, isExpanded, onToggle, children, statusMessage }) => (
    <div style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isExpanded ? '#f9fafb' : 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          color: '#1b2817',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>{emoji}</span>
          <span>{title}</span>
          {badge && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: badge.color, padding: '2px 8px', borderRadius: '4px', marginLeft: '0.5rem' }}>
              {badge.text}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} color="#1b4d3e" /> : <ChevronDown size={20} color="#999" />}
      </button>

      {isExpanded && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: 'white' }}>
          {children}
          {statusMessage && (
            <p style={{
              fontSize: '13px',
              marginTop: '1rem',
              color: statusMessage.startsWith('✅') ? '#059669' : '#dc2626',
              fontWeight: 600
            }}>
              {statusMessage}
            </p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1b2817', margin: '0 0 0.5rem 0' }}>
            Upload Your Data
          </h1>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Keep your inventory alerts fresh by uploading your latest data files.
          </p>
        </div>

        {/* UPLOAD ACCORDION SECTIONS */}
        <div style={{ marginBottom: '3rem' }}>
          <UploadAccordion
            id="csv"
            title="Inventory Snapshot"
            emoji="📄"
            badge={{ text: 'WEEKLY', color: '#c41e3a' }}
            isExpanded={expandedUpload === 'csv'}
            onToggle={() => setExpandedUpload(expandedUpload === 'csv' ? null : 'csv')}
            statusMessage={uploadStatus}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>File Format</h3>
              <code style={{ background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '13px', color: '#333', display: 'block' }}>
                BeneBone Inventory Snapshot [DATE].csv
              </code>
              <p style={{ fontSize: '13px', color: '#666', margin: '0.5rem 0 0 0' }}>
                Example: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>BeneBone Inventory Snapshot 20260917.csv</code>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Requirements</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
                <li>File format: <strong>.csv</strong></li>
                <li>Contains all <strong>782 SKUs</strong></li>
                <li>Columns: SKU, OnHand, Available, Avg Monthly Sales, etc.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Upload</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <input
                  id="csvInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ fontSize: '13px', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
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
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: uploading || !csvFile ? 'not-allowed' : 'pointer',
                    opacity: uploading || !csvFile ? 0.5 : 1
                  }}
                >
                  {uploading ? <Loader size={14} /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </div>
            </div>
          </UploadAccordion>

          <UploadAccordion
            id="report"
            title="Weekly Inventory Report"
            emoji="📈"
            badge={{ text: 'MONTHLY', color: '#1976d2' }}
            isExpanded={expandedUpload === 'report'}
            onToggle={() => setExpandedUpload(expandedUpload === 'report' ? null : 'report')}
            statusMessage={reportStatus}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>File Format</h3>
              <code style={{ background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '13px', color: '#333', display: 'block' }}>
                Weekly Inventory Report [M-DD-YYYY].xlsx
              </code>
              <p style={{ fontSize: '13px', color: '#666', margin: '0.5rem 0 0 0' }}>
                Example: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>Weekly Inventory Report 9-17-2026.xlsx</code>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Requirements</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
                <li>File format: <strong>.xlsx or .xls</strong></li>
                <li>Contains MOS calculations and trends</li>
                <li>File size: Max <strong>50MB</strong></li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Upload</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <input
                  id="reportInput"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleReportUpload}
                  style={{ fontSize: '13px', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    background: '#1b4d3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} />
                  Upload Report
                </button>
              </div>
            </div>
          </UploadAccordion>

          <UploadAccordion
            id="po"
            title="PO & Receiving Log"
            emoji="📦"
            badge={{ text: 'WEEKLY', color: '#1976d2' }}
            isExpanded={expandedUpload === 'po'}
            onToggle={() => setExpandedUpload(expandedUpload === 'po' ? null : 'po')}
            statusMessage={poStatus}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>File Format</h3>
              <code style={{ background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '13px', color: '#333', display: 'block' }}>
                PO & Receiving Log.xlsm
              </code>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Requirements</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
                <li>File format: <strong>.xlsm or .xlsx</strong></li>
                <li>Contains PO data, receiving status, lead times</li>
                <li>File size: Max <strong>50MB</strong></li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1b2817', margin: '0 0 0.5rem 0' }}>Upload</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <input
                  id="poInput"
                  type="file"
                  accept=".xlsm,.xlsx"
                  onChange={handlePoUpload}
                  style={{ fontSize: '13px', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    background: '#1b4d3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} />
                  Upload PO Log
                </button>
              </div>
            </div>
          </UploadAccordion>
        </div>

        {/* Alert Controls */}
        <div style={{ marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1b2817', margin: '0 0 1rem 0' }}>Generate Alerts</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
              Select Factory
            </label>
            <select
              value={selectedFactory}
              onChange={(e) => {
                setSelectedFactory(e.target.value)
                setAlertData(null)
              }}
              style={{ width: '100%', maxWidth: '300px', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
            >
              {factories.map(f => (<option key={f} value={f}>{f}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleCheckDataQuality} disabled={qualityLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: qualityLoading ? 'not-allowed' : 'pointer', opacity: qualityLoading ? 0.6 : 1 }}>
              {qualityLoading ? <Loader size={14} /> : <span>🔍</span>}
              {qualityLoading ? 'Checking...' : 'Data Quality'}
            </button>

            <button onClick={handleCheckAlerts} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#1b4d3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader size={14} /> : <span>📊</span>}
              {loading ? 'Checking...' : 'Check Alerts'}
            </button>

            <button onClick={handleDownloadWord} disabled={loading || alertCount === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#2d5016', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: loading || alertCount === 0 ? 'not-allowed' : 'pointer', opacity: loading || alertCount === 0 ? 0.6 : 1 }}>
              <Download size={14} />
              {loading ? 'Generating...' : 'Download Word'}
            </button>
            
            <button disabled style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#ccc', color: '#666', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'not-allowed', opacity: 0.5 }}>
              <Mail size={14} />
              Send (Phase 2)
            </button>
          </div>
        </div>

        {/* Alert Results */}
        {alertData && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1b2817', margin: '0 0 0.5rem 0' }}>
                Weekly Alert - {selectedFactory}
              </h2>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                Generated: {new Date().toLocaleString()}
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '12px', color: '#333', margin: '0 0 0.5rem 0' }}>
                <strong>To:</strong> {recipients.to.join(', ')}
              </p>
              <p style={{ fontSize: '12px', color: '#333', margin: '0 0 1rem 0' }}>
                <strong>CC:</strong> {recipients.cc.join(', ')}
              </p>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 1.5rem 0' }}>
                <strong>SKUs on Alert (MOS ≤ {alertData.threshold}):</strong> {alertCount}
              </p>
            </div>

            {alertCount === 0 ? (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1b2817', margin: 0 }}>No SKUs are on alert this week.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderTop: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      {columns.map(col => (
                        <th key={col} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1b2817', borderBottom: '1px solid #e5e7eb' }}>
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
