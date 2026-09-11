// Force rebuild 1789164939
import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, Gauge, Package, Truck, Users, TrendingDown, Download, Send, Menu, X, Filter, RefreshCw
} from 'lucide-react'
import Header from './components/Header'
import FactoryGrid from './components/FactoryGrid'
import AlertsDashboard from './components/AlertsDashboard'
import InventoryTable from './components/InventoryTable'
import DataImport from './components/DataImport'

const factories = [
  { id: 'aim', name: 'AIM', color: '#2d5016', light: '#e8f0e2', mosThreshold: 1.5 },
  { id: 'midbury', name: 'Midbury', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: 'ltm', name: 'LTM', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: '201', name: '201', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: 'bennett', name: 'Bennett', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: 'dmg', name: 'DMG', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: 'coltoys', name: 'Coltoys', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 },
  { id: 'lovingpets', name: 'Loving Pets', color: '#3a7d44', light: '#e8f5e1', mosThreshold: 2.0 }
]

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [inventory, setInventory] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [importedAlerts, setImportedAlerts] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadInventoryData()
    // Check for previously imported data
    const saved = localStorage.getItem('benebone_imported_alerts')
    if (saved) {
      try {
        setImportedAlerts(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved alerts:', e)
      }
    }
  }, [])

  const loadInventoryData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      setInventory(data.skus || [])
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDataImported = (importedData) => {
    setImportedAlerts(importedData)
    localStorage.setItem('benebone_imported_alerts', JSON.stringify(importedData))
    setActiveTab('alerts')
  }

  // Use imported data if available, otherwise use mock/API data
  const currentAlerts = importedAlerts || alerts

  const filteredAlerts = selectedFactory
    ? currentAlerts.filter(a => a.factory === selectedFactory)
    : currentAlerts.filter(a => {
        if (filterType === 'critical') return a.priority === 'critical'
        if (filterType === 'warning') return a.priority === 'warning'
        return true
      })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '0',
        background: '#1b2817',
        color: 'white',
        padding: sidebarOpen ? '1.5rem' : '0',
        transition: 'all 0.3s',
        overflow: 'hidden',
        borderRight: '1px solid #333'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2rem' }}>
            Navigation
          </h2>
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'factories', label: 'Factories', icon: Truck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setShowSettings(false)
                setSelectedFactory(null)
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: activeTab === tab.id ? '#2d5016' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid #333'
        }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: showSettings ? '#2d5016' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            ⚙️ Data Import
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          importedCount={importedAlerts ? importedAlerts.length : 0}
        />

        <div style={{ padding: '2rem' }}>
          {/* Data Import Section */}
          {showSettings && (
            <div style={{ marginBottom: '2rem' }}>
              <DataImport onDataImported={handleDataImported} />
              {importedAlerts && (
                <div style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <p style={{ color: '#15803d', fontWeight: 600 }}>
                    ✅ Using {importedAlerts.length} imported alerts
                  </p>
                  <button
                    onClick={() => {
                      setImportedAlerts(null)
                      localStorage.removeItem('benebone_imported_alerts')
                    }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Imported Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '2rem', color: '#1b2817' }}>
                Benebone Inventory Intelligence
              </h1>
              
              {importedAlerts && (
                <div style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <p style={{ color: '#15803d', fontWeight: 600 }}>
                    📊 Displaying real data: {importedAlerts.length} alerts imported
                  </p>
                </div>
              )}

              <FactoryGrid factories={factories} factoryEmails={{}} />
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '1rem', color: '#1b2817' }}>
                  All Alerts
                </h1>

                {importedAlerts && (
                  <div style={{
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ color: '#15803d', fontWeight: 600 }}>
                      ✅ Using {importedAlerts.length} real imported alerts
                    </p>
                  </div>
                )}

                {/* Download Word Document Button */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/generateWord', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            factory: selectedFactory || 'All',
                            alerts: filteredAlerts,
                            mosThreshold: factories.find(f => f.id === selectedFactory)?.mosThreshold || 1.5
                          })
                        })
                        if (!response.ok) throw new Error('Download failed')
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `Weekly_Low_SKU_Alert_${selectedFactory || 'All'}_${new Date().toISOString().split('T')[0]}.docx`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } catch (error) {
                        alert('Failed to download Word document: ' + error.message)
                      }
                    }}
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
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1b2817'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2d5016'}
                  >
                    <span style={{ fontSize: '16px' }}>📄</span>
                    Download as Word Document
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => setFilterType('all')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: filterType === 'all' ? '#2d5016' : '#f0f0f0',
                      color: filterType === 'all' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    All ({filteredAlerts.length})
                  </button>
                  <button
                    onClick={() => setFilterType('critical')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: filterType === 'critical' ? '#dc2626' : '#f0f0f0',
                      color: filterType === 'critical' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Critical ({filteredAlerts.filter(a => a.priority === 'critical').length})
                  </button>
                  <button
                    onClick={() => setFilterType('warning')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: filterType === 'warning' ? '#f59e0b' : '#f0f0f0',
                      color: filterType === 'warning' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Warning ({filteredAlerts.filter(a => a.priority === 'warning').length})
                  </button>
                </div>
              </div>

              <AlertsDashboard alerts={filteredAlerts} factory={null} />
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '2rem', color: '#1b2817' }}>
                Inventory Search
              </h1>
              <InventoryTable skus={inventory} />
            </div>
          )}

          {/* Factories Tab */}
          {activeTab === 'factories' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '2rem', color: '#1b2817' }}>
                Factory Configuration
              </h1>
              <FactoryGrid factories={factories} factoryEmails={{}} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
