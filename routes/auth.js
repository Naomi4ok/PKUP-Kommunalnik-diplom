const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM Users WHERE Username = ? AND Status = "active"', [username], async (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    try {
      const match = await bcrypt.compare(password, user.Password);
      
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Update last login time
      db.run('UPDATE Users SET Last_Login = CURRENT_TIMESTAMP WHERE User_ID = ?', [user.User_ID]);

      // Create JWT token
      const token = jwt.sign(
        { 
          userId: user.User_ID, 
          username: user.Username,
          role: user.Role 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Return user data and token
      res.json({
        success: true,
        user: {
          id: user.User_ID,
          username: user.Username,
          fullName: user.Full_Name,
          role: user.Role,
          email: user.Email
        },
        token
      });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Check authentication status
router.get('/me', verifyToken, (req, res) => {
  db.get('SELECT User_ID, Username, Full_Name, Role, Email FROM Users WHERE User_ID = ?', 
    [req.userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user.User_ID,
          username: user.Username,
          fullName: user.Full_Name,
          role: user.Role,
          email: user.Email
        }
      });
    });
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required' });
  }

  // Validate new password
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  // Get user from database
  db.get('SELECT * FROM Users WHERE User_ID = ?', [req.userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      // Verify current password
      const match = await bcrypt.compare(currentPassword, user.Password);
      
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      db.run('UPDATE Users SET Password = ? WHERE User_ID = ?', 
        [hashedPassword, req.userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }
          
          res.json({ success: true, message: 'Password updated successfully' });
        }
      );
    } catch (error) {
      console.error('Error during password change:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// User management routes (admin only)
router.get('/users', verifyToken, verifyAdmin, (req, res) => {
  db.all('SELECT User_ID, Username, Full_Name, Role, Email, Last_Login, Created_At, Status FROM Users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json({ success: true, users });
  });
});

router.post('/users', verifyToken, verifyAdmin, async (req, res) => {
  const { username, password, fullName, role, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    db.run(
      'INSERT INTO Users (Username, Password, Full_Name, Role, Email) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, fullName, role || 'user', email],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        res.status(201).json({ 
          success: true, 
          message: 'User created successfully',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', verifyToken, verifyAdmin, (req, res) => {
  const userId = req.params.id;
  const { username, fullName, role, email, status } = req.body;

  // Update user details
  db.run(
    'UPDATE Users SET Username = ?, Full_Name = ?, Role = ?, Email = ?, Status = ? WHERE User_ID = ?',
    [username, fullName, role, email, status, userId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Failed to update user' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ success: true, message: 'User updated successfully' });
    }
  );
});

router.delete('/users/:id', verifyToken, verifyAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent deleting own account
  if (parseInt(userId) === req.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Set user status to 'inactive' instead of deleting
  db.run('UPDATE Users SET Status = "inactive" WHERE User_ID = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to verify admin role
function verifyAdmin(req, res, next) {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

module.exports = {
  router,
  verifyToken,
  verifyAdmin
};