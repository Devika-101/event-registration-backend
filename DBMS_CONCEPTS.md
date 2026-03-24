\# DBMS Concepts Implemented in Event Registration System



\## 1. Database Tables with Constraints

\- \*\*Users\*\*: Stores user information (PRIMARY KEY, UNIQUE email)

\- \*\*Events\*\*: Event details (PRIMARY KEY, CHECK constraints for seats)

\- \*\*Registrations\*\*: User-event registrations (FOREIGN KEYS, UNIQUE constraint)

\- \*\*Cart\*\*: Temporary cart items (FOREIGN KEYS)

\- \*\*Audit\*\*: Tracks all changes (for logging)



\## 2. PL/SQL Functions

\- `fn\_check\_time\_conflict()` - Validates no overlapping events

\- `fn\_get\_user\_reg\_count()` - Counts user registrations (max 3)

\- `fn\_event\_fill\_percentage()` - Calculates how full an event is

\- `fn\_check\_seat\_availability()` - Verifies seats are available

\- `fn\_total\_revenue()` - Calculates total earnings



\## 3. Stored Procedures

\- `pr\_register\_user()` - Creates new user with validation

\- `pr\_add\_to\_cart()` - Adds event to cart with conflict checking

\- `pr\_checkout()` - Processes payment and confirms registration

\- `pr\_cancel\_registration()` - Cancels registration with refund

\- `pr\_get\_user\_dashboard()` - Returns user data using cursors



\## 4. Triggers

\- \*\*Seat Update Trigger\*\*: Automatically updates seat count when registration added

\- \*\*Audit Trigger\*\*: Logs all registration status changes

\- \*\*Seat Overflow Prevention\*\*: Prevents exceeding capacity

\- \*\*Waitlist Trigger\*\*: Auto-adds to waitlist when event fills

\- \*\*Duplicate Prevention\*\*: Prevents adding same event to cart twice



\## 5. Cursors

\- \*\*Explicit Cursor\*\* in `pr\_process\_daily\_reports` - Processes multiple events

\- \*\*Implicit Cursors\*\* in checkout procedure - Handles multiple cart items



\## 6. Views

\- `admin\_dashboard\_view` - Event statistics for admin

\- `user\_registration\_summary` - User registration overview

\- `event\_popularity\_view` - Rankings with RANK() and DENSE\_RANK()



\## 7. Package

\- `pkg\_event\_registration` - Groups all related functions and procedures



\## 8. Transactions

\- COMMIT and ROLLBACK in all procedures

\- Error handling with EXCEPTION blocks



\## Business Rules Enforced:

\- ✅ Maximum 3 registrations per user

\- ✅ No simultaneous event registrations

\- ✅ Seat allocation only after payment

\- ✅ 50% rule for extra registrations

\- ✅ Payment simulation (90% success rate)

