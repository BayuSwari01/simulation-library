'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/i18n'

/**
 * The stage. Simulations are drawn in a fixed coordinate system and scaled by
 * the SVG viewBox, so the engine never needs to know about pixels.
 *
 * On narrow screens the stage is NOT squashed — it keeps `minWidth` and the
 * user scrolls sideways. Squeezing a wide diagram into 390px makes it
 * unreadable, which defeats the point.
 */
export function SimStage({
  width,
  height,
  minWidth = 760,
  label,
  dict,
  containerRef,
  className,
  children,
}: {
  width: number
  height: number
  minWidth?: number
  /** Accessible description of what the stage shows. */
  label: string
  dict: Dictionary
  containerRef?: (node: HTMLElement | null) => void
  className?: string
  children: ReactNode
}) {
  return (
    <div ref={containerRef} className={cn('bg-sunk ring-rule rounded-sm ring-1', className)}>
      <div className="overflow-x-auto overscroll-x-contain rounded-sm">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth }}
          className="block h-auto w-full"
          role="img"
        >
          <title>{label}</title>
          {children}
        </svg>
      </div>
      <p className="text-ink-faint border-rule-soft border-t px-3 py-1.5 text-[0.6875rem] md:hidden">
        {dict.sim.scrollHint}
      </p>
    </div>
  )
}
