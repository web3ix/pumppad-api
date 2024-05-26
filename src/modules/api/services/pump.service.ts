import { EvmService } from '@/blockchain/services';
import { BuyEntity, SellEntity, TokenEntity } from '@/database/entities';
import {
    BuyRepository,
    SellRepository,
    TokenRepository,
} from '@/database/repositories';
import { PumpAbi } from '@/shared/blockchain/abis';
import { Inject, Injectable } from '@nestjs/common';
import { BigNumber, ethers } from 'ethers';

@Injectable()
export class PumpService {
    constructor(
        @Inject(EvmService)
        private readonly evmService: EvmService,

        @Inject(TokenRepository)
        private tokenRepo: TokenRepository,

        @Inject(BuyRepository)
        private buyRepo: BuyRepository,

        @Inject(SellRepository)
        private sellRepo: SellRepository,
    ) {}

    async createToken(
        token: string,
        name: string,
        symbol: string,
        reserveToken: string,
    ) {
        const newToken = new TokenEntity();
        newToken.token = token;
        newToken.name = name;
        newToken.symbol = symbol;
        newToken.reserveToken = reserveToken;

        return this.tokenRepo.save(newToken);
    }

    async createBuyEvent(
        token: string,
        user: string,
        receiver: string,
        amountMinted: BigNumber,
        reserveToken: string,
        reserveAmount: BigNumber,
    ) {
        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });

        if (!tokenEntity) throw new Error('No Token');

        const buyEvent = new BuyEntity();
        buyEvent.user = user;
        buyEvent.receiver = receiver;
        buyEvent.amountMinted = amountMinted.toString();
        buyEvent.reserveToken = reserveToken;
        buyEvent.reserveAmount = reserveAmount.toString();

        return this.buyRepo.save(buyEvent);
    }

    async createSellEvent(
        token: string,
        user: string,
        receiver: string,
        amountBurned: BigNumber,
        reserveToken: string,
        refundAmount: BigNumber,
    ) {
        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });

        if (!tokenEntity) throw new Error('No Token');

        const sellEvent = new SellEntity();
        sellEvent.token = tokenEntity;
        sellEvent.user = user;
        sellEvent.receiver = receiver;
        sellEvent.amountBurned = amountBurned.toString();
        sellEvent.reserveToken = reserveToken;
        sellEvent.refundAmount = refundAmount.toString();

        return this.sellRepo.save(sellEvent);
    }

    async decodeEventEvm<T>(
        event: string,
        log: ethers.providers.Log,
    ): Promise<T> {
        const pumpIface = this.evmService.getContractInterface(PumpAbi);
        return pumpIface.decodeEventLog(event, log.data, log.topics) as T;
    }
}
