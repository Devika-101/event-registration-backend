// Simple test script - run with: node test-api.js
const baseURL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    // 1. Create a user
    console.log('1. Creating user...');
    const userResponse = await fetch(`${baseURL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    });
    const user = await userResponse.json();
    console.log('User created:', user);
    
    const userId = user.id;
    
    // 2. Get all events
    console.log('\n2. Getting events...');
    const eventsResponse = await fetch(`${baseURL}/events`);
    const events = await eventsResponse.json();
    console.log('Events:', events);
    
    // 3. Add event to cart
    console.log('\n3. Adding event to cart...');
    const addResponse = await fetch(`${baseURL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventId: 1 })
    });
    const cartItem = await addResponse.json();
    console.log('Add to cart response:', cartItem);
    
    // 4. Checkout
    console.log('\n4. Checking out...');
    const checkoutResponse = await fetch(`${baseURL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, paymentMethod: 'credit_card' })
    });
    const result = await checkoutResponse.json();
    console.log('Checkout result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();