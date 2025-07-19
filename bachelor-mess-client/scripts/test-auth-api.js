const authService = require('../services/authService').default;
const httpClient = require('../services/httpClient').default;
const { config } = require('../services/config');

async function testAuthAndAPI() {
  console.log('🧪 Testing Authentication and API...\n');

  try {
    // Test 1: Check authentication
    console.log('1️⃣ Testing authentication...');
    const isAuthenticated = await authService.isAuthenticated();
    const token = await authService.getToken();
    const user = await authService.getStoredUser();

    console.log('Auth results:', {
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id,
    });

    // Test 2: Test basic API connectivity
    console.log('\n2️⃣ Testing basic API connectivity...');
    try {
      const healthResponse = await httpClient.get('/health', {
        skipAuth: true,
      });
      console.log('Health check result:', healthResponse);
    } catch (error) {
      console.log('Health check failed:', error.message);
    }

    // Test 3: Test authenticated API call
    console.log('\n3️⃣ Testing authenticated API call...');
    if (isAuthenticated && token) {
      try {
        const userResponse = await httpClient.get('/users/profile');
        console.log('User profile result:', {
          success: userResponse.success,
          hasData: !!userResponse.data,
          error: userResponse.error,
        });
      } catch (error) {
        console.log('User profile failed:', error.message);
      }
    } else {
      console.log('❌ Not authenticated, skipping authenticated API test');
    }

    // Test 4: Test bazar endpoint specifically
    console.log('\n4️⃣ Testing bazar endpoint...');
    if (isAuthenticated && token) {
      try {
        const bazarResponse = await httpClient.get('/bazar/user');
        console.log('Bazar endpoint result:', {
          success: bazarResponse.success,
          hasData: !!bazarResponse.data,
          dataType: typeof bazarResponse.data,
          error: bazarResponse.error,
        });
      } catch (error) {
        console.log('Bazar endpoint failed:', error.message);
      }
    } else {
      console.log('❌ Not authenticated, skipping bazar API test');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthAndAPI();
