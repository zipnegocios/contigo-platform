import { ServiceTable } from '@/presentation/components/admin/ServiceTable'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export default async function ServicesPage() {
  const serviceRepo = new DrizzleServiceRepository()
  const services = await serviceRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Manage services and their display order</p>
      </div>

      <ServiceTable services={services} />
    </div>
  )
}
