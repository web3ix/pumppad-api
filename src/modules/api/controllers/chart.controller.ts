import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BondService } from '../services';

@ApiTags('Chart')
@Controller('/chart')
export class ChartController {
    constructor(private readonly bondService: BondService) {}

    @Get('/config')
    getStats() {
        return {
            supports_search: true,
            supports_group_request: false,
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
            supported_resolutions: ['5', '60', 'D'],
        };
    }

    @Get('time')
    getTime() {
        return Math.floor(Date.now() / 1000);
    }

    @Get('symbols')
    getSymbol(@Query('symbol') symbol: string) {
        return {
            name: symbol,
            // 'exchange-traded': 'AntSale',
            // 'exchange-listed': 'AntSale',
            timezone: 'America/New_York',
            session: '24x7',
            has_intraday: true,
            visible_plots_set: 'ohlc',
            description: symbol,
            type: 'stock',
            supported_resolutions: ['5'],
            pricescale: 100,
            ticker: symbol,
        };
    }

    @Get('history')
    async getHistory(@Query() query) {
        // Logic to fetch historical data
        // Query parameters typically include symbol, from, to, resolution
        return this.bondService.getTokenOHCL(
            query.symbol,
            query.from,
            query.to,
        );
    }
}
