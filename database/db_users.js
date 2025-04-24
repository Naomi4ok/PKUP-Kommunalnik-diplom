const db = require('./db');
const bcrypt = require('bcrypt');

// Create Users Table
function createUsersTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      Password TEXT NOT NULL,
      Full_Name TEXT,
      Role TEXT DEFAULT 'user',
      Email TEXT,
      Avatar BLOB,
      Last_Login TEXT,
      Created_At TEXT DEFAULT CURRENT_TIMESTAMP,
      Status TEXT DEFAULT 'active'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Users table:', err);
    } else {
      console.log('Users table created or already exists');
      checkAndCreateAdminUser();
    }
  });
}

// Create a default admin user if no users exist
function checkAndCreateAdminUser() {
  db.get('SELECT COUNT(*) as count FROM Users', [], async (err, row) => {
    if (err) {
      console.error('Error checking Users table:', err);
      return;
    }

    if (row.count === 0) {
      try {
        // Create a default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
          'INSERT INTO Users (Username, Password, Full_Name, Role) VALUES (?, ?, ?, ?)',
          ['admin', hashedPassword, 'Администратор', 'admin'],
          (err) => {
            if (err) {
              console.error('Error creating default admin user:', err);
            } else {
              console.log('Default admin user created with username: admin and password: admin123');
            }
          }
        );
      } catch (error) {
        console.error('Error hashing password:', error);
      }
    }
  });
}

module.exports = {
  createUsersTable
};