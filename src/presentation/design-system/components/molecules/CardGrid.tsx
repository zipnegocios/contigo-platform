'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, columns = 3, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid gap-6',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
      {...props}
    />
  )
)
CardGrid.displayName = 'CardGrid'

export { CardGrid, type CardGridProps }
