import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export function ContactDetails() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Phone
          className="w-[clamp(1.125rem,1.6vw,1.375rem)] h-[clamp(1.125rem,1.6vw,1.375rem)]"
          style={{ color: 'var(--contigo-primary)', flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p className="font-medium text-fluid-sm" style={{ color: 'var(--contigo-foreground)' }}>
            Phone
          </p>
          <p className="text-fluid-sm mt-1" style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}>
            +61 406 274 096
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Mail
          className="w-[clamp(1.125rem,1.6vw,1.375rem)] h-[clamp(1.125rem,1.6vw,1.375rem)]"
          style={{ color: 'var(--contigo-primary)', flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p className="font-medium text-fluid-sm" style={{ color: 'var(--contigo-foreground)' }}>
            Email
          </p>
          <p className="text-fluid-sm mt-1" style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}>
            contact@contigoconstructions.com.au
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <MapPin
          className="w-[clamp(1.125rem,1.6vw,1.375rem)] h-[clamp(1.125rem,1.6vw,1.375rem)]"
          style={{ color: 'var(--contigo-primary)', flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p className="font-medium text-fluid-sm" style={{ color: 'var(--contigo-foreground)' }}>
            Address
          </p>
          <p className="text-fluid-sm mt-1" style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}>
            25 Green Avenue, Seaton SA 5023
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Clock
          className="w-[clamp(1.125rem,1.6vw,1.375rem)] h-[clamp(1.125rem,1.6vw,1.375rem)]"
          style={{ color: 'var(--contigo-primary)', flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p className="font-medium text-fluid-sm" style={{ color: 'var(--contigo-foreground)' }}>
            Business Hours
          </p>
          <p className="text-fluid-sm mt-1" style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}>
            Mon - Fri: 7:00 AM - 5:00 PM
          </p>
        </div>
      </div>
    </div>
  )
}
