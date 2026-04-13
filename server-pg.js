const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Connection Configuration
const pool = new Pool({
    user: 'postgres',
    password: 'ddbms21',
    host: 'localhost',
    port: 5432,
    database: 'event_registration'
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL Database!');
        release();
    }
});

// ============================================
// PUBLIC API ENDPOINTS
// ============================================

// 1. Get all events
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vw_event_stats ORDER BY event_date');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Register new user
app.post('/api/users/register', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    try {
        const result = await pool.query(
            'INSERT INTO users (full_name, email) VALUES ($1, $2) RETURNING user_id, full_name, email',
            [name, email]
        );
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email already registered' });
        } else {
            console.error('Error registering user:', error);
            res.status(500).json({ error: error.message });
        }
    }
});

// 3. Add event to cart
app.post('/api/cart/add', async (req, res) => {
    const { userId, eventId } = req.body;
    console.log('🛒 Add to cart - User:', userId, 'Event:', eventId);
    
    try {
        await pool.query('CALL pr_add_to_cart($1, $2, NULL, NULL)', [userId, eventId]);
        console.log('✅ Added to cart successfully');
        res.json({ status: 'SUCCESS', message: 'Added to cart successfully' });
    } catch (error) {
        console.error('❌ Error adding to cart:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// 4. Get user's cart
app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(
            `SELECT c.cart_id, e.event_id, e.event_name as name, e.ticket_price as price, 
                    e.event_date, e.start_time, e.end_time
             FROM cart c 
             JOIN events e ON c.event_id = e.event_id 
             WHERE c.user_id = $1`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Remove from cart
app.delete('/api/cart/:cartId', async (req, res) => {
    const { cartId } = req.params;
    
    try {
        await pool.query('DELETE FROM cart WHERE cart_id = $1', [cartId]);
        res.json({ message: 'Removed from cart successfully' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Checkout - Process payment
app.post('/api/checkout', async (req, res) => {
    const { userId, paymentMethod } = req.body;
    console.log('💰 CHECKOUT REQUEST - User:', userId, 'Method:', paymentMethod);
    
    try {
        await pool.query('CALL pr_checkout($1, $2, NULL, NULL)', [userId, paymentMethod]);
        console.log('✅ Checkout SUCCESS for user:', userId);
        res.json({ status: 'SUCCESS', message: 'Payment successful! Registration completed.' });
    } catch (error) {
        console.error('❌ Checkout ERROR:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// 7. Get user's active registrations (only COMPLETED) - FIXED
app.get('/api/registrations/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log('📋 Fetching active registrations for user:', userId);
    
    try {
        // Only show COMPLETED (active) registrations
        const result = await pool.query(
            `SELECT r.reg_id, e.event_name, e.event_date, e.start_time, e.end_time, 
                    r.registration_date, r.amount_paid, r.payment_status
             FROM registrations r
             JOIN events e ON r.event_id = e.event_id
             WHERE r.user_id = $1 AND r.payment_status = 'COMPLETED'
             ORDER BY r.registration_date DESC`,
            [userId]
        );
        console.log(`✅ Found ${result.rows.length} active registrations for user ${userId}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Get user details
app.get('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT user_id, full_name, email, phone, registration_date FROM users WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Admin: Get all events with statistics
app.get('/api/admin/events-stats', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM admin_dashboard_view ORDER BY event_date');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get single event
app.get('/api/admin/events/:eventId', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { eventId } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM events WHERE event_id = $1', [eventId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update event
app.put('/api/admin/events/:eventId', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { eventId } = req.params;
    const { event_name, event_date, start_time, end_time, venue, total_seats, ticket_price } = req.body;
    
    try {
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (event_name !== undefined) { updates.push(`event_name = $${paramCount}`); values.push(event_name); paramCount++; }
        if (event_date !== undefined) { updates.push(`event_date = $${paramCount}`); values.push(event_date); paramCount++; }
        if (start_time !== undefined) { updates.push(`start_time = $${paramCount}`); values.push(start_time); paramCount++; }
        if (end_time !== undefined) { updates.push(`end_time = $${paramCount}`); values.push(end_time); paramCount++; }
        if (venue !== undefined) { updates.push(`venue = $${paramCount}`); values.push(venue); paramCount++; }
        if (total_seats !== undefined) { updates.push(`total_seats = $${paramCount}`); values.push(total_seats); paramCount++; }
        if (ticket_price !== undefined) { updates.push(`ticket_price = $${paramCount}`); values.push(ticket_price); paramCount++; }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(eventId);
        const query = `UPDATE events SET ${updates.join(', ')} WHERE event_id = $${paramCount} RETURNING *`;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ message: 'Event updated successfully', event: result.rows[0] });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Add new event
app.post('/api/admin/events', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { event_name, event_date, start_time, end_time, venue, total_seats, ticket_price } = req.body;
    
    if (!event_name || !event_date || !start_time || !end_time || !total_seats || !ticket_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO events (event_name, event_date, start_time, end_time, venue, total_seats, ticket_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [event_name, event_date, start_time, end_time, venue, total_seats, ticket_price]
        );
        
        res.json({ message: 'Event added successfully', event: result.rows[0] });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete event
app.delete('/api/admin/events/:eventId', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { eventId } = req.params;
    
    try {
        const checkResult = await pool.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [eventId]);
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Cannot delete event with existing registrations' });
        }
        
        const result = await pool.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [eventId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Cancel registration
app.delete('/api/admin/registrations/:regId', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { regId } = req.params;
    console.log('🗑️ Cancelling registration:', regId);
    
    try {
        const getResult = await pool.query(
            'SELECT event_id, user_id FROM registrations WHERE reg_id = $1 AND payment_status = $2',
            [regId, 'COMPLETED']
        );
        
        if (getResult.rows.length === 0) {
            return res.status(404).json({ error: 'Registration not found or already cancelled' });
        }
        
        const eventId = getResult.rows[0].event_id;
        const userId = getResult.rows[0].user_id;
        
        await pool.query(
            'UPDATE registrations SET payment_status = $1 WHERE reg_id = $2',
            ['REFUNDED', regId]
        );
        
        await pool.query(
            'UPDATE events SET booked_seats = booked_seats - 1 WHERE event_id = $1',
            [eventId]
        );
        
        await pool.query(
            'DELETE FROM cart WHERE user_id = $1 AND event_id = $2',
            [userId, eventId]
        );
        
        console.log('✅ Registration cancelled successfully');
        res.json({ 
            message: 'Registration cancelled successfully',
            registration_id: regId,
            event_id: eventId
        });
        
    } catch (error) {
        console.error('❌ Error cancelling registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get system statistics
app.get('/api/admin/stats', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        const result = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM events) as total_events,
                (SELECT COUNT(*) FROM registrations WHERE payment_status = 'COMPLETED') as total_registrations,
                (SELECT COALESCE(SUM(amount_paid), 0) FROM registrations WHERE payment_status = 'COMPLETED') as total_revenue`
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Show registrations report (uses cursor in procedure)
app.get('/api/admin/report', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin123') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        await pool.query('CALL pr_show_registrations()');
        res.json({ message: 'Check server logs for registration report' });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Using PostgreSQL Database`);
    console.log(`========================================\n`);
    console.log(`API Endpoints:`);
    console.log(`  GET    /api/events`);
    console.log(`  POST   /api/users/register`);
    console.log(`  POST   /api/cart/add`);
    console.log(`  GET    /api/cart/:userId`);
    console.log(`  DELETE /api/cart/:cartId`);
    console.log(`  POST   /api/checkout`);
    console.log(`  GET    /api/registrations/:userId`);
    console.log(`  GET    /api/users/:userId`);
    console.log(`  GET    /api/admin/events-stats (Admin Key: admin123)`);
    console.log(`  GET    /api/admin/registrations (Admin Key: admin123)`);
    console.log(`  GET    /api/admin/stats (Admin Key: admin123)`);
    console.log(`  DELETE /api/admin/registrations/:regId (Admin Key: admin123)`);
    console.log(`\n✅ PostgreSQL PL/pgSQL Implementation Ready!\n`);
});