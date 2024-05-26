import sample from 'lodash/sample';

export enum CHAIN_ID {
    ETHEREUM = 1,
    SEPOLIA = 11155111,
}

export const CHAINS: Record<
    CHAIN_ID,
    {
        isMainnet: boolean;
        name: string;
        rpcUrls: string[];
        explorerUrl: string;
    }
> = {
    [CHAIN_ID.ETHEREUM]: {
        isMainnet: true,
        name: 'Ethereum Mainnet',
        rpcUrls: [
            'https://eth.llamarpc.com',
            'https://eth-mainnet.public.blastapi.io',
            'https://eth-pokt.nodies.app',
            'https://rpc.ankr.com/eth',
        ],
        explorerUrl: 'https://etherscan.io',
    },
    [CHAIN_ID.SEPOLIA]: {
        isMainnet: false,
        name: 'Sepolia',
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        explorerUrl: 'https://sepolia.etherscan.io',
    },
};

export const randomRPC = (rpcUrls: string[]) => sample(rpcUrls);
