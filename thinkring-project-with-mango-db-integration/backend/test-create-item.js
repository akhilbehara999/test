// Use built-in fetch if available (Node.js 18+), otherwise require node-fetch
let fetchImpl;
try {
  fetchImpl = global.fetch || require('node-fetch');
} catch (error) {
  console.log('node-fetch not installed, trying built-in fetch');
  fetchImpl = fetch;
}

async function testCreateItem() {
  try {
    const response = await fetchImpl('http://127.0.0.1:3000/api/lostfound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Item',
        description: 'This is a test item',
        type: 'lost',
        category: 'other',
        date: '2023-01-01',
        location: 'Library',
        contact: 'test@example.com'
      })
    });
    
    const result = await response.json();
    console.log('Response:', result);
    
    // Also test getting all items
    console.log('\n--- Getting all items ---');
    const getResponse = await fetchImpl('http://127.0.0.1:3000/api/lostfound');
    const getResult = await getResponse.json();
    console.log('All items:', JSON.stringify(getResult, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateItem();