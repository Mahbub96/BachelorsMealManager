const bazarService = require('../services/bazarService').default;
const authService = require('../services/authService').default;

async function testBazarDisplay() {
  console.log('🧪 Testing Bazar Display Issues...\n');

  try {
    // Test 1: Check authentication
    console.log('1️⃣ Testing authentication...');
    const authToken = await authService.getToken();
    console.log('Auth token exists:', !!authToken);

    // Test 2: Test API connectivity
    console.log('\n2️⃣ Testing API connectivity...');
    const connectivityTest = await bazarService.testBazarEndpoint();
    console.log('Connectivity test result:', connectivityTest);

    // Test 3: Test bazar entries fetch
    console.log('\n3️⃣ Testing bazar entries fetch...');
    const bazarResponse = await bazarService.getUserBazarEntries();
    console.log('Bazar entries response:', {
      success: bazarResponse.success,
      hasData: !!bazarResponse.data,
      dataLength: bazarResponse.data?.length || 0,
      error: bazarResponse.error,
      sampleData: bazarResponse.data?.[0] || null,
    });

    // Test 4: Test with specific filters
    console.log('\n4️⃣ Testing with filters...');
    const filteredResponse = await bazarService.getUserBazarEntries({
      limit: 10,
      page: 1,
    });
    console.log('Filtered response:', {
      success: filteredResponse.success,
      hasData: !!filteredResponse.data,
      dataLength: filteredResponse.data?.length || 0,
      error: filteredResponse.error,
    });

    console.log('\n✅ Bazar display tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBazarDisplay();
}

module.exports = { testBazarDisplay };
