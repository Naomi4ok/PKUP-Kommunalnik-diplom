const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET всех расходов
// Добавляем поддержку фильтрации по датам в основной endpoint
router.get('/', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let sql = 'SELECT * FROM Expenses';
  const conditions = [];
  const params = [];
  
  if (startDate) {
    conditions.push('Date >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    conditions.push('Date <= ?');
    params.push(endDate);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY Date DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET конкретного расхода
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Expenses WHERE Expense_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching expense:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(row);
  });
});

// POST создание нового расхода
router.post('/', (req, res) => {
  const { 
    resourceType,
    resourceId,
    amount,
    description,
    date,
    category,
    paymentMethod,
    invoiceNumber
  } = req.body;
  
  // Валидация обязательных полей
  if (!resourceType || !resourceId || !amount || !date || !category) {
    return res.status(400).json({ 
      error: 'Required fields missing: resource type, resource ID, amount, date and category are required' 
    });
  }
  
  const sql = `
    INSERT INTO Expenses (
      Resource_Type, 
      Resource_ID, 
      Amount, 
      Description, 
      Date, 
      Category, 
      Payment_Method, 
      Invoice_Number,
      Created_By
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    resourceType,
    resourceId,
    amount,
    description || '',
    date,
    category,
    paymentMethod || '',
    invoiceNumber || '',
    null  // убран идентификатор пользователя из токена
  ], function(err) {
    if (err) {
      console.error('Error creating expense:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Expense created successfully',
      expenseId: this.lastID 
    });
  });
});

// PUT обновление расхода
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    resourceType,
    resourceId,
    amount,
    description,
    date,
    category,
    paymentMethod,
    invoiceNumber
  } = req.body;
  
  // Валидация обязательных полей
  if (!resourceType || !resourceId || !amount || !date || !category) {
    return res.status(400).json({ 
      error: 'Required fields missing: resource type, resource ID, amount, date and category are required' 
    });
  }
  
  const sql = `
    UPDATE Expenses 
    SET Resource_Type = ?, 
        Resource_ID = ?, 
        Amount = ?, 
        Description = ?, 
        Date = ?, 
        Category = ?, 
        Payment_Method = ?, 
        Invoice_Number = ?
    WHERE Expense_ID = ?
  `;
  
  db.run(sql, [
    resourceType,
    resourceId,
    amount,
    description || '',
    date,
    category,
    paymentMethod || '',
    invoiceNumber || '',
    id
  ], function(err) {
    if (err) {
      console.error('Error updating expense:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found or no changes made' });
    }
    
    res.json({ 
      message: 'Expense updated successfully',
      expenseId: id
    });
  });
});

// DELETE удаление расхода
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Expenses WHERE Expense_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting expense:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ 
      message: 'Expense deleted successfully',
      expenseId: id
    });
  });
});

// GET получение категорий расходов
router.get('/categories/all', (req, res) => {
  db.all('SELECT * FROM Expense_Categories', [], (err, rows) => {
    if (err) {
      console.error('Error fetching expense categories:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// POST создание новой категории расходов
router.post('/categories', (req, res) => {
  const { name, description, parentCategoryId } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  // Проверка на дублирование имени категории
  db.get('SELECT * FROM Expense_Categories WHERE Name = ?', [name], (err, row) => {
    if (err) {
      console.error('Error checking category existence:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    
    // Добавление новой категории
    const sql = `
      INSERT INTO Expense_Categories (Name, Description, Parent_Category_ID)
      VALUES (?, ?, ?)
    `;
    
    db.run(sql, [name, description, parentCategoryId], function(err) {
      if (err) {
        console.error('Error creating category:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({ 
        message: 'Category created successfully',
        categoryId: this.lastID 
      });
    });
  });
});

// GET для инициализации категорий (для тестирования)
router.get('/categories/initialize', (req, res) => {
  const categories = [
    { name: 'Зарплата', description: 'Расходы на зарплаты сотрудников' },
    { name: 'Техобслуживание', description: 'Расходы на техническое обслуживание' },
    { name: 'Ремонт', description: 'Расходы на ремонтные работы' },
    { name: 'Топливо', description: 'Расходы на топливо для транспорта' },
    { name: 'Закупка', description: 'Закупка новых материалов и запчастей' },
    { name: 'Аренда', description: 'Расходы на аренду оборудования и помещений' },
    { name: 'Сервисное обслуживание', description: 'Регулярное обслуживание' }
  ];
  
  // Очищаем существующие категории перед добавлением новых (осторожно с этим в продакшне)
  db.run('DELETE FROM Expense_Categories', [], (err) => {
    if (err) {
      console.error('Error clearing categories:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Добавляем категории
    const stmt = db.prepare('INSERT INTO Expense_Categories (Name, Description) VALUES (?, ?)');
    let successCount = 0;
    
    categories.forEach(category => {
      stmt.run([category.name, category.description], function(err) {
        if (!err) {
          successCount++;
        }
      });
    });
    
    stmt.finalize(() => {
      res.json({ 
        message: `Successfully initialized ${successCount} categories`,
        categoriesAdded: successCount
      });
    });
  });
});

// Получение суммарных расходов
router.get('/summary/total', (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  
  let sql = 'SELECT ';
  let groupByClause = '';
  
  switch (groupBy) {
    case 'resource_type':
      sql += 'Resource_Type, SUM(Amount) as Total';
      groupByClause = ' GROUP BY Resource_Type';
      break;
    case 'category':
      sql += 'Category, SUM(Amount) as Total';
      groupByClause = ' GROUP BY Category';
      break;
    case 'date':
      sql += 'date(Date) as Day, SUM(Amount) as Total';
      groupByClause = ' GROUP BY Day';
      break;
    case 'month':
      sql += "strftime('%Y-%m', Date) as Month, SUM(Amount) as Total";
      groupByClause = ' GROUP BY Month';
      break;
    default:
      sql += 'SUM(Amount) as Total';
  }
  
  sql += ' FROM Expenses';
  
  const conditions = [];
  const params = [];
  
  if (startDate) {
    conditions.push('Date >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    conditions.push('Date <= ?');
    params.push(endDate);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += groupByClause;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching expense summary:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

module.exports = router;