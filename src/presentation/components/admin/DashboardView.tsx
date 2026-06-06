'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { KPICard } from './KPICard'
import { MessageSquare, TrendingUp, FolderOpen, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'

interface DashboardViewProps {
  totalQuotes: number
  newQuotes: number
  convertedQuotes: number
  totalLeads: number
  totalProjects: number
  quotesTrend: Array<{ date: string; count: number }>
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your business overview.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Quotes"
          value={totalQuotes}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{ value: 12, label: 'vs last month', isPositive: true }}
        />
        <KPICard
          title="New Quotes"
          value={newQuotes}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Active Leads"
          value={totalLeads}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Chart */}
      <Card className="bg-white">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle>Quotes Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quotesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Quotes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Leads</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
