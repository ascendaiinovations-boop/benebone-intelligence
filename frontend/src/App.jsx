import React, { useState } from 'react'
import { Download, Mail, Loader, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import Header from './components/Header'

export default function App() {
  const [uploadingCSV, setUploadingCSV] = useState(false)
  const [uploadingReport, setUploadingReport] = useState(false)
  const [uploadingPO, setUploadingPO] = useState(false)
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

  const validateFileSize = (file, maxMB = 50) => {
    if (!file || typeof file !== 'object') {
      return { valid: false, error: 'Invalid file selected' }
    }
    if (typeof file.size !== 'number' || file.size < 0) {
      return { valid: false, error: 'Unable to read file size' }
    }
    if (maxMB <= 0) {
      return { valid: false, error: 'Invalid file size limit' }
    }
    const maxBytes = maxMB * 1024 * 1024
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: ${maxMB}MB. Try a smaller file.`
      }
    }
    return { valid: true }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const validation = validateFileSize(file)
    if (!validation.valid) {
      setUploadStatus(`❌ ${validation.error}`)
      e.target.value = ''
      return
    }
    
    setCsvFile(file)
    setUploadStatus('')
  }

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadStatus('❌ Please select a CSV file')
      return
    }

    const validation = validateFileSize(csvFile)
    if (!validation.valid) {
      setUploadStatus(`❌ ${validation.error}`)
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
        let errorMsg = data.error || 'Upload failed'
        
        if (errorMsg.includes('Missing column') || errorMsg.includes('missing')) {
          errorMsg = `❌ CSV format error: ${errorMsg}. Required columns: SKU, OnHand, Available, Avg Monthly Sales.`
        } else if (errorMsg.includes('Duplicate') || errorMsg.includes('duplicate')) {
          errorMsg = `❌ Data error: ${errorMsg}`
        } else if (errorMsg.includes('empty') || errorMsg.includes('Empty')) {
          errorMsg = '❌ CSV file is empty. Please check your file and try again.'
        } else {
          errorMsg = `❌ ${errorMsg}`
        }
        
        setUploadStatus(errorMsg)
      } else {
        setUploadStatus(`✅ Success! Loaded ${data.skuCount} SKUs`)
        setCsvFile(null)
        document.getElementById('csvInput').value = ''
        handleCheckAlerts()
      }
    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error.message}. Please check your connection and try again.`)
    } finally {
      setUploading(false)
    }
  }

  const handleReportUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateFileSize(file)
    if (!validation.valid) {
      setReportStatus(`❌ ${validation.error}`)
      e.target.value = ''
      return
    }

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
        let errorMsg = data.error || 'Upload failed'
        if (errorMsg.includes('format') || errorMsg.includes('invalid')) {
          errorMsg = `File format error: ${errorMsg}. Please use .xlsx or .xls format.`
        }
        setReportStatus(`❌ ${errorMsg}`)
      }
    } catch (error) {
      setReportStatus(`❌ Error: ${error.message}. Please check your connection and try again.`)
    }
  }

  const handlePoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateFileSize(file)
    if (!validation.valid) {
      setPoStatus(`❌ ${validation.error}`)
      e.target.value = ''
      return
    }

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
        let errorMsg = data.error || 'Upload failed'
        if (errorMsg.includes('format') || errorMsg.includes('invalid')) {
          errorMsg = `File format error: ${errorMsg}. Please use .xlsm or .xlsx format.`
        }
        setPoStatus(`❌ ${errorMsg}`)
      }
    } catch (error) {
      setPoStatus(`❌ Error: ${error.message}. Please check your connection and try again.`)
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
      '201': { to: ['emilio.otero@201oficial.com.mx'], cc: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'] },
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
                    padding: '0.875rem 1.2rem',
                    minHeight: '44px',
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
                    padding: '0.875rem 1.2rem',
                    minHeight: '44px',
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
                    padding: '0.875rem 1.2rem',
                    minHeight: '44px',
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
            <button onClick={handleCheckDataQuality} disabled={qualityLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', minHeight: '44px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: qualityLoading ? 'not-allowed' : 'pointer', opacity: qualityLoading ? 0.6 : 1 }}>
              {qualityLoading ? <Loader size={14} /> : <span>🔍</span>}
              {qualityLoading ? 'Checking...' : 'Data Quality'}
            </button>

            <button onClick={handleCheckAlerts} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', minHeight: '44px', background: '#1b4d3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader size={14} /> : <span>📊</span>}
              {loading ? 'Checking...' : 'Check Alerts'}
            </button>

            <button onClick={handleDownloadWord} disabled={loading || alertCount === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', minHeight: '44px', background: '#1b4d3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: loading || alertCount === 0 ? 'not-allowed' : 'pointer', opacity: loading || alertCount === 0 ? 0.6 : 1 }}>
              <Download size={14} />
              {loading ? 'Generating...' : 'Download Word'}
            </button>
            
            <button disabled style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', minHeight: '44px', background: '#ccc', color: '#666', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'not-allowed', opacity: 0.5 }}>
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

        {/* BENEBONE BRANDED PRIVACY FOOTER - PROFESSIONAL & BEAUTIFUL */}
        <footer style={{ 
          marginTop: '4rem', 
          paddingTop: '2rem',
          borderTop: '3px solid #1b4d3e',
          background: 'linear-gradient(135deg, #1b4d3e 0%, #0d1117 100%)'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
            {/* Benebone Branding & Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#c4975a', marginBottom: '0.5rem' }}>
                🦴 Benebone
              </div>
              <div style={{ fontSize: '14px', color: '#c4975a', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                Wealth for All. Intelligence for One.
              </div>
            </div>

            {/* Privacy & GDPR Section */}
            <div style={{ 
              background: 'rgba(196, 151, 90, 0.08)', 
              border: '1px solid #c4975a', 
              borderRadius: '8px', 
              padding: '2rem',
              marginBottom: '2rem'
            }}
            role="region"
            aria-label="Privacy and data protection information">
              
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                color: '#c4975a', 
                fontSize: '18px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔒 Data Protection & Privacy
              </h3>

              <p style={{ 
                margin: '0 0 1.5rem 0', 
                fontSize: '14px', 
                color: '#e0e7ff', 
                lineHeight: 1.7 
              }}>
                Your inventory data is processed exclusively for alert generation and automatically deleted within 24 hours. We never retain, share, or use your data for any other purpose. Your trust is our priority.
              </p>

              {/* Expandable GDPR Details */}
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ 
                  fontWeight: 600, 
                  color: '#c4975a',
                  padding: '0.75rem 0',
                  userSelect: 'none'
                }}>
                  ► GDPR & Data Protection Compliance Details
                </summary>
                <div style={{ 
                  marginTop: '1rem', 
                  paddingLeft: '1rem',
                  borderLeft: '2px solid #c4975a',
                  background: 'rgba(13, 17, 23, 0.3)',
                  padding: '1rem',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '13px' }}>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Article 4: Data Controller</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Ascend AI Innovations</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Article 5: Processing Purpose</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Inventory alert generation & warehouse automation</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Article 6: Legal Basis</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Legitimate interest (operations efficiency)</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Article 6A: Recipients</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Vercel (hosting), Email recipients (alerts)</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Retention Period</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Deleted automatically within 24 hours</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Your Rights</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Access, correction, deletion, portability</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>Article 13: Right to Lodge Complaint</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Contact your local data protection authority or email privacy@ascendaiinnovations.com</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#c4975a', fontWeight: 600 }}>International Data Transfer</p>
                      <p style={{ margin: 0, color: '#e0e7ff' }}>Data processed in US via Vercel, protected under Standard Contractual Clauses (SCCs)</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Contact & Footer Info */}
            <div style={{ 
              textAlign: 'center', 
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(196, 151, 90, 0.3)',
              color: '#c4975a',
              fontSize: '13px'
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>Questions?</strong> Contact us at privacy@ascendaiinnovations.com
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Data Controller: Ascend AI Innovations
              </p>
              <p style={{ margin: 0, color: '#8b7355', fontSize: '12px' }}>
                © 2026 Benebone & Ascend AI Innovations. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
