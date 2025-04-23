const express = require('express');
const router = express.Router();
const db = require('../database/db');
const upload = require('../middleware/upload');

// GET всех сотрудников
router.get('/', (req, res) => {
  db.all('SELECT * FROM Employees', [], (err, rows) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Конвертация BLOB в строки base64 для фотографий
    const employees = rows.map(row => {
      if (row.Photo) {
        row.Photo = row.Photo.toString('base64');
      }
      return row;
    });
    
    res.json(employees);
  });
});

// GET сотрудника по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Employees WHERE Employee_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Конвертация BLOB в строку base64 для фотографии
    if (row.Photo) {
      row.Photo = row.Photo.toString('base64');
    }
    
    res.json(row);
  });
});

// POST создание нового сотрудника
router.post('/', upload.single('photo'), (req, res) => {
  const { fullName, position, department, contactDetails, workSchedule, status } = req.body;
  const photo = req.file ? req.file.buffer : null;
  
  // Валидация обязательных полей
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  
  const sql = `
    INSERT INTO Employees (Photo, Full_Name, Position, Department, Contact_Details, Work_Schedule, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [photo, fullName, position, department, contactDetails, workSchedule, status], function(err) {
    if (err) {
      console.error('Error creating employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Employee created successfully',
      employeeId: this.lastID 
    });
  });
});

// PUT обновление сотрудника
router.put('/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { fullName, position, department, contactDetails, workSchedule, status } = req.body;
  
  // Валидация обязательных полей
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  
  // Если фотография была загружена, обновляем фото; иначе оставляем существующее
  if (req.file) {
    const photo = req.file.buffer;
    
    const sql = `
      UPDATE Employees 
      SET Photo = ?, Full_Name = ?, Position = ?, Department = ?, 
          Contact_Details = ?, Work_Schedule = ?, Status = ?
      WHERE Employee_ID = ?
    `;
    
    db.run(sql, [photo, fullName, position, department, contactDetails, workSchedule, status, id], function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      res.json({ message: 'Employee updated successfully' });
    });
  } else {
    // Обновление без изменения фотографии
    const sql = `
      UPDATE Employees 
      SET Full_Name = ?, Position = ?, Department = ?, 
          Contact_Details = ?, Work_Schedule = ?, Status = ?
      WHERE Employee_ID = ?
    `;
    
    db.run(sql, [fullName, position, department, contactDetails, workSchedule, status, id], function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      res.json({ message: 'Employee updated successfully' });
    });
  }
});

// DELETE удаление сотрудника
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Employees WHERE Employee_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  });
});

// POST импорт сотрудников из Excel
router.post('/import', (req, res) => {
  const { employees } = req.body;
  
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'No employee data provided or invalid format' });
  }
  
  // Начинаем транзакцию, чтобы все вставки завершились успешно или неудачно вместе
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Employees (Full_Name, Position, Department, Contact_Details, Work_Schedule, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    employees.forEach(employee => {
      if (!employee.fullName) {
        errorCount++;
        return; // Пропускаем эту запись
      }
      
      try {
        stmt.run(
          employee.fullName,
          employee.position || '',
          employee.department || '',
          employee.contactDetails || '',
          employee.workSchedule || '',
          employee.status || 'Active'
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting employee:', err);
        errorCount++;
      }
    });
    
    stmt.finalize();
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Import completed',
        imported: successCount,
        failed: errorCount
      });
    });
  });
});

module.exports = router;