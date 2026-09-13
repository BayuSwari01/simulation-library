'use client'

import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/i18n'

/**
 * No `mounted` guard is needed here: nothing about the rendered output depends
 * on the current theme in JavaScript. Both icons and both labels are always in
 * the DOM, and the `.dark` class picks which one is visible — so the markup is
 * identical on the server and the client, and the right one shows on first
 * paint with no flash.
 */
export function ThemeToggle({ dict }: { dict: Dictionary }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'text-ink-muted hover:text-ink-strong hover:bg-accent-wash ring-rule',
        'grid h-9 w-9 place-items-center rounded-sm ring-1 transition-colors',
      )}
    >
      <span className="sr-only dark:hidden">{dict.theme.toDark}</span>
      <span className="sr-only hidden dark:inline">{dict.theme.toLight}</span>
      <SunIcon className="hidden h-[1.05rem] w-[1.05rem] dark:block" />
      <MoonIcon className="h-[1.05rem] w-[1.05rem] dark:hidden" />
    </button>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6"
      />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.4 14.3A8.6 8.6 0 1 1 9.7 3.6a6.9 6.9 0 0 0 10.7 10.7Z" />
    </svg>
  )
}
