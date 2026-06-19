'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-contigo-primary text-contigo-foreground hover:bg-gold-600 active:bg-gold-700',
        secondary: 'bg-contigo-secondary text-neutral-50 hover:bg-petrol-700 active:bg-petrol-900',
        outline: 'border-2 border-contigo-primary text-contigo-primary hover:bg-gold-a12',
        ghost: 'text-contigo-foreground hover:bg-neutral-100',
        destructive: 'bg-error-600 text-white hover:bg-error-700',
      },
      size: {
        sm: 'min-h-[44px] px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vw,0.75rem)] text-fluid-xs',
        md: 'min-h-[44px] px-[clamp(1rem,2vw,1.5rem)] py-[clamp(0.625rem,1.2vw,0.875rem)] text-fluid-sm',
        lg: 'min-h-[48px] px-[clamp(1.5rem,3vw,2rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-fluid-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
