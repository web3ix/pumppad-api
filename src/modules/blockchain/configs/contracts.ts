import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.SOLANA_MAINNET]: {},
    [CHAIN_ID.SOLANA_DEVNET]: {
        PUMP: {
            deployedSignature:
                '5R89RGezQ8GhbN2rcBME1mbGahtPtuywbpWwiBwHrjsGMt67csn6kue8qQTDZ8Ww67YHGmgzZt72HJKHbUBwp7sg',
        },
    },
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.SOLANA_MAINNET]: 1000,
    [CHAIN_ID.SOLANA_DEVNET]: 1000,
};
