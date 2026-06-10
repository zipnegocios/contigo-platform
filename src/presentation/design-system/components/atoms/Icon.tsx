'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps extends React.SVGAttributes<SVGElement> {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
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

export { Icon }
