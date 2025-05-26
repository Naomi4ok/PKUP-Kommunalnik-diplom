const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all schedule tasks
router.get('/', (req, res) => {
  db.all(`
    SELECT s.*, p.Name as ProcessName, p.Color as ProcessColor
    FROM Schedule s
    LEFT JOIN Processes p ON s.ProcessId = p.Process_ID
    ORDER BY s.Date, s.StartTime
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching schedule tasks:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Преобразование строковых массивов в JavaScript массивы
    const tasks = rows.map(row => {
      return {
        ...row,
        employeeIds: row.EmployeeIds ? JSON.parse(row.EmployeeIds) : [],
        equipmentIds: row.EquipmentIds ? JSON.parse(row.EquipmentIds) : [],
        transportIds: row.TransportIds ? JSON.parse(row.TransportIds) : []
      };
    });
    
    res.json(tasks);
  });
});

// GET a specific task by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT s.*, p.Name as ProcessName, p.Color as ProcessColor
    FROM Schedule s
    LEFT JOIN Processes p ON s.ProcessId = p.Process_ID
    WHERE s.Task_ID = ?
  `, [id], (err, row) => {
    if (err) {
      console.error('Error fetching task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Преобразование строковых массивов в JavaScript массивы
    const task = {
      ...row,
      employeeIds: row.EmployeeIds ? JSON.parse(row.EmployeeIds) : [],
      equipmentIds: row.EquipmentIds ? JSON.parse(row.EquipmentIds) : [],
      transportIds: row.TransportIds ? JSON.parse(row.TransportIds) : []
    };
    
    res.json(task);
  });
});

// POST create new task
router.post('/', (req, res) => {
  const {
    title,
    date,
    startTime,
    endTime,
    employeeIds,
    equipmentIds,
    transportIds,
    processId,
    location,
    status,
    priority,
    description,
    progress
  } = req.body;

  // Validation
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Title, date, startTime, and endTime are required' 
    });
  }

  // Convert arrays to JSON strings
  const employeeIdsJson = JSON.stringify(employeeIds || []);
  const equipmentIdsJson = JSON.stringify(equipmentIds || []);
  const transportIdsJson = JSON.stringify(transportIds || []);
  
  const currentDate = new Date().toISOString();

  const sql = `
    INSERT INTO Schedule (
      Title, 
      Date, 
      StartTime, 
      EndTime, 
      EmployeeIds, 
      EquipmentIds, 
      TransportIds, 
      ProcessId, 
      Location, 
      Status, 
      Priority, 
      Description, 
      Progress,
      Created_At,
      Updated_At
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    title, 
    date, 
    startTime, 
    endTime, 
    employeeIdsJson, 
    equipmentIdsJson, 
    transportIdsJson, 
    processId, 
    location, 
    status || 'scheduled', 
    priority || 'medium', 
    description, 
    progress || 0,
    currentDate,
    currentDate
  ], function(err) {
    if (err) {
      console.error('Error creating task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Task created successfully',
      taskId: this.lastID 
    });
  });
});

// PUT update existing task
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    date,
    startTime,
    endTime,
    employeeIds,
    equipmentIds,
    transportIds,
    processId,
    location,
    status,
    priority,
    description,
    progress
  } = req.body;

  // Validation
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Title, date, startTime, and endTime are required' 
    });
  }

  // Convert arrays to JSON strings
  const employeeIdsJson = JSON.stringify(employeeIds || []);
  const equipmentIdsJson = JSON.stringify(equipmentIds || []);
  const transportIdsJson = JSON.stringify(transportIds || []);
  
  const currentDate = new Date().toISOString();
  
  const sql = `
    UPDATE Schedule 
    SET Title = ?, 
        Date = ?, 
        StartTime = ?, 
        EndTime = ?, 
        EmployeeIds = ?, 
        EquipmentIds = ?, 
        TransportIds = ?, 
        ProcessId = ?, 
        Location = ?, 
        Status = ?, 
        Priority = ?, 
        Description = ?, 
        Progress = ?,
        Updated_At = ?
    WHERE Task_ID = ?
  `;
  
  db.run(sql, [
    title, 
    date, 
    startTime, 
    endTime, 
    employeeIdsJson, 
    equipmentIdsJson, 
    transportIdsJson, 
    processId, 
    location, 
    status || 'scheduled', 
    priority || 'medium', 
    description, 
    progress || 0,
    currentDate,
    id
  ], function(err) {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ 
      message: 'Task updated successfully',
      changes: this.changes 
    });
  });
});

// DELETE task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM Schedule WHERE Task_ID = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ 
      message: 'Task deleted successfully',
      changes: this.changes 
    });
  });
});

// GET all processes
router.get('/processes/all', (req, res) => {
  db.all('SELECT * FROM Processes ORDER BY Name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching processes:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// POST create new process
router.post('/processes', (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Process name is required' });
  }

  const sql = 'INSERT INTO Processes (Name, Description, Color) VALUES (?, ?, ?)';
  
  db.run(sql, [name, description || '', color || '#1890ff'], function(err) {
    if (err) {
      console.error('Error creating process:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Process created successfully',
      processId: this.lastID 
    });
  });
});

// PUT update process
router.put('/processes/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Process name is required' });
  }

  const sql = 'UPDATE Processes SET Name = ?, Description = ?, Color = ? WHERE Process_ID = ?';
  
  db.run(sql, [name, description || '', color || '#1890ff', id], function(err) {
    if (err) {
      console.error('Error updating process:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Process not found' });
    }
    
    res.json({ 
      message: 'Process updated successfully',
      changes: this.changes 
    });
  });
});

// DELETE process
router.delete('/processes/:id', (req, res) => {
  const { id } = req.params;
  
  // First check if process is being used in any tasks
  db.get('SELECT COUNT(*) as count FROM Schedule WHERE ProcessId = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking process usage:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete process that is being used in tasks' 
      });
    }
    
    // If not being used, proceed with deletion
    const sql = 'DELETE FROM Processes WHERE Process_ID = ?';
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('Error deleting process:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Process not found' });
      }
      
      res.json({ 
        message: 'Process deleted successfully',
        changes: this.changes 
      });
    });
  });
});

// POST import tasks from Excel
router.post('/import', (req, res) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'No valid tasks data provided' });
  }

  let imported = 0;
  let errors = [];
  
  const currentDate = new Date().toISOString();

  // Process each task
  tasks.forEach((task, index) => {
    const {
      title,
      date,
      startTime,
      endTime,
      location,
      processId,
      employeeIds,
      equipmentIds,
      transportIds,
      priority,
      status,
      progress,
      description
    } = task;

    // Basic validation
    if (!title || !date) {
      errors.push(`Строка ${index + 2}: Название задачи и дата обязательны`);
      return;
    }

    // Convert arrays to JSON strings
    const employeeIdsJson = JSON.stringify(employeeIds || []);
    const equipmentIdsJson = JSON.stringify(equipmentIds || []);
    const transportIdsJson = JSON.stringify(transportIds || []);

    const sql = `
      INSERT INTO Schedule (
        Title, 
        Date, 
        StartTime, 
        EndTime, 
        EmployeeIds, 
        EquipmentIds, 
        TransportIds, 
        ProcessId, 
        Location, 
        Status, 
        Priority, 
        Description, 
        Progress,
        Created_At,
        Updated_At
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      title,
      date,
      startTime || '08:00',
      endTime || '17:00',
      employeeIdsJson,
      equipmentIdsJson,
      transportIdsJson,
      processId,
      location || '',
      status || 'scheduled',
      priority || 'medium',
      description || '',
      progress || 0,
      currentDate,
      currentDate
    ], function(err) {
      if (err) {
        console.error(`Error importing task ${index + 1}:`, err);
        errors.push(`Строка ${index + 2}: ${err.message}`);
      } else {
        imported++;
      }
      
      // If this is the last task, send response
      if (index === tasks.length - 1) {
        setTimeout(() => {
          if (errors.length > 0 && imported === 0) {
            res.status(400).json({ 
              error: 'Import failed', 
              details: errors,
              imported: 0 
            });
          } else {
            res.json({ 
              message: `Successfully imported ${imported} tasks`,
              imported: imported,
              errors: errors.length > 0 ? errors : undefined
            });
          }
        }, 100); // Small delay to ensure all database operations complete
      }
    });
  });
});

// GET tasks by date range
router.get('/range/:startDate/:endDate', (req, res) => {
  const { startDate, endDate } = req.params;
  
  db.all(`
    SELECT s.*, p.Name as ProcessName, p.Color as ProcessColor
    FROM Schedule s
    LEFT JOIN Processes p ON s.ProcessId = p.Process_ID
    WHERE s.Date BETWEEN ? AND ?
    ORDER BY s.Date, s.StartTime
  `, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks by date range:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Преобразование строковых массивов в JavaScript массивы
    const tasks = rows.map(row => {
      return {
        ...row,
        employeeIds: row.EmployeeIds ? JSON.parse(row.EmployeeIds) : [],
        equipmentIds: row.EquipmentIds ? JSON.parse(row.EquipmentIds) : [],
        transportIds: row.TransportIds ? JSON.parse(row.TransportIds) : []
      };
    });
    
    res.json(tasks);
  });
});

// GET tasks by status
router.get('/status/:status', (req, res) => {
  const { status } = req.params;
  
  db.all(`
    SELECT s.*, p.Name as ProcessName, p.Color as ProcessColor
    FROM Schedule s
    LEFT JOIN Processes p ON s.ProcessId = p.Process_ID
    WHERE s.Status = ?
    ORDER BY s.Date, s.StartTime
  `, [status], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks by status:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Преобразование строковых массивов в JavaScript массивы
    const tasks = rows.map(row => {
      return {
        ...row,
        employeeIds: row.EmployeeIds ? JSON.parse(row.EmployeeIds) : [],
        equipmentIds: row.EquipmentIds ? JSON.parse(row.EquipmentIds) : [],
        transportIds: row.TransportIds ? JSON.parse(row.TransportIds) : []
      };
    });
    
    res.json(tasks);
  });
});

// GET tasks by employee
router.get('/employee/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  
  db.all(`
    SELECT s.*, p.Name as ProcessName, p.Color as ProcessColor
    FROM Schedule s
    LEFT JOIN Processes p ON s.ProcessId = p.Process_ID
    WHERE s.EmployeeIds LIKE ?
    ORDER BY s.Date, s.StartTime
  `, [`%"${employeeId}"%`], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks by employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Преобразование строковых массивов в JavaScript массивы и дополнительная фильтрация
    const tasks = rows.map(row => {
      return {
        ...row,
        employeeIds: row.EmployeeIds ? JSON.parse(row.EmployeeIds) : [],
        equipmentIds: row.EquipmentIds ? JSON.parse(row.EquipmentIds) : [],
        transportIds: row.TransportIds ? JSON.parse(row.TransportIds) : []
      };
    }).filter(task => task.employeeIds.includes(parseInt(employeeId)));
    
    res.json(tasks);
  });
});

// GET schedule statistics
router.get('/stats/overview', (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM Schedule',
    completed: 'SELECT COUNT(*) as count FROM Schedule WHERE Status = "completed"',
    inProgress: 'SELECT COUNT(*) as count FROM Schedule WHERE Status = "in-progress"',
    delayed: 'SELECT COUNT(*) as count FROM Schedule WHERE Status = "delayed"',
    scheduled: 'SELECT COUNT(*) as count FROM Schedule WHERE Status = "scheduled"',
    cancelled: 'SELECT COUNT(*) as count FROM Schedule WHERE Status = "cancelled"'
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.total, [], (err, row) => {
        if (err) reject(err);
        else resolve({ total: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.completed, [], (err, row) => {
        if (err) reject(err);
        else resolve({ completed: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.inProgress, [], (err, row) => {
        if (err) reject(err);
        else resolve({ inProgress: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.delayed, [], (err, row) => {
        if (err) reject(err);
        else resolve({ delayed: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.scheduled, [], (err, row) => {
        if (err) reject(err);
        else resolve({ scheduled: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.cancelled, [], (err, row) => {
        if (err) reject(err);
        else resolve({ cancelled: row.count });
      });
    })
  ])
  .then(results => {
    const stats = Object.assign({}, ...results);
    res.json(stats);
  })
  .catch(err => {
    console.error('Error fetching schedule statistics:', err);
    res.status(500).json({ error: err.message });
  });
});

// POST duplicate task
router.post('/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;
  
  // First get the original task
  db.get('SELECT * FROM Schedule WHERE Task_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching original task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentDate = new Date().toISOString();
    
    // Create a duplicate with new date
    const sql = `
      INSERT INTO Schedule (
        Title, 
        Date, 
        StartTime, 
        EndTime, 
        EmployeeIds, 
        EquipmentIds, 
        TransportIds, 
        ProcessId, 
        Location, 
        Status, 
        Priority, 
        Description, 
        Progress,
        Created_At,
        Updated_At
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      row.Title + ' (копия)',
      newDate || row.Date,
      row.StartTime,
      row.EndTime,
      row.EmployeeIds,
      row.EquipmentIds,
      row.TransportIds,
      row.ProcessId,
      row.Location,
      'scheduled', // Reset status to scheduled
      row.Priority,
      row.Description,
      0, // Reset progress to 0
      currentDate,
      currentDate
    ], function(err) {
      if (err) {
        console.error('Error duplicating task:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({ 
        message: 'Task duplicated successfully',
        taskId: this.lastID 
      });
    });
  });
});

module.exports = router;