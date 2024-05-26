import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.ETHEREUM]: {},
    [CHAIN_ID.SEPOLIA]: {
        PUMP: {
            address: '0x94492896c6105c15EFdA0c0dC24cAE05B5dcDF76',
            deployedBlock: 5966665,
        },
    },
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.ETHEREUM]: 1000,
    [CHAIN_ID.SEPOLIA]: 1000,
};
