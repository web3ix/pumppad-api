import { CHAIN_ID } from './chains';

export const CONTRACTS: Record<CHAIN_ID, any> = {
    [CHAIN_ID.SOLANA_MAINNET]: {},
    [CHAIN_ID.SOLANA_DEVNET]: {
        PUMP: {
            address: '6KYPZ5oGgKqf6DM6Ppnfuwt6exJpygWWssyav4VxBSsE',
            deployedBlock: 316868612,
            deployedSignature:
                '2RX8prG8vrRSbHjmMZRwe3SzKUubVfXeya7UAYxoaYH8NgnFLpZvbgqfUboy8yog4KVdnQv9oag8sf8CRkbSwAWx',
        },
    },
};

export const CHUNK_BLOCK_NUMBER: Record<CHAIN_ID, number> = {
    [CHAIN_ID.SOLANA_MAINNET]: 1000,
    [CHAIN_ID.SOLANA_DEVNET]: 1000,
};
