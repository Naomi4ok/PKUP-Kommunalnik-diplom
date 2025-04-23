const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET всего оборудования
router.get('/', (req, res) => {
  db.all('SELECT * FROM Equipment', [], (err, rows) => {
    if (err) {
      console.error('Error fetching equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET оборудования по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Equipment WHERE Equipment_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(row);
  });
});

// POST создание нового оборудования
router.post('/', (req, res) => {
  const { 
    name, 
    type, 
    manufacturer, 
    model, 
    inventoryNumber,
    commissionDate,
    responsibleEmployeeId,
    condition,
    location
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Equipment name is required' });
  }
  
  const sql = `
    INSERT INTO Equipment (
      Name, 
      Type, 
      Manufacturer, 
      Model, 
      Inventory_Number, 
      Commission_Date, 
      Responsible_Employee_ID, 
      Condition, 
      Location
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    name, 
    type, 
    manufacturer, 
    model, 
    inventoryNumber, 
    commissionDate, 
    responsibleEmployeeId, 
    condition || 'Рабочее', 
    location
  ], function(err) {
    if (err) {
      console.error('Error creating equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Equipment created successfully',
      equipmentId: this.lastID 
    });
  });
});

// PUT обновление оборудования
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    type, 
    manufacturer, 
    model, 
    inventoryNumber,
    commissionDate,
    responsibleEmployeeId,
    condition,
    location
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Equipment name is required' });
  }
  
  const sql = `
    UPDATE Equipment 
    SET Name = ?, 
        Type = ?, 
        Manufacturer = ?, 
        Model = ?, 
        Inventory_Number = ?, 
        Commission_Date = ?, 
        Responsible_Employee_ID = ?, 
        Condition = ?, 
        Location = ?
    WHERE Equipment_ID = ?
  `;
  
  db.run(sql, [
    name, 
    type, 
    manufacturer, 
    model, 
    inventoryNumber, 
    commissionDate, 
    responsibleEmployeeId, 
    condition || 'Рабочее', 
    location, 
    id
  ], function(err) {
    if (err) {
      console.error('Error updating equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment updated successfully' });
  });
});

// DELETE удаление оборудования
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Equipment WHERE Equipment_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment deleted successfully' });
  });
});

// POST импорт оборудования из Excel
router.post('/import', (req, res) => {
  const { equipment } = req.body;
  
  if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
    return res.status(400).json({ error: 'No equipment data provided or invalid format' });
  }
  
  // Начинаем транзакцию, чтобы все вставки завершились успешно или неудачно вместе
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Equipment (
        Name, 
        Type, 
        Manufacturer, 
        Model, 
        Inventory_Number, 
        Commission_Date, 
        Responsible_Employee_ID, 
        Condition, 
        Location
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    equipment.forEach(item => {
      if (!item.name) {
        errorCount++;
        return; // Пропускаем эту запись
      }
      
      try {
        stmt.run(
          item.name,
          item.type || '',
          item.manufacturer || '',
          item.model || '',
          item.inventoryNumber || '',
          item.commissionDate || null,
          item.responsibleEmployeeId || null,
          item.condition || 'Рабочее',
          item.location || ''
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting equipment:', err);
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