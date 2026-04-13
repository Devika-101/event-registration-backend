const db = require('./database');

console.log("=".repeat(60));
console.log("DATABASE SCHEMA - Event Registration System");
console.log("=".repeat(60));

// Show all tables
console.log("\n📋 TABLES IN DATABASE:");
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], (err, tables) => {
    if (err) {
        console.error("Error:", err);
        return;
    }
    
    tables.forEach(table => {
        console.log(`   ✓ ${table.name}`);
    });
    
    // Show schema for each table
    console.log("\n📝 TABLE STRUCTURES:");
    db.all("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;", [], (err, schemas) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        
        schemas.forEach(schema => {
            console.log(`\n--- ${schema.name} ---`);
            console.log(schema.sql);
        });
        
        // Show sample data count
        console.log("\n📊 DATA COUNTS:");
        const tables = ['users', 'events', 'registrations', 'cart'];
        let completed = 0;
        
        tables.forEach(table => {
            db.all(`SELECT COUNT(*) as count FROM ${table}`, [], (err, result) => {
                if (!err && result) {
                    console.log(`   ${table}: ${result[0].count} records`);
                }
                completed++;
                if (completed === tables.length) {
                    console.log("\n✅ Database schema verification complete!");
                    db.close();
                }
            });
        });
    });
});