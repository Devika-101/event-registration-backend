const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Helper function to check time conflicts
function checkTimeConflict(event1, event2) {
  if (event1.date !== event2.date) return false;
  
  // Convert time strings to comparable format
  const start1 = event1.start_time;
  const end1 = event1.end_time;
  const start2 = event2.start_time;
  const end2 = event2.end_time;
  
  return (start1 < end2 && start2 < end1);
}

// Helper function to get user's confirmed registrations
async function getUserConfirmedRegistrations(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.* FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.user_id = ? AND r.status = 'confirmed'`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
}

// Helper function to get user's cart items
async function getUserCart(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.* FROM cart c 
       JOIN events e ON c.event_id = e.id 
       WHERE c.user_id = ?`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
}

// API Endpoints

// 1. Register/Create User
app.post('/api/users/register', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, email });
  });
});

// 2. Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 3. Add event to cart with conflict checking
app.post('/api/cart/add', async (req, res) => {
  const { userId, eventId } = req.body;
  
  try {
    // Get user's confirmed registrations
    const confirmedEvents = await getUserConfirmedRegistrations(userId);
    
    // Get the new event details
    const newEvent = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    
    if (!newEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if user already has 3 confirmed registrations
    if (confirmedEvents.length >= 3) {
      // Check if event registration is less than 50% full
      const registrationPercentage = (newEvent.registered_seats / newEvent.total_seats) * 100;
      
      if (registrationPercentage >= 50) {
        return res.status(400).json({ 
          error: 'You already have 3 confirmed registrations and this event is more than 50% full',
          canAddToCart: false
        });
      }
    }
    
    // Check for time conflicts with confirmed events
    for (const confirmedEvent of confirmedEvents) {
      if (checkTimeConflict(confirmedEvent, newEvent)) {
        return res.status(400).json({ 
          error: `Time conflict with event: ${confirmedEvent.name}`,
          conflictEvent: confirmedEvent
        });
      }
    }
    
    // Get cart items and check for conflicts
    const cartItems = await getUserCart(userId);
    
    // Check for time conflicts with cart items
    for (const cartItem of cartItems) {
      if (checkTimeConflict(cartItem, newEvent)) {
        return res.status(400).json({ 
          error: `Time conflict with event in cart: ${cartItem.name}`,
          conflictEvent: cartItem
        });
      }
    }
    
    // Check if already in cart
    const existingCart = await new Promise((resolve) => {
      db.get('SELECT * FROM cart WHERE user_id = ? AND event_id = ?', [userId, eventId], (err, row) => {
        resolve(row);
      });
    });
    
    if (existingCart) {
      return res.status(400).json({ error: 'Event already in cart' });
    }
    
    // Check if already registered
    const existingRegistration = await new Promise((resolve) => {
      db.get('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?', [userId, eventId], (err, row) => {
        resolve(row);
      });
    });
    
    if (existingRegistration) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    // Add to cart
    db.run('INSERT INTO cart (user_id, event_id) VALUES (?, ?)', [userId, eventId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get updated cart
      db.all(
        `SELECT e.* FROM cart c JOIN events e ON c.event_id = e.id WHERE c.user_id = ?`,
        [userId],
        (err, cartEvents) => {
          res.json({ 
            message: 'Event added to cart successfully',
            cart: cartEvents,
            cartCount: cartEvents.length
          });
        }
      );
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get user's cart
app.get('/api/cart/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    `SELECT c.id as cart_id, e.* FROM cart c 
     JOIN events e ON c.event_id = e.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// 5. Remove from cart
app.delete('/api/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  
  db.run('DELETE FROM cart WHERE id = ?', [cartId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Removed from cart successfully' });
  });
});

// 6. Checkout - Process payment and confirm registrations
app.post('/api/checkout', async (req, res) => {
  const { userId, paymentMethod } = req.body;
  
  try {
    // Get cart items
    const cartItems = await getUserCart(userId);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Get confirmed registrations
    const confirmedEvents = await getUserConfirmedRegistrations(userId);
    
    // Check if adding cart items would exceed 3 registrations
    if (confirmedEvents.length + cartItems.length > 3) {
      return res.status(400).json({ 
        error: `You can only register for maximum 3 events. You already have ${confirmedEvents.length} confirmed registrations and trying to add ${cartItems.length} more.` 
      });
    }
    
    // Check for time conflicts between cart items and confirmed events
    for (const cartItem of cartItems) {
      for (const confirmedEvent of confirmedEvents) {
        if (checkTimeConflict(cartItem, confirmedEvent)) {
          return res.status(400).json({ 
            error: `Time conflict: ${cartItem.name} conflicts with your confirmed event ${confirmedEvent.name}` 
          });
        }
      }
    }
    
    // Check for time conflicts among cart items themselves
    for (let i = 0; i < cartItems.length; i++) {
      for (let j = i + 1; j < cartItems.length; j++) {
        if (checkTimeConflict(cartItems[i], cartItems[j])) {
          return res.status(400).json({ 
            error: `Time conflict between cart items: ${cartItems[i].name} and ${cartItems[j].name}` 
          });
        }
      }
    }
    
    // Check seat availability for all events
    for (const event of cartItems) {
      if (event.registered_seats >= event.total_seats) {
        return res.status(400).json({ 
          error: `Event ${event.name} is fully booked` 
        });
      }
    }
    
    // SIMULATE PAYMENT
    const paymentSuccess = simulatePayment(paymentMethod);
    
    if (!paymentSuccess) {
      return res.status(400).json({ error: 'Payment failed. Please try again.' });
    }
    
    // Process all registrations
    for (const event of cartItems) {
      // Update event registered seats
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE events SET registered_seats = registered_seats + 1 WHERE id = ?',
          [event.id],
          function(err) {
            if (err) reject(err);
            resolve();
          }
        );
      });
      
      // Create registration record
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO registrations (user_id, event_id, status, payment_status) VALUES (?, ?, ?, ?)',
          [userId, event.id, 'confirmed', 'completed'],
          function(err) {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    
    // Clear cart
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM cart WHERE user_id = ?', [userId], function(err) {
        if (err) reject(err);
        resolve();
      });
    });
    
    // Get all confirmed registrations
    const finalRegistrations = await getUserConfirmedRegistrations(userId);
    
    res.json({ 
      message: 'Payment successful! Registration completed.',
      paymentDetails: { status: 'success', method: paymentMethod },
      confirmedRegistrations: finalRegistrations
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get user's confirmed registrations
app.get('/api/registrations/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    `SELECT e.*, r.registration_date FROM registrations r 
     JOIN events e ON r.event_id = e.id 
     WHERE r.user_id = ? AND r.status = 'confirmed'`,
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// 8. Get user details
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(row);
  });
});

// Payment simulation function
function simulatePayment(paymentMethod) {
  // Simulate 90% success rate for demo
  const random = Math.random();
  return random < 0.9; // 90% success rate
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAPI Endpoints:');
  console.log('POST   /api/users/register     - Register new user');
  console.log('GET    /api/events              - Get all events');
  console.log('POST   /api/cart/add            - Add event to cart');
  console.log('GET    /api/cart/:userId        - Get user cart');
  console.log('DELETE /api/cart/:cartId        - Remove from cart');
  console.log('POST   /api/checkout            - Checkout and pay');
  console.log('GET    /api/registrations/:userId - Get user registrations');
  console.log('GET    /api/users/:userId       - Get user details');
});