import { describe, it, expect, beforeEach } from 'vitest'
import { registerUserWithInvite, acceptInviteForCurrentUser } from './auth-service'
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

  it('acceptInviteForCurrentUser adds membership for existing user in demo', async () => {
    const { token } = await createTeamInvite('comp-002', 'owner@profixhandyman.com', 'dispatcher')

    const result = await acceptInviteForCurrentUser('user-001', 'owner@profixhandyman.com', token)
    expect(result.company.id).toBe('comp-002')
    expect(result.role).toBe('dispatcher')
  })
})
