const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database/database.db'), (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // Create Employees table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS Employees (
      Employee_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Photo BLOB,
      Full_Name TEXT NOT NULL,
      Position TEXT,
      Department TEXT,
      Contact_Details TEXT,
      Work_Schedule TEXT,
      Status TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Employees table:', err);
    } else {
      console.log('Employees table created or already exists');
    }
  });
  
  // Create Equipment table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS Equipment (
      Equipment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Type TEXT,
      Manufacturer TEXT,
      Model TEXT,
      Inventory_Number TEXT,
      Commission_Date TEXT,
      Responsible_Employee_ID INTEGER,
      Condition TEXT DEFAULT 'Рабочее',
      Location TEXT,
      FOREIGN KEY (Responsible_Employee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Equipment table:', err);
    } else {
      console.log('Equipment table created or already exists');
    }
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage for multer (file uploads)
const storage = multer.memoryStorage(); // Store files as buffers
const upload = multer({ storage: storage });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// API Routes for Employees
// GET all employees
app.get('/api/employees', (req, res) => {
  db.all('SELECT * FROM Employees', [], (err, rows) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Convert BLOBs to base64 strings for photos
    const employees = rows.map(row => {
      if (row.Photo) {
        row.Photo = row.Photo.toString('base64');
      }
      return row;
    });
    
    res.json(employees);
  });
});

// GET employee by ID
app.get('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Employees WHERE Employee_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Convert BLOB to base64 string for photo
    if (row.Photo) {
      row.Photo = row.Photo.toString('base64');
    }
    
    res.json(row);
  });
});

// POST create new employee
app.post('/api/employees', upload.single('photo'), (req, res) => {
  const { fullName, position, department, contactDetails, workSchedule, status } = req.body;
  const photo = req.file ? req.file.buffer : null;
  
  // Validate required fields
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  
  const sql = `
    INSERT INTO Employees (Photo, Full_Name, Position, Department, Contact_Details, Work_Schedule, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [photo, fullName, position, department, contactDetails, workSchedule, status], function(err) {
    if (err) {
      console.error('Error creating employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Employee created successfully',
      employeeId: this.lastID 
    });
  });
});

// PUT update employee
app.put('/api/employees/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { fullName, position, department, contactDetails, workSchedule, status } = req.body;
  
  // Validate required fields
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  
  // If a photo was uploaded, update the photo; otherwise, keep the existing one
  if (req.file) {
    const photo = req.file.buffer;
    
    const sql = `
      UPDATE Employees 
      SET Photo = ?, Full_Name = ?, Position = ?, Department = ?, 
          Contact_Details = ?, Work_Schedule = ?, Status = ?
      WHERE Employee_ID = ?
    `;
    
    db.run(sql, [photo, fullName, position, department, contactDetails, workSchedule, status, id], function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      res.json({ message: 'Employee updated successfully' });
    });
  } else {
    // Update without changing the photo
    const sql = `
      UPDATE Employees 
      SET Full_Name = ?, Position = ?, Department = ?, 
          Contact_Details = ?, Work_Schedule = ?, Status = ?
      WHERE Employee_ID = ?
    `;
    
    db.run(sql, [fullName, position, department, contactDetails, workSchedule, status, id], function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      res.json({ message: 'Employee updated successfully' });
    });
  }
});

// DELETE employee
app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Employees WHERE Employee_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  });
});

// Import employees from Excel
app.post('/api/employees/import', (req, res) => {
  const { employees } = req.body;
  
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'No employee data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Employees (Full_Name, Position, Department, Contact_Details, Work_Schedule, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    employees.forEach(employee => {
      if (!employee.fullName) {
        errorCount++;
        return; // Skip this record
      }
      
      try {
        stmt.run(
          employee.fullName,
          employee.position || '',
          employee.department || '',
          employee.contactDetails || '',
          employee.workSchedule || '',
          employee.status || 'Active'
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting employee:', err);
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

// API Routes for Equipment
// GET all equipment
app.get('/api/equipment', (req, res) => {
  db.all('SELECT * FROM Equipment', [], (err, rows) => {
    if (err) {
      console.error('Error fetching equipment:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET equipment by ID
app.get('/api/equipment/:id', (req, res) => {
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

// POST create new equipment
app.post('/api/equipment', (req, res) => {
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
  
  // Validate required fields
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

// PUT update equipment
app.put('/api/equipment/:id', (req, res) => {
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
  
  // Validate required fields
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

// DELETE equipment
app.delete('/api/equipment/:id', (req, res) => {
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

// Import equipment from Excel
app.post('/api/equipment/import', (req, res) => {
  const { equipment } = req.body;
  
  if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
    return res.status(400).json({ error: 'No equipment data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
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
        return; // Skip this record
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

// Catch-all handler to serve React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close database connection when server stops
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});