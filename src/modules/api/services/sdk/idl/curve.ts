export type Curve = {
    version: '0.1.0';
    name: 'curve';
    constants: [
        {
            name: 'CONFIG_PDA_SEED';
            type: 'bytes';
            value: '[99, 111, 110, 102, 105, 103]';
        },
        {
            name: 'ROLE_PDA_SEED';
            type: 'bytes';
            value: '[114, 111, 108, 101]';
        },
        {
            name: 'STEP_PDA_SEED';
            type: 'bytes';
            value: '[115, 116, 101, 112]';
        },
        {
            name: 'MINT_PDA_SEED';
            type: 'bytes';
            value: '[109, 105, 110, 116]';
        },
        {
            name: 'METADATA_PDA_SEED';
            type: 'bytes';
            value: '[109, 101, 116, 97, 100, 97, 116, 97]';
        },
        {
            name: 'BOND_PDA_SEED';
            type: 'bytes';
            value: '[98, 111, 110, 100]';
        },
        {
            name: 'VAULT_BOND_PDA_SEED';
            type: 'bytes';
            value: '[118, 97, 117, 108, 116, 95, 98, 111, 110, 100]';
        },
        {
            name: 'WEI6';
            type: 'u64';
            value: '1_000_000';
        },
        {
            name: 'TOTAL_SUPPLY';
            type: 'u64';
            value: '1_000_000_000_000_000_000_u64';
        },
    ];
    instructions: [
        {
            name: 'initialize';
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
            ];
            args: [];
        },
        {
            name: 'addStep';
            accounts: [
                {
                    name: 'stepAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
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
            ];
            args: [
                {
                    name: 'ranges';
                    type: {
                        array: ['u64', 32];
                    };
                },
                {
                    name: 'prices';
                    type: {
                        array: ['u64', 32];
                    };
                },
            ];
        },
        {
            name: 'createToken';
            accounts: [
                {
                    name: 'mint';
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
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'metadata';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
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
                    name: 'tokenMetadataProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'name';
                    type: 'string';
                },
                {
                    name: 'symbol';
                    type: 'string';
                },
                {
                    name: 'uri';
                    type: 'string';
                },
            ];
        },
        {
            name: 'activateToken';
            accounts: [
                {
                    name: 'mint';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bondAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'symbol';
                    type: 'string';
                },
                {
                    name: 'stepId';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'buyToken';
            accounts: [
                {
                    name: 'buyerTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bondAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'stepAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'buyer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'creator';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'feeWallet';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
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
            args: [
                {
                    name: 'symbol';
                    type: 'string';
                },
                {
                    name: 'amount';
                    type: 'u64';
                },
                {
                    name: 'maxReserve';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'sellToken';
            accounts: [
                {
                    name: 'sellerTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bondAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'stepAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'seller';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'creator';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'feeWallet';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
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
            args: [
                {
                    name: 'symbol';
                    type: 'string';
                },
                {
                    name: 'amount';
                    type: 'u64';
                },
                {
                    name: 'minReserve';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'addLp';
            accounts: [
                {
                    name: 'authorityTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'vaultTokenAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bondAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'configAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: true;
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
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'symbol';
                    type: 'string';
                },
            ];
        },
    ];
    accounts: [
        {
            name: 'bondAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'initialized';
                        type: 'bool';
                    },
                    {
                        name: 'stepId';
                        type: 'u64';
                    },
                    {
                        name: 'reserve';
                        type: 'u64';
                    },
                    {
                        name: 'supplied';
                        type: 'u64';
                    },
                    {
                        name: 'creator';
                        type: 'publicKey';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'configAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'authority';
                        type: 'publicKey';
                    },
                    {
                        name: 'feeWallet';
                        type: 'publicKey';
                    },
                    {
                        name: 'systemFee';
                        type: 'u64';
                    },
                    {
                        name: 'buyRoyalty';
                        type: 'u64';
                    },
                    {
                        name: 'sellRoyalty';
                        type: 'u64';
                    },
                    {
                        name: 'lastStepId';
                        type: 'u64';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'stepAccount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'ranges';
                        type: {
                            array: ['u64', 32];
                        };
                    },
                    {
                        name: 'prices';
                        type: {
                            array: ['u64', 32];
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
                    name: 'feeWallet';
                    type: 'publicKey';
                    index: false;
                },
            ];
        },
        {
            name: 'NewTokenEvent';
            fields: [
                {
                    name: 'configAccount';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'creator';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'token';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'name';
                    type: 'string';
                    index: false;
                },
                {
                    name: 'symbol';
                    type: 'string';
                    index: false;
                },
                {
                    name: 'uri';
                    type: 'string';
                    index: false;
                },
            ];
        },
        {
            name: 'ActivateTokenEvent';
            fields: [
                {
                    name: 'configAccount';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'token';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'stepId';
                    type: 'u64';
                    index: false;
                },
            ];
        },
        {
            name: 'BuyEvent';
            fields: [
                {
                    name: 'configAccount';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'buyer';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'token';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'amount';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'reserve';
                    type: 'u64';
                    index: false;
                },
            ];
        },
        {
            name: 'SellEvent';
            fields: [
                {
                    name: 'configAccount';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'seller';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'token';
                    type: 'publicKey';
                    index: false;
                },
                {
                    name: 'amount';
                    type: 'u64';
                    index: false;
                },
                {
                    name: 'reserve';
                    type: 'u64';
                    index: false;
                },
            ];
        },
    ];
    errors: [
        {
            code: 6000;
            name: 'Initialized';
            msg: 'Initialized';
        },
        {
            code: 6001;
            name: 'Unauthorized';
            msg: 'Unauthorized';
        },
        {
            code: 6002;
            name: 'InvalidConfigAccount';
            msg: 'Invalid Config Account';
        },
        {
            code: 6003;
            name: 'InvalidFeeWallet';
            msg: 'Invalid Fee Wallet';
        },
        {
            code: 6004;
            name: 'InvalidCreator';
            msg: 'Invalid Creator';
        },
        {
            code: 6005;
            name: 'InvalidExToken';
            msg: 'Invalid Exchange Token';
        },
        {
            code: 6006;
            name: 'InsufficientFunds';
            msg: 'Insufficient Funds';
        },
        {
            code: 6007;
            name: 'InvalidRole';
            msg: 'Invalid Role';
        },
        {
            code: 6008;
            name: 'InvalidStep';
            msg: 'Invalid Step';
        },
        {
            code: 6009;
            name: 'ExceedMaxSupply';
            msg: 'Exceed Max Supply';
        },
        {
            code: 6010;
            name: 'InvalidCurrentSupply';
            msg: 'Invalid Current Supply';
        },
        {
            code: 6011;
            name: 'InvalidTokenAmount';
            msg: 'Invalid Token Amount';
        },
        {
            code: 6012;
            name: 'MintIsNotOwnedByTokenProgram';
            msg: 'Mint is not owned by token program';
        },
        {
            code: 6013;
            name: 'OverMaxSlippage';
            msg: 'Over Max Slippage';
        },
        {
            code: 6014;
            name: 'TransferFailed';
            msg: 'CPI Transfer Failed';
        },
    ];
};

export const IDL: Curve = {
    version: '0.1.0',
    name: 'curve',
    constants: [
        {
            name: 'CONFIG_PDA_SEED',
            type: 'bytes',
            value: '[99, 111, 110, 102, 105, 103]',
        },
        {
            name: 'ROLE_PDA_SEED',
            type: 'bytes',
            value: '[114, 111, 108, 101]',
        },
        {
            name: 'STEP_PDA_SEED',
            type: 'bytes',
            value: '[115, 116, 101, 112]',
        },
        {
            name: 'MINT_PDA_SEED',
            type: 'bytes',
            value: '[109, 105, 110, 116]',
        },
        {
            name: 'METADATA_PDA_SEED',
            type: 'bytes',
            value: '[109, 101, 116, 97, 100, 97, 116, 97]',
        },
        {
            name: 'BOND_PDA_SEED',
            type: 'bytes',
            value: '[98, 111, 110, 100]',
        },
        {
            name: 'VAULT_BOND_PDA_SEED',
            type: 'bytes',
            value: '[118, 97, 117, 108, 116, 95, 98, 111, 110, 100]',
        },
        {
            name: 'WEI6',
            type: 'u64',
            value: '1_000_000',
        },
        {
            name: 'TOTAL_SUPPLY',
            type: 'u64',
            value: '1_000_000_000_000_000_000_u64',
        },
    ],
    instructions: [
        {
            name: 'initialize',
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
            ],
            args: [],
        },
        {
            name: 'addStep',
            accounts: [
                {
                    name: 'stepAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
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
            ],
            args: [
                {
                    name: 'ranges',
                    type: {
                        array: ['u64', 32],
                    },
                },
                {
                    name: 'prices',
                    type: {
                        array: ['u64', 32],
                    },
                },
            ],
        },
        {
            name: 'createToken',
            accounts: [
                {
                    name: 'mint',
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
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'metadata',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
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
                    name: 'tokenMetadataProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'name',
                    type: 'string',
                },
                {
                    name: 'symbol',
                    type: 'string',
                },
                {
                    name: 'uri',
                    type: 'string',
                },
            ],
        },
        {
            name: 'activateToken',
            accounts: [
                {
                    name: 'mint',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bondAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'symbol',
                    type: 'string',
                },
                {
                    name: 'stepId',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'buyToken',
            accounts: [
                {
                    name: 'buyerTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bondAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'stepAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'buyer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'creator',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'feeWallet',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
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
            args: [
                {
                    name: 'symbol',
                    type: 'string',
                },
                {
                    name: 'amount',
                    type: 'u64',
                },
                {
                    name: 'maxReserve',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'sellToken',
            accounts: [
                {
                    name: 'sellerTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bondAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'stepAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'seller',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'creator',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'feeWallet',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
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
            args: [
                {
                    name: 'symbol',
                    type: 'string',
                },
                {
                    name: 'amount',
                    type: 'u64',
                },
                {
                    name: 'minReserve',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'addLp',
            accounts: [
                {
                    name: 'authorityTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'vaultTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bondAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'configAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: true,
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
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'symbol',
                    type: 'string',
                },
            ],
        },
    ],
    accounts: [
        {
            name: 'bondAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'initialized',
                        type: 'bool',
                    },
                    {
                        name: 'stepId',
                        type: 'u64',
                    },
                    {
                        name: 'reserve',
                        type: 'u64',
                    },
                    {
                        name: 'supplied',
                        type: 'u64',
                    },
                    {
                        name: 'creator',
                        type: 'publicKey',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'configAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'authority',
                        type: 'publicKey',
                    },
                    {
                        name: 'feeWallet',
                        type: 'publicKey',
                    },
                    {
                        name: 'systemFee',
                        type: 'u64',
                    },
                    {
                        name: 'buyRoyalty',
                        type: 'u64',
                    },
                    {
                        name: 'sellRoyalty',
                        type: 'u64',
                    },
                    {
                        name: 'lastStepId',
                        type: 'u64',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'stepAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'ranges',
                        type: {
                            array: ['u64', 32],
                        },
                    },
                    {
                        name: 'prices',
                        type: {
                            array: ['u64', 32],
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
                    name: 'feeWallet',
                    type: 'publicKey',
                    index: false,
                },
            ],
        },
        {
            name: 'NewTokenEvent',
            fields: [
                {
                    name: 'configAccount',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'creator',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'token',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'name',
                    type: 'string',
                    index: false,
                },
                {
                    name: 'symbol',
                    type: 'string',
                    index: false,
                },
                {
                    name: 'uri',
                    type: 'string',
                    index: false,
                },
            ],
        },
        {
            name: 'ActivateTokenEvent',
            fields: [
                {
                    name: 'configAccount',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'token',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'stepId',
                    type: 'u64',
                    index: false,
                },
            ],
        },
        {
            name: 'BuyEvent',
            fields: [
                {
                    name: 'configAccount',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'buyer',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'token',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'amount',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'reserve',
                    type: 'u64',
                    index: false,
                },
            ],
        },
        {
            name: 'SellEvent',
            fields: [
                {
                    name: 'configAccount',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'seller',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'token',
                    type: 'publicKey',
                    index: false,
                },
                {
                    name: 'amount',
                    type: 'u64',
                    index: false,
                },
                {
                    name: 'reserve',
                    type: 'u64',
                    index: false,
                },
            ],
        },
    ],
    errors: [
        {
            code: 6000,
            name: 'Initialized',
            msg: 'Initialized',
        },
        {
            code: 6001,
            name: 'Unauthorized',
            msg: 'Unauthorized',
        },
        {
            code: 6002,
            name: 'InvalidConfigAccount',
            msg: 'Invalid Config Account',
        },
        {
            code: 6003,
            name: 'InvalidFeeWallet',
            msg: 'Invalid Fee Wallet',
        },
        {
            code: 6004,
            name: 'InvalidCreator',
            msg: 'Invalid Creator',
        },
        {
            code: 6005,
            name: 'InvalidExToken',
            msg: 'Invalid Exchange Token',
        },
        {
            code: 6006,
            name: 'InsufficientFunds',
            msg: 'Insufficient Funds',
        },
        {
            code: 6007,
            name: 'InvalidRole',
            msg: 'Invalid Role',
        },
        {
            code: 6008,
            name: 'InvalidStep',
            msg: 'Invalid Step',
        },
        {
            code: 6009,
            name: 'ExceedMaxSupply',
            msg: 'Exceed Max Supply',
        },
        {
            code: 6010,
            name: 'InvalidCurrentSupply',
            msg: 'Invalid Current Supply',
        },
        {
            code: 6011,
            name: 'InvalidTokenAmount',
            msg: 'Invalid Token Amount',
        },
        {
            code: 6012,
            name: 'MintIsNotOwnedByTokenProgram',
            msg: 'Mint is not owned by token program',
        },
        {
            code: 6013,
            name: 'OverMaxSlippage',
            msg: 'Over Max Slippage',
        },
        {
            code: 6014,
            name: 'TransferFailed',
            msg: 'CPI Transfer Failed',
        },
    ],
};
