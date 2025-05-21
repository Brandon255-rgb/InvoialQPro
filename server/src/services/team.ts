import { db } from '../db';
import { teamMembers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendTeamInviteEmail } from './email';
import { randomBytes } from 'crypto';

export async function inviteTeamMember(userId: number, email: string, role: 'admin' | 'user') {
  // Generate invite token
  const inviteToken = randomBytes(32).toString('hex');
  
  // Store invite in database
  await db.insert(teamMembers).values({
    userId,
    email,
    role,
    status: 'pending',
    inviteToken,
    inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Send invite email
  await sendTeamInviteEmail(email, inviteToken);
}

export async function acceptTeamInvite(token: string) {
  const [invite] = await db.query.teamMembers.findMany({
    where: (teamMembers, { eq, and, gt }) => and(
      eq(teamMembers.inviteToken, token),
      eq(teamMembers.status, 'pending'),
      gt(teamMembers.inviteExpiresAt, new Date())
    )
  });

  if (!invite) {
    throw new Error('Invalid or expired invite token');
  }

  // Update member status
  await db.update(teamMembers)
    .set({ status: 'active' })
    .where(eq(teamMembers.id, invite.id));
}

export async function getTeamMembers(userId: number) {
  return db.query.teamMembers.findMany({
    where: (teamMembers, { eq }) => eq(teamMembers.userId, userId)
  });
}

export async function updateTeamMemberRole(memberId: number, role: 'admin' | 'user') {
  await db.update(teamMembers)
    .set({ role })
    .where(eq(teamMembers.id, memberId));
}

export async function removeTeamMember(memberId: number) {
  await db.delete(teamMembers)
    .where(eq(teamMembers.id, memberId));
} 