const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testRoutes() {
  console.log('🧪 Testing Content Approval Routes\n');

  // Test 1: Test endpoint (no auth)
  try {
    console.log('1. Testing /api/content-approval/test...');
    const response = await axios.get(`${BASE_URL}/api/content-approval/test`);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }

  // Test 2: Health check
  try {
    console.log('\n2. Testing /api/health...');
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }

  // Test 3: Approve endpoint (will fail without auth, but should return 401 not 404)
  try {
    console.log('\n3. Testing /api/content-approval/approve (without auth)...');
    const response = await axios.post(`${BASE_URL}/api/content-approval/approve`, {});
    console.log('✅ Success:', response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.log('✅ Route exists (got auth error as expected):', status, error.response?.data?.message);
    } else if (status === 404) {
      console.log('❌ Route NOT FOUND (404) - This is the problem!');
    } else {
      console.log('❌ Failed:', status, error.response?.data || error.message);
    }
  }

  // Test 4: Reject endpoint (will fail without auth, but should return 401 not 404)
  try {
    console.log('\n4. Testing /api/content-approval/reject (without auth)...');
    const response = await axios.post(`${BASE_URL}/api/content-approval/reject`, {});
    console.log('✅ Success:', response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.log('✅ Route exists (got auth error as expected):', status, error.response?.data?.message);
    } else if (status === 404) {
      console.log('❌ Route NOT FOUND (404) - This is the problem!');
    } else {
      console.log('❌ Failed:', status, error.response?.data || error.message);
    }
  }

  // Test 5: Admin content-status endpoint
  try {
    console.log('\n5. Testing /api/admin/content-status (without auth)...');
    const response = await axios.get(`${BASE_URL}/api/admin/content-status`);
    console.log('✅ Success:', response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.log('✅ Route exists (got auth error as expected):', status, error.response?.data?.message);
    } else if (status === 404) {
      console.log('❌ Route NOT FOUND (404) - This is the problem!');
    } else {
      console.log('❌ Failed:', status, error.response?.data || error.message);
    }
  }

  console.log('\n✅ Route testing complete!');
}

testRoutes().catch(console.error);
