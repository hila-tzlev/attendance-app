
const express = require('express');
const cors = require('cors');
const path = require('path');

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// משתמשים זמניים במציאות (לבדיקה)
const tempUsers = [
  {
    id: 1,
    employeeId: '322754672',
    name: 'מנהל ראשי',
    password: '123456',
    isManager: true
  },
  {
    id: 2,
    employeeId: '123456782',
    name: 'עובד לדוגמא',
    password: 'password',
    isManager: false
  }
];

let tempAttendance = [];
let attendanceIdCounter = 1;

// API Routes for Authentication
app.post('/api/auth/login', (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const user = tempUsers.find(u => u.employeeId === employeeId);

    if (!user) {
      return res.status(401).json({ error: 'משתמש לא נמצא' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }

    res.json({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        isManager: user.isManager
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה בהתחברות' });
  }
});

// API Routes for Attendance
app.post('/api/attendance/clock-in', (req, res) => {
  try {
    const { userId, latitude, longitude, isManualEntry, manualReason } = req.body;
    
    const user = tempUsers.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    const record = {
      id: attendanceIdCounter++,
      user_id: parseInt(userId),
      clock_in: new Date().toISOString(),
      clock_out: null,
      status: 'APPROVED',
      is_manual_entry: !!isManualEntry,
      manual_reason: manualReason || null,
      latitude: latitude || null,
      longitude: longitude || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tempAttendance.push(record);
    res.json(record);
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'שגיאה בכניסה' });
  }
});

app.post('/api/attendance/clock-out', (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    
    const today = new Date().toDateString();
    const record = tempAttendance.find(r => 
      r.user_id === parseInt(userId) && 
      new Date(r.clock_in).toDateString() === today &&
      !r.clock_out
    );

    if (!record) {
      return res.status(404).json({ error: 'לא נמצא רישום כניסה להיום' });
    }

    record.clock_out = new Date().toISOString();
    record.updated_at = new Date().toISOString();
    if (latitude) record.latitude = latitude;
    if (longitude) record.longitude = longitude;

    res.json(record);
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ error: 'שגיאה ביציאה' });
  }
});

app.get('/api/attendance/today/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toDateString();
    
    const record = tempAttendance.find(r => 
      r.user_id === parseInt(userId) && 
      new Date(r.clock_in).toDateString() === today
    );

    res.json(record || null);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת נתוני נוכחות' });
  }
});

// API Routes for Manual Reports
app.post('/api/reports/manual', (req, res) => {
  try {
    const { userId, clockIn, clockOut, reason, latitude, longitude } = req.body;
    
    const record = {
      id: attendanceIdCounter++,
      user_id: parseInt(userId),
      clock_in: clockIn,
      clock_out: clockOut,
      status: 'PENDING',
      is_manual_entry: true,
      manual_reason: reason,
      latitude: latitude || null,
      longitude: longitude || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tempAttendance.push(record);
    res.json(record);
  } catch (error) {
    console.error('Manual report error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת דיווח' });
  }
});

app.get('/api/attendance/logs', (req, res) => {
  try {
    const { status, isManualEntry } = req.query;
    
    let filteredLogs = tempAttendance.map(log => {
      const user = tempUsers.find(u => u.id === log.user_id);
      return {
        ...log,
        name: user ? user.name : 'משתמש לא ידוע',
        employee_id: user ? user.employeeId : 'לא ידוע'
      };
    });

    if (status) {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }

    if (isManualEntry !== undefined) {
      const isManual = isManualEntry === 'true';
      filteredLogs = filteredLogs.filter(log => log.is_manual_entry === isManual);
    }

    filteredLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(filteredLogs);
  } catch (error) {
    console.error('Get attendance logs error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת דיווחי נוכחות' });
  }
});

app.put('/api/attendance/status/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const record = tempAttendance.find(r => r.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'רישום לא נמצא' });
    }

    record.status = status;
    record.updated_at = new Date().toISOString();
    
    res.json(record);
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס' });
  }
});

// API Routes for Departments (זמני)
app.get('/api/departments', (req, res) => {
  res.json([
    { id: 1, name: 'מחלקה כללית' },
    { id: 2, name: 'משאבי אנוש' },
    { id: 3, name: 'פיתוח' }
  ]);
});

app.post('/api/departments', (req, res) => {
  const { name } = req.body;
  const newDept = { 
    id: Date.now(), 
    name: name,
    created_at: new Date().toISOString()
  };
  res.json(newDept);
});

// Initialize server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`🔗 API endpoints available at: /api/*`);
  console.log('✅ Simple server without database - ready to use!');
  console.log('📝 Available test users:');
  tempUsers.forEach(user => {
    console.log(`  - ID: ${user.employeeId}, Password: ${user.password}, Manager: ${user.isManager}`);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

module.exports = app;
