const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'ddbms21',  // CHANGE THIS to your actual PostgreSQL password
    host: 'localhost',
    port: 5432,
    database: 'event_registration'
});

async function test() {
    try {
        console.log('Connecting to PostgreSQL...');
        const result = await pool.query('SELECT * FROM vw_event_stats');
        console.log('✅ SUCCESS! View exists!');
        console.log('Number of events:', result.rows.length);
        console.log('First event:', result.rows[0].event_name);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\nChecking what tables exist instead...');
        try {
            const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
            console.log('Tables in database:', tables.rows.map(r => r.tablename));
        } catch (e) {
            console.error('Cannot connect at all:', e.message);
        }
    }
    await pool.end();
}

test();