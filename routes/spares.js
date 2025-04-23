const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET всех запчастей
router.get('/', (req, res) => {
  db.all('SELECT * FROM Spares', [], (err, rows) => {
    if (err) {
      console.error('Error fetching spares:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET запчасти по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Spares WHERE Spare_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching spare:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json(row);
  });
});

// POST создание новой запчасти
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
    return res.status(400).json({ error: 'Spare part name is required' });
  }
  
  // Расчет общей стоимости, если не указана
  const calculatedTotalCost = totalCost || (quantity * unitCost);
  
  const sql = `
    INSERT INTO Spares (
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
      console.error('Error creating spare part:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Spare part created successfully',
      spareId: this.lastID 
    });
  });
});

// PUT обновление запчасти
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
    return res.status(400).json({ error: 'Spare part name is required' });
  }
  
  // Расчет общей стоимости, если не указана
  const calculatedTotalCost = totalCost || (quantity * unitCost);
  
  const sql = `
    UPDATE Spares 
    SET Name = ?, 
        Quantity = ?, 
        Unit_Cost = ?, 
        Total_Cost = ?, 
        Last_Replenishment_Date = ?, 
        Location = ?, 
        Supplier = ?, 
        Status = ?
    WHERE Spare_ID = ?
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
      console.error('Error updating spare part:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json({ message: 'Spare part updated successfully' });
  });
});

// DELETE удаление запчасти
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Spares WHERE Spare_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting spare part:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json({ message: 'Spare part deleted successfully' });
  });
});

// POST импорт запчастей из Excel
router.post('/import', (req, res) => {
  const { spares } = req.body;
  
  if (!spares || !Array.isArray(spares) || spares.length === 0) {
    return res.status(400).json({ error: 'No spare parts data provided or invalid format' });
  }
  
  // Начинаем транзакцию
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Spares (
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
    
    spares.forEach(item => {
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
        console.error('Error inserting spare part:', err);
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