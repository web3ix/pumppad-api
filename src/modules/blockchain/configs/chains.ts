import sample from 'lodash/sample';

export enum CHAIN_ID {
    SOLANA_MAINNET = 99999990,
    SOLANA_DEVNET = 99999999,
}

export const CHAINS: Record<
    CHAIN_ID,
    {
        isMainnet: boolean;
        name: string;
        rpcUrls: string[];
    }
> = {
    [CHAIN_ID.SOLANA_MAINNET]: {
        isMainnet: true,
        name: 'Solana Mainnet',
        rpcUrls: [
            'https://api.mainnet-beta.solana.com',
            'https://mainnet.helius-rpc.com/?api-key=34cc68f2-d9f1-4e98-b53d-a2eb38105377',
        ],
    },
    [CHAIN_ID.SOLANA_DEVNET]: {
        isMainnet: false,
        name: 'Solana Devnet',
        rpcUrls: [
            'https://api.devnet.solana.com',
            // 'https://devnet.helius-rpc.com/?api-key=34cc68f2-d9f1-4e98-b53d-a2eb38105377',
        ],
    },
};

export const randomRPC = (rpcUrls: string[]) => sample(rpcUrls);
