export abstract class Network<T, N> {
    protected _provider: T;
    protected _signer: N | undefined;

    constructor(provider: T) {
        this._provider = provider;
    }

    get signer(): N | undefined {
        return this._signer;
    }

    set signer(signer: N | undefined) {
        this._signer = signer;
    }

    get provider() {
        return this._provider;
    }
}
