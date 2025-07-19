import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ActivityItem } from './ActivityItem';

export const RecentActivityList: React.FC = () => {
  const activities = [
    {
      id: '1',
      title: 'Lunch recorded',
      time: '2 hours ago',
      icon: 'fast-food' as const,
      color: '#10b981',
    },
    {
      id: '2',
      title: 'Bazar uploaded',
      time: '1 day ago',
      icon: 'cart' as const,
      color: '#f59e0b',
    },
    {
      id: '3',
      title: 'Payment made',
      time: '3 days ago',
      icon: 'card' as const,
      color: '#667eea',
    },
  ];

  return (
    <View style={styles.activityContainer}>
      <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
      <View style={styles.activityList}>
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            id={activity.id}
            title={activity.title}
            time={activity.time}
            icon={activity.icon}
            color={activity.color}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
});
