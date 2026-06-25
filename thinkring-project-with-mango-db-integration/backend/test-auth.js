// Test authentication with the backend API

async function testAuth() {
  try {
    console.log('Testing authentication with backend API...');
    
    // Test login with default admin credentials
    console.log('\n1. Testing POST /api/auth/login');
    const loginResponse = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'KAB',
        password: '7013432177@akhil'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginResult = await loginResponse.json();
    console.log('Login response:', loginResult);
    
    if (loginResult.success && loginResult.token) {
      console.log('\n2. Testing authenticated request with token');
      // Test creating a study group with the token
      const createGroupResponse = await fetch('http://127.0.0.1:3000/api/studygroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginResult.token}`
        },
        body: JSON.stringify({
          name: 'Test Study Group',
          description: 'This is a test study group'
        })
      });
      
      console.log('Create group response status:', createGroupResponse.status);
      const createGroupResult = await createGroupResponse.json();
      console.log('Create group response:', createGroupResult);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();