import React, { useState } from 'react'
import './App.css'

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM')
  const [alerts, setAlerts] = useState([])
  const [uploadStatus, setUploadStatus] = useState({ csv: '', report: '', po: '' })
  const [lastUpdate, setLastUpdate] = useState({ csv: 'Never', report: 'Never', po: 'Never' })

  const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']

  // INVENTORY CSV UPLOAD
  const handleInventoryUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadStatus(prev => ({ ...prev, csv: 'Uploading...' }))
      const response = await fetch('/api/upload-inventory', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setUploadStatus(prev => ({ ...prev, csv: data.success ? '✅ Uploaded Successfully' : '❌ Upload Failed' }))
      setLastUpdate(prev => ({ ...prev, csv: new Date().toLocaleString() }))
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, csv: '❌ Error uploading file' }))
    }
  }

  // WEEKLY REPORT UPLOAD
  const handleReportUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadStatus(prev => ({ ...prev, report: 'Uploading...' }))
      const response = await fetch('/api/upload-report', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setUploadStatus(prev => ({ ...prev, report: data.success ? '✅ Uploaded Successfully' : '❌ Upload Failed' }))
      setLastUpdate(prev => ({ ...prev, report: new Date().toLocaleString() }))
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, report: '❌ Error uploading file' }))
    }
  }

  // PO & RECEIVING LOG UPLOAD
  const handlePOUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadStatus(prev => ({ ...prev, po: 'Uploading...' }))
      const response = await fetch('/api/upload-po', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setUploadStatus(prev => ({ ...prev, po: data.success ? '✅ Uploaded Successfully' : '❌ Upload Failed' }))
      setLastUpdate(prev => ({ ...prev, po: new Date().toLocaleString() }))
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, po: '❌ Error uploading file' }))
    }
  }

  // CHECK ALERTS
  const handleCheckAlerts = async () => {
    try {
      const response = await fetch('/api/get-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      })
      const data = await response.json()
      setAlerts(data.skus || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>🍖 Benebone Intelligence Platform</h1>
        <p>Weekly Inventory Alert System</p>
      </header>

      {/* UPLOAD SECTION */}
      <section className="upload-section">
        <h2>📤 File Uploads</h2>
        <p className="section-subtitle">Upload the latest files to keep results fresh</p>

        <div className="upload-grid">
          {/* CSV UPLOAD */}
          <div className="upload-card">
            <div className="upload-header">
              <span className="upload-badge weekly">WEEKLY ⭐⭐⭐</span>
              <h3>📊 Inventory Snapshot CSV</h3>
            </div>
            
            <div className="upload-instructions">
              <p><strong>File:</strong> BeneBone Inventory Snapshot [DATE].csv</p>
              <p><strong>When:</strong> Every Monday morning</p>
              <p><strong>Why:</strong> Stock levels change weekly - upload latest snapshot to get fresh alerts</p>
              <p><strong>Impact:</strong> 🔴 HIGH - Results change immediately</p>
            </div>

            <label className="file-upload-button">
              <span>📁 Choose CSV File</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleInventoryUpload}
                style={{ display: 'none' }}
              />
            </label>

            <div className="upload-status">
              {uploadStatus.csv && <p>{uploadStatus.csv}</p>}
              {lastUpdate.csv !== 'Never' && <p>Last updated: {lastUpdate.csv}</p>}
            </div>
          </div>

          {/* REPORT UPLOAD */}
          <div className="upload-card">
            <div className="upload-header">
              <span className="upload-badge monthly">MONTHLY</span>
              <h3>📈 Weekly Inventory Report</h3>
            </div>
            
            <div className="upload-instructions">
              <p><strong>File:</strong> Weekly Inventory Report [M-DD-YYYY].xlsx</p>
              <p><strong>When:</strong> Once a month (or after major stock swings)</p>
              <p><strong>Why:</strong> Recalculates MOS trends and provides analysis</p>
              <p><strong>Impact:</strong> 🟡 MEDIUM - Information only</p>
            </div>

            <label className="file-upload-button">
              <span>📁 Choose Excel File</span>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleReportUpload}
                style={{ display: 'none' }}
              />
            </label>

            <div className="upload-status">
              {uploadStatus.report && <p>{uploadStatus.report}</p>}
              {lastUpdate.report !== 'Never' && <p>Last updated: {lastUpdate.report}</p>}
            </div>
          </div>

          {/* PO LOG UPLOAD */}
          <div className="upload-card">
            <div className="upload-header">
              <span className="upload-badge monthly">WEEKLY</span>
              <h3>📦 PO & Receiving Log</h3>
            </div>
            
            <div className="upload-instructions">
              <p><strong>File:</strong> PO & Receiving Log.xlsm</p>
              <p><strong>When:</strong> Weekly (if orders change)</p>
              <p><strong>Why:</strong> Updates inbound inventory and arrival dates</p>
              <p><strong>Impact:</strong> 🟡 MEDIUM - Shows future supply</p>
            </div>

            <label className="file-upload-button">
              <span>📁 Choose Excel File</span>
              <input 
                type="file" 
                accept=".xlsm,.xlsx" 
                onChange={handlePOUpload}
                style={{ display: 'none' }}
              />
            </label>

            <div className="upload-status">
              {uploadStatus.po && <p>{uploadStatus.po}</p>}
              {lastUpdate.po !== 'Never' && <p>Last updated: {lastUpdate.po}</p>}
            </div>
          </div>
        </div>

        <div className="upload-note">
          <p>💡 <strong>Tip:</strong> Upload the CSV every week (Monday recommended) for fresh alerts. Other files are optional but recommended.</p>
        </div>
      </section>

      {/* ALERTS SECTION */}
      <section className="alerts-section">
        <h2>🚨 Check Alerts</h2>

        <div className="controls">
          <select 
            value={selectedFactory} 
            onChange={(e) => setSelectedFactory(e.target.value)}
            className="factory-select"
          >
            {factories.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <button 
            onClick={handleCheckAlerts}
            className="check-alerts-button"
          >
            Check Alerts for {selectedFactory}
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="results">
            <h3>{selectedFactory} Factory - {alerts.length} Alerts</h3>
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>MOS</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 20).map(sku => (
                  <tr key={sku.sku}>
                    <td>{sku.sku}</td>
                    <td>{sku.mos}</td>
                    <td>{sku.quantity}</td>
                    <td>🔴 ALERT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
