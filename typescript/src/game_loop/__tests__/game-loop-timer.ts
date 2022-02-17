import GameLoopTimer, { getRxJSGameLoop } from "../game-loop-timer";

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function hardWait(ms: number): void {
  const then = Date.now();
  while (Date.now() - then < ms) {}
}

test("happy case, rxjs, tick rate is met.", function () {
  jest.useFakeTimers();
  const spy = jest.fn();
  const timer = getRxJSGameLoop(60);

  const subs = timer.subscribe(spy);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenNthCalledWith(1, 0);

  jest.advanceTimersByTime(15);
  expect(spy).toHaveBeenCalledTimes(1);

  // 16.666 is reduced to 16
  jest.advanceTimersByTime(1);
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenNthCalledWith(2, 16);

  jest.advanceTimersByTime(1);
  expect(spy).toHaveBeenCalledTimes(2);

  subs.unsubscribe();
});

test("happy case, tick rate is met.", function () {
  jest.useFakeTimers();
  const spy = jest.fn();
  const timer = new GameLoopTimer(60);

  timer.start(spy);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenNthCalledWith(1, 0);

  jest.advanceTimersByTime(15);
  expect(spy).toHaveBeenCalledTimes(1);

  // 16.666 is reduced to 16
  jest.advanceTimersByTime(1);
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenNthCalledWith(2, 16);

  jest.advanceTimersByTime(1);
  expect(spy).toHaveBeenCalledTimes(2);

  timer.stop();
});

test("sad case, tick rate is exceeded.", async function () {
  jest.useRealTimers();
  let calledOnce = false;
  const spy = jest.fn().mockImplementation(() => {
    if (!calledOnce) {
      hardWait(48);
      calledOnce = true;
    }
  });
  const timer = new GameLoopTimer(60);

  timer.start(spy);
  expect(spy).toHaveBeenCalledTimes(1);
  await wait(0);

  // @ts-ignore
  const timeElapsed = spy.mock.calls[1][0];

  expect(spy).toHaveBeenCalledTimes(2);
  expect(timeElapsed).toBeGreaterThanOrEqual(48);
  expect(timeElapsed).toBeLessThanOrEqual(52); // a little extra fudge room

  await wait(0);
  expect(spy).toHaveBeenCalledTimes(2);

  timer.stop();
});
