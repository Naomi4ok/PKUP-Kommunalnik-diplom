const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all storage locations for tools
router.get('/tools', (req, res) => {
  const sql = `
    SELECT 
      DISTINCT Location as name, 
      Location as description,
      COUNT(*) as itemCount
    FROM tools 
    WHERE Location IS NOT NULL AND Location != '' 
    GROUP BY Location
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Transform to expected format with IDs
    const locations = rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      description: row.description || row.name,
      itemCount: row.itemCount
    }));
    
    res.json(locations);
  });
});

// Get all storage locations for spares
router.get('/spares', (req, res) => {
  const sql = `
    SELECT 
      DISTINCT Location as name, 
      Location as description,
      COUNT(*) as itemCount
    FROM spares 
    WHERE Location IS NOT NULL AND Location != '' 
    GROUP BY Location
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Transform to expected format with IDs
    const locations = rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      description: row.description || row.name,
      itemCount: row.itemCount
    }));
    
    res.json(locations);
  });
});

// Get all storage locations for materials
router.get('/materials', (req, res) => {
  const sql = `
    SELECT 
      DISTINCT Location as name, 
      Location as description,
      COUNT(*) as itemCount
    FROM materials 
    WHERE Location IS NOT NULL AND Location != '' 
    GROUP BY Location
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Transform to expected format with IDs
    const locations = rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      description: row.description || row.name,
      itemCount: row.itemCount
    }));
    
    res.json(locations);
  });
});

// Get all storage locations for equipment
router.get('/equipment', (req, res) => {
  const sql = `
    SELECT 
      DISTINCT Location as name, 
      Location as description,
      COUNT(*) as itemCount
    FROM equipment 
    WHERE Location IS NOT NULL AND Location != '' 
    GROUP BY Location
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Transform to expected format with IDs
    const locations = rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      description: row.description || row.name,
      itemCount: row.itemCount
    }));
    
    res.json(locations);
  });
});

// Add a new storage location for tools
router.post('/tools', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // In a real implementation, you'd add this to a storage_locations table
  // For now, we'll just return success with a mock ID
  res.json({
    id: Date.now(),
    name,
    description,
    itemCount: 0
  });
});

// Similar routes for adding spares, materials, and equipment locations
router.post('/spares', (req, res) => {
  // Similar implementation
});

router.post('/materials', (req, res) => {
  // Similar implementation
});

router.post('/equipment', (req, res) => {
  // Similar implementation
});

// Update a storage location
router.put('/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // In a real implementation, you'd update the storage_locations table
  // For now, just return success
  res.json({
    id: parseInt(id),
    name,
    description,
    type
  });
});

// Delete a storage location
router.delete('/:type/:id', (req, res) => {
  const { type, id } = req.params;
  
  // In a real implementation, you'd delete from the storage_locations table
  // and update references in the related tables
  // For now, just return success
  res.json({ success: true });
});

module.exports = router;