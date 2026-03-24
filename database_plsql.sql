-- ============================================
-- EVENT REGISTRATION DATABASE
-- Complete PL/SQL Implementation
-- DBMS Microproject
-- ============================================

-- ============================================
-- PART 1: TABLE STRUCTURES
-- ============================================

-- Drop tables if they exist (for clean setup)
DROP TABLE registration_audit CASCADE CONSTRAINTS;
DROP TABLE cart CASCADE CONSTRAINTS;
DROP TABLE registrations CASCADE CONSTRAINTS;
DROP TABLE events CASCADE CONSTRAINTS;
DROP TABLE users CASCADE CONSTRAINTS;
DROP SEQUENCE seq_user_id;
DROP SEQUENCE seq_event_id;
DROP SEQUENCE seq_registration_id;
DROP SEQUENCE seq_cart_id;

-- Users Table
CREATE TABLE users (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    created_date DATE DEFAULT SYSDATE,
    user_type VARCHAR2(20) DEFAULT 'USER' CHECK (user_type IN ('USER', 'ADMIN'))
);

-- Events Table
CREATE TABLE events (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(200) NOT NULL,
    event_date DATE NOT NULL,
    start_time VARCHAR2(10) NOT NULL,
    end_time VARCHAR2(10) NOT NULL,
    total_seats NUMBER NOT NULL CHECK (total_seats > 0),
    registered_seats NUMBER DEFAULT 0 CHECK (registered_seats <= total_seats),
    price NUMBER(10,2) NOT NULL CHECK (price >= 0),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED')),
    created_date DATE DEFAULT SYSDATE
);

-- Registrations Table
CREATE TABLE registrations (
    id NUMBER PRIMARY KEY,
    user_id NUMBER NOT NULL,
    event_id NUMBER NOT NULL,
    registration_date DATE DEFAULT SYSDATE,
    payment_status VARCHAR2(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    registration_status VARCHAR2(20) DEFAULT 'CONFIRMED' CHECK (registration_status IN ('CONFIRMED', 'CANCELLED', 'WAITLIST')),
    payment_method VARCHAR2(50),
    amount_paid NUMBER(10,2),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- Cart Table
CREATE TABLE cart (
    id NUMBER PRIMARY KEY,
    user_id NUMBER NOT NULL,
    event_id NUMBER NOT NULL,
    added_date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_item UNIQUE (user_id, event_id)
);

-- Audit Table for Tracking Changes
CREATE TABLE registration_audit (
    audit_id NUMBER PRIMARY KEY,
    user_id NUMBER,
    event_id NUMBER,
    action VARCHAR2(50),
    action_date DATE DEFAULT SYSDATE,
    old_status VARCHAR2(20),
    new_status VARCHAR2(20),
    performed_by VARCHAR2(100)
);

-- ============================================
-- PART 2: SEQUENCES (Auto-increment)
-- ============================================

CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_event_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_registration_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_cart_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_id START WITH 1 INCREMENT BY 1;

-- ============================================
-- PART 3: FUNCTIONS
-- ============================================

-- Function 1: Check Time Conflict
CREATE OR REPLACE FUNCTION fn_check_time_conflict(
    p_user_id IN NUMBER,
    p_event_date IN DATE,
    p_start_time IN VARCHAR2,
    p_end_time IN VARCHAR2
) RETURN NUMBER
IS
    v_conflict_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = p_user_id
    AND r.registration_status = 'CONFIRMED'
    AND e.event_date = p_event_date
    AND (
        (e.start_time < p_end_time AND e.end_time > p_start_time)
    );
    
    RETURN v_conflict_count;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN -1;
END;
/

-- Function 2: Get User Registration Count
CREATE OR REPLACE FUNCTION fn_get_user_reg_count(
    p_user_id IN NUMBER
) RETURN NUMBER
IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM registrations
    WHERE user_id = p_user_id
    AND registration_status = 'CONFIRMED'
    AND payment_status = 'COMPLETED';
    
    RETURN v_count;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- Function 3: Calculate Event Fill Percentage
CREATE OR REPLACE FUNCTION fn_event_fill_percentage(
    p_event_id IN NUMBER
) RETURN NUMBER
IS
    v_total_seats NUMBER;
    v_registered_seats NUMBER;
    v_percentage NUMBER;
BEGIN
    SELECT total_seats, registered_seats
    INTO v_total_seats, v_registered_seats
    FROM events
    WHERE id = p_event_id;
    
    v_percentage := (v_registered_seats / v_total_seats) * 100;
    RETURN ROUND(v_percentage, 2);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN NULL;
END;
/

-- Function 4: Check Seat Availability
CREATE OR REPLACE FUNCTION fn_check_seat_availability(
    p_event_id IN NUMBER
) RETURN BOOLEAN
IS
    v_total_seats NUMBER;
    v_registered_seats NUMBER;
BEGIN
    SELECT total_seats, registered_seats
    INTO v_total_seats, v_registered_seats
    FROM events
    WHERE id = p_event_id;
    
    IF v_registered_seats < v_total_seats THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN FALSE;
END;
/

-- Function 5: Calculate Total Revenue
CREATE OR REPLACE FUNCTION fn_total_revenue(
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL
) RETURN NUMBER
IS
    v_total NUMBER;
BEGIN
    IF p_from_date IS NULL AND p_to_date IS NULL THEN
        SELECT NVL(SUM(amount_paid), 0)
        INTO v_total
        FROM registrations
        WHERE payment_status = 'COMPLETED';
    ELSE
        SELECT NVL(SUM(amount_paid), 0)
        INTO v_total
        FROM registrations
        WHERE payment_status = 'COMPLETED'
        AND registration_date BETWEEN p_from_date AND p_to_date;
    END IF;
    
    RETURN v_total;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- ============================================
-- PART 4: PROCEDURES
-- ============================================

-- Procedure 1: Register User (Main Registration Logic)
CREATE OR REPLACE PROCEDURE pr_register_user(
    p_name IN VARCHAR2,
    p_email IN VARCHAR2,
    p_user_id OUT NUMBER,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
) IS
    v_existing_email NUMBER;
BEGIN
    -- Check if email already exists
    SELECT COUNT(*) INTO v_existing_email
    FROM users
    WHERE email = p_email;
    
    IF v_existing_email > 0 THEN
        p_status := 'FAILED';
        p_message := 'Email already registered';
        RETURN;
    END IF;
    
    -- Insert new user
    p_user_id := seq_user_id.NEXTVAL;
    INSERT INTO users (id, name, email)
    VALUES (p_user_id, p_name, p_email);
    
    COMMIT;
    p_status := 'SUCCESS';
    p_message := 'User registered successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
/

-- Procedure 2: Add Event to Cart
CREATE OR REPLACE PROCEDURE pr_add_to_cart(
    p_user_id IN NUMBER,
    p_event_id IN NUMBER,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
) IS
    v_reg_count NUMBER;
    v_conflict_count NUMBER;
    v_event_date DATE;
    v_start_time VARCHAR2(10);
    v_end_time VARCHAR2(10);
    v_event_status VARCHAR2(20);
    v_seat_available BOOLEAN;
    v_existing_cart NUMBER;
BEGIN
    -- Check if event exists and is active
    SELECT status, event_date, start_time, end_time
    INTO v_event_status, v_event_date, v_start_time, v_end_time
    FROM events
    WHERE id = p_event_id;
    
    IF v_event_status != 'ACTIVE' THEN
        p_status := 'FAILED';
        p_message := 'Event is not active';
        RETURN;
    END IF;
    
    -- Check if already in cart
    SELECT COUNT(*) INTO v_existing_cart
    FROM cart
    WHERE user_id = p_user_id AND event_id = p_event_id;
    
    IF v_existing_cart > 0 THEN
        p_status := 'FAILED';
        p_message := 'Event already in cart';
        RETURN;
    END IF;
    
    -- Check if already registered
    SELECT COUNT(*) INTO v_existing_cart
    FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id;
    
    IF v_existing_cart > 0 THEN
        p_status := 'FAILED';
        p_message := 'Already registered for this event';
        RETURN;
    END IF;
    
    -- Check time conflict with existing registrations
    v_conflict_count := fn_check_time_conflict(p_user_id, v_event_date, v_start_time, v_end_time);
    
    IF v_conflict_count > 0 THEN
        p_status := 'FAILED';
        p_message := 'Time conflict with existing registration';
        RETURN;
    END IF;
    
    -- Check registration limit (3 max)
    v_reg_count := fn_get_user_reg_count(p_user_id);
    
    IF v_reg_count >= 3 THEN
        p_status := 'FAILED';
        p_message := 'Maximum 3 registrations allowed';
        RETURN;
    END IF;
    
    -- Check seat availability
    v_seat_available := fn_check_seat_availability(p_event_id);
    
    IF NOT v_seat_available THEN
        p_status := 'FAILED';
        p_message := 'No seats available';
        RETURN;
    END IF;
    
    -- Add to cart
    INSERT INTO cart (id, user_id, event_id)
    VALUES (seq_cart_id.NEXTVAL, p_user_id, p_event_id);
    
    COMMIT;
    p_status := 'SUCCESS';
    p_message := 'Added to cart successfully';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        p_status := 'FAILED';
        p_message := 'Event not found';
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
/

-- Procedure 3: Checkout and Process Payment
CREATE OR REPLACE PROCEDURE pr_checkout(
    p_user_id IN NUMBER,
    p_payment_method IN VARCHAR2,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
) IS
    CURSOR cart_cursor IS
        SELECT c.id as cart_id, e.id as event_id, e.name, e.price, e.total_seats, e.registered_seats
        FROM cart c
        JOIN events e ON c.event_id = e.id
        WHERE c.user_id = p_user_id;
    
    v_cart_item cart_cursor%ROWTYPE;
    v_reg_count NUMBER;
    v_conflict_count NUMBER;
    v_event_date DATE;
    v_start_time VARCHAR2(10);
    v_end_time VARCHAR2(10);
    v_payment_success VARCHAR2(20);
    v_total_amount NUMBER := 0;
    v_processed_count NUMBER := 0;
BEGIN
    -- Get user's current registration count
    v_reg_count := fn_get_user_reg_count(p_user_id);
    
    -- Check if adding cart items would exceed limit
    SELECT COUNT(*) INTO v_processed_count FROM cart WHERE user_id = p_user_id;
    
    IF v_reg_count + v_processed_count > 3 THEN
        p_status := 'FAILED';
        p_message := 'You can only register for maximum 3 events';
        RETURN;
    END IF;
    
    -- Calculate total amount
    FOR cart_item IN cart_cursor LOOP
        v_total_amount := v_total_amount + cart_item.price;
    END LOOP;
    
    -- Process payment
    v_payment_success := fn_simulate_payment(p_payment_method, v_total_amount);
    
    IF v_payment_success = 'FAILED' THEN
        p_status := 'FAILED';
        p_message := 'Payment failed. Please try again.';
        RETURN;
    END IF;
    
    -- Process each cart item
    FOR cart_item IN cart_cursor LOOP
        -- Update event seats
        UPDATE events
        SET registered_seats = registered_seats + 1
        WHERE id = cart_item.event_id;
        
        -- Create registration
        INSERT INTO registrations (id, user_id, event_id, payment_status, payment_method, amount_paid)
        VALUES (seq_registration_id.NEXTVAL, p_user_id, cart_item.event_id, 'COMPLETED', p_payment_method, cart_item.price);
        
        -- Delete from cart
        DELETE FROM cart WHERE id = cart_item.cart_id;
    END LOOP;
    
    COMMIT;
    p_status := 'SUCCESS';
    p_message := 'Registration completed successfully. Payment received: ' || v_total_amount;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
/

-- Procedure 4: Cancel Registration
CREATE OR REPLACE PROCEDURE pr_cancel_registration(
    p_registration_id IN NUMBER,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
) IS
    v_event_id NUMBER;
    v_user_id NUMBER;
BEGIN
    -- Get registration details
    SELECT user_id, event_id
    INTO v_user_id, v_event_id
    FROM registrations
    WHERE id = p_registration_id
    AND payment_status = 'COMPLETED';
    
    -- Update registration status
    UPDATE registrations
    SET registration_status = 'CANCELLED',
        payment_status = 'REFUNDED'
    WHERE id = p_registration_id;
    
    -- Decrease seat count
    UPDATE events
    SET registered_seats = registered_seats - 1
    WHERE id = v_event_id;
    
    COMMIT;
    p_status := 'SUCCESS';
    p_message := 'Registration cancelled and refund processed';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        p_status := 'FAILED';
        p_message := 'Registration not found or already cancelled';
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR';
        p_message := SQLERRM;
END;
/

-- Procedure 5: Get User Dashboard Data (Using CURSOR)
CREATE OR REPLACE PROCEDURE pr_get_user_dashboard(
    p_user_id IN NUMBER,
    p_user_cursor OUT SYS_REFCURSOR,
    p_reg_cursor OUT SYS_REFCURSOR,
    p_status OUT VARCHAR2
) IS
BEGIN
    -- Cursor 1: User Details
    OPEN p_user_cursor FOR
        SELECT id, name, email, created_date, user_type
        FROM users
        WHERE id = p_user_id;
    
    -- Cursor 2: User's Registrations
    OPEN p_reg_cursor FOR
        SELECT r.id as registration_id, e.name as event_name, e.event_date, 
               e.start_time, e.end_time, r.registration_date, r.payment_status,
               e.price, fn_event_fill_percentage(e.id) as fill_percentage
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = p_user_id
        AND r.registration_status = 'CONFIRMED'
        ORDER BY e.event_date;
    
    p_status := 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        p_status := 'ERROR';
END;
/

-- ============================================
-- PART 5: TRIGGERS
-- ============================================

-- Trigger 1: Auto-update seat count when registration added
CREATE OR REPLACE TRIGGER trg_update_seats
AFTER INSERT ON registrations
FOR EACH ROW
WHEN (NEW.payment_status = 'COMPLETED')
BEGIN
    UPDATE events
    SET registered_seats = registered_seats + 1
    WHERE id = :NEW.event_id;
    
    DBMS_OUTPUT.PUT_LINE('Seat updated for event: ' || :NEW.event_id);
END;
/

-- Trigger 2: Audit registration changes
CREATE OR REPLACE TRIGGER trg_audit_registrations
AFTER UPDATE ON registrations
FOR EACH ROW
BEGIN
    INSERT INTO registration_audit (audit_id, user_id, event_id, action, action_date, old_status, new_status)
    VALUES (seq_audit_id.NEXTVAL, :NEW.user_id, :NEW.event_id, 'UPDATE', SYSDATE, 
            :OLD.registration_status, :NEW.registration_status);
END;
/

-- Trigger 3: Prevent seat overflow
CREATE OR REPLACE TRIGGER trg_check_seat_overflow
BEFORE UPDATE OF registered_seats ON events
FOR EACH ROW
BEGIN
    IF :NEW.registered_seats > :OLD.total_seats THEN
        RAISE_APPLICATION_ERROR(-20001, 'Cannot exceed total seat capacity');
    END IF;
END;
/

-- Trigger 4: Auto-add to waitlist when event is full
CREATE OR REPLACE TRIGGER trg_waitlist_full_event
BEFORE INSERT ON registrations
FOR EACH ROW
DECLARE
    v_available_seats NUMBER;
BEGIN
    SELECT total_seats - registered_seats
    INTO v_available_seats
    FROM events
    WHERE id = :NEW.event_id;
    
    IF v_available_seats <= 0 THEN
        :NEW.registration_status := 'WAITLIST';
        DBMS_OUTPUT.PUT_LINE('Event full. Added to waitlist.');
    END IF;
END;
/

-- Trigger 5: Prevent duplicate cart items
CREATE OR REPLACE TRIGGER trg_prevent_duplicate_cart
BEFORE INSERT ON cart
FOR EACH ROW
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM cart
    WHERE user_id = :NEW.user_id AND event_id = :NEW.event_id;
    
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Event already in cart');
    END IF;
END;
/

-- ============================================
-- PART 6: VIEWS
-- ============================================

-- View 1: Admin Dashboard View
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.event_date,
    e.start_time,
    e.end_time,
    e.total_seats,
    e.registered_seats,
    (e.total_seats - e.registered_seats) as available_seats,
    ROUND((e.registered_seats / e.total_seats) * 100, 2) as fill_percentage,
    NVL(SUM(r.amount_paid), 0) as revenue
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id AND r.payment_status = 'COMPLETED'
GROUP BY e.id, e.name, e.event_date, e.start_time, e.end_time, e.total_seats, e.registered_seats;

-- View 2: User Registration Summary
CREATE OR REPLACE VIEW user_registration_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    COUNT(r.id) as total_registrations,
    SUM(CASE WHEN r.payment_status = 'COMPLETED' THEN 1 ELSE 0 END) as confirmed_registrations,
    NVL(SUM(r.amount_paid), 0) as total_spent
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email;

-- View 3: Event Popularity Ranking
CREATE OR REPLACE VIEW event_popularity_view AS
SELECT 
    e.id,
    e.name,
    e.event_date,
    e.total_seats,
    e.registered_seats,
    RANK() OVER (ORDER BY e.registered_seats DESC) as popularity_rank,
    DENSE_RANK() OVER (ORDER BY (e.registered_seats/e.total_seats) DESC) as fill_rate_rank
FROM events e
WHERE e.status = 'ACTIVE';

-- ============================================
-- PART 7: CURSOR EXAMPLES
-- ============================================

-- Procedure with Explicit Cursor for Bulk Processing
CREATE OR REPLACE PROCEDURE pr_process_daily_reports IS
    CURSOR event_cursor IS
        SELECT id, name, event_date, registered_seats, total_seats
        FROM events
        WHERE event_date = TRUNC(SYSDATE);
    
    v_event event_cursor%ROWTYPE;
    v_fill_percentage NUMBER;
BEGIN
    OPEN event_cursor;
    
    LOOP
        FETCH event_cursor INTO v_event;
        EXIT WHEN event_cursor%NOTFOUND;
        
        v_fill_percentage := fn_event_fill_percentage(v_event.id);
        
        DBMS_OUTPUT.PUT_LINE('Event: ' || v_event.name);
        DBMS_OUTPUT.PUT_LINE('  Seats: ' || v_event.registered_seats || '/' || v_event.total_seats);
        DBMS_OUTPUT.PUT_LINE('  Fill Rate: ' || v_fill_percentage || '%');
        
        -- Auto-cancel events with low registration
        IF v_fill_percentage < 10 AND v_event.event_date > SYSDATE THEN
            UPDATE events SET status = 'CANCELLED' WHERE id = v_event.id;
            DBMS_OUTPUT.PUT_LINE('  *** Event CANCELLED due to low registration ***');
        END IF;
    END LOOP;
    
    CLOSE event_cursor;
    COMMIT;
END;
/

-- ============================================
-- PART 8: SAMPLE DATA
-- ============================================

-- Insert Sample Users
INSERT INTO users VALUES (seq_user_id.NEXTVAL, 'John Doe', 'john@example.com', SYSDATE, 'USER');
INSERT INTO users VALUES (seq_user_id.NEXTVAL, 'Jane Smith', 'jane@example.com', SYSDATE, 'USER');
INSERT INTO users VALUES (seq_user_id.NEXTVAL, 'Admin User', 'admin@example.com', SYSDATE, 'ADMIN');

-- Insert Sample Events
INSERT INTO events VALUES (seq_event_id.NEXTVAL, 'Tech Conference 2024', DATE '2024-12-15', '10:00', '17:00', 100, 0, 50, 'ACTIVE', SYSDATE);
INSERT INTO events VALUES (seq_event_id.NEXTVAL, 'Web Development Workshop', DATE '2024-12-15', '10:00', '13:00', 50, 0, 25, 'ACTIVE', SYSDATE);
INSERT INTO events VALUES (seq_event_id.NEXTVAL, 'Networking Dinner', DATE '2024-12-15', '18:00', '21:00', 80, 0, 40, 'ACTIVE', SYSDATE);
INSERT INTO events VALUES (seq_event_id.NEXTVAL, 'AI Summit', DATE '2024-12-16', '09:00', '18:00', 120, 0, 75, 'ACTIVE', SYSDATE);
INSERT INTO events VALUES (seq_event_id.NEXTVAL, 'Startup Pitch Event', DATE '2024-12-16', '14:00', '17:00', 60, 0, 30, 'ACTIVE', SYSDATE);

COMMIT;

-- ============================================
-- PART 9: PACKAGE (Group related functions)
-- ============================================

CREATE OR REPLACE PACKAGE pkg_event_registration AS
    -- Functions
    FUNCTION fn_check_time_conflict(p_user_id NUMBER, p_event_date DATE, p_start_time VARCHAR2, p_end_time VARCHAR2) RETURN NUMBER;
    FUNCTION fn_get_user_reg_count(p_user_id NUMBER) RETURN NUMBER;
    FUNCTION fn_event_fill_percentage(p_event_id NUMBER) RETURN NUMBER;
    FUNCTION fn_check_seat_availability(p_event_id NUMBER) RETURN BOOLEAN;
    FUNCTION fn_total_revenue(p_from_date DATE DEFAULT NULL, p_to_date DATE DEFAULT NULL) RETURN NUMBER;
    
    -- Procedures
    PROCEDURE pr_register_user(p_name VARCHAR2, p_email VARCHAR2, p_user_id OUT NUMBER, p_status OUT VARCHAR2, p_message OUT VARCHAR2);
    PROCEDURE pr_add_to_cart(p_user_id NUMBER, p_event_id NUMBER, p_status OUT VARCHAR2, p_message OUT VARCHAR2);
    PROCEDURE pr_checkout(p_user_id NUMBER, p_payment_method VARCHAR2, p_status OUT VARCHAR2, p_message OUT VARCHAR2);
    PROCEDURE pr_cancel_registration(p_registration_id NUMBER, p_status OUT VARCHAR2, p_message OUT VARCHAR2);
    PROCEDURE pr_get_user_dashboard(p_user_id NUMBER, p_user_cursor OUT SYS_REFCURSOR, p_reg_cursor OUT SYS_REFCURSOR, p_status OUT VARCHAR2);
    
END pkg_event_registration;
/

-- Package Body
CREATE OR REPLACE PACKAGE BODY pkg_event_registration AS

    FUNCTION fn_check_time_conflict(
        p_user_id IN NUMBER,
        p_event_date IN DATE,
        p_start_time IN VARCHAR2,
        p_end_time IN VARCHAR2
    ) RETURN NUMBER IS
        v_conflict_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_conflict_count
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = p_user_id
        AND r.registration_status = 'CONFIRMED'
        AND e.event_date = p_event_date
        AND (
            (e.start_time < p_end_time AND e.end_time > p_start_time)
        );
        RETURN v_conflict_count;
    END;

    FUNCTION fn_get_user_reg_count(p_user_id NUMBER) RETURN NUMBER IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM registrations
        WHERE user_id = p_user_id
        AND registration_status = 'CONFIRMED'
        AND payment_status = 'COMPLETED';
        RETURN v_count;
    END;

    FUNCTION fn_event_fill_percentage(p_event_id NUMBER) RETURN NUMBER IS
        v_total_seats NUMBER;
        v_registered_seats NUMBER;
    BEGIN
        SELECT total_seats, registered_seats
        INTO v_total_seats, v_registered_seats
        FROM events
        WHERE id = p_event_id;
        RETURN ROUND((v_registered_seats / v_total_seats) * 100, 2);
    END;

    FUNCTION fn_check_seat_availability(p_event_id NUMBER) RETURN BOOLEAN IS
        v_total_seats NUMBER;
        v_registered_seats NUMBER;
    BEGIN
        SELECT total_seats, registered_seats
        INTO v_total_seats, v_registered_seats
        FROM events
        WHERE id = p_event_id;
        RETURN v_registered_seats < v_total_seats;
    END;

    FUNCTION fn_total_revenue(
        p_from_date DATE DEFAULT NULL,
        p_to_date DATE DEFAULT NULL
    ) RETURN NUMBER IS
        v_total NUMBER;
    BEGIN
        IF p_from_date IS NULL AND p_to_date IS NULL THEN
            SELECT NVL(SUM(amount_paid), 0)
            INTO v_total
            FROM registrations
            WHERE payment_status = 'COMPLETED';
        ELSE
            SELECT NVL(SUM(amount_paid), 0)
            INTO v_total
            FROM registrations
            WHERE payment_status = 'COMPLETED'
            AND registration_date BETWEEN p_from_date AND p_to_date;
        END IF;
        RETURN v_total;
    END;

    PROCEDURE pr_register_user(
        p_name IN VARCHAR2,
        p_email IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_status OUT VARCHAR2,
        p_message OUT VARCHAR2
    ) IS
        v_existing_email NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_existing_email FROM users WHERE email = p_email;
        
        IF v_existing_email > 0 THEN
            p_status := 'FAILED';
            p_message := 'Email already registered';
            RETURN;
        END IF;
        
        p_user_id := seq_user_id.NEXTVAL;
        INSERT INTO users (id, name, email) VALUES (p_user_id, p_name, p_email);
        COMMIT;
        
        p_status := 'SUCCESS';
        p_message := 'User registered successfully';
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_status := 'ERROR';
            p_message := SQLERRM;
    END;

    PROCEDURE pr_add_to_cart(
        p_user_id IN NUMBER,
        p_event_id IN NUMBER,
        p_status OUT VARCHAR2,
        p_message OUT VARCHAR2
    ) IS
        v_reg_count NUMBER;
        v_conflict_count NUMBER;
        v_event_date DATE;
        v_start_time VARCHAR2(10);
        v_end_time VARCHAR2(10);
        v_event_status VARCHAR2(20);
        v_seat_available BOOLEAN;
        v_existing_cart NUMBER;
    BEGIN
        SELECT status, event_date, start_time, end_time
        INTO v_event_status, v_event_date, v_start_time, v_end_time
        FROM events WHERE id = p_event_id;
        
        IF v_event_status != 'ACTIVE' THEN
            p_status := 'FAILED';
            p_message := 'Event is not active';
            RETURN;
        END IF;
        
        SELECT COUNT(*) INTO v_existing_cart FROM cart WHERE user_id = p_user_id AND event_id = p_event_id;
        IF v_existing_cart > 0 THEN
            p_status := 'FAILED';
            p_message := 'Event already in cart';
            RETURN;
        END IF;
        
        v_conflict_count := fn_check_time_conflict(p_user_id, v_event_date, v_start_time, v_end_time);
        IF v_conflict_count > 0 THEN
            p_status := 'FAILED';
            p_message := 'Time conflict with existing registration';
            RETURN;
        END IF;
        
        v_reg_count := fn_get_user_reg_count(p_user_id);
        IF v_reg_count >= 3 THEN
            p_status := 'FAILED';
            p_message := 'Maximum 3 registrations allowed';
            RETURN;
        END IF;
        
        v_seat_available := fn_check_seat_availability(p_event_id);
        IF NOT v_seat_available THEN
            p_status := 'FAILED';
            p_message := 'No seats available';
            RETURN;
        END IF;
        
        INSERT INTO cart (id, user_id, event_id)
        VALUES (seq_cart_id.NEXTVAL, p_user_id, p_event_id);
        
        COMMIT;
        p_status := 'SUCCESS';
        p_message := 'Added to cart successfully';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            ROLLBACK;
            p_status := 'FAILED';
            p_message := 'Event not found';
        WHEN OTHERS THEN
            ROLLBACK;
            p_status := 'ERROR';
            p_message := SQLERRM;
    END;

    PROCEDURE pr_checkout(
        p_user_id IN NUMBER,
        p_payment_method IN VARCHAR2,
        p_status OUT VARCHAR2,
        p_message OUT VARCHAR2
    ) IS
        CURSOR cart_cursor IS
            SELECT c.id as cart_id, e.id as event_id, e.name, e.price
            FROM cart c JOIN events e ON c.event_id = e.id
            WHERE c.user_id = p_user_id;
        
        v_reg_count NUMBER;
        v_cart_count NUMBER;
        v_total_amount NUMBER := 0;
    BEGIN
        v_reg_count := fn_get_user_reg_count(p_user_id);
        SELECT COUNT(*) INTO v_cart_count FROM cart WHERE user_id = p_user_id;
        
        IF v_reg_count + v_cart_count > 3 THEN
            p_status := 'FAILED';
            p_message := 'Maximum 3 registrations allowed';
            RETURN;
        END IF;
        
        FOR cart_item IN cart_cursor LOOP
            v_total_amount := v_total_amount + cart_item.price;
        END LOOP;
        
        FOR cart_item IN cart_cursor LOOP
            UPDATE events SET registered_seats = registered_seats + 1 WHERE id = cart_item.event_id;
            INSERT INTO registrations (id, user_id, event_id, payment_status, payment_method, amount_paid)
            VALUES (seq_registration_id.NEXTVAL, p_user_id, cart_item.event_id, 'COMPLETED', p_payment_method, cart_item.price);
            DELETE FROM cart WHERE id = cart_item.cart_id;
        END LOOP;
        
        COMMIT;
        p_status := 'SUCCESS';
        p_message := 'Payment successful. Total: ' || v_total_amount;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_status := 'ERROR';
            p_message := SQLERRM;
    END;

END pkg_event_registration;
/

-- ============================================
-- PART 10: ADDITIONAL UTILITY FUNCTIONS
-- ============================================

-- Payment Simulation Function
CREATE OR REPLACE FUNCTION fn_simulate_payment(
    p_method IN VARCHAR2,
    p_amount IN NUMBER
) RETURN VARCHAR2
IS
    v_random NUMBER;
BEGIN
    v_random := DBMS_RANDOM.VALUE(1, 100);
    
    IF v_random <= 90 THEN
        RETURN 'SUCCESS';
    ELSE
        RETURN 'FAILED';
    END IF;
END;
/

-- ============================================
-- QUERY EXAMPLES FOR DEMONSTRATION
-- ============================================

-- 1. Show all active events with fill percentage
SELECT event_name, event_date, total_seats, registered_seats, fill_percentage 
FROM admin_dashboard_view 
WHERE fill_percentage < 100;

-- 2. Top 5 users by registrations
SELECT * FROM user_registration_summary 
WHERE total_registrations > 0 
ORDER BY total_registrations DESC 
FETCH FIRST 5 ROWS ONLY;

-- 3. Events with time conflicts (self-join example)
SELECT e1.name as event1, e2.name as event2, e1.event_date
FROM events e1, events e2
WHERE e1.id < e2.id
AND e1.event_date = e2.event_date
AND e1.start_time < e2.end_time 
AND e2.start_time < e1.end_time;

-- 4. Users with pending cart items
SELECT u.name, u.email, COUNT(c.id) as cart_items
FROM users u
LEFT JOIN cart c ON u.id = c.user_id
GROUP BY u.name, u.email
HAVING COUNT(c.id) > 0;

-- 5. Revenue report by month
SELECT 
    TO_CHAR(registration_date, 'YYYY-MM') as month,
    COUNT(*) as total_registrations,
    SUM(amount_paid) as total_revenue
FROM registrations
WHERE payment_status = 'COMPLETED'
GROUP BY TO_CHAR(registration_date, 'YYYY-MM')
ORDER BY month DESC;

-- 6. Event cancellation rate
SELECT 
    e.name,
    COUNT(r.id) as total_attempts,
    SUM(CASE WHEN r.registration_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    ROUND(AVG(CASE WHEN r.registration_status = 'CANCELLED' THEN 100 ELSE 0 END), 2) as cancellation_rate
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.name;

-- 7. User registration trend
SELECT 
    u.name,
    COUNT(r.id) as registrations,
    LISTAGG(e.name, ', ') WITHIN GROUP (ORDER BY e.event_date) as events_registered
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id
LEFT JOIN events e ON r.event_id = e.id
GROUP BY u.name;