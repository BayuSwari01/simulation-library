'use client'

import { useState } from 'react'
import { SimStage } from '@/components/sim/sim-stage'
import { SimControls } from '@/components/sim/sim-controls'
import { SimLegend, SimMetrics, Panel } from '@/components/sim/sim-panels'
import { SelectField, RangeField } from '@/components/ui/control'
import { useSimulation } from '@/lib/sim/use-simulation'
import {
  loadBalancerEngine,
  averageLatency,
  throughput,
  utilisation,
  type LbState,
  type LbRequest,
} from './engine'
import { defaultLbConfig, LB_LIMITS, STRATEGIES, type LbConfig, type Strategy } from './config'
import { lbText, lbStrategyText } from './labels'
import type { Dictionary, Locale } from '@/i18n'

/* --------------------------------------------------------------------------
   Stage geometry. One fixed coordinate system; the SVG viewBox does the
   scaling, so nothing here ever deals in screen pixels.
-------------------------------------------------------------------------- */
const W = 960
const H = 440
const MID_Y = 220

const CLIENT = { x: 46, y: 176, w: 56, h: 88 }
const CLIENT_OUT_X = CLIENT.x + CLIENT.w
const LB_BOX = { x: 286, y: 160, w: 104, h: 120 }
const LB_IN_X = LB_BOX.x
const LB_OUT_X = LB_BOX.x + LB_BOX.w
const GATE_X = 566
const QUEUE_RIGHT = 690
const SLOT_W = 11
const SLOT_H = 16
const SLOT_PITCH = 13
const SERVER = { x: 700, w: 180, h: 52 }
const SERVER_OUT_X = SERVER.x + SERVER.w
const EXIT_X = 950

function serverY(index: number, count: number): number {
  if (count <= 1) return MID_Y
  const spacing = Math.min(76, 328 / (count - 1))
  return MID_Y - (spacing * (count - 1)) / 2 + spacing * index
}

function routePath(y: number): string {
  return `M ${LB_OUT_X} ${MID_Y} C ${LB_OUT_X + 80} ${MID_Y} ${GATE_X - 80} ${y} ${GATE_X} ${y}`
}

function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function routePoint(y: number, t: number): { x: number; y: number } {
  return {
    x: cubic(LB_OUT_X, LB_OUT_X + 80, GATE_X - 80, GATE_X, t),
    y: cubic(MID_Y, MID_Y, y, y, t),
  }
}

function slotX(slot: number): number {
  return QUEUE_RIGHT - SLOT_W - slot * SLOT_PITCH
}

/** Stroke colour of a server box, by how close it is to shedding requests. */
function loadColour(load: number, limit: number): string {
  const ratio = limit === 0 ? 0 : load / limit
  if (ratio >= 1) return 'var(--sim-danger)'
  if (ratio >= 0.6) return 'var(--sim-warn)'
  return 'var(--rule-strong)'
}

/* ------------------------------------------------------------------------ */

export default function LoadBalancerView({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  const [config, setConfig] = useState<LbConfig>(defaultLbConfig)
  const sim = useSimulation(loadBalancerEngine, config)
  const state = sim.state

  const patch = <K extends keyof LbConfig>(key: K, value: LbConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))

  return (
    <div className="flex flex-col gap-6">
      <SimStage
        width={W}
        height={H}
        minWidth={820}
        dict={dict}
        containerRef={sim.containerRef}
        label={`${lbText('balancer', locale)} — ${lbStrategyText(config.strategy, locale)}`}
      >
        <defs>
          <pattern id="lb-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--sim-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#lb-grid)" opacity="0.55" />

        <Connectors state={state} />
        <ClientNode locale={locale} />
        <BalancerNode locale={locale} strategy={config.strategy} />
        <ServerNodes state={state} locale={locale} />
        <Packets state={state} />
      </SimStage>

      <SimControls sim={sim} dict={dict} />

      <SimLegend
        dict={dict}
        items={[
          { swatch: 'bg-sim-active', label: lbText('legendTransit', locale), shape: 'dot' },
          { swatch: 'bg-sim-idle', label: lbText('legendQueued', locale) },
          { swatch: 'bg-sim-warn', label: lbText('legendServing', locale) },
          { swatch: 'bg-sim-ok', label: lbText('legendDone', locale), shape: 'dot' },
          { swatch: 'bg-sim-danger', label: lbText('legendRejected', locale), shape: 'dot' },
        ]}
      />

      <SimMetrics
        dict={dict}
        items={[
          { label: lbText('metricArrived', locale), value: String(state.arrived) },
          { label: lbText('metricCompleted', locale), value: String(state.completed) },
          {
            label: lbText('metricRejected', locale),
            value: String(state.rejected),
            hint: state.arrived > 0 ? `${((state.rejected / state.arrived) * 100).toFixed(1)}%` : undefined,
          },
          {
            label: lbText('metricLatency', locale),
            value: `${averageLatency(state).toFixed(2)}${lbText('unitSeconds', locale)}`,
          },
          {
            label: lbText('metricThroughput', locale),
            value: `${throughput(state).toFixed(2)}${lbText('unitPerSecond', locale)}`,
          },
          {
            label: lbText('metricUtilisation', locale),
            value: `${(utilisation(state) * 100).toFixed(0)}%`,
          },
        ]}
      />

      <Panel title={dict.sim.parameters}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label={lbText('strategyLabel', locale)}
            value={config.strategy}
            onChange={(value: Strategy) => patch('strategy', value)}
            options={STRATEGIES.map((s) => ({ value: s, label: lbStrategyText(s, locale) }))}
          />
          <RangeField
            label={lbText('serverCount', locale)}
            value={config.serverCount}
            {...LB_LIMITS.serverCount}
            onChange={(value) => patch('serverCount', value)}
          />
          <RangeField
            label={lbText('arrivalRate', locale)}
            value={config.arrivalRate}
            unit={lbText('unitPerSecond', locale)}
            format={(v) => v.toFixed(1)}
            {...LB_LIMITS.arrivalRate}
            onChange={(value) => patch('arrivalRate', value)}
          />
          <RangeField
            label={lbText('serviceTime', locale)}
            value={config.serviceTimeMean}
            unit={lbText('unitSeconds', locale)}
            format={(v) => v.toFixed(1)}
            {...LB_LIMITS.serviceTimeMean}
            onChange={(value) => patch('serviceTimeMean', value)}
          />
          <RangeField
            label={lbText('queueLimit', locale)}
            value={config.queueLimit}
            {...LB_LIMITS.queueLimit}
            onChange={(value) => patch('queueLimit', value)}
          />
        </div>
      </Panel>
    </div>
  )
}

/* --- stage pieces -------------------------------------------------------- */

function Connectors({ state }: { state: LbState }) {
  const count = state.servers.length
  return (
    <g fill="none" stroke="var(--rule-base)" strokeWidth="1.5" strokeLinecap="round">
      <line x1={CLIENT_OUT_X} y1={MID_Y} x2={LB_IN_X} y2={MID_Y} />
      {state.servers.map((server) => (
        <path key={server.index} d={routePath(serverY(server.index, count))} />
      ))}
      {state.servers.map((server) => {
        const y = serverY(server.index, count)
        return (
          <line
            key={`out-${server.index}`}
            x1={SERVER_OUT_X}
            y1={y}
            x2={EXIT_X}
            y2={y}
            strokeDasharray="3 5"
            stroke="var(--rule-soft)"
          />
        )
      })}
    </g>
  )
}

function ClientNode({ locale }: { locale: Locale }) {
  return (
    <g>
      <rect
        x={CLIENT.x}
        y={CLIENT.y}
        width={CLIENT.w}
        height={CLIENT.h}
        rx="4"
        fill="var(--paper-card)"
        stroke="var(--rule-strong)"
        strokeWidth="1.5"
      />
      {[0, 1, 2].map((row) => (
        <rect
          key={row}
          x={CLIENT.x + 12}
          y={CLIENT.y + 18 + row * 18}
          width={32}
          height={8}
          rx="2"
          fill="var(--sim-grid)"
        />
      ))}
      <text
        x={CLIENT.x + CLIENT.w / 2}
        y={CLIENT.y + CLIENT.h + 20}
        textAnchor="middle"
        fontSize="12"
        fontFamily="var(--font-mono)"
        fill="var(--ink-muted)"
      >
        {lbText('client', locale)}
      </text>
    </g>
  )
}

function BalancerNode({ locale, strategy }: { locale: Locale; strategy: Strategy }) {
  return (
    <g>
      <rect
        x={LB_BOX.x}
        y={LB_BOX.y}
        width={LB_BOX.w}
        height={LB_BOX.h}
        rx="5"
        fill="var(--paper-card)"
        stroke="var(--accent-base)"
        strokeWidth="2"
      />
      <text
        x={LB_BOX.x + LB_BOX.w / 2}
        y={LB_BOX.y + 46}
        textAnchor="middle"
        fontSize="15"
        fontFamily="var(--font-serif)"
        fill="var(--ink-strong)"
      >
        {lbText('balancer', locale)}
      </text>
      <foreignObject x={LB_BOX.x + 6} y={LB_BOX.y + 56} width={LB_BOX.w - 12} height={48}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            lineHeight: 1.3,
            textAlign: 'center',
            color: 'var(--accent-base)',
          }}
        >
          {lbStrategyText(strategy, locale)}
        </div>
      </foreignObject>
    </g>
  )
}

function ServerNodes({ state, locale }: { state: LbState; locale: Locale }) {
  const count = state.servers.length
  const limit = state.config.queueLimit

  return (
    <g>
      {state.servers.map((server) => {
        const y = serverY(server.index, count)
        const top = y - SERVER.h / 2
        const active = server.activeId === null ? null : state.requests.get(server.activeId)
        const serviceProgress =
          active && active.serviceTime > 0
            ? Math.min(1, Math.max(0, 1 - active.serviceRemaining / active.serviceTime))
            : 0
        const load = server.queue.length + (server.activeId === null ? 0 : 1)

        return (
          <g key={server.index}>
            {/* queue slots */}
            {Array.from({ length: limit }, (_, slot) => (
              <rect
                key={slot}
                x={slotX(slot)}
                y={y - SLOT_H / 2}
                width={SLOT_W}
                height={SLOT_H}
                rx="2"
                fill="none"
                stroke="var(--sim-grid)"
                strokeWidth="1"
              />
            ))}

            <rect
              x={SERVER.x}
              y={top}
              width={SERVER.w}
              height={SERVER.h}
              rx="5"
              fill="var(--paper-card)"
              stroke={loadColour(load, limit)}
              strokeWidth="1.5"
            />
            <text
              x={SERVER.x + 12}
              y={top + 21}
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--ink-muted)"
            >
              {lbText('serverPrefix', locale)} {server.index + 1}
            </text>
            <text
              x={SERVER.x + SERVER.w - 12}
              y={top + 21}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={server.rejected > 0 ? 'var(--sim-danger)' : 'var(--ink-faint)'}
            >
              {server.completed}
              {server.rejected > 0 ? ` / -${server.rejected}` : ''}
            </text>

            <rect
              x={SERVER.x + 12}
              y={top + 31}
              width={SERVER.w - 24}
              height={6}
              rx="3"
              fill="var(--sim-grid)"
            />
            <rect
              x={SERVER.x + 12}
              y={top + 31}
              width={(SERVER.w - 24) * serviceProgress}
              height={6}
              rx="3"
              fill="var(--sim-warn)"
            />
          </g>
        )
      })}
    </g>
  )
}

function Packets({ state }: { state: LbState }) {
  const count = state.servers.length
  const nodes: React.ReactNode[] = []

  for (const request of state.requests.values()) {
    const y = request.serverIndex >= 0 ? serverY(request.serverIndex, count) : MID_Y
    nodes.push(<Packet key={request.id} request={request} y={y} />)
  }

  return <g>{nodes}</g>
}

function Packet({ request, y }: { request: LbRequest; y: number }) {
  switch (request.phase) {
    case 'to-lb': {
      const x = CLIENT_OUT_X + (LB_IN_X - CLIENT_OUT_X) * request.progress
      return <circle cx={x} cy={MID_Y} r="5" fill="var(--sim-active)" />
    }
    case 'to-server': {
      const point = routePoint(y, request.progress)
      return <circle cx={point.x} cy={point.y} r="5" fill="var(--sim-active)" />
    }
    case 'queued': {
      if (request.slot < 0) return null
      return (
        <rect
          x={slotX(request.slot)}
          y={y - SLOT_H / 2}
          width={SLOT_W}
          height={SLOT_H}
          rx="2"
          fill="var(--sim-idle)"
        />
      )
    }
    case 'exiting': {
      const x = SERVER_OUT_X + (EXIT_X - SERVER_OUT_X) * request.progress
      return <circle cx={x} cy={y} r="5" fill="var(--sim-ok)" opacity={1 - request.progress} />
    }
    case 'rejected': {
      const x = GATE_X - 46 * request.progress
      const cy = y - 42 * request.progress
      return (
        <g opacity={1 - request.progress}>
          <circle cx={x} cy={cy} r="5" fill="var(--sim-danger)" />
          <path
            d={`M ${x - 3} ${cy - 3} L ${x + 3} ${cy + 3} M ${x + 3} ${cy - 3} L ${x - 3} ${cy + 3}`}
            stroke="var(--paper-card)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      )
    }
    default:
      return null
  }
}
