import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, Gauge, Package, Truck, Users, TrendingDown, Download, Send, Menu, X, Filter, RefreshCw
} from 'lucide-react'
import Header from './components/Header'
import FactoryGrid from './components/FactoryGrid'
import AlertsDashboard from './components/AlertsDashboard'
import InventoryTable from './components/InventoryTable'

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

const factoryEmails = {
  aim: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'],
  midbury: ['emails@midbury.com'],
  ltm: ['emails@ltm.com'],
  '201': ['emails@201.com'],
  bennett: ['emails@bennett.com'],
  dmg: ['emails@dmg.com'],
  coltoys: ['emails@coltoys.com'],
  lovingpets: ['emails@lovingpets.com']
}

const ccRecipients = ['punam@benebone.com', 'carly@benebone.com', 'zach@benebone.com']

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [inventory, setInventory] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadInventoryData()
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
      setInventory(mockInventoryData)
      setAlerts(generateMockAlerts(mockInventoryData))
    } finally {
      setLoading(false)
    }
  }

  const generateAlerts = () => {
    const newAlerts = []
    inventory.forEach(sku => {
      factories.forEach(factory => {
        const mos = sku.mos || 0
        if (mos <= factory.mosThreshold) {
          newAlerts.push({
            id: `${sku.sku}-${factory.id}`,
            sku: sku.sku,
            description: sku.description,
            factory: factory.name,
            factoryId: factory.id,
            mos: mos,
            threshold: factory.mosThreshold,
            onHand: sku.available,
            avgMonthlySales: sku.avgMonthlySales,
            amountToReachSS: sku.amountToReachSS,
            priority: mos < 1 ? 'critical' : 'warning',
            segmentBand: sku.segmentBand || 'N/A'
          })
        }
      })
    })
    return newAlerts.sort((a, b) => {
      if (a.priority === 'critical' && b.priority !== 'critical') return -1
      if (a.priority !== 'critical' && b.priority === 'critical') return 1
      return a.mos - b.mos
    })
  }

  const generateEmailContent = (factory) => {
    const factoryAlerts = alerts.filter(a => a.factoryId === factory.id)
    return {
      factory: factory.name,
      alertCount: factoryAlerts.length,
      alerts: factoryAlerts
    }
  }

  const exportToPdf = async (factory) => {
    const emailData = generateEmailContent(factory)
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factory: factory.name,
          alerts: emailData.alerts,
          timestamp: new Date().toISOString(),
          mosThreshold: factory.mosThreshold
        })
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Benebone_Alert_${factory.name}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    }
  }

  const sendAlert = async (factory) => {
    const emailData = generateEmailContent(factory)
    try {
      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factory: factory.name,
          factoryEmails: factoryEmails[factory.id],
          ccEmails: ccRecipients,
          alerts: emailData.alerts,
          mosThreshold: factory.mosThreshold
        })
      })
      const result = await response.json()
      alert(`Email sent successfully to ${factory.name}!`)
    } catch (error) {
      console.error('Error sending alert:', error)
      alert('Failed to send alert')
    }
  }

  const factoryStats = factories.map(factory => {
    const factoryAlerts = alerts.filter(a => a.factoryId === factory.id)
    const criticalCount = factoryAlerts.filter(a => a.priority === 'critical').length
    const warningCount = factoryAlerts.filter(a => a.priority === 'warning').length
    return { factory, criticalCount, warningCount, totalAlerts: factoryAlerts.length }
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f7f6' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '300px' : '0',
        background: '#1b2817',
        color: 'white',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        borderRight: '1px solid #2d5016'
      }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#8b9a7b', borderRadius: '50%' }}></div>
            Benebone
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {[
              { id: 'overview', label: 'Dashboard', icon: '📊' },
              { id: 'alerts', label: 'Alerts', icon: '🚨' },
              { id: 'inventory', label: 'Inventory', icon: '📦' },
              { id: 'factories', label: 'Factories', icon: '🏭' },
              { id: 'history', label: 'History', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.id ? '#2d5016' : 'transparent',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) e.target.style.background = '#243d1a'
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) e.target.style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {activeTab === 'overview' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1b2817', marginBottom: '0.5rem' }}>
                  Inventory Intelligence Dashboard
                </h1>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Real-time SKU alerts across all factories • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Factory Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {factoryStats.map(({ factory, criticalCount, warningCount, totalAlerts }) => (
                  <div
                    key={factory.id}
                    onClick={() => setSelectedFactory(factory)}
                    style={{
                      background: 'white',
                      border: `2px solid ${factory.color}`,
                      borderRadius: '8px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 700, color: factory.color, marginBottom: '0.75rem' }}>
                      {factory.name}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>
                          {criticalCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                          Critical
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                          {warningCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                          Warning
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      MOS Threshold: {factory.mosThreshold}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFactory && (
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${selectedFactory.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1b2817' }}>
                      {selectedFactory.name} — Detailed Alerts
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => exportToPdf(selectedFactory)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: selectedFactory.light,
                          color: selectedFactory.color,
                          border: `1px solid ${selectedFactory.color}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Download size={14} />
                        Export PDF
                      </button>
                      <button
                        onClick={() => sendAlert(selectedFactory)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: selectedFactory.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Send size={14} />
                        Send Alert
                      </button>
                    </div>
                  </div>

                  <AlertsDashboard
                    alerts={alerts.filter(a => a.factoryId === selectedFactory.id)}
                    factory={selectedFactory}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1b2817', marginBottom: '1rem' }}>
                  All SKU Alerts ({alerts.length} total)
                </h1>
              </div>
              <AlertsDashboard alerts={alerts} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1b2817', marginBottom: '1rem' }}>
                  Inventory Levels
                </h1>
              </div>
              <InventoryTable inventory={inventory} />
            </div>
          )}

          {activeTab === 'factories' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1b2817', marginBottom: '1rem' }}>
                  Factory Configuration
                </h1>
              </div>
              <FactoryGrid factories={factories} factoryEmails={factoryEmails} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mock data for testing
const mockInventoryData = [
  { sku: '880244', description: 'Benebone Wishbone Bacon Medium 60PK', available: 76, avgMonthlySales: 50, mos: 1.52, amountToReachSS: 24, segmentBand: 'A' },
  { sku: '881244', description: 'Benebone Bacon Mini 60PK', available: 2, avgMonthlySales: 45, mos: 0.04, amountToReachSS: 88, segmentBand: 'A' },
  { sku: '882244', description: 'Benebone Bacon Large 60PK', available: 2, avgMonthlySales: 35, mos: 0.06, amountToReachSS: 70, segmentBand: 'B' },
  { sku: '890244', description: 'Benebone Dental Chew Medium 60PK', available: 53, avgMonthlySales: 40, mos: 1.33, amountToReachSS: 27, segmentBand: 'B' },
  { sku: '901244', description: 'Benebone Peanut Butter Medium 60PK', available: 17, avgMonthlySales: 55, mos: 0.31, amountToReachSS: 93, segmentBand: 'C' }
]

const generateMockAlerts = (inventory) => {
  const mockAlerts = []
  inventory.forEach(sku => {
    factories.forEach(factory => {
      if (sku.mos <= factory.mosThreshold) {
        mockAlerts.push({
          id: `${sku.sku}-${factory.id}`,
          sku: sku.sku,
          description: sku.description,
          factory: factory.name,
          factoryId: factory.id,
          mos: sku.mos,
          threshold: factory.mosThreshold,
          onHand: sku.available,
          avgMonthlySales: sku.avgMonthlySales,
          amountToReachSS: sku.amountToReachSS,
          priority: sku.mos < 1 ? 'critical' : 'warning',
          segmentBand: sku.segmentBand
        })
      }
    })
  })
  return mockAlerts
}

export default App
