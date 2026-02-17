import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActionButton } from './DetailCard';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface DetailPageTemplateProps {
  title: string;
  gradientColors: [string, string];
  children: React.ReactNode;
  showShareButton?: boolean;
  onShare?: () => void;
  actionButtons?: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }[];
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  title,
  gradientColors,
  children,
  showShareButton = true,
  onShare,
  actionButtons = [],
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const onPrimary = theme.onPrimary?.text ?? theme.text?.inverse;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradientColors} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name='arrow-back' size={24} color={onPrimary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: onPrimary }]}>{title}</ThemedText>
          {showShareButton && (
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Ionicons name='share-outline' size={24} color={onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {children}

        {/* Action Buttons */}
        {actionButtons.length > 0 && (
          <View style={styles.actionButtons}>
            {actionButtons.map((button, index) => (
              <ActionButton
                key={index}
                icon={button.icon}
                label={button.label}
                onPress={button.onPress}
                color={button.color}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 32,
  },
});
