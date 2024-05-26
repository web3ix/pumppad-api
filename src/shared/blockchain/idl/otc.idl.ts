export type Otc = {
    version: '0.1.0';
    name: 'otc';
    constants: [
        {
            name: 'CONFIG_PDA_SEED';
            type: 'bytes';
            value: '[99, 111, 110, 102, 105, 103, 95, 112, 100, 97, 95, 115, 101, 101, 100]';
        },
        {
            name: 'ROLE_PDA_SEED';
            type: 'bytes';
            value: '[114, 111, 108, 101, 95, 112, 100, 97, 95, 115, 101, 101, 100]';
        },
        {
            name: 'EX_TOKEN_PDA_SEED';
            type: 'bytes';
            value: '[101, 120, 95, 116, 111, 107, 101, 110, 95, 112, 100, 97, 95, 115, 101, 101, 100]';
        },
        {
            name: 'OFFER_PDA_SEED';
            type: 'bytes';
            value: '[111, 102, 102, 101, 114, 95, 112, 100, 97, 95, 115, 101, 101, 100]';
        },
        {
            name: 'VAULT_TOKEN_PDA_SEED';
            type: 'bytes';
            value: '[118, 97, 117, 108, 116, 95, 116, 111, 107, 101, 110, 95, 112, 100, 97, 95, 115, 101, 101, 100]';
        },
        {
            name: 'WEI6';
            type: 'u64';
            value: '1_000_000';
        },
    ];
    instructions: [
        {
            name: 'initializeConfig';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'feeWallet';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'pledgeRate';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'setRole';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'roleAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'user';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'role';
                    type: {
                        defined: 'Role';
                    };
                },
            ];
        },
        {
            name: 'setExToken';
            accounts: [
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'isAccepted';
                    type: 'bool';
                },
            ];
        },
        {
            name: 'updateConfig';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: true;
                },
            ];
            args: [
                {
                    name: 'feeRefund';
                    type: {
                        option: 'u64';
                    };
                },
                {
                    name: 'feeSettle';
                    type: {
                        option: 'u64';
                    };
                },
                {
                    name: 'pledgeRate';
                    type: {
                        option: 'u64';
                    };
                },
                {
                    name: 'feeWallet';
                    type: {
                        option: 'publicKey';
                    };
                },
            ];
        },
        {
            name: 'createOffer';
            accounts: [
                {
                    name: 'offerAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'userTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exToken';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'user';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'roleAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'operator';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'offerType';
                    type: {
                        defined: 'OfferType';
                    };
                },
                {
                    name: 'amount';
                    type: 'u64';
                },
                {
                    name: 'price';
                    type: 'u64';
                },
                {
                    name: 'offerId';
                    type: 'u64';
                },
                {
                    name: 'productId';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'fillOffer';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'offerAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'userTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exToken';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'user';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'settleOffer';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'offerAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'feeTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'sellerTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'buyerTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'exToken';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'roleAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'operator';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'buyer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'seller';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'feeWallet';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'cancelFilledOffer';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'offerAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultExTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'userExTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'exToken';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'feeWallet';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'user';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'configAuthority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'roleAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'operator';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'cancelUnFilledOffer';
            accounts: [
                {
                    name: 'configAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'offerAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'feeExTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'userTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'exTokenAccount';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'exToken';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'user';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'feeWallet';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
    ];
    accounts: [
        {
            name: 'configAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'version';
                        type: 'u8';
                    },
                    {
                        name: 'authority';
                        type: 'publicKey';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'feeRefund';
                        type: 'u64';
                    },
                    {
                        name: 'feeSettle';
                        type: 'u64';
                    },
                    {
                        name: 'feeWallet';
                        type: 'publicKey';
                    },
                    {
                        name: 'lastOfferId';
                        type: 'u64';
                    },
                    {
                        name: 'settleRate';
                        type: 'u64';
                    },
                    {
                        name: 'pledgeRate';
                        type: 'u64';
                    },
                ];
            };
        },
        {
            name: 'exTokenAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'version';
                        type: 'u8';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'isAccepted';
                        type: 'bool';
                    },
                    {
                        name: 'token';
                        type: 'publicKey';
                    },
                    {
                        name: 'config';
                        type: 'publicKey';
                    },
                    {
                        name: 'vaultToken';
                        type: 'publicKey';
                    },
                    {
                        name: 'vaultTokenBump';
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'offerAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'version';
                        type: 'u8';
                    },
                    {
                        name: 'offerId';
                        type: 'u64';
                    },
                    {
                        name: 'productId';
                        type: 'u64';
                    },
                    {
                        name: 'offerType';
                        type: {
                            defined: 'OfferType';
                        };
                    },
                    {
                        name: 'amount';
                        type: 'u64';
                    },
                    {
                        name: 'price';
                        type: 'u64';
                    },
                    {
                        name: 'value';
                        type: 'u64';
                    },
                    {
                        name: 'exToken';
                        type: 'publicKey';
                    },
                    {
                        name: 'status';
                        type: {
                            defined: 'OfferStatus';
                        };
                    },
                    {
                        name: 'authority';
                        type: 'publicKey';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'config';
                        type: 'publicKey';
                    },
                    {
                        name: 'seller';
                        type: 'publicKey';
                    },
                    {
                        name: 'buyer';
                        type: 'publicKey';
                    },
                ];
            };
        },
        {
            name: 'roleAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'configAccount';
                        type: 'publicKey';
                    },
                    {
                        name: 'user';
                        type: 'publicKey';
                    },
                    {
                        name: 'role';
                        type: {
                            defined: 'Role';
                        };
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                ];
            };
        },
    ];
    types: [
        {
            name: 'OfferType';
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'Buy';
                    },
                    {
                        name: 'Sell';
                    },
                ];
            };
        },
        {
            name: 'OfferStatus';
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'Open';
                    },
                    {
                        name: 'Filled';
                    },
                    {
                        name: 'Settled';
                    },
                    {
                        name: 'Cancel';
                    },
                ];
            };
        },
        {
            name: 'Role';
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'Operator';
                    },
                    {
                        name: 'Admin';
                    },
                ];
            };
        },
    ];
    events: [
        {
            name: 'InitializedEvent';
            fields: [
                {
                    name: 'authority';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'feeWallet';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'feeRefund';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'feeSettle';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'version';
                    type: 'u8';
                    index: false;
                },
            ];
        },
        {
            name: 'SetRoleEvent';
            fields: [
                {
                    name: 'configAccount';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'user';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'role';
                    type: {
                        defined: 'Role';
                    };
                    index: false;
                },
            ];
        },
        {
            name: 'UpdateAcceptedTokenEvent';
            fields: [
                {
                    name: 'exToken';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'isAccepted';
                    type: 'bool';
                    index: false;
                },
                {
                    name: 'version';
                    type: 'u8';
                    index: false;
                },
            ];
        },
        {
            name: 'CreatedOfferEvent';
            fields: [
                {
                    name: 'offerId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'productId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'offerType';
                    type: {
                        defined: 'OfferType';
                    };
                    index: false;
                },
                {
                    name: 'amount';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'price';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'exToken';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'value';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'offerBy';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'version';
                    type: 'u8';
                    index: false;
                },
            ];
        },
        {
            name: 'FillOfferEvent';
            fields: [
                {
                    name: 'offerId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'offer';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'filledBy';
                    type: 'publicKey';
                    index: false;
                },
            ];
        },
        {
            name: 'SettledOfferEvent';
            fields: [
                {
                    name: 'offer';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'offerId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'totalLiquidValue';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'feeValue';
                    type: 'u64';
                    index: false;
                },
            ];
        },
        {
            name: 'CancelUnfilledOfferEvent';
            fields: [
                {
                    name: 'offer';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'offerId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'feeCancel';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'refundValue';
                    type: 'u64';
                    index: false;
                },
            ];
        },
        {
            name: 'CancelFilledOfferEvent';
            fields: [
                {
                    name: 'offer';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'offerId';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'config';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'feeCancel';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'refundValue';
                    type: 'u64';
                    index: false;
                },
            ];
        },
    ];
    errors: [
        {
            code: 6000;
            name: 'Unauthorized';
            msg: 'Unauthorized';
        },
        {
            code: 6001;
            name: 'InsufficientFunds';
            msg: 'Insufficient Funds';
        },
        {
            code: 6002;
            name: 'FeeRefundTooHigh';
            msg: 'Fee Refund <= 10%';
        },
        {
            code: 6003;
            name: 'FeeSettleTooHigh';
            msg: 'Settle Fee <= 10%';
        },
        {
            code: 6004;
            name: 'MintIsNotOwnedByTokenProgram';
            msg: 'Mint is not owned by token program';
        },
        {
            code: 6005;
            name: 'EXTokenNotAccepted';
            msg: 'Exchange Token Not Accepted';
        },
        {
            code: 6006;
            name: 'PriceInvalid';
            msg: 'Price Invalid';
        },
        {
            code: 6007;
            name: 'OfferStatusInvalid';
            msg: 'Offer Status Invalid';
        },
        {
            code: 6008;
            name: 'InvalidAmount';
            msg: 'Invalid Amount';
        },
        {
            code: 6009;
            name: 'EXTokenMismatch';
            msg: 'Invalid Offer Token';
        },
        {
            code: 6010;
            name: 'ConfigMismatch';
            msg: 'Config Mismatch';
        },
        {
            code: 6011;
            name: 'FeeWalletMismatch';
            msg: 'Fee Wallet Mismatch';
        },
        {
            code: 6012;
            name: 'InvalidRole';
            msg: 'Invalid role';
        },
    ];
};

export const IDL: Otc = {
    version: '0.1.0',
    name: 'otc',
    constants: [
        {
            name: 'CONFIG_PDA_SEED',
            type: 'bytes',
            value: '[99, 111, 110, 102, 105, 103, 95, 112, 100, 97, 95, 115, 101, 101, 100]',
        },
        {
            name: 'ROLE_PDA_SEED',
            type: 'bytes',
            value: '[114, 111, 108, 101, 95, 112, 100, 97, 95, 115, 101, 101, 100]',
        },
        {
            name: 'EX_TOKEN_PDA_SEED',
            type: 'bytes',
            value: '[101, 120, 95, 116, 111, 107, 101, 110, 95, 112, 100, 97, 95, 115, 101, 101, 100]',
        },
        {
            name: 'OFFER_PDA_SEED',
            type: 'bytes',
            value: '[111, 102, 102, 101, 114, 95, 112, 100, 97, 95, 115, 101, 101, 100]',
        },
        {
            name: 'VAULT_TOKEN_PDA_SEED',
            type: 'bytes',
            value: '[118, 97, 117, 108, 116, 95, 116, 111, 107, 101, 110, 95, 112, 100, 97, 95, 115, 101, 101, 100]',
        },
        {
            name: 'WEI6',
            type: 'u64',
            value: '1_000_000',
        },
    ],
    instructions: [
        {
            name: 'initializeConfig',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'feeWallet',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'pledgeRate',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'setRole',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'roleAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'role',
                    type: {
                        defined: 'Role',
                    },
                },
            ],
        },
        {
            name: 'setExToken',
            accounts: [
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'isAccepted',
                    type: 'bool',
                },
            ],
        },
        {
            name: 'updateConfig',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'feeRefund',
                    type: {
                        option: 'u64',
                    },
                },
                {
                    name: 'feeSettle',
                    type: {
                        option: 'u64',
                    },
                },
                {
                    name: 'pledgeRate',
                    type: {
                        option: 'u64',
                    },
                },
                {
                    name: 'feeWallet',
                    type: {
                        option: 'publicKey',
                    },
                },
            ],
        },
        {
            name: 'createOffer',
            accounts: [
                {
                    name: 'offerAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'userTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exToken',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'roleAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'operator',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'offerType',
                    type: {
                        defined: 'OfferType',
                    },
                },
                {
                    name: 'amount',
                    type: 'u64',
                },
                {
                    name: 'price',
                    type: 'u64',
                },
                {
                    name: 'offerId',
                    type: 'u64',
                },
                {
                    name: 'productId',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'fillOffer',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'offerAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'userTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exToken',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'settleOffer',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'offerAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'feeTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'sellerTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'buyerTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'exToken',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'roleAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'operator',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'buyer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'seller',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'feeWallet',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'cancelFilledOffer',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'offerAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultExTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userExTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'exToken',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'feeWallet',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'configAuthority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'roleAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'operator',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'cancelUnFilledOffer',
            accounts: [
                {
                    name: 'configAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'offerAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'feeExTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'exTokenAccount',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'exToken',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'feeWallet',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
    ],
    accounts: [
        {
            name: 'configAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'version',
                        type: 'u8',
                    },
                    {
                        name: 'authority',
                        type: 'publicKey',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'feeRefund',
                        type: 'u64',
                    },
                    {
                        name: 'feeSettle',
                        type: 'u64',
                    },
                    {
                        name: 'feeWallet',
                        type: 'publicKey',
                    },
                    {
                        name: 'lastOfferId',
                        type: 'u64',
                    },
                    {
                        name: 'settleRate',
                        type: 'u64',
                    },
                    {
                        name: 'pledgeRate',
                        type: 'u64',
                    },
                ],
            },
        },
        {
            name: 'exTokenAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'version',
                        type: 'u8',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'isAccepted',
                        type: 'bool',
                    },
                    {
                        name: 'token',
                        type: 'publicKey',
                    },
                    {
                        name: 'config',
                        type: 'publicKey',
                    },
                    {
                        name: 'vaultToken',
                        type: 'publicKey',
                    },
                    {
                        name: 'vaultTokenBump',
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'offerAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'version',
                        type: 'u8',
                    },
                    {
                        name: 'offerId',
                        type: 'u64',
                    },
                    {
                        name: 'productId',
                        type: 'u64',
                    },
                    {
                        name: 'offerType',
                        type: {
                            defined: 'OfferType',
                        },
                    },
                    {
                        name: 'amount',
                        type: 'u64',
                    },
                    {
                        name: 'price',
                        type: 'u64',
                    },
                    {
                        name: 'value',
                        type: 'u64',
                    },
                    {
                        name: 'exToken',
                        type: 'publicKey',
                    },
                    {
                        name: 'status',
                        type: {
                            defined: 'OfferStatus',
                        },
                    },
                    {
                        name: 'authority',
                        type: 'publicKey',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'config',
                        type: 'publicKey',
                    },
                    {
                        name: 'seller',
                        type: 'publicKey',
                    },
                    {
                        name: 'buyer',
                        type: 'publicKey',
                    },
                ],
            },
        },
        {
            name: 'roleAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'configAccount',
                        type: 'publicKey',
                    },
                    {
                        name: 'user',
                        type: 'publicKey',
                    },
                    {
                        name: 'role',
                        type: {
                            defined: 'Role',
                        },
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: 'OfferType',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Buy',
                    },
                    {
                        name: 'Sell',
                    },
                ],
            },
        },
        {
            name: 'OfferStatus',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Open',
                    },
                    {
                        name: 'Filled',
                    },
                    {
                        name: 'Settled',
                    },
                    {
                        name: 'Cancel',
                    },
                ],
            },
        },
        {
            name: 'Role',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Operator',
                    },
                    {
                        name: 'Admin',
                    },
                ],
            },
        },
    ],
    events: [
        {
            name: 'InitializedEvent',
            fields: [
                {
                    name: 'authority',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'feeWallet',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'feeRefund',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'feeSettle',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'version',
                    type: 'u8',
                    index: false,
                },
            ],
        },
        {
            name: 'SetRoleEvent',
            fields: [
                {
                    name: 'configAccount',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'user',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'role',
                    type: {
                        defined: 'Role',
                    },
                    index: false,
                },
            ],
        },
        {
            name: 'UpdateAcceptedTokenEvent',
            fields: [
                {
                    name: 'exToken',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'isAccepted',
                    type: 'bool',
                    index: false,
                },
                {
                    name: 'version',
                    type: 'u8',
                    index: false,
                },
            ],
        },
        {
            name: 'CreatedOfferEvent',
            fields: [
                {
                    name: 'offerId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'productId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'offerType',
                    type: {
                        defined: 'OfferType',
                    },
                    index: false,
                },
                {
                    name: 'amount',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'price',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'exToken',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'value',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'offerBy',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'version',
                    type: 'u8',
                    index: false,
                },
            ],
        },
        {
            name: 'FillOfferEvent',
            fields: [
                {
                    name: 'offerId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'offer',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'filledBy',
                    type: 'publicKey',
                    index: false,
                },
            ],
        },
        {
            name: 'SettledOfferEvent',
            fields: [
                {
                    name: 'offer',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'offerId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'totalLiquidValue',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'feeValue',
                    type: 'u64',
                    index: false,
                },
            ],
        },
        {
            name: 'CancelUnfilledOfferEvent',
            fields: [
                {
                    name: 'offer',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'offerId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'feeCancel',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'refundValue',
                    type: 'u64',
                    index: false,
                },
            ],
        },
        {
            name: 'CancelFilledOfferEvent',
            fields: [
                {
                    name: 'offer',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'offerId',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'config',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'feeCancel',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'refundValue',
                    type: 'u64',
                    index: false,
                },
            ],
        },
    ],
    errors: [
        {
            code: 6000,
            name: 'Unauthorized',
            msg: 'Unauthorized',
        },
        {
            code: 6001,
            name: 'InsufficientFunds',
            msg: 'Insufficient Funds',
        },
        {
            code: 6002,
            name: 'FeeRefundTooHigh',
            msg: 'Fee Refund <= 10%',
        },
        {
            code: 6003,
            name: 'FeeSettleTooHigh',
            msg: 'Settle Fee <= 10%',
        },
        {
            code: 6004,
            name: 'MintIsNotOwnedByTokenProgram',
            msg: 'Mint is not owned by token program',
        },
        {
            code: 6005,
            name: 'EXTokenNotAccepted',
            msg: 'Exchange Token Not Accepted',
        },
        {
            code: 6006,
            name: 'PriceInvalid',
            msg: 'Price Invalid',
        },
        {
            code: 6007,
            name: 'OfferStatusInvalid',
            msg: 'Offer Status Invalid',
        },
        {
            code: 6008,
            name: 'InvalidAmount',
            msg: 'Invalid Amount',
        },
        {
            code: 6009,
            name: 'EXTokenMismatch',
            msg: 'Invalid Offer Token',
        },
        {
            code: 6010,
            name: 'ConfigMismatch',
            msg: 'Config Mismatch',
        },
        {
            code: 6011,
            name: 'FeeWalletMismatch',
            msg: 'Fee Wallet Mismatch',
        },
        {
            code: 6012,
            name: 'InvalidRole',
            msg: 'Invalid role',
        },
    ],
};
