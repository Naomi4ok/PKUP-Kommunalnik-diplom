const express = require('express');
const router = express.Router();
const db = require('../database/db');
const upload = require('../middleware/upload');

// GET всех транспортных средств
router.get('/', (req, res) => {
  db.all(`
    SELECT t.*, e.Full_Name as AssignedEmployeeName 
    FROM Transportation t
    LEFT JOIN Employees e ON t.AssignedEmployee_ID = e.Employee_ID
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching transportation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Конвертация BLOB в строки base64 для изображений
    const transportation = rows.map(row => {
      if (row.Image) {
        row.Image = row.Image.toString('base64');
      }
      return row;
    });
    
    res.json(transportation);
  });
});

// GET транспортного средства по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT t.*, e.Full_Name as AssignedEmployeeName 
    FROM Transportation t
    LEFT JOIN Employees e ON t.AssignedEmployee_ID = e.Employee_ID
    WHERE t.Transport_ID = ?
  `, [id], (err, row) => {
    if (err) {
      console.error('Error fetching transportation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Transportation not found' });
    }
    
    // Конвертация BLOB в строку base64 для изображения
    if (row.Image) {
      row.Image = row.Image.toString('base64');
    }
    
    res.json(row);
  });
});

// POST создание нового транспортного средства
router.post('/', upload.single('image'), (req, res) => {
  const { 
    brand,
    brandLogo,
    model,
    year,
    licenseNumber,
    purpose,
    fuelType,
    transmissionType,
    technicalCondition,
    assignedEmployeeId,
    lastMaintenance
  } = req.body;
  
  const image = req.file ? req.file.buffer : null;
  
  // Валидация обязательных полей
  if (!brand || !model) {
    return res.status(400).json({ error: 'Brand and model are required' });
  }
  
  const sql = `
    INSERT INTO Transportation (
      Image,
      Brand,
      BrandLogo,
      Model,
      Year,
      LicenseNumber,
      Purpose,
      FuelType,
      TransmissionType,
      TechnicalCondition,
      AssignedEmployee_ID,
      LastMaintenance
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    image,
    brand,
    brandLogo,
    model,
    year,
    licenseNumber,
    purpose,
    fuelType,
    transmissionType,
    technicalCondition || 'Исправен',
    assignedEmployeeId,
    lastMaintenance
  ], function(err) {
    if (err) {
      console.error('Error creating transportation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Transportation created successfully',
      transportId: this.lastID 
    });
  });
});

// PUT обновление транспортного средства
router.put('/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { 
    brand,
    brandLogo,
    model,
    year,
    licenseNumber,
    purpose,
    fuelType,
    transmissionType,
    technicalCondition,
    assignedEmployeeId,
    lastMaintenance
  } = req.body;
  
  // Валидация обязательных полей
  if (!brand || !model) {
    return res.status(400).json({ error: 'Brand and model are required' });
  }
  
  // Если изображение было загружено, обновляем его; иначе оставляем существующее
  if (req.file) {
    const image = req.file.buffer;
    
    const sql = `
      UPDATE Transportation 
      SET Image = ?,
          Brand = ?,
          BrandLogo = ?,
          Model = ?,
          Year = ?,
          LicenseNumber = ?,
          Purpose = ?,
          FuelType = ?,
          TransmissionType = ?,
          TechnicalCondition = ?,
          AssignedEmployee_ID = ?,
          LastMaintenance = ?
      WHERE Transport_ID = ?
    `;
    
    db.run(sql, [
      image,
      brand,
      brandLogo,
      model,
      year,
      licenseNumber,
      purpose,
      fuelType,
      transmissionType,
      technicalCondition || 'Исправен',
      assignedEmployeeId,
      lastMaintenance,
      id
    ], function(err) {
      if (err) {
        console.error('Error updating transportation:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transportation not found' });
      }
      
      res.json({ message: 'Transportation updated successfully' });
    });
  } else {
    // Обновление без изменения изображения
    const sql = `
      UPDATE Transportation 
      SET Brand = ?,
          BrandLogo = ?,
          Model = ?,
          Year = ?,
          LicenseNumber = ?,
          Purpose = ?,
          FuelType = ?,
          TransmissionType = ?,
          TechnicalCondition = ?,
          AssignedEmployee_ID = ?,
          LastMaintenance = ?
      WHERE Transport_ID = ?
    `;
    
    db.run(sql, [
      brand,
      brandLogo,
      model,
      year,
      licenseNumber,
      purpose,
      fuelType,
      transmissionType,
      technicalCondition || 'Исправен',
      assignedEmployeeId,
      lastMaintenance,
      id
    ], function(err) {
      if (err) {
        console.error('Error updating transportation:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transportation not found' });
      }
      
      res.json({ message: 'Transportation updated successfully' });
    });
  }
});

// DELETE удаление транспортного средства
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Transportation WHERE Transport_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting transportation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transportation not found' });
    }
    
    res.json({ message: 'Transportation deleted successfully' });
  });
});

// POST импорт транспортных средств из Excel
router.post('/import', (req, res) => {
  const { transportation } = req.body;
  
  if (!transportation || !Array.isArray(transportation) || transportation.length === 0) {
    return res.status(400).json({ error: 'No transportation data provided or invalid format' });
  }
  
  // Начинаем транзакцию для обеспечения атомарности операций
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Transportation (
        Brand,
        BrandLogo,
        Model,
        Year,
        LicenseNumber,
        Purpose,
        FuelType,
        TransmissionType,
        TechnicalCondition,
        AssignedEmployee_ID,
        LastMaintenance
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    transportation.forEach(item => {
      if (!item.brand || !item.model) {
        errorCount++;
        return; // Пропускаем эту запись
      }
      
      try {
        stmt.run(
          item.brand,
          item.brandLogo || '',
          item.model,
          item.year || null,
          item.licenseNumber || '',
          item.purpose || '',
          item.fuelType || 'Дизель',
          item.transmissionType || 'Механическая',
          item.technicalCondition || 'Исправен',
          item.assignedEmployeeId || null,
          item.lastMaintenance || null
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting transportation:', err);
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