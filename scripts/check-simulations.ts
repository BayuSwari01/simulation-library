/**
 * Engine checks. Run with `npm run check:sim`.
 *
 * These run the engines headlessly — no React, no DOM — which is the whole
 * point of keeping engines framework-free. Add a section here whenever you add
 * a simulation; determinism is the one property the whole project depends on.
 */
import { loadBalancerEngine, averageLatency, throughput } from '@/simulations/load-balancer/engine'
import { defaultLbConfig, type LbConfig } from '@/simulations/load-balancer/config'
import { FIXED_DT } from '@/lib/sim/use-simulation'

let failures = 0

function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `   ${detail}` : ''}`)
  if (!ok) failures += 1
}

const signature = (value: object) => JSON.stringify(value)

/* ---------------------------------------------------------------- */

function runLb(config: LbConfig, seed: number, ticks: number, ticksPerFrame = 1) {
  let state = loadBalancerEngine.createInitialState(config, seed)
  let done = 0
  while (done < ticks) {
    const batch = Math.min(ticksPerFrame, ticks - done)
    for (let i = 0; i < batch; i += 1) state = loadBalancerEngine.step(state, FIXED_DT)
    done += batch
  }
  return {
    arrived: state.arrived,
    completed: state.completed,
    rejected: state.rejected,
    latency: averageLatency(state).toFixed(9),
    throughput: throughput(state).toFixed(9),
    inFlight: state.requests.size,
    maxLoad: Math.max(
      ...state.servers.map((s) => s.queue.length + (s.activeId === null ? 0 : 1)),
    ),
  }
}

console.log('\nload-balancer')

const baseline = runLb(defaultLbConfig, 12345, 1800)
const replay = runLb(defaultLbConfig, 12345, 1800)
check('same seed replays identically', signature(baseline) === signature(replay))

const otherSeed = runLb(defaultLbConfig, 999, 1800)
check('a different seed produces a different run', signature(baseline) !== signature(otherSeed))

// At 4x speed the runner catches up several fixed ticks inside one frame.
// Batching ticks must not change the outcome — that is what fixed timestep buys.
const batched = runLb(defaultLbConfig, 12345, 1800, 8)
check('batching ticks (higher speed) changes nothing', signature(baseline) === signature(batched))

check('no NaN leaks into the metrics', !signature(baseline).includes('NaN'))
check(
  'completed never exceeds arrived',
  baseline.completed <= baseline.arrived,
  `${baseline.completed} <= ${baseline.arrived}`,
)
check(
  'server load never exceeds the queue limit',
  baseline.maxLoad <= defaultLbConfig.queueLimit,
  `${baseline.maxLoad} <= ${defaultLbConfig.queueLimit}`,
)

const overloaded = runLb({ ...defaultLbConfig, arrivalRate: 14, serviceTimeMean: 2.5 }, 7, 1800)
check('a saturated system sheds traffic', overloaded.rejected > 0, `rejected ${overloaded.rejected}`)
check(
  'a saturated system stays bounded',
  overloaded.inFlight < 400,
  `in flight ${overloaded.inFlight}`,
)

const leastConn = runLb({ ...defaultLbConfig, strategy: 'least-connections', arrivalRate: 8 }, 42, 3000)
const random = runLb({ ...defaultLbConfig, strategy: 'random', arrivalRate: 8 }, 42, 3000)
check(
  'least-connections rejects no more than random',
  leastConn.rejected <= random.rejected,
  `${leastConn.rejected} vs ${random.rejected}`,
)

/* ---------------------------------------------------------------- */

console.log(failures === 0 ? '\nall engine checks passed\n' : `\n${failures} check(s) failed\n`)
process.exit(failures === 0 ? 0 : 1)
