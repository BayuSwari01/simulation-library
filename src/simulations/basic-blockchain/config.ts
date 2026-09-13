export interface BlockchainConfig {
  /** Maximum number of blocks shown on screen */
  maxBlocks: number
  /** Rate of automatic block additions (blocks per second). 0 means manual only. */
  autoAddRate: number
}

export const defaultBlockchainConfig: BlockchainConfig = {
  maxBlocks: 5,
  autoAddRate: 0.5,
}

export const BLOCKCHAIN_LIMITS = {
  maxBlocks: { min: 2, max: 8, step: 1 },
  autoAddRate: { min: 0, max: 2, step: 0.1 },
} as const
