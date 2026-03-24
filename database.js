const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'events.db'));

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);

  // Events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      total_seats INTEGER NOT NULL,
      registered_seats INTEGER DEFAULT 0,
      price REAL NOT NULL
    )
  `);

  // Registrations table (confirmed payments)
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed',
      payment_status TEXT DEFAULT 'completed',
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(user_id, event_id)
    )
  `);

  // Cart table (pending registrations)
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(user_id, event_id)
    )
  `);

  // Insert sample events
  const sampleEvents = [
    ['Tech Conference 2024', '2024-12-15', '10:00', '17:00', 100, 0, 50],
    ['Workshop: Web Development', '2024-12-15', '10:00', '13:00', 50, 0, 25],
    ['Networking Dinner', '2024-12-15', '18:00', '21:00', 80, 0, 40],
    ['AI Summit', '2024-12-16', '09:00', '18:00', 120, 0, 75],
    ['Startup Pitch Event', '2024-12-16', '14:00', '17:00', 60, 0, 30]
  ];

  sampleEvents.forEach(event => {
    db.run(
      `INSERT OR IGNORE INTO events (name, date, start_time, end_time, total_seats, registered_seats, price) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      event
    );
  });
});

module.exports = db;