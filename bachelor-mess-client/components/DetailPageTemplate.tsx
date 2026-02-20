import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActionButton } from './DetailCard';
import { ScreenLayout } from './layout';
import { useTheme } from '@/context/ThemeContext';

interface DetailPageTemplateProps {
  title: string;
  /** Kept for API compatibility; no longer used for header */
  gradientColors?: [string, string];
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
  children,
  showShareButton = true,
  onShare,
  actionButtons = [],
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const rightElement =
    showShareButton && onShare ? (
      <TouchableOpacity onPress={onShare} style={{ padding: 8 }}>
        <Ionicons name="share-outline" size={24} color={theme.text?.primary ?? '#11181C'} />
      </TouchableOpacity>
    ) : undefined;

  return (
    <ScreenLayout
      title={title}
      showBack
      onBackPress={() => router.back()}
      rightElement={rightElement}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {children}

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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
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
