import React, { useState } from 'react'
import { Download, Mail } from 'lucide-react'
import Header from './components/Header'
import FactorySelector from './components/FactorySelector'
import AlertPreview from './components/AlertPreview'
import { generateAlertWord } from './utils/wordGenerator'
import { INVENTORY_DATA, FACTORY_CONFIG, FACTORY_RECIPIENTS } from './data/inventory'

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM')
  const [downloading, setDownloading] = useState(false)

  const handleDownloadWord = async () => {
    setDownloading(true)
    try {
      await generateAlertWord(selectedFactory, INVENTORY_DATA, FACTORY_CONFIG, FACTORY_RECIPIENTS)
    } catch (error) {
      alert('Error generating document: ' + error.message)
    } finally {
      setDownloading(false)
    }
  }

  const factories = Object.keys(FACTORY_CONFIG)
  const selectedConfig = FACTORY_CONFIG[selectedFactory]
  const alertSkus = INVENTORY_DATA.filter(sku => {
    const mosSetting = FACTORY_CONFIG[selectedFactory]
    return (
      (sku.factoryFlag?.[selectedFactory] !== false) &&
      sku.mos <= mosSetting.threshold &&
      sku.plannedProd > 0 &&
      sku.exclude !== 'X'
    )
  })

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
              onChange={(e) => setSelectedFactory(e.target.value)}
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

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleDownloadWord}
              disabled={downloading || alertSkus.length === 0}
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
                cursor: downloading || alertSkus.length === 0 ? 'not-allowed' : 'pointer',
                opacity: downloading || alertSkus.length === 0 ? 0.6 : 1
              }}
            >
              <Download size={16} />
              {downloading ? 'Generating...' : 'Download as Word'}
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

        {/* Alert Info */}
        <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1b2817', marginBottom: '0.5rem' }}>
            {selectedFactory} Alert Summary
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            MOS Threshold: ≤ {selectedConfig.threshold} | SKUs on Alert: <strong>{alertSkus.length}</strong>
          </p>
          {alertSkus.length === 0 && (
            <p style={{ color: '#f59e0b', fontSize: '14px', marginTop: '0.5rem' }}>
              No SKUs on alert for {selectedFactory} this week.
            </p>
          )}
        </div>

        {/* Preview Table */}
        {alertSkus.length > 0 && (
          <AlertPreview factory={selectedFactory} skus={alertSkus.slice(0, 10)} />
        )}
      </div>
    </div>
  )
}
