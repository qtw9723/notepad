import { describe, it, expect } from 'vitest'
import { normalizeTag, addTag, removeTag } from './tags'

describe('normalizeTag', () => {
  it('trims and lowercases', () => {
    expect(normalizeTag('  Work ')).toBe('work')
  })
  it('handles non-string / nullish', () => {
    expect(normalizeTag(undefined)).toBe('')
    expect(normalizeTag(null)).toBe('')
  })
})

describe('addTag', () => {
  it('appends a normalized tag', () => {
    expect(addTag(['a'], 'B')).toEqual(['a', 'b'])
  })
  it('ignores empty / whitespace-only input (same reference)', () => {
    const tags = ['a']
    expect(addTag(tags, '   ')).toBe(tags)
    expect(addTag(tags, '')).toBe(tags)
  })
  it('dedupes case-insensitively (same reference)', () => {
    const tags = ['work']
    expect(addTag(tags, 'WORK')).toBe(tags)
  })
  it('does not mutate the input array', () => {
    const tags = ['a']
    addTag(tags, 'b')
    expect(tags).toEqual(['a'])
  })
})

describe('removeTag', () => {
  it('removes the matching tag', () => {
    expect(removeTag(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })
  it('returns equal contents when tag is absent', () => {
    expect(removeTag(['a'], 'z')).toEqual(['a'])
  })
})
