import { supabaseAdmin } from '../lib/supabase';

// Define types based on our database schema
type TeamMember = {
  id: string;
  owner_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
};

type TeamInvitation = {
  id: string;
  owner_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
};

// Get team members
export async function getTeamMembers(userId: string) {
  const { data: members, error } = await supabaseAdmin
    .from('team_members')
    .select(`
      *,
      user:users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('owner_id', userId);

  if (error) throw error;
  return members;
}

// Add team member
export async function addTeamMember(
  ownerId: string,
  email: string,
  role: 'admin' | 'member'
) {
  // First check if user exists
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError) throw userError;
  if (!user) throw new Error('User not found');

  // Check if already a team member
  const { data: existingMember, error: memberError } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('user_id', user.id)
    .single();

  if (memberError && memberError.code !== 'PGRST116') throw memberError;
  if (existingMember) throw new Error('User is already a team member');

  // Add team member
  const { data: member, error: insertError } = await supabaseAdmin
    .from('team_members')
    .insert({
      owner_id: ownerId,
      user_id: user.id,
      role
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return member;
}

// Remove team member
export async function removeTeamMember(ownerId: string, memberId: string) {
  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('owner_id', ownerId)
    .eq('user_id', memberId);

  if (error) throw error;
  return true;
}

// Update team member role
export async function updateTeamMemberRole(
  ownerId: string,
  memberId: string,
  role: 'admin' | 'member'
) {
  const { data: member, error } = await supabaseAdmin
    .from('team_members')
    .update({ role })
    .eq('owner_id', ownerId)
    .eq('user_id', memberId)
    .select()
    .single();

  if (error) throw error;
  return member;
}

// Create team invitation
export async function createTeamInvitation(
  ownerId: string,
  email: string,
  role: 'admin' | 'member'
) {
  // Check if user already exists
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError && userError.code !== 'PGRST116') throw userError;
  if (user) {
    // Check if already a team member
    const { data: existingMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('user_id', user.id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') throw memberError;
    if (existingMember) throw new Error('User is already a team member');
  }

  // Create invitation
  const { data: invitation, error: insertError } = await supabaseAdmin
    .from('team_invitations')
    .insert({
      owner_id: ownerId,
      email,
      role,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return invitation;
}

// Get team invitations
export async function getTeamInvitations(ownerId: string) {
  const { data: invitations, error } = await supabaseAdmin
    .from('team_invitations')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'pending');

  if (error) throw error;
  return invitations;
}

// Cancel team invitation
export async function cancelTeamInvitation(invitationId: string) {
  const { error } = await supabaseAdmin
    .from('team_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId);

  if (error) throw error;
  return true;
}

// Accept team invitation
export async function acceptTeamInvitation(invitationId: string, userId: string) {
  // Get invitation
  const { data: invitation, error: inviteError } = await supabaseAdmin
    .from('team_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single();

  if (inviteError) throw inviteError;
  if (!invitation) throw new Error('Invitation not found or already processed');

  // Add team member
  const { data: member, error: memberError } = await supabaseAdmin
    .from('team_members')
    .insert({
      owner_id: invitation.owner_id,
      user_id: userId,
      role: invitation.role
    })
    .select()
    .single();

  if (memberError) throw memberError;

  // Update invitation status
  const { error: updateError } = await supabaseAdmin
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId);

  if (updateError) throw updateError;
  return member;
}

// Reject team invitation
export async function rejectTeamInvitation(invitationId: string) {
  const { error } = await supabaseAdmin
    .from('team_invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId);

  if (error) throw error;
  return true;
} 