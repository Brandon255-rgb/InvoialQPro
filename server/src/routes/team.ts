import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { db } from '../lib/db';
import { teamMembers, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendTeamInviteEmail } from '../services/email';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get team members
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, userId),
      with: {
        user: true,
      },
    });

    res.json(members.map(member => ({
      id: member.id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      status: member.status,
      avatar_url: member.user.avatarUrl,
      joined_at: member.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Invite team member
router.post('/invite', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { email, role } = req.body;
    const userId = req.user.id;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      // Check if user is already a team member
      const existingMember = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, existingUser.id),
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a team member' });
      }
    }

    // Generate invite token
    const inviteToken = uuidv4();

    // Create or update user
    const user = existingUser || await db.insert(users).values({
      email,
      status: 'pending',
    }).returning();

    // Create team member record
    await db.insert(teamMembers).values({
      userId: user[0].id,
      role,
      status: 'pending',
      inviteToken,
      invitedBy: userId,
    });

    // Send invitation email
    await sendTeamInviteEmail(email, inviteToken);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending team invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Accept team invitation
router.post('/accept-invite', async (req, res) => {
  try {
    const { token } = req.body;

    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.inviteToken, token),
      with: {
        user: true,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    if (member.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already accepted or expired' });
    }

    // Update team member status
    await db.update(teamMembers)
      .set({ status: 'active' })
      .where(eq(teamMembers.id, member.id));

    // Update user status
    await db.update(users)
      .set({ status: 'active' })
      .where(eq(users.id, member.userId));

    res.json({ message: 'Team invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Remove team member
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const memberId = req.params.id;
    const userId = req.user.id;

    // Verify member belongs to user's team
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Update member status to inactive
    await db.update(teamMembers)
      .set({ status: 'inactive' })
      .where(eq(teamMembers.id, memberId));

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Update team member role
router.put('/:id/role', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Verify member exists
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Update role
    await db.update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, id));

    res.json({ message: 'Team member role updated successfully' });
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({ error: 'Failed to update team member role' });
  }
});

export default router; 