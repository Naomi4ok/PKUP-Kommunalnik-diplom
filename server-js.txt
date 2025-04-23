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
  
  // Create Transportation table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS Transportation (
      Transport_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Image BLOB,
      Brand TEXT NOT NULL,
      BrandLogo TEXT,
      Model TEXT NOT NULL,
      Year INTEGER,
      LicenseNumber TEXT,
      Purpose TEXT,
      FuelType TEXT,
      TransmissionType TEXT,
      TechnicalCondition TEXT DEFAULT 'Исправен',
      AssignedEmployee_ID INTEGER,
      LastMaintenance TEXT,
      FOREIGN KEY (AssignedEmployee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Transportation table:', err);
    } else {
      console.log('Transportation table created or already exists');
    }
  });
  
  // Create Tools table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS Tools (
      Tool_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Category TEXT,
      Quantity INTEGER DEFAULT 1,
      Location TEXT,
      Responsible_Employee_ID INTEGER,
      Last_Check_Date TEXT,
      FOREIGN KEY (Responsible_Employee_ID) REFERENCES Employees(Employee_ID)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating Tools table:', err);
    } else {
      console.log('Tools table created or already exists');
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

// API Routes for Transportation
// GET all transportation
app.get('/api/transportation', (req, res) => {
  db.all(`
    SELECT t.*, e.Full_Name as AssignedEmployeeName 
    FROM Transportation t
    LEFT JOIN Employees e ON t.AssignedEmployee_ID = e.Employee_ID
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching transportation:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Convert BLOBs to base64 strings for images
    const transportation = rows.map(row => {
      if (row.Image) {
        row.Image = row.Image.toString('base64');
      }
      return row;
    });
    
    res.json(transportation);
  });
});

// GET transportation by ID
app.get('/api/transportation/:id', (req, res) => {
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
    
    // Convert BLOB to base64 string for image
    if (row.Image) {
      row.Image = row.Image.toString('base64');
    }
    
    res.json(row);
  });
});

// POST create new transportation
app.post('/api/transportation', upload.single('image'), (req, res) => {
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
  
  // Validate required fields
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

// PUT update transportation
app.put('/api/transportation/:id', upload.single('image'), (req, res) => {
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
  
  // Validate required fields
  if (!brand || !model) {
    return res.status(400).json({ error: 'Brand and model are required' });
  }
  
  // If an image was uploaded, update the image; otherwise, keep the existing one
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
    // Update without changing the image
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

// DELETE transportation
app.delete('/api/transportation/:id', (req, res) => {
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

// Import transportation from Excel
app.post('/api/transportation/import', (req, res) => {
  const { transportation } = req.body;
  
  if (!transportation || !Array.isArray(transportation) || transportation.length === 0) {
    return res.status(400).json({ error: 'No transportation data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
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
        return; // Skip this record
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

// API Routes for Tools
// GET all tools
app.get('/api/tools', (req, res) => {
  db.all('SELECT * FROM Tools', [], (err, rows) => {
    if (err) {
      console.error('Error fetching tools:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET tool by ID
app.get('/api/tools/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM Tools WHERE Tool_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json(row);
  });
});

// POST create new tool
app.post('/api/tools', (req, res) => {
  const { 
    name, 
    category, 
    quantity, 
    location, 
    responsibleEmployeeId,
    lastCheckDate
  } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  const sql = `
    INSERT INTO Tools (
      Name, 
      Category, 
      Quantity, 
      Location, 
      Responsible_Employee_ID, 
      Last_Check_Date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    name, 
    category, 
    quantity || 1, 
    location, 
    responsibleEmployeeId, 
    lastCheckDate
  ], function(err) {
    if (err) {
      console.error('Error creating tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ 
      message: 'Tool created successfully',
      toolId: this.lastID 
    });
  });
});

// PUT update tool
app.put('/api/tools/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    category, 
    quantity, 
    location, 
    responsibleEmployeeId,
    lastCheckDate
  } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  const sql = `
    UPDATE Tools 
    SET Name = ?, 
        Category = ?, 
        Quantity = ?, 
        Location = ?, 
        Responsible_Employee_ID = ?, 
        Last_Check_Date = ?
    WHERE Tool_ID = ?
  `;
  
  db.run(sql, [
    name, 
    category, 
    quantity || 1, 
    location, 
    responsibleEmployeeId, 
    lastCheckDate,
    id
  ], function(err) {
    if (err) {
      console.error('Error updating tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json({ message: 'Tool updated successfully' });
  });
});

// DELETE tool
app.delete('/api/tools/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Tools WHERE Tool_ID = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting tool:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json({ message: 'Tool deleted successfully' });
  });
});

// Import tools from Excel
app.post('/api/tools/import', (req, res) => {
  const { tools } = req.body;
  
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return res.status(400).json({ error: 'No tools data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO Tools (
        Name, 
        Category, 
        Quantity, 
        Location, 
        Responsible_Employee_ID, 
        Last_Check_Date
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    tools.forEach(item => {
      if (!item.name) {
        errorCount++;
        return; // Skip this record
      }
      
      try {
        stmt.run(
          item.name,
          item.category || '',
          item.quantity || 1,
          item.location || '',
          item.responsibleEmployeeId || null,
          item.lastCheckDate || null
        );
        successCount++;
      } catch (err) {
        console.error('Error inserting tool:', err);
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

db.run(`
  CREATE TABLE IF NOT EXISTS Spares (
    Spare_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Quantity INTEGER DEFAULT 0,
    Unit_Cost REAL DEFAULT 0,
    Total_Cost REAL DEFAULT 0,
    Last_Replenishment_Date TEXT,
    Location TEXT,
    Supplier TEXT,
    Status TEXT DEFAULT 'В наличии'
  )
`, (err) => {
  if (err) {
    console.error('Error creating Spares table:', err);
  } else {
    console.log('Spares table created or already exists');
  }
});

// API Routes for Spares
// GET all spares
app.get('/api/spares', (req, res) => {
  db.all('SELECT * FROM Spares', [], (err, rows) => {
    if (err) {
      console.error('Error fetching spares:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET spare by ID
app.get('/api/spares/:id', (req, res) => {
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

// POST create new spare
app.post('/api/spares', (req, res) => {
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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Spare part name is required' });
  }
  
  // Calculate total cost if not provided
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

// PUT update spare
app.put('/api/spares/:id', (req, res) => {
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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Spare part name is required' });
  }
  
  // Calculate total cost if not provided
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

// DELETE spare
app.delete('/api/spares/:id', (req, res) => {
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

// Import spares from Excel
app.post('/api/spares/import', (req, res) => {
  const { spares } = req.body;
  
  if (!spares || !Array.isArray(spares) || spares.length === 0) {
    return res.status(400).json({ error: 'No spare parts data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
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
        return; // Skip this record
      }
      
      // Calculate total cost if not provided
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

db.run(`
  CREATE TABLE IF NOT EXISTS Materials (
    Material_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Quantity INTEGER DEFAULT 0,
    Unit_Cost REAL DEFAULT 0,
    Total_Cost REAL DEFAULT 0,
    Last_Replenishment_Date TEXT,
    Location TEXT,
    Supplier TEXT,
    Status TEXT DEFAULT 'В наличии'
  )
`, (err) => {
  if (err) {
    console.error('Error creating Materials table:', err);
  } else {
    console.log('Materials table created or already exists');
  }
});

// API Routes for Materials
// GET all materials
app.get('/api/materials', (req, res) => {
  db.all('SELECT * FROM Materials', [], (err, rows) => {
    if (err) {
      console.error('Error fetching materials:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// GET material by ID
app.get('/api/materials/:id', (req, res) => {
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

// POST create new material
app.post('/api/materials', (req, res) => {
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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Material name is required' });
  }
  
  // Calculate total cost if not provided
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

// PUT update material
app.put('/api/materials/:id', (req, res) => {
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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Material name is required' });
  }
  
  // Calculate total cost if not provided
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

// DELETE material
app.delete('/api/materials/:id', (req, res) => {
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

// Import materials from Excel
app.post('/api/materials/import', (req, res) => {
  const { materials } = req.body;
  
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: 'No materials data provided or invalid format' });
  }
  
  // Begin a transaction to ensure all inserts succeed or fail together
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
        return; // Skip this record
      }
      
      // Calculate total cost if not provided
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