const db = require('./database');

console.log("=".repeat(60));
console.log("DATABASE DATA - Event Registration System");
console.log("=".repeat(60));

// Show Users
console.log("\n👥 USERS:");
db.all("SELECT * FROM users", [], (err, users) => {
    if (err) console.error(err);
    if (users.length === 0) {
        console.log("   No users yet");
    } else {
        console.table(users);
    }
    
    // Show Events
    console.log("\n🎉 EVENTS:");
    db.all("SELECT * FROM events", [], (err, events) => {
        if (err) console.error(err);
        if (events.length === 0) {
            console.log("   No events found");
        } else {
            events.forEach(event => {
                const fillPercent = (event.registered_seats / event.total_seats * 100).toFixed(2);
                console.log(`   ${event.id}. ${event.name}`);
                console.log(`      Date: ${event.date} | Time: ${event.start_time}-${event.end_time}`);
                console.log(`      Seats: ${event.registered_seats}/${event.total_seats} (${fillPercent}% full)`);
                console.log(`      Price: ₹${event.price}`);
                console.log();
            });
        }
        
        // Show Registrations
        console.log("📝 REGISTRATIONS:");
        db.all(`SELECT r.*, u.name as user_name, e.name as event_name 
                FROM registrations r 
                LEFT JOIN users u ON r.user_id = u.id 
                LEFT JOIN events e ON r.event_id = e.id`, [], (err, regs) => {
            if (err) console.error(err);
            if (regs.length === 0) {
                console.log("   No registrations yet");
            } else {
                console.table(regs);
            }
            
            // Show Cart
            console.log("\n🛒 CART ITEMS:");
            db.all(`SELECT c.*, u.name as user_name, e.name as event_name 
                    FROM cart c 
                    LEFT JOIN users u ON c.user_id = u.id 
                    LEFT JOIN events e ON c.event_id = e.id`, [], (err, cart) => {
                if (err) console.error(err);
                if (cart.length === 0) {
                    console.log("   Cart is empty");
                } else {
                    console.table(cart);
                }
                
                console.log("\n✅ Data verification complete!");
                db.close();
            });
        });
    });
});