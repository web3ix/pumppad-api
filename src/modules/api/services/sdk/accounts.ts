import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Curve } from "./idl/curve";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
	"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const getSeed = (seed: string, program: Program<Curve>): Buffer => {
	return Buffer.from(
		// @ts-ignore
		JSON.parse(program.idl.constants.find((c) => c.name === seed)!.value)
	);
};

const toBuffer = (value: anchor.BN, endian?: any, length?: any) => {
	try {
		return value.toBuffer(endian, length);
	} catch (error) {
		return value.toArrayLike(Buffer, endian, length);
	}
};

export const getConfigAccountPubKey = (
	program: Program<Curve>,
	configAuthority: PublicKey
) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[getSeed("CONFIG_PDA_SEED", program), configAuthority.toBuffer()],
		program.programId
	)[0];
};

export const getStepAccountPubKey = (
	program: Program<Curve>,
	configAccount: PublicKey,
	stepId: anchor.BN
) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[
			getSeed("STEP_PDA_SEED", program),
			configAccount.toBuffer(),
			toBuffer(stepId, "be", 8),
		],
		program.programId
	)[0];
};

export const getMintAccountPubKey = (
	program: Program<Curve>,
	configAccount: PublicKey,
	symbol: String
) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[
			getSeed("MINT_PDA_SEED", program),
			configAccount.toBuffer(),
			Buffer.from(symbol),
		],
		program.programId
	)[0];
};

export const getMetadataAccountPubKey = (mint: PublicKey) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[
			Buffer.from("metadata"),
			TOKEN_METADATA_PROGRAM_ID.toBuffer(),
			mint.toBuffer(),
		],
		TOKEN_METADATA_PROGRAM_ID
	)[0];
};

export const getVaultTokenAccountPubKey = (
	program: Program<Curve>,
	configAccount: PublicKey,
	tokenMint: PublicKey
) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[
			getSeed("VAULT_BOND_PDA_SEED", program),
			configAccount.toBuffer(),
			tokenMint.toBuffer(),
		],
		program.programId
	)[0];
};

export const getBondAccountPubKey = (
	program: Program<Curve>,
	configAccount: PublicKey,
	mint: PublicKey
) => {
	return anchor.web3.PublicKey.findProgramAddressSync(
		[
			getSeed("BOND_PDA_SEED", program),
			configAccount.toBuffer(),
			mint.toBuffer(),
		],
		program.programId
	)[0];
};
