import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.SOLANA_MAINNET]: {},
    [CHAIN_ID.SOLANA_DEVNET]: {
        PUMP: {
            deployedSignature:
                '4EKtGhs1rB1BmPPUBTQf3UfJULiKhdvQaJiveyiMmsq8sr4JrbtRHr5MLBiVMWJxneXYKtCUUWR6HH6i1SBf5m2Y',
        },
    },
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.SOLANA_MAINNET]: 1000,
    [CHAIN_ID.SOLANA_DEVNET]: 1000,
};
