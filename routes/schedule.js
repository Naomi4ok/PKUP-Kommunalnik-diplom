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

// POST create a new task
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
  
  // Валидация обязательных полей
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, date, start time, and end time are required' });
  }
  
  // Преобразование массивов в строки JSON для хранения
  const employeeIdsJson = employeeIds ? JSON.stringify(employeeIds) : '[]';
  const equipmentIdsJson = equipmentIds ? JSON.stringify(equipmentIds) : '[]';
  const transportIdsJson = transportIds ? JSON.stringify(transportIds) : '[]';
  
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

// PUT update an existing task
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
  
  // Валидация обязательных полей
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, date, start time, and end time are required' });
  }
  
  // Преобразование массивов в строки JSON для хранения
  const employeeIdsJson = employeeIds ? JSON.stringify(employeeIds) : '[]';
  const equipmentIdsJson = equipmentIds ? JSON.stringify(equipmentIds) : '[]';
  const transportIdsJson = transportIds ? JSON.stringify(transportIds) : '[]';
  
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
    
    res.json({ message: 'Task updated successfully' });
  });
});

// DELETE a task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log('Server received DELETE request for task ID:', id);
  
  db.run('DELETE FROM Schedule WHERE Task_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting task from database:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Database changes:', this.changes);
    
    if (this.changes === 0) {
      console.log('No task found with ID:', id);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Successfully deleted task with ID:', id);
    res.json({ message: 'Task deleted successfully' });
  });
});

// GET all processes
router.get('/processes/all', (req, res) => {
  db.all('SELECT * FROM Processes', [], (err, rows) => {
    if (err) {
      console.error('Error fetching processes:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

module.exports = router;