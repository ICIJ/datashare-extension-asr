import { describe, it, expect } from 'vitest'
import { isEligibleForAsr } from '@/stores/asr'

describe('isEligibleForAsr', () => {
  it('returns true for a supported content type', () => {
    expect(isEligibleForAsr('audio/mpeg')).toBe(true)
  })

  it('returns false for an unsupported content type', () => {
    expect(isEligibleForAsr('application/pdf')).toBe(false)
  })
})
