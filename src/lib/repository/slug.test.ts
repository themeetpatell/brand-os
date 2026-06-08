import { describe, expect, it } from 'vitest'
import { makeSlug } from './slug'

describe('makeSlug', () => {
  it('slugifies the handle and appends the id', () => {
    expect(makeSlug('Aanya.Styles', () => 'abc123')).toBe('aanya-styles-abc123')
  })

  it('strips unsafe characters', () => {
    expect(makeSlug('layla glow!! ✨', () => 'xyz789')).toBe('layla-glow-xyz789')
  })
})
