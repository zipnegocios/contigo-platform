'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { KPICard } from '@/presentation/components/admin/KPICard'
import { Clock } from 'lucide-react'

interface ReviewsAnalyticsClientProps {
  reviewsPerMonth: Array<{ month: string; count: number }>
  ratingTrend: Array<{ month: string; average: number | null }>
  starDistribution: Array<{ star: string; count: number }>
  avgResponseDays: number | null
  requestFunnelPerMonth: Array<{ month: string; sent: number; reviewed: number }>
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg" style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}>
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0E8DC' }}>
        <h2 className="text-fluid-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}>
          {title}
        </h2>
      </div>
      <div className="px-6 pb-6 pt-4">{children}</div>
    </div>
  )
}

const axisTick = { fill: '#6B6560', fontSize: 12, fontFamily: 'var(--font-space)' }

export function ReviewsAnalyticsClient({
  reviewsPerMonth,
  ratingTrend,
  starDistribution,
  avgResponseDays,
  requestFunnelPerMonth,
}: ReviewsAnalyticsClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Avg. Response Time"
          value={avgResponseDays === null ? 'No replies yet' : `${avgResponseDays.toFixed(1)} days`}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <ChartCard title="Reviews per Month">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={reviewsPerMonth} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--contigo-primary)" radius={[4, 4, 0, 0]} name="Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Rating Trend">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ratingTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} tick={axisTick} axisLine={false} tickLine={false} allowDecimals />
            <Tooltip />
            <Line type="monotone" dataKey="average" stroke="#E2C063" strokeWidth={2} dot connectNulls name="Avg. rating" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Star Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={starDistribution} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="star" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#E2C063" radius={[4, 4, 0, 0]} name="Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Review Request Funnel over Time">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={requestFunnelPerMonth} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="sent" fill="var(--contigo-primary)" radius={[4, 4, 0, 0]} name="Sent" />
            <Bar dataKey="reviewed" fill="#15803d" radius={[4, 4, 0, 0]} name="Reviewed (inferred)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
