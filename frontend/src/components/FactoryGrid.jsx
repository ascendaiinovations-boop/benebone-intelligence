import React from 'react'
import { Mail, Users } from 'lucide-react'

function FactoryGrid({ factories, factoryEmails }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {factories.map(factory => (
        <div
          key={factory.id}
          style={{
            background: 'white',
            border: `2px solid ${factory.color}`,
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
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
          {/* Factory Name */}
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: factory.color,
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: `1px solid ${factory.light}`
          }}>
            {factory.name}
          </div>

          {/* Configuration */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '0.75rem'
            }}>
              Configuration
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>MOS Threshold:</span>
                <span style={{ fontWeight: 600, color: factory.color }}>
                  {factory.mosThreshold}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Alert Level:</span>
                <span style={{ fontWeight: 600, color: '#2d5016' }}>
                  Wednesday Weekly
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Format:</span>
                <span style={{ fontWeight: 600, color: '#3a7d44' }}>
                  HTML Table
                </span>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users size={14} />
              Recipients ({factoryEmails[factory.id]?.length || 0})
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '12px' }}>
              {factoryEmails[factory.id]?.map((email, idx) => (
                <div
                  key={idx}
                  style={{
                    background: factory.light,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    color: factory.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    wordBreak: 'break-all'
                  }}
                >
                  <Mail size={12} />
                  {email}
                </div>
              ))}
            </div>
          </div>

          {/* CC Recipients (for all) */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Mail size={14} />
              Always CC
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '12px' }}>
              <div style={{
                background: '#f0fdf4',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                color: '#22c55e',
                wordBreak: 'break-all'
              }}>
                punam@benebone.com
              </div>
              <div style={{
                background: '#f0fdf4',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                color: '#22c55e',
                wordBreak: 'break-all'
              }}>
                carly@benebone.com
              </div>
              <div style={{
                background: '#f0fdf4',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                color: '#22c55e',
                wordBreak: 'break-all'
              }}>
                zach@benebone.com
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FactoryGrid
