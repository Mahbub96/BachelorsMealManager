import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BazarForm } from '@/components/BazarForm';
import { BazarList } from '@/components/BazarList';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

interface BazarItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
}

export default function BazarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBazarModal, setShowAddBazarModal] = useState(false);
  const [filters, setFilters] = useState({});

  // Add error boundary for unauthenticated users
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Please log in to view bazar items
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  console.log('🔄 Explore Screen - User info:', {
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated: !!user,
  });

  // Mock data - replace with real API data
  const bazarItems: BazarItem[] = [
    {
      id: '1',
      name: 'Rice, Vegetables, Meat',
      amount: 1200,
      date: '2024-01-15',
      status: 'approved',
      submittedBy: 'Member One',
    },
    {
      id: '2',
      name: 'Fish, Spices, Oil',
      amount: 800,
      date: '2024-01-14',
      status: 'pending',
      submittedBy: 'Member Two',
    },
    {
      id: '3',
      name: 'Chicken, Vegetables',
      amount: 950,
      date: '2024-01-13',
      status: 'approved',
      submittedBy: 'Member Two',
    },
    {
      id: '4',
      name: 'Eggs, Milk, Bread',
      amount: 450,
      date: '2024-01-12',
      status: 'rejected',
      submittedBy: 'Member Three',
    },
  ];

  const filteredItems = bazarItems.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleAddBazar = () => {
    setShowAddBazarModal(true);
  };

  const handleBazarPress = (bazar: any) => {
    console.log('🎯 Bazar pressed:', bazar);
    // Navigate to bazar details or show modal
    Alert.alert('Bazar Details', `Viewing details for ${bazar.id}`);
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing bazar list...');
    // The BazarList component will handle its own refresh
  };

  const handleCloseModal = () => {
    setShowAddBazarModal(false);
  };

  const handleBazarSubmit = async () => {
    try {
      console.log('📝 Bazar submitted successfully');
      Alert.alert('Success', 'Bazar entry submitted successfully!');
      setShowAddBazarModal(false);
    } catch (error) {
      console.error('❌ Bazar submission error:', error);
      Alert.alert('Error', 'Failed to submit bazar entry');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>Bazar Management</ThemedText>
            <ThemedText style={styles.subtitle}>
              Track shopping expenses and manage bazar entries
            </ThemedText>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {filteredItems.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Items</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                ৳
                {filteredItems
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Amount</ThemedText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name='search' size={20} color='#6b7280' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search bazar items...'
              placeholderTextColor='#9ca3af'
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name='close-circle' size={20} color='#6b7280' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity style={styles.filterChip}>
              <ThemedText style={styles.filterChipText}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <ThemedText style={styles.filterChipText}>Pending</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <ThemedText style={styles.filterChipText}>Approved</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <ThemedText style={styles.filterChipText}>Rejected</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Add Button */}
        <Pressable style={styles.addButton} onPress={handleAddBazar}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.addButtonGradient}
          >
            <Ionicons name='add' size={24} color='#fff' />
            <ThemedText style={styles.addButtonText}>Add New Bazar</ThemedText>
          </LinearGradient>
        </Pressable>

        {/* Bazar Items List */}
        <View style={styles.listContainer}>
          <ThemedText style={styles.sectionTitle}>
            Recent Bazar Items
          </ThemedText>

          {(() => {
            try {
              return (
                <BazarList
                  filters={filters}
                  showUserInfo={
                    user?.role === 'admin' || user?.role === 'super_admin'
                  }
                  onBazarPress={handleBazarPress}
                  onRefresh={handleRefresh}
                  isAdmin={
                    user?.role === 'admin' || user?.role === 'super_admin'
                  }
                />
              );
            } catch (error) {
              console.error('💥 BazarList render error:', error);
              return (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    Failed to load bazar items. Please try again.
                  </ThemedText>
                </View>
              );
            }
          })()}
        </View>
      </ScrollView>

      {/* Add Bazar Modal */}
      <Modal
        visible={showAddBazarModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={handleCloseModal}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add New Bazar</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Ionicons name='close' size={24} color='#6b7280' />
            </TouchableOpacity>
          </View>
          <BazarForm
            onSuccess={handleBazarSubmit}
            onCancel={handleCloseModal}
          />
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingRight: 10,
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterScroll: {
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  addButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
