import { cn } from '@/lib/utils'

/** A faint pencil rule, the main separator of the whole design. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn('border-rule-soft border-0 border-t', className)} />
}
