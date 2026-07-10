import { describe, it, expect, beforeEach } from 'vitest'
import { registerUserWithInvite } from './auth-service'
import { createTeamInvite } from './invite-service'

describe('auth-service invite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('rejects signup when email does not match invite', async () => {
    const { token } = await createTeamInvite('comp-001', 'tech@test.com', 'technician')

    await expect(
      registerUserWithInvite('wrong@test.com', 'password123', 'Test User', token),
    ).rejects.toThrow(/email/i)
  })
})
