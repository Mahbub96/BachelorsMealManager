import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

export type AdminChangeStatus = 'pending' | 'completed' | 'cancelled';

export interface AdminChangeUserRef {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'super_admin';
}

export interface AdminChangeVote {
  voter: AdminChangeUserRef | string;
  votedAt: string;
}

export interface AdminChangeRequest {
  _id: string;
  groupAdminId: AdminChangeUserRef | string;
  candidateId: AdminChangeUserRef | string;
  createdBy: AdminChangeUserRef | string;
  status: AdminChangeStatus;
  votes: AdminChangeVote[];
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChangeCurrentResponse {
  request: AdminChangeRequest | null;
  requiredVotes: number;
  remainingVotes: number;
}

export interface AdminChangeVoteResponse {
  request: AdminChangeRequest;
  requiredVotes: number;
  remainingVotes: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'super_admin';
  status: 'active' | 'inactive';
}

export interface GroupMembersResponse {
  members: GroupMember[];
}

// Election flow: admin arranges → members apply → admin starts → members vote
export type ElectionStatus = 'accepting_candidates' | 'voting' | 'completed' | 'cancelled';

export interface ElectionCandidateRef {
  userId: { _id: string; name: string; email: string } | string;
  appliedAt: string;
}

export interface ElectionVoteRef {
  voterId: { _id: string; name?: string } | string;
  candidateId: { _id: string; name?: string } | string;
  votedAt: string;
}

export interface Election {
  _id: string;
  groupAdminId: { _id: string; name: string; email: string } | string;
  status: ElectionStatus;
  electionDate: string | null;
  arrangedBy: { _id: string; name: string; email: string } | string;
  arrangedAt: string;
  startedAt: string | null;
  candidates: ElectionCandidateRef[];
  votes: ElectionVoteRef[];
  completedAt?: string | null;
  newAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionCurrentResponse {
  election: Election | null;
  totalMembers: number;
  votedCount: number;
  remainingVotes: number;
}

const { GROUP_ADMIN } = API_ENDPOINTS;

export const groupAdminService = {
  getCurrent(): Promise<ApiResponse<AdminChangeCurrentResponse>> {
    return httpClient.get<AdminChangeCurrentResponse>(GROUP_ADMIN.CURRENT, {
      cache: true,
      cacheKey: 'group_admin_current',
    });
  },

  createChangeRequest(
    candidateId: string
  ): Promise<ApiResponse<AdminChangeRequest>> {
    return httpClient.post<AdminChangeRequest>(GROUP_ADMIN.CREATE, {
      candidateId,
    });
  },

  vote(id: string): Promise<ApiResponse<AdminChangeVoteResponse>> {
    return httpClient.post<AdminChangeVoteResponse>(GROUP_ADMIN.VOTE(id));
  },

  cancelCurrent(): Promise<ApiResponse<{ requestId: string }>> {
    return httpClient.post<{ requestId: string }>(GROUP_ADMIN.CANCEL);
  },

  getMembers(): Promise<ApiResponse<GroupMembersResponse>> {
    return httpClient.get<GroupMembersResponse>(GROUP_ADMIN.MEMBERS, {
      cache: true,
      cacheKey: 'group_admin_members',
    });
  },

  // Election flow. Pass forceRefresh=true after apply/vote/start/cancel to avoid stale cache.
  getCurrentElection(forceRefresh = false): Promise<ApiResponse<ElectionCurrentResponse>> {
    return httpClient.get<ElectionCurrentResponse>(GROUP_ADMIN.ELECTION_CURRENT, {
      cache: !forceRefresh,
      cacheKey: forceRefresh ? undefined : 'group_admin_election_current',
    });
  },

  createElection(electionDate?: string): Promise<ApiResponse<Election>> {
    return httpClient.post<Election>(GROUP_ADMIN.ELECTION_CREATE, {
      electionDate: electionDate || undefined,
    });
  },

  applyAsCandidate(): Promise<ApiResponse<Election>> {
    return httpClient.post<Election>(GROUP_ADMIN.ELECTION_APPLY);
  },

  startElection(): Promise<ApiResponse<Election>> {
    return httpClient.post<Election>(GROUP_ADMIN.ELECTION_START);
  },

  voteElection(candidateId: string): Promise<ApiResponse<{ election: Election; totalMembers: number; votedCount: number; remainingVotes: number }>> {
    return httpClient.post(GROUP_ADMIN.ELECTION_VOTE, { candidateId });
  },

  cancelElection(): Promise<ApiResponse<{ electionId: string }>> {
    return httpClient.post<{ electionId: string }>(GROUP_ADMIN.ELECTION_CANCEL);
  },
};

export default groupAdminService;

