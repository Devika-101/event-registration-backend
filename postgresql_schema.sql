-- ============================================
-- EVENT REGISTRATION DATABASE
-- Complete PostgreSQL Version with PL/pgSQL
-- ============================================

-- ============================================
-- PART 1: CLEAN UP EXISTING OBJECTS
-- ============================================

DROP TABLE IF EXISTS registration_audit CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- PART 2: CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    registration_date DATE DEFAULT CURRENT_DATE,
    user_type VARCHAR(20) DEFAULT 'USER' CHECK (user_type IN ('USER', 'ADMIN'))
);

-- Events table
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    venue VARCHAR(200),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    booked_seats INTEGER DEFAULT 0 CHECK (booked_seats <= total_seats),
    ticket_price NUMERIC(10,2) NOT NULL CHECK (ticket_price >= 0),
    event_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (event_status IN ('ACTIVE', 'CANCELLED', 'COMPLETED')),
    created_date DATE DEFAULT CURRENT_DATE
);

-- Registrations table
CREATE TABLE registrations (
    reg_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    registration_date DATE DEFAULT CURRENT_DATE,
    payment_status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_method VARCHAR(50),
    amount_paid NUMERIC(10,2),
    UNIQUE(user_id, event_id)
);

-- Cart table
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    added_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, event_id)
);

-- Audit table for triggers
CREATE TABLE registration_audit (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    event_id INTEGER,
    action_type VARCHAR(50),
    action_date DATE DEFAULT CURRENT_DATE,
    old_status VARCHAR(20),
    new_status VARCHAR(20)
);

-- ============================================
-- PART 3: INSERT SAMPLE DATA
-- ============================================

INSERT INTO users (full_name, email, phone) VALUES 
('John Doe', 'john@example.com', '9876543210'),
('Jane Smith', 'jane@example.com', '9876543211'),
('Admin User', 'admin@example.com', '9876543212');

INSERT INTO events (event_name, event_date, start_time, end_time, venue, total_seats, ticket_price) VALUES 
('Tech Conference 2024', '2024-12-15', '10:00', '17:00', 'Convention Center', 100, 50),
('Web Development Workshop', '2024-12-15', '10:00', '13:00', 'Tech Hub', 50, 25),
('Networking Dinner', '2024-12-15', '18:00', '21:00', 'Grand Hotel', 80, 40),
('AI Summit', '2024-12-16', '09:00', '18:00', 'Conference Hall', 120, 75),
('Startup Pitch Event', '2024-12-16', '14:00', '17:00', 'Innovation Center', 60, 30);

COMMIT;

-- ============================================
-- PART 4: PL/pgSQL FUNCTIONS
-- ============================================

-- Function 1: Check if user can register (max 3 events)
CREATE OR REPLACE FUNCTION fn_can_register(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM registrations
    WHERE user_id = p_user_id AND payment_status = 'COMPLETED';
    
    RETURN v_count < 3;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Check seat availability
CREATE OR REPLACE FUNCTION fn_seats_available(p_event_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_total INTEGER;
    v_booked INTEGER;
BEGIN
    SELECT total_seats, booked_seats INTO v_total, v_booked
    FROM events WHERE event_id = p_event_id;
    
    RETURN v_booked < v_total;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get fill percentage
CREATE OR REPLACE FUNCTION fn_fill_percentage(p_event_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_total INTEGER;
    v_booked INTEGER;
BEGIN
    SELECT total_seats, booked_seats INTO v_total, v_booked
    FROM events WHERE event_id = p_event_id;
    
    IF v_total IS NULL OR v_total = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((v_booked::NUMERIC / v_total) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: VIEWS
-- ============================================

-- View 1: Event Statistics
CREATE OR REPLACE VIEW vw_event_stats AS
SELECT 
    event_id,
    event_name,
    event_date,
    start_time,
    end_time,
    total_seats,
    booked_seats,
    (total_seats - booked_seats) AS available_seats,
    fn_fill_percentage(event_id) AS fill_percentage,
    ticket_price,
    event_status
FROM events;

-- View 2: User Summary
CREATE OR REPLACE VIEW vw_user_summary AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(r.reg_id) AS total_registrations,
    COALESCE(SUM(r.amount_paid), 0) AS total_spent
FROM users u
LEFT JOIN registrations r ON u.user_id = r.user_id AND r.payment_status = 'COMPLETED'
GROUP BY u.user_id, u.full_name, u.email;

-- View 3: Admin Dashboard
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.total_seats,
    e.booked_seats,
    (e.total_seats - e.booked_seats) AS available_seats,
    fn_fill_percentage(e.event_id) AS fill_percentage,
    COALESCE(SUM(r.amount_paid), 0) AS total_revenue,
    COUNT(r.reg_id) AS registrations_count
FROM events e
LEFT JOIN registrations r ON e.event_id = r.event_id AND r.payment_status = 'COMPLETED'
GROUP BY e.event_id, e.event_name, e.event_date, e.total_seats, e.booked_seats;

-- ============================================
-- PART 6: STORED PROCEDURES
-- ============================================

-- Procedure 1: Add to Cart
CREATE OR REPLACE PROCEDURE pr_add_to_cart(
    p_user_id INTEGER,
    p_event_id INTEGER,
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_message VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_exists INTEGER;
    v_seats_available BOOLEAN;
BEGIN
    -- Check if already in cart
    SELECT COUNT(*) INTO v_exists
    FROM cart WHERE user_id = p_user_id AND event_id = p_event_id;
    
    IF v_exists > 0 THEN
        p_status := 'FAILED';
        p_message := 'Event already in cart';
        RETURN;
    END IF;
    
    -- Check if already registered
    SELECT COUNT(*) INTO v_exists
    FROM registrations WHERE user_id = p_user_id AND event_id = p_event_id;
    
    IF v_exists > 0 THEN
        p_status := 'FAILED';
        p_message := 'Already registered for this event';
        RETURN;
    END IF;
    
    -- Check seat availability
    v_seats_available := fn_seats_available(p_event_id);
    
    IF NOT v_seats_available THEN
        p_status := 'FAILED';
        p_message := 'No seats available';
        RETURN;
    END IF;
    
    -- Add to cart
    INSERT INTO cart (user_id, event_id) VALUES (p_user_id, p_event_id);
    
    p_status := 'SUCCESS';
    p_message := 'Added to cart successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
$$;

-- Procedure 2: Checkout (Process Payment)
CREATE OR REPLACE PROCEDURE pr_checkout(
    p_user_id INTEGER,
    p_payment_method VARCHAR,
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_message VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    cart_cursor CURSOR FOR
        SELECT c.event_id, e.ticket_price
        FROM cart c
        JOIN events e ON c.event_id = e.event_id
        WHERE c.user_id = p_user_id;
    
    v_total NUMERIC := 0;
    v_reg_count INTEGER;
    v_cart_count INTEGER;
BEGIN
    -- Get current registration count
    SELECT COUNT(*) INTO v_reg_count
    FROM registrations WHERE user_id = p_user_id AND payment_status = 'COMPLETED';
    
    -- Get cart count
    SELECT COUNT(*) INTO v_cart_count FROM cart WHERE user_id = p_user_id;
    
    -- Check max 3 registrations
    IF v_reg_count + v_cart_count > 3 THEN
        p_status := 'FAILED';
        p_message := 'Maximum 3 registrations allowed';
        RETURN;
    END IF;
    
    -- Calculate total amount
    FOR item IN cart_cursor LOOP
        v_total := v_total + item.ticket_price;
    END LOOP;
    
    -- Process each cart item
    FOR item IN cart_cursor LOOP
        -- Update event seats
        UPDATE events SET booked_seats = booked_seats + 1
        WHERE event_id = item.event_id;
        
        -- Create registration
        INSERT INTO registrations (user_id, event_id, payment_status, payment_method, amount_paid)
        VALUES (p_user_id, item.event_id, 'COMPLETED', p_payment_method, item.ticket_price);
        
        -- Delete from cart
        DELETE FROM cart WHERE user_id = p_user_id AND event_id = item.event_id;
    END LOOP;
    
    p_status := 'SUCCESS';
    p_message := 'Payment successful! Total: ₹' || v_total;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
$$;

-- Procedure 3: Show Registrations (with CURSOR)
CREATE OR REPLACE PROCEDURE pr_show_registrations()
LANGUAGE plpgsql AS $$
DECLARE
    reg_cursor CURSOR FOR
        SELECT r.reg_id, u.full_name, e.event_name, r.registration_date, r.amount_paid
        FROM registrations r
        JOIN users u ON r.user_id = u.user_id
        JOIN events e ON r.event_id = e.event_id
        WHERE r.payment_status = 'COMPLETED'
        ORDER BY r.registration_date DESC;
    
    v_reg RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '       REGISTRATION REPORT';
    RAISE NOTICE '========================================';
    
    OPEN reg_cursor;
    LOOP
        FETCH reg_cursor INTO v_reg;
        EXIT WHEN NOT FOUND;
        
        v_count := v_count + 1;
        RAISE NOTICE '%. %', v_count, v_reg.full_name;
        RAISE NOTICE '   Event: %', v_reg.event_name;
        RAISE NOTICE '   Date: %', v_reg.registration_date;
        RAISE NOTICE '   Amount: ₹%', v_reg.amount_paid;
        RAISE NOTICE '----------------------------------------';
    END LOOP;
    CLOSE reg_cursor;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'No registrations found.';
    ELSE
        RAISE NOTICE 'Total Registrations: %', v_count;
    END IF;
END;
$$;

-- ============================================
-- PART 7: TRIGGERS
-- ============================================

-- Trigger function to prevent overbooking
CREATE OR REPLACE FUNCTION prevent_overbooking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booked_seats > OLD.total_seats THEN
        RAISE EXCEPTION 'Cannot exceed total seat capacity!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_prevent_overbooking ON events;
CREATE TRIGGER trg_prevent_overbooking
    BEFORE UPDATE OF booked_seats ON events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_overbooking();

-- Trigger function for audit
CREATE OR REPLACE FUNCTION audit_registrations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO registration_audit (user_id, event_id, action_type, new_status)
    VALUES (NEW.user_id, NEW.event_id, 'INSERT', NEW.payment_status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_audit_registrations ON registrations;
CREATE TRIGGER trg_audit_registrations
    AFTER INSERT ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION audit_registrations();

-- ============================================
-- PART 8: VERIFICATION QUERIES
-- ============================================

-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check all views
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Check all functions
SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%';

-- Check all procedures
SELECT proname FROM pg_proc WHERE proname LIKE 'pr_%';

-- Check all triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_%';

-- Show event stats
SELECT * FROM vw_event_stats;

-- Show user summary
SELECT * FROM vw_user_summary;

-- Show admin dashboard
SELECT * FROM admin_dashboard_view;

-- Test functions
SELECT fn_can_register(1) AS can_register;
SELECT fn_seats_available(1) AS seats_available;
SELECT fn_fill_percentage(1) AS fill_percentage;

-- Test procedure with cursor
CALL pr_show_registrations();