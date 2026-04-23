import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Lichtgewicht native <select> wrapper in dezelfde stijl als de Input.
 * Geen Radix, geen portals: eenvoudig, toegankelijk en bundle-safe.
 * Opties worden als children doorgegeven (<option>...</option>).
 */
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-7 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30',
        // Native caret via background-image, respecteert dark mode via currentColor
        'bg-[right_0.5rem_center] bg-no-repeat bg-[length:1rem] bg-[url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22currentColor%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22 clip-rule=%22evenodd%22/></svg>")]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
