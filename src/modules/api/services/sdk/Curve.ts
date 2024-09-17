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

const TOTAL_SALE = 670000000;

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
	public MAX_SUPPLY = new BN(TOTAL_SALE).mul(this.MULTI_FACTOR);
	public MAX_STEP = 32;

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

	private getCurrentStep(currentSupply: BN, ranges: BN[]): number {
		for (let i = 0; i < this.MAX_STEP; i++) {
			if (currentSupply.lte(ranges[i])) {
				return i;
			}
		}
		throw new Error("Invalid Current Supply");
	}

	async fetchReserveToBuy(
		symbol: string,
		amount: BN,
		init: boolean = false
	): Promise<{
		reserve: BN;
		fee: BN;
	}> {
		if (amount.eq(new BN(0))) throw new Error("Non zero to buy");

		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);

		let currentSupply = new BN(0);

		if (!init) {
			if (!mintInfo.value) {
				throw Error("Token doesn't exists with symbol");
			}

			const bondPda = getBondAccountPubKey(
				this.program,
				this.configAccountPubKey,
				mint
			);

			const bondAccount = await this.program.account.bondAccount.fetch(bondPda);

			currentSupply = bondAccount.supplied;
		}

		let newSupply = amount.add(currentSupply);
		if (newSupply.gt(this.MAX_SUPPLY)) throw new Error("Exceed Max Supply");

		let tokenLeft = amount;
		let reserveToBuy = new BN(0);
		let supplyLeft = new BN(0);
		let current_step = this.getCurrentStep(
			currentSupply,
			this.configAccountData.ranges
		);
		for (let i = current_step; i < this.MAX_STEP; i++) {
			supplyLeft = this.configAccountData.ranges[i].sub(currentSupply);

			if (supplyLeft.lt(tokenLeft)) {
				if (supplyLeft.eq(new BN(0))) {
					continue;
				}

				// ensure reserve is calculated with ceiling
				reserveToBuy = reserveToBuy.add(
					supplyLeft
						.mul(this.configAccountData.prices[i])
						.div(this.MULTI_FACTOR)
				);
				currentSupply = currentSupply.add(supplyLeft);
				tokenLeft = tokenLeft.sub(supplyLeft);
			} else {
				// ensure reserve is calculated with ceiling
				reserveToBuy = reserveToBuy.add(
					tokenLeft.mul(this.configAccountData.prices[i]).div(this.MULTI_FACTOR)
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

		return {
			reserve: reserveToBuy.add(fee),
			fee,
		};
	}

	async fetchAmountBuyFromReserve(
		symbol: string,
		reserve: BN,
		init: boolean = false
	): Promise<BN> {
		if (reserve.eq(new BN(0))) throw new Error("Non zero to buy");

		const mint = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mint);

		let currentSupply = new BN(0);

		if (!init) {
			if (!mintInfo.value) {
				throw Error("Token doesn't exists with symbol");
			}

			const bondPda = getBondAccountPubKey(
				this.program,
				this.configAccountPubKey,
				mint
			);
			const bondAccount = await this.program.account.bondAccount.fetch(bondPda);
			currentSupply = bondAccount.supplied;
		}

		const fee = this.configAccountData.systemFee.mul(reserve).div(this.WEI6);

		let reserveLeft = reserve.sub(fee);
		let amount = new BN(0);
		let current_step = this.getCurrentStep(
			currentSupply,
			this.configAccountData.ranges
		);

		for (let i = current_step; i < this.MAX_STEP; i++) {
			let supplyLeft = this.configAccountData.ranges[i].sub(currentSupply);

			let _reserveLeft = supplyLeft
				.mul(this.configAccountData.prices[i])
				.div(this.MULTI_FACTOR);

			if (reserveLeft.gt(_reserveLeft)) {
				if (supplyLeft.eq(new BN(0))) {
					continue;
				}

				// ensure reserve is calculated with ceiling
				amount = amount.add(
					_reserveLeft
						.mul(this.MULTI_FACTOR)
						.div(this.configAccountData.prices[i])
				);
				currentSupply = currentSupply.add(supplyLeft);
				reserveLeft = reserveLeft.sub(_reserveLeft);
			} else {
				// ensure reserve is calculated with ceiling
				const supply = reserveLeft
					.mul(this.MULTI_FACTOR)
					.div(this.configAccountData.prices[i]);
				amount = amount.add(supply);
				currentSupply = currentSupply.add(supply);
				reserveLeft = new BN(0);
				break;
			}
		}

		let newSupply = amount.add(currentSupply);
		console.log(
			"🚀 ~ file: Curve.ts:263 ~ CurveSdk ~ amount:",
			amount.toString()
		);
		if (newSupply.gt(this.MAX_SUPPLY)) throw new Error("Exceed Max Supply");

		// tokensLeft > 0 -> can never happen
		// reserveToBond == 0 -> can happen if a user tries to mint within the free minting range, which is prohibited by design.
		if (amount.eq(new BN(0)) || reserveLeft.gt(new BN(0)))
			throw new Error("Invalid Token Amount");

		// const fee = this.configAccountData.systemFee
		//     .mul(reserveToBuy)
		//     .div(this.WEI6);

		return amount;
	}

	async fetchRefundForSell(
		symbol: string,
		amount: BN
	): Promise<{
		reserve: BN;
		fee: BN;
	}> {
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

		let currentSupply = bondAccount.supplied;
		if (amount.gt(currentSupply)) throw new Error("Exceed Max Supply");

		let tokenLeft = amount;
		let reserveFromBond = new BN(0);
		let currentStep = this.getCurrentStep(
			currentSupply,
			this.configAccountData.ranges
		);

		while (tokenLeft.gt(new BN(0))) {
			let supplyLeft = new BN(0);
			if (currentStep == 0) {
				supplyLeft = currentSupply;
			} else {
				supplyLeft = currentSupply.sub(
					this.configAccountData.ranges[currentStep - 1]
				);
			}

			let tokensToProcess = new BN(0);
			if (tokenLeft.lt(supplyLeft)) {
				tokensToProcess = tokenLeft;
			} else {
				tokensToProcess = supplyLeft;
			}

			reserveFromBond = reserveFromBond.add(
				tokensToProcess.mul(this.configAccountData.prices[currentStep])
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

		reserveFromBond = reserveFromBond.div(this.MULTI_FACTOR);
		const fee = this.configAccountData.systemFee
			.mul(reserveFromBond)
			.div(this.WEI6);

		return {
			reserve: reserveFromBond.sub(fee),
			fee,
		};
	}

	async fetchAmountSellFromReserve(symbol: string, reserve: BN): Promise<BN> {
		if (reserve.eq(new BN(0))) throw new Error("Non zero for sell");

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

		const fee = this.configAccountData.systemFee.mul(reserve).div(this.WEI6);

		let currentSupply = bondAccount.supplied;

		// if (amount.gt(currentSupply)) throw new Error("Exceed Max Supply");

		// let tokenLeft = amount;
		let reserveLeft = reserve.add(fee);
		let amount = new BN(0);
		// let reserveFromBond = new BN(0);
		let currentStep = this.getCurrentStep(
			currentSupply,
			this.configAccountData.ranges
		);

		while (reserveLeft.gt(new BN(0))) {
			let supplyLeft = new BN(0);
			if (currentStep == 0) {
				supplyLeft = currentSupply;
			} else {
				supplyLeft = currentSupply.sub(
					this.configAccountData.ranges[currentStep - 1]
				);
			}

			let _reserveLeft = supplyLeft
				.mul(this.configAccountData.prices[currentStep])
				.div(this.MULTI_FACTOR);

			if (reserveLeft.lt(_reserveLeft)) {
				const supply = reserveLeft
					.mul(this.MULTI_FACTOR)
					.div(this.configAccountData.prices[currentStep]);
				amount = amount.add(supply);
				currentSupply = currentSupply.sub(supply);

				reserveLeft = new BN(0);
			} else {
				amount = amount.add(supplyLeft);
				currentSupply = currentSupply.sub(supplyLeft);

				reserveLeft = reserveLeft.sub(_reserveLeft);
			}

			if (currentStep > 0) {
				currentStep -= 1;
			}
		}

		if (amount.gt(bondAccount.supplied)) throw new Error("Exceed Max Supply");

		// tokensLeft > 0 -> can never happen
		if (reserveLeft.gt(new BN(0))) {
			throw new Error("Invalid token amount");
		}

		return amount;
	}

	async initialize(
		signer: PublicKey,
		feeWallet: PublicKey,
		feeWallet2: PublicKey,
		feeWallet3: PublicKey,
		reserveToken: PublicKey,
		ranges: BN[],
		prices: BN[]
	): Promise<{ tx: Transaction; initTx: Transaction }> {
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

		const { tx: createFeeWalletAtaTx2 } =
			await checkOrCreateAssociatedTokenAccount(
				this.connection,
				feeWallet2,
				signer,
				reserveToken
			);

		if (createFeeWalletAtaTx2) tx.add(createFeeWalletAtaTx2);

		const { tx: createFeeWalletAtaTx3 } =
			await checkOrCreateAssociatedTokenAccount(
				this.connection,
				feeWallet3,
				signer,
				reserveToken
			);

		if (createFeeWalletAtaTx3) tx.add(createFeeWalletAtaTx3);

		const initTx = await this.program.methods
			.initialize(ranges, prices)
			.accounts({
				configAccount: this.configAccountPubKey,
				authority: signer,
				feeWallet: feeWallet,
				feeWallet2: feeWallet2,
				feeWallet3: feeWallet3,
				reserveToken: reserveToken,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				tokenProgram: reserveTokenInfo.value.owner,
			})
			.transaction();

		return {
			tx,
			initTx,
		};
	}

	getTokenPda(symbol: string): PublicKey {
		return getMintAccountPubKey(this.program, this.configAccountPubKey, symbol);
	}

	async checkTokenExist(symbol: string) {
		const mintPubkey = getMintAccountPubKey(
			this.program,
			this.configAccountPubKey,
			symbol
		);

		const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
		if (mintInfo.value) {
			throw Error("Exists token with symbol");
		}
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
		uri: string,
		initBuy?: BN
	): Promise<Transaction> {
		const tx = new Transaction();
		const createTx = await this._createToken(creator, name, symbol, uri);
		const activateTx = await this._activateToken(creator, symbol);
		tx.add(createTx, activateTx);

		if (initBuy) {
			const { reserve: reserveToBuy } = await this.fetchReserveToBuy(
				symbol,
				initBuy,
				true
			);

			const maxReserveAmount = reserveToBuy.add(
				reserveToBuy.div(new anchor.BN("5"))
			); // 120%

			const buyTx = await this.buyToken(
				creator,
				symbol,
				initBuy,
				maxReserveAmount,
				true
			);
			tx.add(buyTx);
		}

		return tx;
	}

	async buyToken(
		buyer: PublicKey,
		symbol: string,
		amount: BN,
		maxReserveAmount: BN,
		init: boolean = false
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

		if (!init) {
			if (!mintInfo.value) {
				throw Error("Token doesn't exists with symbol");
			}
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
			{ ata: buyerReserveTokenAta, tx: createBuyerReserveAtaTx },
			feeWalletReserveTokenAta,
			feeWalletReserveTokenAta2,
			feeWalletReserveTokenAta3,
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
			getAssociatedTokenAddress(
				this.configAccountData.reserveToken,
				this.configAccountData.feeWallet2,
				false,
				reserveTokenInfo.value.owner
			),
			getAssociatedTokenAddress(
				this.configAccountData.reserveToken,
				this.configAccountData.feeWallet3,
				false,
				reserveTokenInfo.value.owner
			),
		]);

		const tx = new Transaction();

		if (createBuyerReserveAtaTx) tx.add(createBuyerReserveAtaTx);

		// check and wrap sol to wsol
		if (this.configAccountData.reserveToken.equals(WSOL)) {
			const { reserve: reserveToBuy } = await this.fetchReserveToBuy(
				symbol,
				amount,
				init
			);
			const reserveFee = reserveToBuy
				.mul(this.configAccountData.systemFee)
				.div(this.WEI6);

			const reserveWithFee = reserveToBuy.add(reserveFee);

			tx.add(
				SystemProgram.transfer({
					fromPubkey: buyer,
					toPubkey: buyerReserveTokenAta,
					lamports: BigInt(reserveWithFee.toString()),
				})
			);

			tx.add(createSyncNativeInstruction(buyerReserveTokenAta));
		}

		const buyTx = await this.program.methods
			.buyToken(symbol, amount, maxReserveAmount)
			.accounts({
				buyerTokenAccount: buyerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				configAccount: this.configAccountPubKey,
				buyerReserveTokenAccount: buyerReserveTokenAta,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				feeReserveTokenAccount: feeWalletReserveTokenAta,
				feeReserveTokenAccount2: feeWalletReserveTokenAta2,
				feeReserveTokenAccount3: feeWalletReserveTokenAta3,
				reserveToken: this.configAccountData.reserveToken,
				mint,
				buyer,
				authority: this.configAccountData.authority,
				tokenProgram: init
					? anchor.utils.token.TOKEN_PROGRAM_ID
					: mintInfo.value!.owner,
				reserveTokenProgram: reserveTokenInfo.value.owner,
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
			})
			.transaction();

		tx.add(buyTx);

		return tx;
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
			sellerAta,
			sellerReserveTokenAta,
			feeWalletReserveTokenAta,
			feeWalletReserveTokenAta2,
			feeWalletReserveTokenAta3,
		] = await Promise.all([
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
			getAssociatedTokenAddress(
				this.configAccountData.reserveToken,
				this.configAccountData.feeWallet2,
				false,
				reserveTokenInfo.value.owner
			),
			getAssociatedTokenAddress(
				this.configAccountData.reserveToken,
				this.configAccountData.feeWallet3,
				false,
				reserveTokenInfo.value.owner
			),
		]);

		return this.program.methods
			.sellToken(symbol, amount, minReserveAmount)
			.accounts({
				sellerTokenAccount: sellerAta,
				vaultTokenAccount: vaultTokenPda,
				bondAccount: bondPda,
				configAccount: this.configAccountPubKey,
				sellerReserveTokenAccount: sellerReserveTokenAta,
				vaultReserveTokenAccount: vaultReserveTokenPubkey,
				feeReserveTokenAccount: feeWalletReserveTokenAta,
				feeReserveTokenAccount2: feeWalletReserveTokenAta2,
				feeReserveTokenAccount3: feeWalletReserveTokenAta3,
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
