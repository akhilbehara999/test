// Test if we can connect to the backend API from the frontend
// Using built-in fetch if available

async function testConnection() {
  try {
    console.log('Testing connection to backend API...');
    
    // Test getting all lost and found items
    console.log('\n1. Testing GET /api/lostfound');
    const getResponse = await fetch('http://127.0.0.1:3000/api/lostfound');
    const getResult = await getResponse.json();
    console.log('GET response:', getResult);
    
    // Test creating a new item
    console.log('\n2. Testing POST /api/lostfound');
    const postResponse = await fetch('http://127.0.0.1:3000/api/lostfound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Item',
        description: 'This is a test item from backend test',
        type: 'lost',
        category: 'other',
        date: '2023-01-01',
        location: 'Library',
        contact: 'test@example.com'
      })
    });
    
    const postResult = await postResponse.json();
    console.log('POST response:', postResult);
    
    // Test getting all items again to see if the new item is there
    console.log('\n3. Testing GET /api/lostfound again');
    const getResponse2 = await fetch('http://127.0.0.1:3000/api/lostfound');
    const getResult2 = await getResponse2.json();
    console.log('GET response after POST:', getResult2);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConnection();