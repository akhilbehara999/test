// Test script to check if frontend can retrieve AI configuration from backend
async function testFrontendAIConfig() {
  try {
    console.log('Testing frontend AI configuration retrieval...');
    
    // Simulate a fetch request to the backend API
    const response = await fetch('http://127.0.0.1:3000/api/aiconfig');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    if (result.success) {
      console.log('Configuration retrieved successfully:', result.config);
    } else {
      console.log('Failed to retrieve configuration:', result.message);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFrontendAIConfig();