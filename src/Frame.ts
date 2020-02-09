import { ICastEvent, ICastObject } from './Cast'
import { Slice } from './Utils'

export interface IFrame {
  readonly startTime: number
  readonly endTime: number
  prev: IFrame | null
  duration(): number
  data(endTime: number, startTime?: number): string
  snapshot(): string
}

export type FrameSnapshortFn = (s: string) => string

export const DEFAULT_FRAME_SNAPSHOT_FN = (s: string) => s

export class CastEventsFrame implements IFrame {
  private _prev: IFrame | null = null
  private _snapshortCache: string | null = null

  constructor(
    public readonly startTime: number,
    public readonly endTime: number,
    private _events: Slice<ICastEvent>,
    private _snapshotFn: FrameSnapshortFn = DEFAULT_FRAME_SNAPSHOT_FN
  ) {
    if (!_events.len()) { throw new Error('Invalid frame: empty events') }
    if ((startTime < 0) || ((endTime - startTime) <= 0)) { throw new Error('Invalid frame: inccorrect time or size') }
    if (_events.get(0).time >= endTime) { throw new Error('Invalid frame: invalid events') }
  }
  public set prev(f: IFrame | null) {
    if (f !== this._prev) {
      this._prev = f
      this._snapshortCache = null
    }
  }
  public get prev(): IFrame | null {
    return this._prev
  }
  public duration(): number {
    return this.endTime - this.startTime
  }
  data(endTime: number, startTime: number = -1): string {
    if ((endTime < this.startTime) || (endTime >= this.endTime)) {
      throw new Error(`Cannot get data of time(${endTime})`)
    }
    const tmp: string[] = []
    for (let i = 0; i < this._events.len(); i++) {
      const ev = this._events.get(i)
      if (ev.time > endTime) { break }
      if (startTime < ev.time && ev.time <= endTime) {
        tmp.push(ev.data)
      }
    }
    return tmp.join('')
  }
  snapshot(): string {
    if (this._snapshortCache !== null) {
      return this._snapshortCache
    }
    const tmp: string[] = new Array<string>(this._events.len())
    for (let i = 0; i < this._events.len(); i++) {
      tmp[i] = this._events.get(i).data
    }
    if (this.prev) {
      return this._snapshotFn(this.prev.snapshot() + tmp.join(''))
    }
    return tmp.join('')
  }
}

const DEFAULT_FRAME_EVENTS_STEP = 30

export class CastFrameQueue {
  private _frames: Array<IFrame> = []

  constructor(cast: ICastObject, frameEventsStep: number = DEFAULT_FRAME_EVENTS_STEP) {
    const events = cast.events
    this._frames = new Array<IFrame>(Math.ceil(events.length / frameEventsStep))

    let prev: IFrame | null = null
    for (let start = 0, n = 0; start < events.length; start += frameEventsStep) {
      const end = start + frameEventsStep
      const slice = new Slice<ICastEvent>(cast.events, start, end)
      const startTime = slice.get(0).time
      const endTime = end < events.length ? events[end].time : (startTime + 0.1)
      const f = new CastEventsFrame(startTime, endTime, slice)
      f.prev = prev
      prev = f
      this._frames[n++] = f
    }
  }
  public len(): number { return this._frames.length }
  public frame(time: number): IFrame {
    if (time < 0) { throw new Error('Time must be positive') }
    if (!this._frames.length) { throw new Error('Empty frames') }
    // bisearch
    const frames = this._frames
    let min = 0
    let max = frames.length - 1
    let mid = 0
    while (max >= min) {
      mid = (min + max) >> 1
      const f = frames[mid]
      if (time >= f.endTime) {
        min = mid + 1
      } else if (time < f.startTime) {
        max = mid - 1
      } else {
        return f
      }
    }
    return frames[frames.length - 1]
  }
}