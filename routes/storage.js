const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Создание таблицы для хранения локаций, если она не существует
db.run(`
  CREATE TABLE IF NOT EXISTS storage_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating storage_locations table:', err.message);
  } else {
    console.log('Storage locations table ready');
  }
});

// Get all storage locations for tools
router.get('/tools', (req, res) => {
  // Получаем локации из таблицы storage_locations
  const sql = `
    SELECT id, name, description
    FROM storage_locations
    WHERE type = 'tools'
  `;
  
  db.all(sql, [], (err, locations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Получаем количество инструментов в каждой локации
    const countPromises = locations.map(location => {
      return new Promise((resolve, reject) => {
        const countSql = `
          SELECT COUNT(*) as itemCount
          FROM tools
          WHERE Location = ?
        `;
        db.get(countSql, [location.name], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ...location,
            itemCount: result ? result.itemCount : 0
          });
        });
      });
    });
    
    Promise.all(countPromises)
      .then(locationsWithCount => {
        res.json(locationsWithCount);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Get all storage locations for spares
router.get('/spares', (req, res) => {
  const sql = `
    SELECT id, name, description
    FROM storage_locations
    WHERE type = 'spares'
  `;
  
  db.all(sql, [], (err, locations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const countPromises = locations.map(location => {
      return new Promise((resolve, reject) => {
        const countSql = `
          SELECT COUNT(*) as itemCount
          FROM spares
          WHERE Location = ?
        `;
        db.get(countSql, [location.name], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ...location,
            itemCount: result ? result.itemCount : 0
          });
        });
      });
    });
    
    Promise.all(countPromises)
      .then(locationsWithCount => {
        res.json(locationsWithCount);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Get all storage locations for materials
router.get('/materials', (req, res) => {
  const sql = `
    SELECT id, name, description
    FROM storage_locations
    WHERE type = 'materials'
  `;
  
  db.all(sql, [], (err, locations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const countPromises = locations.map(location => {
      return new Promise((resolve, reject) => {
        const countSql = `
          SELECT COUNT(*) as itemCount
          FROM materials
          WHERE Location = ?
        `;
        db.get(countSql, [location.name], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ...location,
            itemCount: result ? result.itemCount : 0
          });
        });
      });
    });
    
    Promise.all(countPromises)
      .then(locationsWithCount => {
        res.json(locationsWithCount);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Get all storage locations for equipment
router.get('/equipment', (req, res) => {
  const sql = `
    SELECT id, name, description
    FROM storage_locations
    WHERE type = 'equipment'
  `;
  
  db.all(sql, [], (err, locations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const countPromises = locations.map(location => {
      return new Promise((resolve, reject) => {
        const countSql = `
          SELECT COUNT(*) as itemCount
          FROM equipment
          WHERE Location = ?
        `;
        db.get(countSql, [location.name], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ...location,
            itemCount: result ? result.itemCount : 0
          });
        });
      });
    });
    
    Promise.all(countPromises)
      .then(locationsWithCount => {
        res.json(locationsWithCount);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Add a new storage location for tools
router.post('/tools', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    INSERT INTO storage_locations (name, description, type)
    VALUES (?, ?, 'tools')
  `;
  
  db.run(sql, [name, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      name,
      description,
      itemCount: 0
    });
  });
});

// Add a new storage location for spares
router.post('/spares', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    INSERT INTO storage_locations (name, description, type)
    VALUES (?, ?, 'spares')
  `;
  
  db.run(sql, [name, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      name,
      description,
      itemCount: 0
    });
  });
});

// Add a new storage location for materials
router.post('/materials', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    INSERT INTO storage_locations (name, description, type)
    VALUES (?, ?, 'materials')
  `;
  
  db.run(sql, [name, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      name,
      description,
      itemCount: 0
    });
  });
});

// Add a new storage location for equipment
router.post('/equipment', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    INSERT INTO storage_locations (name, description, type)
    VALUES (?, ?, 'equipment')
  `;
  
  db.run(sql, [name, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      name,
      description,
      itemCount: 0
    });
  });
});

// Update a storage location
router.put('/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    UPDATE storage_locations
    SET name = ?, description = ?
    WHERE id = ? AND type = ?
  `;
  
  db.run(sql, [name, description, id, type], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      id: parseInt(id),
      name,
      description,
      itemCount: 0 // Это значение будет обновлено при следующем получении списка
    });
  });
});

// Delete a storage location
router.delete('/:type/:id', (req, res) => {
  const { type, id } = req.params;
  
  const sql = `
    DELETE FROM storage_locations
    WHERE id = ? AND type = ?
  `;
  
  db.run(sql, [id, type], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ success: true });
  });
});

module.exports = router;