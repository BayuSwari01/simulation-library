import { Rng } from '@/lib/sim/rng'
import type { SimulationEngine } from '@/lib/sim/types'
import type { LbConfig, Strategy } from './config'

/** Seconds a request spends visually travelling client -> balancer. */
export const TRAVEL_TO_LB = 0.85
/** Seconds a request spends visually travelling balancer -> server. */
export const TRAVEL_TO_SERVER = 0.65
/** Seconds a finished request stays visible while it fades out. */
export const EXIT_DURATION = 0.45
/** How many recent latencies feed the rolling average. */
const LATENCY_WINDOW = 40

export type RequestPhase = 'to-lb' | 'to-server' | 'queued' | 'serving' | 'exiting' | 'rejected'

export interface LbRequest {
  id: number
  phase: RequestPhase
  /** 0..1 within the current travel/exit phase. */
  progress: number
  /** -1 until the balancer has picked a backend. */
  serverIndex: number
  /** Slot in the server queue, for drawing. -1 when not queued. */
  slot: number
  arrivedAt: number
  serviceTime: number
  serviceRemaining: number
}

export interface LbServer {
  index: number
  /** Ids of requests waiting, nearest-to-server first. */
  queue: number[]
  activeId: number | null
  completed: number
  rejected: number
  busyTime: number
}

export interface LbState {
  time: number
  rng: Rng
  config: LbConfig
  nextId: number
  timeToNextArrival: number
  requests: Map<number, LbRequest>
  servers: LbServer[]
  rrCursor: number
  arrived: number
  completed: number
  rejected: number
  latencies: number[]
  latencySum: number
}

function pickServer(state: LbState, strategy: Strategy): number {
  const { servers } = state
  if (strategy === 'random') return state.rng.int(0, servers.length - 1)

  if (strategy === 'least-connections') {
    let best = 0
    let bestLoad = Number.POSITIVE_INFINITY
    for (const server of servers) {
      const load = server.queue.length + (server.activeId === null ? 0 : 1)
      if (load < bestLoad) {
        bestLoad = load
        best = server.index
      }
    }
    return best
  }

  // round-robin
  const index = state.rrCursor % servers.length
  state.rrCursor = (state.rrCursor + 1) % servers.length
  return index
}

export const loadBalancerEngine: SimulationEngine<LbState, LbConfig> = {
  createInitialState(config, seed) {
    const rng = new Rng(seed)
    return {
      time: 0,
      rng,
      config,
      nextId: 1,
      timeToNextArrival: rng.exponential(1 / config.arrivalRate),
      requests: new Map(),
      servers: Array.from({ length: config.serverCount }, (_, index) => ({
        index,
        queue: [],
        activeId: null,
        completed: 0,
        rejected: 0,
        busyTime: 0,
      })),
      rrCursor: 0,
      arrived: 0,
      completed: 0,
      rejected: 0,
      latencies: [],
      latencySum: 0,
    }
  },

  step(state, dt) {
    const { config } = state
    state.time += dt

    // --- arrivals (Poisson process) --------------------------------------
    state.timeToNextArrival -= dt
    let guard = 0
    while (state.timeToNextArrival <= 0 && guard < 16) {
      guard += 1
      const id = state.nextId++
      state.requests.set(id, {
        id,
        phase: 'to-lb',
        progress: 0,
        serverIndex: -1,
        slot: -1,
        arrivedAt: state.time,
        serviceTime: state.rng.exponential(config.serviceTimeMean),
        serviceRemaining: 0,
      })
      state.arrived += 1
      state.timeToNextArrival += state.rng.exponential(1 / config.arrivalRate)
    }

    // --- requests in transit ---------------------------------------------
    const finished: number[] = []
    for (const request of state.requests.values()) {
      switch (request.phase) {
        case 'to-lb': {
          request.progress += dt / TRAVEL_TO_LB
          if (request.progress >= 1) {
            request.progress = 0
            request.serverIndex = pickServer(state, config.strategy)
            request.phase = 'to-server'
          }
          break
        }
        case 'to-server': {
          request.progress += dt / TRAVEL_TO_SERVER
          if (request.progress >= 1) {
            request.progress = 0
            const server = state.servers[request.serverIndex]
            if (!server) break
            const load = server.queue.length + (server.activeId === null ? 0 : 1)
            if (load >= config.queueLimit) {
              // The backend is saturated: shed the request.
              request.phase = 'rejected'
              server.rejected += 1
              state.rejected += 1
            } else {
              server.queue.push(request.id)
              request.slot = server.queue.length - 1
              request.phase = 'queued'
            }
          }
          break
        }
        case 'exiting':
        case 'rejected': {
          request.progress += dt / EXIT_DURATION
          if (request.progress >= 1) finished.push(request.id)
          break
        }
        default:
          break
      }
    }

    // --- servers ----------------------------------------------------------
    for (const server of state.servers) {
      if (server.activeId !== null) {
        const active = state.requests.get(server.activeId)
        if (!active) {
          server.activeId = null
        } else {
          server.busyTime += dt
          active.serviceRemaining -= dt
          if (active.serviceRemaining <= 0) {
            const latency = state.time - active.arrivedAt
            state.latencies.push(latency)
            state.latencySum += latency
            if (state.latencies.length > LATENCY_WINDOW) {
              state.latencySum -= state.latencies.shift() ?? 0
            }
            active.phase = 'exiting'
            active.progress = 0
            active.slot = -1
            server.completed += 1
            state.completed += 1
            server.activeId = null
          }
        }
      }

      if (server.activeId === null && server.queue.length > 0) {
        const nextId = server.queue.shift()
        const next = nextId === undefined ? undefined : state.requests.get(nextId)
        if (next) {
          next.phase = 'serving'
          next.slot = -1
          next.serviceRemaining = next.serviceTime
          server.activeId = next.id
        }
      }

      // Keep queue slots contiguous so the drawing has no gaps.
      server.queue.forEach((id, slot) => {
        const queued = state.requests.get(id)
        if (queued) queued.slot = slot
      })
    }

    for (const id of finished) state.requests.delete(id)

    return state
  },
}

export function averageLatency(state: LbState): number {
  return state.latencies.length === 0 ? 0 : state.latencySum / state.latencies.length
}

export function throughput(state: LbState): number {
  return state.time < 0.5 ? 0 : state.completed / state.time
}

export function utilisation(state: LbState): number {
  if (state.time < 0.5 || state.servers.length === 0) return 0
  const busy = state.servers.reduce((sum, s) => sum + s.busyTime, 0)
  return busy / (state.time * state.servers.length)
}
