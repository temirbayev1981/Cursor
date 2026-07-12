import { describe, it, expect } from 'vitest'
import { JobCreateCustomerError, isJobCreateCustomerError, toJobCreateCustomerError } from './job-create-errors'

describe('job-create-errors', () => {
  it('detects JobCreateCustomerError instance', () => {
    const err = new JobCreateCustomerError('violates foreign key constraint on customer_id')
    expect(isJobCreateCustomerError(err)).toBe(true)
  })

  it('maps FK message to JobCreateCustomerError', () => {
    const mapped = toJobCreateCustomerError(new Error('violates foreign key constraint'))
    expect(mapped).toBeInstanceOf(JobCreateCustomerError)
  })

  it('returns null for unrelated errors', () => {
    expect(toJobCreateCustomerError(new Error('network timeout'))).toBeNull()
  })
})
