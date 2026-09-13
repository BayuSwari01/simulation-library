import { Rng } from '@/lib/sim/rng'
import type { SimulationEngine } from '@/lib/sim/types'
import type { BlockchainConfig } from './config'

export interface Block {
  id: number
  data: string
  prevHash: string
  hash: string
  progress: number
  tampered: boolean
  createdAt: number
  minerNode: number
}

export type BlockchainAction = 
  | 'add' 
  | { type: 'tamper'; id: number } 
  | { type: 'recalculate'; id: number }

export interface BlockchainState {
  time: number
  rng: Rng
  config: BlockchainConfig
  blocks: Block[]
  nextId: number
  timeToNextAdd: number
  pendingActions: BlockchainAction[]
}

export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const hex = (hash >>> 0).toString(16)
  return hex.padStart(8, '0')
}

export function generateHash(id: number, data: string, prevHash: string): string {
  return hashString(`${id}-${data}-${prevHash}`)
}

export const basicBlockchainEngine: SimulationEngine<BlockchainState, BlockchainConfig> = {
  createInitialState(config, seed) {
    const rng = new Rng(seed)
    const genesisId = 0
    const genesisData = 'Genesis'
    const genesisPrev = '00000000'
    const genesisHash = generateHash(genesisId, genesisData, genesisPrev)
    
    return {
      time: 0,
      rng,
      config,
      blocks: [
        {
          id: genesisId,
          data: genesisData,
          prevHash: genesisPrev,
          hash: genesisHash,
          progress: 1,
          tampered: false,
          createdAt: 0,
          minerNode: 0,
        }
      ],
      nextId: 1,
      timeToNextAdd: config.autoAddRate > 0 ? 1 / config.autoAddRate : Infinity,
      pendingActions: [],
    }
  },

  step(state, dt) {
    const { config } = state
    state.time += dt
    
    if (config.autoAddRate > 0) {
      state.timeToNextAdd -= dt
      if (state.timeToNextAdd <= 0) {
        state.pendingActions.push('add')
        state.timeToNextAdd += 1 / config.autoAddRate
      }
    } else {
      state.timeToNextAdd = Infinity
    }
    
    while (state.pendingActions.length > 0) {
      const action = state.pendingActions.shift()!
      if (action === 'add') {
        const lastBlock = state.blocks[state.blocks.length - 1]
        const id = state.nextId++
        const data = `Tx-${id}-${state.rng.int(100, 999)}`
        const prevHash = lastBlock ? lastBlock.hash : '00000000'
        const hash = generateHash(id, data, prevHash)
        
        state.blocks.push({
          id,
          data,
          prevHash,
          hash,
          progress: 0,
          tampered: false,
          createdAt: state.time,
          minerNode: state.rng.int(0, 4), // 5 nodes total
        })
        
        if (state.blocks.length > config.maxBlocks) {
          state.blocks.shift()
        }
      } else if (typeof action === 'object' && action.type === 'tamper') {
        const block = state.blocks.find((b) => b.id === action.id)
        if (block) {
          block.data = `TAMPERED-${state.rng.int(100, 999)}`
          block.tampered = true
        }
      } else if (typeof action === 'object' && action.type === 'recalculate') {
        const index = state.blocks.findIndex((b) => b.id === action.id)
        if (index !== -1) {
          const block = state.blocks[index]!
          const prevBlock = state.blocks[index - 1]
          const expectedPrevHash = prevBlock ? prevBlock.hash : (block.id === 0 ? '00000000' : block.prevHash)
          block.prevHash = expectedPrevHash
          block.hash = generateHash(block.id, block.data, block.prevHash)
          block.tampered = false
        }
      }
    }
    
    for (const block of state.blocks) {
      if (block.progress < 1) {
        block.progress += dt / 0.5 
        if (block.progress > 1) block.progress = 1
      }
    }

    return state
  }
}

export function isBlockValid(state: BlockchainState, index: number): boolean {
  const block = state.blocks[index]
  if (!block) return true
  
  const expectedHash = generateHash(block.id, block.data, block.prevHash)
  if (block.hash !== expectedHash) return false
  
  if (index > 0) {
    const prevBlock = state.blocks[index - 1]
    if (prevBlock && block.prevHash !== prevBlock.hash) return false
  } else if (block.id === 0) {
    if (block.prevHash !== '00000000') return false
  }
  
  return true
}

export function isChainValidAt(state: BlockchainState, index: number): boolean {
  for (let i = 0; i <= index; i++) {
    if (!isBlockValid(state, i)) return false
  }
  return true
}
