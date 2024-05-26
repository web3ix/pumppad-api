import { ethers } from 'ethers';
import { Network } from './network.abstract';

export class EvmNetwork extends Network<
    ethers.providers.Provider,
    ethers.Signer
> {
    constructor(provider: ethers.providers.Provider) {
        super(provider);
    }
}
