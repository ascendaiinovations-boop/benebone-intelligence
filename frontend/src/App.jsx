import React, { useState, useEffect } from 'react'
import { Download, Mail, Loader } from 'lucide-react'
import Header from './components/Header'

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM')
  const [loading, setLoading] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [alertData, setAlertData] = useState(null)

  const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets']

  const handleDownloadWord = async () => {
    setLoading(true)
    try {
      // Call backend API to analyze inventory with Claude
      const response = await fetch('/api/generate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      })

      if (!response.ok) throw new Error('Failed to generate alert')

      // Get the .docx blob
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
      setAlertCount(data.skus?.length || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Controls */}
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
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                maxWidth: '300px'
              }}
            >
              {factories.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCheckAlerts}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#1b4d3e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <span>📊</span>}
              {loading ? 'Analyzing...' : 'Check Alerts'}
            </button>

            <button
              onClick={handleDownloadWord}
              disabled={loading || alertCount === 0}
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
                cursor: loading || alertCount === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || alertCount === 0 ? 0.6 : 1
              }}
            >
              <Download size={16} />
              {loading ? 'Generating...' : 'Download as Word'}
            </button>
            
            <button
              disabled
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#ccc',
                color: '#666',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'not-allowed',
                opacity: 0.5
              }}
              title="Coming in Phase 2"
            >
              <Mail size={16} />
              Send Email (Phase 2)
            </button>
          </div>
        </div>

        {/* Status */}
        {alertData && (
          <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1b2817', marginBottom: '0.5rem' }}>
              {selectedFactory} Alert Analysis
            </h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Threshold: ≤ {alertData.threshold} MOS | SKUs on Alert: <strong>{alertCount}</strong>
            </p>
            <p style={{ color: '#888', fontSize: '12px', marginTop: '0.5rem' }}>
              Generated by Claude AI • {new Date().toLocaleString()}
            </p>
          </div>
        )}

        {/* Info */}
        <div style={{ background: '#eef2e8', padding: '1rem', borderRadius: '6px', border: '1px solid #2d5016' }}>
          <p style={{ fontSize: '14px', color: '#1b2817', margin: 0 }}>
            <strong>Phase 1.5 - AI-Powered Analysis:</strong> Click "Check Alerts" to have Claude analyze inventory using real data from your files. Then download the Word document to copy-paste into email manually.
          </p>
        </div>
      </div>
    </div>
  )
}
