
const { Pool } = require('pg');

class Database {
  constructor() {
    // חיבור לדטאבייס PostgreSQL של Replit
    console.log('🔧 Initializing database connection...');
    console.log('🔧 DATABASE_URL present:', !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is missing! Please add it to Secrets.');
    }
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    });
  }

  async connect() {
    try {
      console.log('Attempting to connect to database...');
      console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
      
      const client = await this.pool.connect();
      console.log('Database connected successfully');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection error:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      // יצירת טבלת מחלקות
      await client.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // יצירת טבלת משתמשים מעודכנת
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          employee_id VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_manager BOOLEAN DEFAULT FALSE,
          department_id INTEGER REFERENCES departments(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // יצירת טבלת דיווחי נוכחות מעודכנת
      await client.query(`
        CREATE TABLE IF NOT EXISTS attendance_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          clock_in TIMESTAMP,
          clock_out TIMESTAMP,
          status VARCHAR(20) DEFAULT 'PENDING',
          is_manual_entry BOOLEAN DEFAULT FALSE,
          manual_reason TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by INTEGER REFERENCES users(id)
        )
      `);

      // יצירת trigger לעדכון אוטומטי של updated_at
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS update_attendance_logs_updated_at ON attendance_logs;
        CREATE TRIGGER update_attendance_logs_updated_at
          BEFORE UPDATE ON attendance_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      // הוספת מחלקה ברירת מחדל אם לא קיימת
      await client.query(`
        INSERT INTO departments (name) 
        VALUES ('מחלקה כללית') 
        ON CONFLICT (name) DO NOTHING
      `);

      console.log('✅ Database tables created successfully');
    } finally {
      client.release();
    }
  }

  async createUser(employeeId, name, password, isManager = false, departmentId = 1) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users (employee_id, name, password, is_manager, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [employeeId, name, password, isManager, departmentId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserByEmployeeId(employeeId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.employee_id = $1',
        [employeeId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async clockIn(userId, latitude = null, longitude = null, isManualEntry = false, manualReason = null) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO attendance_logs (user_id, clock_in, latitude, longitude, is_manual_entry, manual_reason, updated_by) 
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $1) RETURNING *`,
        [userId, latitude, longitude, isManualEntry, manualReason]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async clockOut(userId, latitude = null, longitude = null) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE attendance_logs SET 
         clock_out = CURRENT_TIMESTAMP, 
         latitude = COALESCE($2, latitude), 
         longitude = COALESCE($3, longitude),
         updated_by = $1
         WHERE user_id = $1 AND DATE(clock_in) = CURRENT_DATE AND clock_out IS NULL 
         RETURNING *`,
        [userId, latitude, longitude]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getTodayAttendance(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM attendance_logs WHERE user_id = $1 AND DATE(clock_in) = CURRENT_DATE ORDER BY clock_in DESC LIMIT 1',
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async createManualReport(userId, clockIn, clockOut, reason, latitude = null, longitude = null) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO attendance_logs (user_id, clock_in, clock_out, is_manual_entry, manual_reason, latitude, longitude, status, updated_by) 
         VALUES ($1, $2, $3, true, $4, $5, $6, 'PENDING', $1) RETURNING *`,
        [userId, clockIn, clockOut, reason, latitude, longitude]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAttendanceLogs(status = null, isManualEntry = null, departmentId = null) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT al.*, u.name, u.employee_id, d.name as department_name,
               ub.name as updated_by_name
        FROM attendance_logs al 
        JOIN users u ON al.user_id = u.id 
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN users ub ON al.updated_by = ub.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND al.status = $${paramCount}`;
        params.push(status);
      }

      if (isManualEntry !== null) {
        paramCount++;
        query += ` AND al.is_manual_entry = $${paramCount}`;
        params.push(isManualEntry);
      }

      if (departmentId) {
        paramCount++;
        query += ` AND u.department_id = $${paramCount}`;
        params.push(departmentId);
      }

      query += ' ORDER BY al.created_at DESC';

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async updateAttendanceStatus(attendanceId, status, updatedBy) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE attendance_logs SET status = $1, updated_by = $2 WHERE id = $3 RETURNING *',
        [status, updatedBy, attendanceId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getDepartments() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM departments ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createDepartment(name) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO departments (name) VALUES ($1) RETURNING *',
        [name]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // בדיקת טבלאות קיימות
  async checkTables() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log('📋 Existing tables:', result.rows.map(row => row.table_name));
      return result.rows.map(row => row.table_name);
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
      return [];
    } finally {
      client.release();
    }
  }

  // בדיקת נתונים בטבלאות
  async checkTableData() {
    const client = await this.pool.connect();
    try {
      // בדיקת כמות משתמשים
      const usersCount = await client.query('SELECT COUNT(*) FROM users');
      console.log('👥 Users count:', usersCount.rows[0].count);
      
      // בדיקת כמות מחלקות
      const deptCount = await client.query('SELECT COUNT(*) FROM departments');
      console.log('🏢 Departments count:', deptCount.rows[0].count);
      
      // בדיקת כמות דיווחי נוכחות
      const logsCount = await client.query('SELECT COUNT(*) FROM attendance_logs');
      console.log('📊 Attendance logs count:', logsCount.rows[0].count);
      
      // הצגת משתמש הניסיון
      const testUser = await client.query('SELECT * FROM users WHERE employee_id = $1', ['322754672']);
      if (testUser.rows.length > 0) {
        console.log('✅ Test user exists:', testUser.rows[0]);
      } else {
        console.log('❌ Test user not found');
      }
      
    } catch (error) {
      console.error('❌ Error checking table data:', error.message);
    } finally {
      client.release();
    }
  }

  // מחיקת הטבלאות הישנות (אופציונלי - רק אם רוצים להתחיל מחדש)
  async dropOldTables() {
    const client = await this.pool.connect();
    try {
      await client.query('DROP TABLE IF EXISTS manual_reports CASCADE');
      await client.query('DROP TABLE IF EXISTS attendance CASCADE');
      console.log('✅ Old tables dropped successfully');
    } finally {
      client.release();
    }
  }
}

module.exports = new Database();
