'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
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
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {trend && (
          <p
            className={`text-xs mt-2 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
