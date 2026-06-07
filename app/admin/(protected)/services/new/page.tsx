import { ServiceForm } from '@/presentation/components/admin/ServiceForm'

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
        >
          New Service
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
          Add a new service to your offerings
        </p>
      </div>

      <ServiceForm />
    </div>
  )
}
