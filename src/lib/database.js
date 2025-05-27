const { Pool } = require('pg');

class Database {
  constructor() {
    // חיבור זמני עד להקמת מסד נתונים אמיתי
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      // יצירת טבלת משתמשים
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          employee_id VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_manager BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // יצירת טבלת נוכחות
      await client.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          clock_in TIMESTAMP,
          clock_out TIMESTAMP,
          date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // יצירת טבלת דיווחים ידניים
      await client.query(`
        CREATE TABLE IF NOT EXISTS manual_reports (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          date_in DATE,
          time_in TIME,
          date_out DATE,
          time_out TIME,
          reason TEXT,
          status VARCHAR(20) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Database tables created successfully');
    } finally {
      client.release();
    }
  }

  async createUser(employeeId, name, password, isManager = false) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users (employee_id, name, password, is_manager) VALUES ($1, $2, $3, $4) RETURNING *',
        [employeeId, name, password, isManager]
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
        'SELECT * FROM users WHERE employee_id = $1',
        [employeeId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async clockIn(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO attendance (user_id, clock_in, date) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_DATE) RETURNING *',
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async clockOut(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE attendance SET clock_out = CURRENT_TIMESTAMP WHERE user_id = $1 AND date = CURRENT_DATE AND clock_out IS NULL RETURNING *',
        [userId]
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
        'SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE',
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async createManualReport(userId, dateIn, timeIn, dateOut, timeOut, reason) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO manual_reports (user_id, date_in, time_in, date_out, time_out, reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, dateIn, timeIn, dateOut, timeOut, reason]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getManualReports(status = null) {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT mr.*, u.name, u.employee_id FROM manual_reports mr JOIN users u ON mr.user_id = u.id';
      const params = [];

      if (status) {
        query += ' WHERE mr.status = $1';
        params.push(status);
      }

      query += ' ORDER BY mr.created_at DESC';

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = new Database();