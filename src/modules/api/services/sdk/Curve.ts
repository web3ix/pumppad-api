import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
} from "@solana/web3.js";
import {
	TOKEN_METADATA_PROGRAM_ID,
	getBondAccountPubKey,
	getConfigAccountPubKey,
	getMetadataAccountPubKey,
	getMintAccountPubKey,
	getVaultReserveAccountPubKey,
	getVaultTokenAccountPubKey,
} from "./accounts";
import { Curve, IDL } from "./idl/curve";
import { AUTHORITY, PROGRAM_ID } from "./constants";
import { CurveEventHandlers, CurveEventType } from "./types";
import { checkOrCreateAssociatedTokenAccount } from "./utils";
import {
	createSyncNativeInstruction,
	getAssociatedTokenAddress,
} from "@solana/spl-token";

const WSOL = new PublicKey("So11111111111111111111111111111111111111112");

export default class CurveSdk {
	public connection: Connection;
	public program: anchor.Program<Curve>;

	// @ts-ignore
	public configAccountPubKey: PublicKey;
	// @ts-ignore
	public configAccountData: anchor.IdlAccounts<Curve>["configAccount"];

	public WEI6 = new BN("1000000");
	public MULTI_FACTOR = new BN("1000000000");
	public MAX_SUPPLY = new BN("500000000").mul(this.MULTI_FACTOR);

	constructor(connection: Connection, programId: PublicKey = PROGRAM_ID) {
		this.connection = connection;
		this.program = new anchor.Program(IDL, programId, {
			connection: this.connection,
		});
	}

	async bootstrap(authority: PublicKey = AUTHORITY) {
		this.configAccountPubKey = getConfigAccountPubKey(this.program, authority);
		await this.fetchConfigAccount(this.configAccountPubKey);
	}

	async fetchConfigAccount(
		configAccountPubKey: PublicKey,
		commitment?: anchor.web3.Commitment
	): Promise<anchor.IdlAccounts<Curve>["configAccount"]> {
		this.configAccountData = await this.program.account.configAccount.fetch(
			configAccountPubKey,
			commitment
		);
		return this.configAccountData;
	}

	async fetchBondAccount(
		symbol: string,
		commitment?: anchor.web3.Commitment
	): Promise<anchor.IdlAccounts<Curve>["bondAccount"]> {
		return this.program.account.bondAccount.fetch(
			getBondAccountPubKey(
				this.program,
				this.configAccountPubKey,
				getMintAccountPubKey(this.program, this.configAccountPubKey, symbol)
			),
			commitment
		);
	}

	getAmountIn(amountOut: BN, reserveIn: BN, reserveOut: BN): BN {
		const numerator = reserveIn.mul(amountOut).mul(this.WEI6);
		const denominator = reserveOut
			.sub(amountOut)
			.mul(this.WEI6.sub(this.configAccountData.systemFee));
		return numerator.div(denominator.add(new BN(1)));
	}

	getAmountOut(amountIn: BN, reserveIn: BN, reserveOut: BN): BN {
		const amountWithFee = amountIn.mul(
			this.WEI6.sub(this.configAccountData.systemFee)
		);
		const numerator = amountWithFee.mul(reserveOut);
		const denominator = reserveIn.mul(this.WEI6).add(amountWithFee);
		return numerator.div(denominator);
	}

	async fetchReserveToBuy(symbol: string, amount: BN): Promise<BN> {
		if (amount.eq(new BN(0))) throw new Error("Non zero to buy");

		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);
		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);
		const bondAccount = await this.program.account.bondAccount.fetch(bondPda);

		return this.getAmountIn(
			amount,
			bondAccount.totalVirtualReserve,
			bondAccount.totalVirtualCurve
		);
	}

	async fetchRefundForSell(symbol: string, amount: BN): Promise<BN> {
		if (amount.eq(new BN(0))) throw new Error("Non zero for sell");

		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);
		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);
		const bondAccount = await this.program.account.bondAccount.fetch(bondPda);

		return this.getAmountOut(
			amount,
			bondAccount.totalVirtualCurve,
			bondAccount.totalVirtualReserve
		);
	}

	async initialize(
		signer: PublicKey,
		feeWallet: PublicKey,
		reserveToken: PublicKey
	): Promise<Transaction> {
		if (this.configAccountPubKey) {
			throw new Error("Config account already exists");
		}
		this.configAccountPubKey = getConfigAccountPubKey(this.program, signer);
		const vaultReserveTokenPubkey = getVaultReserveAccountPubKey(
			this.program,
			this.configAccountPubKey,
			reserveToken
		);

		const reserveTokenInfo = await this.connection.getParsedAccountInfo(
			reserveToken
		);
		if (!reserveTokenInfo.value) {
			throw Error("Invalid reserve token");
		}

		const tx = new Transaction();

		const { tx: createFeeWalletAtaTx } =
			await checkOrCreateAssociatedTokenAccount(
				this.connection,
				feeWallet,
				signer,
				reserveToken
			);

		if (createFeeWalletAtaTx) tx.add(createFeeWalletAtaTx);

		const initTx = await this.program.methods
			.initialize()
			.accounts({
				configAccount: this.configAccountPubKey,
				authority: signer,
				feeWallet: feeWallet,
				reserveToken: reserveToken,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				tokenProgram: reserveTokenInfo.value.owner,
			})
			.transaction();

		tx.add(initTx);

		return tx;
	}

	getMintAccountPubKey(symbol: string): PublicKey {
		return getMintAccountPubKey(this.program, this.configAccountPubKey, symbol);
	}

	async _createToken(
		creator: PublicKey,
		name: string,
		symbol: string,
		uri: string
	): Promise<Transaction> {
		const mintPubkey = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
		if (mintInfo.value) {
			throw Error("Exists token with symbol");
		}

		const metadataPda = getMetadataAccountPubKey(mintPubkey);

		const vaultTokenPda = getVaultTokenAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mintPubkey
		);

		return this.program.methods
			.createToken(name, symbol, uri)
			.accounts({
				metadata: metadataPda,
				vaultTokenAccount: vaultTokenPda,
				mint: mintPubkey,
				configAccount: this.configAccountPubKey,
				payer: creator,
				authority: this.configAccountData.authority,
				tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
				// tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async _activateToken(
		creator: PublicKey,
		symbol: string
	): Promise<Transaction> {
		const mintPubkey = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
		if (mintInfo.value) {
			throw Error("Exists token with symbol");
		}

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mintPubkey
		);

		return this.program.methods
			.activateToken(symbol)
			.accounts({
				bondAccount: bondPda,
				mint: mintPubkey,
				configAccount: this.configAccountPubKey,
				payer: creator,
				authority: this.configAccountData.authority,
				tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async createToken(
		creator: PublicKey,
		name: string,
		symbol: string,
		uri: string
	): Promise<Transaction> {
		const createTx = await this._createToken(creator, name, symbol, uri);
		const activateTx = await this._activateToken(creator, symbol);
		return new Transaction().add(createTx, activateTx);
	}

	async buyToken(
		buyer: PublicKey,
		symbol: string,
		amount: BN
	): Promise<Transaction> {
		const reserveToBuy = await this.fetchReserveToBuy(symbol, amount);

		const reserveFee = reserveToBuy
			.mul(this.configAccountData.systemFee)
			.div(this.WEI6);

		const reserveWithFee = reserveToBuy.add(reserveFee);

		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const [mintInfo, reserveTokenInfo] = await Promise.all([
			this.connection.getParsedAccountInfo(mint),
			this.connection.getParsedAccountInfo(this.configAccountData.reserveToken),
		]);

		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		if (!reserveTokenInfo.value) {
			throw Error("Invalid reserve token");
		}

		const vaultTokenPda = getVaultTokenAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		const vaultReserveTokenPubkey = getVaultReserveAccountPubKey(
			this.program,
			this.configAccountPubKey,
			this.configAccountData.reserveToken
		);

		const [
			buyerAta,
			{ ata: buyerReserveTokenAta, tx: createFeeWalletAtaTx },
			feeWalletReserveTokenAta,
		] = await Promise.all([
			anchor.utils.token.associatedAddress({
				mint: mint,
				owner: buyer,
			}),
			checkOrCreateAssociatedTokenAccount(
				this.connection,
				buyer,
				buyer,
				this.configAccountData.reserveToken
			),
			getAssociatedTokenAddress(
				this.configAccountData.reserveToken,
				this.configAccountData.feeWallet,
				false,
				reserveTokenInfo.value.owner
			),
		]);

		const tx = new Transaction();

		// check and wrap sol to wsol
		if (this.configAccountData.reserveToken.equals(WSOL)) {
			if (createFeeWalletAtaTx) tx.add(createFeeWalletAtaTx);

			tx.add(
				SystemProgram.transfer({
					fromPubkey: buyer,
					toPubkey: buyerReserveTokenAta,
					lamports: BigInt(reserveWithFee.toString()),
				})
			);

			tx.add(createSyncNativeInstruction(buyerReserveTokenAta));
		}

		return this.program.methods
			.buyToken(symbol, amount)
			.accounts({
				buyerTokenAccount: buyerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				configAccount: this.configAccountPubKey,
				buyerReserveTokenAccount: buyerReserveTokenAta,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				feeReserveTokenAccount: feeWalletReserveTokenAta,
				reserveToken: this.configAccountData.reserveToken,
				mint,
				buyer,
				authority: this.configAccountData.authority,
				tokenProgram: mintInfo.value.owner,
				reserveTokenProgram: reserveTokenInfo.value.owner,
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async sellToken(
		seller: PublicKey,
		symbol: string,
		amount: BN
	): Promise<Transaction> {
		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const [mintInfo, reserveTokenInfo] = await Promise.all([
			this.connection.getParsedAccountInfo(mint),
			this.connection.getParsedAccountInfo(this.configAccountData.reserveToken),
		]);

		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		if (!reserveTokenInfo.value) {
			throw Error("Invalid reserve token");
		}

		const vaultTokenPda = getVaultTokenAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		const vaultReserveTokenPubkey = getVaultReserveAccountPubKey(
			this.program,
			this.configAccountPubKey,
			this.configAccountData.reserveToken
		);

		const [sellerAta, sellerReserveTokenAta, feeWalletReserveTokenAta] =
			await Promise.all([
				anchor.utils.token.associatedAddress({
					mint: mint,
					owner: seller,
				}),
				getAssociatedTokenAddress(
					this.configAccountData.reserveToken,
					seller,
					false,
					reserveTokenInfo.value.owner
				),
				getAssociatedTokenAddress(
					this.configAccountData.reserveToken,
					this.configAccountData.feeWallet,
					false,
					reserveTokenInfo.value.owner
				),
			]);

		return this.program.methods
			.sellToken(symbol, amount)
			.accounts({
				sellerTokenAccount: sellerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				configAccount: this.configAccountPubKey,
				sellerReserveTokenAccount: sellerReserveTokenAta,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				feeReserveTokenAccount: feeWalletReserveTokenAta,
				reserveToken: this.configAccountData.reserveToken,
				mint,
				seller,
				authority: this.configAccountData.authority,
				tokenProgram: mintInfo.value.owner,
				reserveTokenProgram: reserveTokenInfo.value.owner,
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async addLp(symbol: string): Promise<Transaction> {
		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);

		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		const authorityAta = await anchor.utils.token.associatedAddress({
			mint: mint,
			owner: this.configAccountData.authority,
		});

		const vaultTokenPda = getVaultTokenAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		const bondPda = getBondAccountPubKey(
			this.program,
			this.configAccountPubKey,
			mint
		);

		return this.program.methods
			.addLp(symbol)
			.accounts({
				authorityTokenAccount: authorityAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				configAccount: this.configAccountPubKey,
				mint,
				authority: this.configAccountData.authority,
				tokenProgram: mintInfo.value.owner,
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	// listen events
	addEventListener<T extends CurveEventType>(
		eventType: T,
		callback: (
			event: CurveEventHandlers[T],
			slot: number,
			signature: string
		) => void
	) {
		return this.program.addEventListener(
			eventType,
			(event: any, slot: number, signature: string) => {
				let processedEvent;
				switch (eventType) {
					// case "createEvent":
					// 	processedEvent = toCreateEvent(event as CreateEvent);
					// 	callback(
					// 		processedEvent as PumpFunEventHandlers[T],
					// 		slot,
					// 		signature
					// 	);
					// 	break;
					// case "tradeEvent":
					// 	processedEvent = toTradeEvent(event as TradeEvent);
					// 	callback(
					// 		processedEvent as PumpFunEventHandlers[T],
					// 		slot,
					// 		signature
					// 	);
					// 	break;
					// case "completeEvent":
					// 	processedEvent = toCompleteEvent(event as CompleteEvent);
					// 	callback(
					// 		processedEvent as PumpFunEventHandlers[T],
					// 		slot,
					// 		signature
					// 	);
					// 	console.log("completeEvent", event, slot, signature);
					// 	break;
					// case "setParamsEvent":
					// 	processedEvent = toSetParamsEvent(event as SetParamsEvent);
					// 	callback(
					// 		processedEvent as PumpFunEventHandlers[T],
					// 		slot,
					// 		signature
					// 	);
					// 	break;
					default:
						console.error("Unhandled event type:", eventType);
				}
			}
		);
	}

	removeEventListener(eventId: number) {
		this.program.removeEventListener(eventId);
	}
}
