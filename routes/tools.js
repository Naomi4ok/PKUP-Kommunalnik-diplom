const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET всех инструментов
router.get('/', (req, res) => {
  db.all('SELECT * FROM Tools', [], (err, rows) => {
    if (err) {
      console.error('Error fetching tools:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET инструмента по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Tools WHERE Tool_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json(row);
  });
});

// POST создание нового инструмента
router.post('/', (req, res) => {
  const { 
    name, 
    category, 
    quantity, 
    location, 
    responsibleEmployeeId,
    lastCheckDate
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  const sql = `
    INSERT INTO Tools (
      Name, 
      Category, 
      Quantity, 
      Location, 
      Responsible_Employee_ID, 
      Last_Check_Date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    name, 
    category, 
    quantity || 1, 
    location, 
    responsibleEmployeeId, 
    lastCheckDate
  ], function(err) {
    if (err) {
      console.error('Error creating tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Tool created successfully',
      toolId: this.lastID 
    });
  });
});

// PUT обновление инструмента
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    category, 
    quantity, 
    location, 
    responsibleEmployeeId,
    lastCheckDate
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  const sql = `
    UPDATE Tools 
    SET Name = ?, 
        Category = ?, 
        Quantity = ?, 
        Location = ?, 
        Responsible_Employee_ID = ?, 
        Last_Check_Date = ?
    WHERE Tool_ID = ?
  `;
  
  db.run(sql, [
    name, 
    category, 
    quantity || 1, 
    location, 
    responsibleEmployeeId, 
    lastCheckDate,
    id
  ], function(err) {
    if (err) {
      console.error('Error updating tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json({ message: 'Tool updated successfully' });
  });
});

// DELETE удаление инструмента
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Tools WHERE Tool_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json({ message: 'Tool deleted successfully' });
  });
});

// POST импорт инструментов из Excel
router.post('/import', (req, res) => {
  const { tools } = req.body;
  
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return res.status(400).json({ error: 'No tools data provided or invalid format' });
  }
  
  // Начинаем транзакцию
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Tools (
        Name, 
        Category, 
        Quantity, 
        Location, 
        Responsible_Employee_ID, 
        Last_Check_Date
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    tools.forEach(item => {
      if (!item.name) {
        errorCount++;
        return; // Пропускаем эту запись
      }
      
      try {
        stmt.run(
          item.name,
          item.category || '',
          item.quantity || 1,
          item.location || '',
          item.responsibleEmployeeId || null,
          item.lastCheckDate || null
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting tool:', err);
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