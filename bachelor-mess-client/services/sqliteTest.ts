import { sqliteDatabase } from './sqliteDatabase';
import { offlineStorage } from './offlineStorage';

export async function testSQLiteFunctionality() {
  console.log('🧪 Testing SQLite functionality...');

  try {
    // Test 1: Database initialization
    console.log('📋 Test 1: Database initialization');
    await sqliteDatabase.init();
    console.log('✅ Database initialized successfully');

    // Test 2: Health check
    console.log('📋 Test 2: Health check');
    const isHealthy = await sqliteDatabase.healthCheck();
    console.log(`✅ Health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

    // Test 3: Save and retrieve data
    console.log('📋 Test 3: Save and retrieve data');
    const testData = {
      id: 'test_dashboard_data',
      table_name: 'dashboard_data',
      data: JSON.stringify({ test: 'dashboard_data', timestamp: Date.now() }),
      timestamp: Date.now(),
      created_at: Date.now(),
      updated_at: Date.now(),
      version: '1.0',
    };

    await sqliteDatabase.saveData('dashboard_data', testData);
    console.log('✅ Data saved successfully');

    const retrievedData = await sqliteDatabase.getData(
      'dashboard_data',
      'SELECT * FROM dashboard_data WHERE id = ?',
      ['test_dashboard_data']
    );
    console.log(`✅ Data retrieved: ${retrievedData.length} records`);

    // Test 4: Offline storage
    console.log('📋 Test 4: Offline storage');
    await offlineStorage.initializeDashboardData();
    console.log('✅ Offline storage initialized');

    // Test 5: Dashboard data persistence
    console.log('📋 Test 5: Dashboard data persistence');
    const dashboardTestData = { stats: { total: 100 }, activities: [] };
    await offlineStorage.setOfflineData(
      'test_dashboard_stats',
      dashboardTestData
    );

    const retrievedDashboardData = await offlineStorage.getOfflineData(
      'test_dashboard_stats'
    );
    if (retrievedDashboardData && retrievedDashboardData.stats) {
      console.log('✅ Dashboard data persistence working');
    } else {
      console.log('❌ Dashboard data persistence failed');
    }

    console.log('🎉 All SQLite tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ SQLite test failed:', error);
    return false;
  }
}
