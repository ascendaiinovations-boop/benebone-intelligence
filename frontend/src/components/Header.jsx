import React from 'react'
import { Menu, X } from 'lucide-react'

function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#666',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1b2817', margin: 0 }}>
            Benebone Intelligence
          </h1>
          <p style={{ fontSize: '12px', color: '#999', margin: '0.25rem 0 0 0' }}>
            Inventory Management System
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ fontSize: '11px', color: '#999' }}>
          Last sync: {new Date().toLocaleTimeString()}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          paddingLeft: '1.5rem',
          borderLeft: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #2d5016 0%, #1b2817 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b9a7b',
            fontSize: '14px',
            fontWeight: 700
          }}>
            B
          </div>
          <div style={{ fontSize: '12px', color: '#1b2817', fontWeight: 500 }}>
            Benebone
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
