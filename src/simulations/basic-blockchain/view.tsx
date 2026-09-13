'use client'

import { useState } from 'react'
import { SimStage } from '@/components/sim/sim-stage'
import { SimControls } from '@/components/sim/sim-controls'
import { SimLegend, Panel } from '@/components/sim/sim-panels'
import { RangeField } from '@/components/ui/control'
import { useSimulation } from '@/lib/sim/use-simulation'
import { Button } from '@/components/ui/button'
import {
  basicBlockchainEngine,
  isChainValidAt,
  type BlockchainState,
  type BlockchainAction,
} from './engine'
import { defaultBlockchainConfig, BLOCKCHAIN_LIMITS, type BlockchainConfig } from './config'
import { bcText } from './labels'
import type { Dictionary, Locale } from '@/i18n'

const W = 1600
const H = 800
const MID_Y = 220

const BLOCK_W = 160
const BLOCK_H = 220
const GAP = 30

export default function BasicBlockchainView({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  const [config, setConfig] = useState<BlockchainConfig>(defaultBlockchainConfig)
  const sim = useSimulation(basicBlockchainEngine, config)
  const state = sim.state

  const patch = <K extends keyof BlockchainConfig>(key: K, value: BlockchainConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))

  const dispatch = (action: BlockchainAction) => {
    state.pendingActions.push(action)
  }

  return (
    <div className="flex flex-col gap-6">
      <SimStage
        width={W}
        height={H}
        minWidth={820}
        dict={dict}
        containerRef={sim.containerRef}
        label="Basic Blockchain"
      >
        <defs>
          <pattern id="bc-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--sim-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#bc-grid)" opacity="0.55" />

        <Blocks state={state} locale={locale} />
        <Network state={state} />
      </SimStage>

      <SimControls sim={sim} dict={dict} />

      <SimLegend
        dict={dict}
        items={[
          { swatch: 'bg-sim-ok', label: bcText('valid', locale) },
          { swatch: 'bg-sim-danger', label: bcText('invalid', locale) },
        ]}
      />

      <Panel title={dict.sim.parameters}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <RangeField
            label="Auto Add Rate"
            value={config.autoAddRate}
            {...BLOCKCHAIN_LIMITS.autoAddRate}
            format={(v) => (v === 0 ? 'Manual' : `${v.toFixed(1)}/s`)}
            onChange={(value) => patch('autoAddRate', value)}
          />
          <RangeField
            label="Max Blocks"
            value={config.maxBlocks}
            {...BLOCKCHAIN_LIMITS.maxBlocks}
            onChange={(value) => patch('maxBlocks', value)}
          />
          <div className="flex flex-col justify-end">
            <Button variant="outline" onClick={() => dispatch('add')}>
              {bcText('addData', locale)}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function Blocks({ state, locale }: { state: BlockchainState; locale: Locale }) {
  const nodes: React.ReactNode[] = []

  state.blocks.forEach((block, index) => {
    const x = 50 + index * (BLOCK_W + GAP)
    const y = MID_Y - BLOCK_H / 2

    // Animate Y from top to bottom
    const yOffset = (1 - block.progress) * -200
    const finalY = y + yOffset

    // Check validity
    const valid = isChainValidAt(state, index)
    const strokeColor = valid ? 'var(--sim-ok)' : 'var(--sim-danger)'
    const bgColor = valid ? 'var(--paper-card)' : 'var(--sim-danger-subtle, #ffe6e6)'

    nodes.push(
      <g key={block.id} opacity={block.progress} style={{ transition: 'all 0.1s linear' }}>
        {/* Connection line to previous block */}
        {index > 0 && (
          <line
            x1={x - GAP}
            y1={MID_Y}
            x2={x}
            y2={MID_Y}
            stroke={valid ? 'var(--sim-ok)' : 'var(--sim-danger)'}
            strokeWidth="3"
            strokeDasharray={valid ? 'none' : '4 4'}
          />
        )}

        <rect
          x={x}
          y={finalY}
          width={BLOCK_W}
          height={BLOCK_H}
          rx="8"
          fill={bgColor}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Block Header */}
        <text
          x={x + BLOCK_W / 2}
          y={finalY + 24}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-serif)"
          fontWeight="bold"
          fill="var(--ink-strong)"
        >
          Block #{block.id}
        </text>

        {/* Data Field */}
        <text
          x={x + 12}
          y={finalY + 60}
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill="var(--ink-muted)"
        >
          {bcText('dataLabel', locale)}:
        </text>
        <text
          x={x + 12}
          y={finalY + 76}
          fontSize="14"
          fontFamily="var(--font-mono)"
          fill="var(--ink-base)"
        >
          {block.data}
        </text>

        {/* Prev Hash Field */}
        <text
          x={x + 12}
          y={finalY + 110}
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill="var(--ink-muted)"
        >
          {bcText('prevHashLabel', locale)}:
        </text>
        <text
          x={x + 12}
          y={finalY + 126}
          fontSize="14"
          fontFamily="var(--font-mono)"
          fill={valid ? 'var(--ink-base)' : 'var(--sim-danger)'}
        >
          {block.prevHash}
        </text>

        {/* Hash Field */}
        <text
          x={x + 12}
          y={finalY + 160}
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill="var(--ink-muted)"
        >
          {bcText('hashLabel', locale)}:
        </text>
        <text
          x={x + 12}
          y={finalY + 176}
          fontSize="14"
          fontFamily="var(--font-mono)"
          fill="var(--ink-base)"
        >
          {block.hash}
        </text>
      </g>,
    )
  })

  return <g>{nodes}</g>
}

/* ── P2P Network ─────────────────────────────────────────────────────────── */

const NETWORK_TITLE_Y = 455
const NETWORK_CX = 800  // center of the square
const NETWORK_CY = 630  // center of the square
const NETWORK_HALF = 110 // half-size of the square (node-to-center distance)
const NODE_W = 60
const NODE_H = 50
const NUM_NODES = 4

/**
 * 4 nodes at the 4 corners of a square:
 *   0 = top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left
 */
const NODE_POSITIONS: { x: number; y: number }[] = [
  { x: NETWORK_CX - NETWORK_HALF, y: NETWORK_CY - NETWORK_HALF }, // top-left
  { x: NETWORK_CX + NETWORK_HALF, y: NETWORK_CY - NETWORK_HALF }, // top-right
  { x: NETWORK_CX + NETWORK_HALF, y: NETWORK_CY + NETWORK_HALF }, // bottom-right
  { x: NETWORK_CX - NETWORK_HALF, y: NETWORK_CY + NETWORK_HALF }, // bottom-left
]

/**
 * Perimeter edges (square sides) + both diagonals = fully connected mesh.
 * Visually reads as a square with an X inside — clear and unambiguous.
 */
const EDGES: [number, number][] = [
  [0, 1], // top edge
  [1, 2], // right edge
  [2, 3], // bottom edge
  [3, 0], // left edge
  [0, 2], // diagonal
  [1, 3], // diagonal
]

function isDirectNeighbour(a: number, b: number): boolean {
  return EDGES.some(([x, y]) => (x === a && y === b) || (y === a && x === b))
}

function Network({ state }: { state: BlockchainState }) {
  const lineElements: React.ReactNode[] = []
  const nodeElements: React.ReactNode[] = []
  const packetElements: React.ReactNode[] = []

  /* ── edges ──────────────────────────────────────────────────────────── */
  for (const [a, b] of EDGES) {
    const p1 = NODE_POSITIONS[a]!
    const p2 = NODE_POSITIONS[b]!
    const isDiagonal = (a === 0 && b === 2) || (a === 1 && b === 3)
    lineElements.push(
      <line
        key={`edge-${a}-${b}`}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="var(--rule-base)"
        strokeWidth={isDiagonal ? 1 : 1.5}
        strokeDasharray={isDiagonal ? '4 4' : undefined}
        opacity={isDiagonal ? 0.25 : 0.4}
      />,
    )
  }

  /* ── nodes (computer monitor icons) ─────────────────────────────────── */
  for (let i = 0; i < NUM_NODES; i++) {
    const { x, y } = NODE_POSITIONS[i]!

    const received = state.blocks.filter((blk) => {
      if (blk.minerNode % NUM_NODES === i) return true
      const miner = blk.minerNode % NUM_NODES
      const age = state.time - blk.createdAt
      const hops = isDirectNeighbour(miner, i) ? 1 : 2
      return age > hops * 0.5
    }).length

    nodeElements.push(
      <g key={`node-${i}`}>
        {/* Monitor body */}
        <rect
          x={x - NODE_W / 2}
          y={y - NODE_H / 2}
          width={NODE_W}
          height={NODE_H}
          rx="5"
          fill="var(--paper-card)"
          stroke="var(--rule-strong)"
          strokeWidth="1.5"
        />
        {/* Screen area */}
        <rect
          x={x - NODE_W / 2 + 6}
          y={y - NODE_H / 2 + 6}
          width={NODE_W - 12}
          height={NODE_H - 18}
          rx="2"
          fill="var(--sim-grid)"
        />
        {/* Stand */}
        <line
          x1={x} y1={y + NODE_H / 2}
          x2={x} y2={y + NODE_H / 2 + 8}
          stroke="var(--rule-strong)" strokeWidth="1.5"
        />
        <line
          x1={x - 12} y1={y + NODE_H / 2 + 8}
          x2={x + 12} y2={y + NODE_H / 2 + 8}
          stroke="var(--rule-strong)" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Block count on screen */}
        <text
          x={x} y={y + 4}
          textAnchor="middle" fontSize="14"
          fontFamily="var(--font-mono)" fontWeight="bold"
          fill="var(--ink-strong)"
        >
          {received}
        </text>
        {/* Label — positioned outside the square on each corner */}
        <text
          x={i === 0 || i === 3 ? x - NODE_W / 2 - 6 : x + NODE_W / 2 + 6}
          y={y + 5}
          textAnchor={i === 0 || i === 3 ? 'end' : 'start'}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--ink-muted)"
        >
          Node {i}
        </text>
      </g>,
    )
  }

  /* ── broadcast packets ─────────────────────────────────────────────── */
  const HOP_DURATION = 0.55
  for (const blk of state.blocks) {
    const age = state.time - blk.createdAt
    if (age <= 0 || age > 2.0) continue

    const miner = blk.minerNode % NUM_NODES
    const minerPos = NODE_POSITIONS[miner]!

    for (let j = 0; j < NUM_NODES; j++) {
      if (j === miner) continue
      const targetPos = NODE_POSITIONS[j]!
      const hops = isDirectNeighbour(miner, j) ? 1 : 2
      const duration = hops * HOP_DURATION
      if (age > duration) continue

      const progress = age / duration
      const px = minerPos.x + (targetPos.x - minerPos.x) * progress
      const py = minerPos.y + (targetPos.y - minerPos.y) * progress

      packetElements.push(
        <circle
          key={`pkt-${blk.id}-${j}`}
          cx={px} cy={py} r="5"
          fill="var(--sim-active)"
          opacity={1 - progress * 0.6}
        />,
      )
    }
  }

  /* ── miner highlight ─────────────────────────────────────────────── */
  const latest = state.blocks[state.blocks.length - 1]
  const latestAge = latest ? state.time - latest.createdAt : Infinity
  const miner = latest ? latest.minerNode % NUM_NODES : 0
  const minerHighlight =
    latest && latestAge < 1.5 ? (
      <rect
        x={NODE_POSITIONS[miner]!.x - NODE_W / 2 - 4}
        y={NODE_POSITIONS[miner]!.y - NODE_H / 2 - 4}
        width={NODE_W + 8}
        height={NODE_H + 8}
        rx="8"
        fill="none"
        stroke="var(--accent-base)"
        strokeWidth="2"
        opacity={Math.max(0, 1 - latestAge)}
      />
    ) : null

  return (
    <g>
      <text
        x={NETWORK_CX} y={NETWORK_TITLE_Y}
        textAnchor="middle" fontSize="16"
        fontFamily="var(--font-serif)" fontWeight="bold"
        fill="var(--ink-strong)"
      >
        P2P Network Distribution
      </text>
      <text
        x={NETWORK_CX} y={NETWORK_TITLE_Y + 20}
        textAnchor="middle" fontSize="12"
        fontFamily="var(--font-serif)" fill="var(--ink-muted)"
      >
        Each new block is relayed from its creator to all other nodes
      </text>

      {lineElements}
      {minerHighlight}
      {packetElements}
      {nodeElements}
    </g>
  )
}

