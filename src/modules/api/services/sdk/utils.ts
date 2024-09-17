import {
	Connection,
	PublicKey,
	Transaction,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
	createAssociatedTokenAccountInstruction,
	createCloseAccountInstruction,
	createSyncNativeInstruction,
	getAssociatedTokenAddressSync,
	NATIVE_MINT,
	getAccount,
	TokenAccountNotFoundError,
	TokenInvalidAccountOwnerError,
	getAssociatedTokenAddress,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function checkOrCreateAssociatedTokenAccount(
	connection: Connection,
	owner: PublicKey,
	authority: PublicKey,
	mintAddress: PublicKey
): Promise<{ ata: PublicKey; tx: Transaction | null }> {
	const tokenInfo = await connection.getParsedAccountInfo(mintAddress);
	if (!tokenInfo.value) throw new Error("Invalid token");

	const tokenProgram = tokenInfo.value.owner;
	// Create a token account for the user and mint some tokens
	const ata = await getAssociatedTokenAddress(
		mintAddress,
		owner,
		false,
		tokenProgram,
		ASSOCIATED_TOKEN_PROGRAM_ID
	);
	const accountInfo = await connection.getAccountInfo(ata);

	if (!accountInfo || !accountInfo.data) {
		let tx = new Transaction();

		tx.add(
			createAssociatedTokenAccountInstruction(
				authority,
				ata,
				owner,
				mintAddress,
				tokenProgram,
				ASSOCIATED_TOKEN_PROGRAM_ID
			)
		);

		return { ata, tx };
	}

	return { ata, tx: null };
}

export async function getNumberDecimals(
	connection: anchor.web3.Connection,
	token: anchor.web3.PublicKey
): Promise<number> {
	const info = await connection.getParsedAccountInfo(token);
	const result = (info.value?.data as any).parsed.info.decimals as number;
	return result;
}

export async function buildInstructionsWrapSol(
	connection: Connection,
	user: PublicKey,
	lamports: number
) {
	const instructions: anchor.web3.TransactionInstruction[] = [];
	const associatedTokenAccount = getAssociatedTokenAddressSync(
		NATIVE_MINT,
		user
	);
	try {
		await getAccount(connection, associatedTokenAccount);
	} catch (error: unknown) {
		if (
			error instanceof TokenAccountNotFoundError ||
			error instanceof TokenInvalidAccountOwnerError
		) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					user,
					associatedTokenAccount,
					user,
					NATIVE_MINT
				)
			);
		}
	}
	instructions.push(
		anchor.web3.SystemProgram.transfer({
			fromPubkey: user,
			toPubkey: associatedTokenAccount,
			lamports: lamports,
		}),
		createSyncNativeInstruction(associatedTokenAccount)
	);

	return instructions;
}

export async function buildInstructionsUnWrapSol(user: PublicKey) {
	const instructions: anchor.web3.TransactionInstruction[] = [];
	const associatedTokenAccount = getAssociatedTokenAddressSync(
		NATIVE_MINT,
		user
	);
	instructions.push(
		createCloseAccountInstruction(associatedTokenAccount, user, user)
	);
	return instructions;
}

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));
export const randomInt = (min: number, max: number) => {
	min = Math.max(1, min);
	return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getSolBalance = async (
	connection: Connection,
	owner: PublicKey
) => {
	const balance = await connection.getBalance(owner, "confirmed");

	return balance / LAMPORTS_PER_SOL;
};
