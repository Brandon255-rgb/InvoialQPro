import React, { useState, useEffect } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface TeamMember {
  id: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'rejected';
}

export const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully"
      });

      setInviteEmail('');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch(`/api/team/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast({
        title: "Success",
        description: "Role updated successfully"
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      toast({
        title: "Success",
        description: "Team member removed successfully"
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <Label htmlFor="invite-email">Invite Team Member</Label>
          <div className="flex gap-4">
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
            <Select
              value={inviteRole}
              onValueChange={(value: 'admin' | 'user') => setInviteRole(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-4">Team Members</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value: 'admin' | 'user') => handleRoleChange(member.id, value)}
                    disabled={member.status !== 'active'}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                    member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={member.status !== 'active'}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 