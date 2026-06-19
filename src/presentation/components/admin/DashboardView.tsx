'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { KPICard } from './KPICard'
import { MessageSquare, TrendingUp, Users, FolderOpen } from 'lucide-react'

interface DashboardViewProps {
  totalQuotes: number
  newQuotes: number
  convertedQuotes: number
  totalLeads: number
  totalProjects: number
  quotesTrend: Array<{ date: string; count: number }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-4 py-3 text-fluid-sm"
        style={{
          backgroundColor: '#fff',
          border: '1px solid #E5DDD0',
          boxShadow: '0 4px 12px rgba(45,41,36,0.08)',
          color: 'var(--neutral-800)',
        }}
      >
        <p className="font-medium mb-1" style={{ color: '#6B6560' }}>
          {label}
        </p>
        <p style={{ color: 'var(--contigo-primary)', fontFamily: 'var(--font-space)', fontWeight: 700 }}>
          {payload[0].value} quotes
        </p>
      </div>
    )
  }
  return null
}

export function DashboardView({
  totalQuotes,
  newQuotes,
  convertedQuotes,
  totalLeads,
  totalProjects,
  quotesTrend,
}: DashboardViewProps) {
  const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-fluid-sm" style={{ color: '#6B6560' }}>
          Business overview — real-time data
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Quotes"
          value={totalQuotes}
          icon={<MessageSquare className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
          trend={{ value: 12, label: 'vs last month', isPositive: true }}
        />
        <KPICard
          title="New Quotes"
          value={newQuotes}
          icon={<TrendingUp className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
        />
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
        />
        <KPICard
          title="Active Leads"
          value={totalLeads}
          icon={<Users className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
        />
      </div>

      {/* Chart */}
      <div
        className="bg-white rounded-lg"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0E8DC' }}>
          <h2
            className="text-fluid-xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
          >
            Quote Volume — Last 7 Days
          </h2>
        </div>
        <div className="px-6 pb-6 pt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={quotesTrend} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B6560', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B6560', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226,192,99,0.06)' }} />
              <Bar dataKey="count" fill="var(--contigo-primary)" radius={[4, 4, 0, 0]} name="Quotes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="bg-white rounded-lg p-6"
          style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <FolderOpen className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" style={{ color: 'var(--contigo-primary)' }} />
            <p className="text-fluid-xs font-medium uppercase tracking-wider" style={{ color: '#6B6560' }}>
              Total Projects
            </p>
          </div>
          <p
            className="text-fluid-3xl font-bold"
            style={{ fontFamily: 'var(--font-space)', color: 'var(--neutral-800)' }}
          >
            {totalProjects}
          </p>
        </div>
        <div
          className="bg-white rounded-lg p-6"
          style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" style={{ color: 'var(--contigo-primary)' }} />
            <p className="text-fluid-xs font-medium uppercase tracking-wider" style={{ color: '#6B6560' }}>
              Active Leads
            </p>
          </div>
          <p
            className="text-fluid-3xl font-bold"
            style={{ fontFamily: 'var(--font-space)', color: 'var(--neutral-800)' }}
          >
            {totalLeads}
          </p>
        </div>
      </div>
    </div>
  )
}
