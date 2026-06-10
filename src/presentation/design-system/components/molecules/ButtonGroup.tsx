'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  children: React.ReactNode
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, direction = 'row', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex gap-3',
        direction === 'column' && 'flex-col',
        className
      )}
      {...props}
    />
  )
)
ButtonGroup.displayName = 'ButtonGroup'

export { ButtonGroup, type ButtonGroupProps }
