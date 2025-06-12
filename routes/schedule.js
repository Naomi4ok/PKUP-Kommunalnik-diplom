const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all schedule tasks
router.get('/', (req, res) => {
  db.all(`
    SELECT * FROM Schedule
    ORDER BY Date, StartTime
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
    SELECT * FROM Schedule WHERE Task_ID = ?
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

// Helper function to check if date is in the past
const isDateInPast = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to beginning of day
  
  const taskDate = new Date(dateString);
  taskDate.setHours(0, 0, 0, 0); // Reset time to beginning of day
  
  return taskDate < today;
};

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
    processId, // Теперь это будет строка с названием процесса
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

  // Check if date is in the past
  if (isDateInPast(date)) {
    return res.status(400).json({ 
      error: 'Нельзя создавать задачи на прошедшие даты. Пожалуйста, выберите сегодняшнюю дату или дату в будущем.' 
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
      ProcessName, 
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
    processId || '', // Сохраняем название процесса как строку
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
    processId, // Теперь это строка с названием процесса
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

  // For existing tasks, we still check if we're trying to change date to past
  // but allow editing existing tasks with past dates (just can't change date to past)
  db.get('SELECT Date FROM Schedule WHERE Task_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching task for date validation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // If the date is being changed and the new date is in the past, reject
    if (row.Date !== date && isDateInPast(date)) {
      return res.status(400).json({ 
        error: 'Нельзя изменять дату задачи на прошедшую дату. Пожалуйста, выберите сегодняшнюю дату или дату в будущем.' 
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
          ProcessName = ?, 
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
      processId || '', // Сохраняем название процесса как строку
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

// Убираем все эндпоинты связанные с процессами, так как они больше не нужны
// Удаляем GET /processes/all, POST /processes, PUT /processes/:id, DELETE /processes/:id

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
      processId, // Теперь это строка с названием процесса
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

    // Check if date is in the past for imported tasks too
    if (isDateInPast(date)) {
      errors.push(`Строка ${index + 2}: Нельзя импортировать задачи на прошедшие даты`);
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
        ProcessName, 
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
      processId || '', // Сохраняем название процесса как строку
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
    SELECT * FROM Schedule
    WHERE Date BETWEEN ? AND ?
    ORDER BY Date, StartTime
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
    SELECT * FROM Schedule
    WHERE Status = ?
    ORDER BY Date, StartTime
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
    SELECT * FROM Schedule
    WHERE EmployeeIds LIKE ?
    ORDER BY Date, StartTime
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
  
  // Check if new date is provided and not in the past
  if (newDate && isDateInPast(newDate)) {
    return res.status(400).json({ 
      error: 'Нельзя дублировать задачу на прошедшую дату. Пожалуйста, выберите сегодняшнюю дату или дату в будущем.' 
    });
  }
  
  // First get the original task
  db.get('SELECT * FROM Schedule WHERE Task_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching original task:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const duplicateDate = newDate || row.Date;
    
    // Double check the date isn't in the past
    if (isDateInPast(duplicateDate)) {
      return res.status(400).json({ 
        error: 'Нельзя дублировать задачу на прошедшую дату. Пожалуйста, выберите сегодняшнюю дату или дату в будущем.' 
      });
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
        ProcessName, 
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
      duplicateDate,
      row.StartTime,
      row.EndTime,
      row.EmployeeIds,
      row.EquipmentIds,
      row.TransportIds,
      row.ProcessName, // Изменено с ProcessId на ProcessName
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