const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Проверка существования директории для базы данных
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Подключение к базе данных SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // Создание таблиц
  createTables();
});

// Функция для создания всех необходимых таблиц
function createTables() {
  // Таблица сотрудников
  db.run(`
    CREATE TABLE IF NOT EXISTS Employees (
      Employee_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Photo BLOB,
      Full_Name TEXT NOT NULL,
      Position TEXT,
      Department TEXT,
      Contact_Details TEXT,
      Work_Schedule TEXT,
      Status TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Employees table:', err);
    } else {
      console.log('Employees table created or already exists');
    }
  });
  
  // Таблица оборудования
  db.run(`
    CREATE TABLE IF NOT EXISTS Equipment (
      Equipment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Type TEXT,
      Manufacturer TEXT,
      Model TEXT,
      Inventory_Number TEXT,
      Commission_Date TEXT,
      Responsible_Employee_ID INTEGER,
      Condition TEXT DEFAULT 'Рабочее',
      Location TEXT,
      FOREIGN KEY (Responsible_Employee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Equipment table:', err);
    } else {
      console.log('Equipment table created or already exists');
    }
  });
  
  // Таблица транспорта
  db.run(`
    CREATE TABLE IF NOT EXISTS Transportation (
      Transport_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Image BLOB,
      Brand TEXT NOT NULL,
      BrandLogo TEXT,
      Model TEXT NOT NULL,
      Year INTEGER,
      LicenseNumber TEXT,
      Purpose TEXT,
      FuelType TEXT,
      TransmissionType TEXT,
      TechnicalCondition TEXT DEFAULT 'Исправен',
      AssignedEmployee_ID INTEGER,
      LastMaintenance TEXT,
      FOREIGN KEY (AssignedEmployee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Transportation table:', err);
    } else {
      console.log('Transportation table created or already exists');
    }
  });
  
  // Таблица инструментов
  db.run(`
    CREATE TABLE IF NOT EXISTS Tools (
      Tool_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Category TEXT,
      Quantity INTEGER DEFAULT 1,
      Location TEXT,
      Responsible_Employee_ID INTEGER,
      Last_Check_Date TEXT,
      FOREIGN KEY (Responsible_Employee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Tools table:', err);
    } else {
      console.log('Tools table created or already exists');
    }
  });
  
  // Таблица запчастей
  db.run(`
    CREATE TABLE IF NOT EXISTS Spares (
      Spare_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Quantity INTEGER DEFAULT 0,
      Unit_Cost REAL DEFAULT 0,
      Total_Cost REAL DEFAULT 0,
      Last_Replenishment_Date TEXT,
      Location TEXT,
      Supplier TEXT,
      Status TEXT DEFAULT 'В наличии'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Spares table:', err);
    } else {
      console.log('Spares table created or already exists');
    }
  });
  
  // Таблица материалов
  db.run(`
    CREATE TABLE IF NOT EXISTS Materials (
      Material_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Quantity INTEGER DEFAULT 0,
      Unit_Cost REAL DEFAULT 0,
      Total_Cost REAL DEFAULT 0,
      Last_Replenishment_Date TEXT,
      Location TEXT,
      Supplier TEXT,
      Status TEXT DEFAULT 'В наличии'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Materials table:', err);
    } else {
      console.log('Materials table created or already exists');
    }
  });
}

module.exports = db;