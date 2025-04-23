const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET всех материалов
router.get('/', (req, res) => {
  db.all('SELECT * FROM Materials', [], (err, rows) => {
    if (err) {
      console.error('Error fetching materials:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET материала по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Materials WHERE Material_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching material:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(row);
  });
});

// POST создание нового материала
router.post('/', (req, res) => {
  const { 
    name, 
    quantity, 
    unitCost, 
    totalCost, 
    lastReplenishmentDate,
    location,
    supplier,
    status
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Material name is required' });
  }
  
  // Расчет общей стоимости, если не указана
  const calculatedTotalCost = totalCost || (quantity * unitCost);
  
  const sql = `
    INSERT INTO Materials (
      Name, 
      Quantity, 
      Unit_Cost, 
      Total_Cost, 
      Last_Replenishment_Date, 
      Location, 
      Supplier, 
      Status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    name, 
    quantity || 0, 
    unitCost || 0, 
    calculatedTotalCost || 0, 
    lastReplenishmentDate, 
    location, 
    supplier, 
    status || 'В наличии'
  ], function(err) {
    if (err) {
      console.error('Error creating material:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Material created successfully',
      materialId: this.lastID 
    });
  });
});

// PUT обновление материала
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    quantity, 
    unitCost, 
    totalCost, 
    lastReplenishmentDate,
    location,
    supplier,
    status
  } = req.body;
  
  // Валидация обязательных полей
  if (!name) {
    return res.status(400).json({ error: 'Material name is required' });
  }
  
  // Расчет общей стоимости, если не указана
  const calculatedTotalCost = totalCost || (quantity * unitCost);
  
  const sql = `
    UPDATE Materials 
    SET Name = ?, 
        Quantity = ?, 
        Unit_Cost = ?, 
        Total_Cost = ?, 
        Last_Replenishment_Date = ?, 
        Location = ?, 
        Supplier = ?, 
        Status = ?
    WHERE Material_ID = ?
  `;
  
  db.run(sql, [
    name, 
    quantity || 0, 
    unitCost || 0, 
    calculatedTotalCost || 0, 
    lastReplenishmentDate, 
    location, 
    supplier, 
    status || 'В наличии', 
    id
  ], function(err) {
    if (err) {
      console.error('Error updating material:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ message: 'Material updated successfully' });
  });
});

// DELETE удаление материала
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Materials WHERE Material_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting material:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ message: 'Material deleted successfully' });
  });
});

// POST импорт материалов из Excel
router.post('/import', (req, res) => {
  const { materials } = req.body;
  
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: 'No materials data provided or invalid format' });
  }
  
  // Начинаем транзакцию
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Materials (
        Name, 
        Quantity, 
        Unit_Cost, 
        Total_Cost, 
        Last_Replenishment_Date, 
        Location, 
        Supplier, 
        Status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    materials.forEach(item => {
      if (!item.name) {
        errorCount++;
        return; // Пропускаем эту запись
      }
      
      // Расчет общей стоимости, если не указана
      const quantity = item.quantity || 0;
      const unitCost = item.unitCost || 0;
      const totalCost = item.totalCost || (quantity * unitCost);
      
      try {
        stmt.run(
          item.name,
          quantity,
          unitCost,
          totalCost,
          item.lastReplenishmentDate || null,
          item.location || '',
          item.supplier || '',
          item.status || 'В наличии'
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting material:', err);
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