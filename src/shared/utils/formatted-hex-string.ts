import { ethers } from 'ethers';

export const formattedHexString = (num: string | number): string => {
    return ethers.BigNumber.from(num)
        .toHexString()
        .replace(/^(0x)0+(0?.*)$/, '$1$2');
};
