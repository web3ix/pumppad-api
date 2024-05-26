import { Connection } from '@solana/web3.js';
import { Network } from './network.abstract';

export class SolanNetwork extends Network<Connection, any> {
    constructor(provider: Connection) {
        super(provider);
    }
}
