import { View, StyleSheet } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { MealManagement } from '../../components/meals/MealManagement';
import { useAuth } from '../../context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MealsScreen() {
  const { user } = useAuth();

  // Theme colors
  const textColor = useThemeColor({}, 'text');

  const handleNavigate = (screen: string) => {
    // Handle navigation to different screens
    console.log('Navigate to:', screen);
    // You can implement navigation logic here
  };

  // Add error boundary for unauthenticated users
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            Please log in to view meal management
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {(() => {
        try {
          return <MealManagement onNavigate={handleNavigate} />;
        } catch (error) {
          console.error('💥 MealManagement render error:', error);
          return (
            <View style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: textColor }]}>
                Failed to load meal management. Please try again.
              </ThemedText>
            </View>
          );
        }
      })()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
