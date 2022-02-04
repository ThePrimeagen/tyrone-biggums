import { filter, map, Observable, Observer, reduce, scan } from "rxjs"

export type Thing = {
    delta: number;
}

function createTimer(waitTime: number): Observable<Thing> {
    return Observable.create(async (observer: Observer<Thing>) => {
        function wait(ms: number): Promise<void> {
            return new Promise(res => setTimeout(res, ms));
        }

        let then = Date.now();
        do {
            await wait(waitTime);
            const now = Date.now();
            const delta = now - then;

            observer.next({
                delta
            });

            then = now;
        } while (true);
    });
}

const timer = createTimer(69);

timer.pipe(
    map((delta) => {
        return delta.delta * 10;
    }),
    scan((prev, curr) => {
        console.log(prev, curr)
        return curr;
    })
).subscribe((final) => {
    console.log("final", final);
});

