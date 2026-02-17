import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

/**
 * Shows a compact banner when the device is offline so users know they're viewing cached data.
 */
export function OfflineBanner() {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected ?? true));
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: (theme.status?.warning ?? theme.primary) + '18',
          borderColor: (theme.status?.warning ?? theme.primary) + '50',
        },
      ]}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={theme.status?.warning ?? theme.primary}
      />
      <Text
        style={[styles.text, { color: theme.text?.primary ?? theme.status?.warning }]}
        numberOfLines={1}
      >
        You{"'"}re offline — showing cached data. Changes will sync when back online.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
