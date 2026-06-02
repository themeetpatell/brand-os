import { describe, expect, it } from 'vitest'
import { classifyTier } from './tier'

describe('classifyTier', () => {
  it('classifies boundaries correctly', () => {
    expect(classifyTier(9999)).toBe('nano')
    expect(classifyTier(10000)).toBe('micro')
    expect(classifyTier(99999)).toBe('micro')
    expect(classifyTier(100000)).toBe('mid')
    expect(classifyTier(499999)).toBe('mid')
    expect(classifyTier(500000)).toBe('macro')
  })
})
