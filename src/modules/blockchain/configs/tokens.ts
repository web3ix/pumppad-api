import { CHAIN_ID } from './chains';

export interface IToken {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
}

// export const WETH: Record<CHAIN_ID, IToken> = {
//     [CHAIN_ID.ETHEREUM]: {
//         name: 'Wrapped Ether',
//         symbol: 'WETH',
//         address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
//         decimals: 18,
//     },
// };
