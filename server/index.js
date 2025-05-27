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
    const tables = await database.checkTables();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      tables: tables,
      port: PORT 
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// route לבדיקת מצב מלא של הדטאבייס
app.get('/api/debug/database', async (req, res) => {
  try {
    await database.connect();
    const tables = await database.checkTables();
    await database.checkTableData();
    res.json({ 
      status: 'OK',
      tables: tables,
      message: 'Check console for detailed output'
    });
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
    const { userId, latitude, longitude, isManualEntry, manualReason } = req.body;
    const record = await database.clockIn(userId, latitude, longitude, isManualEntry, manualReason);
    res.json(record);
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'שגיאה בכניסה' });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    const record = await database.clockOut(userId, latitude, longitude);
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
    const { userId, clockIn, clockOut, reason, latitude, longitude } = req.body;
    const report = await database.createManualReport(userId, clockIn, clockOut, reason, latitude, longitude);
    res.json(report);
  } catch (error) {
    console.error('Manual report error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת דיווח' });
  }
});

app.get('/api/attendance/logs', async (req, res) => {
  try {
    const { status, isManualEntry, departmentId } = req.query;
    const logs = await database.getAttendanceLogs(status, isManualEntry, departmentId);
    res.json(logs);
  } catch (error) {
    console.error('Get attendance logs error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת דיווחי נוכחות' });
  }
});

app.put('/api/attendance/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy } = req.body;
    const updated = await database.updateAttendanceStatus(id, status, updatedBy);
    res.json(updated);
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס' });
  }
});

// API Routes for Departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await database.getDepartments();
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת מחלקות' });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { name } = req.body;
    const department = await database.createDepartment(name);
    res.json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת מחלקה' });
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log('🔗 DATABASE_URL exists:', !!process.env.DATABASE_URL);

  try {
    console.log('🔄 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully');
    
    // בדיקת טבלאות קיימות
    console.log('📋 Checking existing tables...');
    await database.checkTables();
    
    console.log('🔧 Creating/updating tables...');
    await database.createTables();
    console.log('✅ Database tables initialized');

    // בדיקת נתונים
    console.log('📊 Checking table data...');
    await database.checkTableData();

    // יצירת משתמש מנהל ראשון אם לא קיים
    console.log('👤 Checking manager user...');
    try {
      const existingManager = await database.getUserByEmployeeId('322754672');
      if (!existingManager) {
        await database.createUser('322754672', 'מנהל ראשי', '123456', true, 1);
        console.log('✅ Initial manager user created');
      } else {
        console.log('✅ Manager user already exists:', existingManager.name);
      }
    } catch (userError) {
      console.log('⚠️ Manager user creation issue:', userError.message);
    }

    console.log('🎉 Server fully initialized and ready!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

module.exports = app;