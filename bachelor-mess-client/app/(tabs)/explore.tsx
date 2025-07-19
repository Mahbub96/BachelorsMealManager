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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#ecfdf5';
      case 'pending':
        return '#fffbeb';
      case 'rejected':
        return '#fef2f2';
      default:
        return '#f3f4f6';
    }
  };

  const handleAddBazar = () => {
    setShowAddBazarModal(true);
  };

  const handleBazarSubmitted = () => {
    setShowAddBazarModal(false);
    // Refresh the bazar list here
  };

  const handleBazarPress = (bazar: any) => {
    // Navigate to bazar details or show more info
    Alert.alert('Bazar Details', `View details for bazar entry ${bazar.id}`);
  };

  const handleRefresh = () => {
    // Refresh the bazar list
    console.log('Refreshing bazar list...');
  };

  const handleApprove = (id: string) => {
    Alert.alert('Approve', `Approve bazar item ${id}`);
  };

  const handleReject = (id: string) => {
    Alert.alert('Reject', `Reject bazar item ${id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Bazar Management</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Track and manage mess bazar expenses
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name='cart' size={32} color='#fff' />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name='search'
              size={20}
              color='#9ca3af'
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder='Search bazar items...'
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor='#9ca3af'
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.statGradient}
            >
              <Ionicons name='checkmark-circle' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {bazarItems.filter(item => item.status === 'approved').length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Approved</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.statGradient}
            >
              <Ionicons name='time' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {bazarItems.filter(item => item.status === 'pending').length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.statGradient}
            >
              <Ionicons name='cash' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {bazarItems.reduce((sum, item) => sum + item.amount, 0)}৳
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </LinearGradient>
          </View>
        </View>

        {/* Add Bazar Button */}
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

          <BazarList
            filters={filters}
            showUserInfo={user?.role === 'admin'}
            onBazarPress={handleBazarPress}
            onRefresh={handleRefresh}
            isAdmin={user?.role === 'admin'}
          />
        </View>
      </View>

      {/* Add Bazar Modal */}
      <Modal
        visible={showAddBazarModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAddBazarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddBazarModal(false)}
            >
              <Ionicons name='close' size={24} color='#6b7280' />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Add New Bazar</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <BazarForm
            onSuccess={handleBazarSubmitted}
            onCancel={() => setShowAddBazarModal(false)}
            showCancel={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
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
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
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
});
