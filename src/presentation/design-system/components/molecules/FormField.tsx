'use client'

import * as React from 'react'
import { Input } from '../atoms/Input'
import { cn } from '@/lib/utils'

interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    { label, error, helperText, className, ...props },
    ref
  ) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-contigo-foreground">
          {label}
        </label>
      )}
      <Input
        ref={ref}
        className={cn(error && 'border-error-600 focus:ring-error-600', className)}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-contigo-muted">{helperText}</p>
      )}
    </div>
  )
)
FormField.displayName = 'FormField'

export { FormField, type FormFieldProps }
