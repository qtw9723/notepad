import { describe, it, expect } from 'vitest'
import { isPreviewOnlyNote } from './noteConfig'

describe('isPreviewOnlyNote', () => {
  it('returns true for a registered preview-only note id', () => {
    expect(isPreviewOnlyNote('5f0e0692-e27c-453b-883e-9f92570022d3')).toBe(true)
  })
  it('returns false for an unknown id', () => {
    expect(isPreviewOnlyNote('not-a-real-id')).toBe(false)
  })
})
