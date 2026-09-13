'use client'

import { Button } from '@/components/ui/button'
import { SPEEDS, type Speed, type SimulationHandle } from '@/lib/sim/use-simulation'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/i18n'

export function SimControls<TState>({
  sim,
  dict,
}: {
  sim: SimulationHandle<TState>
  dict: Dictionary
}) {
  return (
    <div className="border-rule bg-card sticky bottom-0 z-30 flex flex-wrap items-center gap-2 rounded-sm border px-3 py-2.5 backdrop-blur-sm sm:static sm:backdrop-blur-none">
      <Button onClick={sim.toggle} size="sm" disabled={sim.isComplete} className="w-[5.5rem]">
        {sim.isRunning ? <PauseIcon /> : <PlayIcon />}
        {sim.isRunning ? dict.sim.pause : dict.sim.play}
      </Button>

      <Button onClick={sim.stepOnce} variant="outline" size="sm" disabled={sim.isComplete}>
        <StepIcon />
        <span className="hidden sm:inline">{dict.sim.stepOnce}</span>
      </Button>

      <Button onClick={sim.reset} variant="outline" size="sm">
        <ResetIcon />
        <span className="hidden sm:inline">{dict.sim.reset}</span>
      </Button>

      <div className="ring-rule ml-auto flex items-center overflow-hidden rounded-sm ring-1">
        <span className="text-ink-faint border-rule-soft hidden border-r px-2.5 py-1 text-[0.6875rem] sm:block">
          {dict.sim.speed}
        </span>
        {SPEEDS.map((s: Speed) => (
          <button
            key={s}
            type="button"
            onClick={() => sim.setSpeed(s)}
            aria-pressed={sim.speed === s}
            className={cn(
              'px-2 py-1 font-mono text-[0.6875rem] transition-colors',
              sim.speed === s
                ? 'bg-accent-wash text-accent'
                : 'text-ink-faint hover:text-ink-strong hover:bg-accent-wash/60',
            )}
          >
            {s}&times;
          </button>
        ))}
      </div>

      <div className="text-ink-faint tabular ml-1 font-mono text-[0.6875rem] whitespace-nowrap">
        {dict.sim.elapsed} {sim.elapsed.toFixed(1)}s
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M8 5.2v13.6L19 12 8 5.2Z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" />
    </svg>
  )
}
function StepIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M7 5.2v13.6L16 12 7 5.2ZM17 5h2.2v14H17z" />
    </svg>
  )
}
function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5v5h5M4.6 14a7.6 7.6 0 1 0 1-6.4" />
    </svg>
  )
}
