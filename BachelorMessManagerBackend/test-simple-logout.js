const fetch = require('node-fetch');

async function testSimpleLogout() {
  try {
    console.log('🧪 Testing simple logout...');

    // Test 1: Check if server is responding
    console.log('📝 Test 1: Server health check');
    const healthResponse = await fetch('http://192.168.0.130:3000/health', {
      method: 'GET',
      timeout: 5000,
    });

    console.log('Health status:', healthResponse.status);
    if (!healthResponse.ok) {
      console.log('❌ Server not responding');
      return;
    }
    console.log('✅ Server is responding');

    // Test 2: Check if auth route is accessible
    console.log('\n📝 Test 2: Auth route accessibility');
    const authResponse = await fetch(
      'http://192.168.0.130:3000/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mahbub@mess.com',
          password: 'Password123',
        }),
        timeout: 10000,
      }
    );

    console.log('Auth status:', authResponse.status);
    if (!authResponse.ok) {
      console.log('❌ Auth route not working');
      return;
    }

    const authData = await authResponse.json();
    console.log('✅ Auth route working, login successful');

    const token = authData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test 3: Test logout with timeout
    console.log('\n📝 Test 3: Logout test with timeout');
    const logoutResponse = await fetch(
      'http://192.168.0.130:3000/api/auth/logout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000, // 15 second timeout
      }
    );

    console.log('Logout status:', logoutResponse.status);
    console.log('Logout headers:', logoutResponse.headers);

    if (logoutResponse.ok) {
      const logoutData = await logoutResponse.json();
      console.log('✅ Logout successful:', logoutData.message);
    } else {
      console.log('❌ Logout failed');
      const errorText = await logoutResponse.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNRESET') {
      console.log('Connection reset - server might be hanging');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('Request timed out - server not responding');
    }
  }
}

testSimpleLogout();
