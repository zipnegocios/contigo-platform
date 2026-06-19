'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps extends React.SVGAttributes<SVGElement> {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  xs: 'w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]',
  sm: 'w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]',
  md: 'w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)]',
  lg: 'w-[clamp(1.5rem,3vw,1.75rem)] h-[clamp(1.5rem,3vw,1.75rem)]',
  xl: 'w-[clamp(1.75rem,3.5vw,2.25rem)] h-[clamp(1.75rem,3.5vw,2.25rem)]',
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: Icon, size = 'md', className, ...props }, ref) => (
    <Icon
      ref={ref}
      className={cn(sizeMap[size], className)}
      {...(props as React.SVGAttributes<SVGElement>)}
    />
  )
)
Icon.displayName = 'Icon'

export { Icon, type IconProps }
