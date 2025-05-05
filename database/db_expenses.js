const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// Создание таблицы расходов
function createExpensesTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Expenses (
      Expense_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Resource_Type TEXT NOT NULL, /* 'Employee', 'Equipment', 'Transportation', 'Tool', 'Spare', 'Material' */
      Resource_ID INTEGER NOT NULL,
      Amount REAL NOT NULL,
      Description TEXT,
      Date TEXT NOT NULL,
      Category TEXT NOT NULL,
      Payment_Method TEXT,
      Invoice_Number TEXT,
      Created_By TEXT,
      Created_At TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Expenses table:', err);
    } else {
      console.log('Expenses table created or already exists');
    }
  });
  
  // Создание таблицы категорий расходов
  db.run(`
    CREATE TABLE IF NOT EXISTS Expense_Categories (
      Category_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL UNIQUE,
      Description TEXT,
      Parent_Category_ID INTEGER,
      FOREIGN KEY (Parent_Category_ID) REFERENCES Expense_Categories(Category_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Expense Categories table:', err);
    } else {
      console.log('Expense Categories table created or already exists');
      
      // Добавление базовых категорий если таблица была только что создана
      addDefaultCategories();
    }
  });
}

// Добавление базовых категорий расходов
function addDefaultCategories() {
  const categories = [
    { name: 'Зарплата', description: 'Расходы на зарплаты сотрудников' },
    { name: 'Техобслуживание', description: 'Расходы на техническое обслуживание' },
    { name: 'Ремонт', description: 'Расходы на ремонтные работы' },
    { name: 'Топливо', description: 'Расходы на топливо для транспорта' },
    { name: 'Закупка', description: 'Закупка новых материалов и запчастей' },
    { name: 'Аренда', description: 'Расходы на аренду оборудования и помещений' },
    { name: 'Сервисное обслуживание', description: 'Регулярное обслуживание' }
  ];
  
  db.get('SELECT COUNT(*) as count FROM Expense_Categories', [], (err, row) => {
    if (err) {
      console.error('Error checking category count:', err);
      return;
    }
    
    // Если таблица пуста - добавляем стандартные категории
    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO Expense_Categories (Name, Description) VALUES (?, ?)');
      
      categories.forEach(category => {
        stmt.run([category.name, category.description]);
      });
      
      stmt.finalize();
      console.log('Default expense categories added');
    }
  });
}

module.exports = {
  createExpensesTable
};