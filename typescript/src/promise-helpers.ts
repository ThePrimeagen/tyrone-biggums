export type ExplodedPromise<T> = {
    resolve: (arg: T) => void;
    reject: (error: Error) => void;
    promise: Promise<T>;
}

export function explodePromise<T>(): ExplodedPromise<T> {
    let resolve, reject;
    let promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {
        promise,
        // @ts-ignore
        resolve,
        // @ts-ignore
        reject,
    };
}

