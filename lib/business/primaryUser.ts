export interface PrimaryUserInfo {
  name: string;
  email: string;
  phone: string;
  invitationPending: boolean;
}

export interface BusinessMemberRow {
  role: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface BusinessInvitationRow {
  role: string;
  name: string;
  email: string;
  phone?: string | null;
  used?: boolean;
  expiresAt?: string;
  createdAt?: string;
}

function isInvitationPending(invitation: BusinessInvitationRow): boolean {
  if (invitation.used) return false;
  if (invitation.expiresAt && new Date(invitation.expiresAt) <= new Date()) return false;
  return true;
}

export function resolvePrimaryUser(
  members: BusinessMemberRow[],
  invitations: BusinessInvitationRow[]
): PrimaryUserInfo | null {
  const adminMembers = members.filter((m) => m.role === "business_admin");
  const adminInvitations = [...invitations]
    .filter((i) => i.role === "business_admin")
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );

  const firstMember = adminMembers[0];
  const firstInvitation = adminInvitations[0];

  if (firstMember) {
    const matchingInvitation = invitations.find(
      (i) => i.email?.toLowerCase() === firstMember.email?.toLowerCase()
    );
    return {
      name: firstMember.name ?? matchingInvitation?.name ?? firstInvitation?.name ?? "",
      email: firstMember.email ?? matchingInvitation?.email ?? "",
      phone: firstMember.phone ?? matchingInvitation?.phone ?? firstInvitation?.phone ?? "",
      invitationPending: false,
    };
  }

  if (firstInvitation) {
    return {
      name: firstInvitation.name,
      email: firstInvitation.email,
      phone: firstInvitation.phone ?? "",
      invitationPending: isInvitationPending(firstInvitation),
    };
  }

  return null;
}
