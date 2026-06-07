'use client'

import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function KPICard({ title, value, icon, trend }: KPICardProps) {
  return (
    <div
      className="bg-white rounded-lg p-6 flex flex-col gap-2"
      style={{
        border: '1px solid #E5DDD0',
        borderLeft: '4px solid #E2C063',
        boxShadow: '0 2px 8px rgba(45, 41, 36, 0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: '#6B6560' }}
        >
          {title}
        </span>
        <span style={{ color: '#E2C063' }}>{icon}</span>
      </div>

      <div
        className="text-2xl font-bold"
        style={{
          fontFamily: 'var(--font-space)',
          color: '#2D2924',
        }}
      >
        {value}
      </div>

      {trend && (
        <p className="text-xs" style={{ color: trend.isPositive ? '#15803d' : '#dc2626' }}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
        </p>
      )}
    </div>
  )
}
