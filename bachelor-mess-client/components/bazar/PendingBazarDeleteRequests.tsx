import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import bazarService, { BazarDeleteRequestItem } from '../../services/bazarService';
import { formatDate } from '../../utils/dateUtils';

interface PendingBazarDeleteRequestsProps {
  onResponded?: () => void;
  onError?: (message: string) => void;
}

function safeFormatDate(date: string | Date | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isNaN(d.getTime()) ? '' : formatDate(date as string);
  } catch {
    return '';
  }
}

export const PendingBazarDeleteRequests: React.FC<PendingBazarDeleteRequestsProps> = ({
  onResponded,
  onError,
}) => {
  const { theme } = useTheme();
  const [requests, setRequests] = useState<BazarDeleteRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const respondingRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  const fetchRequests = useCallback(async (showLoading = true) => {
    setFetchError(null);
    if (showLoading) setLoading(true);
    try {
      const res = await bazarService.getMyBazarDeleteRequests();
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.data)) {
        const list = [...res.data];
        setRequests(list.filter((r): r is BazarDeleteRequestItem => !!r && r.status === 'pending'));
      } else {
        setRequests([]);
        if (!res.success && res.error) setFetchError(res.error);
      }
    } catch {
      if (mountedRef.current) {
        setRequests([]);
        setFetchError('Failed to load delete requests');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      const showLoading = isFirstFocusRef.current;
      if (isFirstFocusRef.current) isFirstFocusRef.current = false;
      fetchRequests(showLoading);
      return () => {
        mountedRef.current = false;
      };
    }, [fetchRequests])
  );

  const handleRetry = useCallback(() => fetchRequests(true), [fetchRequests]);

  const handleRespond = useCallback(
    async (requestId: string, action: 'accept' | 'reject') => {
      const id = requestId && String(requestId).trim();
      if (!id || respondingRef.current) return;
      respondingRef.current = true;
      setRespondingId(id);
      try {
        const res = await bazarService.respondToBazarDeleteRequest(id, action);
        if (!mountedRef.current) return;
        if (res.success) {
          setRequests(prev => prev.filter(r => String(r._id) !== id));
          try {
            onResponded?.();
          } catch {
            // Ignore if parent unmounted or refresh failed
          }
        } else {
          onError?.(res.message || res.error || 'Request failed');
        }
      } catch {
        if (mountedRef.current) onError?.('Failed to respond. Please try again.');
      } finally {
        if (mountedRef.current) setRespondingId(null);
        respondingRef.current = false;
      }
    },
    [onResponded, onError]
  );

  if (loading && requests.length === 0 && !fetchError) return null;
  if (fetchError && requests.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.errorContainer,
          { borderColor: theme.border?.secondary ?? theme.cardBorder ?? 'transparent' },
        ]}
      >
        <ThemedText style={[styles.errorText, { color: theme.text?.secondary }]}>{fetchError}</ThemedText>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: (theme.primary ?? theme.secondary) + '20' }]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={18} color={theme.primary ?? theme.secondary} />
          <ThemedText style={[styles.retryText, { color: theme.primary ?? theme.secondary }]}>
            Retry
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  if (requests.length === 0) return null;

  const cardBg = theme.cardBackground ?? theme.surface;
  const borderColor = theme.border?.secondary ?? theme.cardBorder ?? 'transparent';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: (theme.status?.warning ?? theme.primary) + '12', borderColor },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color={theme.status?.warning ?? theme.primary} />
        <ThemedText style={[styles.title, { color: theme.text?.primary }]}>
          Pending delete requests ({requests.length})
        </ThemedText>
      </View>
      <ThemedText style={[styles.subtitle, { color: theme.text?.secondary }]}>
        Admin requested to delete the following bazar entry(ies). Confirm or reject.
      </ThemedText>
      {requests.map(req => {
        const id = req._id != null ? String(req._id) : '';
        if (!id) return null;
        const requestedByName =
          typeof req.requestedBy === 'object' && req.requestedBy && (req.requestedBy.name || req.requestedBy.email)
            ? req.requestedBy.name || req.requestedBy.email
            : 'Admin';
        const dateStr = safeFormatDate(req.bazarDate);
        const isResponding = respondingId === id;

        return (
          <View key={id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardBody}>
              <ThemedText style={[styles.bazarDate, { color: theme.text?.primary }]}>
                Bazar for {dateStr || '—'}
              </ThemedText>
              <ThemedText
                style={[styles.bazarSummary, { color: theme.text?.secondary }]}
                numberOfLines={1}
              >
                {req.bazarSummary || `৳${(req.totalAmount ?? 0).toLocaleString()}`}
              </ThemedText>
              <ThemedText style={[styles.requestedBy, { color: theme.text?.secondary }]}>
                Requested by {requestedByName}
              </ThemedText>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn, { backgroundColor: (theme.status?.error ?? '#ef4444') + '18' }]}
                onPress={() => handleRespond(id, 'reject')}
                disabled={!!respondingId}
              >
                {isResponding ? (
                  <ActivityIndicator size="small" color={theme.status?.error ?? '#ef4444'} />
                ) : (
                  <>
                    <Ionicons name="close" size={18} color={theme.status?.error ?? '#ef4444'} />
                    <ThemedText style={[styles.btnText, { color: theme.status?.error ?? '#ef4444' }]}>
                      Reject
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.acceptBtn, { backgroundColor: (theme.status?.success ?? '#10b981') + '18' }]}
                onPress={() => handleRespond(id, 'accept')}
                disabled={!!respondingId}
              >
                {isResponding ? (
                  <ActivityIndicator size="small" color={theme.status?.success ?? '#10b981'} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={theme.status?.success ?? '#10b981'} />
                    <ThemedText style={[styles.btnText, { color: theme.status?.success ?? '#10b981' }]}>
                      Accept & delete
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardBody: {
    marginBottom: 10,
  },
  bazarDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  bazarSummary: {
    fontSize: 13,
    marginTop: 2,
  },
  requestedBy: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rejectBtn: {},
  acceptBtn: {},
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
