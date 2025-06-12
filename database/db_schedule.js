const db = require('./db');

// Create Schedule Table
function createScheduleTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Schedule (
      Task_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Date TEXT NOT NULL,
      StartTime TEXT NOT NULL,
      EndTime TEXT NOT NULL,
      EmployeeIds TEXT,
      EquipmentIds TEXT,
      TransportIds TEXT,
      ProcessName TEXT,
      Location TEXT,
      Status TEXT DEFAULT 'scheduled',
      Priority TEXT DEFAULT 'medium',
      Description TEXT,
      Progress INTEGER DEFAULT 0,
      Created_At TEXT DEFAULT CURRENT_TIMESTAMP,
      Updated_At TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Schedule table:', err);
    } else {
      console.log('Schedule table created or already exists');
    }
  });

  // Убираем создание таблицы Processes, так как она больше не нужна
}

module.exports = {
  createScheduleTable
};