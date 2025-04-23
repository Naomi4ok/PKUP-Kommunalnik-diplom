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
      ProcessId INTEGER,
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

  // Create Processes Table for task categories
  db.run(`
    CREATE TABLE IF NOT EXISTS Processes (
      Process_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Description TEXT,
      Color TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Processes table:', err);
    } else {
      console.log('Processes table created or already exists');
      insertDefaultProcesses();
    }
  });
}

// Insert default processes if the table is empty
function insertDefaultProcesses() {
  db.get('SELECT COUNT(*) as count FROM Processes', [], (err, row) => {
    if (err) {
      console.error('Error checking Processes table:', err);
      return;
    }

    if (row.count === 0) {
      const defaultProcesses = [
        { name: 'Канализация', description: 'Обслуживание канализационных систем', color: '#1890ff' },
        { name: 'Дороги', description: 'Ремонт и обслуживание дорог', color: '#fa8c16' },
        { name: 'Уборка', description: 'Уборка территорий', color: '#52c41a' },
        { name: 'Вывоз мусора', description: 'Вывоз и утилизация отходов', color: '#722ed1' }
      ];

      const stmt = db.prepare('INSERT INTO Processes (Name, Description, Color) VALUES (?, ?, ?)');
      
      defaultProcesses.forEach(process => {
        stmt.run(process.name, process.description, process.color);
      });
      
      stmt.finalize();
      console.log('Default processes inserted');
    }
  });
}

module.exports = {
  createScheduleTable
};