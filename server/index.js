
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('../src/lib/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// בדיקת חיבור למסד נתונים
app.get('/api/health', async (req, res) => {
  try {
    await database.connect();
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// API Routes for Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    
    const user = await database.getUserByEmployeeId(employeeId);
    
    if (!user) {
      return res.status(401).json({ error: 'משתמש לא נמצא' });
    }

    // כרגע אין הצפנת סיסמאות - נוסיף בהמשך
    if (user.password !== password) {
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }

    res.json({
      user: {
        id: user.id,
        employeeId: user.employee_id,
        name: user.name,
        isManager: user.is_manager
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה בהתחברות' });
  }
});

// API Routes for Attendance
app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { userId } = req.body;
    const record = await database.clockIn(userId);
    res.json(record);
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'שגיאה בכניסה' });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { userId } = req.body;
    const record = await database.clockOut(userId);
    res.json(record);
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ error: 'שגיאה ביציאה' });
  }
});

app.get('/api/attendance/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await database.getTodayAttendance(userId);
    res.json(record || null);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת נתוני נוכחות' });
  }
});

// API Routes for Manual Reports
app.post('/api/reports/manual', async (req, res) => {
  try {
    const { userId, dateIn, timeIn, dateOut, timeOut, reason } = req.body;
    const report = await database.createManualReport(userId, dateIn, timeIn, dateOut, timeOut, reason);
    res.json(report);
  } catch (error) {
    console.error('Manual report error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת דיווח' });
  }
});

app.get('/api/reports/manual', async (req, res) => {
  try {
    const { status } = req.query;
    const reports = await database.getManualReports(status);
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת דיווחים' });
  }
});

// API Route for creating initial users (for testing)
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { employeeId, name, password, isManager } = req.body;
    const user = await database.createUser(employeeId, name, password, isManager);
    res.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת משתמש' });
  }
});

// Initialize database tables on startup
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    await database.createTables();
    console.log('Database initialized successfully');
    
    // יצירת משתמש מנהל ראשון אם לא קיים
    try {
      const existingManager = await database.getUserByEmployeeId('322754672');
      if (!existingManager) {
        await database.createUser('322754672', 'מנהל ראשי', '123456', true);
        console.log('Initial manager user created');
      }
    } catch (userError) {
      console.log('Manager user already exists or creation failed:', userError.message);
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

module.exports = app;
