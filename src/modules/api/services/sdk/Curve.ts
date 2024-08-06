import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
	TOKEN_METADATA_PROGRAM_ID,
	getBondAccountPubKey,
	getConfigAccountPubKey,
	getMetadataAccountPubKey,
	getMintAccountPubKey,
	getStepAccountPubKey,
	getVaultTokenAccountPubKey,
} from "./accounts";
import { Curve, IDL } from "./idl/curve";
import { AUTHORITY, PROGRAM_ID } from "./constants";
import { CurveEventHandlers, CurveEventType } from "./types";

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

	async fetchStepAccount(
		stepId: anchor.BN,
		commitment?: anchor.web3.Commitment
	): Promise<anchor.IdlAccounts<Curve>["stepAccount"]> {
		return this.program.account.stepAccount.fetch(
			getStepAccountPubKey(this.program, this.configAccountPubKey, stepId),
			commitment
		);
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

	private getCurrentStep(currentSupply: BN, ranges: BN[]): number {
		for (let i = 0; i < 32; i++) {
			if (currentSupply.lte(ranges[i])) {
				return i;
			}
		}
		throw new Error("Invalid Current Supply");
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

		const stepPda = getStepAccountPubKey(
			this.program,
			this.configAccountPubKey,
			bondAccount.stepId
		);
		const stepAccount = await this.program.account.stepAccount.fetch(stepPda);
		let currentSupply = bondAccount.supplied;
		let newSupply = amount.add(currentSupply);
		if (newSupply.gt(this.MAX_SUPPLY)) throw new Error("Exceed Max Supply");

		let tokenLeft = amount;
		let reserveToBuy = new BN(0);
		let supplyLeft = new BN(0);
		let current_step = this.getCurrentStep(currentSupply, stepAccount.ranges);
		for (let i = current_step; i < 32; i++) {
			supplyLeft = stepAccount.ranges[i].sub(currentSupply);

			if (supplyLeft.lt(tokenLeft)) {
				if (supplyLeft.eq(new BN(0))) {
					continue;
				}

				// ensure reserve is calculated with ceiling
				reserveToBuy = reserveToBuy.add(
					supplyLeft.mul(stepAccount.prices[i]).div(this.MULTI_FACTOR)
				);
				currentSupply = currentSupply.add(supplyLeft);
				tokenLeft = tokenLeft.sub(supplyLeft);
			} else {
				// ensure reserve is calculated with ceiling
				reserveToBuy = reserveToBuy.add(
					tokenLeft.mul(stepAccount.prices[i]).div(this.MULTI_FACTOR)
				);
				tokenLeft = new BN(0);
				break;
			}
		}
		// tokensLeft > 0 -> can never happen
		// reserveToBond == 0 -> can happen if a user tries to mint within the free minting range, which is prohibited by design.
		if (reserveToBuy.eq(new BN(0)) || tokenLeft.gt(new BN(0)))
			throw new Error("Invalid Token Amount");

		const fee = this.configAccountData.systemFee
			.mul(reserveToBuy)
			.div(this.WEI6);
		const royalty = this.configAccountData.buyRoyalty
			.mul(reserveToBuy)
			.div(this.WEI6);

		return reserveToBuy.add(fee).add(royalty);
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

		const stepPda = getStepAccountPubKey(
			this.program,
			this.configAccountPubKey,
			bondAccount.stepId
		);
		const stepAccount = await this.program.account.stepAccount.fetch(stepPda);

		let currentSupply = bondAccount.supplied;
		if (amount.gt(currentSupply)) throw new Error("Exceed Max Supply");

		let tokenLeft = amount;
		let reserveFromBond = new BN(0);
		let currentStep = this.getCurrentStep(currentSupply, stepAccount.ranges);

		while (tokenLeft.gt(new BN(0))) {
			let supplyLeft = new BN(0);
			if (currentStep == 0) {
				supplyLeft = currentSupply;
			} else {
				currentSupply.sub(stepAccount.ranges[currentStep - 1]);
			}

			let tokensToProcess = new BN(0);
			if (tokenLeft.lt(supplyLeft)) {
				tokensToProcess = tokenLeft;
			} else {
				tokensToProcess = supplyLeft;
			}

			reserveFromBond = reserveFromBond.add(
				tokensToProcess.mul(
					stepAccount.prices[currentStep].div(this.MULTI_FACTOR)
				)
			);

			tokenLeft = tokenLeft.sub(tokensToProcess);
			currentSupply = currentSupply.sub(tokensToProcess);

			if (currentStep > 0) {
				currentStep -= 1;
			}
		}

		// tokensLeft > 0 -> can never happen
		if (tokenLeft.gt(new BN(0))) {
			throw new Error("Invalid token amount");
		}

		const fee = this.configAccountData.systemFee
			.mul(reserveFromBond)
			.div(this.WEI6);
		const royalty = this.configAccountData.buyRoyalty
			.mul(reserveFromBond)
			.div(this.WEI6);

		return reserveFromBond.sub(fee).sub(royalty);
	}

	initialize(signer: PublicKey, feeWallet: PublicKey): Promise<Transaction> {
		if (this.configAccountPubKey) {
			throw new Error("Config account already exists");
		}
		this.configAccountPubKey = getConfigAccountPubKey(this.program, signer);
		return this.program.methods
			.initialize()
			.accounts({
				configAccount: this.configAccountPubKey,
				authority: signer,
				feeWallet: feeWallet,
			})
			.transaction();
	}

	async addStep(
		authority: PublicKey,
		ranges: BN[],
		prices: BN[]
	): Promise<Transaction> {
		const latestStepId = await this.fetchConfigAccount(
			this.configAccountPubKey
		).then((r) => r.lastStepId);

		const stepPda = getStepAccountPubKey(
			this.program,
			this.configAccountPubKey,
			latestStepId
		);

		return this.program.methods
			.addStep(ranges, prices)
			.accounts({
				configAccount: this.configAccountPubKey,
				stepAccount: stepPda,
				authority,
			})
			.transaction();
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
				tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async _activateToken(
		creator: PublicKey,
		symbol: string,
		stepId: BN
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
			.activateToken(symbol, stepId)
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
		uri: string,
		stepId: BN
	): Promise<Transaction> {
		const createTx = await this._createToken(creator, name, symbol, uri);
		const activateTx = await this._activateToken(creator, symbol, stepId);
		return new Transaction().add(createTx, activateTx);
	}

	async buyToken(
		buyer: PublicKey,
		symbol: string,
		amount: BN,
		maxReserveAmount: BN
	): Promise<Transaction> {
		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);

		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		const buyerAta = await anchor.utils.token.associatedAddress({
			mint: mint,
			owner: buyer,
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

		const bondAccount = await this.program.account.bondAccount.fetch(bondPda);

		const stepPda = getStepAccountPubKey(
			this.program,
			this.configAccountPubKey,
			bondAccount.stepId
		);

		return this.program.methods
			.buyToken(symbol, amount, maxReserveAmount)
			.accounts({
				buyerTokenAccount: buyerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				stepAccount: stepPda,
				configAccount: this.configAccountPubKey,
				mint,
				buyer,
				creator: bondAccount.creator,
				feeWallet: this.configAccountData.feeWallet,
				authority: this.configAccountData.authority,
				tokenProgram: mintInfo.value.owner,
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();
	}

	async sellToken(
		seller: PublicKey,
		symbol: string,
		amount: BN,
		minReserveAmount: BN
	): Promise<Transaction> {
		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);

		if (!mintInfo.value) {
			throw Error("Token doesn't exists with symbol");
		}

		const sellerAta = await anchor.utils.token.associatedAddress({
			mint: mint,
			owner: seller,
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

		const bondAccount = await this.program.account.bondAccount.fetch(bondPda);

		const stepPda = getStepAccountPubKey(
			this.program,
			this.configAccountPubKey,
			bondAccount.stepId
		);

		return this.program.methods
			.sellToken(symbol, amount, minReserveAmount)
			.accounts({
				sellerTokenAccount: sellerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				stepAccount: stepPda,
				configAccount: this.configAccountPubKey,
				mint,
				seller,
				creator: bondAccount.creator,
				feeWallet: this.configAccountData.feeWallet,
				authority: this.configAccountData.authority,
				tokenProgram: mintInfo.value.owner,
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
