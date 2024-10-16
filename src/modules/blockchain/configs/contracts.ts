import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.SOLANA_MAINNET]: {},
    [CHAIN_ID.SOLANA_DEVNET]: {},
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.SOLANA_MAINNET]: 1000,
    [CHAIN_ID.SOLANA_DEVNET]: 1000,
};
