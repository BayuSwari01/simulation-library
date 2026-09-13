/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * Every simulation MUST take its randomness from here and never from
 * `Math.random()`. That is what makes "Reset" replay the exact same run and
 * makes a reported bug reproducible.
 */
export class Rng {
  private s: number

  constructor(seed: number) {
    // Spread the seed so that nearby seeds produce very different streams.
    this.s = (seed >>> 0) || 0x9e3779b9
  }

  /** Uniform in [0, 1). */
  float(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + this.float() * (max - min)
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /** True with probability `p`. */
  chance(p: number): boolean {
    return this.float() < p
  }

  /**
   * Exponentially distributed value with the given mean.
   * This is the right distribution for inter-arrival times of independent
   * events (a Poisson process) — i.e. realistic incoming traffic.
   */
  exponential(mean: number): number {
    return -Math.log(1 - this.float()) * mean
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T
  }
}

/** A fresh seed for a brand-new run. Only ever called from an event handler. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}
