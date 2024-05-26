export enum ESortType {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum EOfferType {
    Buy = 1,
    Sell = 2,
}

export enum EOfferStatus {
    Open = 'open',
    Filled = 'filled',
    Canceled = 'canceled',
}

export enum EOrderStatus {
    Open = 'open',
    SettleFilled = 'settle_filled',
    SettleCanceled = 'settle_canceled',
    Canceled = 'canceled',
}

export enum ETokenStatus {
    Active = 'active',
    Inactive = 'inactive',
    Settle = 'settle',
}
