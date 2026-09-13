'use client'

/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */

/*
 * This file is the project's one imperative animation runner, and it breaks
 * two React hook rules on purpose:
 *
 *   react-hooks/refs — simulation state is deliberately held in a ref and read
 *   during render. Putting a large state object through useState 60 times a
 *   second would thrash React for no benefit. The read is safe because this
 *   hook forces exactly one render per animation frame, so what render sees is
 *   always the state that frame just produced.
 *
 *   react-hooks/set-state-in-effect — autoplay can only be decided on the
 *   client, after checking prefers-reduced-motion, which is not knowable
 *   during render.
 *
 * Both rules exist to keep components compatible with the React Compiler,
 * which this project deliberately leaves disabled for exactly this reason.
 * Do not copy this suppression into other files.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { SimulationEngine } from './types'
import { randomSeed } from './rng'

/** Fixed timestep. Never varies, so results do not depend on frame rate. */
export const FIXED_DT = 1 / 60
const FIXED_DT_MS = FIXED_DT * 1000

/**
 * Clamp for the time between two frames. A backgrounded tab or a paused
 * debugger produces a huge delta; without this the accumulator below would try
 * to catch up with thousands of steps and lock the page ("spiral of death").
 */
const MAX_FRAME_MS = 250

/** Hard cap on catch-up work in a single frame. */
const MAX_STEPS_PER_FRAME = 16

export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const
export type Speed = (typeof SPEEDS)[number]

export interface SimulationHandle<TState> {
  state: TState
  isRunning: boolean
  isComplete: boolean
  speed: Speed
  /** Simulated seconds since the run started. */
  elapsed: number
  seed: number
  play: () => void
  pause: () => void
  toggle: () => void
  /** Advance exactly one fixed tick while paused. */
  stepOnce: () => void
  /** Restart from the beginning with the same seed — an identical replay. */
  reset: () => void
  /** Restart with a brand-new seed. */
  reseed: () => void
  setSpeed: (speed: Speed) => void
  /** Attach to the element holding the stage; the loop idles when off-screen. */
  containerRef: (node: HTMLElement | null) => void
}

export function useSimulation<TState, TConfig>(
  engine: SimulationEngine<TState, TConfig>,
  config: TConfig,
  options: { autoPlay?: boolean } = {},
): SimulationHandle<TState> {
  const { autoPlay = true } = options

  const [seed, setSeed] = useState<number>(() => randomSeed())
  const [speed, setSpeed] = useState<Speed>(1)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Simulation state lives in a ref, never in useState. 60 setState calls a
  // second with a large object would thrash React for no benefit.
  const stateRef = useRef<TState | null>(null)
  const elapsedRef = useRef(0)
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  if (stateRef.current === null) {
    stateRef.current = engine.createInitialState(config, seed)
  }

  // Everything the loop reads goes through a ref, so the loop never has to be
  // torn down and rebuilt when one of these changes (and never sees a stale
  // closure either).
  const engineRef = useRef(engine)
  const configRef = useRef(config)
  const speedRef = useRef<Speed>(speed)
  engineRef.current = engine
  configRef.current = config
  speedRef.current = speed

  const rebuild = useCallback((nextSeed: number) => {
    stateRef.current = engineRef.current.createInitialState(configRef.current, nextSeed)
    elapsedRef.current = 0
    setIsComplete(false)
    forceRender()
  }, [])

  // Rebuild whenever the seed or the config changes.
  const configKey = useMemo(() => JSON.stringify(config), [config])
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    rebuild(seed)
    // configKey is the intentional dependency; `config` itself is a new object
    // on every render.
  }, [seed, configKey, rebuild])

  const advance = useCallback(() => {
    const eng = engineRef.current
    const current = stateRef.current as TState
    const next = eng.step(current, FIXED_DT)
    stateRef.current = next
    elapsedRef.current += FIXED_DT
    if (eng.isComplete?.(next)) {
      setIsComplete(true)
      setIsRunning(false)
      return false
    }
    return true
  }, [])

  // --- visibility of the stage -------------------------------------------
  const [onScreen, setOnScreen] = useState(true)
  const containerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? true),
      { rootMargin: '128px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // --- the loop -----------------------------------------------------------
  useEffect(() => {
    if (!isRunning || !onScreen) return

    let rafId = 0
    let last = performance.now()
    let accumulator = 0

    const tick = (now: number) => {
      const frame = Math.min(now - last, MAX_FRAME_MS)
      last = now
      // Speed scales how much simulated time a real frame buys, never `dt`
      // itself. That keeps every speed bit-for-bit consistent.
      accumulator += frame * speedRef.current

      let steps = 0
      let alive = true
      while (accumulator >= FIXED_DT_MS && steps < MAX_STEPS_PER_FRAME) {
        alive = advance()
        accumulator -= FIXED_DT_MS
        steps += 1
        if (!alive) break
      }
      if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0

      forceRender()
      if (alive) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    // Without this cleanup, React StrictMode's double mount in development
    // leaves two loops running and the simulation goes at double speed —
    // a bug that never reproduces in production.
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, onScreen, advance])

  // --- autoplay, unless the user asked for reduced motion ------------------
  useEffect(() => {
    if (!autoPlay) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setIsRunning(true)
  }, [autoPlay])

  const play = useCallback(() => {
    if (isComplete) return
    setIsRunning(true)
  }, [isComplete])

  const pause = useCallback(() => setIsRunning(false), [])

  const toggle = useCallback(() => {
    if (isComplete) return
    setIsRunning((r) => !r)
  }, [isComplete])

  const stepOnce = useCallback(() => {
    setIsRunning(false)
    if (isComplete) return
    advance()
    forceRender()
  }, [advance, isComplete])

  const reset = useCallback(() => {
    setIsRunning(false)
    rebuild(seed)
  }, [rebuild, seed])

  const reseed = useCallback(() => {
    setIsRunning(false)
    setSeed(randomSeed())
  }, [])

  return {
    state: stateRef.current as TState,
    isRunning,
    isComplete,
    speed,
    elapsed: elapsedRef.current,
    seed,
    play,
    pause,
    toggle,
    stepOnce,
    reset,
    reseed,
    setSpeed,
    containerRef,
  }
}
