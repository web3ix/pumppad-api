import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BondService } from '../services';

@ApiTags('Bond')
@Controller('/bond')
export class BondController {
    constructor(private readonly bondService: BondService) {}

    @Get('/stats')
    getStats() {
        return this.bondService.getStats();
    }

    @Get('/tokens')
    getTokens(
        @Query('take') take?: number | undefined,
        @Query('skip') skip?: number | undefined,
    ) {
        const _take = take ?? 10;
        const _skip = skip ?? 0;
        return this.bondService.getTokens(_take, _skip);
    }

    @Get('/tokens/:token')
    getToken(@Param('token') token: string) {
        return this.bondService.getToken(token);
    }
}
