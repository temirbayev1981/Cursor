import { describe, it, expect, beforeEach } from 'vitest'
import {
  createTeamInvite,
  getTeamInvitePreview,
  acceptTeamInvite,
  listTeamInvites,
} from './invite-service'

describe('invite-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates and previews a valid invite', async () => {
    const { token, invite } = await createTeamInvite('comp-001', 'tech@test.com', 'technician')
    expect(invite.email).toBe('tech@test.com')
    expect(invite.role).toBe('technician')

    const preview = await getTeamInvitePreview(token)
    expect(preview?.email).toBe('tech@test.com')
    expect(preview?.role).toBe('technician')
  })

  it('returns null for expired invite', async () => {
    const expired = {
      id: 'inv-expired',
      company_id: 'comp-001',
      email: 'old@test.com',
      role: 'technician' as const,
      token: 'expired-token',
      expires_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
    }
    localStorage.setItem('handymanos_team_invites', JSON.stringify([expired]))

    const preview = await getTeamInvitePreview('expired-token')
    expect(preview).toBeNull()
  })

  it('accepts invite and removes it from pending list', async () => {
    const { token } = await createTeamInvite('comp-001', 'join@test.com', 'dispatcher')
    const accepted = await acceptTeamInvite(token)
    expect(accepted?.accepted_at).toBeTruthy()

    const pending = await listTeamInvites('comp-001')
    expect(pending.some((item) => item.token === token)).toBe(false)
  })
})
