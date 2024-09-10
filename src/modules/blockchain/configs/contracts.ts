import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.SOLANA_MAINNET]: {},
    [CHAIN_ID.SOLANA_DEVNET]: {
        PUMP: {
            deployedSignature:
                '4Fo1CxLEzq9m9NfRX7tqHHfuicvfChM8bGwMFxfJp69PtuMx6XJdZF33RpHcAhoSAGZLKz5RZTM3PkQVidQNRCGm',
        },
    },
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.SOLANA_MAINNET]: 1000,
    [CHAIN_ID.SOLANA_DEVNET]: 1000,
};
