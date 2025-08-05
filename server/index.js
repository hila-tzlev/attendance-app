
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('../src/lib/database.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Middleware לטיפול בבקשות API בסביבת פיתוח
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// בדיקת חיבור פשוטה
app.get('/api/health', async (req, res) => {
  try {
    await Database.connect();
    res.json({ 
      status: 'OK', 
      message: 'Server and database are running',
      port: PORT,
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes for Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ error: 'מספר זהות וסיסמה נדרשים' });
    }

    const user = await Database.getUserByEmployeeId(employeeId);

    if (!user) {
      return res.status(401).json({ error: 'משתמש לא נמצא' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }

    res.json({
      user: {
        id: user.id,
        employeeId: user.employee_id,
        name: user.name,
        isManager: user.is_manager,
        department: user.department_name || 'לא מוגדר'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה בהתחברות: ' + error.message });
  }
});

// API Routes for Attendance
app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { userId, latitude, longitude, isManualEntry, manualReason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'מזהה משתמש נדרש' });
    }

    const record = await Database.clockIn(
      parseInt(userId), 
      latitude, 
      longitude, 
      !!isManualEntry, 
      manualReason
    );

    res.json(record);
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'שגיאה בכניסה: ' + error.message });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'מזהה משתמש נדרש' });
    }

    const record = await Database.clockOut(parseInt(userId), latitude, longitude);

    if (!record) {
      return res.status(404).json({ error: 'לא נמצא רישום כניסה פתוח להיום' });
    }

    res.json(record);
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ error: 'שגיאה ביציאה: ' + error.message });
  }
});

app.get('/api/attendance/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'מזהה משתמש נדרש' });
    }

    const record = await Database.getTodayAttendance(parseInt(userId));
    res.json(record || null);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת נתוני נוכחות: ' + error.message });
  }
});

// API Routes for Manual Reports
app.post('/api/reports/manual', async (req, res) => {
  try {
    const { userId, clockIn, clockOut, reason, latitude, longitude } = req.body;
    
    if (!userId || !clockIn || !clockOut || !reason) {
      return res.status(400).json({ error: 'כל השדות נדרשים' });
    }

    const record = await Database.createManualReport(
      parseInt(userId), 
      clockIn, 
      clockOut, 
      reason, 
      latitude, 
      longitude
    );

    res.json(record);
  } catch (error) {
    console.error('Manual report error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת דיווח: ' + error.message });
  }
});

app.get('/api/attendance/logs', async (req, res) => {
  try {
    const { status, isManualEntry, departmentId } = req.query;
    
    const logs = await Database.getAttendanceLogs(
      status || null,
      isManualEntry ? isManualEntry === 'true' : null,
      departmentId ? parseInt(departmentId) : null
    );

    res.json(logs);
  } catch (error) {
    console.error('Get attendance logs error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת דיווחי נוכחות: ' + error.message });
  }
});

app.put('/api/attendance/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ error: 'מזהה וסטטוס נדרשים' });
    }

    const record = await Database.updateAttendanceStatus(
      parseInt(id), 
      status, 
      updatedBy ? parseInt(updatedBy) : null
    );

    if (!record) {
      return res.status(404).json({ error: 'רישום לא נמצא' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס: ' + error.message });
  }
});

// API Routes for Departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Database.getDepartments();
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת מחלקות: ' + error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'שם מחלקה נדרש' });
    }

    const department = await Database.createDepartment(name);
    res.json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת מחלקה: ' + error.message });
  }
});

// Initialize database and server
async function initializeServer() {
  try {
    console.log('🔧 Initializing server...');
    
    // בדיקת חיבור לדטאבייס
    await Database.connect();
    console.log('✅ Database connection successful');
    
    // בדיקת טבלאות
    const tables = await Database.checkTables();
    console.log(`📋 Found ${tables.length} tables in database`);
    
    if (tables.length === 0) {
      console.log('⚠️ No tables found. Please run: node setup-database.js');
    }
    
    // הפעלת השרת
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
      console.log(`🔗 API endpoints available at: /api/*`);
      console.log('✅ Server with PostgreSQL database - ready to use!');
      
      // בדיקה נוספת שהפורט הנכון פועל
      if (PORT !== 5000) {
        console.log(`⚠️ Warning: Expected port 5000 but running on ${PORT}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error.message);
    console.error('💡 Make sure to:');
    console.error('   1. Set up PostgreSQL database in Replit');
    console.error('   2. Add DATABASE_URL to Secrets');
    console.error('   3. Run: node setup-database.js');
    process.exit(1);
  }
}

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Start the server
initializeServer();

module.exports = app;
