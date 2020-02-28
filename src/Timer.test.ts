import { IntervalTicker, AnimationFrameTicker, DummyTicker, Timer, TICK_INTERVAL, ITimerState } from './Timer'

const intervalTicker = new IntervalTicker()
const animationFrameTicker = new AnimationFrameTicker()

function title(cls: Function, str: string) {
  return cls.name + ': ' + str
}

beforeEach(() => {
  intervalTicker.stop()
  animationFrameTicker.stop()
})

test(title(IntervalTicker, 'tick one time'), (done) => {
  expect.assertions(1)
  const mock = jest.fn()
  const t = intervalTicker
  t.start(() => {
    t.stop()
    mock()
    expect(mock).toBeCalledTimes(1)
    done()
  })
})

test(title(IntervalTicker, 'stop intermediately after start'), (done) => {
  expect.assertions(1)
  const mock = jest.fn()
  const t = intervalTicker
  t.start(mock)
  t.stop()
  setTimeout(() => {
    expect(mock).not.toBeCalled()
    done()
  }, 2 * TICK_INTERVAL)
})

test(title(AnimationFrameTicker, 'tick one time'), (done) => {
  expect.assertions(1)
  const mock = jest.fn()
  const t = animationFrameTicker
  t.start(() => {
    t.stop()
    mock()
    expect(mock).toBeCalledTimes(1)
    done()
  })
})

test(title(AnimationFrameTicker, 'stop intermediately after start'), (done) => {
  expect.assertions(1)
  const mock = jest.fn()
  const t = animationFrameTicker
  t.start(mock)
  t.stop()
  setTimeout(() => {
    expect(mock).not.toBeCalled()
    done()
  }, 2 * TICK_INTERVAL)
})

test(title(DummyTicker, 'test tick'), () => {
  const t = new DummyTicker(1)
  const n = 5
  const mock = jest.fn()
  t.start(mock)
  for (let i = 0; i < n; i++) {
    t.tick()
  }
  expect(mock).toBeCalledTimes(n)
  expect(t.now()).toBe(n)
})

test(title(Timer, 'test time'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(5)
})

test(title(Timer, 'test set timescale use property'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  t.timescale = 2
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(5 * t.timescale)
})

test(title(Timer, 'dynamic set timescale #1'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  t.timescale = 2
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(7)
})

test(title(Timer, 'dynamic set timescale #2'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  t.timescale = 2
  ticker.tick()
  t.timescale = 3
  ticker.tick()
  expect(t.time).toBe(8)
})

test(title(Timer, 'test pause'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  t.pause()
  // the following ticks are ignored
  ticker.tick()
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(6)
})

test(title(Timer, 'test state'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  expect(t.isPaused()).toBeTruthy()
  t.start()
  expect(t.isRunning()).toBeTruthy()
  t.pause()
  expect(t.isPaused()).toBeTruthy()
  t.stop()
  expect(t.isStopped()).toBeTruthy()
})

test(title(Timer, 'test onTick event'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  const mock = jest.fn()
  t.onTick(mock)
  ticker.tick()
  ticker.tick()
  expect(mock).not.toBeCalled()
  t.start()
  ticker.tick(); expect(mock).toBeCalledWith(1)
  ticker.tick(); expect(mock).toBeCalledWith(2)
  ticker.tick(); expect(mock).toBeCalledWith(3)
  t.pause() // the following ticks are ignored
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(mock).toBeCalledTimes(3)
  t.start()
  ticker.tick(); expect(mock).toBeCalledWith(4)
  ticker.tick(); expect(mock).toBeCalledWith(5)
  ticker.tick(); expect(mock).toBeCalledWith(6)
  expect(t.time).toBe(6)
})

test(title(Timer, 'test onStateChange'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  const mock = jest.fn()
  t.onStateChange(mock)
  expect(mock).not.toBeCalled()
  t.start()
  expect(mock).toBeCalledWith(ITimerState.RUNNING)
  t.pause()
  expect(mock).toBeCalledWith(ITimerState.PAUSED)
  t.stop()
  expect(mock).toBeCalledWith(ITimerState.STOPPED)
  t.start()
  expect(mock).toBeCalledWith(ITimerState.RUNNING)

  const mock2 = jest.fn()
  t.onStateChange(mock2)
  t.start()
  t.start()
  expect(mock2).not.toBeCalled()

  t.stop()

  const mock3 = jest.fn()
  t.onStateChange(mock2)
  t.stop()
  t.stop()
  expect(mock3).not.toBeCalled()

  t.pause()

  const mock4 = jest.fn()
  t.onStateChange(mock4)
  t.pause()
  t.pause()
  expect(mock4).not.toBeCalled()
})

test(title(Timer, 'test set time'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  const mock = jest.fn()
  t.onTick(mock)
  ticker.tick()
  ticker.tick()
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(3)
  t.time = 0
  expect(mock).toBeCalledWith(0)
  expect(t.time).toBe(0)
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(3)
})

test(title(Timer, 'test duration'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker, 3)
  const mock = jest.fn()
  expect(t.progress).toBe(0.0)
  t.onTick(mock)
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(3)
  expect(mock).toBeCalledTimes(4)
  expect(t.isStopped()).toBeTruthy()
  t.time = 100
  expect(t.time).toBe(3)
  expect(t.progress).toBe(1.0)
})

test(title(Timer, 'onStateChange should not be called when reaching it\'s duration'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker, 3)
  const mock = jest.fn()

  expect(t.progress).toBe(0.0)
  t.onTick(mock)
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(t.time).toBe(3)
  expect(mock).toBeCalledTimes(4)
  expect(t.isStopped()).toBeTruthy()

  const stateChangedFn = jest.fn()
  t.onStateChange(stateChangedFn)
  t.start()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  ticker.tick()
  expect(stateChangedFn).not.toBeCalled()
  t.pause()
  expect(stateChangedFn).toBeCalledWith(ITimerState.PAUSED)
  t.start()
  expect(stateChangedFn).toBeCalledTimes(1)
})

test(title(Timer, 'onStateChange double start'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  const mock = jest.fn()

  t.onStateChange(mock)
  t.start()
  t.start()
  expect(mock).toBeCalledTimes(1)
})

test(title(Timer, 'delay'), () => {
  const ticker = new DummyTicker(1)
  const t = new Timer(ticker)
  const mock = jest.fn()

  t.onTick(mock)
  t.start()
  ticker.tick(); expect(mock).toBeCalledTimes(1); expect(mock).toBeCalledWith(1)
  t.delay(2)
  ticker.tick(); expect(mock).toBeCalledTimes(1); expect(mock).toBeCalledWith(1)
  ticker.tick(); expect(mock).toBeCalledTimes(1); expect(mock).toBeCalledWith(1)
  ticker.tick(); expect(mock).toBeCalledTimes(2); expect(mock).toBeCalledWith(2)
  ticker.tick(); expect(mock).toBeCalledTimes(3); expect(mock).toBeCalledWith(3)
})
