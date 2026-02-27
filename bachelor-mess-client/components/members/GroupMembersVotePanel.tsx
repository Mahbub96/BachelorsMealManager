import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { InfoModal, type InfoModalVariant } from '@/components/ui/InfoModal';
import { ModernLoader } from '@/components/ui/ModernLoader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  groupAdminService,
  type Election,
  type ElectionCandidateRef,
} from '@/services/groupAdminService';

type AlertModalState = {
  title: string;
  message: string;
  variant: InfoModalVariant;
  buttonText?: string;
  secondaryButtonText?: string;
  onConfirm?: () => void;
};

function getCandidateId(c: ElectionCandidateRef): string {
  const u = c.userId;
  if (typeof u === 'string') return u;
  if (!u) return '';
  const o = u as { _id?: string; id?: string };
  return (o._id ?? o.id ?? '') as string;
}

function getCandidateName(c: ElectionCandidateRef): string {
  const u = c.userId;
  if (typeof u === 'string') return 'Member';
  if (!u) return 'Member';
  const o = u as { name?: string };
  return o.name ?? 'Member';
}

export const GroupMembersVotePanel: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [remainingVotes, setRemainingVotes] = useState(0);
  const loadInFlightRef = useRef(false);
  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!user || user.role !== 'member') return;
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await groupAdminService.getCurrentElection(forceRefresh);
      if (res.success && res.data) {
        setElection(res.data.election || null);
        setTotalMembers(res.data.totalMembers ?? 0);
        setVotedCount(res.data.votedCount ?? 0);
        setRemainingVotes(res.data.remainingVotes ?? 0);
      } else {
        setElection(null);
        setError(res.error || 'Failed to load election.');
      }
    } catch (err) {
      setElection(null);
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'member') {
      setError('Only group members can access admin election.');
      return;
    }
    void loadData();
  }, [user, loadData]);

  const currentUserId = (user as { id?: string; _id?: string })?.id ?? (user as { id?: string; _id?: string })?._id;
  const isCandidate = !!election?.candidates?.some(
    c => String(getCandidateId(c)) === String(currentUserId)
  );
  const hasVoted = !!election?.votes?.some(v => {
    if (!v.voterId) return false;
    const vid = typeof v.voterId === 'string' ? v.voterId : (v.voterId as { _id?: string; id?: string })._id ?? (v.voterId as { _id?: string; id?: string }).id;
    return String(vid) === String(currentUserId);
  });

  const handleApplyAsCandidate = () => {
    setAlertModal({
      title: 'Apply as candidate',
      message: 'Request to be a candidate for the next admin? The admin will start the election when ready.',
      variant: 'info',
      secondaryButtonText: 'Cancel',
      buttonText: 'Apply',
      onConfirm: () => {
        setAlertModal(null);
        setLoading(true);
        groupAdminService.applyAsCandidate().then(res => {
          setLoading(false);
          if (res.success) {
            loadData(true);
            setAlertModal({ title: 'Applied', message: 'You are now a candidate.', variant: 'success' });
          } else {
            setAlertModal({ title: 'Error', message: res.error || 'Failed to apply.', variant: 'error' });
          }
        }).catch(() => {
          setLoading(false);
          setAlertModal({ title: 'Error', message: 'Failed to apply.', variant: 'error' });
        });
      },
    });
  };

  const handleVote = (candidateId: string, candidateName: string) => {
    setAlertModal({
      title: 'Cast vote',
      message: `Vote for ${candidateName} as the next group admin?`,
      variant: 'info',
      secondaryButtonText: 'Cancel',
      buttonText: 'Vote',
      onConfirm: () => {
        setAlertModal(null);
        setLoading(true);
        groupAdminService.voteElection(candidateId).then(res => {
          setLoading(false);
          if (res.success && res.data) {
            setElection(res.data.election);
            setTotalMembers(res.data.totalMembers);
            setVotedCount(res.data.votedCount);
            setRemainingVotes(res.data.remainingVotes);
            setAlertModal({ title: 'Vote recorded', message: 'Your vote has been recorded.', variant: 'success' });
          } else {
            setAlertModal({ title: 'Error', message: res.error || 'Failed to record vote.', variant: 'error' });
          }
        }).catch(() => {
          setLoading(false);
          setAlertModal({ title: 'Error', message: 'Failed to record vote.', variant: 'error' });
        });
      },
    });
  };

  if (!user || user.role !== 'member') {
    return (
      <View style={styles.messageWrapper}>
        <ThemedText style={{ textAlign: 'center', fontSize: 14 }}>
          Only group members can participate in admin election.
        </ThemedText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderWrapper}>
        <ModernLoader visible={true} overlay={false} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.messageWrapper}>
        <ThemedText style={{ color: theme.status?.error ?? theme.primary, textAlign: 'center', fontSize: 14 }}>
          {error}
        </ThemedText>
      </View>
    );
  }

  const status = election?.status;
  const candidates = election?.candidates ?? [];

  return (
    <React.Fragment>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {!election && (
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}>
          <Ionicons name="calendar-outline" size={24} color={theme.text?.secondary} />
          <ThemedText style={[styles.infoTitle, { color: theme.text?.primary, marginTop: 8 }]}>
            No election arranged
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
            Ask your admin to arrange an election date. Then you can apply to be a candidate and vote when the election starts.
          </ThemedText>
        </View>
      )}

      {election && status === 'accepting_candidates' && (
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}>
          <ThemedText style={[styles.infoTitle, { color: theme.text?.primary }]}>
            Election – applying for candidates
          </ThemedText>
          {election.electionDate && (
            <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
              Election date: {new Date(election.electionDate).toLocaleDateString()}
            </ThemedText>
          )}
          <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
            Apply to be a candidate. The admin will start the election when ready.
          </ThemedText>
          {!isCandidate && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.button?.primary?.background ?? theme.primary, marginTop: 12 }]}
              onPress={handleApplyAsCandidate}
            >
              <ThemedText style={[styles.actionText, { color: theme.button?.primary?.text ?? '#fff' }]}>
                Apply to be candidate
              </ThemedText>
            </TouchableOpacity>
          )}
          {isCandidate && (
            <View style={styles.alreadyVotedRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.status?.success ?? theme.primary} />
              <ThemedText style={[styles.infoText, { color: theme.text?.secondary, marginLeft: 8 }]}>
                You have applied as a candidate.
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {election && status === 'accepting_candidates' && candidates.length > 0 && (
        <ThemedText style={[styles.sectionLabel, { color: theme.text?.secondary }]}>
          Candidates ({candidates.length})
        </ThemedText>
      )}
      {election && status === 'accepting_candidates' && candidates.map(c => (
        <View
          key={getCandidateId(c)}
          style={[styles.memberCard, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
        >
          <View style={styles.memberMain}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.avatarText, { color: theme.onPrimary?.text ?? '#fff' }]}>
                {getCandidateName(c).charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.memberName, { color: theme.text?.primary }]} numberOfLines={1}>
                {getCandidateName(c)}
                {String(getCandidateId(c)) === String(currentUserId) ? ' (you)' : ''}
              </ThemedText>
            </View>
          </View>
        </View>
      ))}

      {election && status === 'voting' && (
        <>
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}>
            <ThemedText style={[styles.infoTitle, { color: theme.text?.primary }]}>
              Election – vote for next admin
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
              Progress: {votedCount}/{totalMembers} votes
            </ThemedText>
            {hasVoted && (
              <View style={[styles.alreadyVotedRow, { marginTop: 8 }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.status?.success ?? theme.primary} />
                <ThemedText style={[styles.infoText, { color: theme.text?.secondary, marginLeft: 8 }]}>
                  You have already voted. You cannot change your vote.
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText style={[styles.sectionLabel, { color: theme.text?.secondary }]}>
            Select a candidate to vote
          </ThemedText>
          {candidates.length === 0 ? (
            <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
              No candidates. Election may have been started with no applications.
            </ThemedText>
          ) : (
            candidates.map(c => {
              const cId = getCandidateId(c);
              const cName = getCandidateName(c);
              const canVote = !hasVoted;
              return (
                <View
                  key={cId}
                  style={[styles.memberCard, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
                >
                  <View style={styles.memberMain}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                      <ThemedText style={[styles.avatarText, { color: theme.onPrimary?.text ?? '#fff' }]}>
                        {cName.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.memberName, { color: theme.text?.primary }]} numberOfLines={1}>
                        {cName}
                        {String(cId) === String(currentUserId) ? ' (you)' : ''}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.memberActions}>
                    {canVote && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.button?.primary?.background ?? theme.primary }]}
                        onPress={() => handleVote(cId, cName)}
                      >
                        <ThemedText style={[styles.actionText, { color: theme.button?.primary?.text ?? '#fff' }]}>
                          Vote for {cName}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    {hasVoted && (
                      <ThemedText style={[styles.infoText, { color: theme.text?.secondary }]}>
                        You already voted
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
    {alertModal && (
      <InfoModal
        visible
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        buttonText={alertModal.buttonText ?? 'OK'}
        secondaryButtonText={alertModal.secondaryButtonText}
        onConfirm={alertModal.onConfirm}
        onClose={() => setAlertModal(null)}
      />
    )}
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  loaderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageWrapper: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoText: { fontSize: 13 },
  alreadyVotedRow: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  memberMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberActions: { marginLeft: 12, alignItems: 'flex-end' },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
