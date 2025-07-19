const bazarService = require('../services/bazarService').default;

async function testBazarAPI() {
  console.log('🧪 Testing Bazar API Integration...\n');

  try {
    // Test 1: Test endpoint connectivity
    console.log('1️⃣ Testing endpoint connectivity...');
    const connectivityTest = await bazarService.testBazarEndpoint();
    console.log('Connectivity test result:', connectivityTest);

    // Test 2: Test bazar submission with sample data
    console.log('\n2️⃣ Testing bazar submission...');
    const sampleSubmission = {
      items: [
        { name: 'Rice', quantity: '2kg', price: 120 },
        { name: 'Potato', quantity: '1kg', price: 40 },
      ],
      totalAmount: 160,
      description: 'Test bazar entry for API testing',
      date: new Date().toISOString().split('T')[0],
    };

    const submissionTest = await bazarService.submitBazar(sampleSubmission);
    console.log('Submission test result:', submissionTest);

    // Test 3: Test fetching user bazar entries
    console.log('\n3️⃣ Testing fetch user bazar entries...');
    const fetchTest = await bazarService.getUserBazarEntries();
    console.log('Fetch test result:', {
      success: fetchTest.success,
      count: fetchTest.data?.length || 0,
      error: fetchTest.error,
    });

    console.log('\n✅ Bazar API tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBazarAPI();
}

module.exports = { testBazarAPI };
