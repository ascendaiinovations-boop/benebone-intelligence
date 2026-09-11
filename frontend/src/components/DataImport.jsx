import React, { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'

function DataImport({ onDataImported }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [importedData, setImportedData] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      
      const response = await fetch('/api/uploadInventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: text })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(`✅ Successfully imported ${data.alertCount} alerts!`)
      setImportedData(data.alerts)
      setFile(null)
      
      if (onDataImported) {
        onDataImported(data.alerts)
      }

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '1rem',
        color: '#1b2817'
      }}>
        📊 Import Inventory Data
      </h2>

      <p style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '1.5rem',
        lineHeight: '1.6'
      }}>
        Upload a CSV or Excel file with your inventory data. 
        Required columns: SKU, Description, OnHand, AverageMonthlySales, Factory, SegmentBand
      </p>

      <div style={{
        border: '2px dashed #3a7d44',
        borderRadius: '6px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f0fdf4',
        marginBottom: '1.5rem'
      }}>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{
            display: 'none'
          }}
          id="fileInput"
        />
        
        <label htmlFor="fileInput" style={{
          cursor: 'pointer',
          display: 'block'
        }}>
          <Upload size={32} style={{
            color: '#2d5016',
            marginBottom: '0.5rem',
            margin: '0 auto 0.5rem'
          }} />
          
          <p style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#2d5016',
            marginBottom: '0.5rem'
          }}>
            {file ? file.name : 'Click to select file or drag and drop'}
          </p>
          
          <p style={{
            fontSize: '12px',
            color: '#666'
          }}>
            CSV or Excel files only
          </p>
        </label>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: '0.25rem' }}>
              Upload Failed
            </p>
            <p style={{ color: '#7f1d1d', fontSize: '14px' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <CheckCircle size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#15803d', fontWeight: 600 }}>
              {success}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: '0.75rem 1.5rem',
          background: file && !loading ? '#2d5016' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: file && !loading ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (file && !loading) {
            e.target.style.background = '#1b2817'
          }
        }}
        onMouseLeave={(e) => {
          if (file && !loading) {
            e.target.style.background = '#2d5016'
          }
        }}
      >
        {loading ? (
          <>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={16} />
            Upload File
          </>
        )}
      </button>

      {importedData && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '6px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '0.75rem',
            color: '#666'
          }}>
            📋 Imported Alerts ({importedData.length})
          </h3>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '12px'
          }}>
            {importedData.slice(0, 5).map((alert, idx) => (
              <div key={idx} style={{
                padding: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: 600, color: '#1b2817' }}>
                  {alert.sku}
                </span>
                <span style={{ 
                  color: alert.priority === 'critical' ? '#dc2626' : '#f59e0b'
                }}>
                  {alert.priority.toUpperCase()}
                </span>
              </div>
            ))}
            {importedData.length > 5 && (
              <div style={{
                padding: '0.5rem',
                textAlign: 'center',
                color: '#999',
                fontStyle: 'italic'
              }}>
                ... and {importedData.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataImport
