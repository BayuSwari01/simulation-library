export const STRATEGIES = ['round-robin', 'least-connections', 'random'] as const
export type Strategy = (typeof STRATEGIES)[number]

export interface LbConfig {
  strategy: Strategy
  /** Number of backend servers. */
  serverCount: number
  /** Mean incoming requests per second (Poisson arrivals). */
  arrivalRate: number
  /** Mean time a server needs to handle one request, in seconds. */
  serviceTimeMean: number
  /** Requests a single server will hold before it starts rejecting. */
  queueLimit: number
}

export const defaultLbConfig: LbConfig = {
  strategy: 'round-robin',
  serverCount: 4,
  arrivalRate: 4,
  serviceTimeMean: 0.9,
  queueLimit: 5,
}

export const LB_LIMITS = {
  serverCount: { min: 2, max: 6, step: 1 },
  arrivalRate: { min: 1, max: 14, step: 0.5 },
  serviceTimeMean: { min: 0.2, max: 2.5, step: 0.1 },
  queueLimit: { min: 1, max: 8, step: 1 },
} as const
