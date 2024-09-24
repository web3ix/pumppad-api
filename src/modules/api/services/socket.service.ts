import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(8001, { cors: true })
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor() {}

    async handleConnection(client: Socket) {
        try {
            // let address = client.handshake.query.address.toString();
            // await this.redisService.set({
            //     key: `SOCKET_ID_${address}`,
            //     value: client.id,
            //     time: 86400,
            // });
            console.log('Socket connected', client.id);
        } catch (error) {
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            // let address = client.handshake.query.address.toString();

            // // let auth_token = client.handshake.query.token.toString();
            // // const decoded = jwtDecode<
            // //     JwtPayloadDto & { iat: number; exp: number }
            // // >(auth_token);

            // await this.redisService.del(`SOCKET_ID_${address}`);
            console.log('Socket disconnected', client.id);
        } catch (error) {}
    }

    async emitNewToken(
        id: string,
        token: string,
        creator: string,
        name: string,
        symbol: string,
        uri: string,
        timestamp: number,
    ) {
        this.server.emit('new-token', {
            id,
            token,
            creator,
            name,
            symbol,
            uri,
            timestamp,
        });
    }

    async emitComment(
        id: string,
        token: string,
        address: string,
        text: string,
        timestamp: number,
    ) {
        this.server.emit('new-comment', {
            id,
            token,
            address,
            text,
            timestamp,
        });
    }

    async emitNewTrade(
        id: string,
        signature: string,
        token: string,
        isBuy: boolean,
        doer: string,
        amount: string,
        reserveAmount: string,
        parseAmount: number,
        parseReserveAmount: number,
        timestamp: number,
        lastPrice: number,
        totalSupply: string,
        totalReserve: string,
        parsedTotalSupplied: number,
        parsedTotalReserve: number,
    ) {
        this.server.emit('new-trade', {
            id,
            signature,
            token,
            isBuy,
            doer,
            amount,
            reserveAmount,
            parseAmount,
            parseReserveAmount,
            timestamp,
            lastPrice,
        });
    }
}
