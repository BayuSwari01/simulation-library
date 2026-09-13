import type { Dictionary } from '@/i18n'

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="border-rule-soft mt-24 border-t">
      <div className="text-ink-faint mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>{dict.footer.note}</p>
        <p className="font-mono tracking-wide">{dict.brand.name}</p>
      </div>
    </footer>
  )
}
