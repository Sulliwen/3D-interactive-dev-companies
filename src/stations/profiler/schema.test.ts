import { describe, expect, it } from 'vitest'
import { captureFrames, profilerPropsSchema } from './schema'

describe('captures du profileur', () => {
  const capture = profilerPropsSchema.shape.before.parse({
    label: 'Avant',
    average: 13,
    jitter: 1.5,
    spikes: [{ at: 10, ms: 24 }],
  })

  it('produit toujours les mêmes images, pic compris', () => {
    const frames = captureFrames(capture)
    expect(frames).toHaveLength(120)
    expect(frames).toEqual(captureFrames(capture))
    expect(frames[10]).toBe(24)
    for (const [i, f] of frames.entries())
      if (i !== 10) expect(Math.abs(f - 13)).toBeLessThanOrEqual(1.5)
  })
  it('un pic peut durer plusieurs images', () => {
    const frames = captureFrames({ ...capture, spikes: [{ at: 50, to: 59, ms: 24 }] })
    expect(frames.filter((f) => f > 20)).toHaveLength(10)
  })
})
