import React from 'react'

export default function FactorySelector({ value, onChange, factories }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
        Select Factory
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  )
}
