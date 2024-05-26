import { CHAIN_ID } from '@/blockchain/configs';

export const DEFAULT_PAGINATION_TAKEN = 10;
export const MAX_PAGINATION_TAKEN = 200;
export const MIN_PAGINATION_TAKEN = 1;
export const TIMING_BLOCK = 1;
export const ONE_DAY = 86400;
export const IS_PRODUCTION = process.env.APP_ENV == 'production';

export const CONFIG_KEYS: (chainId: CHAIN_ID) => {
    GET_PUMP_TXN_LOGS: string;
} = (chainId: CHAIN_ID) => ({
    GET_PUMP_TXN_LOGS: `${chainId}_get_pump_txn_logs`,
});
