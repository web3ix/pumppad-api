// import lodash from 'lodash';
import { ethers } from 'ethers';
import { uniqBy, cloneDeep } from 'lodash';

export function countDecimals(value: number | string) {
    const numStr = handleScientificNotation(value?.toString());
    const length = numStr?.split('.')?.[1]?.length;
    return length ?? 0;
}

export function handleScientificNotation(num: number | string) {
    const str = num?.toString();
    if (str?.includes('e')) {
        const [coefficient, exponent] = str.split('e');
        const decimalCount = countDecimals(Number(coefficient));
        const exponentValue = parseInt(exponent, 10);
        if (exponentValue >= 0) {
            const result = Number(num).toLocaleString();
            return result;
        } else {
            const result = Number(num).toFixed(
                Math.abs(exponentValue) + decimalCount,
            );
            return result;
        }
    }
    return str;
}

export function wei(num: number | string, decimals = 9) {
    const stringified = handleScientificNotation(num.toString());
    return BigInt(ethers.utils.parseUnits(stringified, decimals).toString());
}

export type CurveType = 'LINEAR' | 'EXPONENTIAL' | 'LOGARITHMIC' | 'FLAT';

export type ReserveToken = {
    address: `0x${string}`;
    decimals: number;
};

export type StepData = {
    rangeTo: number;
    price: number;
}[];

type CurveParameter = {
    curveType: CurveType;
    stepCount: number;
    maxSupply: number;
    initialMintingPrice: number;
    finalMintingPrice: number;
    creatorAllocation?: number;
};

type WithCurveData = {
    curveData: CurveParameter;
    stepData?: never; // Explicitly state that stepData cannot be used here
};

type WithStepData = {
    curveData?: never; // Explicitly state that curveData cannot be used here
    stepData: StepData;
};

export type CreateERC20TokenParams = {
    // required
    name: string;
    reserveToken: ReserveToken;
    buyRoyalty?: number;
    sellRoyalty?: number;
} & (WithCurveData | WithStepData);

export type CreateTokenParams = CreateERC20TokenParams & {
    tokenType: 'ERC20' | 'ERC1155';
    symbol: string;
};

export type GenerateStepArgs = CreateTokenParams & {
    curveData: CurveParameter;
};

export const enum CurveEnum {
    FLAT = 'FLAT',
    LINEAR = 'LINEAR',
    EXPONENTIAL = 'EXPONENTIAL',
    LOGARITHMIC = 'LOGARITHMIC',
}

export function formatGraphPoint(value: number, maxDecimalPoints?: number) {
    const maxWeiDecimals = 9;
    let formattedValue;
    if (maxDecimalPoints !== undefined && maxWeiDecimals > maxDecimalPoints) {
        formattedValue = Number(value?.toFixed(maxDecimalPoints));
    } else {
        formattedValue = Number(value?.toFixed(maxWeiDecimals));
    }
    // it should format the value, not return 0
    if (value !== 0 && formattedValue === 0) return value;
    return formattedValue;
}

export function generateSteps(form: GenerateStepArgs) {
    const {
        tokenType,
        reserveToken,
        curveData: {
            curveType,
            stepCount: _stepCount,
            maxSupply,
            creatorAllocation = 0,
            initialMintingPrice,
            finalMintingPrice,
        },
    } = form;

    const maxPrice = finalMintingPrice;
    const startingPrice = initialMintingPrice;
    const stepPoints: Array<{ x: number; y: number }> = [];
    let stepCount = curveType === CurveEnum.FLAT ? 1 : _stepCount;

    // here we need to calculate the extra step count if the starting price is 0
    let extraStepCount = 0;

    if (startingPrice === 0) {
        extraStepCount = 1;
    }

    if (tokenType === 'ERC1155' && stepCount > maxSupply) {
        stepCount = Math.max(maxSupply, 2);
        extraStepCount = 1;
    }

    const deltaX =
        (maxSupply - creatorAllocation) / (stepCount + extraStepCount);
    const totalX = maxSupply - creatorAllocation - deltaX;
    const totalY = maxPrice - startingPrice;

    const exponent = 0.5; // This can be adjusted to control the curve steepness
    const coefficientPower = totalY / Math.pow(totalX, exponent);

    // handle exponential curves separately.
    const percentageIncrease = Math.pow(
        maxPrice / startingPrice,
        1 / (stepCount - 1),
    );

    for (let i = extraStepCount; i <= stepCount + extraStepCount; i++) {
        let x = i * deltaX + creatorAllocation;
        if (tokenType === 'ERC1155') x = Math.ceil(x);
        let y: number;

        switch (curveType) {
            case CurveEnum.FLAT:
                y = startingPrice;
                break;
            case CurveEnum.LINEAR:
                const stepPerPrice = totalY / totalX;
                y =
                    stepPerPrice * (x - extraStepCount - creatorAllocation) +
                    startingPrice;
                break;
            case CurveEnum.EXPONENTIAL:
                if (i === 0) {
                    y = startingPrice;
                } else {
                    const prevY = stepPoints[i - 1].y;
                    y = prevY * percentageIncrease;
                }

                break;
            case CurveEnum.LOGARITHMIC:
                if (x - creatorAllocation === 0) y = startingPrice;
                else {
                    y =
                        startingPrice +
                        coefficientPower *
                            Math.pow(
                                x - extraStepCount - creatorAllocation,
                                exponent,
                            );
                }
                break;
            default:
                y = 0;
        }

        // interval range: leading 0 of deltaX + 3
        // price: max price decimal count + 3
        if (tokenType === 'ERC1155') {
            x = Number(x.toFixed(0));
        } else {
            x = formatGraphPoint(x, 9); // mint club generates 9 decimals
        }

        y = Math.max(Math.min(y, maxPrice), initialMintingPrice);
        y = formatGraphPoint(y, reserveToken.decimals);

        // last point is used to ensure the max price is reached
        // x is the range, y is the price
        if (i === stepCount && curveType !== CurveEnum.FLAT) {
            stepPoints.push({ x, y: maxPrice });
        } else {
            // there are cases where y is negative (e.g. when the curve is logarithmic and the starting price is 0)
            // in those cases, we set y to 0
            stepPoints.push({ x, y: Math.min(y ?? 0, maxPrice) });
        }
    }

    // If the starting price is 0, call it again to set the first step to the first point
    if (startingPrice === 0) {
        return generateSteps({
            ...form,
            curveData: {
                ...form.curveData,
                initialMintingPrice: stepPoints[0].y,
            },
        } as any);
    }

    let mergeCount = 0;
    let clonedPoints = structuredClone(stepPoints);
    // merge same range points. price can be different, because user can change them. ignore the last point
    for (let i = 0; i < clonedPoints.length - 2; i++) {
        if (clonedPoints[i].x === clonedPoints[i + 1].x) {
            clonedPoints.splice(i, 1);
            mergeCount++;
            i--;
        }
    }

    const finalData = uniqBy(
        clonedPoints,
        (point) => `${point.x}-${point.y}`,
    ).map((point) => {
        return { rangeTo: point.x, price: point.y };
    });

    return { stepData: finalData, mergeCount };
}

export function generateCreateArgs(
    params: CreateTokenParams & { tokenType: 'ERC20' | 'ERC1155' },
) {
    const {
        tokenType,
        name,
        symbol,
        curveData,
        reserveToken,
        buyRoyalty = 0.03,
        sellRoyalty = 0.03,
        stepData: _stepData,
    } = params;

    if (curveData === undefined && _stepData === undefined) {
        throw new Error(
            'Either curveData or stepData is required for creation',
        );
    }

    const stepRanges: bigint[] = [];
    const stepPrices: bigint[] = [];

    let stepData: { rangeTo: number; price: number }[] = [];
    const { creatorAllocation = 0, maxSupply = 0 } = curveData || {};

    if (curveData) {
        const { stepData: generatedSteps } = generateSteps({
            ...params,
            curveData,
        } as any);

        if (creatorAllocation > maxSupply) {
            throw new Error('Generating argument for creation failed');
        }

        stepData = generatedSteps;

        // we shift the y values to the right
        const cloned = cloneDeep(generatedSteps);
        for (let i = cloned.length - 1; i > 0; i--) {
            cloned[i].price = cloned[i - 1].price;
        }
        // remove the first element as it is not needed
        cloned.shift();
        stepData = cloned;

        if (creatorAllocation > 0) {
            stepRanges.unshift(
                wei(creatorAllocation, tokenType === 'ERC20' ? 9 : 0),
            );
            stepPrices.unshift(0n);
        }

        if (tokenType === 'ERC1155' && maxSupply === 1) {
            stepData = [{ rangeTo: 1, price: curveData.finalMintingPrice }];
        } else if (stepData[0].price !== curveData.initialMintingPrice) {
            // throw new Error(
            //     `Generated step data's initial price does not match your desired value.`,
            // );
            stepData[0].price = curveData.initialMintingPrice;
        } else if (
            stepData[stepData.length - 1].price !== curveData.finalMintingPrice
        ) {
            stepData[stepData.length - 1].price = curveData.finalMintingPrice;
            // throw new Error(
            //     `Generated step data's final price does not match your desired value.`,
            // );
        }
    } else {
        stepData = _stepData;
    }

    stepData.forEach(({ rangeTo, price }) => {
        if (isNaN(rangeTo) || isNaN(price) || rangeTo < 0 || price < 0) {
            throw new Error('Invalid arguments passed for creation');
        }

        stepRanges.push(wei(rangeTo, tokenType === 'ERC20' ? 8 : 0));
        stepPrices.push(wei(price, reserveToken.decimals));
    });

    // merge same price points
    for (let i = 0; i < stepPrices.length; i++) {
        if (stepPrices[i] === stepPrices[i + 1]) {
            stepRanges.splice(i, 1);
            stepPrices.splice(i, 1);
            i--;
        }
    }

    if (tokenType === 'ERC1155') {
        // merge same range points
        for (let i = 0; i < stepRanges.length; i++) {
            if (stepRanges[i] === stepRanges[i + 1]) {
                stepRanges.splice(i, 1);
                stepPrices.splice(i, 1);
                i--;
            }
        }
    }

    if (
        stepRanges.length === 0 ||
        stepPrices.length === 0 ||
        stepRanges.length !== stepPrices.length
    ) {
        throw new Error('Invalid step data. Please double check the step data');
    } else if (
        stepData === undefined &&
        creatorAllocation === 0 &&
        stepPrices.some((price) => price === 0n)
    ) {
        throw new Error(
            'Your parameters may be too extreme to generate a valid curve. Please change parameters, such as stepCount.',
        );
    } else if (creatorAllocation > 0) {
        const weiAllocation = wei(
            creatorAllocation,
            tokenType === 'ERC20' ? 9 : 0,
        );
        if (stepRanges[0] !== weiAllocation) {
            throw new Error(
                'Creator allocation does not match the first step range. Try different parameters',
            );
        }
    }

    const tokenParams: {
        name: string;
        symbol: string;
        uri?: string;
    } = {
        name,
        symbol,
    };

    const bondParams = {
        mintRoyalty: buyRoyalty * 100,
        burnRoyalty: sellRoyalty * 100,
        reserveToken: reserveToken.address,
        maxSupply: stepRanges[stepRanges.length - 1],
        stepRanges,
        stepPrices,
    };

    return { tokenParams, bondParams };
}

export type TableData = {
    start: number;
    end: number;
    price: number;
    tvl: number;
};

export function generateTableData(steps: { x: bigint; y: bigint }[]) {
    const clonedSteps = structuredClone(steps);
    // clonedSteps.sort((a, b) => a.x > b.x);
    let data: TableData[] = [];
    let totalTVL = 0;

    // Starting from the second point, calculate the area of the trapezoid formed by each step and add it to the total
    for (let i = 0; i < clonedSteps.length; i++) {
        const height = clonedSteps[i - 1 < 0 ? 0 : i - 1].y;
        const width =
            clonedSteps[i].x - (i - 1 < 0 ? BigInt(0) : clonedSteps[i - 1].x);
        const obj: Partial<TableData> = {};
        obj.start =
            i - 1 < 0 ? 0 : +ethers.utils.formatUnits(clonedSteps[i - 1].x, 9);
        obj.end = +ethers.utils.formatUnits(clonedSteps[i].x, 9);
        obj.price = +ethers.utils.formatUnits(clonedSteps[i].y, 9);
        if (width > 0 && height > 0) {
            const tvl = +ethers.utils.formatUnits(width * clonedSteps[i].y, 18);
            obj.tvl = tvl;
            totalTVL += tvl;
        }

        data.push(obj as TableData);
    }

    return { data, totalTVL };
}

const maxSupply = 5_000_000_000;
const finalMintingPrice = 0.0000003;
const initialMintingPrice = 0.000000125;
const stepCount = 32;

const genData = generateCreateArgs({
    name: 'abc',
    reserveToken: {
        address: '0x123',
        decimals: 9,
    },
    buyRoyalty: 0.05,
    sellRoyalty: 0.05,
    symbol: 'abc',
    tokenType: 'ERC20',
    curveData: {
        curveType: 'EXPONENTIAL',
        finalMintingPrice,
        initialMintingPrice,
        maxSupply,
        stepCount,
        creatorAllocation: 0,
    },
});

const steps = genData.bondParams.stepPrices.map((price, idx) => ({
    x: genData.bondParams.stepRanges[idx],
    y: price,
}));
console.log(
    '🚀 ~ file: bond2.ts:455 ~ steps ~ genData.bondParams.stepRanges:',
    genData.bondParams.stepRanges,
);
console.log(
    '🚀 ~ file: bond.ts:454 ~ steps ~ steps:',
    genData.bondParams.stepPrices,
);

const genTable = generateTableData(steps);

console.table(genTable.data);
console.log('Total TVL', genTable.totalTVL);
console.log('Token add LP', genTable.totalTVL / finalMintingPrice);
